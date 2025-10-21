# NYC Event Recommender - AI Certification Challenge

AI-powered event recommendation system for NYC residents seeking personalized, baby-friendly activities.

## Project Overview

This project builds an Agentic RAG application that recommends NYC events from TimeOut NYC based on user preferences (baby-friendliness, location, price).

**Deadline:** October 21, 7:00 PM ET

## Quick Start

### 1. Install Dependencies

```bash
# Using the install script (easiest!)
chmod +x install.sh
./install.sh

# Or install manually with uv
uv pip install openai langchain langgraph langsmith qdrant-client beautifulsoup4 requests lxml fastapi "uvicorn[standard]" pydantic pydantic-settings ragas pandas numpy jupyter ipykernel python-dotenv
```

### 2. Set Up Environment

```bash
# Copy environment template
cp env.example .env

# Add your API keys to .env
# - OPENAI_API_KEY
# - LANGCHAIN_API_KEY
```

### 3. Run Notebooks

```bash
jupyter notebook
```

Work through notebooks sequentially:
1. `01_data_collection.ipynb` - Scrape TimeOut NYC events
2. `02_data_processing_and_vectordb.ipynb` - Process data & setup Qdrant
3. `03_agentic_rag_pipeline.ipynb` - Build 2-agent system + FastAPI
4. `04_evaluation_and_testing.ipynb` - RAGAS evaluation
5. `05_advanced_retrieval.ipynb` - Metadata filtering optimization

## Project Structure

```
aie-certification-challenge/
├── notebooks/           # Jupyter notebooks (1-5)
├── backend/            # FastAPI backend (4 files)
│   ├── main.py
│   ├── agents.py
│   ├── vector_store.py
│   └── config.py
├── data/
│   ├── raw/           # Scraped CSV files
│   ├── processed/     # Enriched CSV + embeddings
│   └── test_datasets/ # RAGAS evaluation data
└── local_qdrant/      # Vector database
```

## Tech Stack

- **LLM:** OpenAI GPT-4 Turbo
- **Embeddings:** OpenAI text-embedding-3-small
- **Vector DB:** Qdrant (local)
- **Backend:** FastAPI
- **Orchestration:** LangGraph
- **Monitoring:** LangSmith
- **Evaluation:** RAGAS

## Features

- 🎯 2-agent system (Retrieval + Response)
- 🍼 Baby-friendly event filtering
- 🔍 Semantic search + metadata filtering
- ⚡ Fast metadata-based optimization
- 📊 RAGAS evaluation metrics

## Running the Application

### 🚀 Quick Start with Taskfile (Recommended)

```bash
# Start everything (backend + frontend)
task start

# Stop the backend
task stop

# Restart everything
task restart

# Check status
task status
```

### 📱 Using the Web Interface

**Method 1: Using Taskfile**
```bash
task start
```

**Method 2: Manual Start**
```bash
# Terminal 1: Start backend
cd backend
source ../.venv/bin/activate
python -m uvicorn main:app --reload

# Terminal 2: Open frontend
open frontend/index.html
```

The web interface will be available in your browser!
- Search for events using natural language
- Try queries like: "baby-friendly museum", "free outdoor events", "romantic date night"

### 🔧 Running API Only

```bash
# Start FastAPI server
cd backend
python -m uvicorn main:app --reload

# API will be available at http://localhost:8000
# Interactive docs at http://localhost:8000/docs
```

### 🔄 Restarting the App

**If the app is frozen or not responding:**

1. **Stop everything:**
```bash
task stop
# Or manually: pkill -f uvicorn
```

2. **Clear the database lock:**
```bash
task clean-lock
# Or manually: rm -f local_qdrant/.lock
```

3. **Start fresh:**
```bash
task start
```

**Common Issues:**
- **"Cannot connect"**: Make sure backend is running on port 8000
- **"Database locked"**: Run `task clean-lock` or `rm -f local_qdrant/.lock`
- **"500 Error"**: Check that `local_qdrant/` database exists (run notebook 2 first)

### 📋 Available Task Commands

See all commands:
```bash
task --list
```

Useful commands:
- `task start` - Start backend + open frontend
- `task stop` - Stop backend server
- `task restart` - Restart everything
- `task dev` - Start backend only (for development)
- `task test` - Run a test query
- `task status` - Check what's running
- `task clean` - Clean up locks and stop server

## Estimated Time

**Total:** 14-20 hours

- Data Collection: 2-3 hours
- Data Processing + Vector DB: 3-4 hours
- Agentic RAG Pipeline: 3-4 hours
- Evaluation: 3-4 hours
- Advanced Retrieval: 2-3 hours
- Documentation: 1-2 hours

## Documentation

See `implemenation_docs/` for detailed plans:
- `implementation_plan.md` - Complete step-by-step guide
- `nyc_event_recommender.md` - Project design document

## License

MIT

