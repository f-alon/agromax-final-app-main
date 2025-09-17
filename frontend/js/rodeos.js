// JavaScript for rodeos.html

const token = getAuthToken();
const establecimientoId = 1; // Not required by API; kept for compatibility

async function generateRodeoPDF(rodeoId, rodeoNombre) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Fetch animals for this rodeo
    let bodyData = [];
    try {
        const data = await fetchData(`/api/rodeos/${rodeoId}`);
        const animals = (data && data.animals) || [];
        bodyData = animals.map(v => [
            v.senasa_caravan || '',
            v.internal_caravan || '',
            v.name || '',
            ''
        ]);
    } catch (e) {
        console.error('Error loading animals for PDF:', e);
    }

    let y = 20;
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('AGROMAX', 105, y, { align: 'center' });
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
    doc.text(`Informe de Animales por Rodeo: ${rodeoNombre}`, 20, y);
    y += 15;

    doc.autoTable({
        startY: y,
        head: [['N° de SENASA', 'Caravana Interna', 'Nombre', 'Observaciones']],
        body: bodyData,
        theme: 'grid',
        headStyles: { fillColor: [22, 163, 74] },
    });

    const pageCount = doc.internal.getNumberOfPages();
    for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        const today = new Date().toLocaleDateString('es-AR');
        doc.text(`Reporte generado el: ${today}`, 20, 285);
        doc.text(`Página ${i} de ${pageCount}`, 190, 285, { align: 'right' });
    }

    const nombreArchivo = `Informe_Rodeo_${rodeoNombre.replace(/ /g, '_')}.pdf`;
    doc.save(nombreArchivo);
}

function renderRodeos(rodeos) {
    const tableBody = document.getElementById('rodeos-table-body');
    tableBody.innerHTML = '';

    if (rodeos.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="4" class="text-center p-4 text-gray-500">No se encontraron rodeos.</td></tr>`;
        return;
    }

    rodeos.forEach(rodeo => {
        const count = rodeo.animal_count || 0;
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${rodeo.name}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${rodeo.description || ''}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${count}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <a href="#" data-navigate="editar_rodeo.html?id=${rodeo.id}" class="text-green-600 hover:text-green-900">Ver / Editar</a>
                <button class="ml-4 text-blue-600 hover:text-blue-900" onclick="generateRodeoPDF(${rodeo.id}, '${(rodeo.name || '').replace(/'/g, "\'")}')">Descargar PDF</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

async function loadPageData() {
    const data = await fetchData(`/api/rodeos`);
    const rodeos = (data && data.rodeos) || [];
    renderRodeos(rodeos);
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

