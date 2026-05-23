import time
import numpy as np
from typing import Dict, Any, Optional

from app.services.yolo_detector import get_yolo_detector
from app.core.config import MAX_SKIP_STREAK
from app.services.video_processor import (
    calculate_motion,
    calculate_scene_change,
    calculate_edge_density,
    calculate_context,
    calculate_temporal
)

class CAFPipeline:
    def __init__(self):
        self.detector = get_yolo_detector()
        self.last_detections = []
        self.frame_count = 0
        self.skip_streak = 0
        self.static_object_frames = 0
        
    def process(self, frame: np.ndarray, prev_frame: Optional[np.ndarray], config_weights: dict, threshold: float, model_size: str = "s") -> Dict[str, Any]:
        """
        Process frame selectively based on CAF score.
        """
        start_time = time.time()
        self.frame_count += 1
        
        # Extract features
        features = {
            "M": calculate_motion(frame, prev_frame),
            "S": calculate_scene_change(frame, prev_frame),
            "E": calculate_edge_density(frame),
            "C": calculate_context(frame),
            "T": calculate_temporal(frame, prev_frame)
        }
        
        # Calculate CAF score
        score = (
            features["M"] * config_weights.get("motion_weight", 0.3) +
            features["S"] * config_weights.get("scene_weight", 0.3) +
            features["E"] * config_weights.get("edge_weight", 0.1) +
            features["C"] * config_weights.get("context_weight", 0.18) +
            features["T"] * config_weights.get("temporal_weight", 0.12)
        )
        
        # Static Object Protection: If we have high confidence detections recently, boost score slightly
        has_confident_objects = any(d["confidence"] > 0.6 for d in self.last_detections)
        if has_confident_objects:
            self.static_object_frames += 1
            # Slowly decay the boost over time to still allow optimization
            boost = max(0.1 - (self.static_object_frames * 0.005), 0)
            score += boost
        else:
            self.static_object_frames = 0

        score = min(score, 1.0)
        
        # Forced Refresh Rules
        force_refresh = False
        skip_reason = ""

        if self.frame_count % 5 == 0:
            force_refresh = True
            skip_reason = "Periodic Refresh"
        elif self.skip_streak >= MAX_SKIP_STREAK:
            force_refresh = True
            skip_reason = "Max Streak Protection"
        
        # Decision
        if score >= threshold or force_refresh:
            decision = "PROCESS"
            detections = self.detector.detect(frame, model_size)
            self.last_detections = detections
            self.skip_streak = 0
            if not skip_reason:
                skip_reason = "Score >= Threshold"
        else:
            decision = "SKIP"
            self.skip_streak += 1
            # Apply Temporal Confidence Smoothing (Rolling Average-like decay)
            detections = []
            for d in self.last_detections:
                smoothed_d = d.copy()
                smoothed_d["confidence"] = max(smoothed_d["confidence"] - 0.01, 0)
                detections.append(smoothed_d)
            self.last_detections = detections
            
            if features["M"] < 0.1:
                skip_reason = "Low Motion"
            elif features["S"] < 0.1:
                skip_reason = "No Scene Change"
            else:
                skip_reason = "Below Threshold"
                
        process_time_ms = (time.time() - start_time) * 1000
                
        return {
            "processed": decision == "PROCESS",
            "decision": decision,
            "score": score,
            "threshold": threshold,
            "features": features,
            "skip_reason": skip_reason,
            "detections": detections,
            "process_time_ms": process_time_ms,
            "reused": decision == "SKIP"
        }
