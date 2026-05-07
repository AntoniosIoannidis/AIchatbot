import os
import uuid
import logging
from typing import List
from dotenv import load_dotenv

from google import genai
from pinecone import Pinecone, ServerlessSpec

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

# Load configuration
load_dotenv(override=True)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX")

if not all([GEMINI_API_KEY, PINECONE_API_KEY, PINECONE_INDEX_NAME]):
    raise RuntimeError("Missing configuration in .env. Ensure GEMINI_API_KEY, PINECONE_API_KEY, and PINECONE_INDEX are set.")

# Initialize Clients
try:
    client = genai.Client(api_key=GEMINI_API_KEY)
    pc = Pinecone(api_key=PINECONE_API_KEY)
except Exception as e:
    logger.error(f"Initialization error: {e}")
    exit(1)

def get_google_embedding(text: str) -> List[float]:
    """Uses Google GenAI Embedding API (768 dimensions)."""
    try:
        res = client.models.embed_content(
            model="text-embedding-004",
            contents=text,
            config=genai.types.EmbedContentConfig(task_type="RETRIEVAL_DOCUMENT")
        )
        return res.embeddings[0].values
    except Exception as e:
        logger.error(f"Error generating embedding: {e}")
        return []

def setup_index(dimension: int):
    existing = pc.list_indexes().names()
    if PINECONE_INDEX_NAME not in existing:
        logger.info(f"Creating index {PINECONE_INDEX_NAME}...")
        pc.create_index(
            name=PINECONE_INDEX_NAME,
            dimension=dimension,
            metric="cosine",
            spec=ServerlessSpec(cloud="aws", region="us-east-1")
        )
    return pc.Index(PINECONE_INDEX_NAME)

def insert_sample_data():
    """Inserts high-quality sample data to get started."""
    docs = [
        {"text": "This AI Chatbot is built using React, FastAPI, Pinecone, and Google Gemini.", "source": "system"},
        {"text": "You can generate images by asking the bot to 'generate' or 'create' something visual.", "source": "manual"},
        {"text": "The knowledge base is stored in Pinecone as vector embeddings for fast retrieval.", "source": "architecture"},
    ]

    all_upserts = []
    for doc in docs:
        vector = get_google_embedding(doc["text"])
        if not vector: continue
        all_upserts.append((f"manual_{uuid.uuid4().hex[:8]}", vector, {"text": doc["text"], "source": doc["source"]}))

    if all_upserts:
        index = setup_index(len(all_upserts[0][1]))
        logger.info(f"Upserting {len(all_upserts)} vectors...")
        index.upsert(vectors=all_upserts)
        logger.info("Sample data inserted successfully.")
    else:
        logger.warning("No data to insert.")

if __name__ == "__main__":
    insert_sample_data()
