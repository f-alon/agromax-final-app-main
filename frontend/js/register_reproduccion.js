// JavaScript for register_reproduccion.html

const token = getAuthToken();
const establecimientoId = 1;
let currentVacaId;

function goBackToAnimalFicha() {
    if (currentVacaId) {
        navigateTo(`ficha_animal.html?id=${currentVacaId}`);
    } else {
        navigateTo('animales.html');
    }
}

async function loadAnimalData() {
    const urlParams = new URLSearchParams(window.location.search);
    currentVacaId = urlParams.get('vacaId');
    
    if (!currentVacaId) {
        document.getElementById('animalNameHeader').textContent = 'Error: ID de animal no especificado.';
        document.getElementById('registerReproduccionForm').style.display = 'none';
        return;
    }
    
    document.getElementById('vacaIdInput').value = currentVacaId;
    
    try {
        const animal = await fetchData(`/api/establecimientos/${establecimientoId}/vacas/${currentVacaId}`);
        if (animal) {
            document.getElementById('animalNameHeader').textContent = animal.nombre || animal.caravana_interna;
        } else {
            document.getElementById('animalNameHeader').textContent = 'Animal no encontrado.';
            document.getElementById('registerReproduccionForm').style.display = 'none';
        }
    } catch (error) {
        console.error('Error al cargar datos del animal:', error);
        document.getElementById('animalNameHeader').textContent = 'Error al cargar datos del animal.';
        document.getElementById('registerReproduccionForm').style.display = 'none';
    }
}

async function handleRegisterReproduccion(event) {
    event.preventDefault();
    const form = event.target;
    const reproduccionData = {
        fecha_evento: form.fecha_evento.value,
        fecha_es_aproximada: form.fecha_es_aproximada.checked,
        tipo_evento: form.tipo_evento.value,
        detalle: form.detalle.value || null,
        inseminador: form.inseminador.value || null,
        cría_id_oficial: form.cría_id_oficial.value || null
    };
    
    const messageDiv = document.getElementById('message');
    const submitBtn = document.getElementById('submitReproduccionBtn');
    messageDiv.textContent = '';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Guardando...';
    
    if (!reproduccionData.fecha_evento || !reproduccionData.tipo_evento) {
        messageDiv.textContent = 'Campos obligatorios faltantes.';
        messageDiv.className = 'mt-4 text-center text-sm text-red-600';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Guardar Registro';
        return;
    }
    
    try {
        const data = await fetchData(`/api/establecimientos/${establecimientoId}/vacas/${currentVacaId}/reproduccion`, {
            method: 'POST',
            body: JSON.stringify(reproduccionData)
        });
        messageDiv.textContent = `Registro de reproducción guardado exitosamente. Redirigiendo...`;
        messageDiv.className = 'mt-4 text-center text-sm text-green-600';
        setTimeout(() => { goBackToAnimalFicha(); }, 2000);
    } catch (error) {
        messageDiv.textContent = `Error: ${error.message}`;
        messageDiv.className = 'mt-4 text-center text-sm text-red-600';
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Guardar Registro';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    if (checkAuth()) {
        loadAnimalData();
        
        const registerReproduccionForm = document.getElementById('registerReproduccionForm');
        if (registerReproduccionForm) {
            registerReproduccionForm.addEventListener('submit', handleRegisterReproduccion);
        }
        
        // Add cancel button event listener
        const cancelBtn = document.getElementById('cancelBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', goBackToAnimalFicha);
        }
        
        // Add logout button event listener
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', logout);
        }
    }
});
