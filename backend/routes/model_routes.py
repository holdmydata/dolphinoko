"""
Routes for model-related operations
"""
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
import os

# Import the Ollama service
from services.ollama_service import OllamaService
from utils.model_manager import OllamaModelManager

# Create router
router = APIRouter(
    prefix="/api/models",
    tags=["models"],
    responses={404: {"description": "Not found"}},
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

# Initialize model manager
model_manager = OllamaModelManager(
    base_url=os.getenv("OLLAMA_API_URL", "http://localhost:11434")
)

# Service dependencies
def get_ollama_service():
    return OllamaService(base_url="http://localhost:11434")

# Routes
@router.get("/ollama/status")
async def check_ollama_status():
    """Check if Ollama is running and responsive"""
    status = model_manager.check_ollama_status()
    return status

@router.get("/ollama/list")
async def list_ollama_models():
    """Get a list of all available Ollama models"""
    status = model_manager.check_ollama_status()
    if status["status"] != "online":
        raise HTTPException(status_code=503, detail="Ollama service is not available")
    
    models = model_manager.list_models()
    return {"models": models}

@router.post("/ollama/pull/{model_name}")
async def pull_ollama_model(model_name: str, background_tasks: BackgroundTasks):
    """Pull a new model from Ollama (runs in background)"""
    status = model_manager.check_ollama_status()
    if status["status"] != "online":
        raise HTTPException(status_code=503, detail="Ollama service is not available")
    
    # Start the pull in the background
    background_tasks.add_task(model_manager.pull_model, model_name)
    
    return {
        "status": "pulling",
        "model": model_name,
        "message": f"Started pulling model {model_name} in the background"
    }

@router.get("/ollama/info/{model_name}")
async def get_ollama_model_info(model_name: str):
    """Get information about a specific Ollama model"""
    status = model_manager.check_ollama_status()
    if status["status"] != "online":
        raise HTTPException(status_code=503, detail="Ollama service is not available")
    
    model_info = model_manager.get_model_info(model_name)
    if model_info is None:
        raise HTTPException(status_code=404, detail=f"Model '{model_name}' not found")
    
    return model_info

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