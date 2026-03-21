"""
Configuration settings for the Adaptive Frame Processing System.
"""
import os
from pathlib import Path

# MongoDB Configuration
MONGODB_URL: str = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
MONGODB_DB: str = os.getenv("MONGODB_DB", "adaptive_frame_processor")

# Server Configuration
HOST: str = os.getenv("HOST", "127.0.0.1")
PORT: int = int(os.getenv("PORT", 8000))
DEBUG: bool = os.getenv("DEBUG", "True").lower() == "true"

# Processing Configuration
MAX_STORED_FRAMES: int = 50
FRAME_TIMEOUT_SECONDS: float = 30.0
SCORING_PROFILE: str = os.getenv("SCORING_PROFILE", "calibrated_v2")
EXPORTS_DIR: Path = Path(os.getenv("EXPORTS_DIR", "session_exports"))

# Feature Weights for Importance Scoring
FEATURE_WEIGHTS = {
    "motion": 0.30,           # M: Motion between consecutive frames
    "scene_change": 0.30,     # S: Histogram delta between scenes
    "edge_density": 0.10,     # E: Structural detail from Canny edges
    "context": 0.18,          # C: Brightness and contrast context
    "temporal": 0.12,         # T: Recent motion stability
}

# Decision Thresholds
DECISION_THRESHOLDS = {
    "skip": 0.22,      # score < 0.22 -> SKIP
    "partial": 0.62,   # 0.22 <= score < 0.62 -> PARTIAL
    "full": 1.0,       # score >= 0.62 -> FULL
}

# Logging
LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
