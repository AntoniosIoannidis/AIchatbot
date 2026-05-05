import os
import logging
import json
import uuid
import base64
from typing import List, Optional

from fastapi import FastAPI, Depends, HTTPException, Header, status
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

import google.generativeai as genai
from pinecone import Pinecone
from supabase import create_client, Client
import requests
from bs4 import BeautifulSoup

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv(override=True)

# Configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Initialize Clients
try:
    genai.configure(api_key=GEMINI_API_KEY)
    pc = Pinecone(api_key=PINECONE_API_KEY)
    index = pc.Index(PINECONE_INDEX_NAME)
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
except Exception as e:
    logger.error(f"Error initializing external services: {e}")

# FastAPI App
app = FastAPI(title="AI Chatbot Backend", version="1.3.0")

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class ChatRequest(BaseModel):
    message: str
    image_data: Optional[str] = None

class ScrapeRequest(BaseModel):
    url: str

# Security Dependency
async def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    try:
        # Expecting "Bearer <token>"
        token = authorization.split(" ")[1]
        user_resp = supabase.auth.get_user(token)
        return user_resp.user
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

# Helper Functions
def get_embedding(text: str) -> List[float]:
    """Uses Google's Cloud Embedding API (Vercel-friendly, 768 dimensions)."""
    try:
        result = genai.embed_content(
            model="models/text-embedding-004",
            content=text,
            task_type="retrieval_query"
        )
        return result['embedding']
    except Exception as e:
        logger.error(f"Google Embedding error: {e}")
        raise HTTPException(status_code=500, detail="Embedding generation failed")

def retrieve_context(query_vector: List[float], top_k: int = 3) -> List[str]:
    try:
        results = index.query(vector=query_vector, top_k=top_k, include_metadata=True)
        return [match.metadata["text"] for match in results.matches if "text" in match.metadata]
    except Exception as e:
        logger.error(f"Pinecone query error: {e}")
        return []

async def stream_gemini_response(question: str, contexts: List[str], user_id: str, image_data: Optional[str] = None):
    full_response = ""
    try:
        # 1. Fetch short-term memory (last 5 messages)
        history_resp = supabase.table("chat_history") \
            .select("user_message, ai_response") \
            .eq("user_id", user_id) \
            .order("created_at", desc=True) \
            .limit(5) \
            .execute()
        
        history_items = history_resp.data[::-1] # Reverse for chronological order
        
        # 2. Build Multi-modal Prompt
        model = genai.GenerativeModel("gemini-1.5-flash")
        
        system_instruction = "You are a helpful AI assistant. Use the provided context and conversation history to answer."
        context_str = "\n".join([f"- {c}" for c in contexts])
        history_str = "\n".join([f"User: {h['user_message']}\nAI: {h['ai_response']}" for h in history_items])
        
        content_parts = [
            f"{system_instruction}\n\nRELEVANT CONTEXT:\n{context_str}\n\nCONVERSATION HISTORY:\n{history_str}\n\nUser Question: {question}"
        ]
        
        # 3. Add Image if provided
        if image_data:
            if "," in image_data:
                image_data = image_data.split(",")[1]
            image_bytes = base64.b64decode(image_data)
            content_parts.append({"mime_type": "image/jpeg", "data": image_bytes})
        
        response = model.generate_content(content_parts, stream=True)
        
        for chunk in response:
            if chunk.text:
                full_response += chunk.text
                yield f"data: {json.dumps({'text': chunk.text})}\n\n"
        
        # 4. Save to history
        try:
            supabase.table("chat_history").insert({
                "user_id": user_id,
                "user_message": question,
                "ai_response": full_response,
                "context_used": contexts
            }).execute()
        except Exception as e:
            logger.error(f"History save error: {e}")
            
    except Exception as e:
        logger.error(f"Stream error: {e}")
        yield f"data: {json.dumps({'error': str(e)})}\n\n"

# Endpoints
@app.post("/api/chat")
async def chat_stream(request: ChatRequest, user = Depends(get_current_user)):
    # 1. Get embedding (now 768 dims)
    query_vec = get_embedding(request.message)
    
    # 2. Retrieve context
    contexts = retrieve_context(query_vec)
    
    # 3. Stream response
    return StreamingResponse(
        stream_gemini_response(request.message, contexts, user.id, request.image_data),
        media_type="text/event-stream"
    )

@app.post("/api/scrape")
async def scrape_url(request: ScrapeRequest, user = Depends(get_current_user)):
    try:
        resp = requests.get(request.url, timeout=10)
        soup = BeautifulSoup(resp.text, 'html.parser')
        for script in soup(["script", "style"]):
            script.decompose()
        text = soup.get_text(separator=' ', strip=True)
        
        words = text.split()
        chunks = [" ".join(words[i:i+500]) for i in range(0, len(words), 450)]
        
        all_upserts = []
        for i, chunk in enumerate(chunks):
            # Using Google Cloud Embeddings for scraping
            res = genai.embed_content(model="models/text-embedding-004", content=chunk, task_type="retrieval_document")
            vec = res['embedding']
            all_upserts.append((f"scrape_{uuid.uuid4().hex[:8]}", vec, {"text": chunk, "source": request.url}))
            
        index.upsert(vectors=all_upserts)
        return {"status": "success", "chunks": len(chunks)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/history")
async def get_history(user = Depends(get_current_user)):
    try:
        resp = supabase.table("chat_history").select("*").eq("user_id", user.id).order("created_at", desc=True).execute()
        return {"history": resp.data}
    except Exception as e:
        logger.error(f"History fetch error: {e}")
        return {"history": []}

@app.get("/api/health")
async def health():
    return {"status": "healthy"}

# Local development entry point
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
