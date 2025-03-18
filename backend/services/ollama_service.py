"""
Ollama service for interacting with local Ollama models
"""
import os
import logging
import requests
from typing import List, Dict, Any, Optional
import aiohttp
import json

logger = logging.getLogger(__name__)

class OllamaService:
    """Service for interacting with Ollama API"""
    
    def __init__(self, base_url: str = None):
        """Initialize Ollama service with base URL"""
        self.base_url = base_url or os.environ.get("OLLAMA_API_URL", "http://localhost:11434")
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
            
            async with aiohttp.ClientSession() as session:
                async with session.post(f"{self.base_url}/api/generate", json=params) as response:
                    if response.status != 200:
                        error_text = await response.text()
                        logger.error(f"Failed to generate response: {error_text}")
                        return {"error": error_text}
                    
                    data = await response.json()
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
        memories = []
        
        # If we have memory service and conversation_id, retrieve relevant memories
        if memory_service and conversation_id:
            try:
                # Fetch similar messages
                memories = await memory_service.search_memory(prompt, conversation_id, limit=3)
                
                # If we found relevant memories, include them in the prompt
                if memories:
                    memory_text = "\n\nRelevant conversation history:\n"
                    for i, mem in enumerate(memories, 1):
                        memory_text += f"{i}. {mem.get('role', 'unknown')}: {mem.get('content', '')}\n"
                    
                    # Add memories before the main prompt
                    final_prompt = f"{memory_text}\n\nCurrent conversation:\n{prompt}"
                    
                    # Log that we're using memory
                    logger.info(f"Using {len(memories)} memories for generation")
            except Exception as mem_err:
                logger.warning(f"Error retrieving memories: {str(mem_err)}")
        
        # Default parameters
        params = {
            "model": model,
            "prompt": final_prompt,
            "stream": False,
        }
        
        # Add custom parameters if provided
        if parameters:
            params.update(parameters)
        
        async with aiohttp.ClientSession() as session:
            async with session.post(f"{self.base_url}/api/generate", json=params) as response:
                if response.status != 200:
                    error_text = await response.text()
                    logger.error(f"Failed to generate response: {error_text}")
                    return {"error": error_text}
                
                data = await response.json()
                return {
                    "text": data.get("response", ""),
                    "model": model,
                    "metadata": {
                        "eval_count": data.get("eval_count", 0),
                        "prompt_eval_count": data.get("prompt_eval_count", 0),
                        "total_duration": data.get("total_duration", 0),
                        "used_memories": len(memories),
                        "memory_present": len(memories) > 0
                    }
                }
    except Exception as e:
        logger.error(f"Error generating from Ollama model {model}: {str(e)}")
        return {"error": str(e)}