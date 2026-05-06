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

from google import genai
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
    # New Google GenAI Client
    client = genai.Client(api_key=GEMINI_API_KEY)
    pc = Pinecone(api_key=PINECONE_API_KEY)
    index = pc.Index(PINECONE_INDEX_NAME)
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
except Exception as e:
    logger.error(f"Error initializing external services: {e}")

# FastAPI App
app = FastAPI(title="AI Chatbot Backend", version="1.4.0")

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
        token = authorization.split(" ")[1]
        user_resp = supabase.auth.get_user(token)
        return user_resp.user
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

# Helper Functions
def get_embedding(text: str) -> List[float]:
    """Uses new Google GenAI Embedding API."""
    try:
        result = client.models.embed_content(
            model="text-embedding-004",
            contents=text,
            config=genai.types.EmbedContentConfig(task_type="RETRIEVAL_QUERY")
        )
        return result.embeddings[0].values
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
        # 1. Fetch short-term memory
        history_resp = supabase.table("chat_history") \
            .select("user_message, ai_response") \
            .eq("user_id", user_id) \
            .order("created_at", desc=True) \
            .limit(5) \
            .execute()
        
        history_items = history_resp.data[::-1]
        
        context_str = "\n".join([f"- {c}" for c in contexts])
        history_str = "\n".join([f"User: {h['user_message']}\nAI: {h['ai_response']}" for h in history_items])
        
        prompt = f"You are a helpful AI assistant. Use the context and history.\n\nCONTEXT:\n{context_str}\n\nHISTORY:\n{history_str}\n\nUser Question: {question}"
        
        # 2. Build multi-modal request
        contents = [prompt]
        if image_data:
            if "," in image_data:
                image_data = image_data.split(",")[1]
            contents.append(genai.types.Part.from_bytes(data=base64.b64decode(image_data), mime_type="image/jpeg"))

        # 3. Stream
        response = client.models.generate_content_stream(
            model="gemini-1.5-flash",
            contents=contents
        )
        
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
        except Exception:
            pass
            
    except Exception as e:
        logger.error(f"Stream error: {e}")
        yield f"data: {json.dumps({'error': str(e)})}\n\n"

# Endpoints
@app.post("/api/chat")
async def chat_stream(request: ChatRequest, user = Depends(get_current_user)):
    query_vec = get_embedding(request.message)
    contexts = retrieve_context(query_vec)
    return StreamingResponse(
        stream_gemini_response(request.message, contexts, user.id, request.image_data),
        media_type="text/event-stream"
    )

@app.post("/api/scrape")
async def scrape_url(request: ScrapeRequest, user = Depends(get_current_user)):
    try:
        resp = requests.get(request.url, timeout=10)
        soup = BeautifulSoup(resp.text, 'html.parser')
        for script in soup(["script", "style"]): script.decompose()
        text = soup.get_text(separator=' ', strip=True)
        words = text.split()
        chunks = [" ".join(words[i:i+500]) for i in range(0, len(words), 450)]
        
        all_upserts = []
        for chunk in chunks:
            res = client.models.embed_content(
                model="text-embedding-004",
                contents=chunk,
                config=genai.types.EmbedContentConfig(task_type="RETRIEVAL_DOCUMENT")
            )
            all_upserts.append((f"scrape_{uuid.uuid4().hex[:8]}", res.embeddings[0].values, {"text": chunk, "source": request.url}))
            
        index.upsert(vectors=all_upserts)
        return {"status": "success", "chunks": len(chunks)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/history")
async def get_history(user = Depends(get_current_user)):
    resp = supabase.table("chat_history").select("*").eq("user_id", user.id).order("created_at", desc=True).execute()
    return {"history": resp.data}

@app.get("/api/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
