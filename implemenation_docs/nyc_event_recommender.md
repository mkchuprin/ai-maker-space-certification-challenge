# NYC Event Recommender — Certification Challenge

📄 **Following this guide:**  
[Session 11: Certification Challenge](https://www.notion.so/Session-11-Certification-Challenge-26acd547af3d8067b1f3c1bf251654f6)

---

## Problem Statement (1 sentence)

It’s difficult for NYC residents to quickly find relevant, high-quality events tailored to their personal interests, location, and family needs.

---

## Problem Context (1 paragraph)

As a new parent living in New York City, I often want to find something fun to do — either solo, with my child, or with friends — but the process of discovering events is slow, fragmented, and frustrating.  
Most event platforms (like TimeOut, DoNYC, NYC.gov, Eventbrite) are noisy, require deep filtering, or are geared toward tourists. Parenting-specific forums have great suggestions, but they’re buried in comment threads or outdated posts.  

For time-strapped locals like myself, the real challenge isn’t that there’s nothing to do — it’s that relevant, accessible information is scattered across sources and rarely personalized.  
I want to quickly find something to do this Saturday that’s stroller-friendly and near Prospect Park — and I shouldn’t need 6 open tabs and 30 minutes of scrolling to get there.

---

## Proposed Solution

This app scrapes **TimeOut NYC’s “Things to Do This Weekend”** page and uses a **multi-agent pipeline** to generate personalized event recommendations based on user preferences such as mood, energy level, who they’re with (e.g., partner, baby), and location.  

Instead of scrolling through a long, general-purpose list, users can ask:
- “What’s a free outdoor event this Saturday that’s baby-friendly?”
- “What’s a good date night activity near Prospect Park?”

Each event listing is embedded into a **vector database** using metadata like category, price, vibe, and suitability.  
When a query arrives, the system retrieves the most relevant items using semantic search and assembles a custom itinerary.  
All results are drawn exclusively from the **current TimeOut NYC weekend guide**, ensuring freshness.

---

## Tech Stack and Rationale

| Component | Choice | Reason |
|------------|---------|--------|
| **LLM** | OpenAI GPT-4 Turbo | Strong reasoning + summarization, ideal for multi-agent workflows |
| **Embedding Model** | `text-embedding-3-small` | Fast, inexpensive, and effective for short event descriptions |
| **Orchestration** | LangGraph | Manages the flow: scraping → parsing → embedding → retrieval → generation |
| **Vector Database** | Qdrant (local, on-disk) | Simple, persistent, and fast local search; `client = qdrantClient(path="./local_qdrant")` |
| **Monitoring** | LangSmith | Logs agent hops and response chains for debugging |
| **Evaluation** | RAGAS | Measures retrieval quality via relevance, precision, and recall |
| **UI** | Streamlit | Lightweight interface with dropdowns for mood, price, and who you’re with |
| **Serving / Inference** | FastAPI (local) | For quick testing and containerization |

---

## Agent Architecture

**Scraper Agent**  
Parses TimeOut NYC event listings and extracts title, description, date, category, and price.  

**Embedder Agent**  
Converts event data into structured JSON, embeds it, and stores it in Qdrant with metadata.  

**Retrieval Agent**  
Handles user queries; retrieves top-k events matching mood, energy, and tags.  

**Response Generator Agent**  
Formats output naturally and highlights baby-friendly or romantic events.  

**Critic Agent (optional)**  
Validates retrieved events to filter outdated or irrelevant items.

---

## Data Sources and External APIs

- **Primary Source:** [TimeOut NYC — Things to Do in NYC This Weekend](https://www.timeout.com/newyork/things-to-do/things-to-do-in-nyc-this-weekend)  
  Contains ~100 curated, high-quality events updated weekly with descriptions, locations, and metadata.  
  A script fetches the page, parses events, and stores them as structured objects in Qdrant.  

- **Optional Future Expansion:**  
  The system can later integrate agentic search APIs such as [Tavily](https://tavily.com/) or [SerpAPI](https://serpapi.com/) for real-time retrieval beyond TimeOut.

---

## Chunking Strategy

Each event is treated as a **single chunk**, with the event title as the delimiter.  
This ensures each vector represents a complete event unit (title + description + metadata).  

**Why this works well for RAG:**
- Each chunk is short and self-contained  
- Users query for discrete items (e.g., “What’s a free outdoor event?”)  
- Embedding entire events preserves semantic context

---

## Implementation Plan (To-Do List)

1. **Download** the TimeOut NYC data  
2. **Read** and process text using LangChain  
3. **Chunk** the data by event title  
4. For each chunk:  
   a. Run through an LLM to extract structured features:  
      - Baby friendliness (single bool - if baby-friendly, implies stroller-accessible)
   b. Store extracted features in a **CSV file with embeddings**
   c. **Note:** Semantic search naturally handles mood/vibe - no need for explicit tags  
5. Integrate retrieval, embedding, and evaluation pipelines

---
