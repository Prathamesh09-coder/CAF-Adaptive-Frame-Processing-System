"""
Session export utilities for reading and managing frame telemetry exports.
"""
from pathlib import Path
from typing import Any, Dict, List
import json
import csv

from app.core.config import EXPORTS_DIR


def get_session_export_paths(session_id: str) -> Dict[str, Path]:
    """
    Get export file paths for a session.
    
    Args:
        session_id: Unique session identifier
        
    Returns:
        Dictionary with 'jsonl' and 'csv' Path objects
    """
    exports_dir = Path(EXPORTS_DIR)
    exports_dir.mkdir(parents=True, exist_ok=True)
    
    return {
        "jsonl": exports_dir / f"{session_id}.jsonl",
        "csv": exports_dir / f"{session_id}.csv",
    }


def initialize_session_export(session_id: str) -> Dict[str, str]:
    """
    Initialize export files for a new session.
    
    Args:
        session_id: Unique session identifier
        
    Returns:
        Dictionary with paths to JSONL and CSV files
    """
    paths = get_session_export_paths(session_id)
    
    # Create empty JSONL and CSV files
    paths["jsonl"].touch(exist_ok=True)
    paths["csv"].touch(exist_ok=True)
    
    return {
        "jsonl": str(paths["jsonl"]),
        "csv": str(paths["csv"]),
    }


def append_frame_export(session_id: str, frame_record: Dict[str, Any]) -> None:
    """
    Append a frame record to the session's JSONL export file.
    
    Args:
        session_id: Unique session identifier
        frame_record: Frame telemetry record to append
    """
    paths = get_session_export_paths(session_id)
    jsonl_path = paths["jsonl"]
    
    try:
        with open(jsonl_path, "a") as f:
            f.write(json.dumps(frame_record) + "\n")
    except IOError as e:
        print(f"Error appending to JSONL export: {e}")


def read_frame_exports(session_id: str, limit: int = 200) -> List[Dict[str, Any]]:
    """
    Read frame telemetry from JSONL export file.
    
    Args:
        session_id: Unique session identifier
        limit: Maximum number of records to return
        
    Returns:
        List of frame records, most recent first (up to limit)
    """
    paths = get_session_export_paths(session_id)
    jsonl_path = paths["jsonl"]
    
    if not jsonl_path.exists():
        return []
    
    records: List[Dict[str, Any]] = []
    try:
        with open(jsonl_path, "r") as f:
            for line in f:
                if line.strip():
                    records.append(json.loads(line))
    except (IOError, json.JSONDecodeError):
        return []
    
    # Return most recent records first (limited to requested count)
    return records[-limit:] if limit else records
