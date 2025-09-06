// JavaScript for ficha_animal.html

const token = getAuthToken();
const establecimientoId = 1; // We'll use ID 1 as an example
let vacaId;
let vacaData = {}; // To store all cow data

function renderHeader(vaca) {
    const header = document.getElementById('ficha-header');
    header.innerHTML = `
        <div class="md:flex md:items-center md:justify-between">
            <div class="flex-1 min-w-0">
                <h2 class="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">${vaca.nombre || 'Sin Nombre'}</h2>
                <div class="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
                    <div class="mt-2 flex items-center text-sm text-gray-500"><span class="font-bold mr-2">SENASA:</span> ${vaca.caravana_senasa || 'N/A'}</div>
                    <div class="mt-2 flex items-center text-sm text-gray-500"><span class="font-bold mr-2">Interna:</span> ${vaca.caravana_interna}</div>
                    <div class="mt-2 flex items-center text-sm text-gray-500"><span class="font-bold mr-2">Raza:</span> ${vaca.raza || 'N/A'}</div>
                </div>
            </div>
            <div class="mt-4 flex-shrink-0 flex md:mt-0 md:ml-4 space-x-2">
                <button type="button" class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">Editar</button>
                <button type="button" onclick="generatePDF()" class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700">Descargar PDF</button>
            </div>
        </div>
    `;
    header.classList.remove('opacity-0');
}

function renderTabContent(tabName) {
    const contentDiv = document.getElementById('tab-content');
    contentDiv.innerHTML = '<p class="text-gray-500">Cargando...</p>'; // Loading message

    if (tabName === 'resumen') {
        contentDiv.innerHTML = `
            <h3 class="text-lg font-medium text-gray-900 mb-4">Resumen del Animal</h3>
            <dl class="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                <div class="sm:col-span-1"><dt class="text-sm font-medium text-gray-500">Estado Actual</dt><dd class="mt-1 text-sm text-gray-900 font-semibold">${vacaData.vaca.estado_actual || 'N/A'}</dd></div>
                <div class="sm:col-span-1"><dt class="text-sm font-medium text-gray-500">Estado Reproductivo</dt><dd class="mt-1 text-sm text-gray-900 font-semibold">${vacaData.vaca.estado_reproductivo || 'N/A'}</dd></div>
                <div class="sm:col-span-1"><dt class="text-sm font-medium text-gray-500">Fecha de Nacimiento</dt><dd class="mt-1 text-sm text-gray-900">${vacaData.vaca.fecha_nacimiento ? new Date(vacaData.vaca.fecha_nacimiento).toLocaleDateString('es-AR') : 'N/A'}</dd></div>
            </dl>
        `;
    } else if (tabName === 'fotos') {
        const photos = vacaData.fotos || [];
        let photosHTML = `<div class="flex items-center justify-between mb-4">
                            <h3 class="text-lg font-medium text-gray-900">Fotos del Animal</h3>
                            <button type="button" data-navigate="subir_foto.html?vacaId=${vacaData.vaca.id}"
                                class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                                Subir Foto
                            </button>
                        </div>`;
        if (photos.length === 0) {
            photosHTML += `<p class="text-gray-500">No hay fotos para este animal.</p>`;
        } else {
            photosHTML += `<div class="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">`;
            photos.forEach(photo => {
                photosHTML += `
                    <div class="bg-gray-100 rounded-lg shadow-sm overflow-hidden">
                        <img src="${photo.url_foto}" alt="${photo.descripcion || 'Foto del animal'}" class="w-full h-48 object-cover">
                        <p class="p-2 text-sm text-gray-600">${photo.descripcion || 'Sin descripción'}</p>
                    </div>
                `;
            });
            photosHTML += `</div>`;
        }
        contentDiv.innerHTML = photosHTML;

    } else {
        const data = vacaData[tabName] || [];
        let tableHTML = `<div class="flex items-center justify-between mb-4">
                            <h3 class="text-lg font-medium text-gray-900">${tabName.charAt(0).toUpperCase() + tabName.slice(1)} del Animal</h3>
                            <button type="button" data-navigate="register_${tabName}.html?vacaId=${vacaData.vaca.id}"
                                class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                                Registrar ${tabName.charAt(0).toUpperCase() + tabName.slice(1)}
                            </button>
                        </div>`;

        if (data.length === 0) {
            tableHTML += `<p class="text-gray-500">No hay registros de ${tabName} para este animal.</p>`;
            contentDiv.innerHTML = tableHTML;
            return;
        }
        
        tableHTML += `<div class="overflow-x-auto"><table class="min-w-full divide-y divide-gray-200"><thead class="bg-gray-50"><tr>`;
        if(tabName === 'salud') tableHTML += `<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>`;
        if(tabName === 'reproduccion') tableHTML += `<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Detalle</th>`;
        if(tabName === 'produccion') tableHTML += `<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Litros/Día</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grasa (%)</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Proteína (%)</th>`;
        tableHTML += `</tr></thead><tbody class="bg-white divide-y divide-gray-200">`;

        data.forEach(item => {
            tableHTML += `<tr>`;
            if(tabName === 'salud') tableHTML += `<td class="px-6 py-4 text-sm text-gray-700">${new Date(item.fecha_evento).toLocaleDateString('es-AR')}</td><td class="px-6 py-4 text-sm text-gray-700">${item.tipo_evento}</td><td class="px-6 py-4 text-sm text-gray-700">${item.descripcion}</td>`;
            if(tabName === 'reproduccion') tableHTML += `<td class="px-6 py-4 text-sm text-gray-700">${new Date(item.fecha_evento).toLocaleDateString('es-AR')}</td><td class="px-6 py-4 text-sm text-gray-700">${item.tipo_evento}</td><td class="px-6 py-4 text-sm text-gray-700">${item.detalle}</td>`;
            if(tabName === 'produccion') tableHTML += `<td class="px-6 py-4 text-sm text-gray-700">${new Date(item.fecha_registro).toLocaleDateString('es-AR')}</td><td class="px-6 py-4 text-sm text-gray-700 font-bold">${item.litros_dia}</td><td class="px-6 py-4 text-sm text-gray-700">${item.calidad_grasa || 'N/A'}</td><td class="px-6 py-4 text-sm text-gray-700">${item.calidad_proteina || 'N/A'}</td>`;
            tableHTML += `</tr>`;
        });

        tableHTML += `</tbody></table></div>`; // Close overflow-x-auto div
        contentDiv.innerHTML = tableHTML;
    }
}

