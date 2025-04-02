import logging
from typing import List, Dict, Any
from pydantic import BaseModel

from services.storage_service import load_tools, save_tools

logger = logging.getLogger(__name__)

def sync_tools(tools_db, ToolConfig, storage_service, save_tools_json):
    """Synchronize tools across all storage systems"""
    try:
        # Get tools from primary storage (SQLite/Neo4j)
        tools = storage_service.get_tools()
        
        # Update in-memory cache
        tools_db_updated = [ToolConfig(**tool) for tool in tools]
        
        # Update JSON file (if still needed)
        save_tools_json([t.dict() for t in tools_db_updated])
        
        logger.info(f"Synchronized {len(tools)} tools across all storage systems")
        return tools_db_updated
    except Exception as e:
        logger.error(f"Failed to sync tools: {str(e)}")
        # Don't raise exception to avoid breaking app flow
        return tools_db