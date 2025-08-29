import os
import uuid
from pathlib import Path
from dotenv import load_dotenv
from qdrant_client import QdrantClient
from qdrant_client.http import models as qdrant_models

# ✅ Load environment variables from ../.env
BASE_DIR = Path(__file__).resolve().parent.parent
env_path = BASE_DIR / ".env"
load_dotenv(dotenv_path=env_path)

# Set default values for Qdrant connection
QDRANT_HOST = os.getenv("QDRANT_HOST", "http://localhost")
QDRANT_PORT = os.getenv("QDRANT_PORT")  # Not needed for cloud
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")

COLLECTION_NAME = "Government"

# Initialize Qdrant client with error handling
qdrant_client = None
try:
    if QDRANT_API_KEY:  # Cloud instance
        qdrant_client = QdrantClient(
            url=QDRANT_HOST,
            api_key=QDRANT_API_KEY
        )
    else:  # Local instance
        qdrant_client = QdrantClient(
            url=QDRANT_HOST,
            port=int(QDRANT_PORT) if QDRANT_PORT else 6333
        )

    # Ensure collection exists with correct dim
    TARGET_DIM = 384  # must match your embedder

    def _ensure_collection():
        try:
            coll = qdrant_client.get_collection(COLLECTION_NAME)
            current_dim = coll.vectors_count or coll.config.params.vectors.size  # handles SDK variants
            if current_dim != TARGET_DIM:
                qdrant_client.recreate_collection(
                    collection_name=COLLECTION_NAME,
                    vectors_config=qdrant_models.VectorParams(size=TARGET_DIM, distance="Cosine")
                )
        except Exception:
            qdrant_client.recreate_collection(
                collection_name=COLLECTION_NAME,
                vectors_config=qdrant_models.VectorParams(size=TARGET_DIM, distance="Cosine")
            )

    _ensure_collection()

    # Ensure payload indexes used by filters/search
    def _ensure_indexes():
        # Index for filtering by dataset id
        try:
            qdrant_client.create_payload_index(
                collection_name=COLLECTION_NAME,
                field_name="reference_id",
                field_schema=qdrant_models.PayloadSchemaType.KEYWORD,
            )
        except Exception:
            pass  # already exists or created by schema

        # Optional: index title for quick filters
        try:
            qdrant_client.create_payload_index(
                collection_name=COLLECTION_NAME,
                field_name="title",
                field_schema=qdrant_models.PayloadSchemaType.KEYWORD,
            )
        except Exception:
            pass

        # Optional: index chunk_index for range filters
        try:
            qdrant_client.create_payload_index(
                collection_name=COLLECTION_NAME,
                field_name="chunk_index",
                field_schema=qdrant_models.PayloadSchemaType.INTEGER,
            )
        except Exception:
            pass

    _ensure_indexes()

except Exception as e:
    print(f"⚠️ Warning: Could not connect to Qdrant: {e}")
    print("Vector database operations will not be available until Qdrant is running")

def store_embedding(embedding: list, metadata: dict):
    """Stores embedding in Qdrant with metadata and text."""
    if not qdrant_client:
        raise RuntimeError("Qdrant client is not initialized")

    payload = metadata.copy()
    if "text" in metadata:
        payload["text"] = metadata["text"]

    print(f"[DEBUG] Storing embedding for text: {payload.get('text', '')[:80]}... (dim={len(embedding)})")
    qdrant_client.upsert(
        collection_name=COLLECTION_NAME,
        points=[
            qdrant_models.PointStruct(
                id=str(uuid.uuid4()),
                vector=embedding,
                payload=payload
            )
        ]
    )
    print(f"[DEBUG] Embedding stored in Qdrant for title: {payload.get('title', 'N/A')}, reference_id: {payload.get('reference_id', 'N/A')}")

def search_embeddings(query_embedding: list, top_k: int = 5, reference_id: str = None) -> list:
    """Searches Qdrant for similar embeddings and returns results with text and metadata."""
    if not qdrant_client:
        raise RuntimeError("Qdrant client is not initialized")

    print(f"[DEBUG] Searching Qdrant for query embedding (dim={len(query_embedding)})...")
    query_filter = None
    if reference_id:
        try:
            query_filter = qdrant_models.Filter(should=[
                qdrant_models.FieldCondition(key="reference_id", match=qdrant_models.MatchValue(value=reference_id))
            ])
            print(f"[DEBUG] Applying reference_id filter: {reference_id}")
        except Exception as e:
            print(f"[DEBUG] Failed to construct filter for reference_id={reference_id}: {e}")

    hits = qdrant_client.search(
        collection_name=COLLECTION_NAME,
        query_vector=query_embedding,
        query_filter=query_filter,
        limit=top_k
    )
    print(f"[DEBUG] Qdrant returned {len(hits)} hits.")
    results = []
    for hit in hits:
        payload = hit.payload or {}
        payload["score"] = hit.score
        print(f"[DEBUG] Hit score: {hit.score}, text: {payload.get('text', '')[:80]}...")
        results.append(payload)
    return results