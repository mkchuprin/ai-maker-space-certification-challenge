# NYC Event Recommender — Implementation Plan

This plan breaks down the Certification Challenge into **6 Jupyter notebooks**, each corresponding to a major task or component.

---

## Overview

**Goal:** Build an end-to-end Agentic RAG application that recommends NYC events from TimeOut NYC based on user preferences (mood, energy level, baby-friendliness, location).

**Architecture:** FastAPI backend with agentic RAG pipeline, Qdrant vector database, and optional Streamlit frontend.

**Project Structure (SIMPLIFIED):**
```
aie-certification-challenge/
├── notebooks/
│   ├── 01_data_collection.ipynb
│   ├── 02_data_processing_and_vectordb.ipynb    # Combined: processing + vector DB
│   ├── 03_agentic_rag_pipeline.ipynb            # Renumbered from 04
│   ├── 04_evaluation_and_testing.ipynb          # Renumbered from 05
│   └── 05_advanced_retrieval.ipynb              # Renumbered from 06
├── backend/
│   ├── main.py                  # FastAPI app with all routes
│   ├── agents.py                # All agent logic (Retrieval + Response)
│   ├── vector_store.py          # Qdrant operations
│   └── config.py                # Environment config (already created)
├── data/
│   ├── raw/                     # Scraped HTML/CSV
│   ├── processed/               # Structured event data + embeddings
│   └── test_datasets/           # Golden test sets + RAGAS results
├── local_qdrant/                # Qdrant vector DB (persisted)
├── pyproject.toml
├── env.example                  # Already created
└── README.md
```

---

## Notebook 1: Data Collection
**File:** `notebooks/01_data_collection.ipynb`

### Objectives
- Scrape TimeOut NYC's "Things to Do This Weekend" page
- Parse event listings (title, description, date, category, price, location)
- Save raw data to disk

### Tasks
1. **Setup Environment**
   - Install dependencies: `beautifulsoup4`, `requests`, `lxml`, `selenium` (if needed)
   - Set up user agent and headers to avoid blocking

2. **Web Scraping**
   - Fetch HTML from: `https://www.timeout.com/newyork/things-to-do/things-to-do-in-nyc-this-weekend`
   - Use BeautifulSoup to parse event cards
   - Extract:
     - Event title
     - Description/summary
     - Date/time
     - Category (e.g., Arts, Food & Drink, Family)
     - Price (free, $, $$, $$$)
     - Location/neighborhood
     - URL to full event page

3. **Data Validation**
   - Check for missing fields
   - Log number of events scraped
   - Preview first 5 events

4. **Save Raw Data**
   - Export to `data/raw/timeout_events_YYYYMMDD.csv`
   - Include columns: event_id, title, description, date, category, price, location, url, scraped_at
   - Keep a backup in case of scraping issues

### Deliverables
- CSV file with ~100 events
- Summary statistics (event count, categories, price distribution)

---

## Notebook 2: Data Processing & Vector Database (COMBINED)
**File:** `notebooks/02_data_processing_and_vectordb.ipynb`

### Objectives
- Clean and structure event data
- Use LLM to extract additional metadata (mood, energy level, baby-friendliness)
- Generate embeddings for semantic search
- **Set up Qdrant and index all events**

### Tasks
1. **Load Raw Data**
   - Read from `data/raw/timeout_events_YYYYMMDD.csv` using pandas

2. **LLM-Based Feature Extraction**
   - For each event, prompt GPT-4 Turbo to extract:
     - **Baby-friendly:** `baby_friendly: bool` (if True, implies stroller-accessible)
   - Use structured output (JSON mode) for consistency
   - **Note:** Keeping it simple - only extracting baby_friendly flag, no mood or energy tags needed

3. **Create Embeddings**
   - Use OpenAI's `text-embedding-3-small`
   - Embed: `f"{title} {description}"`
   - Store embeddings alongside metadata

