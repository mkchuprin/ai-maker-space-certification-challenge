# NYC Event Recommender — Assignment Answers

## Task 1: Defining Your Problem and Audience

### ✅✅✅ Problem Statement (1 sentence)

It's difficult for NYC residents to quickly find relevant, high-quality events tailored to their personal interests, location, and family needs.

### ✅✅✅ Why This is a Problem (1-2 paragraphs)

As a new parent living in New York City, I often want to find something fun to do — either solo, with my child, or with friends — but the process of discovering events is slow, fragmented, and frustrating. Most event platforms (like TimeOut, DoNYC, NYC.gov, Eventbrite) are noisy, require deep filtering, or are geared toward tourists. Parenting-specific forums have great suggestions, but they're buried in comment threads or outdated posts.

For time-strapped locals like myself, the real challenge isn't that there's nothing to do — it's that relevant, accessible information is scattered across sources and rarely personalized. I want to quickly find something to do this Saturday that's stroller-friendly and near Prospect Park — and I shouldn't need 6 open tabs and 30 minutes of scrolling to get there.

---

## Task 2: Propose a Solution

### ✅✅✅ Proposed Solution (1-2 paragraphs)

This app scrapes TimeOut NYC's "Things to Do This Weekend" page and uses a multi-agent pipeline to generate personalized event recommendations based on user preferences such as baby-friendliness, location, and price. Instead of scrolling through a long, general-purpose list, users can ask natural language queries like "What's a free outdoor event this Saturday that's baby-friendly?" or "What's a good date night activity near a museum?"

Each event listing is embedded into a vector database using metadata like category, price, and baby-friendliness. When a query arrives, the system uses semantic search to understand the user's vibe and intent (romantic, relaxing, high-energy) without needing explicit mood tags. A two-agent pipeline handles retrieval and response generation, returning curated recommendations in seconds. All results come from the current TimeOut NYC weekend guide, ensuring freshness.

### ✅✅✅ Tech Stack Choices

| Component | Choice | Reason |
|-----------|--------|--------|
| **LLM** | OpenAI GPT-4o-mini | Strong reasoning and summarization, ideal for multi-agent workflows while being cost-effective |
| **Embedding Model** | `text-embedding-3-small` | Fast, inexpensive, and effective for short event descriptions with good semantic understanding |
| **Orchestration** | LangGraph | Manages the agent flow cleanly with state management for retrieval → response generation |
| **Vector Database** | Qdrant (local) | Simple, persistent, and fast local search; easy to set up with `QdrantClient(path="./local_qdrant")` |
| **Monitoring** | LangSmith | Logs agent interactions and traces for debugging multi-step workflows |
| **Evaluation** | RAGAS | Measures retrieval quality via faithfulness, answer relevancy, context precision, and recall |
| **User Interface** | Static HTML + JavaScript | Lightweight, instant load, no backend deployment needed for frontend |

### ✅✅✅ Agent Architecture & Agentic Reasoning

**Where agents appear:**
The system uses a **2-agent pipeline** built with LangGraph:

1. **Retrieval Agent** — Analyzes the user query to extract intent and filters (price, baby-friendliness, location, category), embeds the query, and searches Qdrant with semantic search + metadata filtering to return top-10 relevant events.

2. **Response Agent** — Takes retrieved events and formats them naturally using GPT-4, highlighting key details like price, location, and baby-friendliness in a conversational tone.

**How agentic reasoning is used:**
- The Retrieval Agent uses reasoning to parse natural language queries and decide which filters to apply (e.g., "baby-friendly museum" → `{baby_friendly: True, category: "arts"}`)
- Semantic search handles implicit requirements (romantic, relaxing, high-energy) without explicit tags
- The Response Agent decides how to present results based on context and user intent

This 2-agent approach is simpler, faster, and easier to debug than complex multi-agent systems while still providing intelligent, personalized recommendations.

---

