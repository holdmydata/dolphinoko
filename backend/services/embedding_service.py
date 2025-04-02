import os
import logging
import aiohttp
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

class EmbeddingService:
    """Service for generating embeddings for text"""
    
    def __init__(self, base_url: str = None):
        """Initialize Embedding service with base URL"""
        # Hardcoding for now to ensure correct URL
        self.base_url = "http://localhost:11434"
        logger.info(f"Initialized Embedding service with base URL: {self.base_url}")
        # Default embedding model
        self.default_model = os.environ.get("EMBEDDING_MODEL", "nomic-embed-text:latest")
    
    async def generate_embedding(self, 
                          text: str, 
                          model: str = None) -> List[float]:
        """Generate embedding for text using specified model"""
        try:
            model = model or self.default_model
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.base_url}/api/embeddings", 
                    json={"model": model, "prompt": text}
                ) as response:
                    if response.status != 200:
                        error_text = await response.text()
                        logger.error(f"Failed to generate embedding: {error_text}")
                        return []
                    
                    data = await response.json()
                    return data.get("embedding", [])
        except Exception as e:
            logger.error(f"Error generating embedding: {str(e)}")
            return []