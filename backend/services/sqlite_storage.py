import os
import json
import sqlite3
import logging
import datetime
from typing import List, Dict, Any, Optional
from services.storage_interface import StorageInterface

logger = logging.getLogger(__name__)

class SQLiteStorage(StorageInterface):
    """SQLite implementation of storage service"""
    
    def __init__(self, db_path="./data/mcp.db"):
        """Initialize SQLite connection"""
        self.db_path = db_path
        
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
        
        try:
            self.conn = sqlite3.connect(db_path, check_same_thread=False)
            # Return dictionary-like objects for query results
            self.conn.row_factory = sqlite3.Row
            logger.info(f"Connected to SQLite at {db_path}")
        except Exception as e:
            logger.error(f"Failed to connect to SQLite: {str(e)}")
            self.conn = None
    
    def initialize_schema(self) -> bool:
        """Initialize database schema"""
        if not self.conn:
            logger.error("No SQLite connection available")
            return False
        
        try:
            cursor = self.conn.cursor()
            
            # Create tables for tools
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS tools (
                id TEXT PRIMARY KEY,
                name TEXT,
                description TEXT,
                provider TEXT,
                model TEXT,
                prompt_template TEXT,
                parameters TEXT,  -- JSON string
                created_at TEXT,
                updated_at TEXT
            )
            """)
            
            # Create index on tools.name
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_tool_name ON tools(name)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_tool_provider ON tools(provider)")
            
            # Create conversations table
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS conversations (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                created_at TEXT,
                updated_at TEXT
            )
            """)
            
            # Create messages table
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS messages (
                id TEXT PRIMARY KEY,
                conversation_id TEXT,
                content TEXT,
                role TEXT,
                tool_id TEXT,
                timestamp TEXT,
                metadata TEXT,  -- JSON string
                FOREIGN KEY(conversation_id) REFERENCES conversations(id)
            )
            """)
            
            # Create index on messages.conversation_id
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_message_conversation ON messages(conversation_id)")
            
            self.conn.commit()
            return True
        except Exception as e:
            logger.error(f"Error initializing SQLite schema: {str(e)}")
            return False

    def save_tool(self, tool: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Save a tool to SQLite"""
        if not self.conn:
            logger.error("No SQLite connection available")
            return None
        
        try:
            # Convert parameters to JSON string if it's a dict
            if isinstance(tool.get("parameters"), dict):
                parameters_json = json.dumps(tool["parameters"])
            else:
                parameters_json = tool.get("parameters", "{}")
            
            cursor = self.conn.cursor()
            cursor.execute("""
            INSERT OR REPLACE INTO tools 
            (id, name, description, provider, model, prompt_template, parameters, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                tool["id"],
                tool.get("name", ""),
                tool.get("description", ""),
                tool.get("provider", ""),
                tool.get("model", ""),
                tool.get("prompt_template", ""),
                parameters_json,
                tool.get("created_at", datetime.datetime.now().isoformat()),
                tool.get("updated_at", datetime.datetime.now().isoformat())
            ))
            
            self.conn.commit()
            
            # Return the inserted tool
            cursor.execute("SELECT * FROM tools WHERE id = ?", (tool["id"],))
            result = cursor.fetchone()
            return dict(result) if result else None
        except Exception as e:
            logger.error(f"Error saving tool to SQLite: {str(e)}")
            return None

    def get_tools(self) -> List[Dict[str, Any]]:
        """Get all tools from SQLite"""
        if not self.conn:
            logger.error("No SQLite connection available")
            return []
        
        try:
            cursor = self.conn.cursor()
            cursor.execute("SELECT * FROM tools")
            
            tools = []
            for row in cursor.fetchall():
                tool = dict(row)
                
                # Parse parameters JSON
                if "parameters" in tool and isinstance(tool["parameters"], str):
                    try:
                        tool["parameters"] = json.loads(tool["parameters"])
                    except:
                        tool["parameters"] = {}
                
                tools.append(tool)
            
            return tools
        except Exception as e:
            logger.error(f"Error retrieving tools from SQLite: {str(e)}")
            return []

    def save_conversation(self, conversation_id: str, user_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Create or update a conversation"""
        if not self.conn:
            logger.error("No SQLite connection available")
            return None
        
        try:
            timestamp = datetime.datetime.now().isoformat()
            
            cursor = self.conn.cursor()
            # Check if conversation exists
            cursor.execute("SELECT * FROM conversations WHERE id = ?", (conversation_id,))
            existing = cursor.fetchone()
            
            if existing:
                # Update
                cursor.execute("""
                UPDATE conversations 
                SET updated_at = ?
                WHERE id = ?
                """, (timestamp, conversation_id))
            else:
                # Insert
                cursor.execute("""
                INSERT INTO conversations (id, user_id, created_at, updated_at)
                VALUES (?, ?, ?, ?)
                """, (conversation_id, user_id, timestamp, timestamp))
            
            self.conn.commit()
            
            # Return the conversation
            cursor.execute("SELECT * FROM conversations WHERE id = ?", (conversation_id,))
            result = cursor.fetchone()
            return dict(result) if result else None
        except Exception as e:
            logger.error(f"Error saving conversation to SQLite: {str(e)}")
            return None

    def save_message(self, conversation_id: str, message: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Save a message to a conversation"""
        if not self.conn:
            logger.error("No SQLite connection available")
            return None
        
        try:
            # Create a copy to avoid modifying the original
            message_data = message.copy()
            
            # Set timestamp if not provided
            if "timestamp" not in message_data:
                message_data["timestamp"] = datetime.datetime.now().isoformat()
            
            # Convert metadata to JSON if it's a dict
            if "metadata" in message_data and isinstance(message_data["metadata"], dict):
                message_data["metadata"] = json.dumps(message_data["metadata"])
            
            cursor = self.conn.cursor()
            cursor.execute("""
            INSERT INTO messages (id, conversation_id, content, role, tool_id, timestamp, metadata)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                message_data["id"],
                conversation_id,
                message_data["content"],
                message_data["role"],
                message_data.get("tool_id"),
                message_data["timestamp"],
                message_data.get("metadata", "{}")
            ))
            
            self.conn.commit()
            
            # Return the message
            cursor.execute("SELECT * FROM messages WHERE id = ?", (message_data["id"],))
            result = cursor.fetchone()
            return dict(result) if result else None
        except Exception as e:
            logger.error(f"Error saving message to SQLite: {str(e)}")
            return None

    def get_conversation_messages(self, conversation_id: str) -> List[Dict[str, Any]]:
        """Get all messages for a conversation"""
        if not self.conn:
            logger.error("No SQLite connection available")
            return []
        
        try:
            cursor = self.conn.cursor()
            cursor.execute("""
            SELECT * FROM messages 
            WHERE conversation_id = ?
            ORDER BY timestamp ASC
            """, (conversation_id,))
            
            messages = []
            for row in cursor.fetchall():
                message = dict(row)
                
                # Parse metadata JSON
                if "metadata" in message and isinstance(message["metadata"], str):
                    try:
                        message["metadata"] = json.loads(message["metadata"])
                    except:
                        message["metadata"] = {}
                
                messages.append(message)
            
            return messages
        except Exception as e:
            logger.error(f"Error retrieving conversation messages from SQLite: {str(e)}")
            return []

    def get_conversation(self, conversation_id: str) -> Optional[Dict[str, Any]]:
        """Get a conversation by ID"""
        if not self.conn:
            logger.error("No SQLite connection available")
            return None
        
        try:
            cursor = self.conn.cursor()
            cursor.execute("SELECT * FROM conversations WHERE id = ?", (conversation_id,))
            
            result = cursor.fetchone()
            return dict(result) if result else None
        except Exception as e:
            logger.error(f"Error retrieving conversation from SQLite: {str(e)}")
            return None

    def search_similar_messages(self, conversation_id: str, embedding: List[float], limit: int = 5) -> List[Dict[str, Any]]:
        """
        Search for similar messages in a conversation 
        (Note: This is a placeholder - SQLite doesn't have built-in vector similarity)
        This functionality is handled by memory_service using SQLiteEmbeddingStorage
        """
        logger.warning("SQLite storage doesn't support vector similarity search directly")
        return []

    def close(self) -> None:
        """Close the SQLite connection"""
        if self.conn:
            self.conn.close()