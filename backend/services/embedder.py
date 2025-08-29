import os
from sentence_transformers import SentenceTransformer

HUGGINGFACE_TOKEN = os.getenv("HUGGINGFACE_TOKEN")

# Use 384-dim model to match Qdrant collection config
embedder = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')  # 384 dimensions

def embed_text(text: str) -> list:
    """Returns the embedding for the given text using SentenceTransformer."""
    return embedder.encode(text).tolist()