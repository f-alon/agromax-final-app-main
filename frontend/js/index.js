// JavaScript for index.html (loading page)

// Redirect to login.html after a brief delay
setTimeout(() => {
    // Use parent.postMessage to ensure navigation in Canvas environment
    parent.postMessage({ type: 'navigate', url: 'login.html' }, '*');
}, 1000); // Redirect after 1 second
