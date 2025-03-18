# backend/services/neo4j_service.py
import os
import logging
from neo4j import GraphDatabase
import json

logger = logging.getLogger(__name__)


class Neo4jService:
    def __init__(self):
        """Initialize Neo4j connection using environment variables"""
        uri = os.getenv("NEO4J_URI", "bolt://127.0.0.1:7687")
        user = os.getenv("NEO4J_USER", "neo4j")
        password = os.getenv("NEO4J_PASSWORD", "Password42069!")

        try:
            self.driver = GraphDatabase.driver(uri, auth=(user, password))
            logger.info(f"Connected to Neo4j at {uri}")
        except Exception as e:
            logger.error(f"Failed to connect to Neo4j: {str(e)}")
            self.driver = None

    def close(self):
        """Close the Neo4j driver"""
        if self.driver:
            self.driver.close()

    def initialize_schema(self):
        """Set up initial schema constraints and indices"""
        if not self.driver:
            logger.error("No Neo4j connection available")
            return False

        with self.driver.session() as session:
            try:
                # Create constraints for unique IDs
                session.run(
                    "CREATE CONSTRAINT IF NOT EXISTS FOR (t:Tool) REQUIRE t.id IS UNIQUE"
                )
                session.run(
                    "CREATE CONSTRAINT IF NOT EXISTS FOR (c:Conversation) REQUIRE c.id IS UNIQUE"
                )
                session.run(
                    "CREATE CONSTRAINT IF NOT EXISTS FOR (m:Message) REQUIRE m.id IS UNIQUE"
                )

                # Create indices for common lookups
                session.run("CREATE INDEX IF NOT EXISTS FOR (t:Tool) ON (t.name)")
                session.run("CREATE INDEX IF NOT EXISTS FOR (t:Tool) ON (t.provider)")
                
                return True
            except Exception as e:
                logger.error(f"Error initializing Neo4j schema: {str(e)}")
                return False

    def save_tool(self, tool):
        """Save a tool to Neo4j"""
        if not self.driver:
            logger.error("No Neo4j connection available")
            return None

        with self.driver.session() as session:
            try:
                result = session.run(
                    """
                MERGE (t:Tool {id: $id})
                SET t.name = $name,
                    t.description = $description,
                    t.provider = $provider,
                    t.model = $model,
                    t.prompt_template = $prompt_template,
                    t.parameters = $parameters,
                    t.created_at = $created_at,
                    t.updated_at = $updated_at
                RETURN t
                """,
                    **tool,
                )

                return result.single()
            except Exception as e:
                logger.error(f"Error saving tool to Neo4j: {str(e)}")
                return None

    def get_tools(self):
        """Get all tools from Neo4j"""
        if not self.driver:
            logger.error("No Neo4j connection available")
            return []

        with self.driver.session() as session:
            try:
                result = session.run(
                    """
                MATCH (t:Tool)
                RETURN t
                """
                )

                return [dict(record["t"]) for record in result]
            except Exception as e:
                logger.error(f"Error retrieving tools from Neo4j: {str(e)}")
                return []

    # Add conversation methods
    def save_message_with_embedding(self, conversation_id, message, embedding):
        """Save a message with its embedding to Neo4j"""
        if not self.driver:
            logger.error("No Neo4j connection available")
            return None
            
        # Create a copy of the message to avoid modifying the original
        message_data = message.copy()
        
        # Convert metadata to JSON string if it's a dictionary
        if "metadata" in message_data and isinstance(message_data["metadata"], dict):
            try:
                message_data["metadata"] = json.dumps(message_data["metadata"])
            except Exception as e:
                logger.error(f"Error serializing metadata to JSON: {str(e)}")
                message_data["metadata"] = "{}"  # Default to empty JSON object
        
        with self.driver.session() as session:
            try:
                # Convert embedding list to correct format if needed
                embedding_str = json.dumps(embedding) if embedding else None
                
                result = session.run("""
                MATCH (c:Conversation {id: $conversation_id})
                CREATE (m:Message {
                    id: $id,
                    content: $content,
                    role: $role,
                    timestamp: datetime(),
                    metadata: $metadata,
                    embedding: $embedding
                })
                CREATE (c)-[:HAS_MESSAGE]->(m)
                RETURN m
                """, conversation_id=conversation_id, embedding=embedding_str, **message_data)
                
                # If a tool was used, link the message to the tool
                if message_data.get('tool_id'):
                    session.run("""
                    MATCH (m:Message {id: $message_id})
                    MATCH (t:Tool {id: $tool_id})
                    CREATE (m)-[:USED_TOOL]->(t)
                    """, message_id=message_data['id'], tool_id=message_data['tool_id'])
                
                return result.single()
            except Exception as e:
                logger.error(f"Error saving message with embedding to Neo4j: {str(e)}")
                logger.error(f"Message data: {message_data}")
                return None

    def search_similar_messages(self, conversation_id, embedding, limit=5):
        """Search for similar messages in a conversation using vector similarity"""
        if not self.driver:
            logger.error("No Neo4j connection available")
            return []
            
        with self.driver.session() as session:
            try:
                # Convert embedding to string if needed
                embedding_str = json.dumps(embedding) if embedding else None
                
                # This query uses vector.similarity to find similar messages
                result = session.run("""
                MATCH (c:Conversation {id: $conversation_id})-[:HAS_MESSAGE]->(m:Message)
                WHERE m.embedding IS NOT NULL
                WITH m, vector.similarity(m.embedding, $embedding) AS similarity
                WHERE similarity > 0.7  // Minimum similarity threshold
                RETURN m, similarity
                ORDER BY similarity DESC
                LIMIT $limit
                """, conversation_id=conversation_id, embedding=embedding_str, limit=limit)
                
                messages = []
                for record in result:
                    message = dict(record["m"])
                    
                    # Parse metadata JSON if it exists
                    if "metadata" in message and isinstance(message["metadata"], str):
                        try:
                            message["metadata"] = json.loads(message["metadata"])
                        except:
                            message["metadata"] = {}
                            
                    # Add similarity score to message
                    message["similarity"] = record["similarity"]
                    messages.append(message)
                    
                return messages
            except Exception as e:
                logger.error(f"Error searching similar messages in Neo4j: {str(e)}")
                return []

    def save_conversation(self, conversation_id, user_id=None):
        """Create or update a conversation"""
        if not self.driver:
            logger.error("No Neo4j connection available")
            return None

        with self.driver.session() as session:
            try:
                result = session.run(
                    """
                MERGE (c:Conversation {id: $conversation_id})
                SET c.created_at = COALESCE(c.created_at, datetime())
                SET c.updated_at = datetime()
                RETURN c
                """,
                    conversation_id=conversation_id,
                )

                # If user_id provided, link the user to the conversation
                if user_id:
                    session.run(
                        """
                    MATCH (c:Conversation {id: $conversation_id})
                    MERGE (u:User {id: $user_id})
                    MERGE (u)-[:HAS_CONVERSATION]->(c)
                    """,
                        conversation_id=conversation_id,
                        user_id=user_id,
                    )

                # Extract the record safely
                record = result.single()
                if record:
                    # Convert to dict for easier handling
                    conv_dict = dict(record["c"])

                    # Ensure created_at and updated_at exist
                    if "created_at" not in conv_dict:
                        conv_dict["created_at"] = None
                    if "updated_at" not in conv_dict:
                        conv_dict["updated_at"] = None

                    return conv_dict
                else:
                    return None
            except Exception as e:
                logger.error(f"Error saving conversation to Neo4j: {str(e)}")
                return None

    def save_message(self, conversation_id, message):
        """Save a message to a conversation"""
        if not self.driver:
            logger.error("No Neo4j connection available")
            return None
            
        # Create a copy of the message to avoid modifying the original
        message_data = message.copy()
        
        # Convert metadata to JSON string if it's a dictionary
        if "metadata" in message_data and isinstance(message_data["metadata"], dict):
            try:
                message_data["metadata"] = json.dumps(message_data["metadata"])
            except Exception as e:
                logger.error(f"Error serializing metadata to JSON: {str(e)}")
                message_data["metadata"] = "{}"  # Default to empty JSON object
        
        with self.driver.session() as session:
            try:
                result = session.run("""
                MATCH (c:Conversation {id: $conversation_id})
                CREATE (m:Message {
                    id: $id,
                    content: $content,
                    role: $role,
                    timestamp: datetime(),
                    metadata: $metadata
                })
                CREATE (c)-[:HAS_MESSAGE]->(m)
                RETURN m
                """, conversation_id=conversation_id, **message_data)
                
                # If a tool was used, link the message to the tool
                if message_data.get('tool_id'):
                    session.run("""
                    MATCH (m:Message {id: $message_id})
                    MATCH (t:Tool {id: $tool_id})
                    CREATE (m)-[:USED_TOOL]->(t)
                    """, message_id=message_data['id'], tool_id=message_data['tool_id'])
                
                return result.single()
            except Exception as e:
                logger.error(f"Error saving message to Neo4j: {str(e)}")
                logger.error(f"Message data: {message_data}")
                return None

    def get_conversation_messages(self, conversation_id):
        """Get all messages for a conversation, ordered by timestamp"""
        if not self.driver:
            logger.error("No Neo4j connection available")
            return []
            
        with self.driver.session() as session:
            try:
                # Modified query to ensure proper ordering
                result = session.run("""
                MATCH (c:Conversation {id: $conversation_id})-[:HAS_MESSAGE]->(m:Message)
                RETURN m
                ORDER BY m.timestamp ASC
                """, conversation_id=conversation_id)
                
                messages = []
                for record in result:
                    message = dict(record["m"])
                    
                    # Parse metadata JSON if it exists
                    if "metadata" in message and isinstance(message["metadata"], str):
                        try:
                            message["metadata"] = json.loads(message["metadata"])
                        except:
                            message["metadata"] = {}
                            
                    messages.append(message)
                    
                return messages
            except Exception as e:
                logger.error(f"Error retrieving conversation messages from Neo4j: {str(e)}")
                return []

    def get_conversation(self, conversation_id):
        """Get a conversation by ID"""
        if not self.driver:
            logger.error("No Neo4j connection available")
            return None

        with self.driver.session() as session:
            try:
                result = session.run(
                    """
                MATCH (c:Conversation {id: $conversation_id})
                RETURN c
                """,
                    conversation_id=conversation_id,
                )

                record = result.single()
                return record["c"] if record else None
            except Exception as e:
                logger.error(f"Error retrieving conversation from Neo4j: {str(e)}")
                return None
