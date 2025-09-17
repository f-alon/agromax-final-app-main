// JavaScript for crear_rodeo.html

const token = getAuthToken();
const establecimientoId = 1;

async function handleAddRodeo(event) {
    event.preventDefault();
    const form = event.target;
    const rodeoData = {
        name: form.nombre.value,
        description: form.descripcion.value || null
    };
    const messageDiv = document.getElementById('message');
    const submitBtn = document.getElementById('submitRodeoBtn');
    messageDiv.textContent = '';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Guardando...';
    
    if (!rodeoData.name) {
        messageDiv.textContent = 'Por favor, ingrese el nombre del rodeo.';
        messageDiv.className = 'mt-4 text-center text-sm text-red-600';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Guardar Rodeo';
        return;
    }
    
    try {
        const data = await fetchData(`/api/rodeos`, {
            method: 'POST',
            body: JSON.stringify(rodeoData)
        });
        const createdName = (data && data.rodeo && (data.rodeo.name || data.rodeo.nombre)) || rodeoData.name;
        messageDiv.textContent = `Rodeo "${createdName}" creado exitosamente. Redirigiendo...`;
        messageDiv.className = 'mt-4 text-center text-sm text-green-600';
        setTimeout(() => {
            navigateTo('rodeos.html');
        }, 2000);
    } catch (error) {
        messageDiv.textContent = `Error: ${error.message}`;
        messageDiv.className = 'mt-4 text-center text-sm text-red-600';
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Guardar Rodeo';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    if (checkAuth()) {
        const addRodeoForm = document.getElementById('addRodeoForm');
        if (addRodeoForm) {
            addRodeoForm.addEventListener('submit', handleAddRodeo);
        }
        
        // Add logout button event listener
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', logout);
        }
    }
});
