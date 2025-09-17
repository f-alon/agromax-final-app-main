// Common JavaScript functionality for all pages

// API Configuration
// Prefer same-origin API; fallback to configured URL if needed.
const API_BASE_URL = window.API_BASE_URL || '';

// Common utility functions
function getAuthToken() {
    return localStorage.getItem('authToken');
}

function getUserData() {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
}

function checkAuth() {
    const token = getAuthToken();
    if (!token) {
        // Navigate using parent.postMessage if embedded, otherwise use location
        try {
            if (window.parent && window.parent !== window && typeof window.parent.postMessage === 'function') {
                window.parent.postMessage({ type: 'navigate', url: 'login.html' }, '*');
            } else {
                window.location.assign('login.html');
            }
        } catch (_) {
            window.location.assign('login.html');
        }
        return false;
    }
    return true;
}

function logout() {
    localStorage.clear();
    try {
        if (window.parent && window.parent !== window && typeof window.parent.postMessage === 'function') {
            window.parent.postMessage({ type: 'navigate', url: 'login.html' }, '*');
        } else {
            window.location.assign('login.html');
        }
    } catch (_) {
        window.location.assign('login.html');
    }
}

async function fetchData(endpoint, options = {}) {
    try {
        // Wake up remote server if a full base URL is defined
        if (API_BASE_URL && /^https?:\/\//i.test(API_BASE_URL)) {
            try { await fetch(API_BASE_URL, { method: 'GET' }); } catch (_) {}
        }
        
        const token = getAuthToken();
        const base = API_BASE_URL || '';
        const response = await fetch(`${base}${endpoint}`, {
            ...options,
            headers: { 
                'Authorization': `Bearer ${token}`, 
                'Content-Type': 'application/json', 
                ...options.headers 
            }
        });
        
        if (!response.ok) {
            let errorData = null;
            try { errorData = await response.json(); } catch (_) {}
            const err = new Error((errorData && (errorData.error || errorData.message)) || `Error: ${response.statusText}`);
            err.status = response.status;
            throw err;
        }
        
        return await response.json();
    } catch (error) {
        console.error(`Error loading data from ${endpoint}:`, error);
        throw error;
    }
}

// Navigation helper function
function navigateTo(url) {
    try {
        if (window.parent && window.parent !== window && typeof window.parent.postMessage === 'function') {
            window.parent.postMessage({ type: 'navigate', url: url }, '*');
        } else {
            window.location.assign(url);
        }
    } catch (_) {
        window.location.assign(url);
    }
}

// Add event listeners for navigation links
document.addEventListener('DOMContentLoaded', function() {
    // Add click handlers for navigation links
    const navLinks = document.querySelectorAll('a[data-navigate]');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const url = this.getAttribute('data-navigate');
            navigateTo(url);
        });
    });
    
    // Add click handlers for buttons with data-navigate attribute
    const navButtons = document.querySelectorAll('button[data-navigate]');
    navButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const url = this.getAttribute('data-navigate');
            navigateTo(url);
        });
    });
});
