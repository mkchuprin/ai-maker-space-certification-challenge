// Configuration
const API_BASE_URL = 'http://localhost:8000';

// DOM Elements
const searchForm = document.getElementById('searchForm');
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const loadingIndicator = document.getElementById('loadingIndicator');
const resultsSection = document.getElementById('resultsSection');
const responseSummary = document.getElementById('responseSummary');
const filtersApplied = document.getElementById('filtersApplied');
const filtersList = document.getElementById('filtersList');
const eventCount = document.getElementById('eventCount');
const eventsGrid = document.getElementById('eventsGrid');
const noResults = document.getElementById('noResults');
const aboutModal = document.getElementById('aboutModal');
const aboutLink = document.getElementById('aboutLink');
const closeModal = document.getElementById('closeModal');

// Quick filter chips
const filterChips = document.querySelectorAll('.filter-chip');

// State
let currentQuery = '';
let currentResults = null;

// Event Listeners
searchForm.addEventListener('submit', handleSearch);

filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
        const query = chip.getAttribute('data-query');
        searchInput.value = query;
        handleSearch(new Event('submit'));
    });
});

aboutLink.addEventListener('click', (e) => {
    e.preventDefault();
    aboutModal.classList.remove('hidden');
});

closeModal.addEventListener('click', () => {
    aboutModal.classList.add('hidden');
});

aboutModal.addEventListener('click', (e) => {
    if (e.target === aboutModal) {
        aboutModal.classList.add('hidden');
    }
});

