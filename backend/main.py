from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import uuid
import time
import logging
import os
from fastapi.middleware.cors import CORSMiddleware
from services.storage_service import load_tools as load_tools_json, save_tools as save_tools_json
from services.sqlite_storage import SQLiteStorage

from routes.chat_routes import router as chat_router
from routes.conversation_routes import router as conversation_router
from routes.model_routes import router as model_router
from routes.tool_routes import router as tool_router

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize storage service based on configuration
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
        else:
            storage_service.initialize_schema()
            logger.info("Successfully initialized Neo4j schema")
    except Exception as e:
        logger.error(f"Error initializing Neo4j: {str(e)}, falling back to SQLite")
        storage_service = SQLiteStorage()
        storage_service.initialize_schema()
else:
    logger.info("Using SQLite for storage (Neo4j disabled)")
    storage_service = SQLiteStorage()
    storage_service.initialize_schema()
    
try:
    # Check if we already have tools in the storage
    existing_tools = storage_service.get_tools()
    
    if not existing_tools:
        logger.info("No tools found in database, loading from JSON file")
        
        # Load tools from JSON file
        json_tools = load_tools_json()
        
        # Save each tool to the database
        for tool in json_tools:
            storage_service.save_tool(tool)
            
        logger.info(f"Loaded {len(json_tools)} tools from JSON into database")
    else:
        logger.info(f"Found {len(existing_tools)} tools in database")
except Exception as e:
    logger.error(f"Error loading tools into database: {str(e)}")
    

