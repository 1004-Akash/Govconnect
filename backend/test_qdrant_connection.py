# import os
# from dotenv import load_dotenv
# from qdrant_client import QdrantClient
# from qdrant_client.http import models as qdrant_models

# def test_qdrant_connection():
#     """Test script to verify Qdrant connection and basic operations"""

#     print("🔍 Testing Qdrant Connection...")
#     print("=" * 50)

#     # ✅ Always load .env from the backend folder (same as this script)
#     dotenv_path = os.path.join(os.path.dirname(__file__), ".env")
#     load_dotenv(dotenv_path=dotenv_path)

#     QDRANT_HOST = os.getenv("QDRANT_HOST")
#     QDRANT_PORT = os.getenv("QDRANT_PORT")
#     QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")

#     print(f"QDRANT_HOST: {QDRANT_HOST}")
#     print(f"QDRANT_PORT: {QDRANT_PORT}")
#     print(f"QDRANT_API_KEY: {'****' + QDRANT_API_KEY[-4:] if QDRANT_API_KEY else 'None'}")
#     print()

#     print("📡 Attempting to connect to Qdrant...")

#     client = QdrantClient(
#         url=QDRANT_HOST,
#         api_key=QDRANT_API_KEY
#     )

#     print("✅ Successfully connected to Qdrant!")

#     print("\n🧪 Testing basic operations...")
#     print(client.get_collections())


# if __name__ == "__main__":
#     test_qdrant_connection()
from qdrant_client import QdrantClient

client = QdrantClient(
    url="https://ac417bfd-b2ba-4628-a47e-c1bd4483c5c6.europe-west3-0.gcp.cloud.qdrant.io",
    api_key="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.K-EyxRvhmWt9m6Q1iEZARGxrd7CSZQGrgP_fazG9Ryc"
)

# Check collection info
print(client.get_collection("Government"))

# Scroll through all documents
scroll_res = client.scroll(collection_name="Government", limit=5)
print(scroll_res)
