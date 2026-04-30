from dotenv import load_dotenv
from dotenv import load_dotenv
import os
from pinecone import Pinecone, ServerlessSpec

# Load .env
load_dotenv(override=True)

# Required env vars
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_ENV = os.getenv("PINECONE_ENVIRONMENT")  # optional
INDEX_NAME = os.getenv("PINECONE_INDEX")
USE_LOCAL = os.getenv("USE_LOCAL_EMBEDDINGS", "true").lower() in ("1", "true", "yes")

if not PINECONE_API_KEY or not INDEX_NAME:
    raise RuntimeError("Missing PINECONE_API_KEY or PINECONE_INDEX in .env")

# Construct Pinecone client instance using the package's Pinecone class
pc_kwargs = {"api_key": PINECONE_API_KEY}
if PINECONE_ENV:
    pc_kwargs["environment"] = PINECONE_ENV
pc = Pinecone(**pc_kwargs)

USE_LOCAL = os.getenv("USE_LOCAL_EMBEDDINGS", "false").lower() in ("1", "true", "yes")
_local_model = None

def _init_local_model():
    global _local_model
    if _local_model is None:
        from sentence_transformers import SentenceTransformer
        _local_model = SentenceTransformer("all-MiniLM-L6-v2")  # downloads once
    return _local_model

def get_embedding(text: str) -> list:
    # If user requested local embeddings, use them and never call OpenAI
    if USE_LOCAL:
        try:
            model = _init_local_model()
            emb = model.encode(text)
            return list(map(float, emb))
        except Exception as e:
            print(f"Local embedding failed ({type(e).__name__}): {e}. Using deterministic fallback.")
            # deterministic fallback (keeps previous fallback behavior)
    else:
        # prefer OpenAI, but fall back to local or deterministic if it fails
        try:
            resp = client.embeddings.create(model="text-embedding-3-small", input=text)
            return resp.data[0].embedding
        except Exception as ex:
            print(f"OpenAI embedding failed ({type(ex).__name__}): {ex}")

            # try local if available
            try:
                model = _init_local_model()
                emb = model.encode(text)
                return list(map(float, emb))
            except Exception as e:
                print(f"Local embedding also failed ({type(e).__name__}): {e}. Using deterministic fallback.")

    # Deterministic fallback (same as before)
    import hashlib, random
    h = hashlib.sha256(text.encode("utf-8")).digest()
    seed = int.from_bytes(h[:8], "big")
    rnd = random.Random(seed)
    return [rnd.random() * 2.0 - 1.0 for _ in range(1536)]


# Documents to upsert
docs = [
    {"id": "vec1", "text": "Apple is a popular fruit known for its sweetness and crisp texture."},
    {"id": "vec2", "text": "The tech company Apple is known for its innovative products like the iPhone."},
    {"id": "vec3", "text": "Many people enjoy eating apples as a healthy snack."},
]

# Compute embeddings first so we can create an index with the correct dimension
embeddings = {}
for doc in docs:
    embeddings[doc["id"]] = get_embedding(doc["text"])

# determine vector dimension
first_vec = next(iter(embeddings.values()))
vector_dim = len(first_vec)

# list_indexes return shape can vary
existing = pc.list_indexes()
try:
    names = existing.names()
except Exception:
    try:
        names = list(existing)
    except Exception:
        names = []

if INDEX_NAME in names:
    # check existing index dimension, delete and recreate if mismatched
    try:
        desc = pc.describe_index(INDEX_NAME)
        existing_dim = None
        # try common access patterns
        if hasattr(desc, "dimension"):
            existing_dim = desc.dimension
        elif isinstance(desc, dict) and "dimension" in desc:
            existing_dim = desc["dimension"]
        if existing_dim is not None and existing_dim != vector_dim:
            print(f"Index '{INDEX_NAME}' exists with dimension {existing_dim}, required {vector_dim}. Recreating index.")
            pc.delete_index(INDEX_NAME)
            names.remove(INDEX_NAME)
    except Exception:
        # unable to describe index; proceed to recreate if upsert fails later
        pass

if INDEX_NAME not in names:
    # try creating with a ServerlessSpec if supported
    try:
        spec = ServerlessSpec(cloud="aws", region="us-east-1")
        pc.create_index(name=INDEX_NAME, dimension=vector_dim, metric="cosine", spec=spec)
    except TypeError:
        pc.create_index(name=INDEX_NAME, dimension=vector_dim, metric="cosine")

# Try to get an index handle
index_handle = None
for getter in ("Index", "index", "get_index"):
    fn = getattr(pc, getter, None)
    if callable(fn):
        try:
            index_handle = fn(INDEX_NAME)
            break
        except TypeError:
            try:
                index_handle = fn(name=INDEX_NAME)
                break
            except Exception:
                continue

# Build upsert payload using precomputed embeddings
upserts = []
for doc in docs:
    vec = embeddings[doc["id"]]
    upserts.append((doc["id"], vec, {"text": doc["text"]}))

# Upsert using index handle if available, else use client-level upsert
if index_handle is not None and hasattr(index_handle, "upsert"):
    index_handle.upsert(vectors=upserts)
else:
    client_upsert = getattr(pc, "upsert", None)
    if callable(client_upsert):
        try:
            client_upsert(index_name=INDEX_NAME, vectors=upserts)
        except TypeError:
            client_upsert(INDEX_NAME, upserts)
    else:
        raise RuntimeError("No upsert method available on Pinecone client/index")

print("Data stored in Pinecone successfully.")