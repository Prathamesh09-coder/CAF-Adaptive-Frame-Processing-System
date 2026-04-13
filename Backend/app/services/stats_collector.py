"""
Statistics collector for monitoring real-time processing metrics.
"""
import time
from collections import deque
from typing import Deque


class StatsCollector:
    """
    Collects and calculates real-time processing statistics.
    """
    
    def __init__(self, window_size: int = 30):
        """
        Initialize stats collector.
        
        Args:
            window_size: Number of frames to track for FPS calculation
        """
        self.window_size = window_size
        self.timestamps: Deque[float] = deque(maxlen=window_size)
        self.latencies: Deque[float] = deque(maxlen=window_size)
        self.frame_count = 0
    
    def update(self, latency_ms: float) -> None:
        """
        Update stats with a new frame's processing latency.
        
        Args:
            latency_ms: Processing latency in milliseconds
        """
        self.timestamps.append(time.time())
        self.latencies.append(latency_ms)
        self.frame_count += 1
    
    def get_fps(self) -> float:
        """
        Calculate frames per second over the recent window.
        
        Returns:
            FPS value, or 0 if insufficient data
        """
        if len(self.timestamps) < 2:
            return 0.0
        
        time_span = self.timestamps[-1] - self.timestamps[0]
        if time_span == 0:
            return 0.0
        
        return (len(self.timestamps) - 1) / time_span
    
    def get_average_latency(self) -> float:
        """
        Calculate average processing latency in milliseconds.
        
        Returns:
            Average latency over the window
        """
        if not self.latencies:
            return 0.0
        
        return sum(self.latencies) / len(self.latencies)
    
    def get_stats(self) -> dict:
        """
        Get comprehensive statistics.
        
        Returns:
            Dictionary with FPS, latency, and frame count
        """
        return {
            "fps": self.get_fps(),
            "avg_latency_ms": self.get_average_latency(),
            "total_frames": self.frame_count,
        }
