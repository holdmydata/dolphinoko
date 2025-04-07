from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import uuid
import time
import logging
import os
import json
import asyncio
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse, HTMLResponse, StreamingResponse, JSONResponse
from services.storage_service import load_tools as load_tools_json, save_tools as save_tools_json
from services.sqlite_storage import SQLiteStorage
from routes import chat_routes, conversation_routes
from utils.tool_sync import sync_tools
from routes.chat_routes import router as chat_router
from routes.conversation_routes import router as conversation_router
from routes.model_routes import router as model_router
from routes.tool_routes import router as tool_router
from routes.search_routes import router as search_router
from routes.mcp_routes import router as mcp_router
from routes.blender_routes import router as blender_router
import traceback

# Load environment variables from .env file
load_dotenv()

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
    db_tools = storage_service.get_tools()
    json_tools = load_tools_json()
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
app = FastAPI(title="Dolphinoko API", 
              description="API for Dolphinoko - The friendly farm of AI tools", 
              version="1.0.0")

# Pure MCP endpoint at root level for maximum compatibility
@app.api_route("/mcp", methods=["GET", "POST"])
async def root_mcp(request: Request):
    """Root MCP endpoint that handles all MCP requests"""
    try:
        logger.info(f"Root MCP endpoint accessed via {request.method}")
        
        # For GET requests, return info
        if request.method == "GET":
            logger.info("GET request to /mcp - returning info")
            return {
                "name": "Dolphinoko MCP",
                "version": "1.0.0",
                "capabilities": ["completion", "chat", "function_call"],
                "models": ["dolphin3:latest", "llama3:latest", "gemma:7b"],
                "api_version": "v1"
            }
        
        # For POST requests, process the JSON
        data = await request.json()
        logger.info(f"Root MCP endpoint received request: {json.dumps(data)[:200]}...")
        
        # Process request based on type
        request_type = data.get("type", "")
        
        if request_type == "info":
            # Return info about the service
            return {
                "name": "Dolphinoko MCP",
                "version": "1.0.0",
                "capabilities": ["completion", "chat", "function_call"],
                "models": ["dolphin3:latest", "llama3:latest", "gemma:7b"],
                "api_version": "v1"
            }
        elif request_type == "completion" or not request_type:
            # Simulate completion response
            return {
                "id": str(uuid.uuid4()),
                "object": "chat.completion",
                "created": int(time.time()),
                "model": data.get("model", "unknown"),
                "choices": [
                    {
                        "message": {
                            "role": "assistant",
                            "content": "This is a simulated response from the Dolphinoko MCP server."
                        },
                        "finish_reason": "stop"
                    }
                ],
                "usage": {
                    "prompt_tokens": 10,
                    "completion_tokens": 10,
                    "total_tokens": 20
                }
            }
        else:
            # Unknown request type
            return {
                "error": f"Unknown request type: {request_type}"
            }
    except Exception as e:
        logger.error(f"Error in root MCP endpoint: {str(e)}")
        # Return a friendly error for both GET and POST
        return JSONResponse(
            status_code=200,  # Use 200 instead of 500 to avoid unnecessary errors
            content={
                "name": "Dolphinoko MCP",
                "error": str(e),
                "message": "Error processing request, but the server is running"
            }
        )

# Direct streaming endpoint at the root level
@app.post("/stream")
async def root_stream_post(request: Request):
    """Root streaming endpoint (POST)"""
    logger.info("Root /stream endpoint accessed via POST")
    return await root_stream(request)

@app.get("/stream")
async def root_stream_get(request: Request):
    """Root streaming endpoint (GET)"""
    logger.info("Root /stream endpoint accessed via GET")
    return await root_stream(request)

