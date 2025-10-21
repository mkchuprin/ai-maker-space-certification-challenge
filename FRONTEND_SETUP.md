# 🎨 Frontend Setup Guide

Quick guide to run the NYC Event Recommender web interface.

## ⚡ Quick Start (2 steps)

### Step 1: Start the Backend

```bash
cd backend
uvicorn main:app --reload
```

You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

### Step 2: Open the Frontend

```bash
cd frontend
open index.html
```

Or just **drag `frontend/index.html` into your browser**!

That's it! 🎉

## 🧪 Test It

1. **Type a query**: "baby-friendly outdoor events"
2. **Click Search** or press Enter
3. **See AI recommendations** with event cards!

## 📸 What You'll See

### Search Interface
- Clean search box with natural language input
- Quick filter chips for common queries
- Beautiful purple gradient header

### Results
- AI-generated summary with personalized recommendations
- Extracted filters (baby-friendly, price, etc.)
- Event cards with:
  - Title and description
  - Match score (%)
  - Baby-friendly badge
  - Direct link to TimeOut NYC

### Features
- ⚡ Fast semantic search
- 🎯 Smart filter extraction
- 📱 Mobile-responsive design
- 🤖 GPT-4 powered responses
- ✨ Smooth animations

## 🎯 Example Queries

Try these searches:

- **Family-friendly**: "baby-friendly museum activities"
- **Date night**: "romantic evening events in Manhattan"
- **Budget**: "free outdoor activities this weekend"
- **Accessibility**: "stroller-accessible parks"
- **General**: "fun things to do in NYC"

## 🔧 Configuration

The frontend is configured to connect to:
```
http://localhost:8000
```

To change this, edit `frontend/app.js`:
```javascript
const API_BASE_URL = 'http://localhost:8000';
```

## 📁 Frontend Files

```
frontend/
├── index.html     # Main HTML page
├── styles.css     # All styling
├── app.js         # JavaScript logic
└── README.md      # Detailed docs
```

**Total size**: < 100KB (no build step needed!)

## 🐛 Troubleshooting

### "Cannot connect to backend"
**Fix**: Start the backend first!
```bash
cd backend
uvicorn main:app --reload
```

### "CORS error"
**Fix**: Already handled! CORS is enabled in `backend/main.py`

### "No events found"
**Fix**: 
1. Check that Qdrant database exists: `ls local_qdrant/`
2. Run notebook 2 to populate the database
3. Try broader search terms

## 🚀 Production Deployment

### Option 1: Serve from FastAPI
Add to `backend/main.py`:
```python
from fastapi.staticfiles import StaticFiles

app.mount("/", StaticFiles(directory="frontend", html=True), name="frontend")
```

Then access at: `http://localhost:8000/`

### Option 2: Static Hosting
Deploy `frontend/` folder to:
- GitHub Pages
- Vercel
- Netlify
- Any static host

Update `API_BASE_URL` to your deployed backend URL.

## 🎨 Screenshots

### Desktop View
- Full-width search bar
- 3-column event grid
- Gradient header with emoji

### Mobile View
- Single column layout
- Touch-friendly buttons
- Responsive cards

## 💡 Tips

1. **Quick Filters**: Click the chips below the search bar for instant queries
2. **Natural Language**: Type like you're asking a friend
3. **Filters**: The AI automatically extracts baby-friendly, price, location preferences
4. **Click Cards**: Click anywhere on an event card to open the full details

## ⭐ Features Highlight

| Feature | Description |
|---------|-------------|
| 🔍 Semantic Search | Understands meaning, not just keywords |
| 🎯 Auto Filters | Extracts baby-friendly, price, location |
| ⚡ Fast | Results in < 2 seconds |
| 📱 Responsive | Works on all devices |
| 🎨 Modern UI | Beautiful gradient design |
| 🤖 AI-Powered | GPT-4 generates personalized responses |

---

**Enjoy your NYC Event Recommender! 🗽✨**

