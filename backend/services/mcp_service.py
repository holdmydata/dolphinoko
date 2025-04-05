"""
Dolphin MCP Service for handling MCP protocol communications
"""
import logging
import os
from typing import Dict, Any, List, Optional, Union, AsyncGenerator
from dolphin_mcp import MCPClient
import json
import uuid
import traceback
import asyncio

# Set up logging
logger = logging.getLogger(__name__)

class MCPService:
    """Service for handling MCP protocol communications"""
    
    def __init__(self):
        """Initialize the MCP service"""
        try:
            # MCPClient requires server_name and command parameters
            # For server_name, use "dolphinoko" to match the name in Cursor's mcp.json
            server_name = "dolphinoko"
            
            # The command parameter should match what's in the Cursor mcp.json file
            port = int(os.getenv("API_PORT", "8080"))
            
            # Using exact structure that Cursor expects
            command = {
                "host": "0.0.0.0", 
                "port": port,
                "streaming_url": f"http://0.0.0.0:{port}/mcp/stream",
                "url": f"http://0.0.0.0:{port}/mcp",
                "sse_format": "cursor"
            }
            
            self.client = MCPClient(server_name=server_name, command=command)
            logger.info(f"Initialized MCP Service with MCPClient for server: {server_name}")
            logger.info(f"Command config: {command}")
        except Exception as e:
            logger.error(f"Error initializing MCPClient: {str(e)}")
            logger.error(traceback.format_exc())
            raise
        
    async def handle_streaming(self, request: Dict[str, Any]) -> AsyncGenerator[Dict[str, Any], None]:
        """Handle a streaming request and yield chunks"""
        try:
            # Extract data from request
            model = request.get("model", "")
            messages = request.get("messages", [])
            max_tokens = request.get("max_tokens", 1000)
            temperature = request.get("temperature", 0.7)
            
            # Log request details
            logger.info(f"MCP streaming request: model={model}, messages_count={len(messages)}")
            
            # Format messages for MCPClient
            formatted_messages = []
            for msg in messages:
                formatted_messages.append({
                    "role": msg.get("role", "user"),
                    "content": msg.get("content", "")
                })
            
            # For debugging/testing, simulate streaming with mock data
            # Later, connect this to the actual streaming API of your models
            response_id = str(uuid.uuid4())
            chunks = ["Hello", ", ", "world", "! ", "This ", "is ", "a ", "streaming ", "response ", "from ", model, "."]
            
            # First chunk with role
            yield {
                "id": response_id,
                "object": "chat.completion.chunk",
                "created": int(__import__('time').time()),
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
            
            # Content chunks
            for chunk in chunks:
                await asyncio.sleep(0.2)  # Simulate streaming delay
                yield {
                    "id": response_id,
                    "object": "chat.completion.chunk",
                    "created": int(__import__('time').time()),
                    "model": model,
                    "choices": [
                        {
                            "index": 0,
                            "delta": {
                                "content": chunk
                            },
                            "finish_reason": None
                        }
                    ]
                }
            
            # Final chunk
            yield {
                "id": response_id,
                "object": "chat.completion.chunk",
                "created": int(__import__('time').time()),
                "model": model,
                "choices": [
                    {
                        "index": 0,
                        "delta": {},
                        "finish_reason": "stop"
                    }
                ]
            }
            
        except Exception as e:
            logger.error(f"Error in MCP streaming: {str(e)}")
            yield {"error": str(e)}
        
    async def handle_completion(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """Handle a completion request using MCP protocol"""
        try:
            # Extract data from request
            model = request.get("model", "")
            messages = request.get("messages", [])
            max_tokens = request.get("max_tokens", 1000)
            temperature = request.get("temperature", 0.7)
            stream = request.get("stream", False)
            
            # For streaming, use the dedicated streaming handler
            if stream:
                logger.info(f"Stream requested for model {model}, redirecting to streaming handler")
                return {"stream": True, "request": request}
            
            # Log request details
            logger.info(f"MCP completion request: model={model}, messages_count={len(messages)}")
            
            # Format messages for MCPClient
            formatted_messages = []
            for msg in messages:
                formatted_messages.append({
                    "role": msg.get("role", "user"),
                    "content": msg.get("content", "")
                })
            
            # Make completion request using MCPClient
            # For debugging purposes, log all parameters
            logger.info(f"Calling chat_completion with model={model}, max_tokens={max_tokens}, temp={temperature}")
            
            # Prepare request payload that matches what Cursor sends
            payload = {
                "model": model,
                "messages": formatted_messages,
                "max_tokens": max_tokens,
                "temperature": temperature,
                "stream": stream
            }
            
            logger.info(f"Using payload: {json.dumps(payload)}")
            
            # Call the MCPClient
            response = await self.client.chat_completion(**payload)
            
            # Log the raw response for debugging
            logger.info(f"Raw response: {response}")
            
            # Format response to match expected structure
            result = {
                "id": str(uuid.uuid4()),
                "model": model,
                "choices": [
                    {
                        "message": {
                            "role": "assistant",
                            "content": response["content"] if "content" in response else response.get("message", {}).get("content", "")
                        },
                        "finish_reason": "stop"
                    }
                ],
                "usage": {
                    "prompt_tokens": response.get("usage", {}).get("prompt_tokens", 0),
                    "completion_tokens": response.get("usage", {}).get("completion_tokens", 0),
                    "total_tokens": response.get("usage", {}).get("total_tokens", 0)
                }
            }
            
            logger.info(f"MCP completion response generated")
            return result
            
        except Exception as e:
            logger.error(f"Error in MCP completion: {str(e)}")
            return {"error": str(e)}
    
    async def handle_chat_completion(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """Handle a chat completion request using MCP protocol"""
        # For now, use the same implementation as completion
        return await self.handle_completion(request)
    
    async def handle_function_call(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """Handle a function call request using MCP protocol"""
        try:
            # Extract data from request
            model = request.get("model", "")
            messages = request.get("messages", [])
            functions = request.get("functions", [])
            max_tokens = request.get("max_tokens", 1000)
            temperature = request.get("temperature", 0.7)
            
            # Log request details
            logger.info(f"MCP function call request: model={model}, functions_count={len(functions)}")
            
            # Format messages for MCPClient
            formatted_messages = []
            for msg in messages:
                formatted_messages.append({
                    "role": msg.get("role", "user"),
                    "content": msg.get("content", "")
                })
            
            # Make function call request using MCPClient
            response = await self.client.chat_completion(
                model=model,
                messages=formatted_messages,
                functions=functions,
                max_tokens=max_tokens,
                temperature=temperature
            )
            
            # Format response to match expected structure
            result = {
                "id": str(uuid.uuid4()),
                "model": model,
                "choices": [
                    {
                        "message": {
                            "role": "assistant",
                            "content": response.get("content", ""),
                            "function_call": response.get("function_call", None)
                        },
                        "finish_reason": "function_call" if "function_call" in response else "stop"
                    }
                ],
                "usage": {
                    "prompt_tokens": response.get("usage", {}).get("prompt_tokens", 0),
                    "completion_tokens": response.get("usage", {}).get("completion_tokens", 0),
                    "total_tokens": response.get("usage", {}).get("total_tokens", 0)
                }
            }
            
            logger.info(f"MCP function call response generated")
            return result
            
        except Exception as e:
            logger.error(f"Error in MCP function call: {str(e)}")
            return {"error": str(e)} 