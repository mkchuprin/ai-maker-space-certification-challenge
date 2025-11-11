// Configuration
const API_BASE_URL = 'http://localhost:8000';

// DOM Elements
const searchForm = document.getElementById('searchForm');
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const loadingIndicator = document.getElementById('loadingIndicator');
const resultsSection = document.getElementById('resultsSection');
const eventCount = document.getElementById('eventCount');
const eventsGrid = document.getElementById('eventsGrid');
const noResults = document.getElementById('noResults');
const aboutModal = document.getElementById('aboutModal');
const aboutLink = document.getElementById('aboutLink');
const closeModal = document.getElementById('closeModal');
const eventModal = document.getElementById('eventModal');
const eventModalContent = document.getElementById('eventModalContent');
const closeEventModal = document.getElementById('closeEventModal');
const question1 = document.getElementById('question1');
const question4 = document.getElementById('question4');
const question5 = document.getElementById('question5');

// Query builder elements
const babyFriendlyRadios = document.querySelectorAll('input[name="baby_friendly"]');
const priceRadios = document.querySelectorAll('input[name="price"]');
const settingRadios = document.querySelectorAll('input[name="setting"]');

// State
let currentQuery = '';
let currentResults = null;

// Cache configuration
const CACHE_PREFIX = 'nyc_events_cache_';
const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

// Cache utilities
function getCacheKey(query) {
    return CACHE_PREFIX + btoa(query).replace(/[/+=]/g, '_');
}

function getCachedResult(query) {
    try {
        const cacheKey = getCacheKey(query);
        const cached = localStorage.getItem(cacheKey);
        if (!cached) return null;
        
        const { data, timestamp } = JSON.parse(cached);
        const age = Date.now() - timestamp;
        
        if (age > CACHE_TTL) {
            localStorage.removeItem(cacheKey);
            return null;
        }
        
        return data;
    } catch (e) {
        console.warn('Cache read error:', e);
        return null;
    }
}

function setCachedResult(query, data) {
    try {
        const cacheKey = getCacheKey(query);
        const cacheEntry = {
            data: data,
            timestamp: Date.now()
        };
        localStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
    } catch (e) {
        console.warn('Cache write error:', e);
        // If storage is full, clear old entries
        if (e.name === 'QuotaExceededError') {
            clearOldCacheEntries();
        }
    }
}

function clearOldCacheEntries() {
    try {
        const keys = Object.keys(localStorage);
        const now = Date.now();
        let cleared = 0;
        
        for (const key of keys) {
            if (key.startsWith(CACHE_PREFIX)) {
                try {
                    const cached = JSON.parse(localStorage.getItem(key));
                    if (now - cached.timestamp > CACHE_TTL) {
                        localStorage.removeItem(key);
                        cleared++;
                    }
                } catch (e) {
                    localStorage.removeItem(key);
                    cleared++;
                }
            }
        }
        
        if (cleared > 0) {
            console.log(`Cleared ${cleared} expired cache entries`);
        }
    } catch (e) {
        console.warn('Cache cleanup error:', e);
    }
}

// Clear old cache entries on page load
clearOldCacheEntries();

// Event Listeners
searchForm.addEventListener('submit', handleSearch);

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

closeEventModal.addEventListener('click', () => {
    eventModal.classList.add('hidden');
});

eventModal.addEventListener('click', (e) => {
    if (e.target === eventModal) {
        eventModal.classList.add('hidden');
    }
});

