// crear_usuario.js

// Check if user is admin
async function checkAuthAndAdmin() {
    const token = getAuthToken();
    if (!token) {
        parent.postMessage({ type: 'navigate', url: 'login.html' }, '*');
        return false;
    }

    try {
        const response = await fetch(`${API_BASE_URL}api/auth/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            parent.postMessage({ type: 'navigate', url: 'login.html' }, '*');
            return false;
        }

        const data = await response.json();
        if (data.user.role !== 'admin' && data.user.role !== 'super_admin') {
            alert('No tienes permisos para acceder a esta página');
            parent.postMessage({ type: 'navigate', url: 'dashboard.html' }, '*');
            return false;
        }

        return true;
    } catch (error) {
        console.error('Auth check error:', error);
        parent.postMessage({ type: 'navigate', url: 'login.html' }, '*');
        return false;
    }
}

// Show/hide loading overlay
function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    overlay.classList.toggle('hidden', !show);
}

// Show error message
function showError(message) {
    alert('Error: ' + message);
}

// Show success message
function showSuccess(message) {
    alert('Éxito: ' + message);
}

// Validate form
function validateForm(formData) {
    const errors = [];

    // Required fields
    if (!formData.firstName.trim()) {
        errors.push('El nombre es requerido');
    }
    if (!formData.lastName.trim()) {
        errors.push('El apellido es requerido');
    }
    if (!formData.email.trim()) {
        errors.push('El email es requerido');
    }
    if (!formData.password) {
        errors.push('La contraseña es requerida');
    }
    if (!formData.role) {
        errors.push('El rol es requerido');
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
        errors.push('El email no es válido');
    }

    // Password validation
    if (formData.password && formData.password.length < 6) {
        errors.push('La contraseña debe tener al menos 6 caracteres');
    }

    // Password confirmation
    if (formData.password !== formData.confirmPassword) {
        errors.push('Las contraseñas no coinciden');
    }

    // Phone validation (optional)
    if (formData.phone && !/^[\+]?[0-9\s\-\(\)]+$/.test(formData.phone)) {
        errors.push('El teléfono no es válido');
    }

    return errors;
}

// Handle role change
function handleRoleChange() {
    const roleSelect = document.getElementById('role');
    const adminPermissions = document.getElementById('adminPermissions');
    
    if (roleSelect.value === 'admin' || roleSelect.value === 'super_admin') {
        adminPermissions.classList.remove('hidden');
        
        // Set default permissions based on role
        if (roleSelect.value === 'super_admin') {
            document.getElementById('canManageUsers').checked = true;
            document.getElementById('canManageEstablishments').checked = true;
            document.getElementById('canViewReports').checked = true;
        }
    } else {
        adminPermissions.classList.add('hidden');
    }
}

// Create user
async function createUser(formData) {
    try {
        const token = getAuthToken();
        
        const userData = {
            email: formData.email,
            password: formData.password,
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: formData.phone || null,
            role: formData.role
        };

        const response = await fetch(`${API_BASE_URL}api/admin/users`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al crear el usuario');
        }

        const data = await response.json();
        showSuccess('Usuario creado exitosamente');
        
        // Redirect to admin users page
        setTimeout(() => {
            parent.postMessage({ type: 'navigate', url: 'admin_usuarios.html' }, '*');
        }, 1000);

    } catch (error) {
        console.error('Error creating user:', error);
        showError(error.message);
    }
}

// Handle form submission
async function handleFormSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const data = {
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        password: formData.get('password'),
        confirmPassword: formData.get('confirmPassword'),
        role: formData.get('role'),
        canManageUsers: formData.get('canManageUsers') === 'on',
        canManageEstablishments: formData.get('canManageEstablishments') === 'on',
        canViewReports: formData.get('canViewReports') === 'on'
    };

    // Validate form
    const errors = validateForm(data);
    if (errors.length > 0) {
        showError(errors.join('\n'));
        return;
    }

    showLoading(true);
    
    try {
        await createUser(data);
    } finally {
        showLoading(false);
    }
}

// Initialize page
document.addEventListener('DOMContentLoaded', async function() {
    const isAuthenticated = await checkAuthAndAdmin();
    if (!isAuthenticated) return;

    // Add event listeners
    document.getElementById('role').addEventListener('change', handleRoleChange);
    document.getElementById('createUserForm').addEventListener('submit', handleFormSubmit);
    document.getElementById('logoutBtn').addEventListener('click', function() {
        logout();
    });

    // Add real-time password confirmation validation
    document.getElementById('confirmPassword').addEventListener('input', function() {
        const password = document.getElementById('password').value;
        const confirmPassword = this.value;
        
        if (confirmPassword && password !== confirmPassword) {
            this.setCustomValidity('Las contraseñas no coinciden');
        } else {
            this.setCustomValidity('');
        }
    });

    // Add real-time email validation
    document.getElementById('email').addEventListener('input', function() {
        const email = this.value;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (email && !emailRegex.test(email)) {
            this.setCustomValidity('El email no es válido');
        } else {
            this.setCustomValidity('');
        }
    });
});
