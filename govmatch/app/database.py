import motor.motor_asyncio
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase, AsyncIOMotorGridFSBucket
from app.config import settings


class MongoDB:
    client: AsyncIOMotorClient = None
    database: AsyncIOMotorDatabase = None
    gridfs_bucket: AsyncIOMotorGridFSBucket = None


db = MongoDB()


def _lazy_connect_if_needed():
    """Ensure Mongo connection exists (used when mounted app startup hooks didn't run)."""
    if db.database is None or db.client is None or db.gridfs_bucket is None:
        db.client = AsyncIOMotorClient(settings.mongodb_uri)
        db.database = db.client[settings.mongodb_db]
        db.gridfs_bucket = AsyncIOMotorGridFSBucket(db.database, bucket_name="schemes")


async def connect_to_mongo():
    """Create database connection"""
    _lazy_connect_if_needed()


async def close_mongo_connection():
    """Close database connection"""
    if db.client:
        db.client.close()


def get_database() -> AsyncIOMotorDatabase:
    _lazy_connect_if_needed()
    return db.database


def get_gridfs_bucket() -> AsyncIOMotorGridFSBucket:
    _lazy_connect_if_needed()
    return db.gridfs_bucket
