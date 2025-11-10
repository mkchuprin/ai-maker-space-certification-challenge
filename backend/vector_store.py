"""Vector store operations for NYC Event Recommender.

This module handles all interactions with the Qdrant vector database,
including initialization, uploading events, and searching.
"""

from typing import List, Optional, Dict, Any
from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance,
    VectorParams,
    PointStruct,
    Filter,
    FieldCondition,
    MatchValue
)
from openai import OpenAI
import os


class VectorStore:
    """Manages vector database operations for event search."""
    
    def __init__(self, path: str = "./local_qdrant", collection_name: str = "nyc_events"):
        """Initialize vector store.
        
        Args:
            path: Path to local Qdrant storage
            collection_name: Name of the collection to use
        """
        self.client = QdrantClient(path=path)
        self.collection_name = collection_name
        self.openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    
    def initialize_collection(self, vector_size: int = 1536) -> None:
        """Create or recreate the collection.
        
        Args:
            vector_size: Dimension of embedding vectors
        """
        # Delete if exists
        try:
            self.client.delete_collection(self.collection_name)
        except:
            pass
        
        # Create new collection
        self.client.create_collection(
            collection_name=self.collection_name,
            vectors_config=VectorParams(
                size=vector_size,
                distance=Distance.COSINE
            )
        )
    
    def upload_events(self, events: List[Dict[str, Any]], embeddings: List[List[float]]) -> None:
        """Upload events with embeddings to vector store.
        
        Args:
            events: List of event dictionaries with metadata
            embeddings: List of embedding vectors
        """
        points = []
        for idx, (event, embedding) in enumerate(zip(events, embeddings)):
            point = PointStruct(
                id=idx,
                vector=embedding,
                payload=event
            )
            points.append(point)
        
        self.client.upsert(
            collection_name=self.collection_name,
            points=points
        )
    
    def create_embedding(self, text: str) -> List[float]:
        """Create embedding for text using OpenAI.
        
        Args:
            text: Text to embed
        
        Returns:
            List of floats representing the embedding vector
        """
        response = self.openai_client.embeddings.create(
            model="text-embedding-3-small",
            input=text
        )
        return response.data[0].embedding
    
    def search_events(
        self,
        query: str,
        top_k: int = 10,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """Search for events using semantic similarity.
        
        Args:
            query: Search query string
            top_k: Number of results to return
            filters: Optional metadata filters, e.g.:
                - {"baby_friendly": True} - filter for baby-friendly events
                - {"is_free": True} - filter for free events
                - {"indoor_or_outdoor": "indoor"} - filter by location type
                - Multiple filters can be combined in one dict
        
        Returns:
            List of search results with scores and payloads
        """
        # Create query embedding
        query_embedding = self.create_embedding(query)
        
        # Build filter if provided
        search_filter = None
        if filters:
            conditions = []
            for key, value in filters.items():
                conditions.append(
                    FieldCondition(
                        key=key,
                        match=MatchValue(value=value)
                    )
                )
            if conditions:
                search_filter = Filter(must=conditions)
        
        # Search
        results = self.client.search(
            collection_name=self.collection_name,
            query_vector=query_embedding,
            query_filter=search_filter,
            limit=top_k
        )
        
        # Format results
        formatted_results = []
        for result in results:
            formatted_results.append({
                "score": result.score,
                "event": result.payload
            })
        
        return formatted_results
    
    def get_collection_info(self) -> Dict[str, Any]:
        """Get information about the collection.
        
        Returns:
            Dictionary with collection statistics
        """
        info = self.client.get_collection(self.collection_name)
        return {
            "vectors_count": info.vectors_count,
            "points_count": info.points_count,
            "status": info.status
        }
