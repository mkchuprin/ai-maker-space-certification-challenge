#!/bin/bash

# NYC Event Recommender - Quick Start Script

echo "🗽 NYC Event Recommender - Starting..."
echo "======================================"
echo ""

# Check if backend directory exists
if [ ! -d "backend" ]; then
    echo "❌ Error: backend directory not found!"
    exit 1
fi

# Check if frontend directory exists
if [ ! -d "frontend" ]; then
    echo "❌ Error: frontend directory not found!"
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found!"
    echo "Please create .env with:"
    echo "  OPENAI_API_KEY=your_key"
    echo "  LANGCHAIN_API_KEY=your_key"
    exit 1
fi

# Start backend
echo "1️⃣  Starting FastAPI backend..."
echo ""

# Activate virtual environment if it exists
if [ -d ".venv" ]; then
    source .venv/bin/activate
    echo "✅ Virtual environment activated"
fi

# Start uvicorn from project root (not backend directory)
echo "🚀 Starting server on http://localhost:8000"
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
echo "⏳ Waiting for backend to be ready..."
sleep 3

# Check if backend is running
if curl -s http://localhost:8000/health > /dev/null; then
    echo "✅ Backend is running!"
else
    echo "❌ Backend failed to start"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# Open frontend
cd frontend
echo ""
echo "2️⃣  Opening frontend..."
echo ""

# Detect OS and open browser
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    open index.html
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    xdg-open index.html
else
    echo "Please open frontend/index.html in your browser"
fi

echo ""
echo "======================================"
echo "✨ NYC Event Recommender is ready!"
echo "======================================"
echo ""
echo "📍 Backend:  http://localhost:8000"
echo "📍 Frontend: frontend/index.html"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Wait for Ctrl+C
trap "echo ''; echo '🛑 Stopping server...'; kill $BACKEND_PID 2>/dev/null; echo '✅ Server stopped'; exit 0" INT

# Keep script running
wait $BACKEND_PID

