"""
Async MongoDB connection using Motor driver.
Handles all database operations for the system.
"""
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.core.config import MONGODB_DB, MONGODB_URL

client: AsyncIOMotorClient = None
db: AsyncIOMotorDatabase = None


async def connect_to_mongo():
    """Initialize async MongoDB connection."""
    global client, db
    try:
        client = AsyncIOMotorClient(MONGODB_URL)
        db = client[MONGODB_DB]
        await client.admin.command("ping")
        print(f"Connected to MongoDB: {MONGODB_DB}")
    except Exception as exc:
        print(f"MongoDB connection failed: {exc}")
        raise


async def close_mongo_connection():
    """Close MongoDB connection."""
    global client, db
    if client:
        client.close()
        print("MongoDB connection closed")


def get_database() -> AsyncIOMotorDatabase:
    """Get the async database instance."""
    if db is None:
        raise RuntimeError("Database not initialized. Call connect_to_mongo() first.")
    return db


def get_sessions_collection():
    """Access the sessions collection."""
    return get_database()["sessions"]