4. **Save Processed Data**
   - Export to `data/processed/events_with_embeddings.csv`
   - Include columns: event_id, title, description, date, category, price, location, url, baby_friendly
   - Save embeddings separately to `data/processed/embeddings.npy` (numpy array format)

5. **Initialize Qdrant & Upload Events**
   ```python
   from qdrant_client import QdrantClient
   from qdrant_client.models import Distance, VectorParams
   
   client = QdrantClient(path="./local_qdrant")
   client.create_collection(
       collection_name="nyc_events",
       vectors_config=VectorParams(size=1536, distance=Distance.COSINE)
   )
   ```
   - Batch upload events with embeddings and metadata

6. **Test Retrieval**
   - Query: "fun outdoor activity for kids"
   - Retrieve top 5 results
   - Verify metadata filtering works (e.g., `baby_friendly=True`)

7. **Create Utility Module**
   - Save functions to `backend/vector_store.py`:
     - `initialize_qdrant()`
     - `upload_events(events: list)`
     - `search_events(query: str, filters: dict, top_k: int)`

### Deliverables
- CSV file with enriched metadata
- Qdrant database with ~100 events indexed
- Working similarity search
- `backend/vector_store.py` utility module

---

## Notebook 3: Agentic RAG Pipeline (SIMPLIFIED)
**File:** `notebooks/03_agentic_rag_pipeline.ipynb`

### Objectives
- Build **2-agent system** using LangGraph
- Deploy local FastAPI endpoint with `/recommend` route
- Test end-to-end functionality

### Tasks
1. **Design Agent Workflow (SIMPLIFIED)**
   ```
   User Query → Retrieval Agent → Response Agent → Output
   ```

2. **Implement 2 Agents in `backend/agents.py`**

   **Agent 1: Retrieval Agent**
   - Analyzes user query to extract filters (price, location, baby_friendly, category)
   - Embeds query using OpenAI
   - Searches Qdrant with semantic search + metadata filters
   - Returns top-10 event candidates
   - Example: Query "baby-friendly park event" → filters `{"baby_friendly": True, "category": "outdoor"}`
   - Note: baby_friendly=True implies stroller-accessible
   - **Simplified:** Semantic search handles nuance (romantic, relaxing, etc.) - no need for explicit mood/energy tags

   **Agent 2: Response Agent**
   - Takes retrieved events
   - Formats output naturally using GPT-4
   - Highlights key details (price, location, baby-friendliness)
   - Returns markdown-formatted response
   - Example: "Here are 3 baby-friendly events this Saturday near Prospect Park..."

3. **Build LangGraph Pipeline**
   - Define 2 nodes (retrieval, response)
   - Simple linear flow (no conditional edges needed)
   - **Implement LangSmith logging:**
     - Set up tracing for agent hops
     - Log inputs/outputs for debugging
     - Track latency and token usage

4. **Create FastAPI App in `backend/main.py`**
   ```python
   from fastapi import FastAPI
   from pydantic import BaseModel
   
   app = FastAPI(title="NYC Event Recommender")
   
   class QueryRequest(BaseModel):
       query: str
       top_k: int = 5
   
   @app.post("/recommend")
   def recommend_events(request: QueryRequest):
       results = agent_pipeline.run(request.query, top_k=request.top_k)
       return {"events": results}
   ```

5. **Test End-to-End**
   - Start server: `uvicorn backend.main:app --reload`
   - Test with 5+ queries:
     - "What's a free outdoor event this Saturday that's baby-friendly?"
     - "Romantic date night near Prospect Park"
     - "High-energy activity with friends"
     - "Relaxing cultural event for adults"
     - "Kid-friendly museum activity"

6. **Document Agent Architecture**
   - **Add markdown cell explaining:**
     - Where each agent appears in the flow
     - How agentic reasoning is used (Retrieval Agent decides filters, Response Agent formats output)
     - Why 2 agents are sufficient (simpler, faster, easier to debug)
     - Workflow diagram: User → Retrieval → Response → User
   - This satisfies Task 2 requirements

