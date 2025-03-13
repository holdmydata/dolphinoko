"""
Simple JSON file-based storage for tools
"""
import json
import os
import logging
from typing import List, Dict, Any, Optional
from pathlib import Path

# Get the current file's directory
BASE_DIR = Path(__file__).resolve().parent.parent
# Store the JSON file in the backend directory
DATA_DIR = BASE_DIR / "data"
TOOLS_FILE = DATA_DIR / "tools.json"

# Setup logging
logger = logging.getLogger(__name__)

def ensure_data_directory():
    """Make sure the data directory exists"""
    if not DATA_DIR.exists():
        DATA_DIR.mkdir(parents=True)
        logger.info(f"Created data directory: {DATA_DIR}")

def load_tools() -> List[Dict[str, Any]]:
    """Load tools from JSON file"""
    ensure_data_directory()
    
    if not TOOLS_FILE.exists():
        logger.info(f"Tools file not found, creating empty file: {TOOLS_FILE}")
        save_tools([])
        return []
    
    try:
        with open(TOOLS_FILE, "r") as f:
            data = json.load(f)
            logger.info(f"Loaded {len(data)} tools from {TOOLS_FILE}")
            return data
    except Exception as e:
        logger.error(f"Error loading tools from {TOOLS_FILE}: {str(e)}")
        return []

def save_tools(tools: List[Dict[str, Any]]) -> bool:
    """Save tools to JSON file"""
    ensure_data_directory()
    
    try:
        with open(TOOLS_FILE, "w") as f:
            json.dump(tools, f, indent=2)
        logger.info(f"Saved {len(tools)} tools to {TOOLS_FILE}")
        return True
    except Exception as e:
        logger.error(f"Error saving tools to {TOOLS_FILE}: {str(e)}")
        return False