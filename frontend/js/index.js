// JavaScript for index.html (loading page)

// Redirect after a brief delay, with fallback if not embedded
setTimeout(() => {
    try {
        if (window.parent && window.parent !== window && typeof window.parent.postMessage === 'function') {
            window.parent.postMessage({ type: 'navigate', url: 'login.html' }, '*');
        } else {
            window.location.assign('login.html');
        }
    } catch (_) {
        window.location.assign('login.html');
    }
}, 800);