// Update search input with formatted query from checkboxes
function updateSearchInputFromCheckboxes() {
    const selectedBabyFriendly = Array.from(babyFriendlyRadios)
        .find(radio => radio.checked)?.value;
    
    const selectedPrice = Array.from(priceRadios)
        .find(radio => radio.checked)?.value;
    
    const selectedSetting = Array.from(settingRadios)
        .find(radio => radio.checked)?.value;
    
    // Build the formatted query with natural language
    const positiveParts = [];
    const negativeParts = [];
    let isForAdults = false;
    
    // Add baby friendly part
    if (selectedBabyFriendly === 'yes') {
        positiveParts.push('baby-friendly');
    } else if (selectedBabyFriendly === 'no') {
        isForAdults = true;
    }
    
    // Add price part
    if (selectedPrice === 'free') {
        positiveParts.push('free');
    } else if (selectedPrice === 'not_free') {
        negativeParts.push('free');
    }
    
    // Add setting part
    if (selectedSetting === 'indoor') {
        positiveParts.push('indoor');
    } else if (selectedSetting === 'outdoor') {
        positiveParts.push('outdoor');
    }
    
    // Always start with base prompt
    let queryText = 'Find some events';
    
    // Build attributes text
    const allParts = [];
    
    // Add positive attributes
    if (positiveParts.length > 0) {
        let positiveText;
        if (positiveParts.length === 1) {
            positiveText = positiveParts[0];
        } else if (positiveParts.length === 2) {
            positiveText = `${positiveParts[0]} and ${positiveParts[1]}`;
        } else {
            positiveText = `${positiveParts.slice(0, -1).join(', ')}, and ${positiveParts[positiveParts.length - 1]}`;
        }
        allParts.push(positiveText);
    }
    
    // Add negative attributes
    if (negativeParts.length > 0) {
        let negativeText;
        if (negativeParts.length === 1) {
            negativeText = `not ${negativeParts[0]}`;
        } else if (negativeParts.length === 2) {
            negativeText = `not ${negativeParts[0]} and not ${negativeParts[1]}`;
        } else {
            const notParts = negativeParts.map(p => `not ${p}`);
            negativeText = `${notParts.slice(0, -1).join(', ')}, and ${notParts[notParts.length - 1]}`;
        }
        allParts.push(negativeText);
    }
    
    // Append selected attributes if any
    if (allParts.length > 0 || isForAdults) {
        // Handle "for adults" case
        if (isForAdults && allParts.length === 0) {
            queryText = `${queryText} for adults`;
        } else if (isForAdults && allParts.length > 0) {
            // Combine "for adults" with other attributes
            let attributesText;
            if (allParts.length === 1) {
                attributesText = allParts[0];
            } else {
                attributesText = `${allParts[0]} and ${allParts[1]}`;
            }
            
            if (positiveParts.length > 0 && negativeParts.length === 0) {
                queryText = `${queryText} for adults, they should be ${attributesText}`;
            } else if (positiveParts.length === 0 && negativeParts.length > 0) {
                queryText = `${queryText} for adults, they should not be ${attributesText}`;
            } else {
                queryText = `${queryText} for adults, they should be ${attributesText}`;
            }
        } else {
            // No "for adults", just regular attributes
            let attributesText;
            if (allParts.length === 1) {
                attributesText = allParts[0];
            } else {
                attributesText = `${allParts[0]} and ${allParts[1]}`;
            }
            
            // Use "should be" for positive attributes, "should not be" for negative
            if (positiveParts.length > 0 && negativeParts.length === 0) {
                queryText = `${queryText}, they should be ${attributesText}`;
            } else if (positiveParts.length === 0 && negativeParts.length > 0) {
                queryText = `${queryText}, they should not be ${attributesText}`;
            } else {
                queryText = `${queryText}, they should be ${attributesText}`;
            }
        }
    }
    
    searchInput.value = queryText;
    
    // Show/hide Step 2 based on textarea content
    toggleStep2Visibility();
}

// Toggle search button visibility based on all questions being answered
function toggleStep2Visibility() {
    const step2Heading = document.getElementById('step2Heading');
    // Check if all three questions have at least one selection
    const hasQuestion1Selection = Array.from(babyFriendlyRadios).some(radio => radio.checked);
    const hasQuestion4Selection = Array.from(priceRadios).some(radio => radio.checked);
    const hasQuestion5Selection = Array.from(settingRadios).some(radio => radio.checked);
    
    if (hasQuestion1Selection && hasQuestion4Selection && hasQuestion5Selection && searchInput.value.trim().length > 0) {
        step2Heading.classList.remove('hidden');
        searchButton.classList.remove('hidden');
    } else {
        step2Heading.classList.add('hidden');
        searchButton.classList.add('hidden');
    }
}

