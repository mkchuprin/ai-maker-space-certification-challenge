"""FastAPI backend for NYC Event Recommender.

This module provides REST API endpoints for event recommendations
using the agentic RAG pipeline.
"""

import os
import hashlib
from datetime import datetime, timedelta
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from dotenv import load_dotenv
from backend.agents import EventRecommenderPipeline

# Load environment variables
load_dotenv()

# Configure LangSmith tracing
os.environ["LANGCHAIN_TRACING_V2"] = "true"
os.environ["LANGCHAIN_PROJECT"] = "nyc-event-recommender"
os.environ["LANGCHAIN_ENDPOINT"] = "https://api.smith.langchain.com"
os.environ["LANGCHAIN_API_KEY"] = os.getenv("LANGCHAIN_API_KEY")

# Initialize FastAPI app
app = FastAPI(
    title="NYC Event Recommender API",
    description="AI-powered event recommendation system for NYC",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the pipeline (lazy initialization to handle errors gracefully)
pipeline = None

# Response cache (in-memory)
response_cache: Dict[str, Dict[str, Any]] = {}
CACHE_TTL_HOURS = 24  # Cache responses for 24 hours

def get_cache_key(query: str) -> str:
    """Generate a cache key from query string."""
    return hashlib.md5(query.encode()).hexdigest()

def get_cached_response(query: str) -> Optional[Dict[str, Any]]:
    """Get cached response if available and not expired."""
    cache_key = get_cache_key(query)
    if cache_key in response_cache:
        cached_entry = response_cache[cache_key]
        # Check if cache is still valid
        if datetime.now() < cached_entry['expires_at']:
            return cached_entry['data']
        else:
            # Remove expired entry
            del response_cache[cache_key]
    return None

def set_cached_response(query: str, data: Dict[str, Any]) -> None:
    """Cache a response."""
    cache_key = get_cache_key(query)
    response_cache[cache_key] = {
        'data': data,
        'expires_at': datetime.now() + timedelta(hours=CACHE_TTL_HOURS)
    }
    # Limit cache size (keep only most recent 100 entries)
    if len(response_cache) > 100:
        # Remove oldest entries
        sorted_entries = sorted(
            response_cache.items(),
            key=lambda x: x[1]['expires_at']
        )
        for key, _ in sorted_entries[:-100]:
            del response_cache[key]

def get_pipeline():
    """Get or initialize the pipeline."""
    global pipeline
    if pipeline is None:
        try:
            pipeline = EventRecommenderPipeline(qdrant_path="./local_qdrant")
        except Exception as e:
            raise RuntimeError(f"Failed to initialize pipeline: {str(e)}")
    return pipeline


class QueryRequest(BaseModel):
    """Request model for event recommendations."""
    query: str = Field(..., description="User query for event recommendations")
    top_k: Optional[int] = Field(5, description="Number of events to return", ge=1, le=20)


class QueryResponse(BaseModel):
    """Response model for event recommendations."""
    query: str
    filters: dict
    response: str
    events: list
    num_events: int


@app.get("/")
def read_root():
    """Health check endpoint."""
    return {
        "message": "NYC Event Recommender API",
        "status": "online",
        "version": "1.0.0"
    }


@app.post("/recommend", response_model=QueryResponse)
def recommend_events(request: QueryRequest):
    """
    Get event recommendations based on user query.
    
    Args:
        request: QueryRequest with user query and optional top_k
    
    Returns:
        QueryResponse with recommendations and metadata
    """
    try:
        # Check cache first
        cached_result = get_cached_response(request.query)
        if cached_result:
            return QueryResponse(**cached_result)
        
        # Get pipeline (will initialize if needed)
        active_pipeline = get_pipeline()
        # Run the pipeline
        result = active_pipeline.run(request.query)
        
        response_data = {
            "query": result["query"],
            "filters": result["filters"],
            "response": result["response"],
            "events": result["events"],
            "num_events": len(result["events"])
        }
        
        # Cache the result
        set_cached_response(request.query, response_data)
        
        return QueryResponse(**response_data)
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing query: {str(e)}"
        )


@app.get("/health")
def health_check():
    """Detailed health check with component status."""
    components = {}
    status = "healthy"
    
    # Check vector store
    try:
        active_pipeline = get_pipeline()
        # Try to get collection info to verify Qdrant is accessible
        info = active_pipeline.vector_store.get_collection_info()
        components["vector_store"] = "online"
        components["vector_store_points"] = info.get("points_count", 0)
    except Exception as e:
        components["vector_store"] = f"error: {str(e)}"
        status = "unhealthy"
    
    # Check LLM (try a simple call)
    try:
        active_pipeline = get_pipeline()
        # Just verify the LLM object exists and is configured
        if hasattr(active_pipeline, 'llm') and active_pipeline.llm is not None:
            components["llm"] = "online"
        else:
            components["llm"] = "error: not initialized"
            status = "unhealthy"
    except Exception as e:
        components["llm"] = f"error: {str(e)}"
        status = "unhealthy"
    
    # Check LangGraph
    try:
        active_pipeline = get_pipeline()
        if hasattr(active_pipeline, 'app') and active_pipeline.app is not None:
            components["langgraph"] = "online"
        else:
            components["langgraph"] = "error: not initialized"
            status = "unhealthy"
    except Exception as e:
        components["langgraph"] = f"error: {str(e)}"
        status = "unhealthy"
    
    return {
        "status": status,
        "components": components
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
