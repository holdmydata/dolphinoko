"""
Routes for chat functionality
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, Optional
from pydantic import BaseModel

# Import services
from services.ollama_service import OllamaService
from services.memory_service import MemoryService

# Create router
router = APIRouter(
    prefix="/api/chat",
    tags=["chat"],
)

# Models for requests and responses
class ChatMessageRequest(BaseModel):
    model: str
    message: str
    parameters: Optional[Dict[str, Any]] = None

class ChatMessageResponse(BaseModel):
    text: str
    model: str
    metadata: Optional[Dict[str, Any]] = None

# Service dependencies
def get_ollama_service():
    return OllamaService()

# Routes
@router.post("/api/chat/ollama")
async def chat_with_ollama(
    request: dict,
    memory_service: MemoryService = Depends(MemoryService.get_memory_service)
):
    """Chat with Ollama model with memory integration"""
    model = request.get("model")
    message = request.get("message")
    conversation_id = request.get("conversation_id")
    parameters = request.get("parameters", {})
    
    if not model or not message:
        raise HTTPException(status_code=400, detail="Model and message are required")
    
    try:
        # Create Ollama service
        ollama_service = OllamaService()
        
        # Generate response with memory if conversation_id is provided
        if conversation_id:
            result = await ollama_service.generate_with_memory(
                model, 
                message, 
                conversation_id, 
                memory_service, 
                parameters
            )
        else:
            result = await ollama_service.generate(model, message, parameters)
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

