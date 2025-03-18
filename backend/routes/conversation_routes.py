from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from uuid import uuid4
from services.embedding_service import EmbeddingService
from services.memory_service import MemoryService
from services.sqlite_storage import SQLiteStorage
from datetime import datetime
import logging
import json
import os

# Set up logging
logger = logging.getLogger(__name__)

# Initialize storage service
# Check environment variable for Neo4j toggle (will be replaced by frontend setting later)
enable_neo4j = os.getenv("ENABLE_NEO4J", "false").lower() == "true"

if enable_neo4j:
    try:
        from services.neo4j_service import Neo4jService
        storage_service = Neo4jService()
        if not storage_service.driver:
            logger.warning("Failed to connect to Neo4j, falling back to SQLite")
            storage_service = SQLiteStorage()
            storage_service.initialize_schema()
    except Exception as e:
        logger.error(f"Error initializing Neo4j: {str(e)}, falling back to SQLite")
        storage_service = SQLiteStorage()
        storage_service.initialize_schema()
else:
    logger.info("Using SQLite for storage (Neo4j disabled)")
    storage_service = SQLiteStorage()
    storage_service.initialize_schema()

def get_storage_service():
    """Dependency provider for storage service"""
    try:
        yield storage_service
    finally:
        pass  # Connection kept open for app lifecycle

def get_embedding_service():
    service = EmbeddingService()
    return service

def get_memory_service():
    service = MemoryService()
    return service

router = APIRouter(prefix="/api/conversations", tags=["conversations"])

class MessageCreate(BaseModel):
    content: str
    role: str = "user"
    tool_id: Optional[str] = None
    metadata: dict = {}

class Message(BaseModel):
    id: str
    content: str
    role: str
    timestamp: str
    tool_id: Optional[str] = None
    metadata: dict = {}

class Conversation(BaseModel):
    id: str
    created_at: str
    updated_at: str
    messages: List[Message] = []

@router.post("", response_model=Conversation)
async def create_conversation(
    storage_service = Depends(get_storage_service)
):
    """Create a new conversation"""
    import datetime
    
    conversation_id = str(uuid4())
    result = storage_service.save_conversation(conversation_id)
    
    if not result:
        raise HTTPException(status_code=500, detail="Failed to create conversation")
    
    # Handle missing timestamps with defaults
    current_time = datetime.datetime.now(datetime.timezone.utc).isoformat()
    
    try:
        created_at = result["created_at"].iso_format() if hasattr(result["created_at"], "iso_format") else result.get("created_at", current_time)
    except (KeyError, AttributeError):
        created_at = current_time
        
    try:
        updated_at = result["updated_at"].iso_format() if hasattr(result["updated_at"], "iso_format") else result.get("updated_at", current_time)
    except (KeyError, AttributeError):
        updated_at = current_time
    
    return {
        "id": conversation_id,
        "created_at": created_at, 
        "updated_at": updated_at,
        "messages": []
    }

@router.post("/{conversation_id}/messages")
async def add_message(
    conversation_id: str,
    message: MessageCreate,
    storage_service = Depends(get_storage_service),
    memory_service: MemoryService = Depends(get_memory_service)
):
    """Add a message to a conversation and memory"""
    # Convert the message to a dict that can be properly serialized
    message_dict = {
        "id": str(uuid4()),
        "content": message.content,
        "role": message.role,
    }
    
    # Only add tool_id if it exists
    if message.tool_id:
        message_dict["tool_id"] = message.tool_id
        
    # Add metadata (which will be converted to JSON string)
    message_dict["metadata"] = message.metadata or {}
    
    # Save message to storage
    result = storage_service.save_message(conversation_id, message_dict)
    
    if not result:
        raise HTTPException(status_code=500, detail="Failed to save message - database error")
    
    # Add to memory service
    memory_metadata = {
        "conversation_id": conversation_id,
        "role": message.role,
        "tool_id": message.tool_id if message.tool_id else None,
        "timestamp": datetime.now().isoformat(),
        "metadata": message.metadata or {}
    }
    
    await memory_service.add_to_memory(message_dict["id"], message.content, memory_metadata)
    
    # Handle timestamp based on storage type
    timestamp = None
    if "timestamp" in result:
        if hasattr(result["timestamp"], "iso_format"):
            timestamp = result["timestamp"].iso_format()
        else:
            timestamp = result["timestamp"]
    
    if not timestamp:
        timestamp = datetime.now().isoformat()
    
    # Get metadata (it may be stored as a JSON string)
    metadata = {}
    if "metadata" in result:
        try:
            if isinstance(result["metadata"], str):
                metadata = json.loads(result["metadata"])
            else:
                metadata = result["metadata"]
        except:
            metadata = {}
    
    return {
        "id": message_dict["id"],
        "content": message.content,
        "role": message.role,
        "timestamp": timestamp,
        "tool_id": message.tool_id,
        "metadata": metadata
    }

