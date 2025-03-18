import os
import json
import sqlite3
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

class SQLiteEmbeddingStorage:
    """Local embedding storage using SQLite and scikit-learn"""
    
    def __init__(self, db_path="./data/embeddings.db"):
        """Initialize SQLite storage"""
        self.db_path = db_path
        
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
        
        # Initialize database
        self._init_db()
    
    def _init_db(self):
        """Initialize database schema"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Create tables
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS embeddings (
                id TEXT PRIMARY KEY,
                conversation_id TEXT,
                embedding TEXT,  -- JSON string of embedding vector
                content TEXT,
                role TEXT,
                timestamp TEXT,
                metadata TEXT    -- JSON string of metadata
            )
            """)
            
            # Create index on conversation_id for faster queries
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_conversation_id ON embeddings(conversation_id)")
            
            conn.commit()
            conn.close()
            logger.info(f"Initialized SQLite embedding database at {self.db_path}")
        except Exception as e:
            logger.error(f"Error initializing SQLite database: {str(e)}")
    
    def add_embedding(self, message_id: str, embedding: List[float], metadata: Dict[str, Any]):
        """Add embedding to the database"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Extract data from metadata
            conversation_id = metadata.get("conversation_id", "")
            content = metadata.get("content", "")
            role = metadata.get("role", "")
            timestamp = metadata.get("timestamp", "")
            
            # Insert embedding
            cursor.execute(
                "INSERT OR REPLACE INTO embeddings VALUES (?, ?, ?, ?, ?, ?, ?)",
                (
                    message_id, 
                    conversation_id,
                    json.dumps(embedding),
                    content,
                    role,
                    timestamp,
                    json.dumps(metadata)
                )
            )
            
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            logger.error(f"Error adding embedding to SQLite: {str(e)}")
            return False
    
    def search_similar(self, embedding: List[float], conversation_id: str = None, limit: int = 5) -> List[Dict[str, Any]]:
        """Search for similar embeddings using cosine similarity"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Query embeddings for the specified conversation or all if none specified
            if conversation_id:
                cursor.execute("SELECT id, embedding, content, role, timestamp, metadata FROM embeddings WHERE conversation_id = ?", (conversation_id,))
            else:
                cursor.execute("SELECT id, embedding, content, role, timestamp, metadata FROM embeddings")
            
            rows = cursor.fetchall()
            conn.close()
            
            if not rows:
                return []
            
            # Compute similarities
            query_embedding = np.array(embedding).reshape(1, -1)
            results = []
            
            for row in rows:
                message_id, emb_str, content, role, timestamp, meta_str = row
                stored_embedding = np.array(json.loads(emb_str)).reshape(1, -1)
                
                # Calculate cosine similarity
                similarity = float(cosine_similarity(query_embedding, stored_embedding)[0][0])
                
                # Add to results if above threshold
                if similarity > 0.7:  # Adjustable threshold
                    results.append({
                        "id": message_id,
                        "content": content,
                        "role": role,
                        "timestamp": timestamp,
                        "similarity": similarity,
                        "metadata": json.loads(meta_str)
                    })
            
            # Sort by similarity (highest first) and limit results
            results.sort(key=lambda x: x["similarity"], reverse=True)
            return results[:limit]
        except Exception as e:
            logger.error(f"Error searching embeddings in SQLite: {str(e)}")
            return []