### Deliverables
- `backend/agents.py` with 2 agents
- `backend/main.py` with FastAPI server
- FastAPI server running locally (`localhost:8000`)
- Sample outputs for 5+ test queries
- Agent architecture documentation (in notebook markdown cells)

---

## Notebook 4: Evaluation and Testing
**File:** `notebooks/04_evaluation_and_testing.ipynb`

### Objectives
- Create golden test dataset (synthetic + real)
- Evaluate with RAGAS metrics
- Generate performance report

### Tasks
1. **Create Golden Test Dataset**
   - **Real queries:** Ask 3-5 friends/family for typical event queries
   - **Synthetic queries:** Use LLM to generate 20 diverse queries
   - For each query, manually label:
     - Expected event categories
     - Expected mood tags
     - Minimum relevance threshold

2. **Generate Ground Truth**
   - For each query, manually select 3-5 "ideal" events from the dataset
   - Store as: `{query, ground_truth_event_ids, context}`

3. **Run RAGAS Evaluation**
   - Metrics:
     - **Faithfulness:** Are responses grounded in retrieved events?
     - **Answer Relevancy:** Do responses address the query?
     - **Context Precision:** Are top-ranked results relevant?
     - **Context Recall:** Are all relevant events retrieved?

4. **Analyze Results**
   - Create table with scores:
   
   | Metric | Score | Notes |
   |--------|-------|-------|
   | Faithfulness | 0.92 | High, but 2 hallucinations detected |
   | Answer Relevancy | 0.88 | Some verbose responses |
   | Context Precision | 0.85 | Top-3 results highly relevant |
   | Context Recall | 0.79 | Missed some edge cases |
   
   - **Save results to CSV:** `data/test_datasets/ragas_baseline_results.csv`
   - Include columns: query, faithfulness, answer_relevancy, context_precision, context_recall, avg_score

5. **Error Analysis**
   - Identify failure modes (e.g., "beach events" when there are none)
   - Document edge cases for future improvement
   - **Write summary document:** `data/test_datasets/error_analysis.md`

### Deliverables
- Golden test dataset (25+ queries) saved to `data/test_datasets/golden_test_set.csv`
- RAGAS evaluation results saved to `data/test_datasets/ragas_baseline_results.csv`
- Error analysis summary in `data/test_datasets/error_analysis.md`

---

## Notebook 5: Advanced Retrieval (SIMPLIFIED - Metadata Filtering)
**File:** `notebooks/05_advanced_retrieval.ipynb`

### Objectives
- Implement **metadata filtering optimization** (easiest, no external libraries)
- Compare baseline vs. filtered retrieval
- Re-evaluate with RAGAS

### Tasks
1. **Implement Metadata Filtering Strategy**
   
   **Baseline (from Notebook 3):**
   - Semantic search only
   - Returns top-k results by vector similarity
   
   **Advanced: Smart Metadata Filtering**
   - Extract explicit requirements from query using LLM
   - Apply hard filters BEFORE semantic search:
     - Price: `{"price": "free"}` if query mentions "free"
     - Baby-friendly: `{"baby_friendly": True}` if query mentions "baby", "stroller", "infant", "toddler"
       - Note: baby_friendly=True automatically implies stroller-accessible
     - Category: `{"category": "outdoor"}` if mentions outdoor/park/nature
     - Location: `{"location": "Prospect Park"}` if specific place mentioned
     - Date: Filter by weekend/weekday if specified
   - Then perform semantic search on filtered subset
   - **Key insight:** Semantic search naturally captures mood/vibe - no need for explicit tags
   - This reduces search space and improves precision
   
   **Example:**
   - Query: "free outdoor baby-friendly event"
   - Filters: `{"price": "free", "baby_friendly": True, "category": "outdoor"}`
   - Search only within ~20 filtered events instead of all 100

