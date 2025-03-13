"""
Routes for model-related operations
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

# Import the Ollama service
from services.ollama_service import OllamaService

# Create router
router = APIRouter(
    prefix="/api/models",
    tags=["models"],
)

# Models for requests and responses
class ModelInfo(BaseModel):
    name: str
    size: Optional[int] = None
    modified_at: Optional[str] = None
    details: Optional[Dict[str, Any]] = None

class ModelListResponse(BaseModel):
    models: List[ModelInfo]

class ModelPullRequest(BaseModel):
    name: str

class ModelPullResponse(BaseModel):
    success: bool
    message: str

# Service dependencies
def get_ollama_service():
    return OllamaService()

# Routes
@router.get("/ollama", response_model=ModelListResponse)
async def list_ollama_models(
    ollama_service: OllamaService = Depends(get_ollama_service)
):
    """List all available Ollama models"""
    try:
        models = await ollama_service.list_models()
        return {"models": models}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list models: {str(e)}")

@router.post("/ollama/pull", response_model=ModelPullResponse)
def pull_ollama_model(
    request: ModelPullRequest,
    ollama_service: OllamaService = Depends(get_ollama_service)
):
    """Pull a new model from Ollama"""
    try:
        success = ollama_service.pull_model(request.name)
        
        if success:
            return {"success": True, "message": f"Successfully pulled model {request.name}"}
        else:
            return {"success": False, "message": f"Failed to pull model {request.name}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to pull model: {str(e)}")

@router.get("/ollama/check/{model_name}")
async def check_ollama_model(
    model_name: str,
    ollama_service: OllamaService = Depends(get_ollama_service)
):
    """Check if a model exists in Ollama"""
    try:
        exists = await ollama_service.check_model(model_name)
        return {"exists": exists}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to check model: {str(e)}")