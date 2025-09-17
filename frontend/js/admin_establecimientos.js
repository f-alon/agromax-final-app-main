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

async function fetchEstablecimientosCompat() {
    // Try Spanish endpoint first, then English alias, normalize fields
    const normalize = (arr) => {
        if (!arr) return [];
        // If object wrapper present { establishments: [...] } or similar
        const list = Array.isArray(arr) ? arr : (arr.establishments || arr.data || []);
        return list.map(e => ({
            id: e.id,
            nombre: e.nombre || e.name,
            numero_oficial: e.numero_oficial || e.official_number || e.number || null,
            propietario_email: e.propietario_email || e.owner_email || e.ownerEmail || null,
            direccion: e.direccion || e.address || null,
            telefono: e.telefono || e.phone || null,
            email: e.email || e.establishment_email || null,
            is_active: e.is_active !== undefined ? e.is_active : (e.isActive !== undefined ? e.isActive : null),
            created_at: e.created_at || e.createdAt || null,
        }));
    };

    try {
        const res = await fetchData(`/api/admin/establecimientos`);
        return normalize(res);
    } catch (err) {
        if (err && err.status === 404) {
            const res2 = await fetchData(`/api/admin/establishments`);
            return normalize(res2);
        }
        throw err;
    }
}

async function loadPageData() {
    if (!checkAuthAndAdmin()) { return; }
    
    const statusMessage = document.getElementById('statusMessage');
    statusMessage.textContent = 'Cargando establecimientos...';
    statusMessage.style.display = 'block';
    
    try {
        const establecimientos = await fetchEstablecimientosCompat();
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