// Enable/disable questions based on previous answers
function updateQuestionStates() {
    // Check if question 1 has any selections
    const hasQuestion1Selection = Array.from(babyFriendlyRadios).some(radio => radio.checked);
    
    if (hasQuestion1Selection) {
        // Remove heartbeat if question 1 has selections
        question1.classList.remove('heartbeat');
        
        // Check if question 4 was previously disabled (to trigger animation)
        const wasQuestion4Disabled = question4.classList.contains('disabled');
        question4.classList.remove('disabled');
        priceRadios.forEach(radio => radio.disabled = false);
        
        // Remove heartbeat from question 4 when enabled
        question4.classList.remove('heartbeat');
        
        // Highlight question 4 if it was just enabled
        if (wasQuestion4Disabled) {
            highlightQuestion(question4);
        }
    } else {
        // Add heartbeat to question 1 if nothing is selected
        question1.classList.add('heartbeat');
        
        // Also disable question 4 if question 1 is unchecked
        question4.classList.add('disabled');
        priceRadios.forEach(radio => radio.disabled = true);
        // Add heartbeat to question 4 when disabled
        question4.classList.add('heartbeat');
        
        // Also disable question 5 if question 1 is unchecked
        question5.classList.add('disabled');
        settingRadios.forEach(radio => radio.disabled = true);
        // Add heartbeat to question 5 when disabled
        question5.classList.add('heartbeat');
        
        // Uncheck all question 4 and 5 radios
        priceRadios.forEach(radio => radio.checked = false);
        settingRadios.forEach(radio => radio.checked = false);
        updateSearchInputFromCheckboxes();
        return; // Exit early if question 1 has no selections
    }
    
    // Check if question 4 has any selections (for enabling question 5)
    const hasQuestion4Selection = Array.from(priceRadios).some(radio => radio.checked);
    
    if (hasQuestion4Selection) {
        // Check if question 5 was previously disabled (to trigger animation)
        const wasQuestion5Disabled = question5.classList.contains('disabled');
        question5.classList.remove('disabled');
        settingRadios.forEach(radio => radio.disabled = false);
        
        // Remove heartbeat from question 5 when enabled
        question5.classList.remove('heartbeat');
        
        // Highlight question 5 if it was just enabled
        if (wasQuestion5Disabled) {
            highlightQuestion(question5);
        }
    } else {
        question5.classList.add('disabled');
        settingRadios.forEach(radio => radio.disabled = true);
        // Add heartbeat to question 5 when disabled
        question5.classList.add('heartbeat');
        
        // Uncheck all question 5 radios
        settingRadios.forEach(radio => radio.checked = false);
        updateSearchInputFromCheckboxes();
    }
    
    // Update Step 2 visibility after question states change
    toggleStep2Visibility();
}

// Highlight a question with animation
function highlightQuestion(questionElement) {
    // Remove any existing highlight
    questionElement.classList.remove('highlight');
    
    // Trigger reflow to ensure animation restarts
    void questionElement.offsetWidth;
    
    // Add highlight class to trigger animation
    questionElement.classList.add('highlight');
    
    // Remove highlight class after animation completes
    setTimeout(() => {
        questionElement.classList.remove('highlight');
    }, 1500);
}

// Initialize question states on page load
updateQuestionStates();

// Initialize textarea with base prompt
searchInput.value = 'Find some events';

// Add event listeners to all checkboxes/radios to update search input
[...babyFriendlyRadios, ...priceRadios, ...settingRadios].forEach(input => {
    input.addEventListener('change', () => {
        updateQuestionStates();
        updateSearchInputFromCheckboxes();
    });
});

// Add event listener to textarea for manual typing
searchInput.addEventListener('input', toggleStep2Visibility);

// Build query from form inputs
function buildQuery() {
    const textQuery = searchInput.value.trim();
    const queryParts = [];
    
    // Add text input if provided
    if (textQuery) {
        queryParts.push(textQuery);
    }
    
    // Add selected baby friendly preference
    const selectedBabyFriendly = Array.from(babyFriendlyRadios)
        .find(radio => radio.checked)?.value;
    
    if (selectedBabyFriendly === 'yes') {
        queryParts.push('baby-friendly events');
    }
    
    // Add selected price preference
    const selectedPrice = Array.from(priceRadios)
        .find(radio => radio.checked)?.value;
    
    if (selectedPrice === 'free') {
        queryParts.push('free events');
    } else if (selectedPrice === 'not_free') {
        queryParts.push('not free events');
    }
    
    // Add selected setting preference
    const selectedSetting = Array.from(settingRadios)
        .find(radio => radio.checked)?.value;
    
    if (selectedSetting === 'indoor') {
        queryParts.push('indoor events');
    } else if (selectedSetting === 'outdoor') {
        queryParts.push('outdoor events');
    }
    
    // Combine all parts
    return queryParts.join(' ').trim();
}

