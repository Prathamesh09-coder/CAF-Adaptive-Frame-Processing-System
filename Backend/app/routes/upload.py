"""
Video upload routes for processing uploaded video files.
Handles file upload, temporary storage, and session initialization.
"""
import time
import uuid
from datetime import datetime
from pathlib import Path
from typing import Dict

import aiofiles
from fastapi import APIRouter, File, HTTPException, UploadFile

from app.core.database import get_database
from app.models.session_model import create_session

router = APIRouter()

UPLOAD_DIR = Path("temp_uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

SUPPORTED_FORMATS = {".mp4", ".avi", ".mov", ".mkv", ".webm"}


@router.post("/upload-video")
async def upload_video(file: UploadFile = File(...)) -> Dict:
    """
    Upload and register a video file for processing.
    """
    try:
        file_extension = Path(file.filename).suffix.lower()
        if file_extension not in SUPPORTED_FORMATS:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file format. Supported: {', '.join(SUPPORTED_FORMATS)}",
            )

        session_id = str(uuid.uuid4())
        temp_file_path = UPLOAD_DIR / f"{session_id}{file_extension}"

        async with aiofiles.open(temp_file_path, "wb") as buffer:
            content = await file.read()
            await buffer.write(content)

        session_data = create_session()
        session_data["session_id"] = session_id
        session_data["created_at"] = datetime.utcnow()
        session_data["video_name"] = file.filename
        session_data["file_path"] = str(temp_file_path)
        session_data["file_size"] = len(content)
        session_data["status"] = "uploaded"
        session_data["metadata"]["source"] = "upload"

        try:
            db = get_database()
            await db["sessions"].insert_one(session_data)
            print(f"Upload session created: {session_id}")
        except Exception as exc:
            if temp_file_path.exists():
                temp_file_path.unlink()
            raise HTTPException(status_code=500, detail=f"Database error: {str(exc)}")

        return {
            "session_id": session_id,
            "status": "processing",
            "message": "Video uploaded successfully. Connect to WebSocket for processing results.",
            "video_name": file.filename,
            "file_size": len(content),
        }

    except HTTPException:
        raise
    except Exception as exc:
        print(f"Upload error: {exc}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(exc)}")


@router.delete("/upload/{session_id}")
async def cleanup_upload(session_id: str):
    """
    Clean up uploaded video file after processing.
    """
    try:
        for file_path in UPLOAD_DIR.glob(f"{session_id}.*"):
            if file_path.exists():
                file_path.unlink()
                print(f"Cleaned up file: {file_path}")

        return {"status": "cleaned", "session_id": session_id}

    except Exception as exc:
        print(f"Cleanup error: {exc}")
        raise HTTPException(status_code=500, detail=f"Cleanup failed: {str(exc)}")


@router.get("/upload/status/{session_id}")
async def get_upload_status(session_id: str):
    """
    Get processing status of an uploaded video.
    """
    try:
        db = get_database()
        session = await db["sessions"].find_one({"session_id": session_id})
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        return {
            "session_id": session_id,
            "status": session.get("status", "unknown"),
            "video_name": session.get("video_name"),
            "total_frames": session.get("total_frames", 0),
            "duration_seconds": session.get("duration_seconds", 0),
            "decision_counts": session.get("decision_counts", {}),
            "progress": "completed" if session.get("ended_at") else "processing",
        }

    except HTTPException:
        raise
    except Exception as exc:
        print(f"Status check error: {exc}")
        raise HTTPException(status_code=500, detail=f"Status check failed: {str(exc)}")


@router.on_event("startup")
async def cleanup_old_files():
    """
    Clean up old temporary files on startup.
    """
    try:
        current_time = time.time()
        max_age = 24 * 60 * 60
        cleaned_count = 0

        for file_path in UPLOAD_DIR.glob("*"):
            if not file_path.is_file():
                continue

            file_age = current_time - file_path.stat().st_mtime
            if file_age > max_age:
                file_path.unlink()
                cleaned_count += 1

        if cleaned_count > 0:
            print(f"Cleaned up {cleaned_count} old temporary files")

    except Exception as exc:
        print(f"Cleanup warning: {exc}")
