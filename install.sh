#!/bin/bash
# Quick installation script using uv

echo "🚀 Creating virtual environment with Python 3.10..."
uv venv --python 3.10 --no-workspace

echo "Activating virtual environment..."
source .venv/bin/activate

echo "🚀 Installing dependencies with uv..."

uv pip install \
  openai \
  langchain \
  langgraph \
  langsmith \
  qdrant-client \
  beautifulsoup4 \
  requests \
  lxml \
  fastapi \
  "uvicorn[standard]" \
  pydantic \
  pydantic-settings \
  ragas \
  pandas \
  numpy \
  jupyter \
  ipykernel \
  python-dotenv

echo "✅ All packages installed!"
echo ""
echo "Next steps:"
echo "1. Copy env.example to .env and add your API keys"
echo "2. Run: jupyter notebook"
echo "3. Start with notebooks/01_data_collection.ipynb"

