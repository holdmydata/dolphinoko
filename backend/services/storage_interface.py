# backend/services/storage_interface.py
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional

class StorageInterface(ABC):
    """Abstract interface for storage services"""
    
    @abstractmethod
    def initialize_schema(self) -> bool:
        """Initialize any necessary schemas or indexes"""
        pass
    
    @abstractmethod
    def save_tool(self, tool: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Save a tool to storage"""
        pass
    
    @abstractmethod
    def get_tools(self) -> List[Dict[str, Any]]:
        """Get all tools from storage"""
        pass
    
    @abstractmethod
    def save_conversation(self, conversation_id: str, user_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Create or update a conversation"""
        pass
    
    @abstractmethod
    def save_message(self, conversation_id: str, message: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Save a message to a conversation"""
        pass
    
    @abstractmethod
    def get_conversation_messages(self, conversation_id: str) -> List[Dict[str, Any]]:
        """Get all messages for a conversation"""
        pass
    
    @abstractmethod
    def get_conversation(self, conversation_id: str) -> Optional[Dict[str, Any]]:
        """Get a conversation by ID"""
        pass
    
    @abstractmethod
    def search_similar_messages(self, conversation_id: str, embedding: List[float], limit: int = 5) -> List[Dict[str, Any]]:
        """Search for similar messages in a conversation"""
        pass
    
    @abstractmethod
    def close(self) -> None:
        """Close any connections"""
        pass