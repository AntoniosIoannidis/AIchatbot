import importlib
import json
import pinecone

def show(attr):
    val = getattr(pinecone, attr, None)
    try:
        typ = type(val).__name__
    except Exception:
        typ = str(val)
    return {"name": attr, "present": val is not None, "type": typ, "repr": repr(val)[:200]}

public = sorted(n for n in dir(pinecone) if not n.startswith("_"))
candidates = ["init", "Client", "PineconeClient", "ClientCtor", "Index", "create_index", "createIndex", "upsert", "IndexClient"]
info = {"module": getattr(pinecone, "__name__", str(pinecone)), "public": public, "candidates": [show(c) for c in candidates]}
print(json.dumps(info, indent=2))
print(model.get_sentence_embedding_dimension())