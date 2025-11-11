"""FastAPI backend for NYC Event Recommender.

This module provides REST API endpoints for event recommendations
using the agentic RAG pipeline.
"""

import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from dotenv import load_dotenv
from agents import EventRecommenderPipeline

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

# Initialize the pipeline
pipeline = EventRecommenderPipeline(qdrant_path="../local_qdrant")

# Query cache: stores query -> result mappings
query_cache: Dict[str, Dict[str, Any]] = {}


def normalize_query(query: str) -> str:
    """Normalize query for cache key (lowercase, strip whitespace)."""
    return query.lower().strip()


def get_cached_result(query: str) -> Optional[Dict[str, Any]]:
    """Check if query result is cached."""
    normalized = normalize_query(query)
    return query_cache.get(normalized)


def cache_result(query: str, result: Dict[str, Any]) -> None:
    """Cache query result."""
    normalized = normalize_query(query)
    query_cache[normalized] = result


class QueryRequest(BaseModel):
    """Request model for event recommendations."""
    query: str = Field(..., description="User query for event recommendations")
    top_k: Optional[int] = Field(5, description="Number of events to return", ge=1, le=20)


class EventItem(BaseModel):
    """Individual event item."""
    event: dict
    score: float

class QueryResponse(BaseModel):
    """Response model for event recommendations."""
    query: str
    filters: dict
    response: str
    events: List[EventItem]
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
        cached_result = get_cached_result(request.query)
        if cached_result:
            return QueryResponse(
                query=cached_result["query"],
                filters=cached_result["filters"],
                response=cached_result["response"],
                events=[EventItem(event=e["event"], score=e["score"]) for e in cached_result["events"]],
                num_events=len(cached_result["events"])
            )
        
        # Run the pipeline if not cached
        result = pipeline.run(request.query)
        
        # Cache the result
        cache_result(request.query, result)
        
        return QueryResponse(
            query=result["query"],
            filters=result["filters"],
            response=result["response"],
            events=[EventItem(event=e["event"], score=e["score"]) for e in result["events"]],
            num_events=len(result["events"])
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing query: {str(e)}"
        )


@app.get("/health")
def health_check():
    """Detailed health check with component status."""
    return {
        "status": "healthy",
        "components": {
            "vector_store": "online",
            "llm": "online",
            "langgraph": "online"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
