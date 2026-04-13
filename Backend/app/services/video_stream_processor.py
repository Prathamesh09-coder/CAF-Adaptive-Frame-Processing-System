"""
Video stream processor for handling uploaded video files.
Processes video frame-by-frame and sends results via WebSocket.
"""
import cv2
import asyncio
from typing import Dict, Any
from fastapi import WebSocket

from app.services.video_processor import process_frame
from app.services.stats_collector import StatsCollector
from app.models.session_model import add_frame_to_session, finalize_session
from app.services.session_exporter import append_frame_export
from app.core.database import get_database


async def process_uploaded_video(
    file_path: str, 
    websocket: WebSocket
) -> Dict[str, Any]:
    """
    Process an uploaded video file frame-by-frame.
    Sends progress updates via WebSocket.
    
    Args:
        file_path: Path to the video file
        websocket: WebSocket connection for sending updates
        
    Returns:
        Result dictionary with processing stats
    """
    try:
        # Open video file
        cap = cv2.VideoCapture(file_path)
        if not cap.isOpened():
            return {"error": f"Failed to open video file: {file_path}"}
        
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps_video = cap.get(cv2.CAP_PROP_FPS)
        
        # Initialize processing
        stats = StatsCollector()
        prev_frame = None
        frame_id = 0
        processed_count = 0
        skipped_count = 0
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            frame_id += 1
            
            # Process frame
            result = await asyncio.get_event_loop().run_in_executor(
                None, 
                process_frame, 
                frame, 
                prev_frame
            )
            
            prev_frame = result["processed_frame"]
            stats.update(result["processing_time_ms"])
            
            # Build response
            response = {
                "frame_id": frame_id,
                "total_frames": total_frames,
                "importance_score": float(result["importance_score"]),
                "decision": result["decision"].lower(),
                "features": {
                    "M": float(result["features"]["M"]),
                    "S": float(result["features"]["S"]),
                    "E": float(result["features"]["E"]),
                    "C": float(result["features"]["C"]),
                    "T": float(result["features"]["T"]),
                },
                "metrics": {
                    "fps": float(stats.get_fps()),
                    "latency_ms": float(result["processing_time_ms"]),
                },
                "progress": round(100 * frame_id / total_frames, 1),
            }
            
            # Send update via WebSocket
            try:
                await websocket.send_json(response)
            except Exception as e:
                print(f"WebSocket send error: {e}")
                break
            
            decision = result["decision"]
            if decision in ["PARTIAL", "FULL"]:
                processed_count += 1
            else:
                skipped_count += 1
        
        cap.release()
        
        return {
            "total_frames": total_frames,
            "processed_frames": processed_count,
            "skipped_frames": skipped_count,
            "average_fps": stats.get_fps(),
            "average_latency_ms": stats.get_average_latency(),
        }
        
    except Exception as exc:
        return {"error": str(exc)}