2. **Update Retrieval Agent**
   - Modify `backend/agents.py` Retrieval Agent
   - Add filter extraction logic
   - Apply filters to Qdrant search using `Filter` class
   ```python
   from qdrant_client.models import Filter, FieldCondition, MatchValue
   
   filters = Filter(
       must=[
           FieldCondition(key="baby_friendly", match=MatchValue(value=True)),
           FieldCondition(key="price", match=MatchValue(value="free"))
       ]
   )
   results = client.search(collection_name="nyc_events", query_vector=embedding, query_filter=filters)
   ```

3. **A/B Testing**
   - Run golden test dataset through:
     - **Baseline:** Semantic search only (no filters)
     - **Advanced:** Metadata filtering + semantic search
   - Compare RAGAS scores side-by-side
   - **Save comparison results:** `data/test_datasets/ragas_advanced_results.csv`

4. **Performance Analysis**
   - Latency comparison (should be faster with filtering)
   - Cost analysis (same API calls, but fewer irrelevant results)
   - Quality improvement (RAGAS delta)
   - **Create comparison table:**
   
   | Metric | Baseline | Metadata Filtering | Improvement |
   |--------|----------|-------------------|-------------|
   | Faithfulness | 0.85 | 0.89 | +4.7% |
   | Context Precision | 0.82 | 0.91 | +11.0% |
   | Avg Latency (s) | 2.1 | 1.8 | +14% faster |
   | Relevant results (%) | 65% | 88% | +23% |

5. **Document Findings**
   - **Add markdown cells explaining:**
     - ✅✅✅ Why metadata filtering works well for this use case
     - Specific examples of queries that improved
     - Trade-offs: Requires good filter extraction, may miss edge cases
     - Recommendation: Use metadata filtering for production (simple + effective)

### Deliverables
- Updated `backend/agents.py` with metadata filtering
- RAGAS comparison results saved to `data/test_datasets/ragas_advanced_results.csv`
- Performance comparison table (in notebook)
- Written justification for metadata filtering approach

---

## Documentation: Create README.md
**File:** `README.md`

### Markdown Writing Guidelines
- When answering questions or highlighting key information in markdown cells, use **✅✅✅** to identify important answers for easy visibility
- Example: "✅✅✅ The chunking strategy uses event-level chunks because..."

### Required Sections

1. **Project Overview**
   - Project title and one-line description
   - Problem statement (from Task 1)
   - Solution overview (from Task 2)
   - Key features

2. **Architecture**
   - Tech stack table with justifications
   - Agent architecture diagram (or description)
   - Data flow overview

3. **Setup Instructions**
   - Prerequisites (Python version, API keys needed)
   - Clone repository
   - Install dependencies: `poetry install` or `pip install -r requirements.txt`
   - Set up `.env` file (copy from `env.example`)
   - Instructions to populate API keys:
     - OpenAI API key
     - LangSmith API key

4. **How to Run**
   - **Data Collection:** `jupyter notebook notebooks/01_data_collection.ipynb`
   - **Process Data:** Run notebooks 2-3 sequentially
   - **Start FastAPI Backend:** `uvicorn backend.api.main:app --reload`
   - **Run Streamlit UI (optional):** `streamlit run frontend/streamlit_app.py`
   - **Run Evaluation:** `jupyter notebook notebooks/05_evaluation_and_testing.ipynb`

5. **Project Structure**
   - Explain folder organization
   - Key files and their purposes

6. **Evaluation Results**
   - Link to RAGAS results
   - Summary of key metrics
   - Performance improvements from advanced retrieval

7. **Future Improvements**
   - Potential enhancements
   - Known limitations

### Example Structure
```markdown
# NYC Event Recommender

AI-powered event recommendation system for NYC residents seeking personalized, baby-friendly activities.

## Problem Statement
[Your 1-sentence problem statement]

## Setup
\`\`\`bash
# Clone and install
git clone <your-repo>
cd aie-certification-challenge
poetry install

# Configure environment
cp env.example .env
# Add your API keys to .env

# Run notebooks sequentially
jupyter notebook
\`\`\`

## Running the Application
...
```

---

## Timeline Estimate (ULTRA-SIMPLIFIED)

