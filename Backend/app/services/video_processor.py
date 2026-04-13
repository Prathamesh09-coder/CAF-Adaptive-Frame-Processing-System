"""
Video frame processing and feature extraction for adaptive decision making.
"""
import time
import numpy as np
import cv2
from typing import Dict, Any, Optional

from app.core.config import FEATURE_WEIGHTS, DECISION_THRESHOLDS


def calculate_motion(frame: np.ndarray, prev_frame: Optional[np.ndarray]) -> float:
    """
    Calculate motion feature (M) using optical flow between frames.
    
    Args:
        frame: Current frame
        prev_frame: Previous frame or None
        
    Returns:
        Motion score 0-1
    """
    if prev_frame is None:
        return 0.0
    
    # Convert to grayscale if needed
    if len(frame.shape) == 3:
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    else:
        gray = frame
    
    if len(prev_frame.shape) == 3:
        prev_gray = cv2.cvtColor(prev_frame, cv2.COLOR_BGR2GRAY)
    else:
        prev_gray = prev_frame
    
    # Calculate absolute difference
    diff = cv2.absdiff(gray, prev_gray)
    motion_score = np.mean(diff) / 255.0
    
    return min(motion_score, 1.0)


def calculate_scene_change(frame: np.ndarray, prev_frame: Optional[np.ndarray]) -> float:
    """
    Calculate scene change feature (S) using histogram comparison.
    
    Args:
        frame: Current frame
        prev_frame: Previous frame or None
        
    Returns:
        Scene change score 0-1
    """
    if prev_frame is None:
        return 0.0
    
    # Convert to HSV for better histogram comparison
    if len(frame.shape) == 3:
        hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
    else:
        return 0.0
    
    if len(prev_frame.shape) == 3:
        prev_hsv = cv2.cvtColor(prev_frame, cv2.COLOR_BGR2HSV)
    else:
        return 0.0
    
    # Calculate histogram
    hist = cv2.calcHist([hsv], [0, 1], None, [180, 256], [0, 180, 0, 256])
    prev_hist = cv2.calcHist([prev_hsv], [0, 1], None, [180, 256], [0, 180, 0, 256])
    
    # Normalize histograms
    hist_norm = cv2.normalize(hist, hist).flatten()
    prev_hist_norm = cv2.normalize(prev_hist, prev_hist).flatten()
    
    # Compare using chi-square
    scene_change = cv2.compareHist(hist_norm, prev_hist_norm, cv2.HISTCMP_CHISQR_ALT)
    
    return min(scene_change / 100.0, 1.0)


def calculate_edge_density(frame: np.ndarray) -> float:
    """
    Calculate edge density feature (E) using Canny edge detection.
    
    Args:
        frame: Frame to analyze
        
    Returns:
        Edge density score 0-1
    """
    if len(frame.shape) == 3:
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    else:
        gray = frame
    
    # Apply Canny edge detection
    edges = cv2.Canny(gray, 100, 200)
    
    # Calculate density
    edge_density = np.sum(edges > 0) / edges.size
    
    return edge_density


def calculate_context(frame: np.ndarray) -> float:
    """
    Calculate context feature (C) from brightness and contrast.
    
    Args:
        frame: Frame to analyze
        
    Returns:
        Context score 0-1
    """
    if len(frame.shape) == 3:
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    else:
        gray = frame
    
    # Calculate brightness
    brightness = np.mean(gray) / 255.0
    
    # Calculate contrast (standard deviation)
    contrast = np.std(gray) / 128.0
    
    # Combine: prefer moderate brightness and high contrast
    context_score = (brightness * 0.5 + contrast * 0.5)
    
    return min(context_score, 1.0)


def calculate_temporal(frame: np.ndarray, prev_frame: Optional[np.ndarray]) -> float:
    """
    Calculate temporal stability feature (T).
    Measures stability of recent motion.
    
    Args:
        frame: Current frame
        prev_frame: Previous frame or None
        
    Returns:
        Temporal stability score 0-1
    """
    if prev_frame is None:
        return 0.5  # Neutral score for first frame
    
    # Motion is an inverse measure of temporal stability
    motion = calculate_motion(frame, prev_frame)
    
    # High motion = low stability
    return 1.0 - motion


def calculate_importance_score(features: Dict[str, float]) -> float:
    """
    Calculate overall importance score using weighted feature combination.
    
    Args:
        features: Dictionary with feature scores (M, S, E, C, T)
        
    Returns:
        Importance score 0-1
    """
    score = (
        features["M"] * FEATURE_WEIGHTS["motion"] +
        features["S"] * FEATURE_WEIGHTS["scene_change"] +
        features["E"] * FEATURE_WEIGHTS["edge_density"] +
        features["C"] * FEATURE_WEIGHTS["context"] +
        features["T"] * FEATURE_WEIGHTS["temporal"]
    )
    
    return min(score, 1.0)


def get_decision(importance_score: float) -> str:
    """
    Determine processing decision based on importance score.
    
    Args:
        importance_score: Calculated importance score 0-1
        
    Returns:
        Decision: "SKIP", "PARTIAL", or "FULL"
    """
    if importance_score < DECISION_THRESHOLDS["skip"]:
        return "SKIP"
    elif importance_score < DECISION_THRESHOLDS["partial"]:
        return "PARTIAL"
    else:
        return "FULL"


def process_frame(frame: np.ndarray, prev_frame: Optional[np.ndarray] = None) -> Dict[str, Any]:
    """
    Process a frame and calculate all features and decision.
    
    Args:
        frame: Current frame (numpy array)
        prev_frame: Previous frame for comparison
        
    Returns:
        Dictionary with processing results
    """
    start_time = time.time()
    
    # Calculate individual features
    features = {
        "M": calculate_motion(frame, prev_frame),
        "S": calculate_scene_change(frame, prev_frame),
        "E": calculate_edge_density(frame),
        "C": calculate_context(frame),
        "T": calculate_temporal(frame, prev_frame),
    }
    
    # Calculate importance score
    importance_score = calculate_importance_score(features)
    
    # Determine decision
    decision = get_decision(importance_score)
    
    # Calculate processing time
    processing_time_ms = (time.time() - start_time) * 1000
    
    return {
        "processed_frame": frame,
        "importance_score": importance_score,
        "decision": decision,
        "features": features,
        "processing_time_ms": processing_time_ms,
    }
