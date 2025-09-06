// admin_usuarios.js
let currentPage = 1;
let currentSearch = '';
let currentRoleFilter = '';

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

// Load admin statistics
async function loadStats() {
    try {
        const token = getAuthToken();
        const response = await fetch(`${API_BASE_URL}api/admin/stats`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load stats');
        }

        const data = await response.json();
        const stats = data.stats;

        document.getElementById('totalUsers').textContent = stats.totalUsers;
        document.getElementById('activeUsers').textContent = stats.activeUsers;
        document.getElementById('totalAdmins').textContent = stats.totalAdmins + stats.totalSuperAdmins;
        document.getElementById('newUsers30Days').textContent = stats.newUsers30Days;

    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Load users with pagination and filters
async function loadUsers(page = 1, search = '', role = '') {
    try {
        showLoading(true);
        
        const token = getAuthToken();
        const params = new URLSearchParams({
            page: page.toString(),
            limit: '10',
            search: search,
            role: role
        });

        const response = await fetch(`${API_BASE_URL}api/admin/users?${params}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load users');
        }

        const data = await response.json();
        renderUsers(data.users);
        renderPagination(data.pagination);

    } catch (error) {
        console.error('Error loading users:', error);
        showError('Error al cargar los usuarios');
    } finally {
        showLoading(false);
    }
}

// Render users table
function renderUsers(users) {
    const tbody = document.getElementById('usersTableBody');
    
    if (users.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="px-6 py-4 text-center text-gray-500">
                    No se encontraron usuarios
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = users.map(user => `
        <tr class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10">
                        <div class="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span class="text-sm font-medium text-gray-700">
                                ${user.firstName.charAt(0)}${user.lastName.charAt(0)}
                            </span>
                        </div>
                    </div>
                    <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900">
                            ${user.firstName} ${user.lastName}
                        </div>
                        <div class="text-sm text-gray-500">
                            ${user.email}
                        </div>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    user.role === 'super_admin' ? 'bg-purple-100 text-purple-800' :
                    user.role === 'admin' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                }">
                    ${user.role === 'super_admin' ? 'Super Admin' :
                      user.role === 'admin' ? 'Admin' : 'Usuario'}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }">
                    ${user.isActive ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${new Date(user.createdAt).toLocaleDateString('es-ES')}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div class="flex space-x-2">
                    <button onclick="editUser(${user.id})" class="text-blue-600 hover:text-blue-900">
                        Editar
                    </button>
                    <button onclick="toggleUserStatus(${user.id}, ${user.isActive})" class="${
                        user.isActive ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'
                    }">
                        ${user.isActive ? 'Desactivar' : 'Activar'}
                    </button>
                    ${user.role !== 'super_admin' ? `
                        <button onclick="deleteUser(${user.id})" class="text-red-600 hover:text-red-900">
                            Eliminar
                        </button>
                    ` : ''}
                </div>
            </td>
        </tr>
    `).join('');
}

// Render pagination
function renderPagination(pagination) {
    const paginationDiv = document.getElementById('pagination');
    
    if (pagination.pages <= 1) {
        paginationDiv.innerHTML = '';
        return;
    }

    let paginationHTML = `
        <div class="flex items-center justify-between">
            <div class="flex-1 flex justify-between sm:hidden">
                <button onclick="changePage(${pagination.page - 1})" 
                        ${pagination.page <= 1 ? 'disabled' : ''}
                        class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                    Anterior
                </button>
                <button onclick="changePage(${pagination.page + 1})" 
                        ${pagination.page >= pagination.pages ? 'disabled' : ''}
                        class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                    Siguiente
                </button>
            </div>
            <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                    <p class="text-sm text-gray-700">
                        Mostrando <span class="font-medium">${((pagination.page - 1) * pagination.limit) + 1}</span>
                        a <span class="font-medium">${Math.min(pagination.page * pagination.limit, pagination.total)}</span>
                        de <span class="font-medium">${pagination.total}</span> resultados
                    </p>
                </div>
                <div>
                    <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
    `;

    // Previous button
    paginationHTML += `
        <button onclick="changePage(${pagination.page - 1})" 
                ${pagination.page <= 1 ? 'disabled' : ''}
                class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
            <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
        </button>
    `;

    // Page numbers
    for (let i = Math.max(1, pagination.page - 2); i <= Math.min(pagination.pages, pagination.page + 2); i++) {
        paginationHTML += `
            <button onclick="changePage(${i})" 
                    class="relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        i === pagination.page 
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600' 
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    }">
                ${i}
            </button>
        `;
    }

    // Next button
    paginationHTML += `
        <button onclick="changePage(${pagination.page + 1})" 
                ${pagination.page >= pagination.pages ? 'disabled' : ''}
                class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
            <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
            </svg>
        </button>
    `;

    paginationHTML += `
                    </nav>
                </div>
            </div>
        </div>
    `;

    paginationDiv.innerHTML = paginationHTML;
}

// Change page
function changePage(page) {
    currentPage = page;
    loadUsers(currentPage, currentSearch, currentRoleFilter);
}

// Show/hide loading overlay
function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    overlay.classList.toggle('hidden', !show);
}

// Show error message
function showError(message) {
    alert(message);
}

// Edit user
function editUser(userId) {
    parent.postMessage({ type: 'navigate', url: `editar_usuario.html?id=${userId}` }, '*');
}

// Toggle user status
async function toggleUserStatus(userId, currentStatus) {
    if (!confirm(`¿Estás seguro de que quieres ${currentStatus ? 'desactivar' : 'activar'} este usuario?`)) {
        return;
    }

    try {
        const token = getAuthToken();
        const response = await fetch(`${API_BASE_URL}api/admin/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                isActive: !currentStatus
            })
        });

        if (!response.ok) {
            throw new Error('Failed to update user status');
        }

        loadUsers(currentPage, currentSearch, currentRoleFilter);
        showSuccess(`Usuario ${!currentStatus ? 'activado' : 'desactivado'} exitosamente`);

    } catch (error) {
        console.error('Error updating user status:', error);
        showError('Error al actualizar el estado del usuario');
    }
}