| Task | Estimated Time | Priority | Notes |
|----------|----------------|----------|-------|
| 1. Data Collection | 2-3 hours | High | Scraping + CSV export |
| 2. Data Processing + Vector DB | 3-4 hours | **Critical** | Only extracting baby_friendly (faster!) |
| 3. Agentic RAG Pipeline (2 agents) | 3-4 hours | **Critical** | Simplified filtering logic |
| 4. Evaluation | 3-4 hours | **Critical** | RAGAS testing |
| 5. Advanced Retrieval (Metadata) | 2-3 hours | High | Simple boolean filters |
| README.md & Documentation | 1-2 hours | **Critical** | All required sections |
| **Total** | **14-20 hours** | | **~45% time savings** |

### Time Savings Breakdown
- ✅ Combined notebooks 2 & 3: **-1 hour**
- ✅ Simplified backend structure: **-2 hours**
- ✅ Reduced to 2 agents: **-2 hours**
- ✅ Removed Streamlit UI: **-2.5 hours**
- ✅ Simplified advanced retrieval: **-2 hours**
- ✅ **Removed mood/energy extraction: -1 hour** 🆕
- **Total saved: 10-15 hours**

---

## Next Steps (SIMPLIFIED WORKFLOW)

1. ✅ Set up project structure
2. ✅ Install dependencies (see `pyproject.toml`)
3. ✅ Create `.env` file from `env.example` and add API keys
4. **Start with Notebook 1** (Data Collection) - 2-3 hours
5. **Notebook 2** (Data Processing + Vector DB) - 4-5 hours
6. **Notebook 3** (Agentic RAG Pipeline with FastAPI) - 3-4 hours
7. **Test end-to-end** - Run FastAPI server and test queries
8. **Notebook 4** (Evaluation with RAGAS) - 3-4 hours
9. **Notebook 5** (Advanced Retrieval - Metadata Filtering) - 2-3 hours
10. **Create README.md** with all required sections - 1-2 hours
11. **Review submission checklist** and ensure all items are complete
12. **Submit before October 21, 7:00 PM ET**

---

## Dependencies (pyproject.toml) - SIMPLIFIED

```toml
[tool.poetry.dependencies]
python = "^3.10"

# Core AI/ML
openai = "^1.0.0"
langchain = "^0.1.0"
langgraph = "^0.0.20"
langsmith = "^0.0.40"

# Vector Database
qdrant-client = "^1.7.0"

# Web Scraping
beautifulsoup4 = "^4.12.0"
requests = "^2.31.0"
lxml = "^4.9.0"

# API Backend
fastapi = "^0.104.0"
uvicorn = "^0.24.0"
pydantic = "^2.0.0"
pydantic-settings = "^2.0.0"

# Evaluation
ragas = "^0.1.0"

# Data Processing
pandas = "^2.1.0"
numpy = "^1.24.0"

# Development
jupyter = "^1.0.0"
python-dotenv = "^1.0.0"

# REMOVED (not needed with simplifications):
# - streamlit (no UI)
# - sentence-transformers (using OpenAI embeddings only)
# - rank-bm25 (not using hybrid search)
# - pyarrow (not using parquet)
```

---

## Success Criteria (SIMPLIFIED)

- [ ] Successfully scrape and process 80+ events from TimeOut NYC
- [ ] Qdrant database operational with semantic search + metadata filtering
- [ ] **2-agent pipeline** responds to queries in <5 seconds
- [ ] RAGAS scores: Faithfulness >0.85, Context Precision >0.80
- [ ] Metadata filtering improves scores by 5-10%
- [ ] FastAPI backend running on `localhost:8000`
- [ ] All **5 notebooks** run end-to-end without errors
- [ ] README.md complete with setup instructions

---

## Submission Checklist (Due October 21 by 7:00 PM ET)

