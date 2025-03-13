"""
Routes for chat functionality
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, Optional
from pydantic import BaseModel

# Import services
from services.ollama_service import OllamaService

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
@router.post("/ollama", response_model=ChatMessageResponse)
async def chat_with_ollama(
    request: ChatMessageRequest,
    ollama_service: OllamaService = Depends(get_ollama_service)
):
    """Generate a chat response using Ollama"""
    try:
        # Verify model exists
        model_exists = await ollama_service.check_model(request.model)
        if not model_exists:
            raise HTTPException(status_code=404, detail=f"Model '{request.model}' not found")
        
        # Generate response
        response = await ollama_service.generate(
            model=request.model,
            prompt=request.message,
            parameters=request.parameters
        )
        
        if "error" in response:
            raise HTTPException(status_code=500, detail=response["error"])
        
        return {
            "text": response["text"],
            "model": request.model,
            "metadata": response.get("metadata", {})
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate chat response: {str(e)}")