## Task 3: Dealing with the Data

### ✅✅✅ Data Sources and External APIs

**Primary Source:** [TimeOut NYC — Things to Do in NYC This Weekend](https://www.timeout.com/newyork/things-to-do/things-to-do-in-nyc-this-weekend)

This page contains ~100 curated, high-quality events updated weekly with descriptions, locations, categories, and price information. I scrape this page using BeautifulSoup, extract event cards, and parse structured data (title, description, date, category, price, location, URL). This is the sole data source — no external APIs are currently used, keeping the system simple and avoiding rate limits or API costs.

### ✅✅✅ Chunking Strategy

Each event is treated as a **single chunk**, using the event title as the natural delimiter. This means one event = one vector embedding.

**Why this works well:**
- Each chunk is short and self-contained (title + description typically < 500 tokens)
- Users query for discrete items (e.g., "What's a free outdoor event?"), not paragraphs across multiple events
- Embedding entire events preserves semantic context and prevents fragmented retrieval
- Event-level chunks align perfectly with the output format (return a list of events, not fragments)

This is simpler and more effective than splitting events into smaller pieces, which would break semantic coherence and require reranking to reassemble results.

---

## Task 5: Creating a Golden Test Data Set

### ✅✅✅ RAGAS Evaluation Results

I created a test dataset with 25 queries covering diverse use cases (baby-friendly activities, date nights, cultural events, free events, location-specific requests). Here are the baseline results using semantic search only:

| Metric | Score | Interpretation |
|--------|-------|----------------|
| **Faithfulness** | 0.581 | Moderate — responses are sometimes not fully grounded in retrieved context |
| **Answer Relevancy** | 0.764 | Good — responses generally address the user's query |
| **Context Precision** | 0.830 | Strong — top-ranked results are highly relevant |
| **Context Recall** | 0.973 | Excellent — system retrieves nearly all relevant events |
| **Average** | 0.787 | Solid overall performance |

### ✅✅✅ Conclusions About Pipeline Performance

**Strengths:**
- **Excellent recall (0.973)** — the system rarely misses relevant events, showing semantic search works well
- **Strong precision (0.830)** — top results are usually relevant, minimizing noise
- **Good answer relevancy (0.764)** — responses address user queries effectively

**Weaknesses:**
- **Lower faithfulness (0.581)** — some responses include details not strictly present in retrieved context, suggesting the LLM occasionally elaborates or infers information
- **Filter application challenges** — queries requesting "free" or specific criteria sometimes retrieved 0 events when filters were too restrictive

**Key insight:** The baseline semantic search performs well for general queries but struggles with explicit constraints (price, baby-friendliness) when applied as hard filters. This suggests metadata filtering needs tuning to balance precision and recall.

---

## Task 6: The Benefits of Advanced Retrieval

### ✅✅✅ Advanced Retrieval Techniques

I planned to implement **metadata filtering optimization** as the primary advanced retrieval technique:

**Metadata Filtering:** Extract explicit requirements from queries (price, baby-friendliness, location, category) and apply them as filters BEFORE semantic search in Qdrant. This reduces the search space and improves precision for queries with specific constraints.

**Why this is useful:** For queries like "free baby-friendly outdoor event," metadata filtering ensures only events meeting all criteria are considered, rather than relying solely on semantic similarity which might return expensive indoor events with high semantic overlap.

### ✅✅✅ Testing Results

I tested an alternative approach using **BM25 keyword search** (labeled as "advanced" in evaluation) instead of metadata filtering. This was implemented as an experiment to compare lexical vs. semantic retrieval.

**Comparison Summary:**

| Metric | Semantic Search (Baseline) | BM25 Keyword Search (Advanced) | Change |
|--------|---------------------------|-------------------------------|--------|
| Faithfulness | 0.581 | 0.507 | -12.7% |
| Answer Relevancy | 0.764 | 0.876 | **+14.7%** |
| Context Precision | 0.830 | 0.683 | -17.7% |
| Context Recall | 0.973 | 0.800 | -17.8% |
| **Average** | **0.787** | **0.717** | **-8.9%** |

**Operational Metrics:**

| Metric | Baseline | Advanced | Change |
|--------|----------|----------|--------|
| Avg Latency | 7.52s | 8.91s | -18.5% (slower) |
| Success Rate | 88% | 100% | +12.0% |
| Avg Events per Query | 8.8 | 8.9 | +0.1 |

**Interpretation:**
- BM25 improved **answer relevancy** (+14.7%) and **success rate** (+12%), meaning it retrieved *something* for every query
- However, it sacrificed **precision** (-17.7%) and **recall** (-17.8%), returning less relevant results overall
- The overall RAGAS score **decreased by 8.9%**, suggesting semantic search is superior for this use case

---

## Task 7: Assessing Performance

### ✅✅✅ Performance Comparison

The "advanced" retrieval technique tested was **BM25 keyword search** rather than fine-tuned embeddings. Here's the full comparison:

| Category | Metric | Baseline (Semantic) | Advanced (BM25) | Improvement |
|----------|--------|---------------------|-----------------|-------------|
| **RAGAS Metrics** | Faithfulness | 0.581 | 0.507 | -12.7% |
| | Answer Relevancy | 0.764 | 0.876 | **+14.7%** |
| | Context Precision | 0.830 | 0.683 | -17.7% |
| | Context Recall | 0.973 | 0.800 | -17.8% |
| | **Average Score** | **0.787** | **0.717** | **-8.9%** |
| **Operational** | Avg Latency | 7.52s | 8.91s | -18.5% (slower) |
| | Success Rate | 88.0% | 100.0% | +12.0% |
| | Avg Events/Query | 8.8 | 8.9 | +0.1 |

### ✅✅✅ Final Conclusions

**Semantic search (baseline) is the better approach** for this use case:
- Higher overall RAGAS score (0.787 vs. 0.717)
- Better precision and recall for finding truly relevant events
- Faster query latency (7.5s vs. 8.9s)
- Handles implicit intent better (romantic, relaxing, high-energy)

**BM25 has limited advantages:**
- 100% success rate (always returns results)
- Better answer relevancy due to keyword matching

**Recommendation:** Stick with semantic search for production, but add smart metadata filtering to handle explicit constraints (price, baby-friendliness) without sacrificing semantic understanding. The ideal system combines semantic search with selective filter application rather than replacing embeddings with keyword search.

### ✅✅✅ Future Improvements (Second Half of Course)

**Enhanced Data Collection:**
- Improve scraping to capture more detailed event metadata
- Follow and scrape related URLs for each event to get full descriptions, reviews, and additional context
- Build a richer knowledge base per event

**Weather Integration:**
- Add real-time weather checking API integration
- For outdoor events, automatically flag weather concerns or suggest alternatives
- Help users make better decisions about outdoor vs. indoor activities

**Improved User Interface:**
- Add checkboxes and dropdown filters to avoid cold start problem
- Let users build queries with a few mouse clicks (price range, baby-friendly toggle, location selector, category checkboxes)
- Combine structured inputs with natural language for more precise queries
- Reduce friction for first-time users who don't know what to ask

These improvements will make the system more robust, context-aware, and user-friendly while maintaining the core semantic search capabilities.

---

## Summary

This project demonstrates a working Agentic RAG system that:
- Scrapes and structures real-world event data
- Uses semantic search to understand user intent
- Employs a 2-agent pipeline for intelligent retrieval and response generation
- Achieves strong RAGAS scores (0.787 average) on a 25-query test set
- Provides fast, personalized recommendations in a clean web interface

The evaluation showed that semantic search outperforms keyword-based retrieval for this use case, but revealed opportunities to improve faithfulness and handle explicit filters more gracefully.

