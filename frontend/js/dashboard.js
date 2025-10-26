// dashboard.js
let dashboardData = null;
let searchTimeout = null;

// Load dashboard statistics
async function loadDashboardStats() {
    try {
        const token = getAuthToken();
        const headers = {};
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }
        const data = await fetchJSON(`/api/dashboard/stats`, { headers });
        dashboardData = data;
        
        // Update establishment info
        document.getElementById('dashboardTitle').textContent = 'Dashboard';
        document.getElementById('establishmentName').textContent = data.establishment.name;
        
        // Update KPIs
        document.getElementById('totalAnimals').textContent = data.stats.totalAnimals;
        document.getElementById('totalRodeos').textContent = data.stats.totalRodeos;
        document.getElementById('pregnancyAlerts').textContent = data.stats.pregnancyAlerts;
        document.getElementById('antibioticsAlerts').textContent = data.stats.antibioticsAlerts;
        
        // Load production summary
        await loadProductionSummary();
        
        // Load alerts
        await loadAlerts();
        
        // Load activity log
        await loadActivityLog();
        
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
        showError('Error al cargar las estadísticas del dashboard');
    }
}

// Load production summary
async function loadProductionSummary() {
    try {
        const data = await fetchData(`/api/dashboard/production-summary?days=30`);
        
        // Update production summary
        document.getElementById('avgDailyLiters').textContent = `${data.summary.avgDailyLiters.toFixed(1)} L`;
        document.getElementById('totalLiters').textContent = `${data.summary.totalLiters.toFixed(1)} L`;
        document.getElementById('daysWithData').textContent = data.summary.daysWithData;
        
        // Create simple production chart
        createProductionChart(data.daily);
        
    } catch (error) {
        console.error('Error loading production summary:', error);
    }
}

// Create simple production chart
function createProductionChart(productionData) {
    const chartContainer = document.getElementById('productionChart');
    
    if (!productionData || productionData.length === 0) {
        chartContainer.innerHTML = '<div class="flex items-center justify-center h-full text-gray-500">No hay datos de producción disponibles</div>';
        return;
    }
    
    // Create a simple bar chart using CSS
    const maxLiters = Math.max(...productionData.map(d => d.totalLiters));
    const chartHeight = 200;
    
    const chartHTML = `
        <div class="flex items-end justify-between h-full space-x-1">
            ${productionData.slice(-14).map(day => {
                const height = (day.totalLiters / maxLiters) * chartHeight;
                return `
                    <div class="flex flex-col items-center flex-1">
                        <div class="bg-green-500 w-full rounded-t" style="height: ${height}px;" title="${day.date}: ${day.totalLiters.toFixed(1)}L"></div>
                        <div class="text-xs text-gray-500 mt-1">${new Date(day.date).getDate()}</div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
    
    chartContainer.innerHTML = chartHTML;
}

// Load alerts
async function loadAlerts() {
    try {
        const data = await fetchData(`/api/dashboard/alerts?limit=5`);
        renderAlerts(data.alerts);
        
    } catch (error) {
        console.error('Error loading alerts:', error);
    }
}

// Render alerts
function renderAlerts(alerts) {
    const alertsList = document.getElementById('alertsList');
    
    if (!alerts || alerts.length === 0) {
        alertsList.innerHTML = '<div class="text-sm text-gray-500">No hay alertas activas</div>';
        return;
    }
    
    alertsList.innerHTML = alerts.map(alert => `
        <div class="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
            <div class="flex-shrink-0">
                <div class="w-2 h-2 ${getAlertColor(alert.type)} rounded-full mt-2"></div>
            </div>
            <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900">${alert.title}</p>
                <p class="text-xs text-gray-500">${alert.animal.senasaCaravan || alert.animal.internalCaravan || alert.animal.name}</p>
                <p class="text-xs text-gray-400">${new Date(alert.alertDate).toLocaleDateString()}</p>
            </div>
        </div>
    `).join('');
}

