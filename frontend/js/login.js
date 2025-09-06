// JavaScript for login.html

async function handleLogin(event) {
    event.preventDefault(); 

    const form = event.target;
    const email = form.email.value;
    const password = form.password.value;
    const messageDiv = document.getElementById('message');
    const loginButton = document.getElementById('loginButton');

    // Disable button to prevent multiple submissions
    loginButton.disabled = true;
    loginButton.textContent = 'Iniciando sesión...';
    messageDiv.textContent = '';
    messageDiv.className = 'text-center text-sm';

    try {
        // Wake up the server first (important for free plans)
        await fetch(API_BASE_URL);

        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Ocurrió un error.');
        }

        // SUCCESS
        messageDiv.textContent = `¡Bienvenido, ${data.user.nombre_completo}! Redirigiendo...`;
        messageDiv.className = 'text-center text-sm text-green-600';

        // Save token and user data in browser memory
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('userData', JSON.stringify(data.user));

        // Redirect to dashboard after 1.5 seconds
        setTimeout(() => {
            // Use parent.postMessage to handle navigation in Canvas environment
            parent.postMessage({ type: 'navigate', url: 'dashboard.html' }, '*');
        }, 1500);

    } catch (error) {
        console.error('Error in login:', error);
        messageDiv.textContent = `Error: ${error.message}`;
        messageDiv.className = 'text-center text-sm text-red-600';
        // Re-enable button in case of error
        loginButton.disabled = false;
        loginButton.textContent = 'Iniciar Sesión';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
});
