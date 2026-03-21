"""
Main FastAPI application for Adaptive Frame Processing System.
Entry point for the backend server.
"""
import os
import sys

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from app.core.config import (
    DECISION_THRESHOLDS,
    FEATURE_WEIGHTS,
    HOST,
    MONGODB_DB,
    MONGODB_URL,
    PORT,
    SCORING_PROFILE,
)
from app.core.database import connect_to_mongo, close_mongo_connection
from app.routes.sessions import router as sessions_router
from app.routes.upload import router as upload_router
from app.routes.websocket import router as websocket_router

app = FastAPI(
    title="Adaptive Frame Processing System",
    description="Real-time adaptive video frame processing backend",
    version="1.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(websocket_router, tags=["WebSocket"])
app.include_router(upload_router, prefix="/api", tags=["Upload"])
app.include_router(sessions_router, prefix="/api", tags=["Sessions"])


@app.on_event("startup")
async def startup_event():
    """Initialize resources on startup."""
    print("\n" + "=" * 60)
    print("Starting Adaptive Frame Processing Backend...")
    print("=" * 60)

    try:
        await connect_to_mongo()
        print("Startup complete")
    except Exception as exc:
        print(f"Startup error: {exc}")
        sys.exit(1)


@app.on_event("shutdown")
async def shutdown_event():
    """Clean up resources on shutdown."""
    print("\n" + "=" * 60)
    print("Shutting down backend...")
    print("=" * 60)

    try:
        await close_mongo_connection()
        print("Shutdown complete")
    except Exception as exc:
        print(f"Shutdown error: {exc}")


@app.get("/", tags=["Health"])
async def root():
    """Root endpoint - health check."""
    return {
        "status": "ok",
        "service": "Adaptive Frame Processing System",
        "message": "Backend is running",
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "backend",
    }


@app.get("/docs-info", tags=["Documentation"])
async def docs_info():
    """Documentation hint without overriding FastAPI's built-in /docs route."""
    return {
        "message": "API documentation available at /docs",
    }


@app.get("/debug/config", tags=["Debug"])
async def debug_config():
    """Debug endpoint to verify configuration."""
    return {
        "database": {
            "url": MONGODB_URL,
            "db": MONGODB_DB,
        },
        "server": {
            "host": HOST,
            "port": PORT,
        },
        "processing": {
            "profile": SCORING_PROFILE,
            "feature_weights": FEATURE_WEIGHTS,
            "decision_thresholds": DECISION_THRESHOLDS,
        },
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=HOST,
        port=PORT,
        reload=True,
    )
