import json
import cv2
import time
import numpy as np
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from starlette.concurrency import run_in_threadpool
import psutil

from app.services.comparison_engine import ComparisonEngine
from app.services.frame_decoder import decode_base64_frame
from app.core.config import WEBSOCKET_TRANSPORT_MODE, WEBSOCKET_QUEUE_LIMIT, JPEG_COMPRESSION_QUALITY, SCENARIO_PRESETS

router = APIRouter()

@router.websocket("/ws/comparison")
async def comparison_websocket(websocket: WebSocket):
    await websocket.accept()
    print("Comparison WebSocket connected")
    
    engine = ComparisonEngine()
    
    current_scenario = "balanced"
    current_weights = SCENARIO_PRESETS[current_scenario].copy()
    current_threshold = current_weights.pop("threshold", 0.45)
    current_model_size = current_weights.pop("model_size", "s")
    transport_mode = WEBSOCKET_TRANSPORT_MODE
    
    frame_id = 0
    try:
        while True:
            # We use receive_text or receive_bytes depending on frontend
            # Let's assume frontend sends JSON with base64 frame, client_timestamp, and config updates
            data = await websocket.receive_text()
            data_json = json.loads(data)
            
            # Update settings if frontend sends them
            if "config" in data_json:
                cfg = data_json["config"]
                if "scenario" in cfg:
                    current_scenario = cfg["scenario"]
                    if current_scenario in SCENARIO_PRESETS:
                        current_weights = SCENARIO_PRESETS[current_scenario].copy()
                        current_threshold = current_weights.pop("threshold", 0.45)
                        current_model_size = current_weights.pop("model_size", "s")
                
                # Dynamic tuning
                if "threshold" in cfg:
                    current_threshold = float(cfg["threshold"])
                if "weights" in cfg:
                    current_weights.update(cfg["weights"])
                    
                if "transport_mode" in cfg:
                    transport_mode = cfg["transport_mode"]
                    
                continue # If it was just a config update, don't process frame
            
            if "frame" not in data_json:
                continue
                
            client_timestamp = data_json.get("timestamp", time.time() * 1000)
            
            # Backpressure Drop
            # We can't directly check the ASGI queue easily, but we can check CPU
            if psutil.cpu_percent() > 95.0:
                # Graceful degradation: skip frame processing entirely
                await websocket.send_json({"type": "degradation", "message": "Frame dropped due to high CPU"})
                continue
                
            # Decode frame
            frame = await run_in_threadpool(decode_base64_frame, data_json["frame"])
            if frame is None:
                continue
                
            frame_id += 1
            
            # Run comparison engine
            trad_res, caf_res = await run_in_threadpool(
                engine.process_frame, frame, current_weights, current_threshold, current_model_size
            )
            
            # Compute E2E Latency
            current_time_ms = time.time() * 1000
            e2e_latency = current_time_ms - client_timestamp
            
            trad_metrics = engine.trad_metrics.get_current_metrics()
            caf_metrics = engine.caf_metrics.get_current_metrics()
            
            payload = {
                "type": "telemetry",
                "frame_id": frame_id,
                "e2e_latency_ms": e2e_latency,
                "traditional": {
                    "result": trad_res,
                    "metrics": trad_metrics
                },
                "caf": {
                    "result": caf_res,
                    "metrics": caf_metrics
                }
            }
            
            # Send JSON telemetry
            await websocket.send_text(json.dumps(payload))
            
            # Send Binary frame if transport_mode == binary
            # We send the original frame. Bounding boxes are drawn on frontend.
            if transport_mode == "binary":
                # Compress to JPEG
                _, buffer = cv2.imencode('.jpg', frame, [int(cv2.IMWRITE_JPEG_QUALITY), JPEG_COMPRESSION_QUALITY])
                await websocket.send_bytes(buffer.tobytes())
                
    except WebSocketDisconnect:
        print("Comparison WebSocket disconnected")
        # Save session benchmarking to MongoDB
        trad_summary = engine.trad_metrics.get_session_summary()
        caf_summary = engine.caf_metrics.get_session_summary()
        print("Session Benchmarking Summary:")
        print("Trad:", trad_summary)
        print("CAF:", caf_summary)
    except Exception as exc:
        print(f"Comparison WebSocket error: {exc}")
