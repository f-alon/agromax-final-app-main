// JavaScript for animales.html

const token = getAuthToken();
const userData = getUserData();
const establecimientoId = 1; // We'll use ID 1 as an example

function renderAnimales(animales, rodeos) {
    const tableBody = document.getElementById('animales-table-body');
    tableBody.innerHTML = ''; 

    if (animales.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="7" class="text-center p-4 text-gray-500">No se encontraron animales.</td></tr>`;
        return;
    }
    
    // Create a map of rodeos to easily search for names
    const rodeoMap = new Map(rodeos.map(r => [r.id, r.nombre]));

    animales.forEach(vaca => {
        const rodeoNombre = vaca.rodeo_id ? rodeoMap.get(vaca.rodeo_id) : 'Sin asignar';
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${vaca.caravana_senasa || ''}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${vaca.caravana_interna}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${vaca.nombre || ''}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${rodeoNombre}</td>
            <td class="px-6 py-4 whitespace-nowrap"><span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">${vaca.estado_actual || ''}</span></td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${vaca.estado_reproductivo || ''}</td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <a href="#" data-navigate="ficha_animal.html?id=${vaca.id}" class="text-green-600 hover:text-green-900">Ver Ficha</a>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

async function loadPageData() {
    const [animales, rodeos] = await Promise.all([
        fetchData(`/api/establecimientos/${establecimientoId}/vacas`),
        fetchData(`/api/establecimientos/${establecimientoId}/rodeos`)
    ]);
    
    renderAnimales(animales, rodeos);
    
    // Load rodeos in the filter
    const rodeoFilter = document.getElementById('rodeoFilter');
    rodeos.forEach(rodeo => {
        const option = document.createElement('option');
        option.value = rodeo.id;
        option.textContent = rodeo.nombre;
        rodeoFilter.appendChild(option);
    });
}

document.addEventListener('DOMContentLoaded', function() {
    if (checkAuth()) {
        loadPageData();
        
        // Add logout button event listener
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', logout);
        }
    }
});