📋 **Complete this checklist before submitting via [Submission Form](https://forms.gle/4viHEd5BgAwW7mbi7)**

### Quick Reference: Where to Find Everything (SIMPLIFIED)
- **Tasks 1-3:** Documentation in `nyc_event_recommender.md` ✅ (mostly complete)
- **Task 4:** Implementation in Notebooks 1-3 (scraping → processing+DB → 2 agents+FastAPI)
- **Task 5:** Implementation in Notebook 4 (evaluation)
- **Task 6:** Implementation in Notebook 5 (metadata filtering)
- **README.md:** See "Documentation: Create README.md" section
- **Backend Code:** Simplified structure (lines 22-35): main.py, agents.py, vector_store.py, config.py

---

### Task 1: Define Your Problem and Audience (AI Product Management)
*📄 Documentation: See `nyc_event_recommender.md` lines 8-21*
- [ ] Written a **1-sentence problem statement**
- [ ] Written **1-2 paragraphs** explaining why it matters for your user
- [ ] Identified your target user clearly
- [ ] Described what part of their job/life you're automating

### Task 2: Propose a Solution (AI Engineering)
*📄 Documentation: See `nyc_event_recommender.md` lines 24-68*
- [ ] Written **1-2 paragraphs** describing your solution (look and feel)
- [ ] Created a **tech stack table** with justifications including:
  - [ ] LLM choice and reason
  - [ ] Embedding model choice and reason
  - [ ] Orchestration framework and reason
  - [ ] Vector database choice and reason
  - [ ] Monitoring tool and reason
  - [ ] Evaluation framework and reason
  - [ ] UI framework and reason
- [ ] Described **where agents appear** in your app *(→ Notebook 4, Task 6)*
- [ ] Explained **how you'll use agentic reasoning** *(→ Notebook 4, Task 6)*

### Task 3: Dealing with Data (AI Systems Engineering)
*📄 Documentation: See `nyc_event_recommender.md` lines 72-92*
- [ ] Described **all data sources** (TimeOut NYC) *(→ Notebook 1)*
- [ ] Documented any **external APIs** (Tavily, SerpAPI if used) *(→ Optional)*
- [ ] Explained your **default chunking strategy** (event-level chunks) *(→ Notebook 2)*
- [ ] Justified your **design decisions** *(→ Throughout documentation)*
- [ ] Gathered feedback from real users (optional but recommended)

### Task 4: Build an End-to-End Agentic RAG Prototype
*💻 Implementation: Notebooks 1-3 (SIMPLIFIED)*
- [ ] **Scraped data** from TimeOut NYC *(→ Notebook 1)*
- [ ] **Processed and embedded** event data with LLM-extracted metadata *(→ Notebook 2)*
- [ ] **Set up Qdrant** vector database with indexed events *(→ Notebook 2, combined)*
- [ ] **Built 2-agent pipeline** using LangGraph in `backend/agents.py`: *(→ Notebook 3)*
  - [ ] Retrieval Agent (analyzes query + retrieves from Qdrant)
  - [ ] Response Agent (formats output naturally)
- [ ] **Deployed FastAPI endpoint** in `backend/main.py` running locally *(→ Notebook 3)*
- [ ] Tested with **5+ diverse queries** *(→ Notebook 3)*
- [ ] Verified end-to-end functionality

### Task 5: Create a Golden Test Dataset (AI Evaluation & Performance Engineering)
*💻 Implementation: Notebook 4*
- [ ] Prepared **test dataset** with 25+ queries (synthetic + real) *(→ Notebook 4)*
- [ ] Created **ground truth labels** for each query
- [ ] Ran **RAGAS evaluation** with all 4 metrics:
  - [ ] Faithfulness
  - [ ] Response Relevancy (Answer Relevancy)
  - [ ] Context Precision
  - [ ] Context Recall
- [ ] Created a **results table** with scores
- [ ] Written a **summary of findings** *(→ save to error_analysis.md)*
- [ ] Documented **error analysis** and failure modes
- [ ] **Saved results to CSV** *(→ data/test_datasets/ragas_baseline_results.csv)*

### Task 6: Advanced Retrieval (SIMPLIFIED - Metadata Filtering Only)
*💻 Implementation: Notebook 5*
- [ ] Described **metadata filtering technique** *(→ Notebook 5)*
- [ ] Justified **why metadata filtering is relevant** to this use case *(→ in notebook markdown)*
- [ ] **Implemented metadata filtering optimization:**
  - [ ] Extract filters from query (price, baby_friendly, location, category)
  - [ ] Apply filters BEFORE semantic search in Qdrant
  - [ ] Updated Retrieval Agent in `backend/agents.py`
  - [ ] Note: baby_friendly filter automatically implies stroller-accessible
  - [ ] Note: Semantic search handles mood/vibe naturally - no explicit tags needed
- [ ] **Compared baseline vs. metadata filtering** retrieval
- [ ] Documented **performance improvements** (RAGAS scores, latency, precision)
- [ ] **Saved comparison results to CSV** *(→ data/test_datasets/ragas_advanced_results.csv)*

### Documentation & Code Quality (SIMPLIFIED)
- [ ] All **5 notebooks** are complete and runnable *(→ notebooks/ folder)*
- [ ] **README.md** includes: *(→ See "Documentation: Create README.md" section)*
  - [ ] Project overview
  - [ ] Setup instructions  
  - [ ] How to run the application
  - [ ] Dependencies and environment setup
- [ ] **env.example** file with required API keys listed *(→ Already created ✅)*
- [ ] **Code is well-commented** and organized
- [ ] **Simplified FastAPI backend** (4 files only):
  - [ ] `backend/main.py` - FastAPI app with /recommend route
  - [ ] `backend/agents.py` - 2 agents (Retrieval + Response)
  - [ ] `backend/vector_store.py` - Qdrant operations
  - [ ] `backend/config.py` - Already created ✅

### Final Deliverables Package (SIMPLIFIED)
*📦 Folder Structure: See lines 13-35*
- [ ] All notebooks (01-05) in `/notebooks/` folder
  - [ ] 01_data_collection.ipynb
  - [ ] 02_data_processing_and_vectordb.ipynb
  - [ ] 03_agentic_rag_pipeline.ipynb
  - [ ] 04_evaluation_and_testing.ipynb
  - [ ] 05_advanced_retrieval.ipynb
- [ ] Backend code in `/backend/` folder (4 files):
  - [ ] main.py
  - [ ] agents.py
  - [ ] vector_store.py
  - [ ] config.py ✅
- [ ] Data files in `/data/` folder:
  - [ ] raw/ → `timeout_events_YYYYMMDD.csv`
  - [ ] processed/ → `events_with_embeddings.csv` + `embeddings.npy`
  - [ ] test_datasets/ → golden test set + RAGAS results
- [ ] Documentation in `/implemenation_docs/` folder:
  - [ ] nyc_event_recommender.md ✅
  - [ ] implementation_plan.md (this document) ✅
- [ ] RAGAS evaluation results in `/data/test_datasets/`:
  - [ ] golden_test_set.csv
  - [ ] ragas_baseline_results.csv
  - [ ] ragas_advanced_results.csv
  - [ ] error_analysis.md
- [ ] Screenshots of FastAPI in action (optional but helpful)

### Submission Form
- [ ] Filled out the [submission form](https://forms.gle/4viHEd5BgAwW7mbi7)
- [ ] Provided GitHub repo link or zipped project
- [ ] Included any additional notes or context
- [ ] Submitted **before October 21, 7:00 PM ET**

---

### Bonus Points (Optional)
- [ ] Used OSS models instead of OpenAI API
- [ ] Deployed to cloud (AWS, GCP, Render, etc.)
- [ ] Created a polished demo video
- [ ] Gathered real user feedback and iterated
- [ ] Implemented additional advanced features
- [ ] Added comprehensive logging and monitoring
- [ ] Created automated tests

---

**Estimated Time to Complete:** 21-27 hours  
**Estimated Value:** $10K-$20K consulting project

Good luck! 🚀

