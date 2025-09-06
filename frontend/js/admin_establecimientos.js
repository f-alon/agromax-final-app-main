// JavaScript for admin_establecimientos.html

const token = getAuthToken();
const userData = getUserData();

function checkAuthAndAdmin() {
    if (!token) {
        navigateTo('login.html');
        return false;
    }
    if (!userData || userData.email !== 'admin@agromax.com') {
        document.body.innerHTML = '<h1 class="text-red-600 text-center mt-10">Acceso Denegado: Solo para administradores del sistema.</h1>';
        return false;
    }
    return true;
}

function renderEstablecimientos(establecimientos) {
    const tableBody = document.getElementById('establecimientos-table-body');
    const statusMessage = document.getElementById('statusMessage');
    tableBody.innerHTML = '';
    
    if (establecimientos.length === 0) {
        statusMessage.textContent = 'No se encontraron establecimientos.';
        return;
    }
    
    statusMessage.style.display = 'none';
    establecimientos.forEach(establecimiento => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${establecimiento.id}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${establecimiento.nombre}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${establecimiento.numero_oficial || 'N/A'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${establecimiento.propietario_email || 'N/A'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <a href="#" class="text-green-600 hover:text-green-900">Ver Detalles</a>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

async function loadPageData() {
    if (!checkAuthAndAdmin()) { return; }
    
    const statusMessage = document.getElementById('statusMessage');
    statusMessage.textContent = 'Cargando establecimientos...';
    statusMessage.style.display = 'block';
    
    try {
        const establecimientos = await fetchData(`/api/admin/establecimientos`);
        renderEstablecimientos(establecimientos);
    } catch (error) {
        console.error('Error al cargar establecimientos:', error);
        statusMessage.textContent = `Error al cargar establecimientos: ${error.message}`;
        statusMessage.className = 'text-center p-4 text-red-600';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    loadPageData();
    
    // Add logout button event listener
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
});
