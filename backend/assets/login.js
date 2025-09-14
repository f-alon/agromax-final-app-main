// Login logic for login.html
// Works with backend route: POST /api/auth/login
// Expects a JSON response: { token, user: { id, email, firstName, lastName, role } }

(function () {
  function qs(selector) {
    return document.querySelector(selector);
  }

  async function login(event) {
    event.preventDefault();

    const form = event.target;
    const email = (form.email || qs('#email-address'))?.value?.trim() || '';
    const password = (form.password || qs('#password'))?.value || '';

    const messageEl = qs('#message');
    const buttonEl = qs('#loginButton');

    if (!email || !password) {
      if (messageEl) {
        messageEl.textContent = 'Por favor, completa email y contraseña.';
        messageEl.className = 'text-center text-sm text-red-600';
      }
      return;
    }

    if (buttonEl) {
      buttonEl.disabled = true;
      buttonEl.textContent = 'Iniciando sesión...';
    }
    if (messageEl) {
      messageEl.textContent = '';
      messageEl.className = 'text-center text-sm';
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = data?.error || data?.message || 'Credenciales inválidas.';
        throw new Error(msg);
      }

      // Persist auth in localStorage
      if (data?.token) localStorage.setItem('authToken', data.token);
      if (data?.user) localStorage.setItem('userData', JSON.stringify(data.user));

      if (messageEl) {
        const nombre = data?.user?.firstName || data?.user?.first_name || data?.user?.email || '';
        messageEl.textContent = `Bienvenido${nombre ? ', ' + nombre : ''}. Redirigiendo...`;
        messageEl.className = 'text-center text-sm text-green-600';
      }

      // Small delay for UX, then navigate
      setTimeout(() => {
        try {
          // If embedded (e.g., Canvas), notify parent; otherwise, change location
          if (window.parent && window.parent !== window && typeof window.parent.postMessage === 'function') {
            window.parent.postMessage({ type: 'navigate', url: 'dashboard.html' }, '*');
          } else {
            window.location.assign('/dashboard.html');
          }
        } catch (_) {
          window.location.assign('/dashboard.html');
        }
      }, 800);
    } catch (err) {
      console.error('Login error:', err);
      if (messageEl) {
        messageEl.textContent = `Error: ${err.message || 'No se pudo iniciar sesión.'}`;
        messageEl.className = 'text-center text-sm text-red-600';
      }
      if (buttonEl) {
        buttonEl.disabled = false;
        buttonEl.textContent = 'Iniciar Sesión';
      }
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const form = qs('#loginForm');
    if (form) form.addEventListener('submit', login);
  });
})();