# Create FastAPI app
app = FastAPI()
app.include_router(chat_router)
app.include_router(conversation_router)
app.include_router(model_router)
app.include_router(tool_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://0.0.0.0:7687", "http://localhost:8000"],  # Add your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define the models
class ToolConfig(BaseModel):
    id: Optional[str] = None
    name: str
    description: str
    provider: str
    model: str
    prompt_template: str
    parameters: dict = {}
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class LLMRequest(BaseModel):
    tool_id: str
    input: str
    parameters: Optional[dict] = None

class LLMResponse(BaseModel):
    tool_id: str
    input: str
    output: str
    metadata: dict = {}

# Load tools from JSON storage
_tools_data = load_tools_json()
tools_db: List[ToolConfig] = [ToolConfig(**tool) for tool in _tools_data]
logger.info(f"Loaded {len(tools_db)} tools from storage")

# Endpoint to get storage configuration
@app.get("/api/system/config")
async def get_system_config():
    """Get system configuration - useful for frontend to know what's enabled"""
    return {
        "storage": {
            "type": "neo4j" if enable_neo4j else "sqlite",
            "neo4j_enabled": enable_neo4j
        },
        "version": "0.1.0"
    }

# Tool endpoints
@app.get("/api/tools")
async def get_tools():
    logger.info(f"Returning {len(tools_db)} tools")
    return tools_db

@app.post("/api/tools")
async def create_tool(tool: ToolConfig):
    # Simple validation
    if any(t.name == tool.name for t in tools_db):
        raise HTTPException(status_code=400, detail="Tool with this name already exists")
    
    # Generate ID and timestamps
    timestamp = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    
    # Make sure to set the ID before saving
    new_tool = ToolConfig(
        id=str(uuid.uuid4()),  # Generate a new UUID
        name=tool.name,
        description=tool.description,
        provider=tool.provider,
        model=tool.model,
        prompt_template=tool.prompt_template,
        parameters=tool.parameters,
        created_at=timestamp,
        updated_at=timestamp
    )
    
    # Add to database
    tools_db.append(new_tool)
    
    # Save to JSON file
    save_tools_json([t.dict() for t in tools_db])
    
    # Also save to persistent storage
    tool_dict = new_tool.dict()
    storage_service.save_tool(tool_dict)
    
    logger.info(f"Created tool with ID: {new_tool.id}")
    logger.info(f"Tools in DB now: {len(tools_db)}")
    
    return new_tool

@app.get("/api/tools/{tool_id}")
async def get_tool(tool_id: str):
    tool = next((t for t in tools_db if t.id == tool_id), None)
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")
    return tool

@app.put("/api/tools/{tool_id}")
async def update_tool(tool_id: str, updated_tool: ToolConfig):
    # Find the tool
    tool_index = next((i for i, t in enumerate(tools_db) if t.id == tool_id), None)
    if tool_index is None:
        raise HTTPException(status_code=404, detail="Tool not found")
    
    # Update timestamps
    timestamp = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    
    # Create updated tool with original ID and creation date
    tool_dict = updated_tool.dict()
    tool_dict["id"] = tool_id
    tool_dict["created_at"] = tools_db[tool_index].created_at
    tool_dict["updated_at"] = timestamp
    
    updated = ToolConfig(**tool_dict)
    
    # Update in database
    tools_db[tool_index] = updated
    
    # Save to JSON file
    save_tools_json([t.dict() for t in tools_db])
    
    # Also update in persistent storage
    storage_service.save_tool(tool_dict)
    
    logger.info(f"Updated tool with ID: {tool_id}")
    
    return updated

@app.delete("/api/tools/{tool_id}")
async def delete_tool(tool_id: str):
    # Find the tool
    tool_index = next((i for i, t in enumerate(tools_db) if t.id == tool_id), None)
    if tool_index is None:
        raise HTTPException(status_code=404, detail="Tool not found")
    
    # Remove from database
    deleted = tools_db.pop(tool_index)
    
    # Save to JSON file
    save_tools_json([t.dict() for t in tools_db])
    
    logger.info(f"Deleted tool with ID: {tool_id}")
    
    return {"id": tool_id, "name": deleted.name, "deleted": True}

# LLM endpoints
@app.post("/api/llm/generate")
async def generate_llm_response(request: LLMRequest):
    # Find the tool
    logger.info(f"Looking for tool ID: {request.tool_id}")
    logger.info(f"Available tools: {[t.id for t in tools_db]}")
    
    tool = next((t for t in tools_db if t.id == request.tool_id), None)
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")
    
    try:
        # Log request
        logger.info(f"Processing request with tool: {tool.name}")
        
        # Format the prompt using the tool's template
        formatted_prompt = tool.prompt_template.replace("{input}", request.input)
        
        # Get parameters from request or use tool defaults
        parameters = request.parameters or tool.parameters
        
        # Determine which provider to use
        if tool.provider == "ollama":
            from services.ollama_service import generate_with_ollama
            result = await generate_with_ollama(formatted_prompt, tool.model, parameters)
        elif tool.provider == "anthropic":
            # Import your anthropic service if implemented
            from services.anthropic_service import generate_with_anthropic
            result = await generate_with_anthropic(formatted_prompt, tool.model, parameters)
        else:
            # Fallback for unknown providers
            result = {
                "output": f"Provider {tool.provider} is not supported.",
                "metadata": {
                    "provider": tool.provider,
                    "model": tool.model,
                    "processing_time": 0
                }
            }
        
        # Create response
        response = LLMResponse(
            tool_id=request.tool_id,
            input=request.input,
            output=result["output"],
            metadata=result["metadata"]
        )
        
        return response
    except Exception as e:
        # Log error
        logger.error(f"Error processing LLM request: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing request: {str(e)}")

# Model endpoints
@app.get("/api/models/ollama")
async def get_ollama_models():
    """Get available Ollama models"""
    try:
        from services.ollama_service import OllamaService
        
        # Create service instance
        service = OllamaService()
        
        # Get models
        models = await service.list_models()
        
        # Return in expected format
        return {"models": models}
    except Exception as e:
        logger.error(f"Error getting Ollama models: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get Ollama models: {str(e)}"
        )

@app.post("/api/models/ollama/pull")
async def pull_ollama_model(request: dict):
    """Pull a new Ollama model"""
    model_name = request.get("name")
    if not model_name:
        raise HTTPException(status_code=400, detail="Model name is required")
    
    try:
        from services.ollama_service import OllamaService
        
        # Create service instance
        service = OllamaService()
        
        # Pull model
        success = service.pull_model(model_name)
        
        if success:
            return {"success": True, "message": f"Successfully pulled model {model_name}"}
        else:
            return {"success": False, "message": f"Failed to pull model {model_name}"}
    except Exception as e:
        logger.error(f"Error pulling Ollama model: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to pull model: {str(e)}"
        )
        
@app.post("/api/tools/reload")
async def reload_tools():
    """Reload tools from JSON file without server restart"""
    global tools_db  # Use the global variable
    
    try:
        # Force reload of tools from JSON file
        _tools_data = load_tools_json()
        tools_db = [ToolConfig(**tool) for tool in _tools_data]
        
        logger.info(f"Reloaded {len(tools_db)} tools from storage")
        return {"success": True, "tools_count": len(tools_db)}
    except Exception as e:
        logger.error(f"Failed to reload tools: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to reload tools: {str(e)}") 

# Run the app
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)