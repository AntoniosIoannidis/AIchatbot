import os
import uuid
import logging
from typing import List
from dotenv import load_dotenv

from google import genai
from pinecone import Pinecone

# Try to import pypdf for PDF support
try:
    from pypdf import PdfReader
    PDF_SUPPORT = True
except ImportError:
    PDF_SUPPORT = False

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
    index = pc.Index(PINECONE_INDEX_NAME)
except Exception as e:
    logger.error(f"Initialization error: {e}")

def get_google_embedding(text: str) -> List[float]:
    """Uses new Google GenAI Embedding API (768 dimensions)."""
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

def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
    """Splits long text into smaller overlapping chunks."""
    words = text.split()
    if not words: return []
    chunks = []
    for i in range(0, len(words), chunk_size - overlap):
        chunks.append(" ".join(words[i : i + chunk_size]))
    return chunks

def extract_text_from_pdf(file_path: str) -> str:
    """Extracts all text from a PDF file."""
    if not PDF_SUPPORT: return ""
    try:
        reader = PdfReader(file_path)
        text = ""
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text: text += page_text + "\n"
        return text
    except Exception as e:
        logger.error(f"Error reading PDF {file_path}: {e}")
        return ""

def process_files():
    """Processes TXT and PDF files using Google Cloud Embeddings."""
    if not os.path.exists(DATA_DIR):
        os.makedirs(DATA_DIR)
        logger.info(f"Created '{DATA_DIR}' directory.")
        return

    all_upserts = []
    for filename in os.listdir(DATA_DIR):
        file_path = os.path.join(DATA_DIR, filename)
        content = ""
        if filename.lower().endswith(".txt"):
            logger.info(f"Processing TXT: {filename}...")
            with open(file_path, "r", encoding="utf-8") as f: content = f.read()
        elif filename.lower().endswith(".pdf"):
            logger.info(f"Processing PDF: {filename}...")
            content = extract_text_from_pdf(file_path)
        
        if not content.strip(): continue
        
        chunks = chunk_text(content)
        logger.info(f"Split {filename} into {len(chunks)} chunks.")
        
        for i, chunk in enumerate(chunks):
            vector = get_google_embedding(chunk)
            if not vector: continue
            all_upserts.append((f"{filename}_{i}_{uuid.uuid4().hex[:6]}", vector, {"text": chunk, "source": filename}))

    if all_upserts:
        logger.info(f"Upserting {len(all_upserts)} vectors to Pinecone...")
        for i in range(0, len(all_upserts), 100):
            index.upsert(vectors=all_upserts[i : i + 100])
        logger.info("Successfully ingested all data with Google Cloud Embeddings.")
    else:
        logger.warning("No valid text found to process.")

if __name__ == "__main__":
    process_files()
