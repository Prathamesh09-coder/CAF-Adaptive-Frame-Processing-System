"""
Session inspection and export routes.
Expose recent scoring sessions and per-frame telemetry exports.
"""
from fastapi import APIRouter, HTTPException, Query
from fastapi.encoders import jsonable_encoder
from fastapi.responses import FileResponse

from app.core.config import DECISION_THRESHOLDS, FEATURE_WEIGHTS, SCORING_PROFILE
from app.core.database import get_database
from app.services.session_exporter import (
    get_session_export_paths,
    read_frame_exports,
)

router = APIRouter()


@router.get("/scoring/config")
async def get_scoring_config():
    """
    Return the active scoring configuration for debugging and tuning.
    """
    return {
        "profile": SCORING_PROFILE,
        "feature_weights": FEATURE_WEIGHTS,
        "decision_thresholds": DECISION_THRESHOLDS,
    }


@router.get("/sessions")
async def list_sessions(limit: int = Query(10, ge=1, le=100)):
    """
    List recent processing sessions.
    """
    db = get_database()
    cursor = (
        db["sessions"]
        .find(
            {},
            {
                "_id": 0,
                "session_id": 1,
                "status": 1,
                "created_at": 1,
                "ended_at": 1,
                "duration_seconds": 1,
                "total_frames": 1,
                "decision_counts": 1,
                "score_summary": 1,
                "metrics_summary": 1,
                "scoring_config": 1,
                "metadata": 1,
            },
        )
        .sort("created_at", -1)
        .limit(limit)
    )

    sessions = await cursor.to_list(length=limit)
    return {"items": jsonable_encoder(sessions)}


@router.get("/sessions/{session_id}")
async def get_session(session_id: str):
    """
    Return session detail and export availability.
    """
    db = get_database()
    session = await db["sessions"].find_one({"session_id": session_id}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    export_paths = get_session_export_paths(session_id)
    session["export_status"] = {
        "jsonl_available": export_paths["jsonl"].exists(),
        "csv_available": export_paths["csv"].exists(),
    }

    return jsonable_encoder(session)


@router.get("/sessions/{session_id}/frames")
async def get_session_frames(
    session_id: str,
    limit: int = Query(200, ge=1, le=5000),
):
    """
    Return recent frame telemetry for a session.
    """
    records = read_frame_exports(session_id, limit=limit)
    if records:
        return {
            "session_id": session_id,
            "count": len(records),
            "frames": records,
        }

    db = get_database()
    session = await db["sessions"].find_one(
        {"session_id": session_id},
        {"_id": 0, "frames": 1},
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    return {
        "session_id": session_id,
        "count": len(session.get("frames", [])),
        "frames": session.get("frames", []),
    }


@router.get("/sessions/{session_id}/export.csv")
async def export_session_csv(session_id: str):
    """
    Download the session telemetry CSV export.
    """
    csv_path = get_session_export_paths(session_id)["csv"]
    if not csv_path.exists():
        raise HTTPException(status_code=404, detail="CSV export not found")

    return FileResponse(
        path=csv_path,
        media_type="text/csv",
        filename=f"{session_id}.csv",
    )


@router.get("/sessions/{session_id}/export.jsonl")
async def export_session_jsonl(session_id: str):
    """
    Download the session telemetry JSONL export.
    """
    jsonl_path = get_session_export_paths(session_id)["jsonl"]
    if not jsonl_path.exists():
        raise HTTPException(status_code=404, detail="JSONL export not found")

    return FileResponse(
        path=jsonl_path,
        media_type="application/json",
        filename=f"{session_id}.jsonl",
    )
