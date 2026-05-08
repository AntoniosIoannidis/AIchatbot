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
DATA_DIR = "data"

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
            model="models/gemini-embedding-2",
            contents=text,
            config=genai.types.EmbedContentConfig(task_type="RETRIEVAL_DOCUMENT")
        )
        return res.embeddings[0].values
    except Exception as e:
        logger.error(f"Error generating embedding for text '{text[:50]}...': {e}")
        return []

def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
    """Splits long text into smaller overlapping chunks."""
    words = text.split()
    if not words: return []
    chunks = []
    for i in range(0, len(words), chunk_size - overlap):
        chunks.append(" ".join(words[i : i + chunk_size]))
    return chunks

def setup_index(dimension: int):
    """Ensures the Pinecone index exists with the correct dimensions."""
    existing = pc.list_indexes().names()
    if PINECONE_INDEX_NAME not in existing:
        logger.info(f"Creating index {PINECONE_INDEX_NAME} (Dim: {dimension})...")
        pc.create_index(
            name=PINECONE_INDEX_NAME,
            dimension=dimension,
            metric="cosine",
            spec=ServerlessSpec(cloud="aws", region="us-east-1")
        )
    return pc.Index(PINECONE_INDEX_NAME)

def process_files():
    """Processes all TXT and MD files in the data directory."""
    if not os.path.exists(DATA_DIR):
        os.makedirs(DATA_DIR)
        logger.info(f"Created '{DATA_DIR}' directory. Please add your .txt or .md files there.")
        return

    all_upserts = []
    files_to_process = [f for f in os.listdir(DATA_DIR) if f.lower().endswith((".txt", ".md"))]
    
    if not files_to_process:
        logger.warning(f"No .txt or .md files found in {DATA_DIR}.")
        return

    for filename in files_to_process:
        file_path = os.path.join(DATA_DIR, filename)
        logger.info(f"Processing: {filename}...")
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
        except Exception as e:
            logger.error(f"Failed to read {filename}: {e}")
            continue
        
        if not content.strip(): continue
        
        chunks = chunk_text(content)
        logger.info(f"Split {filename} into {len(chunks)} chunks.")
        
        for i, chunk in enumerate(chunks):
            vector = get_google_embedding(chunk)
            if not vector: continue
            all_upserts.append((
                f"{filename}_{i}_{uuid.uuid4().hex[:6]}", 
                vector, 
                {"text": chunk, "source": filename}
            ))

    if all_upserts:
        index = setup_index(len(all_upserts[0][1]))
        logger.info(f"Upserting {len(all_upserts)} vectors to Pinecone...")
        # Batch upsert for efficiency
        for i in range(0, len(all_upserts), 100):
            index.upsert(vectors=all_upserts[i : i + 100])
        logger.info("Successfully ingested all data with Google Embeddings.")
    else:
        logger.warning("No valid text found to process.")

if __name__ == "__main__":
    process_files()