@router.get("/{conversation_id}", response_model=Conversation)
async def get_conversation(
    conversation_id: str,
    storage_service = Depends(get_storage_service)
):
    """Get a conversation with all its messages"""
    # Get the conversation
    conversation = storage_service.get_conversation(conversation_id)
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Get messages
    messages = storage_service.get_conversation_messages(conversation_id)
    
    # Handle timestamps based on storage type
    if hasattr(conversation["created_at"], "iso_format"):
        created_at = conversation["created_at"].iso_format()
    else:
        created_at = conversation.get("created_at", datetime.now().isoformat())
        
    if hasattr(conversation["updated_at"], "iso_format"):
        updated_at = conversation["updated_at"].iso_format()
    else:
        updated_at = conversation.get("updated_at", datetime.now().isoformat())
    
    # Format messages
    formatted_messages = []
    for msg in messages:
        # Handle timestamp based on storage type
        if "timestamp" in msg:
            if hasattr(msg["timestamp"], "iso_format"):
                timestamp = msg["timestamp"].iso_format()
            else:
                timestamp = msg["timestamp"]
        else:
            timestamp = datetime.now().isoformat()
            
        # Handle metadata
        metadata = msg.get("metadata", {})
        if isinstance(metadata, str):
            try:
                metadata = json.loads(metadata)
            except:
                metadata = {}
                
        formatted_messages.append({
            "id": msg["id"],
            "content": msg["content"],
            "role": msg["role"],
            "timestamp": timestamp,
            "tool_id": msg.get("tool_id"),
            "metadata": metadata
        })
    
    return {
        "id": conversation_id,
        "created_at": created_at,
        "updated_at": updated_at,
        "messages": formatted_messages
    }
    
@router.get("/{conversation_id}/memory")
async def get_conversation_memory(
    conversation_id: str,
    query: str,
    limit: int = 5,
    memory_service: MemoryService = Depends(get_memory_service),
    storage_service = Depends(get_storage_service),
    embedding_service: EmbeddingService = Depends(get_embedding_service)
):
    """Get similar messages from conversation history based on query"""
    # Generate embedding for the query
    embedding = await embedding_service.generate_embedding(query)
    
    if not embedding:
        raise HTTPException(status_code=500, detail="Failed to generate embedding for query")
    
    # Find similar messages using memory service (already SQLite-based)
    messages = await memory_service.search_memory(query, conversation_id, limit)
    
    # Format messages for return
    formatted_messages = []
    for message in messages:
        # Convert datetime to string if present
        timestamp = message.get("timestamp")
        if timestamp:
            if hasattr(timestamp, "iso_format"):
                timestamp = timestamp.iso_format()
            else:
                timestamp = str(timestamp)
        
        formatted_messages.append({
            "id": message.get("id"),
            "content": message.get("content"),
            "role": message.get("role"),
            "timestamp": timestamp,
            "similarity": message.get("similarity", 0),
            "metadata": message.get("metadata", {})
        })
    
    return formatted_messages