async function generatePDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const vaca = vacaData.vaca;

    let y = 20;
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('AGROMEX', 105, y, { align: 'center' });
    y += 8;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('LOGÍSTICA AGROPECUARIA', 105, y, { align: 'center' });
    y += 5;
    doc.setLineWidth(0.5);
    doc.line(20, y, 190, y);
    y += 15;

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(`Ficha Individual de Animal: ${vaca.nombre || 'Sin Nombre'}`, 20, y);
    y += 10;

    doc.setFontSize(12);
    doc.text('1. Datos de Identificación', 20, y);
    y += 7;
    doc.setFont('helvetica', 'normal');
    doc.text(`Caravana SENASA: ${vaca.caravana_senasa || 'N/A'}`, 25, y);
    doc.text(`Caravana Interna: ${vaca.caravana_interna}`, 110, y);
    y += 7;
    doc.text(`Raza: ${vaca.raza || 'N/A'}`, 25, y);
    doc.text(`Estado Actual: ${vaca.estado_actual || 'N/A'}`, 110, y);
    y += 7;
    doc.text(`Estado Reproductivo: ${vaca.estado_reproductivo || 'N/A'}`, 25, y);
    y += 7;
    doc.text(`Fecha de Nacimiento: ${vaca.fecha_nacimiento ? new Date(vaca.fecha_nacimiento).toLocaleDateString('es-AR') : 'N/A'}`, 110, y);
    y += 15;

    // Title for Health
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('2. Historial de Salud', 20, y);
    y += 7;
    doc.setFont('helvetica', 'normal');

    // Health Table
    doc.autoTable({
        startY: y,
        head: [['Fecha', 'Tipo', 'Descripción/Observaciones']],
        body: vacaData.salud.map(e => [
            new Date(e.fecha_evento).toLocaleDateString('es-AR'),
            e.tipo_evento,
            e.descripcion
        ]),
        didDrawPage: (data) => { y = data.cursor.y; },
        theme: 'grid',
        headStyles: { fillColor: [22, 163, 74] },
        margin: { left: 20, right: 20 },
    });
    y = doc.autoTable.previous.finalY + 10; // Update 'y' after table

    // Title for Reproduction
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('3. Historial de Reproducción', 20, y);
    y += 7;
    doc.setFont('helvetica', 'normal');

    // Reproduction Table
    doc.autoTable({
        startY: y,
        head: [['Fecha', 'Tipo', 'Detalle', 'Inseminador']],
        body: vacaData.reproduccion.map(e => [
            new Date(e.fecha_evento).toLocaleDateString('es-AR'),
            e.tipo_evento,
            e.detalle || '',
            e.inseminador || ''
        ]),
        didDrawPage: (data) => { y = data.cursor.y; },
        theme: 'grid',
        headStyles: { fillColor: [22, 163, 74] },
        margin: { left: 20, right: 20 },
    });
    y = doc.autoTable.previous.finalY + 10; // Update 'y' after table

    // Title for Production
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('4. Historial de Producción', 20, y);
    y += 7;
    doc.setFont('helvetica', 'normal');

    // Production Table
    doc.autoTable({
        startY: y,
        head: [['Fecha', 'Litros/Día', 'Grasa (%)', 'Proteína (%)']],
        body: vacaData.produccion.map(e => [
            new Date(e.fecha_registro).toLocaleDateString('es-AR'),
            e.litros_dia,
            e.calidad_grasa || 'N/A',
            e.calidad_proteina || 'N/A'
        ]),
        didDrawPage: (data) => { y = data.cursor.y; },
        theme: 'grid',
        headStyles: { fillColor: [22, 163, 74] },
        margin: { left: 20, right: 20 },
    });
    y = doc.autoTable.previous.finalY + 10; // Update 'y' after table

    // Title for Photos
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('5. Fotos del Animal', 20, y);
    y += 7;
    doc.setFont('helvetica', 'normal');

    if (vacaData.fotos && vacaData.fotos.length > 0) {
        vacaData.fotos.forEach((foto, index) => {
            // This is just a placeholder, jsPDF doesn't handle images easily without a real URL.
            // For PDF, you would need to convert the image to base64 or have a directly accessible URL.
            // Here we'll simply list the URL.
            doc.text(`Foto ${index + 1}: ${foto.descripcion || 'Sin descripción'} - ${foto.url_foto}`, 25, y);
            y += 7;
            if (y > 280) { // Check for page overflow
                doc.addPage();
                y = 20; // Reset Y for new page
            }
        });
    } else {
        doc.text('No hay fotos registradas para este animal.', 25, y);
        y += 7;
    }

    const pageCount = doc.internal.getNumberOfPages();
    for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        const today = new Date().toLocaleDateString('es-AR');
        doc.text(`Reporte generado el: ${today}`, 20, 285);
        doc.text(`Página ${i} de ${pageCount}`, 190, 285, { align: 'right' });
    }

    doc.save(`Ficha_AGROMEX_${vaca.caravana_interna}.pdf`);
}

