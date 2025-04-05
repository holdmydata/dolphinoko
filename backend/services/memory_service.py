# backend/services/memory_service.py
import logging
from typing import List, Dict, Any, Optional
from services.embedding_service import EmbeddingService
# Import your chosen storage implementation
from services.embedding_storage import SQLiteEmbeddingStorage  # or FAISS, Chroma, etc.

logger = logging.getLogger(__name__)

class MemoryService:
    """Service for managing conversation memory with embeddings"""
    
    def __init__(self):
        self.embedding_service = EmbeddingService(base_url="http://localhost:11434")
        # Initialize your chosen storage backend
        self.storage = SQLiteEmbeddingStorage()  # or FAISSEmbeddingStorage, ChromaEmbeddingStorage, etc.
    
    async def add_to_memory(self, message_id: str, content: str, metadata: Dict[str, Any]):
        """Add a message to memory with embedding"""
        try:
            # Generate embedding
            embedding = await self.embedding_service.generate_embedding(content)
            
            if not embedding:
                logger.warning(f"Failed to generate embedding for message {message_id}")
                return False
            
            # Store with metadata
            metadata["content"] = content  # Ensure content is in metadata
            return self.storage.add_embedding(message_id, embedding, metadata)
        except Exception as e:
            logger.error(f"Error adding message to memory: {str(e)}")
            return False
    
    async def search_memory(self, query: str, conversation_id: str = None, limit: int = 5):
        """Search for similar messages to the query"""
        try:
            # Generate embedding for query
            embedding = await self.embedding_service.generate_embedding(query)
            
            if not embedding:
                logger.warning(f"Failed to generate embedding for query: {query}")
                return []
            
            # Search storage
            return self.storage.search_similar(embedding, conversation_id, limit)
        except Exception as e:
            logger.error(f"Error searching memory: {str(e)}")
            return []
        
    async def get_memory_service(self):
        return self
    
    async def get_embedding_service(self):
        return self.embedding_service
    
    async def clear_memory(self):
        """Clear all memory"""
        return self.storage.clear_all()
    