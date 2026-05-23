import torch
import numpy as np
from ultralytics import YOLO

class YOLODetector:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(YOLODetector, cls).__new__(cls)
            cls._instance._initialize()
        return cls._instance

    def _initialize(self):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"YOLO Inference Device detected: {self.device.upper()}")
        
        self.models = {}
        self.warmup_done = set()
        
        # Preload the default 's' model
        self._load_model("s")

    def _load_model(self, size: str):
        if size not in self.models:
            print(f"Initializing YOLOv8 {size} model...")
            self.models[size] = YOLO(f"yolov8{size}.pt")
            self.models[size].to(self.device)
            self.warmup(size)
        return self.models[size]

    def warmup(self, size: str):
        """Run dummy inference to avoid first-frame latency spike."""
        if size not in self.warmup_done:
            print(f"Warming up YOLOv8{size} model...")
            dummy_frame = np.zeros((480, 640, 3), dtype=np.uint8)
            self.models[size](dummy_frame, verbose=False)
            self.warmup_done.add(size)
            print(f"YOLOv8{size} warmup complete.")

    def detect(self, frame: np.ndarray, size: str = "s"):
        """
        Run YOLO detection on a single frame.
        Returns a list of dicts with bbox, conf, and class.
        """
        model = self._load_model(size)
        
        results = model(frame, verbose=False)
        detections = []
        
        if len(results) > 0:
            result = results[0]
            for box in result.boxes:
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                conf = float(box.conf[0])
                cls_id = int(box.cls[0])
                cls_name = model.names[cls_id]
                
                detections.append({
                    "bbox": [x1, y1, x2, y2],
                    "confidence": conf,
                    "class_name": cls_name
                })
                
        return detections

# Singleton accessor
detector = YOLODetector()

def get_yolo_detector():
    return detector
