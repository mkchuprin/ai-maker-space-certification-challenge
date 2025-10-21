# NYC Event Recommender

AI-powered event recommendation system for NYC residents seeking personalized, baby-friendly activities.

🎥 **[Watch 5-minute demo](https://www.loom.com/share/4d026ecec1304db3b4f581bf84d29ff5)**

## What It Does

Finds NYC events from TimeOut using natural language queries:
- "baby-friendly museum this weekend"
- "free outdoor events" 
- "romantic date night near a museum"

Uses a 2-agent RAG pipeline with semantic search to understand intent and return personalized recommendations.

## Quick Start

```bash
# 1. Install dependencies
chmod +x install.sh
./install.sh

# 2. Add API keys to .env
cp env.example .env
# Edit .env: add OPENAI_API_KEY and LANGCHAIN_API_KEY

# 3. Run the app
task start
# Opens frontend at http://localhost:8000
```

## How to Use

**Run the full app:**
```bash
task start    # Start backend + open frontend
task stop     # Stop everything
```

**Or run notebooks step-by-step:**
```bash
jupyter notebook
# Work through notebooks 01-05 sequentially
```

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

- **LLM:** OpenAI GPT-4o-mini
- **Embeddings:** text-embedding-3-small
- **Vector DB:** Qdrant (local)
- **Backend:** FastAPI + LangGraph
- **Evaluation:** RAGAS

## Features

- 🎯 2-agent system (Retrieval + Response)
- 🍼 Baby-friendly event filtering
- 🔍 Semantic search
- 📊 RAGAS evaluation (0.787 avg score)

## Troubleshooting

**App frozen or not responding?**
```bash
task stop
task clean-lock
task start
```

**Common issues:**
- "Cannot connect" → Backend not running on port 8000
- "Database locked" → Run `task clean-lock`
- "500 Error" → Run notebook 2 to create database

## Documentation

- `answer.md` - Assignment responses
- `implemenation_docs/` - Detailed design docs
- `notebooks/` - Step-by-step implementation

