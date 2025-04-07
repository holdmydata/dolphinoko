"""
MCP Protocol API Routes
"""
from fastapi import APIRouter, HTTPException, Request, Response
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel
from typing import List, Dict, Any, Optional, AsyncGenerator
import logging
import json
import asyncio
from services.mcp_service import MCPService
from services.ollama_service import OllamaService
import traceback
import uuid
import time

# Set up logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/mcp", tags=["mcp"])

# Initialize MCP service
mcp_service = MCPService()

# Models
class CompletionRequest(BaseModel):
    model: str
    messages: List[Dict[str, Any]]
    max_tokens: Optional[int] = 1000
    temperature: Optional[float] = 0.7
    stream: Optional[bool] = False

class FunctionCallRequest(BaseModel):
    model: str
    messages: List[Dict[str, Any]]
    functions: List[Dict[str, Any]]
    max_tokens: Optional[int] = 1000
    temperature: Optional[float] = 0.7

# Streaming utilities
async def stream_generator(model: str, messages: List[Dict[str, Any]], max_tokens: int, temperature: float) -> AsyncGenerator[str, None]:
    """Generate a streaming response compatible with SSE"""
    try:
        # Log streaming request
        logger.info(f"Starting stream for model: {model}")
        
        # Simple content to stream
        content = f"Hello! This is a streaming response from {model}."
        
        # Stream content character by character
        for char in content:
            await asyncio.sleep(0.02)  # Small delay
            yield f"data: {char}\n\n"
        
        # End the stream
        yield "data: [DONE]\n\n"
    except Exception as e:
        logger.error(f"Error in stream_generator: {str(e)}")
        yield f"data: Error: {str(e)}\n\n"
        yield "data: [DONE]\n\n"

# Dedicated streaming endpoint
@router.post("/v1/chat/completions/stream")
async def stream_chat_completions(request: CompletionRequest):
    """Streaming chat completions endpoint using SSE"""
    logger.info(f"Streaming request for model: {request.model}")
    
    # Set response headers
    response_headers = {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no"
    }
    
    return StreamingResponse(
        stream_generator(
            model=request.model,
            messages=request.messages,
            max_tokens=request.max_tokens,
            temperature=request.temperature
        ),
        media_type="text/event-stream",
        headers=response_headers
    )

