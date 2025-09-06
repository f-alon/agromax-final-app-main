// JavaScript for crear_animal.html

const token = getAuthToken();
const establecimientoId = 1;

async function populateRodeosDropdown() {
    const rodeosDropdown = document.getElementById('rodeo_id');
    rodeosDropdown.innerHTML = '<option value="">Cargando rodeos...</option>';
    try {
        const data = await fetchData(`/api/establecimientos/${establecimientoId}/rodeos`);
        if (data && data.length > 0) {
            rodeosDropdown.innerHTML = '<option value="">Seleccione un rodeo</option>';
            data.forEach(rodeo => {
                const option = document.createElement('option');
                option.value = rodeo.id;
                option.textContent = rodeo.nombre;
                rodeosDropdown.appendChild(option);
            });
        } else {
            rodeosDropdown.innerHTML = '<option value="">No hay rodeos disponibles</option>';
        }
    } catch (error) {
        console.error('Error populating rodeos dropdown:', error);
        rodeosDropdown.innerHTML = '<option value="">Error al cargar rodeos</option>';
    }
}

async function handleAddAnimal(event) {
    event.preventDefault();
    const form = event.target;
    const animalData = {
        caravana_senasa: form.caravana_senasa.value || null,
        caravana_interna: form.caravana_interna.value,
        nombre: form.nombre.value || null,
        raza: form.raza.value || null,
        fecha_nacimiento: form.fecha_nacimiento.value || null,
        estado_actual: form.estado_actual.value,
        estado_reproductivo: form.estado_reproductivo.value || null,
        rodeo_id: parseInt(form.rodeo_id.value),
        madre_id: form.madre_id.value ? parseInt(form.madre_id.value) : null,
        padre_nombre: form.padre_nombre.value || null,
    };
    const messageDiv = document.getElementById('message');
    const submitBtn = document.getElementById('submitAnimalBtn');
    messageDiv.textContent = '';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Guardando...';
    
    if (!animalData.caravana_interna || !animalData.estado_actual || !animalData.rodeo_id) {
        messageDiv.textContent = 'Por favor, complete los campos obligatorios.';
        messageDiv.className = 'mt-4 text-center text-sm text-red-600';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Guardar Animal';
        return;
    }
    
    try {
        const data = await fetchData(`/api/establecimientos/${establecimientoId}/vacas`, {
            method: 'POST',
            body: JSON.stringify(animalData),
        });
        messageDiv.textContent = `Animal "${data.vaca.nombre || data.vaca.caravana_interna}" añadido exitosamente. Redirigiendo...`;
        messageDiv.className = 'mt-4 text-center text-sm text-green-600';
        setTimeout(() => {
            navigateTo('animales.html');
        }, 2000);
    } catch (error) {
        messageDiv.textContent = `Error: ${error.message}`;
        messageDiv.className = 'mt-4 text-center text-sm text-red-600';
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Guardar Animal';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    if (checkAuth()) {
        populateRodeosDropdown();
        
        const addAnimalForm = document.getElementById('addAnimalForm');
        if (addAnimalForm) {
            addAnimalForm.addEventListener('submit', handleAddAnimal);
        }
        
        // Add logout button event listener
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', logout);
        }
    }
});
