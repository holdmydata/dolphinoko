# backend/routes/tool_routes.py
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, Any, Optional, List
import logging
from uuid import uuid4
from datetime import datetime
import os

# Import your services
from services.memory_service import MemoryService
from services.ollama_service import OllamaService
from services.sqlite_storage import SQLiteStorage
from services.storage_service import load_tools, save_tools
from utils.tool_sync import sync_tools

# Set up logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/api/tools", tags=["tools"])

# Request model for tool execution
class ToolExecutionRequest(BaseModel):
    tool_id: str
    input: Any  # Can be string or structured data
    parameters: Optional[Dict[str, Any]] = None
    conversation_id: Optional[str] = None  # Add conversation_id for memory tracking

# Response model for tool execution
class ToolExecutionResponse(BaseModel):
    tool_id: str
    input: Any
    output: str
    metadata: Dict[str, Any] = {}
    message_id: Optional[str] = None  # Return message ID if saved to conversation

# Request model for tool creation
class ToolCreationRequest(BaseModel):
    name: str
    description: str
    provider: str = "ollama"  # Default to ollama, but support others
    model: Optional[str] = None  # Required for ollama, optional for others
    prompt_template: str
    parameters: Optional[Dict[str, Any]] = None
    input_schema: Optional[Dict[str, Any]] = None  # JSON Schema for structured input
    dependencies: Optional[List[str]] = None  # List of other tool IDs this tool depends on
    category: Optional[str] = None  # For organizing tools
    metadata: Optional[Dict[str, Any]] = None  # Additional metadata for future use

# Initialize storage service
# Check environment variable for Neo4j toggle (will be replaced by frontend setting later)
enable_neo4j = os.getenv("ENABLE_NEO4J", "false").lower() == "true"

# Dependency functions
def get_storage_service():
    """Dependency to get the storage service"""
    if enable_neo4j:
        try:
            from services.neo4j_service import Neo4jService
            service = Neo4jService()
            if not service.driver:
                logger.warning("Failed to connect to Neo4j, falling back to SQLite")
                return SQLiteStorage()
            return service
        except Exception as e:
            logger.error(f"Error initializing Neo4j: {str(e)}, falling back to SQLite")
            return SQLiteStorage()
    else:
        return SQLiteStorage()

def get_memory_service():
    service = MemoryService()
    yield service

def get_ollama_service():
    """Dependency to get the Ollama service"""
    return OllamaService(base_url="http://localhost:11434")

# Get tools function using storage_service
@router.get("", response_model=List[Dict[str, Any]])
def get_tools(storage_service = Depends(get_storage_service)):
    """Get all tools from storage"""
    return storage_service.get_tools()

@router.post("/execute", response_model=ToolExecutionResponse)
async def execute_tool(
    request: ToolExecutionRequest,
    storage_service = Depends(get_storage_service),
    memory_service: MemoryService = Depends(get_memory_service),
    ollama_service: OllamaService = Depends(get_ollama_service)
):
    """Execute a tool with the given input"""
    try:
        # Get all tools
        tools = storage_service.get_tools()
        
        # Find the tool
        tool = next((t for t in tools if t["id"] == request.tool_id), None)
        if not tool:
            raise HTTPException(status_code=404, detail=f"Tool with ID '{request.tool_id}' not found")
        
        # Format the input based on the tool's template
        formatted_prompt = tool["prompt_template"]
        input_str = ""  # Store original input as string for memory
        
        if isinstance(request.input, str):
            # Simple string input
            formatted_prompt = formatted_prompt.replace("{input}", request.input)
            input_str = request.input
        else:
            # Structured input
            input_str = str(request.input)  # Convert to string for memory
            # Replace each {input.field} with the corresponding value
            if isinstance(request.input, dict):
                for key, value in request.input.items():
                    placeholder = f"{{input.{key}}}"
                    if placeholder in formatted_prompt:
                        formatted_prompt = formatted_prompt.replace(placeholder, str(value))
        
        # Get parameters or use defaults
        parameters = request.parameters or tool["parameters"]
        
        # Execute the tool based on its provider
        if tool["provider"] == "ollama":
            # Pass conversation_id if available
            result = await ollama_service.generate_with_memory(
                model=tool["model"],
                prompt=formatted_prompt,
                conversation_id=request.conversation_id,
                memory_service=memory_service if request.conversation_id else None,
                parameters=parameters
            )
            
            # Check for model fallback info
            original_model = tool["model"]
            if "error" in result:
                # Handle error case
                output = f"Error: {result.get('error', 'Unknown error')}"
                metadata = {
                    "error": True,
                    "original_model": original_model
                }
            else:
                output = result.get("output", "") or result.get("text", "")
                metadata = result.get("metadata", {})
                
                # Add model fallback notice if the model used is different from requested
                if metadata.get("model") and metadata.get("model") != original_model:
                    output = f"[Note: Using {metadata.get('model')} instead of {original_model}]\n\n{output}"
                    metadata["model_fallback"] = True
                    metadata["original_model"] = original_model
        elif tool["provider"] == "anthropic":
            # Import your anthropic service if implemented
            # This is a placeholder for your Anthropic implementation
            raise HTTPException(status_code=400, detail="Anthropic provider not implemented")
        else:
            # Fallback for unknown providers
            raise HTTPException(status_code=400, detail=f"Provider '{tool['provider']}' is not supported")
        
        
        # Create a response
        response = {
            "tool_id": request.tool_id,
            "input": request.input,
            "output": output,
            "metadata": metadata
        }
        
        # If conversation_id is provided, save to conversation and memory
        if request.conversation_id:
            # Create user message (the input)
            user_message_id = str(uuid4())
            user_message = {
                "id": user_message_id,
                "content": input_str,
                "role": "user",
                "tool_id": request.tool_id
            }
            
            # Create assistant message (the output)
            assistant_message_id = str(uuid4())
            assistant_message = {
                "id": assistant_message_id,
                "content": output,
                "role": "assistant",
                "tool_id": request.tool_id,
                "metadata": {
                    "tool_execution": {
                        "model": tool["model"],
                        "provider": tool["provider"],
                        "execution_time": metadata.get("total_duration", 0)
                    }
                }
            }
            
            # Save to storage service
            storage_service.save_message(request.conversation_id, user_message)
            storage_service.save_message(request.conversation_id, assistant_message)
            
            # Save to memory
            timestamp = datetime.now().isoformat()
            
            # User message memory metadata
            user_memory_metadata = {
                "conversation_id": request.conversation_id,
                "role": "user",
                "tool_id": request.tool_id,
                "timestamp": timestamp
            }
            
            # Assistant message memory metadata
            assistant_memory_metadata = {
                "conversation_id": request.conversation_id,
                "role": "assistant",
                "tool_id": request.tool_id,
                "timestamp": timestamp,
                "execution_metadata": metadata
            }
            
            # Add to memory
            await memory_service.add_to_memory(user_message_id, input_str, user_memory_metadata)
            await memory_service.add_to_memory(assistant_message_id, output, assistant_memory_metadata)
            
            # Include message ID in response
            response["message_id"] = assistant_message_id
            
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error executing tool: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to execute tool: {str(e)}")
    
