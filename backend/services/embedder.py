import os
import numpy as np

try:
    from sentence_transformers import SentenceTransformer
    # Use 384-dim model to match Qdrant collection config
    embedder = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')  # 384 dimensions
    print("SentenceTransformer embedder loaded successfully.")
except Exception as e:
    print(f"FAILED to load SentenceTransformer: {e}. Using dummy random vectors.")
    embedder = None

def embed_text(text: str) -> list:
    """Returns the embedding for the given text. Falls back to random if embedder failed."""
    if embedder:
        try:
            return embedder.encode(text).tolist()
        except Exception as e:
            print(f"Embedding error: {e}")
            
    # Dummy embedding (384 dimensions to avoid breaking Qdrant/Client constraints)
    return np.random.rand(384).tolist()