# NYC Event Recommender - Frontend

Beautiful, modern web interface for the NYC Event Recommender AI system.

## ✨ Features

- **🔍 Smart Search**: Natural language queries with AI-powered recommendations
- **⚡ Real-time Results**: Fast responses with semantic search
- **🎯 Filter Extraction**: Automatically detects baby-friendly, price, location preferences
- **📱 Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **🎨 Modern UI**: Clean, gradient-based design with smooth animations
- **💬 AI Responses**: Formatted markdown responses from GPT-4

## 🚀 Quick Start

### 1. Start the Backend

First, make sure your FastAPI backend is running:

```bash
cd backend
uvicorn main:app --reload
```

The backend should be running on `http://localhost:8000`

### 2. Open the Frontend

Simply open `index.html` in your browser:

```bash
# From the frontend directory
open index.html

# Or on Linux
xdg-open index.html

# Or just drag index.html into your browser
```

No build step required! It's pure HTML/CSS/JavaScript.

## 🎯 How to Use

1. **Type a query** in the search box, such as:
   - "baby-friendly outdoor events"
   - "romantic date night in Manhattan"
   - "free museum activities this weekend"

2. **Or use quick filters** by clicking the chips:
   - 👶 Baby-Friendly
   - 💰 Free Events
   - ❤️ Date Night
   - 🚼 Stroller-Friendly
   - 👨‍👩‍👧‍👦 Family Fun

3. **View results** with:
   - AI-generated response summary
   - Filters automatically extracted
   - Event cards with details and links

## 📁 File Structure

```
frontend/
├── index.html      # Main HTML structure
├── styles.css      # All styling (responsive, modern design)
├── app.js          # JavaScript logic (API calls, DOM manipulation)
└── README.md       # This file
```

## 🎨 Design Features

### Color Palette
- **Primary**: Purple gradient (#667eea → #764ba2)
- **Secondary**: Green (#10B981)
- **Background**: Light gray (#F9FAFB)
- **Surface**: White (#FFFFFF)

### Components
- **Search Card**: Prominent search with quick filters
- **Event Cards**: Hover effects, badges, scores
- **Loading States**: Spinner with smooth transitions
- **Modal**: About section with tech stack details
- **Responsive Grid**: Adapts to screen size

## 🔧 Configuration

To change the API endpoint, edit `app.js`:

```javascript
const API_BASE_URL = 'http://localhost:8000';
```

## 🌐 API Integration

The frontend connects to these backend endpoints:

### `POST /recommend`
```json
{
  "query": "baby-friendly outdoor events"
}
```

**Response:**
```json
{
  "query": "...",
  "filters": {
    "baby_friendly": true
  },
  "response": "AI-generated markdown response...",
  "events": [
    {
      "event": {
        "title": "...",
        "description": "...",
        "baby_friendly": true,
        "url": "..."
      },
      "score": 0.85
    }
  ],
  "num_events": 5
}
```

### `GET /health`
Health check endpoint to verify backend is running.

## 📱 Responsive Breakpoints

- **Desktop**: > 768px (3-column grid)
- **Tablet**: 768px - 480px (2-column grid)
- **Mobile**: < 480px (single column)

## ⚡ Performance

- **No Framework Overhead**: Pure vanilla JavaScript
- **Fast Load Time**: < 100KB total size
- **Optimized Animations**: Hardware-accelerated CSS
- **Lazy Loading**: Results load on demand

## 🎯 Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers

## 🐛 Troubleshooting

### Backend Not Running
**Error**: Connection refused or CORS error

**Solution**: 
1. Start the backend: `uvicorn main:app --reload`
2. Verify it's running: `http://localhost:8000/health`

### No Results
**Issue**: Query returns no events

**Solutions**:
- Try broader search terms
- Remove specific filters
- Check that vector database has data

### CORS Errors
**Issue**: Cross-origin request blocked

**Solution**: Backend already has CORS enabled. Make sure you're using the correct API URL.

## 🚀 Deployment

### Option 1: GitHub Pages (Static)
1. Push `frontend/` folder to GitHub
2. Enable GitHub Pages in repo settings
3. Update `API_BASE_URL` to your deployed backend

### Option 2: Vercel/Netlify
1. Deploy `frontend/` folder
2. Set environment variable for API URL
3. Update `app.js` to use environment variable

### Option 3: Same Server as Backend
1. Serve frontend as static files from FastAPI
2. Update `main.py` to mount static directory:

```python
from fastapi.staticfiles import StaticFiles

app.mount("/", StaticFiles(directory="frontend", html=True), name="frontend")
```

## 🎨 Customization

### Change Colors
Edit CSS variables in `styles.css`:

```css
:root {
    --primary-color: #4F46E5;
    --secondary-color: #10B981;
    /* ... more variables */
}
```

### Add Features
The code is well-structured for easy extension:
- Add more quick filter chips in `index.html`
- Customize event card layout in `createEventCard()`
- Add sorting/filtering options

## 📊 Tech Stack

- **HTML5**: Semantic markup
- **CSS3**: Modern features (Grid, Flexbox, Variables)
- **JavaScript (ES6+)**: Fetch API, async/await
- **Font**: Inter (Google Fonts)

## 📝 License

Part of the AI Engineering Certification Challenge project.

---

**Built with ❤️ for the NYC Event Recommender Project**