// Delete user
async function deleteUser(userId) {
    if (!confirm('¿Estás seguro de que quieres eliminar este usuario? Esta acción no se puede deshacer.')) {
        return;
    }

    try {
        const token = getAuthToken();
        const response = await fetch(`${API_BASE_URL}api/admin/users/${userId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to delete user');
        }

        loadUsers(currentPage, currentSearch, currentRoleFilter);
        showSuccess('Usuario eliminado exitosamente');

    } catch (error) {
        console.error('Error deleting user:', error);
        showError('Error al eliminar el usuario');
    }
}

// Show success message
function showSuccess(message) {
    // You can implement a toast notification here
    alert(message);
}

// Initialize page
document.addEventListener('DOMContentLoaded', async function() {
    const isAuthenticated = await checkAuthAndAdmin();
    if (!isAuthenticated) return;

    // Load initial data
    await loadStats();
    await loadUsers();

    // Add event listeners
    document.getElementById('searchInput').addEventListener('input', function(e) {
        currentSearch = e.target.value;
        currentPage = 1;
        loadUsers(currentPage, currentSearch, currentRoleFilter);
    });

    document.getElementById('roleFilter').addEventListener('change', function(e) {
        currentRoleFilter = e.target.value;
        currentPage = 1;
        loadUsers(currentPage, currentSearch, currentRoleFilter);
    });

    document.getElementById('addUserBtn').addEventListener('click', function() {
        parent.postMessage({ type: 'navigate', url: 'crear_usuario.html' }, '*');
    });

    document.getElementById('logoutBtn').addEventListener('click', function() {
        logout();
    });
});
