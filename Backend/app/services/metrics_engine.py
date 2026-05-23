import psutil
import time
from typing import Dict, Any, List

class MetricsEngine:
    def __init__(self):
        self.start_time = time.time()
        self.frames_processed = 0
        self.frames_skipped = 0
        self.total_latency = 0.0
        self.detections = []
        self.class_counts = {}
        
        # For drift analysis and moving averages
        self.recent_latencies = []
        self.recent_confidences = []
        
        # Keep track of alerts
        self.alerts = []

    def update_metrics(self, process_time_ms: float, e2e_latency_ms: float, detections: List[Dict[str, Any]]):
        self.frames_processed += 1
        self.total_latency += process_time_ms
        self.recent_latencies.append(process_time_ms)
        if len(self.recent_latencies) > 30:
            self.recent_latencies.pop(0)
            
        for det in detections:
            conf = det.get("confidence", 0)
            cls_name = det.get("class_name", "unknown")
            self.recent_confidences.append(conf)
            if len(self.recent_confidences) > 100:
                self.recent_confidences.pop(0)
                
            self.class_counts[cls_name] = self.class_counts.get(cls_name, 0) + 1

        self._check_alerts()

    def record_skipped(self):
        self.frames_skipped += 1

    def _check_alerts(self):
        self.alerts.clear()
        
        cpu = psutil.cpu_percent()
        if cpu > 85.0:
            self.alerts.append({"type": "WARNING", "message": f"High CPU Usage: {cpu}%"})
            
        if len(self.recent_latencies) > 0:
            avg_latency = sum(self.recent_latencies) / len(self.recent_latencies)
            if avg_latency > 150:
                self.alerts.append({"type": "WARNING", "message": f"High Inference Latency: {avg_latency:.1f}ms"})

    def get_current_metrics(self) -> Dict[str, Any]:
        cpu_usage = psutil.cpu_percent()
        ram_usage = psutil.virtual_memory().percent
        
        elapsed = time.time() - self.start_time
        fps = (self.frames_processed + self.frames_skipped) / elapsed if elapsed > 0 else 0
        
        avg_conf = sum(self.recent_confidences) / len(self.recent_confidences) if self.recent_confidences else 0.0
        avg_latency = sum(self.recent_latencies) / len(self.recent_latencies) if self.recent_latencies else 0.0
        
        # Detection Stability
        if len(self.recent_confidences) > 1:
            mean = sum(self.recent_confidences) / len(self.recent_confidences)
            variance = sum((x - mean) ** 2 for x in self.recent_confidences) / len(self.recent_confidences)
            stdev = variance ** 0.5
            stability = max(0, 100 - (stdev * 200)) # Scale for visibility
        else:
            stability = 100.0

        refresh_frequency = (self.frames_processed / max(1, self.frames_processed + self.frames_skipped)) * 100

        # Note: missed_detections is handled by ComparisonEngine and injected later or tracked separately, 
        # but we can initialize the field here.
        missed_detections = getattr(self, 'missed_detections_count', 0)
        
        return {
            "fps": round(fps, 1),
            "cpu_usage": cpu_usage,
            "ram_usage": ram_usage,
            "frames_processed": self.frames_processed,
            "frames_skipped": self.frames_skipped,
            "average_confidence": round(avg_conf, 3),
            "average_latency_ms": round(avg_latency, 1),
            "alerts": self.alerts,
            "class_counts": self.class_counts,
            "detection_stability": round(stability, 1),
            "refresh_frequency": round(refresh_frequency, 1),
            "missed_detections": missed_detections,
            "drift_rate": round(100 - stability, 1) # simple proxy for now
        }

    def get_session_summary(self):
        elapsed = time.time() - self.start_time
        return {
            "duration_seconds": elapsed,
            "total_frames_processed": self.frames_processed,
            "total_frames_skipped": self.frames_skipped,
            "average_latency_ms": self.total_latency / max(1, self.frames_processed),
            "final_class_counts": self.class_counts
        }
