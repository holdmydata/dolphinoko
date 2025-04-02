"""
Ollama service for interacting with local Ollama models
"""
import os
import logging
import requests
from typing import List, Dict, Any, Optional, AsyncGenerator
import aiohttp
import json

logger = logging.getLogger(__name__)

class OllamaService:
    """Service for interacting with Ollama API"""
    
    def __init__(self, base_url: str = None):
        """Initialize Ollama service with base URL"""
        # Get URL from parameter, environment, or default
        from_env = os.environ.get("OLLAMA_API_URL")
        from_getenv = os.getenv("OLLAMA_API_URL")
        
        # Log what we're seeing
        logger.info(f"Ollama init - base_url param: {base_url}")
        logger.info(f"Ollama init - os.environ.get: {from_env}")
        logger.info(f"Ollama init - os.getenv: {from_getenv}")
        
        # Final URL determination with fallback
        if base_url:
            self.base_url = base_url
        elif from_env:
            self.base_url = from_env
        elif from_getenv:
            self.base_url = from_getenv
        else:
            self.base_url = "http://localhost:11434"  # Default
        
        logger.info(f"Initialized Ollama service with base URL: {self.base_url}")
    
    async def list_models(self) -> List[Dict[str, Any]]:
        """Get list of available models from Ollama"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self.base_url}/api/tags") as response:
                    if response.status != 200:
                        error_text = await response.text()
                        logger.error(f"Failed to list models: {error_text}")
                        return []
                    
                    data = await response.json()
                    # Extract and format model information
                    models = []
                    for model in data.get("models", []):
                        models.append({
                            "name": model.get("name"),
                            "size": model.get("size"),
                            "modified_at": model.get("modified_at"),
                            "details": {
                                "family": model.get("details", {}).get("family", "Unknown"),
                                "parameter_size": model.get("details", {}).get("parameter_size", "Unknown"),
                                "quantization_level": model.get("details", {}).get("quantization_level", "Unknown")
                            }
                        })
                    
                    return models
        except Exception as e:
            logger.error(f"Error fetching models from Ollama: {str(e)}")
            return []
    
    async def check_model(self, model_name: str) -> bool:
        """Check if a model exists in Ollama"""
        try:
            models = await self.list_models()
            return any(model.get("name") == model_name for model in models)
        except Exception as e:
            logger.error(f"Error checking model {model_name}: {str(e)}")
            return False
    
    async def generate(self, 
                    model: str, 
                    prompt: str, 
                    parameters: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Generate a response from Ollama model"""
        try:
            # Default parameters
            params = {
                "model": model,
                "prompt": prompt,
                "stream": False,
            }
            
            # Add custom parameters if provided
            if parameters:
                params.update(parameters)
            
            logger.info(f"Generating with Ollama model {model}")
            logger.info(f"Prompt: {prompt[:100]}... (truncated)")
            logger.info(f"Parameters: {params}")
            
            async with aiohttp.ClientSession() as session:
                logger.info(f"Sending request to {self.base_url}/api/generate")
                async with session.post(f"{self.base_url}/api/generate", json=params) as response:
                    if response.status != 200:
                        error_text = await response.text()
                        logger.error(f"Failed to generate response: {error_text}")
                        return {"error": error_text}
                    
                    data = await response.json()
                    logger.info(f"Received response from Ollama with length: {len(data.get('response', ''))}")
                    return {
                        "text": data.get("response", ""),
                        "model": model,
                        "metadata": {
                            "eval_count": data.get("eval_count", 0),
                            "prompt_eval_count": data.get("prompt_eval_count", 0),
                            "total_duration": data.get("total_duration", 0),
                        }
                    }
        except Exception as e:
            logger.error(f"Error generating from Ollama model {model}: {str(e)}")
            return {"error": str(e)}
        
    async def generate_stream(self, model: str, prompt: str, parameters: Optional[Dict[str, Any]] = None) -> AsyncGenerator[Dict[str, Any], None]:
        """Generate a streaming response from Ollama"""
        url = f"{self.base_url}/api/generate"
        
        # Prepare request payload
        payload = {
            "model": model,
            "prompt": prompt,
            "stream": True
        }
        
        # Add any additional parameters
        if parameters:
            for key, value in parameters.items():
                if key != "stream":
                    payload[key] = value
        
        print(f"Sending streaming request to Ollama: {payload}")
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(url, json=payload) as response:
                    if not response.status == 200:
                        error_text = await response.text()
                        print(f"Ollama API error: {response.status} - {error_text}")
                        raise Exception(f"Ollama API error: {response.status} - {error_text}")
                    
                    print("Got 200 response from Ollama, starting to stream")
                    
                    # Stream the response
                    async for line in response.content:
                        if not line:
                            continue
                        
                        try:
                            # Decode the line and parse JSON
                            line_text = line.decode('utf-8').strip()
                            if not line_text:
                                continue
                                
                            print(f"Raw line from Ollama: {line_text}")
                            
                            data = json.loads(line_text)
                            
                            # Extract response - check all possible field names
                            content = None
                            if "response" in data:
                                content = data["response"]
                            elif "content" in data:
                                content = data["content"]
                            elif "text" in data:
                                content = data["text"]
                            
                            if content:
                                print(f"Extracted content: {content}")
                                yield {"content": content}
                            else:
                                print(f"No content found in response: {data}")
                        except json.JSONDecodeError:
                            # Skip unparseable lines
                            print(f"Could not parse line: {line_text}")
                            continue
                        except Exception as e:
                            print(f"Error processing line: {str(e)}")
                            continue
                    
                    print("Completed streaming from Ollama")
        except Exception as e:
            print(f"Error in generate_stream: {str(e)}")
            traceback.print_exc()
            # Yield an error message that will be sent to the client
            yield {"content": f"Error: {str(e)}"}
    
    async def generate_stream_with_memory(
        self,
        model: str,
        prompt: str,
        conversation_id: str,
        memory_service,
        parameters: Optional[Dict[str, Any]] = None
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """Generate streaming response with relevant memory context"""
        # Retrieve relevant memories (similar to your non-streaming implementation)
        relevant_memories = await memory_service.search_memory(prompt, conversation_id, 5)
        
        # Format memories for context
        context = ""
        used_memories = 0
        
        for memory in relevant_memories:
            if memory.get("similarity", 0) > 0.7:  # Only use highly relevant memories
                content = memory.get("content", "")
                role = memory.get("role", "unknown")
                context += f"{role}: {content}\n"
                used_memories += 1
        
        # Add context to prompt if we have memories
        enhanced_prompt = prompt
        if context:
            enhanced_prompt = f"Previous conversation:\n{context}\n\nCurrent message: {prompt}"
            
        # Track metrics
        metrics = {"used_memories": used_memories}
        
        # Generate streaming response
        async for chunk in self.generate_stream(model, enhanced_prompt, parameters):
            # Add memory metrics to the first chunk
            if metrics and "used_memories" in metrics:
                if "metadata" not in chunk:
                    chunk["metadata"] = {}
                chunk["metadata"]["used_memories"] = metrics.pop("used_memories")
                
            yield chunk
            
        # Optional: Save the final response to memory
        # This would need to happen after streaming completes
   
    async def generate_with_memory(self, 
                      model: str, 
                      prompt: str,
                      conversation_id: str = None,
                      memory_service = None, 
                      parameters: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Generate a response with memory integration"""
        try:
            # Initialize final prompt with the original
            final_prompt = prompt
            memory_present = False
            used_memories = 0
            original_model = model
            
            # Check if model exists, fall back if needed
            model_exists = await self.check_model(model)
            if not model_exists:
                logger.warning(f"Model {model} not found. Checking for alternatives...")
                
                # Try to find a similar model (same family)
                available_models = await self.list_models()
                fallback_model = None
                
                # First look for version variants (e.g. dolphin3:latest -> dolphin3)
                model_base = model.split(':')[0] if ':' in model else model
                for m in available_models:
                    if m.get('name', '').startswith(model_base):
                        fallback_model = m.get('name')
                        logger.info(f"Found similar model in same family: {fallback_model}")
                        break
                
                # If no similar model, use the first available model
                if not fallback_model and available_models:
                    fallback_model = available_models[0].get('name')
                    logger.warning(f"No similar model found. Falling back to: {fallback_model}")
                
                # If we found a fallback, use it
                if fallback_model:
                    model = fallback_model
                    logger.info(f"Using fallback model: {model}")
                else:
                    logger.error("No models available to use as fallback")
                    return {
                        "error": f"Model '{original_model}' not found and no fallback models available"
                    }
            
            # If we have memory service and conversation_id, retrieve relevant memories
            if memory_service and conversation_id:
                try:
                    # Fetch similar messages
                    relevant_memories = await memory_service.search_memory(prompt, conversation_id, 5)
                    
                    if relevant_memories:
                        # Format memories as context
                        context = ""
                        for memory in relevant_memories:
                            if memory.get("similarity", 0) > 0.7:  # Only use highly relevant memories
                                content = memory.get("content", "")
                                role = memory.get("role", "unknown")
                                context += f"{role}: {content}\n"
                                used_memories += 1
                        
                        # Add context to prompt if we have memories
                        if context:
                            final_prompt = f"Previous conversation:\n{context}\n\nCurrent message: {prompt}"
                            memory_present = True
                except Exception as e:
                    logger.error(f"Error retrieving memories: {str(e)}")
                    # Continue with original prompt if memory retrieval fails
            
            # Generate response using the base generate method
            result = await self.generate(model, final_prompt, parameters)
            
            # Add memory metadata
            if "metadata" not in result:
                result["metadata"] = {}
            
            result["metadata"]["memory_present"] = memory_present
            result["metadata"]["used_memories"] = used_memories
            
            return result
        except Exception as e:
            logger.error(f"Error generating with memory: {str(e)}")
            return {"error": str(e)}
    
    def pull_model(self, model_name: str) -> bool:
        """Pull a model from Ollama (synchronous)"""
        try:
            response = requests.post(
                f"{self.base_url}/api/pull",
                json={"name": model_name},
                stream=True
            )
            
            for line in response.iter_lines():
                if not line:
                    continue
                
                data = json.loads(line)
                # Log progress
                if "status" in data:
                    logger.info(f"Pulling model {model_name}: {data['status']}")
                
                # Check for completion or error
                if data.get("status") == "success":
                    logger.info(f"Successfully pulled model {model_name}")
                    return True
                elif "error" in data:
                    logger.error(f"Error pulling model {model_name}: {data['error']}")
                    return False
            
            return True
        except Exception as e:
            logger.error(f"Error pulling model {model_name}: {str(e)}")
            return False
        
async def generate_with_ollama(prompt: str, model: str, parameters: Dict[Any, Any] = None, conversation_id: str = None, memory_service = None):
    """
    Generate a response using Ollama API with memory support
    """
    # Create an instance of OllamaService
    service = OllamaService()
    
    # Call the memory-enhanced generate method if conversation_id is provided
    if conversation_id and memory_service:
        result = await service.generate_with_memory(model, prompt, conversation_id, memory_service, parameters)
    else:
        result = await service.generate(model, prompt, parameters)
    
    # Check for errors
    if "error" in result:
        return {
            "output": f"Error: {result['error']}",
            "metadata": {
                "provider": "ollama",
                "model": model,
                "processing_time": 0,
                "error": True
            }
        }
    
    # Return the formatted response
    return {
        "output": result["text"],
        "metadata": {
            "provider": "ollama",
            "model": model,
            "processing_time": result["metadata"].get("total_duration", 0) / 1e9,  # Convert nanoseconds to seconds
            "used_memories": result["metadata"].get("used_memories", 0),
            "memory_present": result["metadata"].get("memory_present", False),
            **result["metadata"]
        }
    }