document.addEventListener('DOMContentLoaded', function() {
    if (!checkAuth()) return;
    
    const urlParams = new URLSearchParams(window.location.search);
    vacaId = urlParams.get('id');

    if (!vacaId) {
        document.body.innerHTML = '<h1 class="text-red-600 text-center mt-10">Error: No se especificó un ID de animal.</h1>';
        return;
    }

    Promise.all([
        fetchData(`/api/establecimientos/${establecimientoId}/vacas/${vacaId}`),
        fetchData(`/api/establecimientos/${establecimientoId}/vacas/${vacaId}/salud`),
        fetchData(`/api/establecimientos/${establecimientoId}/vacas/${vacaId}/reproduccion`),
        fetchData(`/api/establecimientos/${establecimientoId}/vacas/${vacaId}/produccion`),
        fetchData(`/api/establecimientos/${establecimientoId}/vacas/${vacaId}/fotos`) // New call for photos
    ]).then(([vaca, salud, reproduccion, produccion, fotos]) => {
        // Ensure data are arrays, even if they come null
        vacaData = { 
            vaca: vaca, 
            salud: salud || [], 
            reproduccion: reproduccion || [], 
            produccion: produccion || [],
            fotos: fotos || [] // Assign photos
        };
        renderHeader(vaca);
        renderTabContent('resumen'); // Show summary by default
    }).catch(error => {
        console.error("Error loading all cow data:", error);
        document.body.innerHTML = `<h1 class="text-red-600 text-center mt-10">Error al cargar la ficha del animal: ${error.message}</h1>`;
    });

    const tabs = document.querySelectorAll('.tab-button');
    tabs.forEach(tab => {
        tab.addEventListener('click', (event) => {
            event.preventDefault();
            tabs.forEach(t => t.classList.remove('active', 'border-green-500', 'text-gray-900'));
            tab.classList.add('active', 'border-green-500', 'text-gray-900');
            renderTabContent(tab.dataset.tab);
        });
    });
    
    // Add logout button event listener
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    // Add generate PDF button event listener
    const generatePDFBtn = document.getElementById('generatePDFBtn');
    if (generatePDFBtn) {
        generatePDFBtn.addEventListener('click', generatePDF);
    }
});