# Updated chat completions to handle streaming requests
@router.post("/v1/chat/completions")
async def chat_completions(request: CompletionRequest):
    """Standard chat completions endpoint with stream support"""
    try:
        logger.info(f"Received chat completion request for model: {request.model}")
        
        # Check if streaming is requested
        if request.stream:
            logger.info("Streaming requested, redirecting to streaming endpoint")
            return await stream_chat_completions(request)
        
        # Non-streaming request
        result = await mcp_service.handle_chat_completion(request.dict())
        return result
    except Exception as e:
        logger.error(f"Error in chat completions: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Root MCP endpoint
@router.get("/")
async def mcp_root():
    """Root MCP endpoint to help Cursor find the service"""
    logger.info("MCP root endpoint accessed, returning info")
    return await mcp_info()

# API version root
@router.get("/v1")
async def v1_root():
    """API version root endpoint"""
    logger.info("MCP v1 root endpoint accessed")
    return {
        "endpoints": [
            "/completions",
            "/chat/completions",
            "/functions"
        ],
        "version": "v1"
    }

# Shortcut completions endpoint (no /v1 prefix)
@router.post("/completions")
async def direct_completions(request: CompletionRequest):
    """Direct completions endpoint without /v1 prefix"""
    logger.info(f"Direct completions endpoint called for model: {request.model}")
    return await completions(request)

# Special endpoint for handling raw JSON requests
@router.post("/raw")
async def raw_request(request: Request):
    """Handle raw JSON requests for maximum flexibility"""
    try:
        data = await request.json()
        logger.info(f"Raw request received: {json.dumps(data)[:200]}...")
        
        # Determine the type of request based on content
        if "messages" in data:
            if "functions" in data:
                result = await mcp_service.handle_function_call(data)
            else:
                result = await mcp_service.handle_completion(data)
        else:
            # Default to completion
            result = await mcp_service.handle_completion(data)
            
        return JSONResponse(content=result)
    except Exception as e:
        logger.error(f"Error processing raw request: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )

# Test endpoint
@router.get("/test")
async def test_mcp_connection():
    """Test endpoint to verify MCP router is connected"""
    return {
        "status": "ok",
        "message": "MCP router is working correctly",
        "timestamp": str(__import__("datetime").datetime.now())
    }

@router.post("/v1/completions")
async def completions(request: CompletionRequest):
    """Standard completions endpoint"""
    try:
        logger.info(f"Received completion request for model: {request.model}")
        result = await mcp_service.handle_completion(request.dict())
        return result
    except Exception as e:
        logger.error(f"Error in completions: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/v1/functions")
async def function_call(request: FunctionCallRequest):
    """Function call endpoint"""
    try:
        logger.info(f"Received function call request for model: {request.model}")
        result = await mcp_service.handle_function_call(request.dict())
        return result
    except Exception as e:
        logger.error(f"Error in function call: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# MCP-specific endpoints required by Cursor
@router.get("/info")
async def mcp_info():
    """Return MCP protocol information"""
    try:
        # Get available models from Ollama
        ollama_service = OllamaService()
        models = await ollama_service.list_models()
        
        # Extract model names
        model_names = [model.get("name") for model in models]
        
        # If no models found, provide some default examples
        if not model_names:
            model_names = ["dolphin3:latest", "llama3:latest", "gemma:7b"]
            
        # Add Blender to the list of available models if the blender server is running
        try:
            import aiohttp
            async with aiohttp.ClientSession() as session:
                async with session.get("http://localhost:8080/blender/status") as response:
                    if response.status == 200:
                        blender_status = await response.json()
                        if blender_status.get("connected", False):
                            model_names.append("blender")
                    else:
                        # If error connecting to Blender, still add it as an option
                        model_names.append("blender")
        except:
            # If error connecting to Blender, still add it as an option
            model_names.append("blender")
            
        return {
            "name": "Dolphinoko MCP",
            "version": "1.0.0",
            "capabilities": ["completion", "chat", "function_call"],
            "models": model_names,
            "api_version": "v1"
        }
    except Exception as e:
        logger.error(f"Error getting MCP info: {str(e)}")
        # Return basic info on error
        return {
            "name": "Dolphinoko MCP",
            "version": "1.0.0",
            "capabilities": ["completion", "chat", "function_call"],
            "models": ["dolphin3:latest", "llama3:latest", "gemma:7b", "blender"],
            "api_version": "v1",
            "error": str(e)
        }

@router.post("/generate")
async def mcp_generate(request: Request):
    """MCP generate endpoint (format used by Cursor)"""
    try:
        # Parse request
        data = await request.json()
        logger.info(f"Received MCP generate request: {data}")
        
        # Process using the completion handler
        result = await mcp_service.handle_completion(data)
        return result
    except Exception as e:
        logger.error(f"Error in MCP generate: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Cursor-specific standalone streaming endpoint with fallback handling
@router.api_route("/stream", methods=["POST", "GET"], include_in_schema=True)
async def cursor_stream(request: Request):
    """Cursor-specific streaming endpoint with exact format Cursor expects"""
    try:
        # Try to parse the request, but don't fail if we can't
        try:
            data = await request.json()
            logger.info(f"Cursor streaming request received (JSON): {json.dumps(data)[:200]}...")
            model = data.get("model", "unknown")
            messages = data.get("messages", [])
            user_message = messages[-1].get("content", "") if messages else "No content"
        except:
            # Fallback for raw requests
            logger.info("Received non-JSON streaming request, using defaults")
            model = "default_model"
            user_message = "Unknown message"
        
        # Get the raw content for logging
        try:
            body = await request.body()
            logger.info(f"Raw request body: {body[:100]}...")
        except:
            logger.info("Could not read raw request body")
        
        # Log all request headers for debugging
        headers = dict(request.headers)
        logger.info(f"Request headers: {headers}")
        
        # Set the exact response headers that Cursor expects
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
                content = f"This is a response from {model}."
                
                # Generate a unique response ID
                response_id = f"chatcmpl-{uuid.uuid4()}"
                create_time = int(time.time())
                
                # Initial message with role
                initial_data = {
                    "id": response_id,
                    "object": "chat.completion.chunk",
                    "created": create_time,
                    "model": model,
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
                        "model": model,
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
                    "model": model,
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
                error_data = {
                    "error": {
                        "message": str(e),
                        "type": "server_error"
                    }
                }
                yield f"data: {json.dumps(error_data)}\n\n"
                yield "data: [DONE]\n\n"
        
        # Return streaming response with appropriate headers
        return StreamingResponse(
            content=cursor_stream_generator(),
            media_type="text/event-stream",
            headers=response_headers
        )
    except Exception as e:
        logger.error(f"Error in cursor streaming endpoint: {str(e)}")
        logger.error(traceback.format_exc())
        # Return a streaming error with the correct format
        async def error_stream():
            error_data = {
                "error": {
                    "message": str(e),
                    "type": "server_error"
                }
            }
            yield f"data: {json.dumps(error_data)}\n\n"
            yield "data: [DONE]\n\n"
        
        return StreamingResponse(
            error_stream(),
            media_type="text/event-stream",
            headers=response_headers
        ) 