@router.post("/sync", response_model=Dict[str, Any])
async def force_sync_tools():
    """Force synchronization of tools across storage systems"""
    # Get reference to the global tools_db from main
    from main import tools_db, ToolConfig, storage_service, save_tools_json
    
    # Call sync and update the global variable in main
    updated_tools_db = sync_tools(tools_db, ToolConfig, storage_service, save_tools_json)
    
    # Update the global variable in main
    import main
    main.tools_db = updated_tools_db
    
    return {"success": True, "tools_count": len(updated_tools_db)}

@router.post("/create", response_model=Dict[str, Any])
async def create_tool(
    request: ToolCreationRequest,
    storage_service = Depends(get_storage_service),
    ollama_service: OllamaService = Depends(get_ollama_service)
):
    """Create a new tool with support for structured inputs and dependencies"""
    try:
        # Validate provider-specific requirements
        if request.provider == "ollama":
            if not request.model:
                raise HTTPException(
                    status_code=400,
                    detail="Model name is required for Ollama provider"
                )
            
            # Check if the model exists in Ollama
            model_exists = await ollama_service.check_model(request.model)
            if not model_exists:
                # Get available models
                available_models = await ollama_service.list_models()
                model_names = [m.get("name") for m in available_models if m.get("name")]
                
                # Return a helpful error with available models
                raise HTTPException(
                    status_code=400,
                    detail={
                        "message": f"Model '{request.model}' not found in Ollama",
                        "available_models": model_names
                    }
                )
        
        # Generate a unique ID for the tool
        tool_id = str(uuid4())
        
        # Create the tool object
        tool = {
            "id": tool_id,
            "name": request.name,
            "description": request.description,
            "provider": request.provider,
            "model": request.model,
            "prompt_template": request.prompt_template,
            "parameters": request.parameters or {},
            "input_schema": request.input_schema,
            "dependencies": request.dependencies or [],
            "category": request.category,
            "metadata": request.metadata or {},
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        
        # Save to storage
        storage_service.save_tool(tool)
        
        # Log the creation
        logger.info(f"Created new tool: {tool_id} ({request.name})")
        
        return {
            "success": True,
            "tool_id": tool_id,
            "message": f"Tool '{request.name}' created successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating tool: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create tool: {str(e)}"
        )

@router.get("/models", response_model=List[Dict[str, Any]])
async def list_available_models(
    ollama_service: OllamaService = Depends(get_ollama_service)
):
    """List available models that can be used in tools"""
    try:
        # Get models from Ollama
        ollama_models = await ollama_service.list_models()
        
        # Format response with additional info for UI
        formatted_models = []
        for model in ollama_models:
            formatted_models.append({
                "id": model.get("name"),
                "name": model.get("name"),
                "provider": "ollama",
                "size": model.get("size"),
                "parameter_size": model.get("details", {}).get("parameter_size", "Unknown"),
                "family": model.get("details", {}).get("family", "Unknown"),
                "modified_at": model.get("modified_at")
            })
        
        return formatted_models
    except Exception as e:
        logger.error(f"Error listing models: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to list models: {str(e)}")

@router.get("/providers", response_model=List[Dict[str, Any]])
async def list_tool_providers():
    """List available tool providers and their capabilities"""
    # Return list of supported providers
    providers = [
        {
            "id": "ollama",
            "name": "Ollama",
            "description": "Local LLM provider for text generation",
            "supports_streaming": True,
            "requires_model": True,
            "status": "active"
        },
        {
            "id": "shell",
            "name": "Shell Commands",
            "description": "Execute shell commands (requires special permissions)",
            "supports_streaming": True,
            "requires_model": False,
            "status": "planned"
        },
        {
            "id": "python",
            "name": "Python Scripts",
            "description": "Execute Python code snippets",
            "supports_streaming": False,
            "requires_model": False,
            "status": "planned"
        }
    ]
    
    return providers