# dependencies.py
import os
import logging
from services.neo4j_service import Neo4jService
from services.sqlite_storage import SQLiteStorage
from services.storage_interface import StorageInterface

logger = logging.getLogger(__name__)

# Check environment variable or settings file
enable_neo4j = os.getenv("ENABLE_NEO4J", "false").lower() == "true"

# Initialize the appropriate storage service
if enable_neo4j:
    try:
        storage_service = Neo4jService()
        if storage_service.driver:
            success = storage_service.initialize_schema()
            if success:
                logger.info("Neo4j schema initialized successfully")
            else:
                logger.warning("Failed to initialize Neo4j schema, falling back to SQLite")
                storage_service = SQLiteStorage()
                storage_service.initialize_schema()
        else:
            logger.warning("Could not connect to Neo4j, falling back to SQLite")
            storage_service = SQLiteStorage()
            storage_service.initialize_schema()
    except Exception as e:
        logger.error(f"Error initializing Neo4j: {str(e)}, falling back to SQLite")
        storage_service = SQLiteStorage()
        storage_service.initialize_schema()
else:
    logger.info("Neo4j is disabled, using SQLite storage")
    storage_service = SQLiteStorage()
    storage_service.initialize_schema()

def get_storage_service() -> StorageInterface:
    """Dependency provider for storage service"""
    try:
        yield storage_service
    finally:
        # Connections remain open for the app lifecycle
        pass