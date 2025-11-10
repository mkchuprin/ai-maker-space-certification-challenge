"""Agentic RAG pipeline for NYC Event Recommender.

This module implements a 2-agent system:
1. Retrieval Agent: Extracts filters and retrieves relevant events
2. Response Agent: Formats events into natural language responses
"""

import os
import json
from typing import Dict, List, Any, TypedDict
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage
from langgraph.graph import StateGraph, END
from vector_store import VectorStore


class AgentState(TypedDict):
    """State passed between agents in the pipeline."""
    query: str
    filters: Dict[str, Any]
    retrieved_events: List[Dict]
    response: str


class EventRecommenderPipeline:
    """2-agent RAG pipeline for event recommendations."""
    
    def __init__(self, qdrant_path: str = "./local_qdrant"):
        """Initialize the pipeline with LLM and vector store."""
        self.llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
        self.vector_store = VectorStore(path=qdrant_path)
        self.app = self._build_graph()
    
    def retrieval_agent(self, state: AgentState) -> AgentState:
        """Agent 1: Extract filters and retrieve relevant events."""
        query = state["query"]
        
        # Extract filters using LLM
        filter_prompt = f"""Given this user query about NYC events, extract any explicit filters.

Query: "{query}"

Return JSON with these optional filters:
- baby_friendly: true/false (if query mentions babies, infants, toddlers, strollers, kids, family-friendly, OR "for adults" means false)
- is_free: true/false (if query mentions "free" → true, if query mentions "not free" or "paid" → false)
- indoor_or_outdoor: "indoor" | "outdoor" | "both" (if query mentions location type)
  * "indoor" for museums, theaters, indoor venues
  * "outdoor" for parks, outdoor festivals, street events
  * "both" for flexible or mixed indoor/outdoor activities

Important:
- "for adults" means baby_friendly: false
- "not free" or "paid" means is_free: false
- Only include filters that are explicitly mentioned

If a filter is not mentioned, omit it from the JSON.

Examples:
- "baby-friendly museum" → {{"baby_friendly": true}}
- "free outdoor event" → {{"is_free": true, "indoor_or_outdoor": "outdoor"}}
- "for adults" → {{"baby_friendly": false}}
- "not free indoor events" → {{"is_free": false, "indoor_or_outdoor": "indoor"}}
- "Find some events for me for adults and they should be free and indoor" → {{"baby_friendly": false, "is_free": true, "indoor_or_outdoor": "indoor"}}
- "romantic date night" → {{}}

Return ONLY valid JSON, no explanations."""

        try:
            filter_response = self.llm.invoke([
                SystemMessage(content="You extract metadata filters from user queries. Always return valid JSON."),
                HumanMessage(content=filter_prompt)
            ])
            filters = json.loads(filter_response.content)
        except Exception as e:
            print(f"Filter extraction failed: {e}")
            filters = {}
        
        # Search vector store
        search_results = self.vector_store.search_events(
            query=query,
            top_k=10,
            filters=filters if filters else None
        )
        
        state["filters"] = filters
        state["retrieved_events"] = search_results
        return state
    
    def response_agent(self, state: AgentState) -> AgentState:
        """Agent 2: Format retrieved events into natural language response."""
        query = state["query"]
        events = state["retrieved_events"]
        
        if not events:
            state["response"] = "I couldn't find any events matching your criteria. Try broadening your search!"
            return state
        
        # Prepare event context
        event_context = ""
        for i, result in enumerate(events[:5], 1):
            event = result["event"]
            score = result["score"]
            event_context += f"""
Event {i}:
- Title: {event['title']}
- Description: {event['description'][:200]}...
- Baby-Friendly: {'Yes' if event['baby_friendly'] else 'No'}
- URL: {event['url']}
- Relevance Score: {score:.2f}

"""
        
        # Generate response
        response_prompt = f"""You are a helpful NYC event recommender assistant.

User Query: "{query}"

Here are the top events I found:
{event_context}

Task: Write a friendly, conversational response recommending these events. Include:
1. A brief intro acknowledging their query
2. Top 3-5 events with titles, brief descriptions, and key details
3. Mention if events are baby-friendly when relevant
4. Include URLs for more info
5. End with an encouraging note

Format in markdown. Be enthusiastic but concise!"""

        response_message = self.llm.invoke([
            SystemMessage(content="You are a friendly NYC event recommendation assistant. Be helpful and enthusiastic!"),
            HumanMessage(content=response_prompt)
        ])
        
        state["response"] = response_message.content
        return state
    
    def _build_graph(self) -> StateGraph:
        """Build the LangGraph pipeline."""
        workflow = StateGraph(AgentState)
        
        # Add nodes
        workflow.add_node("retrieval", self.retrieval_agent)
        workflow.add_node("response", self.response_agent)
        
        # Define edges
        workflow.set_entry_point("retrieval")
        workflow.add_edge("retrieval", "response")
        workflow.add_edge("response", END)
        
        return workflow.compile()
    
    def run(self, query: str) -> Dict[str, Any]:
        """Run the pipeline end-to-end."""
        initial_state = {
            "query": query,
            "filters": {},
            "retrieved_events": [],
            "response": ""
        }
        
        final_state = self.app.invoke(initial_state)
        
        return {
            "query": query,
            "filters": final_state["filters"],
            "events": final_state["retrieved_events"],
            "response": final_state["response"]
        }
