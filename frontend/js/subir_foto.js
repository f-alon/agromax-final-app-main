// JavaScript for subir_foto.html

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
        document.getElementById('uploadPhotoForm').style.display = 'none';
        return;
    }
    
    document.getElementById('vacaIdInput').value = currentVacaId;
    
    try {
        const animal = await fetchData(`/api/establecimientos/${establecimientoId}/vacas/${currentVacaId}`);
        if (animal) {
            document.getElementById('animalNameHeader').textContent = animal.nombre || animal.caravana_interna;
        } else {
            document.getElementById('animalNameHeader').textContent = 'Animal no encontrado.';
            document.getElementById('uploadPhotoForm').style.display = 'none';
        }
    } catch (error) {
        console.error('Error al cargar datos del animal:', error);
        document.getElementById('animalNameHeader').textContent = 'Error al cargar datos del animal.';
        document.getElementById('uploadPhotoForm').style.display = 'none';
    }
}

async function handleUploadPhoto(event) {
    event.preventDefault();
    const form = event.target;
    const photoFile = form.photoFile.files[0];
    const descripcion = form.descripcion.value;
    
    const messageDiv = document.getElementById('message');
    const submitBtn = document.getElementById('submitPhotoBtn');
    messageDiv.textContent = '';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Subiendo...';
    
    if (!photoFile) {
        messageDiv.textContent = 'Por favor, seleccione un archivo de imagen.';
        messageDiv.className = 'mt-4 text-center text-sm text-red-600';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Subir Foto';
        return;
    }
    
    const formData = new FormData();
    formData.append('file', photoFile);
    formData.append('descripcion', descripcion || '');
    
    try {
        messageDiv.textContent = 'La subida de fotos no está disponible aún.';
        messageDiv.className = 'mt-4 text-center text-sm text-yellow-600';
    } catch (error) {
        console.error('Error al subir foto:', error);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Subir Foto';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    if (checkAuth()) {
        loadAnimalData();
        
        const uploadPhotoForm = document.getElementById('uploadPhotoForm');
        if (uploadPhotoForm) {
            uploadPhotoForm.addEventListener('submit', handleUploadPhoto);
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
