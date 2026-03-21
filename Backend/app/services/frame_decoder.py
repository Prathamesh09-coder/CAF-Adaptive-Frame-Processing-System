"""
Frame decoder: Converts base64 encoded frames to OpenCV images.
Essential for receiving video frames from frontend via WebSocket.
"""
import base64
from typing import Optional

import cv2
import numpy as np


def decode_base64_frame(frame_base64: str) -> Optional[np.ndarray]:
    """
    Decode base64 encoded frame string to OpenCV image.
    """
    try:
        if "," in frame_base64:
            frame_base64 = frame_base64.split(",")[1]

        frame_bytes = base64.b64decode(frame_base64)
        nparr = np.frombuffer(frame_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if frame is None:
            print("Failed to decode frame: invalid image data")
            return None

        return frame
    except Exception as exc:
        print(f"Frame decode error: {exc}")
        return None


def encode_frame_to_base64(frame: np.ndarray) -> str:
    """
    Encode OpenCV frame to base64 string (reverse operation).
    """
    try:
        _, buffer = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
        return base64.b64encode(buffer).decode("utf-8")
    except Exception as exc:
        print(f"Frame encode error: {exc}")
        return ""
