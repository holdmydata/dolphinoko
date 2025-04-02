"""
Web Search API routes for Dolphinoko
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from services.web_search_service import WebSearchService, get_web_search_service
from typing import Dict, Any, Optional

router = APIRouter(prefix="/api/search", tags=["search"])

@router.get("/web")
async def search_web(
    query: str = Query(..., description="Search query string"),
    results: int = Query(5, description="Number of results to return", ge=1, le=20),
    service: WebSearchService = Depends(get_web_search_service)
):
    """
    Perform a web search and return results
    """
    if not query.strip():
        raise HTTPException(status_code=400, detail="Search query cannot be empty")
    
    search_results = await service.search(query, results)
    
    if "error" in search_results and not search_results.get("results"):
        # Try fallback
        search_results = await service.search_with_fallback(query, results)
    
    return search_results

@router.get("/status")
async def search_status(service: WebSearchService = Depends(get_web_search_service)):
    """
    Check if web search is enabled and configured properly
    """
    return {
        "enabled": service.enabled,
        "api_configured": bool(service.api_key),
        "api_base": service.api_base
    } 