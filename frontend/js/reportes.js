// JavaScript for reportes.html

document.addEventListener('DOMContentLoaded', function() {
    if (checkAuth()) {
        // Add logout button event listener
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', logout);
        }
    }
});
