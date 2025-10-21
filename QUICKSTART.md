# 🚀 Quick Start Guide

Get the NYC Event Recommender running in 2 minutes!

## Prerequisites

✅ Python 3.10+
✅ Virtual environment activated
✅ Dependencies installed
✅ `.env` file with API keys

## Step-by-Step

### 1. Activate Virtual Environment

```bash
source .venv/bin/activate
```

### 2. Start the Backend

```bash
cd backend
python -m uvicorn main:app --reload
```

You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

### 3. Open the Frontend

**Option A: Double-click**
- Navigate to `frontend/` folder
- Double-click `index.html`

**Option B: Command line**
```bash
# From project root
open frontend/index.html

# Or on Linux
xdg-open frontend/index.html
```

### 4. Test It!

1. Type in the search box: `"baby-friendly museum activities"`
2. Click **Search Events**
3. See AI-powered recommendations! 🎉

## ⚠️ Troubleshooting

### Backend won't start

**Error**: `ModuleNotFoundError: No module named 'backend'`

**Fix**: Run from project root with `-m`:
```bash
# From project root
cd backend
python -m uvicorn main:app --reload
```

### Can't connect to backend

**Error**: "Cannot connect to http://localhost:8000"

**Fix**: Make sure backend is running first!
```bash
# Check if it's running
curl http://localhost:8000/health
```

### Virtual environment not activated

**Error**: `command not found: uvicorn`

**Fix**: Activate venv first:
```bash
source .venv/bin/activate
pip install -r requirements.txt  # if needed
```

### Missing API keys

**Error**: OpenAI API errors

**Fix**: Create `.env` file:
```bash
OPENAI_API_KEY=sk-your-key-here
LANGCHAIN_API_KEY=lsv2_your-key-here
```

## 📋 Full Command Sequence

Copy and paste this:

```bash
# Activate environment
source .venv/bin/activate

# Start backend (Terminal 1)
cd backend
python -m uvicorn main:app --reload &

# Wait 3 seconds for startup
sleep 3

# Open frontend
cd ../frontend
open index.html

# Backend is now running in background
# Press Ctrl+C to stop
```

## 🎯 What You'll See

### Backend Output:
```
INFO:     Started server process [12345]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://127.0.0.1:8000
```

### Frontend:
- Beautiful purple gradient header
- Search box with quick filters
- Try: "baby-friendly outdoor events"
- Get AI recommendations with event cards!

## 🔍 Verify It Works

### Test Backend
```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "components": {
    "vector_store": "online",
    "llm": "online",
    "langgraph": "online"
  }
}
```

### Test Search
```bash
curl -X POST http://localhost:8000/recommend \
  -H "Content-Type: application/json" \
  -d '{"query": "baby-friendly events"}'
```

## 📖 More Info

- **Frontend Details**: See `frontend/README.md`
- **Backend API**: Visit `http://localhost:8000/docs`
- **Full Setup**: See main `README.md`

---

**That's it! Enjoy your NYC Event Recommender! 🗽✨**

