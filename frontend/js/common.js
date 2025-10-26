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

async function fetchJSON(url, options = {}) {
    const base = API_BASE_URL || '';
    const isAbsolute = /^https?:\/\//i.test(url);
    const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base;
    const normalizedPath = url.startsWith('/') ? url : '/' + url;
    const requestUrl = isAbsolute ? url : normalizedBase + normalizedPath;

    const headers = {
        Accept: 'application/json',
        ...(options.headers || {})
    };

    const token = getAuthToken();
    if (token && !headers.Authorization) {
        headers.Authorization = 'Bearer ' + token;
    }

    const response = await fetch(requestUrl, {
        credentials: 'include',
        ...options,
        headers
    });

    const contentType = response.headers.get('content-type') || '';
    const bodyText = await response.text();

    if (!response.ok) {
        throw new Error('HTTP ' + response.status + ' ' + response.statusText + ' -- ' + bodyText.slice(0, 300));
    }

    if (!contentType.includes('application/json')) {
        throw new Error('Expected JSON, got ' + contentType + ' -- ' + bodyText.slice(0, 300));
    }

    try {
        return JSON.parse(bodyText);
    } catch (error) {
        throw new Error('Invalid JSON: ' + error.message + ' -- ' + bodyText.slice(0, 300));
    }
}

async function fetchData(endpoint, options = {}) {
    try {
        const headers = {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        };
        return await fetchJSON(endpoint, { ...options, headers });
    } catch (error) {
        console.error('Error loading data from ' + endpoint + ':', error);
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

