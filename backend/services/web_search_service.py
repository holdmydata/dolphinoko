"""
Web Search Service for Dolphinoko
This service provides web search functionality using various search APIs
"""
import os
import logging
import aiohttp
import json
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

class WebSearchService:
    """Service for performing web searches"""
    
    def __init__(self, api_key: str = None):
        """Initialize web search service"""
        # Use provided key or get from environment
        self.api_key = api_key or os.environ.get("SEARCH_API_KEY", "")
        self.api_base = os.environ.get("SEARCH_API_BASE", "https://api.bing.microsoft.com/v7.0/search")
        self.enabled = bool(self.api_key)
        
        if not self.enabled:
            logger.warning("Web search service initialized without API key - service will be disabled")
        else:
            logger.info("Web search service initialized successfully")
    
    async def search(self, query: str, num_results: int = 5) -> Dict[str, Any]:
        """Perform a web search and return results"""
        if not self.enabled:
            return {
                "error": "Web search is not configured. Please set SEARCH_API_KEY environment variable.",
                "results": []
            }
        
        try:
            async with aiohttp.ClientSession() as session:
                headers = {
                    "Ocp-Apim-Subscription-Key": self.api_key,
                    "Accept": "application/json"
                }
                
                params = {
                    "q": query,
                    "count": num_results,
                    "responseFilter": "Webpages"
                }
                
                async with session.get(self.api_base, headers=headers, params=params) as response:
                    if response.status != 200:
                        error_text = await response.text()
                        logger.error(f"Search API error: {error_text}")
                        return {
                            "error": f"Search API error: {response.status}",
                            "results": []
                        }
                    
                    data = await response.json()
                    
                    # Process and format the results
                    formatted_results = []
                    if "webPages" in data and "value" in data["webPages"]:
                        for result in data["webPages"]["value"]:
                            formatted_results.append({
                                "title": result.get("name", ""),
                                "url": result.get("url", ""),
                                "snippet": result.get("snippet", ""),
                                "date_published": result.get("datePublished", "")
                            })
                    
                    return {
                        "results": formatted_results,
                        "total_results": data.get("webPages", {}).get("totalEstimatedMatches", 0)
                    }
        except Exception as e:
            logger.error(f"Error performing web search: {str(e)}")
            return {
                "error": str(e),
                "results": []
            }
    
    async def search_with_fallback(self, query: str, num_results: int = 5) -> Dict[str, Any]:
        """Search with fallback to a free API if main API fails"""
        # Try primary search first
        results = await self.search(query, num_results)
        
        # If there's an error and no results, try fallback
        if "error" in results and not results.get("results"):
            return await self._fallback_search(query, num_results)
            
        return results
    
    async def _fallback_search(self, query: str, num_results: int = 5) -> Dict[str, Any]:
        """Fallback to a free search API"""
        logger.info(f"Using fallback search for query: {query}")
        
        try:
            # This is a mock fallback - in production, you'd connect to an actual alternative API
            # For example, you could use a free tier of SerpAPI or a scraper-based solution
            
            # Simulated response
            return {
                "results": [
                    {
                        "title": f"Fallback result for '{query}'",
                        "url": "https://example.com",
                        "snippet": "This is a fallback search result. Web search functionality requires configuration.",
                        "date_published": ""
                    }
                ],
                "total_results": 1,
                "fallback_used": True
            }
        except Exception as e:
            logger.error(f"Error in fallback search: {str(e)}")
            return {
                "error": f"Both primary and fallback search failed: {str(e)}",
                "results": []
            }

# Singleton instance
_instance = None

def get_web_search_service() -> WebSearchService:
    """Get or create the WebSearchService singleton instance"""
    global _instance
    if _instance is None:
        _instance = WebSearchService()
    return _instance 