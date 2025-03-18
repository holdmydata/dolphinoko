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
    except Exception as e:
        logger.error(f"Error initializing Neo4j: {str(e)}, falling back to SQLite")
        storage_service = SQLiteStorage()
else:
    storage_service = SQLiteStorage()
    storage_service.initialize_schema()

# Service dependencies
def get_storage_service():
    """Dependency provider for storage service"""
    try:
        yield storage_service
    finally:
        pass  # Connection kept open for app lifecycle

def get_memory_service():
    service = MemoryService()
    yield service

def get_ollama_service():
    service = OllamaService()
    yield service

# Get tools function using storage_service
@router.get("", response_model=List[Dict[str, Any]])
def get_tools():
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
            result = await ollama_service.generate_with_ollama(
                prompt=formatted_prompt,
                model=tool["model"],
                parameters=parameters,
                conversation_id=request.conversation_id,
                memory_service=memory_service if request.conversation_id else None
            )
            output = result.get("output", "")
            metadata = result.get("metadata", {})
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