// Get alert color based on type
function getAlertColor(type) {
    switch (type) {
        case 'pregnancy': return 'bg-pink-500';
        case 'antibiotics': return 'bg-red-500';
        case 'health': return 'bg-yellow-500';
        case 'reproduction': return 'bg-blue-500';
        default: return 'bg-gray-500';
    }
}

// Load activity log
async function loadActivityLog() {
    try {
        const data = await fetchData(`/api/dashboard/stats`);
        renderActivityLog(data.activity);
        
    } catch (error) {
        console.error('Error loading activity log:', error);
    }
}

// Render activity log
function renderActivityLog(activities) {
    const activityList = document.getElementById('activityList');
    
    if (!activities || activities.length === 0) {
        activityList.innerHTML = '<div class="text-sm text-gray-500">No hay actividad reciente</div>';
        return;
    }
    
    activityList.innerHTML = activities.map(activity => `
        <div class="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
            <div class="flex-shrink-0">
                <div class="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
            </div>
            <div class="flex-1 min-w-0">
                <p class="text-sm text-gray-900">${activity.description}</p>
                <p class="text-xs text-gray-500">${activity.user}</p>
                <p class="text-xs text-gray-400">${new Date(activity.timestamp).toLocaleString()}</p>
            </div>
        </div>
    `).join('');
}

// Quick search functionality
async function performQuickSearch(query) {
    if (query.length < 2) {
        hideSearchResults();
        return;
    }
    
    try {
        const data = await fetchData(`/api/dashboard/search?q=${encodeURIComponent(query)}`);
        showSearchResults(data.animals);
        
    } catch (error) {
        console.error('Error searching animals:', error);
    }
}

// Show search results
function showSearchResults(animals) {
    const searchResults = document.getElementById('searchResults');
    
    if (!animals || animals.length === 0) {
        searchResults.innerHTML = '<div class="p-3 text-sm text-gray-500">No se encontraron animales</div>';
        searchResults.classList.remove('hidden');
        return;
    }
    
    searchResults.innerHTML = animals.map(animal => `
        <div class="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-200 last:border-b-0" 
             onclick="navigateToAnimal(${animal.id})">
            <div class="flex justify-between items-start">
                <div>
                    <p class="text-sm font-medium text-gray-900">
                        ${animal.senasaCaravan || animal.internalCaravan || 'Sin caravana'}
                    </p>
                    <p class="text-xs text-gray-500">${animal.name || 'Sin nombre'}</p>
                    <p class="text-xs text-gray-400">${animal.rodeo || 'Sin rodeo'}</p>
                </div>
                ${animal.activeAlerts > 0 ? `
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        ${animal.activeAlerts} alerta${animal.activeAlerts > 1 ? 's' : ''}
                    </span>
                ` : ''}
            </div>
        </div>
    `).join('');
    
    searchResults.classList.remove('hidden');
}

// Hide search results
function hideSearchResults() {
    const searchResults = document.getElementById('searchResults');
    searchResults.classList.add('hidden');
}

// Navigate to animal
function navigateToAnimal(animalId) {
    navigateTo(`ficha_animal.html?id=${animalId}`);
}

// Show error message
function showError(message) {
    alert('Error: ' + message);
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    if (!checkAuth()) {
        return;
    }
    
    // Load dashboard data
    loadDashboardStats();
    
    // Add event listeners
    document.getElementById('logoutBtn').addEventListener('click', function() {
        logout();
    });
    
    // Quick search functionality
    const quickSearch = document.getElementById('quickSearch');
    if (quickSearch) {
        quickSearch.addEventListener('input', function(e) {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                performQuickSearch(e.target.value);
            }, 300);
        });
    }
    
    // Hide search results when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('#quickSearch') && !e.target.closest('#searchResults')) {
            hideSearchResults();
        }
    });
    
    // Show admin link if user is admin
    const userData = getUserData();
    if (userData && (userData.role === 'admin' || userData.role === 'super_admin')) {
        const adminLink = document.getElementById('adminLink');
        if (adminLink) {
            adminLink.classList.remove('hidden');
        }
    }
});