async def root_stream(request: Request):
    """Direct streaming endpoint at root level"""
    logger.info("Root /stream endpoint accessed for streaming")
    
    # Set the response headers that Cursor expects
    response_headers = {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive", 
        "X-Accel-Buffering": "no"
    }
    
    # Cursor-formatted streaming response
    async def cursor_stream_generator():
        try:
            # Full response content
            content = "This is a direct response from the root streaming endpoint."
            
            # Generate a unique response ID
            response_id = f"chatcmpl-{uuid.uuid4()}"
            create_time = int(time.time())
            
            # Initial message with role
            initial_data = {
                "id": response_id,
                "object": "chat.completion.chunk",
                "created": create_time,
                "model": "default_model",
                "choices": [
                    {
                        "index": 0,
                        "delta": {
                            "role": "assistant"
                        },
                        "finish_reason": None
                    }
                ]
            }
            yield f"data: {json.dumps(initial_data)}\n\n"
            
            # Stream content word by word
            words = content.split()
            for word in words:
                await asyncio.sleep(0.05)  # Delay between words
                chunk_data = {
                    "id": response_id,
                    "object": "chat.completion.chunk",
                    "created": create_time,
                    "model": "default_model",
                    "choices": [
                        {
                            "index": 0,
                            "delta": {
                                "content": word + " "
                            },
                            "finish_reason": None
                        }
                    ]
                }
                yield f"data: {json.dumps(chunk_data)}\n\n"
            
            # Final chunk with finish reason
            final_data = {
                "id": response_id,
                "object": "chat.completion.chunk",
                "created": create_time,
                "model": "default_model",
                "choices": [
                    {
                        "index": 0,
                        "delta": {},
                        "finish_reason": "stop"
                    }
                ]
            }
            yield f"data: {json.dumps(final_data)}\n\n"
            
            # End the stream
            yield "data: [DONE]\n\n"
        except Exception as e:
            logger.error(f"Error in cursor stream generator: {str(e)}")
            logger.error(traceback.format_exc())
            error_data = {
                "error": {
                    "message": str(e),
                    "type": "server_error"
                }
            }
            yield f"data: {json.dumps(error_data)}\n\n"
            yield "data: [DONE]\n\n"
    
    # Return streaming response with correct content type
    return StreamingResponse(
        content=cursor_stream_generator(),
        media_type="text/event-stream",
        headers=response_headers
    )

