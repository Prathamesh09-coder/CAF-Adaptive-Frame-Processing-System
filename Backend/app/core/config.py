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

# Transport and Optimization
WEBSOCKET_TRANSPORT_MODE: str = os.getenv("WEBSOCKET_TRANSPORT_MODE", "binary") # binary or base64
JPEG_COMPRESSION_QUALITY: int = int(os.getenv("JPEG_COMPRESSION_QUALITY", 60))
WEBSOCKET_QUEUE_LIMIT: int = int(os.getenv("WEBSOCKET_QUEUE_LIMIT", 5)) # Drop oldest frames if queue exceeds this
MAX_CPU_USAGE: float = float(os.getenv("MAX_CPU_USAGE", 90.0))
FRAME_SIMILARITY_THRESHOLD: float = float(os.getenv("FRAME_SIMILARITY_THRESHOLD", 0.85)) # For deduplication
MAX_SKIP_STREAK: int = int(os.getenv("MAX_SKIP_STREAK", 3)) # Force refresh after 3 skipped frames

# Telemetry Sampling Rates (Seconds)
TELEMETRY_RATES = {
    "fps": 0.0,            # Every frame
    "cpu": 1.0,            # Every 1 second
    "drift": 3.0,          # Every 3 seconds
    "replay": 5.0,         # Every 5 seconds
}

# Benchmarking Scenarios
SCENARIO_PRESETS = {
    "performance_optimized": {"motion_weight": 0.4, "threshold": 0.55, "model_size": "n"},
    "balanced": {"motion_weight": 0.3, "threshold": 0.45, "model_size": "s"},
    "accuracy_preserved": {"motion_weight": 0.2, "threshold": 0.35, "model_size": "m"},
}
