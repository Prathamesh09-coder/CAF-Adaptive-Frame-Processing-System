import time
import cv2
import numpy as np
import concurrent.futures
from typing import Dict, Any, Optional, Tuple

from app.services.traditional_pipeline import TraditionalPipeline
from app.services.caf_pipeline import CAFPipeline
from app.services.metrics_engine import MetricsEngine
from app.core.config import MAX_CPU_USAGE, FRAME_SIMILARITY_THRESHOLD

class ComparisonEngine:
    def __init__(self):
        self.traditional = TraditionalPipeline()
        self.caf = CAFPipeline()
        self.trad_metrics = MetricsEngine()
        self.caf_metrics = MetricsEngine()
        
        self.prev_frame = None
        self.last_trad_detections = []
        self.last_caf_detections = []
        
        # Async execution
        self.executor = concurrent.futures.ThreadPoolExecutor(max_workers=4)

    def compute_similarity(self, frame: np.ndarray, prev_frame: Optional[np.ndarray]) -> float:
        """Structural similarity approximation"""
        if prev_frame is None:
            return 0.0
        
        # Fast sum of absolute differences
        if frame.shape != prev_frame.shape:
            return 0.0
            
        diff = cv2.absdiff(frame, prev_frame)
        non_zero = np.count_nonzero(diff > 15)
        total_pixels = diff.size
        
        similarity = 1.0 - (non_zero / total_pixels)
        return similarity

    def process_frame(self, frame: np.ndarray, config_weights: dict, threshold: float, model_size: str = "s") -> Tuple[Dict[str, Any], Dict[str, Any]]:
        similarity = self.compute_similarity(frame, self.prev_frame)
        
        # Deduplication Optimization
        if similarity > FRAME_SIMILARITY_THRESHOLD:
            # Skip inference for both, reuse previous
            trad_result = {
                "processed": False,
                "decision": "DEDUPLICATED",
                "detections": self.last_trad_detections,
                "process_time_ms": 1.0, # minimal time
                "reused": True,
                "similarity": similarity
            }
            
            caf_result = {
                "processed": False,
                "decision": "DEDUPLICATED",
                "score": 0.0,
                "threshold": threshold,
                "features": {"M":0,"S":0,"E":0,"C":0,"T":0},
                "skip_reason": "Frame Deduplication",
                "detections": self.last_caf_detections,
                "process_time_ms": 1.0,
                "reused": True,
                "similarity": similarity
            }
            
            self.trad_metrics.update_metrics(trad_result["process_time_ms"], 0, self.last_trad_detections)
            self.caf_metrics.record_skipped()
            self.caf_metrics.update_metrics(caf_result["process_time_ms"], 0, self.last_caf_detections)
            
            self.prev_frame = frame
            return trad_result, caf_result

        # 1. Traditional Pipeline (Always processes, using given model size)
        future_trad = self.executor.submit(self.traditional.process, frame.copy(), model_size)
        
        # 2. CAF Pipeline (Adaptive processing, using given model size)
        future_caf = self.executor.submit(self.caf.process, frame.copy(), self.prev_frame, config_weights, threshold, model_size)
        
        trad_result = future_trad.result()
        caf_result = future_caf.result()
        
        self.last_trad_detections = trad_result["detections"]
        self.last_caf_detections = caf_result["detections"]
        
        # Compute Missed Detections
        trad_det_count = len(trad_result.get("detections", []))
        caf_det_count = len(caf_result.get("detections", []))
        if caf_det_count < trad_det_count:
            # We assume Traditional is ground truth
            self.caf_metrics.missed_detections_count = getattr(self.caf_metrics, 'missed_detections_count', 0) + (trad_det_count - caf_det_count)
        
        # Update metrics
        self.trad_metrics.update_metrics(trad_result["process_time_ms"], 0, trad_result["detections"])
        
        if caf_result["processed"]:
            self.caf_metrics.update_metrics(caf_result["process_time_ms"], 0, caf_result["detections"])
        else:
            self.caf_metrics.record_skipped()
            self.caf_metrics.update_metrics(caf_result["process_time_ms"], 0, caf_result["detections"])

        self.prev_frame = frame
        
        return trad_result, caf_result
