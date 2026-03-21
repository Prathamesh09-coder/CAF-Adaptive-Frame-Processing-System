"""
WebSocket routes for real-time adaptive frame processing.
Main entry point for frontend communication and frame processing pipeline.
"""
import json
from datetime import datetime

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from starlette.concurrency import run_in_threadpool

from app.core.database import get_database
from app.models.session_model import create_session, add_frame_to_session, finalize_session
from app.services.frame_decoder import decode_base64_frame
from app.services.session_exporter import append_frame_export, initialize_session_export
from app.services.stats_collector import StatsCollector
from app.services.video_processor import process_frame

router = APIRouter()


@router.websocket("/live")
async def websocket_live(websocket: WebSocket):
    """
    WebSocket endpoint for real-time video frame processing.
    """
    await websocket.accept()
    print("WebSocket connected")

    session_data = create_session()
    session_data["created_at"] = datetime.utcnow()
    session_data["status"] = "processing"
    session_data["metadata"]["source"] = "live"
    session_data["exports"] = initialize_session_export(session_data["session_id"])

    stats = StatsCollector()
    prev_frame = None
    frame_id = 0

    try:
        while True:
            try:
                data = await websocket.receive_text()
                data_json = json.loads(data)
            except json.JSONDecodeError as exc:
                print(f"JSON parse error: {exc}")
                await websocket.send_json({"error": "Invalid JSON"})
                continue
            except Exception as exc:
                print(f"Receive error: {exc}")
                break

            if "frame" not in data_json:
                await websocket.send_json({"error": "Missing 'frame' field"})
                continue

            try:
                frame = await run_in_threadpool(
                    decode_base64_frame,
                    data_json["frame"],
                )
                if frame is None:
                    await websocket.send_json({"error": "Failed to decode frame"})
                    continue
            except Exception as exc:
                print(f"Frame decode error: {exc}")
                await websocket.send_json({"error": "Decode failed"})
                continue

            frame_id += 1
            print(f"Processing frame #{frame_id}")

            try:
                result = await run_in_threadpool(process_frame, frame, prev_frame)
                prev_frame = result["processed_frame"]
            except Exception as exc:
                print(f"Processing error: {exc}")
                await websocket.send_json({"error": "Processing failed"})
                continue

            decision_lower = result["decision"].lower()
            decision_upper = result["decision"].upper()

            stats.update(result["processing_time_ms"])
            fps = stats.get_fps()
            metrics = {
                "fps": float(fps),
                "latency_ms": float(result["processing_time_ms"]),
            }

            frame_record = add_frame_to_session(
                session_data,
                frame_id=frame_id,
                importance_score=result["importance_score"],
                decision=decision_upper,
                features=result["features"],
                metrics=metrics,
            )
            append_frame_export(session_data["session_id"], frame_record)

            try:
                response = {
                    "session_id": session_data["session_id"],
                    "frame_id": frame_id,
                    "importance_score": float(result["importance_score"]),
                    "decision": decision_lower,
                    "features": {
                        "M": float(result["features"]["M"]),
                        "S": float(result["features"]["S"]),
                        "E": float(result["features"]["E"]),
                        "C": float(result["features"]["C"]),
                        "T": float(result["features"]["T"]),
                    },
                    "metrics": metrics,
                }
                await websocket.send_text(json.dumps(response))
            except Exception as exc:
                print(f"Send error: {exc}")
                break

    except WebSocketDisconnect:
        print("WebSocket disconnected")
    except Exception as exc:
        print(f"WebSocket error: {exc}")
    finally:
        session_data["ended_at"] = datetime.utcnow()
        session_data["status"] = "completed"
        session_data = finalize_session(session_data)

        try:
            db = get_database()
            result = await db["sessions"].insert_one(session_data)
            print(f"Session stored in MongoDB (ID: {result.inserted_id})")
            print(f"Frames: {session_data['total_frames']}")
            print(f"Duration: {session_data['duration_seconds']}s")
            print(f"Decisions: {session_data['decision_counts']}")
        except RuntimeError:
            print("Database not initialized; session not stored")
        except Exception as exc:
            print(f"MongoDB insert error: {exc}")


@router.websocket("/upload/{session_id}")
async def websocket_upload(websocket: WebSocket, session_id: str):
    """
    WebSocket endpoint for processing uploaded video files.
    """
    await websocket.accept()
    print(f"Upload WebSocket connected: {session_id}")

    try:
        db = get_database()
        session = await db["sessions"].find_one({"session_id": session_id})

        if not session:
            await websocket.send_json({"error": f"Session not found: {session_id}"})
            await websocket.close()
            return

        if session.get("status") != "uploaded":
            await websocket.send_json(
                {"error": f"Session not ready for processing: {session.get('status')}"}
            )
            await websocket.close()
            return

        file_path = session.get("file_path")
        if not file_path:
            await websocket.send_json({"error": "No file path found"})
            await websocket.close()
            return

        from app.services.video_stream_processor import process_uploaded_video

        print(f"Starting upload video processing: {session_id}")
        result = await process_uploaded_video(file_path, websocket)

        if "error" in result:
            await websocket.send_json({"error": result["error"]})
        else:
            await websocket.send_json(
                {
                    "session_id": session_id,
                    "status": "completed",
                    "total_frames": result.get("total_frames", 0),
                    "message": "Video processing completed",
                }
            )

        print(f"Upload video processing completed: {session_id}")
    except Exception as exc:
        print(f"Upload WebSocket error: {exc}")
        try:
            await websocket.send_json({"error": f"Processing failed: {str(exc)}"})
        except Exception:
            pass
    finally:
        try:
            await websocket.close()
        except Exception:
            pass


@router.get("/status")
async def ws_status():
    """Health check endpoint."""
    return {
        "status": "ok",
        "message": "WebSocket server is running",
    }
