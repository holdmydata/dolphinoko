"""
Dependency providers for the application
"""
import logging
from services.neo4j_service import Neo4jService

logger = logging.getLogger(__name__)

# Initialize Neo4j service once
neo4j_service = Neo4jService()

# Initialize schema
if neo4j_service.driver:
    success = neo4j_service.initialize_schema()
    if success:
        logger.info("Neo4j schema initialized successfully")
    else:
        logger.warning("Failed to initialize Neo4j schema")

def get_neo4j_service():
    """Dependency provider for Neo4j service"""
    try:
        yield neo4j_service
    finally:
        # The driver is kept open for the app lifecycle
        pass