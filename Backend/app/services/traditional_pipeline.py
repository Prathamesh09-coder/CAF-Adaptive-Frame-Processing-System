import time
import numpy as np
from typing import Dict, Any

from app.services.yolo_detector import get_yolo_detector

class TraditionalPipeline:
    def __init__(self):
        self.detector = get_yolo_detector()

    def process(self, frame: np.ndarray, model_size: str = "s") -> Dict[str, Any]:
        """
        Process every single frame through YOLO.
        """
        start_time = time.time()
        
        detections = self.detector.detect(frame, model_size)
        
        process_time_ms = (time.time() - start_time) * 1000
        
        return {
            "processed": True,
            "decision": "FULL",
            "detections": detections,
            "process_time_ms": process_time_ms,
            "reused": False
        }
