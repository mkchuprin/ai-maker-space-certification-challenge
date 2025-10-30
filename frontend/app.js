// Configuration
const API_BASE_URL = 'http://localhost:8000';

// DOM Elements
const searchForm = document.getElementById('searchForm');
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const loadingIndicator = document.getElementById('loadingIndicator');
const resultsSection = document.getElementById('resultsSection');
const filtersApplied = document.getElementById('filtersApplied');
const filtersList = document.getElementById('filtersList');
const eventCount = document.getElementById('eventCount');
const eventsGrid = document.getElementById('eventsGrid');
const noResults = document.getElementById('noResults');
const aboutModal = document.getElementById('aboutModal');
const aboutLink = document.getElementById('aboutLink');
const closeModal = document.getElementById('closeModal');
const question1 = document.getElementById('question1');
const question2 = document.getElementById('question2');
const question3 = document.getElementById('question3');
const question4 = document.getElementById('question4');

// Query builder elements
const attendeeCheckboxes = document.querySelectorAll('input[name="attendees"]');
const vibeCheckboxes = document.querySelectorAll('input[name="vibe"]');
const timeCheckboxes = document.querySelectorAll('input[name="time"]');
const budgetCheckboxes = document.querySelectorAll('input[name="budget"]');

// State
let currentQuery = '';
let currentResults = null;

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

// Update search input with formatted query from checkboxes
function updateSearchInputFromCheckboxes() {
    const selectedAttendees = Array.from(attendeeCheckboxes)
        .filter(checkbox => checkbox.checked)
        .map(checkbox => checkbox.value);
    
    const selectedVibes = Array.from(vibeCheckboxes)
        .filter(checkbox => checkbox.checked)
        .map(checkbox => checkbox.value);
    
    const selectedTimes = Array.from(timeCheckboxes)
        .filter(checkbox => checkbox.checked)
        .map(checkbox => checkbox.value);
    
    const selectedBudgets = Array.from(budgetCheckboxes)
        .filter(checkbox => checkbox.checked)
        .map(checkbox => checkbox.value);
    
    // Build the formatted query
    const queryParts = [];
    
    // Add attendees part
    if (selectedAttendees.length > 0) {
        queryParts.push(`I'll be with ${selectedAttendees.join(', ')}`);
    }
    
    // Add vibes part
    if (selectedVibes.length > 0) {
        queryParts.push(`we are looking for vibes ${selectedVibes.join(', ')}`);
    }
    
    // Add time part
    if (selectedTimes.length > 0) {
        queryParts.push(`in the ${selectedTimes.join(', ')}`);
    }
    
    // Add budget part
    if (selectedBudgets.length > 0) {
        queryParts.push(`with budget ${selectedBudgets.join(', ')}`);
    }
    
    // Only update if there are selections
    if (queryParts.length > 0) {
        searchInput.value = `${queryParts.join(', ')}. find nyc event for me`;
    } else {
        searchInput.value = '';
    }
    
    // Show/hide Step 2 based on textarea content
    toggleStep2Visibility();
}

// Toggle search button visibility based on all questions being answered
function toggleStep2Visibility() {
    // Check if all four questions have at least one selection
    const hasQuestion1Selection = Array.from(attendeeCheckboxes).some(cb => cb.checked);
    const hasQuestion2Selection = Array.from(vibeCheckboxes).some(cb => cb.checked);
    const hasQuestion3Selection = Array.from(timeCheckboxes).some(cb => cb.checked);
    const hasQuestion4Selection = Array.from(budgetCheckboxes).some(cb => cb.checked);
    
    if (hasQuestion1Selection && hasQuestion2Selection && hasQuestion3Selection && hasQuestion4Selection && searchInput.value.trim().length > 0) {
        searchButton.classList.remove('hidden');
    } else {
        searchButton.classList.add('hidden');
    }
}