// Main search handler
async function handleSearch(e) {
    e.preventDefault();
    
    const query = buildQuery();
    
    if (!query) {
        alert('Please enter a search query or select options');
        return;
    }
    
    currentQuery = query;
    
    // Check cache first
    const cachedResult = getCachedResult(query);
    if (cachedResult) {
        console.log('✅ Using cached result');
        currentResults = cachedResult;
        displayResults(cachedResult);
        return;
    }
    
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
        
        // Cache the result
        setCachedResult(query, data);
        
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

// Display filters (removed - filters no longer shown in UI)
function displayFilters(filters) {
    // No-op: filters section has been removed from UI
    return;
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
    // Prefer clean_summary if available, fallback to description
    const description = event.clean_summary || event.description || 'No description available';
    const babyFriendly = event.baby_friendly;
    const url = event.url || '#';
    
    // Truncate description (show ~3x more text)
    const truncatedDescription = description.length > 450 
        ? description.substring(0, 450) + '...' 
        : description;
    
    card.innerHTML = `
        <div class="event-header">
            <div>
                <h3 class="event-title">${escapeHtml(title)}</h3>
            </div>
        </div>
        
        <p class="event-description">${escapeHtml(truncatedDescription)}</p>
        
        <div class="event-link">
            View Details →
        </div>
    `;
    
    // Add click handler to open modal
    card.addEventListener('click', (e) => {
        e.preventDefault();
        showEventModal(event, score, url);
    });
    
    return card;
}

// Show event details in modal
function showEventModal(event, score, url) {
    const title = event.title || 'Untitled Event';
    // Prefer clean_summary if available, fallback to description
    const description = event.clean_summary || event.description || 'No description available';
    const babyFriendly = event.baby_friendly;
    const price = event.price || 'N/A';
    const category = event.category || 'N/A';
    const indoorOrOutdoor = event.indoor_or_outdoor || 'N/A';
    
    eventModalContent.innerHTML = `
        <h2>${escapeHtml(title)}</h2>
        
        <div style="margin-bottom: 1.5rem;">
            <p style="color: var(--text-secondary); line-height: 1.8;">${escapeHtml(description)}</p>
        </div>
        
        <div style="display: flex; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 1.5rem;">
            ${babyFriendly !== undefined ? `<span style="background: #ECFDF5; color: #065F46; padding: 0.5rem 1rem; border-radius: 0.5rem; font-size: 0.875rem;">${babyFriendly ? '👶 Baby-Friendly' : '❌ Not Baby-Friendly'}</span>` : ''}
            ${price !== 'N/A' ? `<span style="background: #EFF6FF; color: #1E40AF; padding: 0.5rem 1rem; border-radius: 0.5rem; font-size: 0.875rem;">💰 ${escapeHtml(price)}</span>` : ''}
            ${category !== 'N/A' ? `<span style="background: #FDF4FF; color: #7C2D12; padding: 0.5rem 1rem; border-radius: 0.5rem; font-size: 0.875rem;">🎨 ${escapeHtml(category)}</span>` : ''}
            ${indoorOrOutdoor !== 'N/A' ? `<span style="background: #F0FDF4; color: #166534; padding: 0.5rem 1rem; border-radius: 0.5rem; font-size: 0.875rem;">${indoorOrOutdoor === 'indoor' ? '🏠 Indoor' : indoorOrOutdoor === 'outdoor' ? '🌳 Outdoor' : '🏠🌳 Indoor/Outdoor'}</span>` : ''}
        </div>
        
        <div style="display: flex; gap: 1rem; margin-top: 2rem;">
            <a href="${escapeHtml(url)}" target="_blank" style="background: var(--primary-color); color: white; padding: 0.75rem 1.5rem; border-radius: 0.5rem; text-decoration: none; font-weight: 500; display: inline-block; transition: background 0.2s;" onmouseover="this.style.background='var(--primary-hover)'" onmouseout="this.style.background='var(--primary-color)'">
                Open on TimeOut NYC →
            </a>
            <button onclick="eventModal.classList.add('hidden')" style="background: var(--border); color: var(--text-primary); padding: 0.75rem 1.5rem; border-radius: 0.5rem; border: none; font-weight: 500; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='#D1D5DB'" onmouseout="this.style.background='var(--border)'">
                Close
            </button>
        </div>
    `;
    
    eventModal.classList.remove('hidden');
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

