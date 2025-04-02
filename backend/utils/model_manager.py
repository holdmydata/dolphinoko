"""
Model Manager Utility

This utility helps with managing models for Dolphinoko, providing tools to:
1. Check available models from Ollama
2. Pull new models 
3. Monitor model status
"""

import os
import json
import logging
import requests
from typing import List, Dict, Any, Optional

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class OllamaModelManager:
    """Utility class to manage Ollama models"""
    
    def __init__(self, base_url: str = None):
        """Initialize with Ollama API URL"""
        self.base_url = base_url or os.getenv("OLLAMA_API_URL", "http://localhost:11434")
        logger.info(f"Using Ollama API at: {self.base_url}")
    
    def list_models(self) -> List[Dict[str, Any]]:
        """Get a list of all available models"""
        try:
            response = requests.get(f"{self.base_url}/api/tags")
            if response.status_code == 200:
                models = response.json().get("models", [])
                logger.info(f"Found {len(models)} models")
                return models
            else:
                logger.error(f"Failed to get models: {response.status_code} {response.text}")
                return []
        except Exception as e:
            logger.error(f"Error listing models: {str(e)}")
            return []
    
    def pull_model(self, model_name: str) -> Dict[str, Any]:
        """Pull a new model from Ollama"""
        try:
            # Start the pull process
            response = requests.post(
                f"{self.base_url}/api/pull",
                json={"name": model_name}
            )
            
            if response.status_code == 200:
                logger.info(f"Successfully pulled model: {model_name}")
                return {"success": True, "model": model_name}
            else:
                logger.error(f"Failed to pull model: {response.status_code} {response.text}")
                return {"success": False, "error": response.text}
        except Exception as e:
            logger.error(f"Error pulling model: {str(e)}")
            return {"success": False, "error": str(e)}
    
    def get_model_info(self, model_name: str) -> Optional[Dict[str, Any]]:
        """Get information about a specific model"""
        try:
            models = self.list_models()
            for model in models:
                if model.get("name") == model_name:
                    return model
            logger.warning(f"Model not found: {model_name}")
            return None
        except Exception as e:
            logger.error(f"Error getting model info: {str(e)}")
            return None
    
    def check_ollama_status(self) -> Dict[str, Any]:
        """Check if Ollama is running and responsive"""
        try:
            response = requests.get(f"{self.base_url}/api/tags")
            return {
                "status": "online" if response.status_code == 200 else "error",
                "code": response.status_code
            }
        except requests.exceptions.ConnectionError:
            logger.error("Could not connect to Ollama service")
            return {"status": "offline", "message": "Could not connect to Ollama service"}
        except Exception as e:
            logger.error(f"Error checking Ollama status: {str(e)}")
            return {"status": "error", "message": str(e)}

# CLI functionality for testing
if __name__ == "__main__":
    manager = OllamaModelManager()
    
    # Check Ollama status
    status = manager.check_ollama_status()
    print(f"Ollama status: {status['status']}")
    
    # If Ollama is online, list models
    if status['status'] == 'online':
        models = manager.list_models()
        print(f"\nAvailable models ({len(models)}):")
        for i, model in enumerate(models, 1):
            print(f"{i}. {model.get('name')} - {model.get('size', 'N/A')}")

def pull_model(model_name: str) -> bool:
    """Pull a model using OllamaModelManager"""
    manager = OllamaModelManager(
        base_url=os.getenv("OLLAMA_API_URL", "http://localhost:11434")
    )
    return manager.pull_model(model_name) 