// Enable/disable questions based on previous answers
function updateQuestionStates() {
    // Check if question 1 has any selections
    const hasQuestion1Selection = Array.from(attendeeCheckboxes).some(cb => cb.checked);
    
    if (hasQuestion1Selection) {
        // Remove heartbeat if question 1 has selections
        question1.classList.remove('heartbeat');
        
        // Check if question 2 was previously disabled (to trigger animation)
        const wasQuestion2Disabled = question2.classList.contains('disabled');
        question2.classList.remove('disabled');
        vibeCheckboxes.forEach(cb => cb.disabled = false);
        
        // Remove heartbeat from question 2 when enabled
        question2.classList.remove('heartbeat');
        
        // Highlight question 2 if it was just enabled
        if (wasQuestion2Disabled) {
            highlightQuestion(question2);
        }
    } else {
        // Add heartbeat to question 1 if nothing is selected
        question1.classList.add('heartbeat');
        
        question2.classList.add('disabled');
        vibeCheckboxes.forEach(cb => cb.disabled = true);
        // Add heartbeat to question 2 when disabled
        question2.classList.add('heartbeat');
        
        // Also disable question 3 if question 1 is unchecked
        question3.classList.add('disabled');
        timeCheckboxes.forEach(cb => cb.disabled = true);
        // Add heartbeat to question 3 when disabled
        question3.classList.add('heartbeat');
        
        // Also disable question 4 if question 1 is unchecked
        question4.classList.add('disabled');
        budgetCheckboxes.forEach(cb => cb.disabled = true);
        // Add heartbeat to question 4 when disabled
        question4.classList.add('heartbeat');
        
        // Uncheck all question 2, 3, and 4 checkboxes
        vibeCheckboxes.forEach(cb => cb.checked = false);
        timeCheckboxes.forEach(cb => cb.checked = false);
        budgetCheckboxes.forEach(cb => cb.checked = false);
        updateSearchInputFromCheckboxes();
        return; // Exit early if question 1 has no selections
    }
    
    // Check if question 2 has any selections
    const hasQuestion2Selection = Array.from(vibeCheckboxes).some(cb => cb.checked);
    
    if (hasQuestion2Selection) {
        // Check if question 3 was previously disabled (to trigger animation)
        const wasQuestion3Disabled = question3.classList.contains('disabled');
        question3.classList.remove('disabled');
        timeCheckboxes.forEach(cb => cb.disabled = false);
        
        // Remove heartbeat from question 3 when enabled
        question3.classList.remove('heartbeat');
        
        // Highlight question 3 if it was just enabled
        if (wasQuestion3Disabled) {
            highlightQuestion(question3);
        }
    } else {
        question3.classList.add('disabled');
        timeCheckboxes.forEach(cb => cb.disabled = true);
        // Add heartbeat to question 3 when disabled
        question3.classList.add('heartbeat');
        
        // Also disable question 4 if question 2 is unchecked
        question4.classList.add('disabled');
        budgetCheckboxes.forEach(cb => cb.disabled = true);
        // Add heartbeat to question 4 when disabled
        question4.classList.add('heartbeat');
        
        // Uncheck all question 3 and 4 checkboxes
        timeCheckboxes.forEach(cb => cb.checked = false);
        budgetCheckboxes.forEach(cb => cb.checked = false);
        updateSearchInputFromCheckboxes();
        // Continue to check question 3 for enabling question 4
    }
    
    // Check if question 3 has any selections (for enabling question 4)
    const hasQuestion3Selection = Array.from(timeCheckboxes).some(cb => cb.checked);
    
    if (hasQuestion3Selection) {
        // Check if question 4 was previously disabled (to trigger animation)
        const wasQuestion4Disabled = question4.classList.contains('disabled');
        question4.classList.remove('disabled');
        budgetCheckboxes.forEach(cb => cb.disabled = false);
        
        // Remove heartbeat from question 4 when enabled
        question4.classList.remove('heartbeat');
        
        // Highlight question 4 if it was just enabled
        if (wasQuestion4Disabled) {
            highlightQuestion(question4);
        }
    } else {
        question4.classList.add('disabled');
        budgetCheckboxes.forEach(cb => cb.disabled = true);
        // Add heartbeat to question 4 when disabled
        question4.classList.add('heartbeat');
        
        // Uncheck all question 4 checkboxes
        budgetCheckboxes.forEach(cb => cb.checked = false);
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

// Add event listeners to all checkboxes to update search input
[...attendeeCheckboxes, ...vibeCheckboxes, ...timeCheckboxes, ...budgetCheckboxes].forEach(checkbox => {
    checkbox.addEventListener('change', () => {
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
    
    // Add selected attendees
    const selectedAttendees = Array.from(attendeeCheckboxes)
        .filter(checkbox => checkbox.checked)
        .map(checkbox => checkbox.value);
    
    if (selectedAttendees.length > 0) {
        queryParts.push(`events for ${selectedAttendees.join(', ')}`);
    }
    
    // Add selected vibes
    const selectedVibes = Array.from(vibeCheckboxes)
        .filter(checkbox => checkbox.checked)
        .map(checkbox => checkbox.value);
    
    if (selectedVibes.length > 0) {
        queryParts.push(`with ${selectedVibes.join(', ')}`);
    }
    
    // Add selected time of day
    const selectedTimes = Array.from(timeCheckboxes)
        .filter(checkbox => checkbox.checked)
        .map(checkbox => checkbox.value);
    
    if (selectedTimes.length > 0) {
        queryParts.push(`during ${selectedTimes.join(', ')}`);
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

