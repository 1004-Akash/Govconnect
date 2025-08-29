import os
from pymongo import MongoClient, ASCENDING
from dotenv import load_dotenv
import certifi

# Load .env if present
load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb+srv://ajey12c3001:NoufmpJk0GG99kR4@governmentai.dgxynkw.mongodb.net/")
DB_NAME = os.getenv("MONGO_DB", "GovernmentAI")

_client = None
_db = None


def get_client() -> MongoClient:
    global _client
    if _client is None:
        _client = MongoClient(MONGO_URI, tlsCAFile=certifi.where())
    return _client


def get_db():
    global _db
    if _db is None:
        _db = get_client()[DB_NAME]
    return _db


def ensure_indexes():
    try:
        db = get_db()
        db.reactions.create_index([("news_link", ASCENDING)])
        db.reactions.create_index([("reaction_type", ASCENDING)])
        db.reactions.create_index([("timestamp", ASCENDING)])
    except Exception:
        # Index creation is best-effort; failures should not crash app startup
        pass


def get_collection(name: str):
    return get_db()[name]
