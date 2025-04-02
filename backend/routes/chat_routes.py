import asyncio
from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import StreamingResponse
from typing import Dict, Any, Optional, AsyncGenerator
from pydantic import BaseModel
import json

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
    conversation_id: Optional[str] = None

class ChatMessageResponse(BaseModel):
    text: str
    model: str
    metadata: Optional[Dict[str, Any]] = None

class StreamRequest(BaseModel):
    tool_id: Optional[str] = None
    input: str
    parameters: Dict[str, Any] = {}
    conversation_id: Optional[str] = None

# Service dependencies
def get_ollama_service():
    return OllamaService(base_url="http://localhost:11434")

def get_memory_service():
    return MemoryService()

# Existing route
@router.post("/ollama")
async def chat_with_ollama(
    request: ChatMessageRequest,
    memory_service: MemoryService = Depends(get_memory_service)
):
    """Chat with Ollama model with memory integration"""
    try:
        # Create Ollama service with explicit URL
        ollama_service = OllamaService(base_url="http://localhost:11434")
        
        # Generate response with memory if conversation_id is provided
        if request.conversation_id:
            result = await ollama_service.generate_with_memory(
                request.model, 
                request.message, 
                request.conversation_id, 
                memory_service, 
                request.parameters or {}
            )
        else:
            result = await ollama_service.generate(
                request.model, 
                request.message, 
                request.parameters or {}
            )
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# New streaming route
@router.post("/stream")
async def stream_chat(
    request: StreamRequest,
    ollama_service: OllamaService = Depends(get_ollama_service),
    memory_service: MemoryService = Depends(get_memory_service)
):
    """Stream chat responses from Ollama"""
    print(f"Streaming request: {request}")
    
    try:
        # Get model from parameters
        model = request.parameters.get("model")
        if not model:
            raise HTTPException(status_code=400, detail="Model is required in parameters")
        
        # Check if we're using a tool or direct model
        if request.tool_id:
            # Get the tool info - this would need to be implemented
            # For now, we'll just use the direct model approach
            pass
        
        # Define the generator function without any yield statements in the outer function
        async def generate_stream() -> AsyncGenerator[str, None]:
            """Generate streaming response"""
            
            # Set streaming parameters
            stream_params = {**request.parameters, "stream": True}
            
            # Create stream generator based on conversation context
            if request.conversation_id:
                stream_generator = ollama_service.generate_stream_with_memory(
                    model,
                    request.input,
                    request.conversation_id,
                    memory_service,
                    stream_params
                )
            else:
                stream_generator = ollama_service.generate_stream(
                    model,
                    request.input,
                    stream_params
                )
                
            # Stream the responses
            try:
                async for chunk in stream_generator:
                    print(f"Streaming chunk: {chunk}")
                    # Extract content from either 'content' or 'response' field
                    content = chunk.get("content", chunk.get("response", ""))
                    if content:
                        print(f"Sending content: {content}")
                        yield f"data: {json.dumps({'content': content})}\n\n"
                    # Add a small delay
                    await asyncio.sleep(0.01)
                    
                # Signal completion
                print("Sending DONE marker")
                yield "data: [DONE]\n\n"
            except Exception as e:
                # Send error in the stream
                print(f"Error in generate_stream: {str(e)}")
                yield f"data: {json.dumps({'error': str(e)})}\n\n"
                yield "data: [DONE]\n\n"
        
        # This is the return statement for the main function
        return StreamingResponse(
            generate_stream(),
            media_type="text/event-stream"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))