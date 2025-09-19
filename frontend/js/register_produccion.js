// JavaScript for register_produccion.html

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
        document.getElementById('registerProduccionForm').style.display = 'none';
        return;
    }
    
    document.getElementById('vacaIdInput').value = currentVacaId;
    
    try {
        const resp = await fetchData(`/api/animals/${currentVacaId}`);
        const animal = resp && resp.animal;
        if (animal) {
            document.getElementById('animalNameHeader').textContent = animal.name || animal.internal_caravan;
        } else {
            document.getElementById('animalNameHeader').textContent = 'Animal no encontrado.';
            document.getElementById('registerProduccionForm').style.display = 'none';
        }
    } catch (error) {
        console.error('Error al cargar datos del animal:', error);
        document.getElementById('animalNameHeader').textContent = 'Error al cargar datos del animal.';
        document.getElementById('registerProduccionForm').style.display = 'none';
    }
}

async function handleRegisterProduccion(event) {
    event.preventDefault();
    const form = event.target;
    const produccionData = {
        fecha_registro: form.fecha_registro.value,
        litros_dia: parseFloat(form.litros_dia.value),
        calidad_grasa: form.calidad_grasa.value ? parseFloat(form.calidad_grasa.value) : null,
        calidad_proteina: form.calidad_proteina.value ? parseFloat(form.calidad_proteina.value) : null
    };
    
    const messageDiv = document.getElementById('message');
    const submitBtn = document.getElementById('submitProduccionBtn');
    messageDiv.textContent = '';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Guardando...';
    
    if (!produccionData.fecha_registro || isNaN(produccionData.litros_dia)) {
        messageDiv.textContent = 'Campos obligatorios faltantes.';
        messageDiv.className = 'mt-4 text-center text-sm text-red-600';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Guardar Registro';
        return;
    }
    
    try {
        const data = await fetchData(`/api/animals/${currentVacaId}/production`, {
            method: 'POST',
            body: JSON.stringify({
                record_date: produccionData.fecha_registro,
                liters_per_day: produccionData.litros_dia,
                quality_rating: produccionData.calidad_grasa || null,
                notes: produccionData.calidad_proteina ? `Proteína: ${produccionData.calidad_proteina}` : null
            })
        });
        messageDiv.textContent = `Registro de producción guardado exitosamente. Redirigiendo...`;
        messageDiv.textContent = `Registro de producción guardado exitosamente. Redirigiendo...`;
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
        
        const registerProduccionForm = document.getElementById('registerProduccionForm');
        if (registerProduccionForm) {
            registerProduccionForm.addEventListener('submit', handleRegisterProduccion);
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
