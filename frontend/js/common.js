// Common JavaScript functionality for all pages

// API Configuration
const API_BASE_URL = 'https://agromax-00pa.onrender.com/';

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
        // Use parent.postMessage for navigation in Canvas environment
        parent.postMessage({ type: 'navigate', url: 'login.html' }, '*');
        return false;
    }
    return true;
}

function logout() {
    localStorage.clear();
    parent.postMessage({ type: 'navigate', url: 'login.html' }, '*');
}

async function fetchData(endpoint, options = {}) {
    try {
        // Wake up the server first (important for free plans)
        await fetch(API_BASE_URL);
        
        const token = getAuthToken();
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers: { 
                'Authorization': `Bearer ${token}`, 
                'Content-Type': 'application/json', 
                ...options.headers 
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Error: ${response.statusText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error(`Error loading data from ${endpoint}:`, error);
        throw error;
    }
}

// Navigation helper function
function navigateTo(url) {
    parent.postMessage({ type: 'navigate', url: url }, '*');
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
