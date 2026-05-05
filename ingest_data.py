import os
import uuid
import logging
from typing import List
from dotenv import load_dotenv

from pinecone import Pinecone
from sentence_transformers import SentenceTransformer

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

PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX")
DATA_DIR = "data"

if not PINECONE_API_KEY or not PINECONE_INDEX_NAME:
    raise RuntimeError("Missing Pinecone configuration in .env")

# Initialize Pinecone
pc = Pinecone(api_key=PINECONE_API_KEY)
index = pc.Index(PINECONE_INDEX_NAME)

# Load Embedding Model
logger.info("Loading embedding model...")
model = SentenceTransformer("all-MiniLM-L6-v2")

def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
    """Splits long text into smaller overlapping chunks."""
    words = text.split()
    if not words:
        return []
    chunks = []
    for i in range(0, len(words), chunk_size - overlap):
        chunk = " ".join(words[i : i + chunk_size])
        chunks.append(chunk)
    return chunks

def extract_text_from_pdf(file_path: str) -> str:
    """Extracts all text from a PDF file."""
    if not PDF_SUPPORT:
        logger.error("pypdf library not found. Cannot process PDFs. Run 'pip install pypdf'.")
        return ""
    
    try:
        reader = PdfReader(file_path)
        text = ""
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
        return text
    except Exception as e:
        logger.error(f"Error reading PDF {file_path}: {e}")
        return ""

def process_files():
    """Processes TXT and PDF files in the data directory."""
    if not os.path.exists(DATA_DIR):
        os.makedirs(DATA_DIR)
        logger.info(f"Created '{DATA_DIR}' directory. Put your files there and run again.")
        return

    all_upserts = []
    
    for filename in os.listdir(DATA_DIR):
        file_path = os.path.join(DATA_DIR, filename)
        content = ""
        
        if filename.lower().endswith(".txt"):
            logger.info(f"Processing TXT: {filename}...")
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
        
        elif filename.lower().endswith(".pdf"):
            logger.info(f"Processing PDF: {filename}...")
            content = extract_text_from_pdf(file_path)
        
        if not content.strip():
            continue
            
        # 1. Chunking
        chunks = chunk_text(content)
        logger.info(f"Split {filename} into {len(chunks)} chunks.")
        
        # 2. Embedding & Preparation
        for i, chunk in enumerate(chunks):
            chunk_id = f"{filename}_{i}_{uuid.uuid4().hex[:6]}"
            vector = model.encode(chunk).tolist()
            metadata = {
                "text": chunk,
                "source": filename,
                "chunk_index": i
            }
            all_upserts.append((chunk_id, vector, metadata))

    # 3. Batch Upsert to Pinecone
    if all_upserts:
        logger.info(f"Upserting {len(all_upserts)} vectors to Pinecone...")
        # Upsert in batches of 100 to avoid payload size limits
        for i in range(0, len(all_upserts), 100):
            batch = all_upserts[i : i + 100]
            index.upsert(vectors=batch)
        logger.info("Successfully ingested all data.")
    else:
        logger.warning("No valid text found in files to process.")

if __name__ == "__main__":
    process_files()