# Add root endpoint with HTML landing page
@app.get("/", response_class=HTMLResponse)
async def root():
    """Root endpoint - HTML landing page with debug info"""
    logger.info("Root endpoint accessed, providing HTML landing page")
    
    html_content = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Dolphinoko MCP Server</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
            h1 { color: #2c3e50; }
            .endpoint { background: #f8f9fa; padding: 10px; border-radius: 4px; margin-bottom: 10px; }
            .button { display: inline-block; background: #3498db; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px; }
            pre { background: #f1f1f1; padding: 10px; overflow: auto; }
        </style>
    </head>
    <body>
        <h1>Dolphinoko MCP Server</h1>
        <p>This server is running properly. You can access the MCP endpoints below:</p>
        
        <div class="endpoint">
            <h3>MCP Info</h3>
            <a class="button" href="/mcp/info" target="_blank">View Info</a>
        </div>
        
        <div class="endpoint">
            <h3>MCP Test</h3>
            <a class="button" href="/mcp/test" target="_blank">Run Test</a>
        </div>
        
        <div class="endpoint">
            <h3>API Version Info</h3>
            <a class="button" href="/mcp/v1" target="_blank">View API Info</a>
        </div>
        
        <h2>Blender Integration</h2>
        <div class="endpoint">
            <h3>Blender Connection Status</h3>
            <a class="button" href="/blender/status" target="_blank">Check Status</a>
        </div>
        
        <div class="endpoint">
            <h3>Connect to Blender</h3>
            <a class="button" href="/blender/connect" target="_blank">Connect</a>
        </div>
        
        <p>Make sure you have the Blender addon installed and activated in Blender with the server running on port 9334.</p>
        
        <h2>For Cursor Integration</h2>
        <p>Use this configuration in your <code>mcp.json</code>:</p>
        <pre>
{
  "mcpServers": {
    "dolphinoko": {
      "host": "127.0.0.1",
      "port": 8080,
      "url": "http://127.0.0.1:8080"
    }
  }
}
        </pre>
    </body>
    </html>
    """
    
    return HTMLResponse(content=html_content)

# Include routers
app.include_router(chat_router)
app.include_router(conversation_router)
app.include_router(model_router)
app.include_router(tool_router)
app.include_router(search_router)
app.include_router(mcp_router)
app.include_router(blender_router)

# Expanded CORS settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://192.168.0.249:3000"],  # Specific origins instead of wildcard
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
    expose_headers=["Content-Type", "Content-Length", "Content-Disposition"],
    max_age=600,  # Cache preflight requests for 10 minutes
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

def reload_tools_from_storage():
    """Reload tools from storage into in-memory DB"""
    global tools_db
    try:
        # Get tools from storage
        stored_tools = storage_service.get_tools()
        
        # Update in-memory cache
        tools_db = [ToolConfig(**tool) for tool in stored_tools]
        
        logger.info(f"Reloaded {len(tools_db)} tools from storage")
        return tools_db
    except Exception as e:
        logger.error(f"Failed to reload tools from storage: {str(e)}")
        return tools_db

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
    
    # Save to storage service only
    tool_dict = new_tool.dict()
    storage_service.save_tool(tool_dict)
    
    # Update in-memory cache from storage
    reload_tools_from_storage()
    
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
    global tools_db
    
    # Find the tool to get its created_at
    tool = next((t for t in tools_db if t.id == tool_id), None)
    if tool is None:
        raise HTTPException(status_code=404, detail="Tool not found")
    
    # Update timestamps
    timestamp = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    
    # Create updated tool dict
    tool_dict = updated_tool.dict(exclude_unset=True)
    tool_dict["id"] = tool_id
    tool_dict["created_at"] = tool.created_at
    tool_dict["updated_at"] = timestamp
    
    # Save to storage
    result = storage_service.save_tool(tool_dict)
    
    if not result:
        raise HTTPException(status_code=500, detail="Failed to update tool")
    
    # Sync from storage - single source of truth approach
    tools_db = sync_tools(tools_db, ToolConfig, storage_service, save_tools_json)
    
    # Get the updated tool from the synced data
    updated = next((t for t in tools_db if t.id == tool_id), None)
    
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
        
        # Create service instance with explicit URL
        service = OllamaService(base_url="http://localhost:11434")
        
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
    
@app.get("/api/debug/ollama-status")
async def check_ollama_status():
    """Check the status of the Ollama connection"""
    try:
        from services.ollama_service import OllamaService
        service = OllamaService(base_url="http://localhost:11434") 
        
        # Log the base URL being used
        logger.info(f"Debug: OllamaService using base URL: {service.base_url}")
        
        # Test environment variable
        env_value = os.getenv("OLLAMA_API_URL", "Not set")
        logger.info(f"Debug: OLLAMA_API_URL from environment: {env_value}")
        
        # Check Ollama connectivity
        models = await service.list_models()
        
        if models:
            return {
                "status": "online",
                "base_url": service.base_url,
                "env_url": env_value,
                "model_count": len(models),
                "models": [m.get("name") for m in models[:5]] if len(models) > 0 else []
            }
        else:
            return {
                "status": "online_no_models",
                "base_url": service.base_url,
                "env_url": env_value,
                "message": "Connected to Ollama, but no models found."
            }
    except Exception as e:
        logger.error(f"Error checking Ollama status: {str(e)}")
        return {
            "status": "error",
            "base_url": "http://localhost:11434",
            "env_url": os.getenv("OLLAMA_API_URL", "Not set"),
            "error": str(e)
        }

# Run the app
if __name__ == "__main__":
    import uvicorn
    # Use environment variable for port or default to 8080
    port = int(os.getenv("API_PORT", "8080"))
    logger.info(f"Starting server on port {port}")
    uvicorn.run(app, host="0.0.0.0", port=port)