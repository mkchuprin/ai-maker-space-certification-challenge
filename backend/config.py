"""
Configuration management for NYC Event Recommender
Loads environment variables and provides application settings
"""
import os
from functools import lru_cache
from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # OpenAI Configuration
    openai_api_key: str
    openai_org_id: str | None = None
    
    # LangSmith Configuration
    langchain_tracing_v2: bool = True
    langchain_endpoint: str = "https://api.smith.langchain.com"
    langchain_api_key: str
    langchain_project: str = "nyc-event-recommender"
    
    # Qdrant Configuration
    qdrant_path: str = "./local_qdrant"
    qdrant_collection_name: str = "nyc_events"
    
    # FastAPI Configuration
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    api_reload: bool = True
    cors_origins: List[str] = ["http://localhost:3000", "http://localhost:8501"]
    
    # Application Configuration
    environment: str = "development"
    log_level: str = "INFO"
    max_events_per_query: int = 10
    
    # Optional External APIs
    tavily_api_key: str | None = None
    serpapi_api_key: str | None = None
    
    # Rate Limiting
    rate_limit_per_minute: int = 60
    
    # Embedding Configuration
    embedding_model: str = "text-embedding-3-small"
    embedding_dimension: int = 1536
    
    # LLM Configuration
    llm_model: str = "gpt-4-turbo-preview"
    llm_temperature: float = 0.7
    max_tokens: int = 1000
    
    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """
    Get cached settings instance
    Use lru_cache to avoid reading .env multiple times
    """
    return Settings()


# Export singleton instance
settings = get_settings()

