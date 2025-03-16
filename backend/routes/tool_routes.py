from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, Any, Optional, List
import logging

# Set up logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/api/tools", tags=["tools"])

# Request model for tool execution
class ToolExecutionRequest(BaseModel):
    tool_id: str
    input: Any  # Can be string or structured data
    parameters: Optional[Dict[str, Any]] = None

# Response model for tool execution
class ToolExecutionResponse(BaseModel):
    tool_id: str
    input: Any
    output: str
    metadata: Dict[str, Any] = {}

# Get tools function (assuming you have one)
def get_tools_db():
    # This should return your tools database
    # You might need to adjust this based on how your tools are stored
    from main import tools_db
    return tools_db

@router.post("/execute", response_model=ToolExecutionResponse)
async def execute_tool(
    request: ToolExecutionRequest,
    tools_db = Depends(get_tools_db)
):
    """Execute a tool with the given input"""
    try:
        # Find the tool
        tool = next((t for t in tools_db if t.id == request.tool_id), None)
        if not tool:
            raise HTTPException(status_code=404, detail=f"Tool with ID '{request.tool_id}' not found")
        
        # Format the input based on the tool's template
        if isinstance(request.input, str):
            # Simple string input
            formatted_prompt = tool.prompt_template.replace("{input}", request.input)
        else:
            # Structured input
            formatted_prompt = tool.prompt_template
            # Replace each {input.field} with the corresponding value
            for key, value in request.input.items():
                formatted_prompt = formatted_prompt.replace(f"{{input.{key}}}", str(value))
        
        # Get parameters or use defaults
        parameters = request.parameters or tool.parameters
        
        # Execute the tool based on its provider
        if tool.provider == "ollama":
            from services.ollama_service import generate_with_ollama
            result = await generate_with_ollama(formatted_prompt, tool.model, parameters)
        elif tool.provider == "anthropic":
            # Import your anthropic service if implemented
            from services.anthropic_service import generate_with_anthropic
            result = await generate_with_anthropic(formatted_prompt, tool.model, parameters)
        else:
            # Fallback for unknown providers
            raise HTTPException(status_code=400, detail=f"Provider '{tool.provider}' is not supported")
        
        # Return response
        return {
            "tool_id": request.tool_id,
            "input": request.input,
            "output": result["output"],
            "metadata": result["metadata"]
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error executing tool: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to execute tool: {str(e)}")