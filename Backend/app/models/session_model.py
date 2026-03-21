"""
Session data model for MongoDB storage.
Defines structure of session data collected during video processing.
"""
from datetime import datetime
from typing import Dict, Optional
from uuid import uuid4

from app.core.config import (
    DECISION_THRESHOLDS,
    FEATURE_WEIGHTS,
    MAX_STORED_FRAMES,
    SCORING_PROFILE,
)

FEATURE_KEYS = ("M", "S", "E", "C", "T")


def create_session() -> Dict:
    """
    Create a new session object with initialized fields.

    Returns:
        dict: Session object ready for population
    """
    session_id = str(uuid4())

    return {
        "session_id": session_id,
        "status": "created",
        "created_at": None,
        "ended_at": None,
        "duration_seconds": 0.0,
        "total_frames": 0,
        "decision_counts": {
            "SKIP": 0,
            "PARTIAL": 0,
            "FULL": 0,
        },
        "frames": [],  # Highest-importance preview frames, limited in MongoDB
        "score_summary": {
            "average": 0.0,
            "minimum": 0.0,
            "maximum": 0.0,
        },
        "feature_averages": {key: 0.0 for key in FEATURE_KEYS},
        "metrics_summary": {
            "average_fps": 0.0,
            "average_latency_ms": 0.0,
        },
        "exports": {
            "jsonl": None,
            "csv": None,
        },
        "scoring_config": {
            "profile": SCORING_PROFILE,
            "feature_weights": FEATURE_WEIGHTS.copy(),
            "decision_thresholds": DECISION_THRESHOLDS.copy(),
        },
        "metadata": {
            "version": "1.1",
            "system": "Adaptive Frame Processing System",
        },
    }


def build_frame_record(
    frame_id: int,
    importance_score: float,
    decision: str,
    features: Optional[Dict[str, float]] = None,
    metrics: Optional[Dict[str, float]] = None,
    timestamp: Optional[str] = None,
) -> Dict:
    """
    Build a serializable frame record for telemetry/export.
    """
    features = features or {}
    metrics = metrics or {}

    return {
        "frame_id": int(frame_id),
        "timestamp": timestamp or datetime.utcnow().isoformat(),
        "importance_score": float(importance_score),
        "decision": decision,
        "features": {
            key: float(features.get(key, 0.0))
            for key in FEATURE_KEYS
        },
        "metrics": {
            "fps": float(metrics.get("fps", 0.0)),
            "latency_ms": float(metrics.get("latency_ms", 0.0)),
        },
    }


def add_frame_to_session(
    session: Dict,
    frame_id: int,
    importance_score: float,
    decision: str,
    features: Optional[Dict[str, float]] = None,
    metrics: Optional[Dict[str, float]] = None,
) -> Dict:
    """
    Add frame telemetry to a session and update running analytics.

    Args:
        session: Session object
        frame_id: Frame ID
        importance_score: Computed importance score (0-1)
        decision: Decision (SKIP, PARTIAL, FULL)
        features: Frame feature map
        metrics: Runtime metrics map

    Returns:
        dict: Stored frame record
    """
    record = build_frame_record(
        frame_id=frame_id,
        importance_score=importance_score,
        decision=decision,
        features=features,
        metrics=metrics,
    )

    session["total_frames"] += 1
    decision_counts = session.setdefault("decision_counts", {})
    decision_counts[decision] = int(decision_counts.get(decision, 0)) + 1

    _update_score_summary(
        session["score_summary"],
        record["importance_score"],
        session["total_frames"],
    )
    _update_feature_averages(
        session["feature_averages"],
        record["features"],
        session["total_frames"],
    )
    _update_metrics_summary(
        session["metrics_summary"],
        record["metrics"],
        session["total_frames"],
    )
    _insert_preview_frame(session["frames"], record)

    return record


def finalize_session(session: Dict) -> Dict:
    """
    Finalize session before storage.
    Ensures all fields are properly serialized for MongoDB.

    Args:
        session: Session object

    Returns:
        dict: Finalized session ready for MongoDB insert/update
    """
    if session["created_at"] and session["ended_at"]:
        duration = (session["ended_at"] - session["created_at"]).total_seconds()
        session["duration_seconds"] = round(duration, 2)

    session["total_frames"] = int(session["total_frames"])
    session["duration_seconds"] = float(session["duration_seconds"])

    for decision_type in session["decision_counts"]:
        session["decision_counts"][decision_type] = int(
            session["decision_counts"][decision_type]
        )

    session["score_summary"] = {
        "average": round(float(session["score_summary"]["average"]), 4),
        "minimum": round(float(session["score_summary"]["minimum"]), 4),
        "maximum": round(float(session["score_summary"]["maximum"]), 4),
    }
    session["feature_averages"] = {
        key: round(float(value), 4)
        for key, value in session["feature_averages"].items()
    }
    session["metrics_summary"] = {
        "average_fps": round(float(session["metrics_summary"]["average_fps"]), 4),
        "average_latency_ms": round(
            float(session["metrics_summary"]["average_latency_ms"]),
            4,
        ),
    }

    return session


def _update_score_summary(summary: Dict, score: float, count: int) -> None:
    if count == 1:
        summary["average"] = float(score)
        summary["minimum"] = float(score)
        summary["maximum"] = float(score)
        return

    previous_average = float(summary["average"])
    summary["average"] = previous_average + ((float(score) - previous_average) / count)
    summary["minimum"] = min(float(summary["minimum"]), float(score))
    summary["maximum"] = max(float(summary["maximum"]), float(score))


def _update_feature_averages(
    averages: Dict[str, float],
    features: Dict[str, float],
    count: int,
) -> None:
    for key in FEATURE_KEYS:
        previous_average = float(averages.get(key, 0.0))
        current_value = float(features.get(key, 0.0))
        averages[key] = previous_average + ((current_value - previous_average) / count)


def _update_metrics_summary(
    summary: Dict[str, float],
    metrics: Dict[str, float],
    count: int,
) -> None:
    for metric_key, session_key in (
        ("fps", "average_fps"),
        ("latency_ms", "average_latency_ms"),
    ):
        previous_average = float(summary.get(session_key, 0.0))
        current_value = float(metrics.get(metric_key, 0.0))
        summary[session_key] = previous_average + (
            (current_value - previous_average) / count
        )


def _insert_preview_frame(frames: list, record: Dict) -> None:
    frames.append(record)
    frames.sort(
        key=lambda item: (item["importance_score"], item["frame_id"]),
        reverse=True,
    )

    if len(frames) > MAX_STORED_FRAMES:
        del frames[MAX_STORED_FRAMES:]
