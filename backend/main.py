import os
import logging
from typing import List, Optional

from fastapi import FastAPI, Depends, HTTPException, Header, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

import google.generativeai as genai
from pinecone import Pinecone
from sentence_transformers import SentenceTransformer
from supabase import create_client, Client

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

if not all([GEMINI_API_KEY, PINECONE_API_KEY, PINECONE_INDEX_NAME, SUPABASE_URL, SUPABASE_KEY]):
    missing = [k for k, v in {
        "GEMINI_API_KEY": GEMINI_API_KEY,
        "PINECONE_API_KEY": PINECONE_API_KEY,
        "PINECONE_INDEX": PINECONE_INDEX_NAME,
        "SUPABASE_URL": SUPABASE_URL,
        "SUPABASE_KEY": SUPABASE_KEY
    }.items() if not v]
    logger.error(f"Missing environment variables: {', '.join(missing)}")
    # We don't raise RuntimeError here to allow the app to start and show a 500 on request
    # but in a production senior-level code, we might want to fail fast.

# Initialize Clients
try:
    genai.configure(api_key=GEMINI_API_KEY)
    pc = Pinecone(api_key=PINECONE_API_KEY)
    index = pc.Index(PINECONE_INDEX_NAME)
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
except Exception as e:
    logger.error(f"Error initializing external services: {e}")

# Global state for lazy-loading the embedding model
_embedding_model = None

def get_embedding_model():
    global _embedding_model
    if _embedding_model is None:
        logger.info("Loading SentenceTransformer model...")
        _embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
    return _embedding_model

# FastAPI App
app = FastAPI(title="AI Chatbot Backend", version="1.0.0")

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    answer: str
    context: List[str]

# Security Dependency
async def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header",
        )
    
    try:
        # Expecting "Bearer <token>"
        token = authorization.split(" ")[1]
        user_resp = supabase.auth.get_user(token)
        return user_resp.user
    except Exception as e:
        logger.error(f"Auth error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

# Helper Functions
def get_embedding(text: str) -> List[float]:
    model = get_embedding_model()
    emb = model.encode(text)
    return [float(x) for x in emb]

def retrieve_context(query_vector: List[float], top_k: int = 3) -> List[str]:
    try:
        results = index.query(vector=query_vector, top_k=top_k, include_metadata=True)
        contexts = [match.metadata["text"] for match in results.matches if "text" in match.metadata]
        return contexts
    except Exception as e:
        logger.error(f"Pinecone query error: {e}")
        return []

def generate_answer(question: str, contexts: List[str]) -> str:
    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        
        context_str = "\n".join([f"- {c}" for c in contexts])
        prompt = f"""You are a helpful AI assistant. Use the provided context to answer the user's question. 
If the answer isn't in the context, use your general knowledge but mention that it's not in the provided documents.

Context:
{context_str}

User Question: {question}
"""
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        logger.error(f"Gemini generation error: {e}")
        return "I'm sorry, I'm having trouble generating a response right now."

# Endpoints
@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, user = Depends(get_current_user)):
    logger.info(f"Chat request from user: {user.id}")
    
    # 1. Embed query
    query_vec = get_embedding(request.message)
    
    # 2. Retrieve context
    contexts = retrieve_context(query_vec)
    
    # 3. Generate answer
    answer = generate_answer(request.message, contexts)
    
    return ChatResponse(answer=answer, context=contexts)

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