// Main search handler
async function handleSearch(e) {
    e.preventDefault();
    
    const query = searchInput.value.trim();
    
    if (!query) {
        alert('Please enter a search query');
        return;
    }
    
    currentQuery = query;
    
    // Show loading state
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE_URL}/recommend`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query }),
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        currentResults = data;
        
        // Display results
        displayResults(data);
        
    } catch (error) {
        console.error('Error fetching recommendations:', error);
        showError(error.message);
    } finally {
        hideLoading();
    }
}

// Show loading state
function showLoading() {
    loadingIndicator.classList.remove('hidden');
    resultsSection.classList.add('hidden');
    searchButton.disabled = true;
    searchButton.querySelector('.button-text').textContent = 'Searching...';
}

// Hide loading state
function hideLoading() {
    loadingIndicator.classList.add('hidden');
    searchButton.disabled = false;
    searchButton.querySelector('.button-text').textContent = 'Search Events';
}

// Display results
function displayResults(data) {
    resultsSection.classList.remove('hidden');
    
    // Display AI response summary
    displayResponseSummary(data.response);
    
    // Display filters applied
    displayFilters(data.filters);
    
    // Display events
    if (data.events && data.events.length > 0) {
        displayEvents(data.events);
        noResults.classList.add('hidden');
    } else {
        eventsGrid.innerHTML = '';
        noResults.classList.remove('hidden');
    }
    
    // Scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Display AI response summary
function displayResponseSummary(response) {
    // Parse markdown-style response
    const formattedResponse = formatMarkdownResponse(response);
    responseSummary.innerHTML = formattedResponse;
}

// Format markdown-style response
function formatMarkdownResponse(text) {
    // Convert markdown to HTML
    let html = text;
    
    // Headers
    html = html.replace(/### (.*?)(\n|$)/g, '<h3>$1</h3>');
    html = html.replace(/## (.*?)(\n|$)/g, '<h3>$1</h3>');
    html = html.replace(/# (.*?)(\n|$)/g, '<h3>$1</h3>');
    
    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Links
    html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>');
    
    // Line breaks
    html = html.replace(/\n\n/g, '</p><p>');
    html = html.replace(/\n/g, '<br>');
    
    // Wrap in paragraphs
    html = '<p>' + html + '</p>';
    
    return html;
}

// Display filters
function displayFilters(filters) {
    if (!filters || Object.keys(filters).length === 0) {
        filtersApplied.classList.add('hidden');
        return;
    }
    
    filtersApplied.classList.remove('hidden');
    filtersList.innerHTML = '';
    
    Object.entries(filters).forEach(([key, value]) => {
        const tag = document.createElement('div');
        tag.className = 'filter-tag';
        
        let icon = '🔍';
        let displayValue = value;
        
        if (key === 'baby_friendly') {
            icon = value ? '👶' : '❌';
            displayValue = value ? 'Baby-Friendly' : 'Not Baby-Friendly';
        } else if (key === 'price') {
            icon = '💰';
            displayValue = `Price: ${value}`;
        } else if (key === 'category') {
            icon = '🎨';
            displayValue = `Category: ${value}`;
        } else if (key === 'location') {
            icon = '📍';
            displayValue = `Location: ${value}`;
        }
        
        tag.innerHTML = `<span>${icon}</span><span>${displayValue}</span>`;
        filtersList.appendChild(tag);
    });
}

// Display events
function displayEvents(events) {
    eventCount.textContent = `${events.length} event${events.length !== 1 ? 's' : ''} found`;
    eventsGrid.innerHTML = '';
    
    events.forEach((item, index) => {
        const event = item.event;
        const score = item.score;
        
        const card = createEventCard(event, score, index);
        eventsGrid.appendChild(card);
    });
}

// Create event card
function createEventCard(event, score, index) {
    const card = document.createElement('div');
    card.className = 'event-card';
    card.style.animationDelay = `${index * 0.1}s`;
    
    const title = event.title || 'Untitled Event';
    const description = event.description || 'No description available';
    const babyFriendly = event.baby_friendly;
    const url = event.url || '#';
    
    // Truncate description
    const truncatedDescription = description.length > 150 
        ? description.substring(0, 150) + '...' 
        : description;
    
    card.innerHTML = `
        <div class="event-header">
            <div>
                <h3 class="event-title">${escapeHtml(title)}</h3>
            </div>
            ${score !== undefined ? `<span class="event-score">Match: ${(score * 100).toFixed(0)}%</span>` : ''}
        </div>
        
        <p class="event-description">${escapeHtml(truncatedDescription)}</p>
        
        <div class="event-meta">
            ${babyFriendly ? '<span class="event-badge baby-friendly">👶 Baby-Friendly</span>' : ''}
            <span class="event-badge">📍 NYC</span>
        </div>
        
        <a href="${escapeHtml(url)}" target="_blank" class="event-link">
            View Details →
        </a>
    `;
    
    // Add click handler to open link
    card.addEventListener('click', (e) => {
        if (!e.target.classList.contains('event-link')) {
            window.open(url, '_blank');
        }
    });
    
    return card;
}

// Show error
function showError(message) {
    resultsSection.classList.remove('hidden');
    eventsGrid.innerHTML = '';
    noResults.classList.remove('hidden');
    
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = 'background: #FEE2E2; color: #991B1B; padding: 1.5rem; border-radius: 0.75rem; margin-bottom: 1.5rem;';
    errorDiv.innerHTML = `
        <strong>⚠️ Error:</strong> ${escapeHtml(message)}
        <br><br>
        Make sure the FastAPI backend is running on <code>http://localhost:8000</code>
        <br>
        Run: <code>cd backend && uvicorn main:app --reload</code>
    `;
    
    resultsSection.insertBefore(errorDiv, resultsSection.firstChild);
}

// Utility: Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Check backend health on page load
async function checkBackendHealth() {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        if (response.ok) {
            console.log('✅ Backend is running');
        }
    } catch (error) {
        console.warn('⚠️ Backend is not running. Start it with: uvicorn main:app --reload');
    }
}

// Initialize
checkBackendHealth();

// Sample queries for demo
const sampleQueries = [
    "baby-friendly outdoor events this weekend",
    "free museum activities for families",
    "romantic date night in Manhattan",
    "stroller-accessible parks and events",
    "kid-friendly art exhibits"
];

// Add hover effect to show sample query
searchInput.addEventListener('focus', () => {
    if (!searchInput.value) {
        const randomQuery = sampleQueries[Math.floor(Math.random() * sampleQueries.length)];
        searchInput.placeholder = `Try: "${randomQuery}"`;
    }
});

searchInput.addEventListener('blur', () => {
    if (!searchInput.value) {
        searchInput.placeholder = "e.g., baby-friendly outdoor events, romantic date night, free museum activities...";
    }
});

