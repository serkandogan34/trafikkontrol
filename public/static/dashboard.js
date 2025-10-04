// Dashboard JavaScript - Complete Implementation

// Global variables
let token = localStorage.getItem('authToken');
let monitoringInterval = null;
let lastGeneratedConfig = '';
let currentSection = 'domains';

// Check authentication on page load
document.addEventListener('DOMContentLoaded', function() {
    if (!token) {
        window.location.href = '/';
        return;
    }
    
    // Initialize dashboard
    initializeDashboard();
    showSection('domains');
});

// =============================================================================
// CORE NAVIGATION AND UI FUNCTIONS  
// =============================================================================

// Show specific section
function showSection(section) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
    
    // Update navigation buttons
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    
    // Show selected section
    const targetSection = document.getElementById(`section-${section}`);
    if (targetSection) {
        targetSection.classList.remove('hidden');
        currentSection = section;
    }
    
    // Update active nav button
    const activeBtn = document.getElementById(`btn-${section}`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
    
    // Load section specific data
    switch(section) {
        case 'domains':
            loadDomains();
            break;
        case 'dns':
            loadDNSRecords();
            break;
        case 'nginx':
            loadNginxConfigs();
            break;
        case 'traffic':
            loadTrafficData();
            break;
        case 'security':
            loadSecurityData();
            break;
        case 'settings':
            loadSettings();
            break;
    }
}

// Initialize dashboard
function initializeDashboard() {
    // Set up event listeners
    setupEventListeners();
    
    // Load initial data
    console.log('Dashboard initialized');
    window.dashboardInitialized = true;
}

// Handle DNS edit form submit
async function handleDNSEditSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const dnsData = {
        name: formData.get('name'),
        type: formData.get('type'),
        value: formData.get('value'),
        ttl: parseInt(formData.get('ttl')) || 300
    };
    
    // Validate required fields
    if (!dnsData.name || !dnsData.type || !dnsData.value) {
        showNotification('Lütfen tüm gerekli alanları doldurun', 'error');
        return;
    }
    
    try {
        const isEdit = e.target.dataset.recordId;
        const url = isEdit ? `/api/dns/${e.target.dataset.recordId}` : '/api/dns';
        const method = isEdit ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dnsData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification(isEdit ? 'DNS kaydı güncellendi' : 'DNS kaydı eklendi', 'success');
            loadDNSRecords();
            
            // Reset form
            e.target.reset();
            delete e.target.dataset.recordId;
        } else {
            showNotification('DNS işlem hatası: ' + data.message, 'error');
        }
    } catch (error) {
        showNotification('DNS işlem hatası: ' + error.message, 'error');
    }
}

// Setup event listeners
function setupEventListeners() {
    try {
        // Domain form
        const domainForm = document.getElementById('addDomainForm');
        if (domainForm) {
            domainForm.addEventListener('submit', handleDomainSubmit);
        }
        
        // DNS form
        const dnsForm = document.getElementById('dnsAddForm');
        if (dnsForm) {
            dnsForm.addEventListener('submit', handleDNSSubmit);
        }
        
        // DNS edit form (may not exist yet - this is OK)
        const dnsEditForm = document.getElementById('dnsEditForm');
        if (dnsEditForm) {
            dnsEditForm.addEventListener('submit', handleDNSEditSubmit);
        }
        
        console.log('Event listeners setup completed');
    } catch (error) {
        console.error('Error setting up event listeners:', error);
    }
}

// =============================================================================
// DOMAIN MANAGEMENT FUNCTIONS
// =============================================================================

// Load domains
async function loadDomains() {
    try {
        const response = await fetch('/api/domains', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        
        const data = await response.json();
        
        if (data.success) {
            renderDomains(data.domains);
        } else {
            showNotification('Domain yükleme hatası: ' + data.message, 'error');
        }
    } catch (error) {
        showNotification('Domain yükleme hatası: ' + error.message, 'error');
    }
}

// Render domains
function renderDomains(domains) {
    const container = document.getElementById('domainList');
    if (!container) return;
    
    if (domains.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-gray-400">
                <i class="fas fa-globe text-4xl mb-4"></i>
                <p>Henüz domain eklenmemiş</p>
                <button onclick="showAddDomain()" class="mt-4 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg">
                    <i class="fas fa-plus mr-2"></i>İlk domainı ekle
                </button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = domains.map(domain => `
        <div class="bg-gray-700 p-4 rounded-lg">
            <div class="flex justify-between items-center">
                <div class="flex items-center space-x-4">
                    <div class="flex-1">
                        <h3 class="font-semibold text-white">${domain.name}</h3>
                        <div class="flex items-center space-x-4 mt-2 text-sm">
                            <span class="flex items-center ${
                                domain.status === 'active' ? 'text-green-400' : 
                                domain.status === 'warning' ? 'text-yellow-400' : 'text-red-400'
                            }">
                                <i class="fas fa-circle mr-1 text-xs"></i>
                                ${domain.status === 'active' ? 'Aktif' : domain.status === 'warning' ? 'Uyarı' : 'Hatalı'}
                            </span>
                            <span class="text-gray-400">
                                <i class="fas fa-chart-line mr-1"></i>
                                ${domain.totalRequests || 0} istek
                            </span>
                            <span class="text-gray-400">
                                <i class="fas fa-robot mr-1"></i>
                                ${domain.botRequests || 0} bot
                            </span>
                        </div>
                    </div>
                </div>
                
                <div class="flex space-x-2">
                    <button onclick="showDomainAnalytics('${domain.id}')" 
                            class="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm" title="Analytics">
                        <i class="fas fa-chart-bar"></i>
                    </button>
                    <button onclick="showDomainIPManagement('${domain.id}')" 
                            class="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded text-sm" title="IP Rules">
                        <i class="fas fa-shield-alt"></i>
                    </button>
                    <button onclick="showDomainGeoTimeControls('${domain.id}')" 
                            class="bg-indigo-600 hover:bg-indigo-700 px-3 py-1 rounded text-sm" title="Geographic & Time Controls">
                        <i class="fas fa-globe-americas"></i>
                    </button>
                    <button onclick="showDomainCampaignAnalytics('${domain.id}')" 
                            class="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded text-sm" title="Campaign Analytics & Rate Limiting">
                        <i class="fas fa-chart-line"></i>
                    </button>
                    <button onclick="showDomainVideoManagement('${domain.id}')" 
                            class="bg-pink-600 hover:bg-pink-700 px-3 py-1 rounded text-sm" title="Video Delivery System">
                        <i class="fas fa-video"></i>
                    </button>
                    <button onclick="showDomainSecurityManagement('${domain.id}')" 
                            class="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm" title="Advanced Security Rules">
                        <i class="fas fa-shield-alt"></i>
                    </button>
                    <button onclick="showDomainIntegrations('${domain.id}')" 
                            class="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded text-sm" title="Hook System & Integrations">
                        <i class="fas fa-plug"></i>
                    </button>
                    <button onclick="checkDomain('${domain.id}')" 
                            class="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm" title="Check Status">
                        <i class="fas fa-sync-alt"></i>
                    </button>
                    <button onclick="editDomain('${domain.id}')" 
                            class="bg-yellow-600 hover:bg-yellow-700 px-3 py-1 rounded text-sm" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteDomain('${domain.id}')" 
                            class="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Show add domain modal
function showAddDomain() {
    document.getElementById('addDomainModal').classList.remove('hidden');
    document.getElementById('domainName').focus();
}

// Hide add domain modal
function hideAddDomain() {
    document.getElementById('addDomainModal').classList.add('hidden');
    document.getElementById('addDomainForm').reset();
}

// Handle domain submit
async function handleDomainSubmit(e) {
    e.preventDefault();
    
    const domainName = document.getElementById('domainName').value.trim();
    
    if (!domainName) {
        showNotification('Domain adı gerekli', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/domains', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: domainName })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Domain başarıyla eklendi', 'success');
            hideAddDomain();
            loadDomains();
        } else {
            showNotification('Domain ekleme hatası: ' + data.message, 'error');
        }
    } catch (error) {
        showNotification('Domain ekleme hatası: ' + error.message, 'error');
    }
}

// Check domain status
async function checkDomain(domainId) {
    try {
        showNotification('Domain kontrol ediliyor...', 'info');
        
        const response = await fetch(`/api/domains/${domainId}/check`, {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + token }
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Domain kontrolü tamamlandı', 'success');
            loadDomains();
        } else {
            showNotification('Domain kontrol hatası: ' + data.message, 'error');
        }
    } catch (error) {
        showNotification('Domain kontrol hatası: ' + error.message, 'error');
    }
}

// Delete domain
async function deleteDomain(domainId) {
    if (!confirm('Bu domain silinecek. Emin misiniz?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/domains/${domainId}`, {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + token }
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Domain silindi', 'success');
            loadDomains();
        } else {
            showNotification('Domain silme hatası: ' + data.message, 'error');
        }
    } catch (error) {
        showNotification('Domain silme hatası: ' + error.message, 'error');
    }
}

// =============================================================================
// DNS MANAGEMENT FUNCTIONS
// =============================================================================

// Load DNS records
async function loadDNSRecords() {
    try {
        const response = await fetch('/api/dns', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        
        const data = await response.json();
        
        if (data.success) {
            renderDNSRecords(data.records);
            updateDNSStats(data.records);
        } else {
            showNotification('DNS kayıtları yükleme hatası: ' + data.message, 'error');
        }
    } catch (error) {
        showNotification('DNS kayıtları yükleme hatası: ' + error.message, 'error');
    }
}

// Render DNS records
function renderDNSRecords(records) {
    const tbody = document.getElementById('dns-records-table');
    const emptyDiv = document.getElementById('dns-empty');
    
    if (!tbody) return;
    
    if (records.length === 0) {
        tbody.innerHTML = '';
        if (emptyDiv) emptyDiv.classList.remove('hidden');
        return;
    }
    
    if (emptyDiv) emptyDiv.classList.add('hidden');
    
    tbody.innerHTML = records.map(record => `
        <tr class="hover:bg-gray-600">
            <td class="px-4 py-3">
                <input type="checkbox" class="rounded" value="${record.id}">
            </td>
            <td class="px-4 py-3 font-medium">${record.domain}</td>
            <td class="px-4 py-3">${record.name}</td>
            <td class="px-4 py-3">
                <span class="px-2 py-1 rounded text-xs font-medium ${getRecordTypeColor(record.type)}">
                    ${record.type}
                </span>
            </td>
            <td class="px-4 py-3 font-mono text-sm">${truncateString(record.value, 30)}</td>
            <td class="px-4 py-3">${record.ttl}s</td>
            <td class="px-4 py-3">
                <span class="px-2 py-1 rounded text-xs ${getProviderColor(record.provider)}">
                    ${record.provider}
                </span>
            </td>
            <td class="px-4 py-3">
                <span class="px-2 py-1 rounded text-xs ${getStatusColor(record.status)}">
                    ${record.status === 'active' ? 'Aktif' : record.status === 'pending' ? 'Beklemede' : 'Hatalı'}
                </span>
            </td>
            <td class="px-4 py-3">
                <span class="px-2 py-1 rounded text-xs ${getPropagationColor(record.propagationStatus)}">
                    ${record.propagationStatus === 'propagated' ? 'Yayılmış' : record.propagationStatus === 'propagating' ? 'Yayılıyor' : 'Beklemede'}
                </span>
            </td>
            <td class="px-4 py-3">
                <div class="flex space-x-1">
                    <button onclick="editDNSRecord('${record.id}')" 
                            class="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="checkDNSPropagation('${record.id}')" 
                            class="bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-xs">
                        <i class="fas fa-sync-alt"></i>
                    </button>
                    <button onclick="deleteDNSRecord('${record.id}')" 
                            class="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Update DNS statistics
function updateDNSStats(records) {
    const totalEl = document.getElementById('dns-total-records');
    const activeEl = document.getElementById('dns-active-records');
    const propagatingEl = document.getElementById('dns-propagating-records');
    const providersEl = document.getElementById('dns-providers-count');
    
    if (totalEl) totalEl.textContent = records.length;
    if (activeEl) activeEl.textContent = records.filter(r => r.status === 'active').length;
    if (propagatingEl) propagatingEl.textContent = records.filter(r => r.propagationStatus === 'propagating').length;
    if (providersEl) {
        const providers = [...new Set(records.map(r => r.provider))];
        providersEl.textContent = providers.length;
    }
}

// Show DNS add modal
function showDNSAddModal() {
    document.getElementById('dnsAddModal').classList.remove('hidden');
    document.getElementById('dns-domain').focus();
}

// Hide DNS add modal
function hideDNSAddModal() {
    document.getElementById('dnsAddModal').classList.add('hidden');
    document.getElementById('dnsAddForm').reset();
}

// Handle DNS submit
async function handleDNSSubmit(e) {
    e.preventDefault();
    
    const formData = {
        domain: document.getElementById('dns-domain').value.trim(),
        name: document.getElementById('dns-name').value.trim(),
        type: document.getElementById('dns-type').value,
        value: document.getElementById('dns-value').value.trim(),
        ttl: parseInt(document.getElementById('dns-ttl').value),
        priority: document.getElementById('dns-priority').value ? parseInt(document.getElementById('dns-priority').value) : null,
        provider: document.getElementById('dns-provider').value
    };
    
    if (!formData.domain || !formData.name || !formData.type || !formData.value) {
        showNotification('Tüm alanları doldurun', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/dns', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('DNS kaydı başarıyla eklendi', 'success');
            hideDNSAddModal();
            loadDNSRecords();
        } else {
            showNotification('DNS kaydı ekleme hatası: ' + data.message, 'error');
        }
    } catch (error) {
        showNotification('DNS kaydı ekleme hatası: ' + error.message, 'error');
    }
}

// Function moved to earlier in file to avoid hoisting issues

// Delete DNS record
async function deleteDNSRecord(recordId) {
    if (!confirm('Bu DNS kaydı silinecek. Emin misiniz?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/dns/${recordId}`, {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + token }
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('DNS kaydı silindi', 'success');
            loadDNSRecords();
        } else {
            showNotification('DNS silme hatası: ' + data.message, 'error');
        }
    } catch (error) {
        showNotification('DNS silme hatası: ' + error.message, 'error');
    }
}

// =============================================================================
// NGINX CONFIGURATION FUNCTIONS
// =============================================================================

// Load NGINX configs
async function loadNginxConfigs() {
    try {
        const response = await fetch('/api/nginx/all-domain-configs', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        
        const data = await response.json();
        
        if (data.success) {
            renderNginxConfigs(data.domains);
            updateNginxStats(data.domains);
        } else {
            showNotification('NGINX config yükleme hatası: ' + data.message, 'error');
        }
    } catch (error) {
        showNotification('NGINX config yükleme hatası: ' + error.message, 'error');
    }
}

// Render NGINX configurations
function renderNginxConfigs(domains) {
    const container = document.getElementById('domain-configs-container');
    if (!container) return;
    
    const domainEntries = Object.entries(domains);
    
    if (domainEntries.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-gray-400">
                <i class="fas fa-server text-4xl mb-4"></i>
                <p>Henüz domain konfigürasyonu yok</p>
                <button onclick="showSection('domains')" class="mt-4 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg">
                    <i class="fas fa-plus mr-2"></i>Önce domain ekleyin
                </button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = domainEntries.map(([domainId, domainData]) => `
        <div class="bg-gray-600 p-4 rounded-lg">
            <div class="flex justify-between items-center mb-4">
                <h4 class="font-semibold text-white">
                    <i class="fas fa-globe mr-2 text-blue-400"></i>
                    ${domainData.domain.name}
                </h4>
                <span class="px-2 py-1 rounded text-xs ${
                    domainData.domain.status === 'active' ? 'bg-green-600 text-white' : 
                    'bg-red-600 text-white'
                }">
                    ${domainData.domain.status}
                </span>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                    <label class="block text-sm font-medium text-gray-300 mb-1">Clean Backend</label>
                    <input type="text" value="${domainData.config.cleanBackend}" 
                           onchange="updateDomainConfig('${domainId}', 'cleanBackend', this.value)"
                           class="w-full p-2 bg-gray-700 border border-gray-500 rounded text-white text-sm">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-300 mb-1">Gray Backend</label>
                    <input type="text" value="${domainData.config.grayBackend}" 
                           onchange="updateDomainConfig('${domainId}', 'grayBackend', this.value)"
                           class="w-full p-2 bg-gray-700 border border-gray-500 rounded text-white text-sm">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-300 mb-1">Aggressive Backend</label>
                    <input type="text" value="${domainData.config.aggressiveBackend}" 
                           onchange="updateDomainConfig('${domainId}', 'aggressiveBackend', this.value)"
                           class="w-full p-2 bg-gray-700 border border-gray-500 rounded text-white text-sm">
                </div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-300 mb-1">Routing Mode</label>
                    <select onchange="updateDomainConfig('${domainId}', 'routingMode', this.value)"
                            class="w-full p-2 bg-gray-700 border border-gray-500 rounded text-white text-sm">
                        <option value="smart" ${domainData.config.routingMode === 'smart' ? 'selected' : ''}>Smart</option>
                        <option value="aggressive" ${domainData.config.routingMode === 'aggressive' ? 'selected' : ''}>Aggressive</option>
                        <option value="defensive" ${domainData.config.routingMode === 'defensive' ? 'selected' : ''}>Defensive</option>
                    </select>
                </div>
                <div class="flex items-center space-x-4 pt-6">
                    <label class="flex items-center">
                        <input type="checkbox" ${domainData.config.botDetection ? 'checked' : ''}
                               onchange="updateDomainConfig('${domainId}', 'botDetection', this.checked)"
                               class="mr-2">
                        Bot Detection
                    </label>
                    <label class="flex items-center">
                        <input type="checkbox" ${domainData.config.geoRouting ? 'checked' : ''}
                               onchange="updateDomainConfig('${domainId}', 'geoRouting', this.checked)"
                               class="mr-2">
                        Geo Routing
                    </label>
                </div>
            </div>
        </div>
    `).join('');
}

// Update domain configuration
async function updateDomainConfig(domainId, field, value) {
    try {
        const response = await fetch(`/api/nginx/domain-config/${domainId}`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ [field]: value })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Konfigürasyon güncellendi', 'success');
        } else {
            showNotification('Güncelleme hatası: ' + data.message, 'error');
        }
    } catch (error) {
        showNotification('Güncelleme hatası: ' + error.message, 'error');
    }
}

// Generate advanced NGINX config
async function generateAdvancedNginxConfig() {
    try {
        showNotification('NGINX konfigürasyonu oluşturuluyor...', 'info');
        
        const response = await fetch('/api/nginx/generate-config', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({})
        });
        
        const data = await response.json();
        
        if (data.success) {
            lastGeneratedConfig = data.config;
            document.getElementById('advanced-nginx-config-preview').textContent = data.config;
            showNotification(`${data.domainCount} domain için konfigürasyon oluşturuldu`, 'success');
        } else {
            showNotification('Config oluşturma hatası: ' + data.message, 'error');
        }
    } catch (error) {
        showNotification('Config oluşturma hatası: ' + error.message, 'error');
    }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

// Show notification
function showNotification(message, type = 'info') {
    console.log(`[${type.toUpperCase()}] ${message}`);
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-opacity duration-300 ${
        type === 'success' ? 'bg-green-600 text-white' :
        type === 'error' ? 'bg-red-600 text-white' :
        type === 'warning' ? 'bg-yellow-600 text-white' :
        'bg-blue-600 text-white'
    }`;
    notification.innerHTML = `
        <div class="flex items-center">
            <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'exclamation-triangle' : 'info'} mr-2"></i>
            ${message}
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Download advanced NGINX config
async function downloadAdvancedConfig() {
    try {
        const response = await fetch('/api/nginx/download-config', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `nginx-traffic-management-${Date.now()}.conf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            showNotification('NGINX konfigürasyonu indirildi', 'success');
        } else {
            const data = await response.json();
            showNotification('İndirme hatası: ' + data.message, 'error');
        }
    } catch (error) {
        showNotification('İndirme hatası: ' + error.message, 'error');
    }
}

// Copy config to clipboard
function copyConfigToClipboard() {
    const configText = document.getElementById('advanced-nginx-config-preview').textContent;
    if (configText && configText.length > 100) {
        navigator.clipboard.writeText(configText).then(() => {
            showNotification('Konfigürasyon panoya kopyalandı', 'success');
        }).catch(err => {
            showNotification('Panoya kopyalama hatası', 'error');
        });
    } else {
        showNotification('Önce konfigürasyon oluşturun', 'error');
    }
}

// Logout function
function logout() {
    if (confirm('Çıkış yapmak istediğinizden emin misiniz?')) {
        localStorage.removeItem('authToken');
        window.location.href = '/';
    }
}

// Utility functions for styling
function getRecordTypeColor(type) {
    const colors = {
        'A': 'bg-blue-100 text-blue-800',
        'AAAA': 'bg-purple-100 text-purple-800',
        'CNAME': 'bg-green-100 text-green-800',
        'MX': 'bg-orange-100 text-orange-800',
        'TXT': 'bg-gray-100 text-gray-800',
        'NS': 'bg-red-100 text-red-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
}

function getStatusColor(status) {
    const colors = {
        'active': 'bg-green-100 text-green-800',
        'pending': 'bg-yellow-100 text-yellow-800',
        'error': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
}

function getPropagationColor(status) {
    const colors = {
        'propagated': 'bg-green-100 text-green-800',
        'propagating': 'bg-yellow-100 text-yellow-800',
        'pending': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
}

function getProviderColor(provider) {
    const colors = {
        'CLOUDFLARE': 'bg-orange-100 text-orange-800',
        'GODADDY': 'bg-green-100 text-green-800',
        'NAMECHEAP': 'bg-blue-100 text-blue-800',
        'CUSTOM': 'bg-purple-100 text-purple-800'
    };
    return colors[provider] || 'bg-gray-100 text-gray-800';
}

function truncateString(str, length) {
    return str.length > length ? str.substring(0, length) + '...' : str;
}

// Placeholder functions for missing features
function loadTrafficData() { showNotification('Trafik analizi yükleniyor...', 'info'); }
function loadSecurityData() { showNotification('Güvenlik analizi yükleniyor...', 'info'); }
function loadSettings() { showNotification('Ayarlar yükleniyor...', 'info'); }
function refreshDomainConfigs() { loadNginxConfigs(); }
function updateNginxStats(domains) { 
    const totalEl = document.getElementById('nginx-total-domains');
    const activeEl = document.getElementById('nginx-active-configs');
    
    if (totalEl) totalEl.textContent = Object.keys(domains).length;
    if (activeEl) activeEl.textContent = Object.values(domains).filter(d => d.domain.status === 'active').length;
}

// DNS value placeholder updater
function updateDNSValuePlaceholder() {
    const typeSelect = document.getElementById('dns-type');
    const valueInput = document.getElementById('dns-value');
    const priorityDiv = document.getElementById('dns-priority-div');
    
    if (!typeSelect || !valueInput) return;
    
    const placeholders = {
        'A': '192.168.1.1',
        'AAAA': '2001:db8::1',
        'CNAME': 'example.com',
        'MX': 'mail.example.com',
        'TXT': 'Text değeri',
        'NS': 'ns1.example.com'
    };
    
    valueInput.placeholder = placeholders[typeSelect.value] || 'Değer';
    
    if (priorityDiv) {
        if (typeSelect.value === 'MX') {
            priorityDiv.classList.remove('hidden');
        } else {
            priorityDiv.classList.add('hidden');
        }
    }
}

// =============================================================================
// PHASE 1: IP MANAGEMENT & VISITOR ANALYTICS FUNCTIONS
// =============================================================================

// Show domain IP management modal
function showDomainIPManagement(domainId) {
    // Create and show IP management modal
    const modal = document.createElement('div');
    modal.id = 'ipManagementModal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-gray-800 p-6 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-2xl font-bold flex items-center text-purple-300">
                    <i class="fas fa-shield-alt mr-3"></i>
                    IP Management & Security Rules
                </h3>
                <button onclick="closeIPManagementModal()" class="text-gray-400 hover:text-white text-2xl">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <!-- IP Management Content -->
            <div id="ipManagementContent">
                <div class="text-center py-8">
                    <i class="fas fa-spinner fa-spin text-3xl text-purple-400"></i>
                    <p class="text-gray-300 mt-2">IP rules loading...</p>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    loadDomainIPRules(domainId);
}

// Load domain IP rules
async function loadDomainIPRules(domainId) {
    try {
        const response = await fetch(`/api/domains/${domainId}/ip-rules`, {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        
        const data = await response.json();
        
        if (data.success) {
            renderIPManagementContent(domainId, data);
        } else {
            showNotification('IP rules loading error: ' + data.message, 'error');
        }
    } catch (error) {
        showNotification('IP rules loading error: ' + error.message, 'error');
    }
}

// Render IP management content
function renderIPManagementContent(domainId, data) {
    const container = document.getElementById('ipManagementContent');
    if (!container) return;
    
    const { domain, ipRules, summary } = data;
    
    container.innerHTML = `
        <!-- Summary Stats -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div class="bg-gray-700 p-4 rounded-lg border-l-4 border-green-500">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-gray-300 text-sm">Whitelist</p>
                        <p class="text-2xl font-bold text-green-400">${summary.whitelistCount}</p>
                    </div>
                    <i class="fas fa-check-circle text-green-400 text-2xl"></i>
                </div>
            </div>
            
            <div class="bg-gray-700 p-4 rounded-lg border-l-4 border-red-500">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-gray-300 text-sm">Blacklist</p>
                        <p class="text-2xl font-bold text-red-400">${summary.blacklistCount}</p>
                    </div>
                    <i class="fas fa-ban text-red-400 text-2xl"></i>
                </div>
            </div>
            
            <div class="bg-gray-700 p-4 rounded-lg border-l-4 border-yellow-500">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-gray-300 text-sm">Graylist</p>
                        <p class="text-2xl font-bold text-yellow-400">${summary.graylistCount}</p>
                    </div>
                    <i class="fas fa-exclamation-triangle text-yellow-400 text-2xl"></i>
                </div>
            </div>
            
            <div class="bg-gray-700 p-4 rounded-lg border-l-4 border-purple-500">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-gray-300 text-sm">Range Rules</p>
                        <p class="text-2xl font-bold text-purple-400">${summary.rangeRulesCount}</p>
                    </div>
                    <i class="fas fa-network-wired text-purple-400 text-2xl"></i>
                </div>
            </div>
        </div>
        
        <!-- Add IP Rule Form -->
        <div class="bg-gray-700 p-4 rounded-lg mb-6">
            <h4 class="text-lg font-semibold text-white mb-4 flex items-center">
                <i class="fas fa-plus text-blue-400 mr-2"></i>
                Add IP Rule
            </h4>
            <form id="addIPRuleForm" class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-300 mb-2">IP Address</label>
                    <input type="text" id="ipAddress" required
                           class="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white"
                           placeholder="192.168.1.1">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-300 mb-2">List Type</label>
                    <select id="listType" required
                            class="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white">
                        <option value="">Select...</option>
                        <option value="whitelist">Whitelist (Always Allow)</option>
                        <option value="blacklist">Blacklist (Always Block)</option>
                        <option value="graylist">Graylist (Monitor)</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-300 mb-2">Reason</label>
                    <input type="text" id="ipReason"
                           class="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white"
                           placeholder="Trusted office IP">
                </div>
                <div class="flex items-end">
                    <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-medium">
                        <i class="fas fa-plus mr-2"></i>Add IP Rule
                    </button>
                </div>
            </form>
        </div>
        
        <!-- IP Rules Tables -->
        <div class="space-y-6">
            ${renderIPRulesList('whitelist', ipRules.whitelist, 'green', domainId)}
            ${renderIPRulesList('blacklist', ipRules.blacklist, 'red', domainId)}
            ${renderIPRulesList('graylist', ipRules.graylist, 'yellow', domainId)}
        </div>
        
        <!-- Bulk Operations -->
        <div class="bg-gray-700 p-4 rounded-lg mt-6">
            <h4 class="text-lg font-semibold text-white mb-4 flex items-center">
                <i class="fas fa-layer-group text-orange-400 mr-2"></i>
                Bulk Operations
            </h4>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-300 mb-2">IP List (one per line)</label>
                    <textarea id="bulkIPs" rows="4" 
                              class="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white"
                              placeholder="192.168.1.1
192.168.1.2
10.0.0.1"></textarea>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-300 mb-2">Action</label>
                    <select id="bulkAction"
                            class="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white mb-2">
                        <option value="add">Add to List</option>
                        <option value="remove">Remove from All Lists</option>
                    </select>
                    
                    <select id="bulkListType"
                            class="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white">
                        <option value="whitelist">Whitelist</option>
                        <option value="blacklist">Blacklist</option>
                        <option value="graylist">Graylist</option>
                    </select>
                </div>
                <div class="flex flex-col justify-end space-y-2">
                    <input type="text" id="bulkReason"
                           class="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white"
                           placeholder="Bulk operation reason">
                    <button onclick="performBulkIPOperation('${domainId}')" 
                            class="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded-lg font-medium">
                        <i class="fas fa-bolt mr-2"></i>Execute Bulk Operation
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Setup form event listener
    document.getElementById('addIPRuleForm').addEventListener('submit', (e) => {
        e.preventDefault();
        addIPRule(domainId);
    });
}

// Render IP rules list for specific type
function renderIPRulesList(listType, rules, color, domainId) {
    const colorClasses = {
        green: { border: 'border-green-500', text: 'text-green-400', bg: 'bg-green-900' },
        red: { border: 'border-red-500', text: 'text-red-400', bg: 'bg-red-900' },
        yellow: { border: 'border-yellow-500', text: 'text-yellow-400', bg: 'bg-yellow-900' }
    };
    
    const colors = colorClasses[color];
    const title = listType.charAt(0).toUpperCase() + listType.slice(1);
    
    if (rules.length === 0) {
        return `
            <div class="bg-gray-700 p-4 rounded-lg border-l-4 ${colors.border}">
                <h4 class="text-lg font-semibold ${colors.text} mb-2 flex items-center">
                    <i class="fas fa-${listType === 'whitelist' ? 'check-circle' : listType === 'blacklist' ? 'ban' : 'exclamation-triangle'} mr-2"></i>
                    ${title} (0 rules)
                </h4>
                <p class="text-gray-400">No ${listType} rules configured.</p>
            </div>
        `;
    }
    
    return `
        <div class="bg-gray-700 p-4 rounded-lg border-l-4 ${colors.border}">
            <h4 class="text-lg font-semibold ${colors.text} mb-4 flex items-center">
                <i class="fas fa-${listType === 'whitelist' ? 'check-circle' : listType === 'blacklist' ? 'ban' : 'exclamation-triangle'} mr-2"></i>
                ${title} (${rules.length} rules)
            </h4>
            
            <div class="overflow-x-auto">
                <table class="w-full text-sm">
                    <thead class="bg-gray-600">
                        <tr>
                            <th class="px-4 py-2 text-left">IP Address</th>
                            <th class="px-4 py-2 text-left">Reason</th>
                            <th class="px-4 py-2 text-left">Added</th>
                            <th class="px-4 py-2 text-left">Added By</th>
                            <th class="px-4 py-2 text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-600">
                        ${rules.map(rule => `
                            <tr class="hover:bg-gray-600">
                                <td class="px-4 py-2 font-mono ${colors.text}">${rule.ip}</td>
                                <td class="px-4 py-2 text-gray-300">${rule.reason || 'No reason provided'}</td>
                                <td class="px-4 py-2 text-gray-400">${new Date(rule.addedAt).toLocaleDateString()}</td>
                                <td class="px-4 py-2 text-gray-400">${rule.addedBy}</td>
                                <td class="px-4 py-2">
                                    <button onclick="removeIPRule('${domainId}', '${rule.ip}')" 
                                            class="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// Add IP rule
async function addIPRule(domainId) {
    const ip = document.getElementById('ipAddress').value.trim();
    const listType = document.getElementById('listType').value;
    const reason = document.getElementById('ipReason').value.trim();
    
    if (!ip || !listType) {
        showNotification('IP address and list type are required', 'error');
        return;
    }
    
    try {
        const response = await fetch(`/api/domains/${domainId}/ip-rules`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ ip, listType, reason })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('IP rule added successfully', 'success');
            document.getElementById('addIPRuleForm').reset();
            loadDomainIPRules(domainId); // Reload
        } else {
            showNotification('Error adding IP rule: ' + data.message, 'error');
        }
    } catch (error) {
        showNotification('Error adding IP rule: ' + error.message, 'error');
    }
}

// Remove IP rule
async function removeIPRule(domainId, ip) {
    if (!confirm(`Remove IP ${ip} from all lists?`)) return;
    
    try {
        const response = await fetch(`/api/domains/${domainId}/ip-rules/${encodeURIComponent(ip)}`, {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + token }
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('IP rule removed successfully', 'success');
            loadDomainIPRules(domainId); // Reload
        } else {
            showNotification('Error removing IP rule: ' + data.message, 'error');
        }
    } catch (error) {
        showNotification('Error removing IP rule: ' + error.message, 'error');
    }
}

// Perform bulk IP operation
async function performBulkIPOperation(domainId) {
    const ips = document.getElementById('bulkIPs').value.split('\n')
        .map(ip => ip.trim())
        .filter(ip => ip.length > 0);
    const action = document.getElementById('bulkAction').value;
    const listType = document.getElementById('bulkListType').value;
    const reason = document.getElementById('bulkReason').value.trim() || 'Bulk operation';
    
    if (ips.length === 0) {
        showNotification('Please enter at least one IP address', 'error');
        return;
    }
    
    if (!confirm(`${action} ${ips.length} IP addresses ${action === 'add' ? 'to ' + listType : 'from all lists'}?`)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/domains/${domainId}/ip-bulk`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ action, ips, listType, reason })
        });
        
        const data = await response.json();
        
        if (data.success) {
            const successful = data.results.filter(r => r.success).length;
            showNotification(`Bulk operation completed: ${successful}/${ips.length} successful`, 'success');
            document.getElementById('bulkIPs').value = '';
            document.getElementById('bulkReason').value = '';
            loadDomainIPRules(domainId); // Reload
        } else {
            showNotification('Error in bulk operation: ' + data.message, 'error');
        }
    } catch (error) {
        showNotification('Error in bulk operation: ' + error.message, 'error');
    }
}

// Close IP management modal
function closeIPManagementModal() {
    const modal = document.getElementById('ipManagementModal');
    if (modal) {
        modal.remove();
    }
}

// Show domain analytics modal
function showDomainAnalytics(domainId) {
    const modal = document.createElement('div');
    modal.id = 'analyticsModal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-gray-800 p-6 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-2xl font-bold flex items-center text-green-300">
                    <i class="fas fa-chart-bar mr-3"></i>
                    Visitor Analytics & Traffic Insights
                </h3>
                <button onclick="closeAnalyticsModal()" class="text-gray-400 hover:text-white text-2xl">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <!-- Analytics Controls -->
            <div class="bg-gray-700 p-4 rounded-lg mb-6">
                <div class="flex flex-wrap items-center gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-1">Time Range</label>
                        <select id="analyticsTimeRange" onchange="loadDomainAnalytics('${domainId}')"
                                class="px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white">
                            <option value="1h">Last Hour</option>
                            <option value="24h" selected>Last 24 Hours</option>
                            <option value="7d">Last 7 Days</option>
                            <option value="30d">Last 30 Days</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-1">Country Filter</label>
                        <select id="analyticsCountry" onchange="loadDomainAnalytics('${domainId}')"
                                class="px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white">
                            <option value="">All Countries</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-1">Referrer Filter</label>
                        <input type="text" id="analyticsReferrer" onchange="loadDomainAnalytics('${domainId}')"
                               class="px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white"
                               placeholder="facebook, google, etc.">
                    </div>
                    <div class="flex items-end">
                        <button onclick="loadDomainAnalytics('${domainId}')" 
                                class="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-medium">
                            <i class="fas fa-sync-alt mr-2"></i>Refresh
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- Analytics Content -->
            <div id="analyticsContent">
                <div class="text-center py-8">
                    <i class="fas fa-spinner fa-spin text-3xl text-green-400"></i>
                    <p class="text-gray-300 mt-2">Loading analytics...</p>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    loadDomainAnalytics(domainId);
}

// Load domain analytics
async function loadDomainAnalytics(domainId) {
    const timeRange = document.getElementById('analyticsTimeRange')?.value || '24h';
    const country = document.getElementById('analyticsCountry')?.value || '';
    const referrer = document.getElementById('analyticsReferrer')?.value || '';
    
    try {
        // Load basic analytics
        const analyticsResponse = await fetch(`/api/domains/${domainId}/analytics`, {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        
        // Load detailed analytics with filters
        const detailedResponse = await fetch(`/api/domains/${domainId}/analytics/detailed?timeRange=${timeRange}&country=${country}&referrer=${referrer}`, {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        
        const analyticsData = await analyticsResponse.json();
        const detailedData = await detailedResponse.json();
        
        if (analyticsData.success && detailedData.success) {
            renderAnalyticsContent(analyticsData, detailedData);
        } else {
            showNotification('Error loading analytics: ' + (analyticsData.message || detailedData.message), 'error');
        }
    } catch (error) {
        showNotification('Error loading analytics: ' + error.message, 'error');
    }
}

// Render analytics content
function renderAnalyticsContent(analyticsData, detailedData) {
    const container = document.getElementById('analyticsContent');
    if (!container) return;
    
    const { analytics } = analyticsData;
    const { analytics: detailed } = detailedData;
    
    container.innerHTML = `
        <!-- Overview Stats -->
        <div class="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div class="bg-gray-700 p-4 rounded-lg border-l-4 border-blue-500">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-gray-300 text-sm">Total Requests</p>
                        <p class="text-2xl font-bold text-blue-400">${analytics.overview.totalRequests.toLocaleString()}</p>
                    </div>
                    <i class="fas fa-globe text-blue-400 text-2xl"></i>
                </div>
            </div>
            
            <div class="bg-gray-700 p-4 rounded-lg border-l-4 border-green-500">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-gray-300 text-sm">Human Traffic</p>
                        <p class="text-2xl font-bold text-green-400">${analytics.overview.humanRequests.toLocaleString()}</p>
                        <p class="text-xs text-gray-400">${analytics.overview.humanRate}%</p>
                    </div>
                    <i class="fas fa-user text-green-400 text-2xl"></i>
                </div>
            </div>
            
            <div class="bg-gray-700 p-4 rounded-lg border-l-4 border-yellow-500">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-gray-300 text-sm">Bot Traffic</p>
                        <p class="text-2xl font-bold text-yellow-400">${analytics.overview.botRequests.toLocaleString()}</p>
                        <p class="text-xs text-gray-400">${analytics.overview.botRate}%</p>
                    </div>
                    <i class="fas fa-robot text-yellow-400 text-2xl"></i>
                </div>
            </div>
            
            <div class="bg-gray-700 p-4 rounded-lg border-l-4 border-red-500">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-gray-300 text-sm">Blocked</p>
                        <p class="text-2xl font-bold text-red-400">${analytics.overview.blocked.toLocaleString()}</p>
                    </div>
                    <i class="fas fa-ban text-red-400 text-2xl"></i>
                </div>
            </div>
            
            <div class="bg-gray-700 p-4 rounded-lg border-l-4 border-purple-500">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-gray-300 text-sm">Unique Visitors</p>
                        <p class="text-2xl font-bold text-purple-400">${analytics.overview.uniqueVisitors.toLocaleString()}</p>
                    </div>
                    <i class="fas fa-users text-purple-400 text-2xl"></i>
                </div>
            </div>
        </div>
        
        <!-- Content Served & Referrers -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <!-- Content Served -->
            <div class="bg-gray-700 p-4 rounded-lg">
                <h4 class="text-lg font-semibold text-white mb-4 flex items-center">
                    <i class="fas fa-layer-group text-cyan-400 mr-2"></i>
                    Content Type Served
                </h4>
                <div class="space-y-3">
                    <div class="flex items-center justify-between">
                        <span class="text-green-400">Clean Content</span>
                        <span class="text-white font-semibold">${analytics.content.cleanServed.toLocaleString()}</span>
                    </div>
                    <div class="flex items-center justify-between">
                        <span class="text-yellow-400">Gray Content</span>
                        <span class="text-white font-semibold">${analytics.content.grayServed.toLocaleString()}</span>
                    </div>
                    <div class="flex items-center justify-between">
                        <span class="text-red-400">Aggressive Content</span>
                        <span class="text-white font-semibold">${analytics.content.aggressiveServed.toLocaleString()}</span>
                    </div>
                </div>
            </div>
            
            <!-- Referrers -->
            <div class="bg-gray-700 p-4 rounded-lg">
                <h4 class="text-lg font-semibold text-white mb-4 flex items-center">
                    <i class="fas fa-external-link-alt text-orange-400 mr-2"></i>
                    Traffic Sources
                </h4>
                <div class="space-y-2">
                    ${Object.entries(analytics.referrers).map(([source, count]) => `
                        <div class="flex items-center justify-between">
                            <span class="text-gray-300 capitalize">${source}</span>
                            <span class="text-white font-semibold">${count.toLocaleString()}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
        
        <!-- Top Countries -->
        <div class="bg-gray-700 p-4 rounded-lg mb-6">
            <h4 class="text-lg font-semibold text-white mb-4 flex items-center">
                <i class="fas fa-flag text-indigo-400 mr-2"></i>
                Top Countries (Last ${detailedData.timeRange})
            </h4>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                ${analytics.topCountries.slice(0, 9).map(country => `
                    <div class="bg-gray-600 p-3 rounded">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-white font-semibold">${country.country}</span>
                            <span class="text-gray-300">${country.requests} requests</span>
                        </div>
                        <div class="flex space-x-2 text-sm">
                            <span class="text-green-400">${country.humans} humans</span>
                            <span class="text-yellow-400">${country.bots} bots</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <!-- Recent Activity -->
        <div class="bg-gray-700 p-4 rounded-lg">
            <h4 class="text-lg font-semibold text-white mb-4 flex items-center">
                <i class="fas fa-clock text-pink-400 mr-2"></i>
                Recent Visitor Activity (Last ${detailed.summary.totalFiltered} visits)
            </h4>
            
            <!-- Filtered Summary -->
            <div class="bg-gray-600 p-3 rounded mb-4">
                <div class="grid grid-cols-4 gap-4 text-center">
                    <div>
                        <p class="text-2xl font-bold text-blue-400">${detailed.summary.totalFiltered}</p>
                        <p class="text-xs text-gray-300">Filtered Visits</p>
                    </div>
                    <div>
                        <p class="text-2xl font-bold text-green-400">${detailed.summary.humanCount}</p>
                        <p class="text-xs text-gray-300">Humans</p>
                    </div>
                    <div>
                        <p class="text-2xl font-bold text-yellow-400">${detailed.summary.botCount}</p>
                        <p class="text-xs text-gray-300">Bots</p>
                    </div>
                    <div>
                        <p class="text-2xl font-bold text-red-400">${detailed.summary.actionBreakdown.blocked}</p>
                        <p class="text-xs text-gray-300">Blocked</p>
                    </div>
                </div>
            </div>
            
            <div class="overflow-x-auto">
                <table class="w-full text-sm">
                    <thead class="bg-gray-600">
                        <tr>
                            <th class="px-3 py-2 text-left">Time</th>
                            <th class="px-3 py-2 text-left">IP</th>
                            <th class="px-3 py-2 text-left">Country</th>
                            <th class="px-3 py-2 text-left">Type</th>
                            <th class="px-3 py-2 text-left">Action</th>
                            <th class="px-3 py-2 text-left">Referrer</th>
                            <th class="px-3 py-2 text-left">User Agent</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-600">
                        ${detailed.filteredVisitors.slice(0, 50).map(visitor => `
                            <tr class="hover:bg-gray-600">
                                <td class="px-3 py-2 text-gray-300">${new Date(visitor.timestamp).toLocaleTimeString()}</td>
                                <td class="px-3 py-2 font-mono text-cyan-400">${visitor.ip}</td>
                                <td class="px-3 py-2 text-gray-300">${visitor.country}</td>
                                <td class="px-3 py-2">
                                    <span class="inline-flex px-2 py-1 rounded text-xs ${visitor.isBot ? 'bg-yellow-900 text-yellow-300' : 'bg-green-900 text-green-300'}">
                                        ${visitor.isBot ? 'Bot' : 'Human'}
                                    </span>
                                </td>
                                <td class="px-3 py-2">
                                    <span class="inline-flex px-2 py-1 rounded text-xs ${
                                        visitor.action === 'clean' ? 'bg-green-900 text-green-300' :
                                        visitor.action === 'gray' ? 'bg-yellow-900 text-yellow-300' :
                                        visitor.action === 'aggressive' ? 'bg-orange-900 text-orange-300' :
                                        'bg-red-900 text-red-300'
                                    }">
                                        ${visitor.action}
                                    </span>
                                </td>
                                <td class="px-3 py-2 text-gray-400 max-w-xs truncate">${visitor.referer || 'Direct'}</td>
                                <td class="px-3 py-2 text-gray-400 max-w-xs truncate">${visitor.userAgent}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            
            ${detailed.filteredVisitors.length > 50 ? `
                <div class="text-center mt-4 text-gray-400">
                    Showing 50 of ${detailed.filteredVisitors.length} filtered visits
                </div>
            ` : ''}
        </div>
    `;
    
    // Populate country filter options
    const countrySelect = document.getElementById('analyticsCountry');
    if (countrySelect) {
        const currentValue = countrySelect.value;
        const countries = analytics.topCountries.map(c => c.country);
        countrySelect.innerHTML = '<option value="">All Countries</option>' +
            countries.map(country => `<option value="${country}" ${country === currentValue ? 'selected' : ''}>${country}</option>`).join('');
    }
}

// Close analytics modal
function closeAnalyticsModal() {
    const modal = document.getElementById('analyticsModal');
    if (modal) {
        modal.remove();
    }
}

// =============================================================================
// PHASE 2: GEOGRAPHIC & TIME-BASED ACCESS CONTROLS
// =============================================================================

// Show domain geographic and time controls modal
function showDomainGeoTimeControls(domainId) {
    const modal = document.createElement('div');
    modal.id = 'geoTimeControlsModal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-gray-800 p-6 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-2xl font-bold flex items-center text-indigo-300">
                    <i class="fas fa-globe-americas mr-3"></i>
                    Geographic & Time-based Access Controls
                </h3>
                <button onclick="closeGeoTimeControlsModal()" class="text-gray-400 hover:text-white text-2xl">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <!-- Navigation Tabs -->
            <div class="flex space-x-4 mb-6 border-b border-gray-600">
                <button onclick="showGeoTimeTab('geographic')" 
                        class="geo-time-tab px-4 py-2 border-b-2 border-transparent hover:border-indigo-400 transition-colors"
                        id="tab-geographic">
                    <i class="fas fa-globe mr-2"></i>Geographic Controls
                </button>
                <button onclick="showGeoTimeTab('time')" 
                        class="geo-time-tab px-4 py-2 border-b-2 border-transparent hover:border-indigo-400 transition-colors"
                        id="tab-time">
                    <i class="fas fa-clock mr-2"></i>Time Controls
                </button>
                <button onclick="showGeoTimeTab('testing')" 
                        class="geo-time-tab px-4 py-2 border-b-2 border-transparent hover:border-indigo-400 transition-colors"
                        id="tab-testing">
                    <i class="fas fa-vial mr-2"></i>Access Testing
                </button>
            </div>
            
            <!-- Geographic Controls Tab -->
            <div id="geo-tab-geographic" class="geo-time-content">
                <div class="text-center py-8">
                    <i class="fas fa-spinner fa-spin text-3xl text-indigo-400"></i>
                    <p class="text-gray-300 mt-2">Loading geographic controls...</p>
                </div>
            </div>
            
            <!-- Time Controls Tab -->
            <div id="geo-tab-time" class="geo-time-content hidden">
                <div class="text-center py-8">
                    <i class="fas fa-spinner fa-spin text-3xl text-indigo-400"></i>
                    <p class="text-gray-300 mt-2">Loading time controls...</p>
                </div>
            </div>
            
            <!-- Access Testing Tab -->
            <div id="geo-tab-testing" class="geo-time-content hidden">
                <div class="bg-gray-700 p-4 rounded-lg">
                    <h4 class="text-lg font-semibold text-white mb-4 flex items-center">
                        <i class="fas fa-vial text-cyan-400 mr-2"></i>
                        Test Access Controls
                    </h4>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-2">Test IP Address</label>
                            <input type="text" id="testIP" 
                                   class="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white"
                                   placeholder="192.168.1.1">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-2">Test Country</label>
                            <select id="testCountry" 
                                    class="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white">
                                <option value="US">🇺🇸 United States</option>
                                <option value="CA">🇨🇦 Canada</option>
                                <option value="GB">🇬🇧 United Kingdom</option>
                                <option value="DE">🇩🇪 Germany</option>
                                <option value="CN">🇨🇳 China</option>
                                <option value="RU">🇷🇺 Russia</option>
                            </select>
                        </div>
                        <div class="flex items-end">
                            <button onclick="testDomainAccess('${domainId}')" 
                                    class="w-full bg-cyan-600 hover:bg-cyan-700 px-4 py-2 rounded-lg font-medium">
                                <i class="fas fa-play mr-2"></i>Test Access
                            </button>
                        </div>
                    </div>
                    <div id="accessTestResults" class="mt-4 hidden">
                        <!-- Test results will appear here -->
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    loadGeoTimeControls(domainId);
    showGeoTimeTab('geographic');
}

// Show specific tab in geo/time controls
function showGeoTimeTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.geo-time-tab').forEach(tab => {
        tab.classList.remove('border-indigo-400', 'text-indigo-300');
        tab.classList.add('border-transparent', 'text-gray-300');
    });
    
    document.getElementById(`tab-${tabName}`).classList.remove('border-transparent', 'text-gray-300');
    document.getElementById(`tab-${tabName}`).classList.add('border-indigo-400', 'text-indigo-300');
    
    // Update content
    document.querySelectorAll('.geo-time-content').forEach(content => {
        content.classList.add('hidden');
    });
    
    document.getElementById(`geo-tab-${tabName}`).classList.remove('hidden');
}

// Load geographic and time controls
async function loadGeoTimeControls(domainId) {
    try {
        // Load geographic controls
        const geoResponse = await fetch(`/api/domains/${domainId}/geo-controls`, {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        
        // Load time controls
        const timeResponse = await fetch(`/api/domains/${domainId}/time-controls`, {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        
        const geoData = await geoResponse.json();
        const timeData = await timeResponse.json();
        
        if (geoData.success && timeData.success) {
            renderGeographicControls(domainId, geoData);
            renderTimeControls(domainId, timeData);
        } else {
            showNotification('Error loading geo/time controls: ' + (geoData.message || timeData.message), 'error');
        }
    } catch (error) {
        showNotification('Error loading geo/time controls: ' + error.message, 'error');
    }
}

// Render geographic controls
function renderGeographicControls(domainId, data) {
    const container = document.getElementById('geo-tab-geographic');
    if (!container) return;
    
    console.log('renderGeographicControls data:', data);
    const { geoControls, availableCountries } = data;
    
    if (!availableCountries || !Array.isArray(availableCountries)) {
        console.error('availableCountries not found or not an array:', availableCountries);
        showNotification('Error: Country list not available', 'error');
        return;
    }
    
    container.innerHTML = `
        <!-- Geographic Controls Form -->
        <div class="bg-gray-700 p-6 rounded-lg mb-6">
            <div class="flex items-center justify-between mb-4">
                <h4 class="text-lg font-semibold text-white flex items-center">
                    <i class="fas fa-globe text-indigo-400 mr-2"></i>
                    Geographic Access Control
                </h4>
                <label class="flex items-center space-x-2">
                    <input type="checkbox" id="geoEnabled" ${geoControls.enabled ? 'checked' : ''}
                           onchange="toggleGeographicControls('${domainId}')"
                           class="rounded">
                    <span class="text-sm text-gray-300">Enable Geographic Controls</span>
                </label>
            </div>
            
            <div id="geoControlsContent" class="${geoControls.enabled ? '' : 'opacity-50 pointer-events-none'}">
                <!-- Default Action -->
                <div class="mb-6">
                    <label class="block text-sm font-medium text-gray-300 mb-2">Default Action for Unlisted Countries</label>
                    <select id="geoDefaultAction" onchange="updateGeographicControls('${domainId}')"
                            class="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white">
                        <option value="allow" ${geoControls.defaultAction === 'allow' ? 'selected' : ''}>Allow</option>
                        <option value="block" ${geoControls.defaultAction === 'block' ? 'selected' : ''}>Block</option>
                    </select>
                </div>
                
                <!-- Country Management -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <!-- Allowed Countries -->
                    <div class="bg-gray-600 p-4 rounded-lg border-l-4 border-green-500">
                        <h5 class="font-semibold text-green-300 mb-3 flex items-center">
                            <i class="fas fa-check-circle mr-2"></i>
                            Allowed Countries (${geoControls.allowedCountries.length})
                        </h5>
                        <div class="mb-3">
                            <select id="addAllowedCountry" class="w-full px-3 py-2 bg-gray-700 border border-gray-500 rounded text-white mb-2">
                                <option value="">Select country to allow...</option>
                                ${availableCountries.filter(c => !geoControls.allowedCountries.includes(c.code)).map(country => 
                                    `<option value="${country.code}">${country.flag} ${country.name}</option>`
                                ).join('')}
                            </select>
                            <button onclick="addCountryToList('${domainId}', 'allowed')" 
                                    class="w-full bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm">
                                <i class="fas fa-plus mr-1"></i>Add to Allowed
                            </button>
                        </div>
                        <div class="space-y-2 max-h-40 overflow-y-auto">
                            ${geoControls.allowedCountries.map(countryCode => {
                                const country = availableCountries.find(c => c.code === countryCode);
                                return country ? `
                                    <div class="flex items-center justify-between bg-gray-700 p-2 rounded">
                                        <span class="text-sm">${country.flag} ${country.name}</span>
                                        <button onclick="removeCountryFromList('${domainId}', 'allowed', '${countryCode}')" 
                                                class="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs">
                                            <i class="fas fa-times"></i>
                                        </button>
                                    </div>
                                ` : '';
                            }).join('')}
                        </div>
                    </div>
                    
                    <!-- Blocked Countries -->
                    <div class="bg-gray-600 p-4 rounded-lg border-l-4 border-red-500">
                        <h5 class="font-semibold text-red-300 mb-3 flex items-center">
                            <i class="fas fa-ban mr-2"></i>
                            Blocked Countries (${geoControls.blockedCountries.length})
                        </h5>
                        <div class="mb-3">
                            <select id="addBlockedCountry" class="w-full px-3 py-2 bg-gray-700 border border-gray-500 rounded text-white mb-2">
                                <option value="">Select country to block...</option>
                                ${availableCountries.filter(c => !geoControls.blockedCountries.includes(c.code)).map(country => 
                                    `<option value="${country.code}">${country.flag} ${country.name}</option>`
                                ).join('')}
                            </select>
                            <button onclick="addCountryToList('${domainId}', 'blocked')" 
                                    class="w-full bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm">
                                <i class="fas fa-plus mr-1"></i>Add to Blocked
                            </button>
                        </div>
                        <div class="space-y-2 max-h-40 overflow-y-auto">
                            ${geoControls.blockedCountries.map(countryCode => {
                                const country = availableCountries.find(c => c.code === countryCode);
                                return country ? `
                                    <div class="flex items-center justify-between bg-gray-700 p-2 rounded">
                                        <span class="text-sm">${country.flag} ${country.name}</span>
                                        <button onclick="removeCountryFromList('${domainId}', 'blocked', '${countryCode}')" 
                                                class="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs">
                                            <i class="fas fa-times"></i>
                                        </button>
                                    </div>
                                ` : '';
                            }).join('')}
                        </div>
                    </div>
                </div>
                
                <!-- Redirect Rules -->
                <div class="bg-gray-600 p-4 rounded-lg mt-6 border-l-4 border-blue-500">
                    <h5 class="font-semibold text-blue-300 mb-3 flex items-center">
                        <i class="fas fa-external-link-alt mr-2"></i>
                        Country-specific Redirects
                    </h5>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                        <select id="redirectCountry" class="px-3 py-2 bg-gray-700 border border-gray-500 rounded text-white">
                            <option value="">Select country...</option>
                            ${availableCountries.map(country => 
                                `<option value="${country.code}">${country.flag} ${country.name}</option>`
                            ).join('')}
                        </select>
                        <input type="text" id="redirectURL" placeholder="https://example.com/country-page"
                               class="px-3 py-2 bg-gray-700 border border-gray-500 rounded text-white">
                        <button onclick="addRedirectRule('${domainId}')" 
                                class="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm">
                            <i class="fas fa-plus mr-1"></i>Add Redirect
                        </button>
                    </div>
                    <div class="space-y-2">
                        ${Object.entries(geoControls.redirectRules).map(([countryCode, url]) => {
                            const country = availableCountries.find(c => c.code === countryCode);
                            return country ? `
                                <div class="flex items-center justify-between bg-gray-700 p-2 rounded">
                                    <span class="text-sm">${country.flag} ${country.name} → ${url}</span>
                                    <button onclick="removeRedirectRule('${domainId}', '${countryCode}')" 
                                            class="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            ` : '';
                        }).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Render time controls
function renderTimeControls(domainId, data) {
    const container = document.getElementById('geo-tab-time');
    if (!container) return;
    
    console.log('renderTimeControls data:', data);
    const { timeControls, availableTimezones } = data;
    
    if (!availableTimezones || !Array.isArray(availableTimezones)) {
        console.error('availableTimezones not found or not an array:', availableTimezones);
        showNotification('Error: Timezone list not available', 'error');
        return;
    }
    
    container.innerHTML = `
        <!-- Time Controls Form -->
        <div class="bg-gray-700 p-6 rounded-lg mb-6">
            <div class="flex items-center justify-between mb-4">
                <h4 class="text-lg font-semibold text-white flex items-center">
                    <i class="fas fa-clock text-orange-400 mr-2"></i>
                    Time-based Access Control
                </h4>
                <label class="flex items-center space-x-2">
                    <input type="checkbox" id="timeEnabled" ${timeControls.enabled ? 'checked' : ''}
                           onchange="toggleTimeControls('${domainId}')"
                           class="rounded">
                    <span class="text-sm text-gray-300">Enable Time Controls</span>
                </label>
            </div>
            
            <div id="timeControlsContent" class="${timeControls.enabled ? '' : 'opacity-50 pointer-events-none'}">
                <!-- Timezone Selection -->
                <div class="mb-6">
                    <label class="block text-sm font-medium text-gray-300 mb-2">Domain Timezone</label>
                    <select id="domainTimezone" onchange="updateTimeControls('${domainId}')"
                            class="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white">
                        ${availableTimezones.map(tz => 
                            `<option value="${tz.value}" ${tz.value === timeControls.timezone ? 'selected' : ''}>${tz.name}</option>`
                        ).join('')}
                    </select>
                </div>
                
                <!-- Business Hours -->
                <div class="bg-gray-600 p-4 rounded-lg mb-6 border-l-4 border-green-500">
                    <h5 class="font-semibold text-green-300 mb-3 flex items-center">
                        <i class="fas fa-business-time mr-2"></i>
                        Business Hours
                    </h5>
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label class="block text-sm text-gray-300 mb-1">Start Hour</label>
                            <select id="businessStart" onchange="updateTimeControls('${domainId}')"
                                    class="w-full px-3 py-2 bg-gray-700 border border-gray-500 rounded text-white">
                                ${Array.from({length: 24}, (_, i) => 
                                    `<option value="${i}" ${i === (timeControls.businessHours?.start || 9) ? 'selected' : ''}>${i.toString().padStart(2, '0')}:00</option>`
                                ).join('')}
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm text-gray-300 mb-1">End Hour</label>
                            <select id="businessEnd" onchange="updateTimeControls('${domainId}')"
                                    class="w-full px-3 py-2 bg-gray-700 border border-gray-500 rounded text-white">
                                ${Array.from({length: 24}, (_, i) => 
                                    `<option value="${i}" ${i === (timeControls.businessHours?.end || 17) ? 'selected' : ''}>${i.toString().padStart(2, '0')}:00</option>`
                                ).join('')}
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm text-gray-300 mb-1">Business Days</label>
                            <div class="space-y-1 text-sm">
                                ${['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map(day => `
                                    <label class="flex items-center">
                                        <input type="checkbox" class="business-day mr-2" value="${day}"
                                               ${(timeControls.businessHours?.days || ['mon', 'tue', 'wed', 'thu', 'fri']).includes(day) ? 'checked' : ''}
                                               onchange="updateTimeControls('${domainId}')">
                                        <span class="capitalize">${day}</span>
                                    </label>
                                `).join('')}
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm text-gray-300 mb-1">Block Outside Hours</label>
                            <label class="flex items-center mt-2">
                                <input type="checkbox" id="blockOutsideHours" 
                                       ${timeControls.businessHours?.blockOutsideHours ? 'checked' : ''}
                                       onchange="updateTimeControls('${domainId}')" class="mr-2">
                                <span class="text-sm">Block access outside business hours</span>
                            </label>
                        </div>
                    </div>
                </div>
                
                <!-- Custom Time Rules -->
                <div class="bg-gray-600 p-4 rounded-lg mb-6 border-l-4 border-yellow-500">
                    <h5 class="font-semibold text-yellow-300 mb-3 flex items-center">
                        <i class="fas fa-calendar-alt mr-2"></i>
                        Custom Time Rules
                    </h5>
                    <div class="grid grid-cols-1 md:grid-cols-5 gap-4 mb-3">
                        <div>
                            <label class="block text-sm text-gray-300 mb-1">Days</label>
                            <select id="ruleDay" class="w-full px-3 py-2 bg-gray-700 border border-gray-500 rounded text-white">
                                <option value="all">All Days</option>
                                <option value="mon">Monday</option>
                                <option value="tue">Tuesday</option>
                                <option value="wed">Wednesday</option>
                                <option value="thu">Thursday</option>
                                <option value="fri">Friday</option>
                                <option value="sat">Saturday</option>
                                <option value="sun">Sunday</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm text-gray-300 mb-1">Start Hour</label>
                            <select id="ruleStartHour" class="w-full px-3 py-2 bg-gray-700 border border-gray-500 rounded text-white">
                                ${Array.from({length: 24}, (_, i) => `<option value="${i}">${i.toString().padStart(2, '0')}:00</option>`).join('')}
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm text-gray-300 mb-1">End Hour</label>
                            <select id="ruleEndHour" class="w-full px-3 py-2 bg-gray-700 border border-gray-500 rounded text-white">
                                ${Array.from({length: 24}, (_, i) => `<option value="${i}">${i.toString().padStart(2, '0')}:00</option>`).join('')}
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm text-gray-300 mb-1">Action</label>
                            <select id="ruleAction" class="w-full px-3 py-2 bg-gray-700 border border-gray-500 rounded text-white">
                                <option value="block">Block Access</option>
                                <option value="allow">Force Allow</option>
                            </select>
                        </div>
                        <div class="flex items-end">
                            <button onclick="addTimeRule('${domainId}')" 
                                    class="w-full bg-yellow-600 hover:bg-yellow-700 px-3 py-1 rounded text-sm">
                                <i class="fas fa-plus mr-1"></i>Add Rule
                            </button>
                        </div>
                    </div>
                    <div class="space-y-2">
                        ${(timeControls.rules || []).map((rule, index) => `
                            <div class="flex items-center justify-between bg-gray-700 p-2 rounded">
                                <span class="text-sm">${rule.days.join(', ')} ${rule.hours[0]}:00-${rule.hours[1]}:00 → ${rule.action}</span>
                                <button onclick="removeTimeRule('${domainId}', ${index})" 
                                        class="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <!-- Holiday Blocks -->
                <div class="bg-gray-600 p-4 rounded-lg border-l-4 border-red-500">
                    <h5 class="font-semibold text-red-300 mb-3 flex items-center">
                        <i class="fas fa-calendar-times mr-2"></i>
                        Holiday Blocks
                    </h5>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                        <div>
                            <label class="block text-sm text-gray-300 mb-1">Date</label>
                            <input type="date" id="holidayDate" 
                                   class="w-full px-3 py-2 bg-gray-700 border border-gray-500 rounded text-white">
                        </div>
                        <div>
                            <label class="block text-sm text-gray-300 mb-1">Description</label>
                            <input type="text" id="holidayDescription" placeholder="Christmas Day"
                                   class="w-full px-3 py-2 bg-gray-700 border border-gray-500 rounded text-white">
                        </div>
                        <div class="flex items-end">
                            <button onclick="addHolidayBlock('${domainId}')" 
                                    class="w-full bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm">
                                <i class="fas fa-plus mr-1"></i>Add Holiday
                            </button>
                        </div>
                    </div>
                    <div class="space-y-2">
                        ${(timeControls.holidayBlocks || []).map((holiday, index) => `
                            <div class="flex items-center justify-between bg-gray-700 p-2 rounded">
                                <span class="text-sm">${holiday.date} - ${holiday.description || 'Holiday'}</span>
                                <button onclick="removeHolidayBlock('${domainId}', ${index})" 
                                        class="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Toggle geographic controls
async function toggleGeographicControls(domainId) {
    try {
        const enabledElement = document.getElementById('geoEnabled');
        const contentElement = document.getElementById('geoControlsContent');
        
        if (!enabledElement || !contentElement) {
            console.error('Required elements not found:', { enabledElement, contentElement });
            showNotification('Interface error: Required elements not found', 'error');
            return;
        }
        
        const enabled = enabledElement.checked;
        console.log('Toggling geo controls:', { domainId, enabled });
        
        // Update backend first
        const result = await updateGeoControls(domainId, { enabled });
        
        if (result && result.success) {
            // Update UI only if backend update was successful
            if (enabled) {
                contentElement.classList.remove('opacity-50', 'pointer-events-none');
                showNotification('Geographic controls enabled', 'success');
            } else {
                contentElement.classList.add('opacity-50', 'pointer-events-none');
                showNotification('Geographic controls disabled', 'success');
            }
        } else {
            // Revert checkbox if backend update failed
            enabledElement.checked = !enabled;
            showNotification('Failed to update geographic controls', 'error');
        }
    } catch (error) {
        console.error('Error in toggleGeographicControls:', error);
        showNotification('Error: ' + error.message, 'error');
        
        // Revert checkbox
        const enabledElement = document.getElementById('geoEnabled');
        if (enabledElement) {
            enabledElement.checked = !enabledElement.checked;
        }
    }
}

// Update geographic controls
async function updateGeographicControls(domainId) {
    try {
        const defaultActionElement = document.getElementById('geoDefaultAction');
        if (!defaultActionElement) {
            console.error('geoDefaultAction element not found');
            return;
        }
        
        const defaultAction = defaultActionElement.value;
        console.log('Updating geographic controls:', { domainId, defaultAction });
        
        const result = await updateGeoControls(domainId, { defaultAction });
        if (result && result.success) {
            showNotification('Default action updated', 'success');
        }
    } catch (error) {
        console.error('Error in updateGeographicControls:', error);
        showNotification('Error: ' + error.message, 'error');
    }
}

// Add country to allowed/blocked list
async function addCountryToList(domainId, listType) {
    console.log('addCountryToList called:', { domainId, listType });
    
    const selectId = listType === 'allowed' ? 'addAllowedCountry' : 'addBlockedCountry';
    const selectElement = document.getElementById(selectId);
    
    console.log('Select element found:', { selectId, element: !!selectElement });
    
    if (!selectElement) {
        showNotification('Dropdown not found: ' + selectId, 'error');
        return;
    }
    
    const countryCode = selectElement.value;
    console.log('Selected country code:', countryCode);
    
    if (!countryCode) {
        showNotification('Please select a country', 'error');
        return;
    }
    
    try {
        const response = await fetch(`/api/domains/${domainId}/geo-controls`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                [`${listType}Countries`]: { action: 'add', country: countryCode }
            })
        });
        
        const data = await response.json();
        if (data.success) {
            showNotification(`Country added to ${listType} list`, 'success');
            loadGeoTimeControls(domainId); // Reload
        } else {
            showNotification('Error: ' + data.message, 'error');
        }
    } catch (error) {
        showNotification('Error: ' + error.message, 'error');
    }
}

// Test domain access
async function testDomainAccess(domainId) {
    const ip = document.getElementById('testIP').value;
    const country = document.getElementById('testCountry').value;
    
    if (!ip || !country) {
        showNotification('Please enter IP and select country', 'error');
        return;
    }
    
    try {
        const response = await fetch(`/api/domains/${domainId}/check-access`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ip,
                country,
                userAgent: 'Test User Agent',
                timestamp: new Date().toISOString()
            })
        });
        
        const data = await response.json();
        if (data.success) {
            displayAccessTestResults(data.accessResult);
        } else {
            showNotification('Error: ' + data.message, 'error');
        }
    } catch (error) {
        showNotification('Error: ' + error.message, 'error');
    }
}

// Display access test results
function displayAccessTestResults(result) {
    const container = document.getElementById('accessTestResults');
    container.classList.remove('hidden');
    
    const status = result.allowed ? 'ALLOWED' : 'BLOCKED';
    const statusClass = result.allowed ? 'text-green-400' : 'text-red-400';
    const bgClass = result.allowed ? 'bg-green-900' : 'bg-red-900';
    
    container.innerHTML = `
        <div class="${bgClass} p-4 rounded-lg border-l-4 ${result.allowed ? 'border-green-500' : 'border-red-500'}">
            <h5 class="font-bold ${statusClass} mb-2 flex items-center">
                <i class="fas fa-${result.allowed ? 'check-circle' : 'ban'} mr-2"></i>
                Access ${status}
            </h5>
            <div class="text-sm text-gray-300 space-y-1">
                <div><strong>Geographic Check:</strong> ${result.summary.geoCheck}</div>
                <div><strong>Time Check:</strong> ${result.summary.timeCheck}</div>
                <div><strong>Final Decision:</strong> ${result.summary.finalDecision}</div>
                ${result.reason ? `<div class="text-yellow-300"><strong>Reason:</strong> ${result.reason}</div>` : ''}
                ${result.redirect ? `<div class="text-blue-300"><strong>Redirect:</strong> ${result.redirect}</div>` : ''}
            </div>
        </div>
    `;
}

// Helper functions for updating controls
async function updateGeoControls(domainId, updates) {
    try {
        console.log('updateGeoControls called:', { domainId, updates, token: !!token });
        
        if (!token) {
            throw new Error('Authentication token not found. Please login again.');
        }
        
        const response = await fetch(`/api/domains/${domainId}/geo-controls`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updates)
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Response data:', data);
        
        if (!data.success) {
            showNotification('Error updating geo controls: ' + data.message, 'error');
        }
        return data;
    } catch (error) {
        console.error('updateGeoControls error:', error);
        showNotification('Error updating geo controls: ' + error.message, 'error');
        return { success: false, error: error.message };
    }
}

// Close geo/time controls modal
function closeGeoTimeControlsModal() {
    const modal = document.getElementById('geoTimeControlsModal');
    if (modal) {
        modal.remove();
    }
}

// Toggle time controls
async function toggleTimeControls(domainId) {
    const enabled = document.getElementById('timeEnabled').checked;
    
    try {
        const response = await fetch(`/api/domains/${domainId}/time-controls`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ enabled })
        });
        
        const data = await response.json();
        if (data.success) {
            const content = document.getElementById('timeControlsContent');
            if (enabled) {
                content.classList.remove('opacity-50', 'pointer-events-none');
                showNotification('Time controls enabled', 'success');
            } else {
                content.classList.add('opacity-50', 'pointer-events-none');
                showNotification('Time controls disabled', 'success');
            }
        } else {
            showNotification('Error: ' + data.message, 'error');
        }
    } catch (error) {
        showNotification('Error: ' + error.message, 'error');
    }
}

// Update time controls settings
async function updateTimeControls(domainId) {
    const timezone = document.getElementById('domainTimezone')?.value;
    const businessStart = parseInt(document.getElementById('businessStart')?.value || 9);
    const businessEnd = parseInt(document.getElementById('businessEnd')?.value || 17);
    const blockOutsideHours = document.getElementById('blockOutsideHours')?.checked || false;
    
    // Get selected business days
    const businessDays = [];
    document.querySelectorAll('.business-day:checked').forEach(cb => {
        businessDays.push(cb.value);
    });
    
    const updates = {
        timezone,
        businessHours: {
            start: businessStart,
            end: businessEnd,
            days: businessDays,
            blockOutsideHours
        }
    };
    
    try {
        const response = await fetch(`/api/domains/${domainId}/time-controls`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updates)
        });
        
        const data = await response.json();
        if (data.success) {
            showNotification('Time controls updated', 'success');
        } else {
            showNotification('Error: ' + data.message, 'error');
        }
    } catch (error) {
        showNotification('Error: ' + error.message, 'error');
    }
}

// Add custom time rule
async function addTimeRule(domainId) {
    const days = document.getElementById('ruleDay').value;
    const startHour = parseInt(document.getElementById('ruleStartHour').value);
    const endHour = parseInt(document.getElementById('ruleEndHour').value);
    const action = document.getElementById('ruleAction').value;
    
    if (startHour >= endHour) {
        showNotification('End hour must be after start hour', 'error');
        return;
    }
    
    const rule = {
        days: days === 'all' ? ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] : [days],
        hours: [startHour, endHour],
        action
    };
    
    try {
        const response = await fetch(`/api/domains/${domainId}/time-controls`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                rules: { action: 'add', rule }
            })
        });
        
        const data = await response.json();
        if (data.success) {
            showNotification('Time rule added', 'success');
            loadGeoTimeControls(domainId); // Reload
        } else {
            showNotification('Error: ' + data.message, 'error');
        }
    } catch (error) {
        showNotification('Error: ' + error.message, 'error');
    }
}

// Remove time rule
async function removeTimeRule(domainId, index) {
    try {
        const response = await fetch(`/api/domains/${domainId}/time-controls`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                rules: { action: 'remove', index }
            })
        });
        
        const data = await response.json();
        if (data.success) {
            showNotification('Time rule removed', 'success');
            loadGeoTimeControls(domainId); // Reload
        } else {
            showNotification('Error: ' + data.message, 'error');
        }
    } catch (error) {
        showNotification('Error: ' + error.message, 'error');
    }
}

// Add holiday block
async function addHolidayBlock(domainId) {
    const date = document.getElementById('holidayDate').value;
    const description = document.getElementById('holidayDescription').value || 'Holiday';
    
    if (!date) {
        showNotification('Please select a date', 'error');
        return;
    }
    
    const holiday = { date, description };
    
    try {
        const response = await fetch(`/api/domains/${domainId}/time-controls`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                holidayBlocks: { action: 'add', holiday }
            })
        });
        
        const data = await response.json();
        if (data.success) {
            showNotification('Holiday block added', 'success');
            loadGeoTimeControls(domainId); // Reload
            // Clear form
            document.getElementById('holidayDate').value = '';
            document.getElementById('holidayDescription').value = '';
        } else {
            showNotification('Error: ' + data.message, 'error');
        }
    } catch (error) {
        showNotification('Error: ' + error.message, 'error');
    }
}

// Remove holiday block
async function removeHolidayBlock(domainId, index) {
    try {
        const response = await fetch(`/api/domains/${domainId}/time-controls`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                holidayBlocks: { action: 'remove', index }
            })
        });
        
        const data = await response.json();
        if (data.success) {
            showNotification('Holiday block removed', 'success');
            loadGeoTimeControls(domainId); // Reload
        } else {
            showNotification('Error: ' + data.message, 'error');
        }
    } catch (error) {
        showNotification('Error: ' + error.message, 'error');
    }
}

// Remove country from allowed/blocked list
async function removeCountryFromList(domainId, listType, countryCode) {
    try {
        const response = await fetch(`/api/domains/${domainId}/geo-controls`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                [`${listType}Countries`]: { action: 'remove', country: countryCode }
            })
        });
        
        const data = await response.json();
        if (data.success) {
            showNotification(`Country removed from ${listType} list`, 'success');
            loadGeoTimeControls(domainId); // Reload
        } else {
            showNotification('Error: ' + data.message, 'error');
        }
    } catch (error) {
        showNotification('Error: ' + error.message, 'error');
    }
}

// Add redirect rule for country
async function addRedirectRule(domainId) {
    const countryCode = document.getElementById('redirectCountry').value;
    const url = document.getElementById('redirectURL').value;
    
    if (!countryCode || !url) {
        showNotification('Please select country and enter URL', 'error');
        return;
    }
    
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        showNotification('URL must start with http:// or https://', 'error');
        return;
    }
    
    try {
        const response = await fetch(`/api/domains/${domainId}/geo-controls`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                redirectRules: { action: 'add', country: countryCode, url }
            })
        });
        
        const data = await response.json();
        if (data.success) {
            showNotification('Redirect rule added', 'success');
            loadGeoTimeControls(domainId); // Reload
            // Clear form
            document.getElementById('redirectCountry').value = '';
            document.getElementById('redirectURL').value = '';
        } else {
            showNotification('Error: ' + data.message, 'error');
        }
    } catch (error) {
        showNotification('Error: ' + error.message, 'error');
    }
}

// Remove redirect rule
async function removeRedirectRule(domainId, countryCode) {
    try {
        const response = await fetch(`/api/domains/${domainId}/geo-controls`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                redirectRules: { action: 'remove', country: countryCode }
            })
        });
        
        const data = await response.json();
        if (data.success) {
            showNotification('Redirect rule removed', 'success');
            loadGeoTimeControls(domainId); // Reload
        } else {
            showNotification('Error: ' + data.message, 'error');
        }
    } catch (error) {
        showNotification('Error: ' + error.message, 'error');
    }
}

// Enable debug mode
window.debugTrafficControl = true;

// Debug helper function
window.debugLog = function(...args) {
    if (window.debugTrafficControl) {
        console.log('[DEBUG TrafficControl]', ...args);
    }
}

// DNS Edit Submit Handler (Placeholder)
function handleDNSEditSubmit(e) {
    e.preventDefault();
    console.log('DNS Edit form submitted');
    showNotification('DNS editing feature will be implemented in future phases', 'info');
    return false;
}

// Global error handler
window.addEventListener('error', function(e) {
    console.error('[TrafficControl Error]', e.error);
    
    // Don't show notifications for missing function errors during initialization
    if (!e.message.includes('is not defined') || window.dashboardInitialized) {
        showNotification('JavaScript Error: ' + e.message, 'error');
    }
    
    return false; // Don't prevent default error handling
});

// Global unhandled promise rejection handler
window.addEventListener('unhandledrejection', function(e) {
    console.error('[TrafficControl Promise Rejection]', e.reason);
    showNotification('Promise Error: ' + e.reason, 'error');
});

// =============================================================================
// PHASE 3: CAMPAIGN ANALYTICS & RATE LIMITING FUNCTIONS
// =============================================================================

// Show domain campaign analytics modal
async function showDomainCampaignAnalytics(domainId) {
    try {
        // Load campaign and rate limiting data
        const campaignResponse = await fetch(`/api/domains/${domainId}/campaigns`, {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        
        const rateLimitResponse = await fetch(`/api/domains/${domainId}/rate-limiting`, {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        
        const campaignData = await campaignResponse.json();
        const rateLimitData = await rateLimitResponse.json();
        
        if (!campaignData.success || !rateLimitData.success) {
            showNotification('Error loading campaign/rate limiting data', 'error');
            return;
        }
        
        // Create modal
        const modal = document.createElement('div');
        modal.id = 'campaignAnalyticsModal';
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        
        modal.innerHTML = `
            <div class="bg-gray-800 p-6 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-auto">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-xl font-bold text-white flex items-center">
                        <i class="fas fa-chart-line text-purple-400 mr-2"></i>
                        Campaign Analytics & Rate Limiting
                    </h3>
                    <button onclick="closeCampaignAnalyticsModal()" class="text-gray-400 hover:text-white">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
                
                <!-- Tab Navigation -->
                <div class="flex space-x-4 mb-6 border-b border-gray-600">
                    <button id="campaign-tab-btn" onclick="switchCampaignTab('campaigns')" 
                            class="px-4 py-2 text-sm font-medium border-b-2 border-purple-500 text-purple-400">
                        <i class="fas fa-bullhorn mr-2"></i>Campaign Analytics
                    </button>
                    <button id="ratelimit-tab-btn" onclick="switchCampaignTab('ratelimiting')" 
                            class="px-4 py-2 text-sm font-medium border-b-2 border-transparent text-gray-400 hover:text-white">
                        <i class="fas fa-tachometer-alt mr-2"></i>Rate Limiting
                    </button>
                    <button id="alerts-tab-btn" onclick="switchCampaignTab('alerts')" 
                            class="px-4 py-2 text-sm font-medium border-b-2 border-transparent text-gray-400 hover:text-white">
                        <i class="fas fa-bell mr-2"></i>Alerts & Monitoring
                    </button>
                </div>
                
                <!-- Tab Content -->
                <div id="campaign-tab-campaigns" class="tab-content">
                    <!-- Campaign Analytics Content -->
                </div>
                
                <div id="campaign-tab-ratelimiting" class="tab-content hidden">
                    <!-- Rate Limiting Content -->
                </div>
                
                <div id="campaign-tab-alerts" class="tab-content hidden">
                    <!-- Alerts Content -->
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Load tab content
        renderCampaignAnalytics(domainId, campaignData);
        renderRateLimiting(domainId, rateLimitData);
        renderAlertsMonitoring(domainId, { campaignData, rateLimitData });
        
    } catch (error) {
        showNotification('Error loading campaign analytics: ' + error.message, 'error');
    }
}

// Switch between campaign tabs
function switchCampaignTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.add('hidden');
    });
    
    // Remove active state from all buttons
    document.querySelectorAll('[id$="-tab-btn"]').forEach(btn => {
        btn.classList.remove('border-purple-500', 'text-purple-400');
        btn.classList.add('border-transparent', 'text-gray-400');
    });
    
    // Show selected tab
    document.getElementById(`campaign-tab-${tabName}`).classList.remove('hidden');
    
    // Add active state to selected button
    const activeBtn = document.getElementById(`${tabName}-tab-btn`) || document.getElementById(`${tabName.replace('ratelimiting', 'ratelimit')}-tab-btn`);
    if (activeBtn) {
        activeBtn.classList.add('border-purple-500', 'text-purple-400');
        activeBtn.classList.remove('border-transparent', 'text-gray-400');
    }
}

// Render campaign analytics
function renderCampaignAnalytics(domainId, data) {
    const container = document.getElementById('campaign-tab-campaigns');
    if (!container) return;
    
    console.log('Campaign analytics data:', data);
    
    container.innerHTML = `
        <!-- Campaign Controls -->
        <div class="bg-gray-700 p-6 rounded-lg mb-6">
            <div class="flex items-center justify-between mb-4">
                <h4 class="text-lg font-semibold text-white flex items-center">
                    <i class="fas fa-bullhorn text-purple-400 mr-2"></i>
                    Campaign Tracking
                </h4>
                <label class="flex items-center space-x-2">
                    <input type="checkbox" id="campaignEnabled" ${data.enabled ? 'checked' : ''}
                           onchange="toggleCampaignTracking('${domainId}')"
                           class="rounded">
                    <span class="text-sm text-gray-300">Enable Campaign Tracking</span>
                </label>
            </div>
            
            <div id="campaignContent" class="${data.enabled ? '' : 'opacity-50 pointer-events-none'}">
                <!-- Campaign Statistics -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div class="bg-gray-600 p-4 rounded-lg border-l-4 border-purple-500">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-gray-300 text-sm">Total Clicks</p>
                                <p class="text-2xl font-bold text-purple-400">${data.totalClicks || 0}</p>
                            </div>
                            <i class="fas fa-mouse-pointer text-purple-400 text-2xl"></i>
                        </div>
                    </div>
                    
                    <div class="bg-gray-600 p-4 rounded-lg border-l-4 border-blue-500">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-gray-300 text-sm">Campaigns</p>
                                <p class="text-2xl font-bold text-blue-400">${data.totalCampaigns || 0}</p>
                            </div>
                            <i class="fas fa-bullhorn text-blue-400 text-2xl"></i>
                        </div>
                    </div>
                    
                    <div class="bg-gray-600 p-4 rounded-lg border-l-4 border-green-500">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-gray-300 text-sm">Traffic Sources</p>
                                <p class="text-2xl font-bold text-green-400">${data.totalSources || 0}</p>
                            </div>
                            <i class="fas fa-external-link-alt text-green-400 text-2xl"></i>
                        </div>
                    </div>
                    
                    <div class="bg-gray-600 p-4 rounded-lg border-l-4 border-orange-500">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-gray-300 text-sm">UTM Tracking</p>
                                <p class="text-lg font-bold text-orange-400">${data.settings?.utmTracking ? 'Active' : 'Disabled'}</p>
                            </div>
                            <i class="fas fa-tag text-orange-400 text-2xl"></i>
                        </div>
                    </div>
                </div>
                
                <!-- Top Campaigns -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div class="bg-gray-600 p-4 rounded-lg">
                        <h5 class="font-semibold text-purple-300 mb-3 flex items-center">
                            <i class="fas fa-trophy mr-2"></i>
                            Top Campaigns
                        </h5>
                        <div class="space-y-2 max-h-64 overflow-y-auto">
                            ${(data.topCampaigns || []).map(([name, campaign]) => `
                                <div class="flex items-center justify-between bg-gray-700 p-3 rounded">
                                    <div>
                                        <span class="text-sm font-medium">${name}</span>
                                        <p class="text-xs text-gray-400">${campaign.clicks} clicks</p>
                                    </div>
                                    <div class="text-right">
                                        <div class="text-purple-400 font-bold">${campaign.clicks}</div>
                                        <div class="text-xs text-gray-400">${Object.keys(campaign.sources || {}).length} sources</div>
                                    </div>
                                </div>
                            `).join('')}
                            ${(data.topCampaigns || []).length === 0 ? '<p class="text-gray-400 text-sm">No campaigns yet</p>' : ''}
                        </div>
                    </div>
                    
                    <div class="bg-gray-600 p-4 rounded-lg">
                        <h5 class="font-semibold text-green-300 mb-3 flex items-center">
                            <i class="fas fa-share-alt mr-2"></i>
                            Top Traffic Sources
                        </h5>
                        <div class="space-y-2 max-h-64 overflow-y-auto">
                            ${(data.topSources || []).map(([name, source]) => `
                                <div class="flex items-center justify-between bg-gray-700 p-3 rounded">
                                    <div>
                                        <span class="text-sm font-medium">${name}</span>
                                        <p class="text-xs text-gray-400">${source.clicks} clicks</p>
                                    </div>
                                    <div class="text-right">
                                        <div class="text-green-400 font-bold">${source.clicks}</div>
                                        <div class="text-xs text-gray-400">${Object.keys(source.campaigns || {}).length} campaigns</div>
                                    </div>
                                </div>
                            `).join('')}
                            ${(data.topSources || []).length === 0 ? '<p class="text-gray-400 text-sm">No traffic sources yet</p>' : ''}
                        </div>
                    </div>
                </div>
                
                <!-- Recent Campaign Clicks -->
                <div class="bg-gray-600 p-4 rounded-lg">
                    <h5 class="font-semibold text-blue-300 mb-3 flex items-center">
                        <i class="fas fa-history mr-2"></i>
                        Recent Campaign Clicks
                    </h5>
                    <div class="overflow-x-auto">
                        <table class="w-full text-sm">
                            <thead>
                                <tr class="text-gray-400 border-b border-gray-500">
                                    <th class="text-left py-2">Time</th>
                                    <th class="text-left py-2">Campaign</th>
                                    <th class="text-left py-2">Source</th>
                                    <th class="text-left py-2">Country</th>
                                    <th class="text-left py-2">IP</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${(data.recentClicks || []).slice(0, 20).map(click => `
                                    <tr class="border-b border-gray-700">
                                        <td class="py-2">${new Date(click.timestamp).toLocaleString()}</td>
                                        <td class="py-2">${click.campaign}</td>
                                        <td class="py-2">${click.source}</td>
                                        <td class="py-2">${click.country}</td>
                                        <td class="py-2 font-mono">${click.ip}</td>
                                    </tr>
                                `).join('')}
                                ${(data.recentClicks || []).length === 0 ? '<tr><td colspan="5" class="py-4 text-center text-gray-400">No recent clicks</td></tr>' : ''}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <!-- Campaign Settings -->
                <div class="bg-gray-600 p-4 rounded-lg mt-6">
                    <h5 class="font-semibold text-yellow-300 mb-3 flex items-center">
                        <i class="fas fa-cog mr-2"></i>
                        Campaign Settings
                    </h5>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="flex items-center space-x-2 mb-3">
                                <input type="checkbox" id="utmTracking" ${data.settings?.utmTracking ? 'checked' : ''}
                                       onchange="updateCampaignSettings('${domainId}')"
                                       class="rounded">
                                <span class="text-sm">Enable UTM Parameter Tracking</span>
                            </label>
                            
                            <div class="mb-3">
                                <label class="block text-sm font-medium text-gray-300 mb-2">Valid UTM Sources</label>
                                <div class="flex flex-wrap gap-2">
                                    ${(data.settings?.validUtmSources || []).map(source => `
                                        <span class="bg-blue-600 text-xs px-2 py-1 rounded">${source}</span>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-2">Custom Parameters</label>
                            <div class="flex flex-wrap gap-2">
                                ${(data.settings?.customParameters || []).map(param => `
                                    <span class="bg-purple-600 text-xs px-2 py-1 rounded">${param}</span>
                                `).join('')}
                                ${(data.settings?.customParameters || []).length === 0 ? '<span class="text-gray-400 text-sm">No custom parameters</span>' : ''}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Close campaign analytics modal
function closeCampaignAnalyticsModal() {
    const modal = document.getElementById('campaignAnalyticsModal');
    if (modal) {
        modal.remove();
    }
}

// Toggle campaign tracking
async function toggleCampaignTracking(domainId) {
    const enabled = document.getElementById('campaignEnabled').checked;
    
    try {
        const response = await fetch(`/api/domains/${domainId}/campaigns`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ enabled })
        });
        
        const data = await response.json();
        if (data.success) {
            const content = document.getElementById('campaignContent');
            if (enabled) {
                content.classList.remove('opacity-50', 'pointer-events-none');
                showNotification('Campaign tracking enabled', 'success');
            } else {
                content.classList.add('opacity-50', 'pointer-events-none');
                showNotification('Campaign tracking disabled', 'success');
            }
        } else {
            showNotification('Error: ' + data.message, 'error');
        }
    } catch (error) {
        showNotification('Error: ' + error.message, 'error');
    }
}

// Update campaign settings
async function updateCampaignSettings(domainId) {
    const utmTracking = document.getElementById('utmTracking').checked;
    
    try {
        const response = await fetch(`/api/domains/${domainId}/campaigns`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ utmTracking })
        });
        
        const data = await response.json();
        if (data.success) {
            showNotification('Campaign settings updated', 'success');
        } else {
            showNotification('Error: ' + data.message, 'error');
        }
    } catch (error) {
        showNotification('Error: ' + error.message, 'error');
    }
}

// Placeholder functions for other tabs (will implement next)
function renderRateLimiting(domainId, data) {
    const container = document.getElementById('campaign-tab-ratelimiting');
    if (!container) return;
    
    container.innerHTML = `
        <div class="bg-gray-700 p-6 rounded-lg text-center">
            <i class="fas fa-tachometer-alt text-4xl text-gray-400 mb-4"></i>
            <h4 class="text-xl text-gray-300 mb-2">Rate Limiting Interface</h4>
            <p class="text-gray-400">Rate limiting controls will be implemented here.</p>
        </div>
    `;
}

function renderAlertsMonitoring(domainId, data) {
    const container = document.getElementById('campaign-tab-alerts');
    if (!container) return;
    
    container.innerHTML = `
        <div class="bg-gray-700 p-6 rounded-lg text-center">
            <i class="fas fa-bell text-4xl text-gray-400 mb-4"></i>
            <h4 class="text-xl text-gray-300 mb-2">Alerts & Monitoring</h4>
            <p class="text-gray-400">Alert system will be implemented here.</p>
        </div>
    `;
}

// =============================================================================
// PHASE 4: VIDEO DELIVERY SYSTEM FUNCTIONS
// =============================================================================

// Show domain video management modal
async function showDomainVideoManagement(domainId) {
    try {
        // Load video system data
        const videoResponse = await fetch(`/api/domains/${domainId}/videos`, {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        
        const videoData = await videoResponse.json();
        
        if (!videoData.success) {
            showNotification('Error loading video data', 'error');
            return;
        }
        
        // Create modal
        const modal = document.createElement('div');
        modal.id = 'videoManagementModal';
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        
        modal.innerHTML = `
            <div class="bg-gray-800 p-6 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-auto">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-xl font-bold text-white flex items-center">
                        <i class="fas fa-video text-pink-400 mr-2"></i>
                        Video Delivery System
                    </h3>
                    <button onclick="closeVideoManagementModal()" class="text-gray-400 hover:text-white">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
                
                <!-- Tab Navigation -->
                <div class="flex space-x-4 mb-6 border-b border-gray-600">
                    <button id="videos-tab-btn" onclick="switchVideoTab('videos')" 
                            class="px-4 py-2 text-sm font-medium border-b-2 border-pink-500 text-pink-400">
                        <i class="fas fa-video mr-2"></i>Video Library
                    </button>
                    <button id="analytics-tab-btn" onclick="switchVideoTab('analytics')" 
                            class="px-4 py-2 text-sm font-medium border-b-2 border-transparent text-gray-400 hover:text-white">
                        <i class="fas fa-chart-bar mr-2"></i>Video Analytics
                    </button>
                    <button id="settings-tab-btn" onclick="switchVideoTab('settings')" 
                            class="px-4 py-2 text-sm font-medium border-b-2 border-transparent text-gray-400 hover:text-white">
                        <i class="fas fa-cog mr-2"></i>System Settings
                    </button>
                </div>
                
                <!-- Tab Content -->
                <div id="video-tab-videos" class="tab-content">
                    <!-- Video Library Content -->
                </div>
                
                <div id="video-tab-analytics" class="tab-content hidden">
                    <!-- Video Analytics Content -->
                </div>
                
                <div id="video-tab-settings" class="tab-content hidden">
                    <!-- Settings Content -->
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Load tab content
        renderVideoLibrary(domainId, videoData);
        renderVideoAnalytics(domainId, videoData);
        renderVideoSettings(domainId, videoData);
        
    } catch (error) {
        showNotification('Error loading video management: ' + error.message, 'error');
    }
}

// Switch between video tabs
function switchVideoTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('#videoManagementModal .tab-content').forEach(tab => {
        tab.classList.add('hidden');
    });
    
    // Remove active state from all buttons
    document.querySelectorAll('#videoManagementModal [id$="-tab-btn"]').forEach(btn => {
        btn.classList.remove('border-pink-500', 'text-pink-400');
        btn.classList.add('border-transparent', 'text-gray-400');
    });
    
    // Show selected tab
    document.getElementById(`video-tab-${tabName}`).classList.remove('hidden');
    
    // Add active state to selected button
    const activeBtn = document.getElementById(`${tabName}-tab-btn`);
    if (activeBtn) {
        activeBtn.classList.add('border-pink-500', 'text-pink-400');
        activeBtn.classList.remove('border-transparent', 'text-gray-400');
    }
}

// Render video library
function renderVideoLibrary(domainId, data) {
    const container = document.getElementById('video-tab-videos');
    if (!container) return;
    
    console.log('Video library data:', data);
    
    container.innerHTML = `
        <!-- Video System Controls -->
        <div class="bg-gray-700 p-6 rounded-lg mb-6">
            <div class="flex items-center justify-between mb-4">
                <h4 class="text-lg font-semibold text-white flex items-center">
                    <i class="fas fa-video text-pink-400 mr-2"></i>
                    Video Delivery System
                </h4>
                <label class="flex items-center space-x-2">
                    <input type="checkbox" id="videoSystemEnabled" ${data.enabled ? 'checked' : ''}
                           onchange="toggleVideoSystem('${domainId}')"
                           class="rounded">
                    <span class="text-sm text-gray-300">Enable Video System</span>
                </label>
            </div>
            
            <div id="videoSystemContent" class="${data.enabled ? '' : 'opacity-50 pointer-events-none'}">
                <!-- Video Statistics -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div class="bg-gray-600 p-4 rounded-lg border-l-4 border-pink-500">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-gray-300 text-sm">Total Videos</p>
                                <p class="text-2xl font-bold text-pink-400">${data.totalVideos || 0}</p>
                            </div>
                            <i class="fas fa-video text-pink-400 text-2xl"></i>
                        </div>
                    </div>
                    
                    <div class="bg-gray-600 p-4 rounded-lg border-l-4 border-blue-500">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-gray-300 text-sm">Total Views</p>
                                <p class="text-2xl font-bold text-blue-400">${data.totalViews || 0}</p>
                            </div>
                            <i class="fas fa-eye text-blue-400 text-2xl"></i>
                        </div>
                    </div>
                    
                    <div class="bg-gray-600 p-4 rounded-lg border-l-4 border-green-500">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-gray-300 text-sm">Unique Views</p>
                                <p class="text-2xl font-bold text-green-400">${data.uniqueViews || 0}</p>
                            </div>
                            <i class="fas fa-users text-green-400 text-2xl"></i>
                        </div>
                    </div>
                    
                    <div class="bg-gray-600 p-4 rounded-lg border-l-4 border-orange-500">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-gray-300 text-sm">Avg Engagement</p>
                                <p class="text-2xl font-bold text-orange-400">${(data.averageEngagement || 0).toFixed(1)}%</p>
                            </div>
                            <i class="fas fa-chart-line text-orange-400 text-2xl"></i>
                        </div>
                    </div>
                </div>
                
                <!-- Add Video Form -->
                <div class="bg-gray-600 p-4 rounded-lg mb-6">
                    <h5 class="font-semibold text-pink-300 mb-3 flex items-center">
                        <i class="fas fa-plus mr-2"></i>
                        Add New Video
                    </h5>
                    <form id="addVideoForm" class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-2">Video ID *</label>
                            <input type="text" id="videoId" required
                                   class="w-full px-3 py-2 bg-gray-700 border border-gray-500 rounded-lg text-white"
                                   placeholder="video-001">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-2">Title *</label>
                            <input type="text" id="videoTitle" required
                                   class="w-full px-3 py-2 bg-gray-700 border border-gray-500 rounded-lg text-white"
                                   placeholder="Video Title">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-2">Video URL *</label>
                            <input type="url" id="videoUrl" required
                                   class="w-full px-3 py-2 bg-gray-700 border border-gray-500 rounded-lg text-white"
                                   placeholder="https://example.com/video.mp4">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-2">Thumbnail URL</label>
                            <input type="url" id="videoThumbnail"
                                   class="w-full px-3 py-2 bg-gray-700 border border-gray-500 rounded-lg text-white"
                                   placeholder="https://example.com/thumb.jpg">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-2">Duration (seconds)</label>
                            <input type="number" id="videoDuration" min="0"
                                   class="w-full px-3 py-2 bg-gray-700 border border-gray-500 rounded-lg text-white"
                                   placeholder="120">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-2">Quality</label>
                            <select id="videoQuality"
                                    class="w-full px-3 py-2 bg-gray-700 border border-gray-500 rounded-lg text-white">
                                <option value="720p">720p HD</option>
                                <option value="1080p">1080p Full HD</option>
                                <option value="480p">480p SD</option>
                                <option value="360p">360p</option>
                            </select>
                        </div>
                        <div class="md:col-span-3">
                            <label class="block text-sm font-medium text-gray-300 mb-2">Description</label>
                            <textarea id="videoDescription" rows="3"
                                      class="w-full px-3 py-2 bg-gray-700 border border-gray-500 rounded-lg text-white"
                                      placeholder="Video description"></textarea>
                        </div>
                        <div class="md:col-span-3">
                            <button type="submit" class="bg-pink-600 hover:bg-pink-700 px-4 py-2 rounded-lg font-medium">
                                <i class="fas fa-plus mr-2"></i>Add Video
                            </button>
                        </div>
                    </form>
                </div>
                
                <!-- Video List -->
                <div class="bg-gray-600 p-4 rounded-lg">
                    <h5 class="font-semibold text-blue-300 mb-3 flex items-center">
                        <i class="fas fa-list mr-2"></i>
                        Video Library (${(data.topVideos || []).length} videos)
                    </h5>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        ${(data.topVideos || []).map(video => `
                            <div class="bg-gray-700 p-4 rounded-lg">
                                <div class="aspect-video bg-gray-800 rounded mb-3 flex items-center justify-center">
                                    <i class="fas fa-play-circle text-4xl text-pink-400"></i>
                                </div>
                                <h6 class="font-semibold text-white mb-2">${video.title}</h6>
                                <div class="text-sm text-gray-400 space-y-1">
                                    <div><i class="fas fa-eye mr-1"></i> ${video.views} views</div>
                                    <div><i class="fas fa-users mr-1"></i> ${video.uniqueViews} unique</div>
                                    <div><i class="fas fa-chart-line mr-1"></i> ${(video.engagementRate || 0).toFixed(1)}% engagement</div>
                                </div>
                                <div class="flex space-x-2 mt-3">
                                    <button onclick="previewVideo('${domainId}', '${video.id}')" 
                                            class="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-xs">
                                        <i class="fas fa-play mr-1"></i>Preview
                                    </button>
                                    <button onclick="getVideoAccessUrl('${domainId}', '${video.id}')" 
                                            class="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-xs">
                                        <i class="fas fa-link mr-1"></i>Get URL
                                    </button>
                                    <button onclick="removeVideo('${domainId}', '${video.id}')" 
                                            class="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-xs">
                                        <i class="fas fa-trash mr-1"></i>Delete
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                        ${(data.topVideos || []).length === 0 ? '<div class="col-span-full text-center text-gray-400 py-8">No videos uploaded yet</div>' : ''}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Setup form submission
    document.getElementById('addVideoForm').addEventListener('submit', (e) => {
        e.preventDefault();
        addVideo(domainId);
    });
}

// Render video analytics
function renderVideoAnalytics(domainId, data) {
    const container = document.getElementById('video-tab-analytics');
    if (!container) return;
    
    container.innerHTML = `
        <div class="space-y-6">
            <!-- View Statistics -->
            <div class="bg-gray-700 p-6 rounded-lg">
                <h4 class="text-lg font-semibold text-white mb-4 flex items-center">
                    <i class="fas fa-chart-bar text-blue-400 mr-2"></i>
                    View Analytics
                </h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="bg-gray-600 p-4 rounded-lg">
                        <h5 class="font-semibold text-green-300 mb-3">Views by Country</h5>
                        <div class="space-y-2 max-h-48 overflow-y-auto">
                            ${Object.entries(data.viewsByCountry || {})
                                .sort(([,a], [,b]) => b - a)
                                .slice(0, 10)
                                .map(([country, views]) => `
                                    <div class="flex items-center justify-between bg-gray-700 p-2 rounded">
                                        <span class="text-sm">${country}</span>
                                        <span class="text-green-400 font-bold">${views}</span>
                                    </div>
                                `).join('')}
                            ${Object.keys(data.viewsByCountry || {}).length === 0 ? '<p class="text-gray-400 text-sm">No views yet</p>' : ''}
                        </div>
                    </div>
                    
                    <div class="bg-gray-600 p-4 rounded-lg">
                        <h5 class="font-semibold text-purple-300 mb-3">Top Performing Videos</h5>
                        <div class="space-y-2 max-h-48 overflow-y-auto">
                            ${(data.topVideos || []).slice(0, 5).map((video, index) => `
                                <div class="flex items-center justify-between bg-gray-700 p-2 rounded">
                                    <div>
                                        <span class="text-sm font-medium">#${index + 1} ${video.title}</span>
                                        <p class="text-xs text-gray-400">${(video.engagementRate || 0).toFixed(1)}% engagement</p>
                                    </div>
                                    <div class="text-right">
                                        <div class="text-purple-400 font-bold">${video.views}</div>
                                        <div class="text-xs text-gray-400">${video.uniqueViews} unique</div>
                                    </div>
                                </div>
                            `).join('')}
                            ${(data.topVideos || []).length === 0 ? '<p class="text-gray-400 text-sm">No videos yet</p>' : ''}
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Recent Views -->
            <div class="bg-gray-700 p-6 rounded-lg">
                <h4 class="text-lg font-semibold text-white mb-4 flex items-center">
                    <i class="fas fa-history text-yellow-400 mr-2"></i>
                    Recent Video Views
                </h4>
                <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead>
                            <tr class="text-gray-400 border-b border-gray-500">
                                <th class="text-left py-2">Time</th>
                                <th class="text-left py-2">Video</th>
                                <th class="text-left py-2">Country</th>
                                <th class="text-left py-2">Watch Time</th>
                                <th class="text-left py-2">IP</th>
                                <th class="text-left py-2">Unique</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${(data.recentViews || []).slice(0, 20).map(view => `
                                <tr class="border-b border-gray-700">
                                    <td class="py-2">${new Date(view.timestamp).toLocaleString()}</td>
                                    <td class="py-2">${view.videoId}</td>
                                    <td class="py-2">${view.country}</td>
                                    <td class="py-2">${view.watchTime ? Math.round(view.watchTime/1000) + 's' : 'N/A'}</td>
                                    <td class="py-2 font-mono">${view.ip}</td>
                                    <td class="py-2">
                                        ${view.isUniqueView ? 
                                            '<span class="bg-green-600 text-xs px-2 py-1 rounded">Yes</span>' : 
                                            '<span class="bg-gray-600 text-xs px-2 py-1 rounded">No</span>'
                                        }
                                    </td>
                                </tr>
                            `).join('')}
                            ${(data.recentViews || []).length === 0 ? '<tr><td colspan="6" class="py-4 text-center text-gray-400">No recent views</td></tr>' : ''}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

// Render video settings
function renderVideoSettings(domainId, data) {
    const container = document.getElementById('video-tab-settings');
    if (!container) return;
    
    container.innerHTML = `
        <div class="bg-gray-700 p-6 rounded-lg">
            <h4 class="text-lg font-semibold text-white mb-4 flex items-center">
                <i class="fas fa-cog text-gray-400 mr-2"></i>
                Video System Settings
            </h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Storage Settings -->
                <div class="bg-gray-600 p-4 rounded-lg">
                    <h5 class="font-semibold text-blue-300 mb-3">Storage Configuration</h5>
                    <div class="space-y-3">
                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-2">Storage Type</label>
                            <select id="storageType" onchange="updateVideoSettings('${domainId}')"
                                    class="w-full px-3 py-2 bg-gray-700 border border-gray-500 rounded text-white">
                                <option value="local" ${data.settings?.storage?.type === 'local' ? 'selected' : ''}>Local Storage</option>
                                <option value="external" ${data.settings?.storage?.type === 'external' ? 'selected' : ''}>External URLs</option>
                                <option value="cdn" ${data.settings?.storage?.type === 'cdn' ? 'selected' : ''}>CDN</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-2">Base Path</label>
                            <input type="text" id="basePath" value="${data.settings?.storage?.basePath || '/videos/'}"
                                   onchange="updateVideoSettings('${domainId}')"
                                   class="w-full px-3 py-2 bg-gray-700 border border-gray-500 rounded text-white">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-2">CDN URL</label>
                            <input type="url" id="cdnUrl" value="${data.settings?.storage?.cdnUrl || ''}"
                                   onchange="updateVideoSettings('${domainId}')"
                                   class="w-full px-3 py-2 bg-gray-700 border border-gray-500 rounded text-white"
                                   placeholder="https://cdn.example.com">
                        </div>
                    </div>
                </div>
                
                <!-- View Tracking Settings -->
                <div class="bg-gray-600 p-4 rounded-lg">
                    <h5 class="font-semibold text-purple-300 mb-3">View Tracking</h5>
                    <div class="space-y-3">
                        <label class="flex items-center space-x-2">
                            <input type="checkbox" id="preventMultipleViews" 
                                   ${data.settings?.viewTracking?.preventMultipleViews ? 'checked' : ''}
                                   onchange="updateVideoSettings('${domainId}')" class="rounded">
                            <span class="text-sm">Prevent Multiple Views</span>
                        </label>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-2">Tracking Window (hours)</label>
                            <input type="number" id="trackingWindow" min="1" max="168"
                                   value="${(data.settings?.viewTracking?.trackingWindow || 86400) / 3600}"
                                   onchange="updateVideoSettings('${domainId}')"
                                   class="w-full px-3 py-2 bg-gray-700 border border-gray-500 rounded text-white">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-2">Tracking Methods</label>
                            <div class="space-y-2">
                                ${['localStorage', 'sessionStorage', 'cookies', 'fingerprint'].map(method => `
                                    <label class="flex items-center space-x-2">
                                        <input type="checkbox" value="${method}" class="tracking-method rounded"
                                               ${(data.settings?.viewTracking?.methods || []).includes(method) ? 'checked' : ''}
                                               onchange="updateVideoSettings('${domainId}')">
                                        <span class="text-sm capitalize">${method}</span>
                                    </label>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Close video management modal
function closeVideoManagementModal() {
    const modal = document.getElementById('videoManagementModal');
    if (modal) {
        modal.remove();
    }
}

// Toggle video system
async function toggleVideoSystem(domainId) {
    const enabled = document.getElementById('videoSystemEnabled').checked;
    
    try {
        const response = await fetch(`/api/domains/${domainId}/videos/settings`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ enabled })
        });
        
        const data = await response.json();
        if (data.success) {
            const content = document.getElementById('videoSystemContent');
            if (enabled) {
                content.classList.remove('opacity-50', 'pointer-events-none');
                showNotification('Video system enabled', 'success');
            } else {
                content.classList.add('opacity-50', 'pointer-events-none');
                showNotification('Video system disabled', 'success');
            }
        } else {
            showNotification('Error: ' + data.message, 'error');
        }
    } catch (error) {
        showNotification('Error: ' + error.message, 'error');
    }
}

// Add video
async function addVideo(domainId) {
    const videoData = {
        id: document.getElementById('videoId').value.trim(),
        title: document.getElementById('videoTitle').value.trim(),
        url: document.getElementById('videoUrl').value.trim(),
        thumbnailUrl: document.getElementById('videoThumbnail').value.trim(),
        duration: parseInt(document.getElementById('videoDuration').value) || 0,
        quality: document.getElementById('videoQuality').value,
        description: document.getElementById('videoDescription').value.trim()
    };
    
    if (!videoData.id || !videoData.title || !videoData.url) {
        showNotification('Please fill in required fields', 'error');
        return;
    }
    
    try {
        const response = await fetch(`/api/domains/${domainId}/videos/add`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(videoData)
        });
        
        const data = await response.json();
        if (data.success) {
            showNotification('Video added successfully', 'success');
            // Reload video management
            closeVideoManagementModal();
            setTimeout(() => showDomainVideoManagement(domainId), 500);
        } else {
            showNotification('Error: ' + data.message, 'error');
        }
    } catch (error) {
        showNotification('Error: ' + error.message, 'error');
    }
}

// Update video settings
async function updateVideoSettings(domainId) {
    const settings = {
        storage: {
            type: document.getElementById('storageType').value,
            basePath: document.getElementById('basePath').value,
            cdnUrl: document.getElementById('cdnUrl').value
        },
        viewTracking: {
            preventMultipleViews: document.getElementById('preventMultipleViews').checked,
            trackingWindow: parseInt(document.getElementById('trackingWindow').value) * 3600,
            methods: Array.from(document.querySelectorAll('.tracking-method:checked')).map(cb => cb.value)
        }
    };
    
    try {
        const response = await fetch(`/api/domains/${domainId}/videos/settings`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(settings)
        });
        
        const data = await response.json();
        if (data.success) {
            showNotification('Settings updated', 'success');
        } else {
            showNotification('Error: ' + data.message, 'error');
        }
    } catch (error) {
        showNotification('Error: ' + error.message, 'error');
    }
}

// Preview video (placeholder)
function previewVideo(domainId, videoId) {
    showNotification('Video preview feature will be implemented', 'info');
}

// Get video access URL
async function getVideoAccessUrl(domainId, videoId) {
    try {
        const response = await fetch(`/api/domains/${domainId}/videos/${videoId}/access`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ip: '127.0.0.1',
                country: 'US',
                userAgent: navigator.userAgent,
                sessionId: Date.now().toString()
            })
        });
        
        const data = await response.json();
        if (data.success) {
            // Show access URL in modal
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
            modal.innerHTML = `
                <div class="bg-gray-800 p-6 rounded-lg w-96">
                    <h3 class="text-lg font-bold text-white mb-4">Video Access URL</h3>
                    <div class="mb-4">
                        <label class="block text-sm text-gray-300 mb-2">Secure Access Token:</label>
                        <input type="text" value="/api/video/${data.accessToken}" readonly
                               class="w-full px-3 py-2 bg-gray-700 border border-gray-500 rounded text-white"
                               onclick="this.select()">
                    </div>
                    <div class="flex space-x-4">
                        <button onclick="navigator.clipboard.writeText('/api/video/${data.accessToken}'); showNotification('Copied to clipboard', 'success')"
                                class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded">
                            <i class="fas fa-copy mr-2"></i>Copy
                        </button>
                        <button onclick="this.parentElement.parentElement.parentElement.remove()"
                                class="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded">
                            Close
                        </button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        } else {
            showNotification('Error: ' + data.message, 'error');
        }
    } catch (error) {
        showNotification('Error: ' + error.message, 'error');
    }
}

// Remove video
async function removeVideo(domainId, videoId) {
    if (!confirm('Are you sure you want to delete this video?')) return;
    
    try {
        const response = await fetch(`/api/domains/${domainId}/videos/${videoId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });
        
        const data = await response.json();
        if (data.success) {
            showNotification('Video removed successfully', 'success');
            // Reload video management
            closeVideoManagementModal();
            setTimeout(() => showDomainVideoManagement(domainId), 500);
        } else {
            showNotification('Error: ' + data.message, 'error');
        }
    } catch (error) {
        showNotification('Error: ' + error.message, 'error');
    }
}

// =============================================================================
// PHASE 5: ADVANCED SECURITY RULES FUNCTIONS
// =============================================================================

// Show domain security management modal
async function showDomainSecurityManagement(domainId) {
    try {
        // Load security system data
        const securityResponse = await fetch(`/api/domains/${domainId}/security`, {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        
        const securityData = await securityResponse.json();
        
        if (!securityData.success) {
            showNotification('Error loading security data', 'error');
            return;
        }
        
        // Create modal
        const modal = document.createElement('div');
        modal.id = 'securityManagementModal';
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        
        modal.innerHTML = `
            <div class="bg-gray-800 p-6 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-auto">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-xl font-bold text-white flex items-center">
                        <i class="fas fa-shield-alt text-red-400 mr-2"></i>
                        Advanced Security Rules
                    </h3>
                    <button onclick="closeSecurityManagementModal()" class="text-gray-400 hover:text-white">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
                
                <!-- Tab Navigation -->
                <div class="flex space-x-4 mb-6 border-b border-gray-600">
                    <button id="security-rules-tab-btn" onclick="switchSecurityTab('rules')" 
                            class="px-4 py-2 text-sm font-medium border-b-2 border-red-500 text-red-400">
                        <i class="fas fa-gavel mr-2"></i>Security Rules
                    </button>
                    <button id="security-honeypots-tab-btn" onclick="switchSecurityTab('honeypots')" 
                            class="px-4 py-2 text-sm font-medium border-b-2 border-transparent text-gray-400 hover:text-white">
                        <i class="fas fa-bug mr-2"></i>Honeypots
                    </button>
                    <button id="security-behavior-tab-btn" onclick="switchSecurityTab('behavior')" 
                            class="px-4 py-2 text-sm font-medium border-b-2 border-transparent text-gray-400 hover:text-white">
                        <i class="fas fa-brain mr-2"></i>Behavior Analysis
                    </button>
                    <button id="security-events-tab-btn" onclick="switchSecurityTab('events')" 
                            class="px-4 py-2 text-sm font-medium border-b-2 border-transparent text-gray-400 hover:text-white">
                        <i class="fas fa-list-alt mr-2"></i>Security Events
                    </button>
                </div>
                
                <!-- Tab Content -->
                <div id="security-tab-rules" class="tab-content">
                    <!-- Security Rules Content -->
                </div>
                
                <div id="security-tab-honeypots" class="tab-content hidden">
                    <!-- Honeypots Content -->
                </div>
                
                <div id="security-tab-behavior" class="tab-content hidden">
                    <!-- Behavior Analysis Content -->
                </div>
                
                <div id="security-tab-events" class="tab-content hidden">
                    <!-- Security Events Content -->
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Load tab content
        renderSecurityRules(domainId, securityData);
        renderHoneypots(domainId, securityData);
        renderBehaviorAnalysis(domainId, securityData);
        renderSecurityEvents(domainId, securityData);
        
    } catch (error) {
        showNotification('Error loading security management: ' + error.message, 'error');
    }
}

// Switch between security tabs
function switchSecurityTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('#securityManagementModal .tab-content').forEach(tab => {
        tab.classList.add('hidden');
    });
    
    // Remove active state from all buttons
    document.querySelectorAll('#securityManagementModal [id$="-tab-btn"]').forEach(btn => {
        btn.classList.remove('border-red-500', 'text-red-400');
        btn.classList.add('border-transparent', 'text-gray-400');
    });
    
    // Show selected tab
    document.getElementById(`security-tab-${tabName}`).classList.remove('hidden');
    
    // Add active state to selected button
    const activeBtn = document.getElementById(`security-${tabName}-tab-btn`);
    if (activeBtn) {
        activeBtn.classList.add('border-red-500', 'text-red-400');
        activeBtn.classList.remove('border-transparent', 'text-gray-400');
    }
}

// Render security rules
function renderSecurityRules(domainId, data) {
    const container = document.getElementById('security-tab-rules');
    if (!container) return;
    
    console.log('Security rules data:', data);
    
    container.innerHTML = `
        <!-- Security System Controls -->
        <div class="bg-gray-700 p-6 rounded-lg mb-6">
            <div class="flex items-center justify-between mb-4">
                <h4 class="text-lg font-semibold text-white flex items-center">
                    <i class="fas fa-shield-alt text-red-400 mr-2"></i>
                    Advanced Security System
                </h4>
                <label class="flex items-center space-x-2">
                    <input type="checkbox" id="securitySystemEnabled" ${data.enabled ? 'checked' : ''}
                           onchange="toggleSecuritySystem('${domainId}')"
                           class="rounded">
                    <span class="text-sm text-gray-300">Enable Security Rules</span>
                </label>
            </div>
            
            <div id="securitySystemContent" class="${data.enabled ? '' : 'opacity-50 pointer-events-none'}">
                <!-- Security Statistics -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div class="bg-gray-600 p-4 rounded-lg border-l-4 border-red-500">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-gray-300 text-sm">Active Rules</p>
                                <p class="text-2xl font-bold text-red-400">${data.activeRules || 0}</p>
                            </div>
                            <i class="fas fa-gavel text-red-400 text-2xl"></i>
                        </div>
                    </div>
                    
                    <div class="bg-gray-600 p-4 rounded-lg border-l-4 border-orange-500">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-gray-300 text-sm">Events (24h)</p>
                                <p class="text-2xl font-bold text-orange-400">${data.eventsLast24h || 0}</p>
                            </div>
                            <i class="fas fa-exclamation-triangle text-orange-400 text-2xl"></i>
                        </div>
                    </div>
                    
                    <div class="bg-gray-600 p-4 rounded-lg border-l-4 border-yellow-500">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-gray-300 text-sm">Total Triggered</p>
                                <p class="text-2xl font-bold text-yellow-400">${data.totalTriggered || 0}</p>
                            </div>
                            <i class="fas fa-bell text-yellow-400 text-2xl"></i>
                        </div>
                    </div>
                    
                    <div class="bg-gray-600 p-4 rounded-lg border-l-4 border-purple-500">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-gray-300 text-sm">Honeypot Hits</p>
                                <p class="text-2xl font-bold text-purple-400">${data.totalHoneypotHits || 0}</p>
                            </div>
                            <i class="fas fa-bug text-purple-400 text-2xl"></i>
                        </div>
                    </div>
                </div>
                
                <!-- Add Security Rule Form -->
                <div class="bg-gray-600 p-4 rounded-lg mb-6">
                    <h5 class="font-semibold text-red-300 mb-3 flex items-center">
                        <i class="fas fa-plus mr-2"></i>
                        Create Security Rule
                    </h5>
                    <form id="addSecurityRuleForm" class="space-y-4">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-300 mb-2">Rule Name *</label>
                                <input type="text" id="ruleName" required
                                       class="w-full px-3 py-2 bg-gray-700 border border-gray-500 rounded-lg text-white"
                                       placeholder="Block Suspicious User Agents">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-300 mb-2">Priority (1-10)</label>
                                <input type="number" id="rulePriority" min="1" max="10" value="5"
                                       class="w-full px-3 py-2 bg-gray-700 border border-gray-500 rounded-lg text-white">
                            </div>
                        </div>
                        
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-300 mb-2">Field *</label>
                                <select id="ruleField" required
                                        class="w-full px-3 py-2 bg-gray-700 border border-gray-500 rounded-lg text-white">
                                    <option value="">Select field...</option>
                                    <option value="ip">IP Address</option>
                                    <option value="user_agent">User Agent</option>
                                    <option value="country">Country</option>
                                    <option value="referrer">Referrer</option>
                                    <option value="request_count">Request Count</option>
                                    <option value="browser">Browser</option>
                                    <option value="device">Device</option>
                                    <option value="os">Operating System</option>
                                    <option value="hour">Hour of Day</option>
                                    <option value="day_of_week">Day of Week</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-300 mb-2">Operator *</label>
                                <select id="ruleOperator" required
                                        class="w-full px-3 py-2 bg-gray-700 border border-gray-500 rounded-lg text-white">
                                    <option value="">Select operator...</option>
                                    <option value="equals">Equals</option>
                                    <option value="not_equals">Not Equals</option>
                                    <option value="contains">Contains</option>
                                    <option value="not_contains">Not Contains</option>
                                    <option value="starts_with">Starts With</option>
                                    <option value="ends_with">Ends With</option>
                                    <option value="matches_regex">Matches Regex</option>
                                    <option value="greater_than">Greater Than</option>
                                    <option value="less_than">Less Than</option>
                                    <option value="in_list">In List</option>
                                    <option value="not_in_list">Not In List</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-300 mb-2">Value *</label>
                                <input type="text" id="ruleValue" required
                                       class="w-full px-3 py-2 bg-gray-700 border border-gray-500 rounded-lg text-white"
                                       placeholder="bot|crawler|scraper">
                            </div>
                        </div>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-300 mb-2">Action *</label>
                                <select id="ruleAction" required
                                        class="w-full px-3 py-2 bg-gray-700 border border-gray-500 rounded-lg text-white">
                                    <option value="">Select action...</option>
                                    <option value="block">Block Access</option>
                                    <option value="log">Log Only</option>
                                    <option value="throttle">Throttle Requests</option>
                                    <option value="captcha">Show CAPTCHA</option>
                                    <option value="redirect">Redirect</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-300 mb-2">Action Parameters</label>
                                <input type="text" id="ruleActionParams"
                                       class="w-full px-3 py-2 bg-gray-700 border border-gray-500 rounded-lg text-white"
                                       placeholder='{"delay": 5000} or {"url": "https://example.com"}'>
                            </div>
                        </div>
                        
                        <div>
                            <button type="submit" class="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-medium">
                                <i class="fas fa-plus mr-2"></i>Add Security Rule
                            </button>
                        </div>
                    </form>
                </div>
                
                <!-- Security Rules List -->
                <div class="bg-gray-600 p-4 rounded-lg">
                    <h5 class="font-semibold text-blue-300 mb-3 flex items-center">
                        <i class="fas fa-list mr-2"></i>
                        Active Security Rules (${data.activeRules || 0})
                    </h5>
                    <div class="overflow-x-auto">
                        <table class="w-full text-sm">
                            <thead>
                                <tr class="text-gray-400 border-b border-gray-500">
                                    <th class="text-left py-2">Rule Name</th>
                                    <th class="text-left py-2">Condition</th>
                                    <th class="text-left py-2">Action</th>
                                    <th class="text-left py-2">Priority</th>
                                    <th class="text-left py-2">Triggered</th>
                                    <th class="text-left py-2">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${(data.topTriggeredRules || []).map(rule => `
                                    <tr class="border-b border-gray-700">
                                        <td class="py-2 font-medium">${rule.name}</td>
                                        <td class="py-2 text-sm">${rule.condition?.field} ${rule.condition?.operator} ${rule.condition?.value}</td>
                                        <td class="py-2">
                                            <span class="bg-red-600 text-xs px-2 py-1 rounded">${rule.action?.type}</span>
                                        </td>
                                        <td class="py-2">${rule.priority}</td>
                                        <td class="py-2 text-yellow-400">${rule.triggered || 0}</td>
                                        <td class="py-2">
                                            <div class="flex space-x-2">
                                                <button onclick="editSecurityRule('${domainId}', '${rule.id}')" 
                                                        class="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs">
                                                    <i class="fas fa-edit"></i>
                                                </button>
                                                <button onclick="deleteSecurityRule('${domainId}', '${rule.id}')" 
                                                        class="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs">
                                                    <i class="fas fa-trash"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                `).join('')}
                                ${(data.topTriggeredRules || []).length === 0 ? '<tr><td colspan="6" class="py-4 text-center text-gray-400">No security rules created yet</td></tr>' : ''}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Setup form submission
    document.getElementById('addSecurityRuleForm').addEventListener('submit', (e) => {
        e.preventDefault();
        addSecurityRule(domainId);
    });
}

// Render honeypots
function renderHoneypots(domainId, data) {
    const container = document.getElementById('security-tab-honeypots');
    if (!container) return;
    
    container.innerHTML = `
        <div class="bg-gray-700 p-6 rounded-lg">
            <h4 class="text-lg font-semibold text-white mb-4 flex items-center">
                <i class="fas fa-bug text-purple-400 mr-2"></i>
                Honeypot Trap System
            </h4>
            <div class="text-center text-gray-400">
                <i class="fas fa-bug text-6xl mb-4"></i>
                <p class="text-lg mb-2">Honeypot System</p>
                <p>Advanced honeypot functionality will be implemented here.</p>
            </div>
        </div>
    `;
}

// Render behavior analysis
function renderBehaviorAnalysis(domainId, data) {
    const container = document.getElementById('security-tab-behavior');
    if (!container) return;
    
    container.innerHTML = `
        <div class="bg-gray-700 p-6 rounded-lg mb-6">
            <div class="flex items-center justify-between mb-4">
                <h4 class="text-lg font-semibold text-white flex items-center">
                    <i class="fas fa-brain text-green-400 mr-2"></i>
                    Behavioral Analysis Engine
                </h4>
                <label class="flex items-center space-x-2">
                    <input type="checkbox" id="behaviorAnalysisEnabled" ${data.behaviorAnalysisEnabled ? 'checked' : ''}
                           onchange="toggleBehaviorAnalysis('${domainId}')"
                           class="rounded">
                    <span class="text-sm text-gray-300">Enable Behavior Analysis</span>
                </label>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div class="bg-gray-600 p-4 rounded-lg border-l-4 border-green-500">
                    <h5 class="font-semibold text-green-300 mb-2">Risk Levels</h5>
                    <div class="space-y-2 text-sm">
                        <div class="flex justify-between">
                            <span>Low Risk:</span>
                            <span class="text-green-400">${data.riskLevels?.low || 0}</span>
                        </div>
                        <div class="flex justify-between">
                            <span>Medium Risk:</span>
                            <span class="text-yellow-400">${data.riskLevels?.medium || 0}</span>
                        </div>
                        <div class="flex justify-between">
                            <span>High Risk:</span>
                            <span class="text-red-400">${data.riskLevels?.high || 0}</span>
                        </div>
                    </div>
                </div>
                
                <div class="bg-gray-600 p-4 rounded-lg border-l-4 border-blue-500">
                    <h5 class="font-semibold text-blue-300 mb-2">Detection Patterns</h5>
                    <div class="text-sm text-gray-300">
                        <p>• High request frequency</p>
                        <p>• Suspicious user agents</p>
                        <p>• Sequential access patterns</p>
                        <p>• Multiple session IDs</p>
                        <p>• Missing referrer patterns</p>
                    </div>
                </div>
                
                <div class="bg-gray-600 p-4 rounded-lg border-l-4 border-yellow-500">
                    <h5 class="font-semibold text-yellow-300 mb-2">Event Types</h5>
                    <div class="space-y-2 text-sm">
                        ${Object.entries(data.eventTypes || {}).map(([type, count]) => `
                            <div class="flex justify-between">
                                <span class="capitalize">${type.replace('_', ' ')}:</span>
                                <span class="text-yellow-400">${count}</span>
                            </div>
                        `).join('')}
                        ${Object.keys(data.eventTypes || {}).length === 0 ? '<p class="text-gray-400">No events yet</p>' : ''}
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Render security events
function renderSecurityEvents(domainId, data) {
    const container = document.getElementById('security-tab-events');
    if (!container) return;
    
    container.innerHTML = `
        <div class="bg-gray-700 p-6 rounded-lg">
            <h4 class="text-lg font-semibold text-white mb-4 flex items-center">
                <i class="fas fa-list-alt text-orange-400 mr-2"></i>
                Recent Security Events
            </h4>
            <div class="overflow-x-auto">
                <table class="w-full text-sm">
                    <thead>
                        <tr class="text-gray-400 border-b border-gray-500">
                            <th class="text-left py-2">Time</th>
                            <th class="text-left py-2">Type</th>
                            <th class="text-left py-2">IP Address</th>
                            <th class="text-left py-2">Details</th>
                            <th class="text-left py-2">Risk</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${(data.recentEvents || []).slice(0, 20).map(event => `
                            <tr class="border-b border-gray-700">
                                <td class="py-2">${new Date(event.timestamp).toLocaleString()}</td>
                                <td class="py-2">
                                    <span class="bg-orange-600 text-xs px-2 py-1 rounded">${event.type}</span>
                                </td>
                                <td class="py-2 font-mono">${event.visitorData?.ip || 'N/A'}</td>
                                <td class="py-2 text-xs">
                                    ${event.behaviorScore ? `Score: ${event.behaviorScore}` : ''}
                                    ${event.triggeredRules ? `Rules: ${event.triggeredRules.length}` : ''}
                                </td>
                                <td class="py-2">
                                    ${event.riskLevel ? 
                                        `<span class="bg-${event.riskLevel === 'high' ? 'red' : event.riskLevel === 'medium' ? 'yellow' : 'green'}-600 text-xs px-2 py-1 rounded">${event.riskLevel}</span>` 
                                        : '<span class="text-gray-400">N/A</span>'
                                    }
                                </td>
                            </tr>
                        `).join('')}
                        ${(data.recentEvents || []).length === 0 ? '<tr><td colspan="5" class="py-4 text-center text-gray-400">No security events yet</td></tr>' : ''}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// Close security management modal
function closeSecurityManagementModal() {
    const modal = document.getElementById('securityManagementModal');
    if (modal) {
        modal.remove();
    }
}

// Toggle security system
async function toggleSecuritySystem(domainId) {
    const enabled = document.getElementById('securitySystemEnabled').checked;
    
    try {
        const response = await fetch(`/api/domains/${domainId}/security/settings`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ enabled })
        });
        
        const data = await response.json();
        if (data.success) {
            const content = document.getElementById('securitySystemContent');
            if (enabled) {
                content.classList.remove('opacity-50', 'pointer-events-none');
                showNotification('Security system enabled', 'success');
            } else {
                content.classList.add('opacity-50', 'pointer-events-none');
                showNotification('Security system disabled', 'success');
            }
        } else {
            showNotification('Error: ' + data.message, 'error');
        }
    } catch (error) {
        showNotification('Error: ' + error.message, 'error');
    }
}

// Toggle behavior analysis
async function toggleBehaviorAnalysis(domainId) {
    const enabled = document.getElementById('behaviorAnalysisEnabled').checked;
    
    try {
        const response = await fetch(`/api/domains/${domainId}/security/settings`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                behaviorAnalysis: { enabled }
            })
        });
        
        const data = await response.json();
        if (data.success) {
            showNotification(`Behavior analysis ${enabled ? 'enabled' : 'disabled'}`, 'success');
        } else {
            showNotification('Error: ' + data.message, 'error');
        }
    } catch (error) {
        showNotification('Error: ' + error.message, 'error');
    }
}

// Add security rule
async function addSecurityRule(domainId) {
    const ruleData = {
        name: document.getElementById('ruleName').value.trim(),
        priority: parseInt(document.getElementById('rulePriority').value) || 5,
        condition: {
            field: document.getElementById('ruleField').value,
            operator: document.getElementById('ruleOperator').value,
            value: document.getElementById('ruleValue').value.trim()
        },
        action: {
            type: document.getElementById('ruleAction').value,
            parameters: {}
        }
    };
    
    // Parse action parameters if provided
    const actionParams = document.getElementById('ruleActionParams').value.trim();
    if (actionParams) {
        try {
            ruleData.action.parameters = JSON.parse(actionParams);
        } catch (e) {
            showNotification('Invalid JSON in action parameters', 'error');
            return;
        }
    }
    
    if (!ruleData.name || !ruleData.condition.field || !ruleData.condition.operator || !ruleData.condition.value || !ruleData.action.type) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    try {
        const response = await fetch(`/api/domains/${domainId}/security/rules`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(ruleData)
        });
        
        const data = await response.json();
        if (data.success) {
            showNotification('Security rule added successfully', 'success');
            // Reload security management
            closeSecurityManagementModal();
            setTimeout(() => showDomainSecurityManagement(domainId), 500);
        } else {
            showNotification('Error: ' + data.message, 'error');
        }
    } catch (error) {
        showNotification('Error: ' + error.message, 'error');
    }
}

// Edit security rule (placeholder)
function editSecurityRule(domainId, ruleId) {
    showNotification('Edit security rule feature will be implemented', 'info');
}

// Delete security rule
async function deleteSecurityRule(domainId, ruleId) {
    if (!confirm('Are you sure you want to delete this security rule?')) return;
    
    try {
        const response = await fetch(`/api/domains/${domainId}/security/rules/${ruleId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });
        
        const data = await response.json();
        if (data.success) {
            showNotification('Security rule removed successfully', 'success');
            // Reload security management
            closeSecurityManagementModal();
            setTimeout(() => showDomainSecurityManagement(domainId), 500);
        } else {
            showNotification('Error: ' + data.message, 'error');
        }
    } catch (error) {
        showNotification('Error: ' + error.message, 'error');
    }
}

// =============================================================================
// PHASE 6: HOOK SYSTEM & INTEGRATIONS MANAGEMENT
// =============================================================================

// Show domain integrations management
function showDomainIntegrations(domainId) {
    console.log('Opening integrations management for domain:', domainId);
    
    const modal = document.getElementById('modal');
    modal.classList.remove('hidden');
    
    const modalContent = document.getElementById('modal-content');
    modalContent.innerHTML = `
        <div class="bg-gray-800 rounded-lg p-6 max-w-6xl w-full max-h-full overflow-auto">
            <div class="flex items-center justify-between mb-6">
                <h3 class="text-xl font-bold text-white">
                    <i class="fas fa-plug mr-2 text-purple-400"></i>
                    Hook System & Integrations
                </h3>
                <button onclick="closeModal()" class="text-gray-400 hover:text-white">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            
            <!-- Integration Tabs -->
            <div class="flex border-b border-gray-700 mb-6">
                <button onclick="showIntegrationTab('webhooks', '${domainId}')" 
                        class="integration-tab-btn px-4 py-2 text-sm font-medium border-b-2 border-transparent hover:border-purple-400 transition-colors active">
                    <i class="fas fa-webhook mr-2"></i>Webhooks
                </button>
                <button onclick="showIntegrationTab('scripts', '${domainId}')" 
                        class="integration-tab-btn px-4 py-2 text-sm font-medium border-b-2 border-transparent hover:border-purple-400 transition-colors">
                    <i class="fas fa-code mr-2"></i>Custom Scripts
                </button>
                <button onclick="showIntegrationTab('apis', '${domainId}')" 
                        class="integration-tab-btn px-4 py-2 text-sm font-medium border-b-2 border-transparent hover:border-purple-400 transition-colors">
                    <i class="fas fa-link mr-2"></i>API Connections
                </button>
                <button onclick="showIntegrationTab('events', '${domainId}')" 
                        class="integration-tab-btn px-4 py-2 text-sm font-medium border-b-2 border-transparent hover:border-purple-400 transition-colors">
                    <i class="fas fa-bolt mr-2"></i>Event Testing
                </button>
            </div>
            
            <!-- Tab Content Container -->
            <div id="integration-content">
                <!-- Content will be loaded here -->
            </div>
        </div>
    `;
    
    // Load initial tab content (webhooks)
    showIntegrationTab('webhooks', domainId);
}

// Show specific integration tab
function showIntegrationTab(tabType, domainId) {
    // Update active tab
    document.querySelectorAll('.integration-tab-btn').forEach(btn => {
        btn.classList.remove('active', 'border-purple-400', 'text-purple-400');
        btn.classList.add('text-gray-400');
    });
    
    // Find and activate the correct tab button
    const activeTabBtn = document.querySelector(`button[onclick*="showIntegrationTab('${tabType}'"]`);
    if (activeTabBtn) {
        activeTabBtn.classList.add('active', 'border-purple-400', 'text-purple-400');
        activeTabBtn.classList.remove('text-gray-400');
    }
    
    // Load tab content
    switch(tabType) {
        case 'webhooks':
            loadWebhooksTab(domainId);
            break;
        case 'scripts':
            loadCustomScriptsTab(domainId);
            break;
        case 'apis':
            loadApiConnectionsTab(domainId);
            break;
        case 'events':
            loadEventTestingTab(domainId);
            break;
    }
}

// Load webhooks tab content
async function loadWebhooksTab(domainId) {
    const content = document.getElementById('integration-content');
    content.innerHTML = `
        <div class="space-y-6">
            <!-- Webhook Overview -->
            <div class="bg-gray-700 rounded-lg p-4">
                <div class="flex items-center justify-between mb-4">
                    <h4 class="text-lg font-semibold text-white">
                        <i class="fas fa-webhook mr-2 text-purple-400"></i>
                        Webhooks
                    </h4>
                    <button onclick="showAddWebhookForm('${domainId}')" 
                            class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                        <i class="fas fa-plus mr-2"></i>Add Webhook
                    </button>
                </div>
                
                <div class="text-sm text-gray-300 mb-4">
                    Webhooks allow you to receive real-time notifications when events occur on your domain.
                </div>
                
                <!-- Webhook Statistics -->
                <div id="webhook-stats" class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <!-- Stats will be loaded here -->
                </div>
            </div>
            
            <!-- Webhooks List -->
            <div id="webhooks-list" class="space-y-4">
                <!-- Webhooks will be loaded here -->
            </div>
        </div>
    `;
    
    // Load webhooks data
    await loadWebhooksData(domainId);
}

// Load webhooks data
async function loadWebhooksData(domainId) {
    try {
        const response = await fetch(`/api/domains/${domainId}/integrations/webhooks`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        if (data.success) {
            renderWebhooksStats(data.webhooks);
            renderWebhooksList(data.webhooks, domainId);
        } else {
            showNotification('Error loading webhooks: ' + data.message, 'error');
        }
    } catch (error) {
        showNotification('Error: ' + error.message, 'error');
    }
}

// Render webhook statistics
function renderWebhooksStats(webhooks) {
    const totalWebhooks = webhooks.length;
    const enabledWebhooks = webhooks.filter(w => w.enabled).length;
    const totalCalls = webhooks.reduce((sum, w) => sum + (w.totalCalls || 0), 0);
    const successRate = totalCalls > 0 ? Math.round((webhooks.reduce((sum, w) => sum + (w.successfulCalls || 0), 0) / totalCalls) * 100) : 0;
    
    const statsContainer = document.getElementById('webhook-stats');
    statsContainer.innerHTML = `
        <div class="bg-gray-800 rounded-lg p-4 text-center">
            <div class="text-2xl font-bold text-white">${totalWebhooks}</div>
            <div class="text-sm text-gray-400">Total Webhooks</div>
        </div>
        <div class="bg-gray-800 rounded-lg p-4 text-center">
            <div class="text-2xl font-bold text-green-400">${enabledWebhooks}</div>
            <div class="text-sm text-gray-400">Active</div>
        </div>
        <div class="bg-gray-800 rounded-lg p-4 text-center">
            <div class="text-2xl font-bold text-blue-400">${totalCalls}</div>
            <div class="text-sm text-gray-400">Total Calls</div>
        </div>
        <div class="bg-gray-800 rounded-lg p-4 text-center">
            <div class="text-2xl font-bold text-purple-400">${successRate}%</div>
            <div class="text-sm text-gray-400">Success Rate</div>
        </div>
    `;
}

// Render webhooks list
function renderWebhooksList(webhooks, domainId) {
    const container = document.getElementById('webhooks-list');
    
    if (webhooks.length === 0) {
        container.innerHTML = `
            <div class="bg-gray-700 rounded-lg p-6 text-center">
                <i class="fas fa-webhook text-4xl text-gray-500 mb-4"></i>
                <h3 class="text-lg font-medium text-white mb-2">No Webhooks</h3>
                <p class="text-gray-400 mb-4">Set up webhooks to receive real-time notifications.</p>
                <button onclick="showAddWebhookForm('${domainId}')" 
                        class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium">
                    Add Your First Webhook
                </button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = webhooks.map(webhook => `
        <div class="bg-gray-700 rounded-lg p-4">
            <div class="flex items-center justify-between mb-3">
                <div class="flex items-center">
                    <div class="w-3 h-3 rounded-full ${webhook.enabled ? 'bg-green-400' : 'bg-gray-500'} mr-3"></div>
                    <h4 class="text-lg font-medium text-white">${webhook.name}</h4>
                </div>
                <div class="flex items-center space-x-2">
                    <button onclick="testWebhook('${domainId}', '${webhook.id}')" 
                            class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm">
                        <i class="fas fa-play mr-1"></i>Test
                    </button>
                    <button onclick="editWebhook('${domainId}', '${webhook.id}')" 
                            class="bg-gray-600 hover:bg-gray-500 text-white px-3 py-1 rounded text-sm">
                        <i class="fas fa-edit mr-1"></i>Edit
                    </button>
                    <button onclick="deleteWebhook('${domainId}', '${webhook.id}')" 
                            class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm">
                        <i class="fas fa-trash mr-1"></i>Delete
                    </button>
                </div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                    <div class="text-gray-400">URL:</div>
                    <div class="text-white font-mono">${webhook.url}</div>
                </div>
                <div>
                    <div class="text-gray-400">Events:</div>
                    <div class="text-white">${webhook.events.join(', ')}</div>
                </div>
                <div>
                    <div class="text-gray-400">Total Calls:</div>
                    <div class="text-white">${webhook.totalCalls || 0}</div>
                </div>
                <div>
                    <div class="text-gray-400">Success Rate:</div>
                    <div class="text-white">${webhook.totalCalls > 0 ? Math.round((webhook.successfulCalls || 0) / webhook.totalCalls * 100) : 0}%</div>
                </div>
            </div>
            
            ${webhook.lastCall ? `
                <div class="mt-3 pt-3 border-t border-gray-600">
                    <div class="text-xs text-gray-400">Last called: ${new Date(webhook.lastCall).toLocaleString()}</div>
                    ${webhook.lastError ? `<div class="text-xs text-red-400">Last error: ${webhook.lastError}</div>` : ''}
                </div>
            ` : ''}
        </div>
    `).join('');
}

// Show add webhook form
function showAddWebhookForm(domainId) {
    const modal = document.getElementById('modal');
    const modalContent = document.getElementById('modal-content');
    
    modalContent.innerHTML = `
        <div class="bg-gray-800 rounded-lg p-6 max-w-2xl w-full">
            <div class="flex items-center justify-between mb-6">
                <h3 class="text-xl font-bold text-white">
                    <i class="fas fa-plus mr-2 text-purple-400"></i>
                    Add Webhook
                </h3>
                <button onclick="showDomainIntegrations('${domainId}')" class="text-gray-400 hover:text-white">
                    <i class="fas fa-arrow-left text-xl"></i>
                </button>
            </div>
            
            <form onsubmit="addWebhook(event, '${domainId}')" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-300 mb-2">Webhook Name</label>
                    <input type="text" id="webhook-name" required
                           class="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-400 focus:outline-none"
                           placeholder="My Webhook">
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-300 mb-2">Webhook URL</label>
                    <input type="url" id="webhook-url" required
                           class="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-400 focus:outline-none"
                           placeholder="https://your-server.com/webhook">
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-300 mb-2">Events to Subscribe</label>
                    <div class="grid grid-cols-2 gap-2">
                        ${[
                            'visitor_blocked', 'visitor_allowed', 'ip_added', 'security_rule_triggered',
                            'honeypot_hit', 'campaign_conversion', 'video_view', 'suspicious_behavior'
                        ].map(event => `
                            <label class="flex items-center">
                                <input type="checkbox" name="webhook-events" value="${event}" class="mr-2">
                                <span class="text-sm text-gray-300">${event.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-300 mb-2">Secret (Optional)</label>
                    <input type="text" id="webhook-secret"
                           class="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-400 focus:outline-none"
                           placeholder="Secret for webhook verification">
                </div>
                
                <div class="flex items-center">
                    <input type="checkbox" id="webhook-enabled" checked class="mr-2">
                    <label for="webhook-enabled" class="text-sm text-gray-300">Enable webhook</label>
                </div>
                
                <div class="flex justify-end space-x-3 pt-4">
                    <button type="button" onclick="showDomainIntegrations('${domainId}')"
                            class="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors">
                        Cancel
                    </button>
                    <button type="submit"
                            class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors">
                        <i class="fas fa-plus mr-2"></i>Add Webhook
                    </button>
                </div>
            </form>
        </div>
    `;
}

// Add webhook
async function addWebhook(event, domainId) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const events = Array.from(document.querySelectorAll('input[name="webhook-events"]:checked'))
                       .map(cb => cb.value);
    
    if (events.length === 0) {
        showNotification('Please select at least one event', 'error');
        return;
    }
    
    const webhookData = {
        name: document.getElementById('webhook-name').value,
        url: document.getElementById('webhook-url').value,
        events: events,
        secret: document.getElementById('webhook-secret').value || null,
        enabled: document.getElementById('webhook-enabled').checked
    };
    
    try {
        const response = await fetch(`/api/domains/${domainId}/integrations/webhooks`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(webhookData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Webhook başarıyla eklendi', 'success');
            setTimeout(() => showDomainIntegrations(domainId), 500);
        } else {
            showNotification('Error: ' + data.message, 'error');
        }
    } catch (error) {
        showNotification('Error: ' + error.message, 'error');
    }
}

// Test webhook
async function testWebhook(domainId, webhookId) {
    try {
        const response = await fetch(`/api/domains/${domainId}/integrations/webhooks/${webhookId}/test`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Test webhook başarıyla gönderildi', 'success');
        } else {
            showNotification('Error: ' + data.message, 'error');
        }
    } catch (error) {
        showNotification('Error: ' + error.message, 'error');
    }
}

// Delete webhook
async function deleteWebhook(domainId, webhookId) {
    if (!confirm('Bu webhook\'u silmek istediğinizden emin misiniz?')) return;
    
    try {
        const response = await fetch(`/api/domains/${domainId}/integrations/webhooks/${webhookId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Webhook başarıyla silindi', 'success');
            loadWebhooksData(domainId);
        } else {
            showNotification('Error: ' + data.message, 'error');
        }
    } catch (error) {
        showNotification('Error: ' + error.message, 'error');
    }
}

// Load custom scripts tab content
async function loadCustomScriptsTab(domainId) {
    const content = document.getElementById('integration-content');
    content.innerHTML = `
        <div class="space-y-6">
            <!-- Custom Scripts Overview -->
            <div class="bg-gray-700 rounded-lg p-4">
                <div class="flex items-center justify-between mb-4">
                    <h4 class="text-lg font-semibold text-white">
                        <i class="fas fa-code mr-2 text-blue-400"></i>
                        Custom Scripts
                    </h4>
                    <button onclick="showAddCustomScriptForm('${domainId}')" 
                            class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                        <i class="fas fa-plus mr-2"></i>Add Script
                    </button>
                </div>
                
                <div class="text-sm text-gray-300 mb-4">
                    Custom scripts allow you to execute code when specific events occur on your domain.
                </div>
                
                <!-- Custom Scripts Statistics -->
                <div id="scripts-stats" class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <!-- Stats will be loaded here -->
                </div>
            </div>
            
            <!-- Custom Scripts List -->
            <div id="scripts-list" class="space-y-4">
                <!-- Scripts will be loaded here -->
            </div>
        </div>
    `;
    
    // Load custom scripts data
    await loadCustomScriptsData(domainId);
}

// Load custom scripts data
async function loadCustomScriptsData(domainId) {
    try {
        const response = await fetch(`/api/domains/${domainId}/integrations/scripts`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        if (data.success) {
            renderCustomScriptsStats(data.scripts);
            renderCustomScriptsList(data.scripts, domainId);
        } else {
            showNotification('Error loading scripts: ' + data.message, 'error');
        }
    } catch (error) {
        showNotification('Error: ' + error.message, 'error');
    }
}

// Render custom scripts statistics
function renderCustomScriptsStats(scripts) {
    const totalScripts = scripts.length;
    const enabledScripts = scripts.filter(s => s.enabled).length;
    const totalExecutions = scripts.reduce((sum, s) => sum + (s.executions || 0), 0);
    const successRate = totalExecutions > 0 ? Math.round((scripts.reduce((sum, s) => sum + (s.successfulExecutions || 0), 0) / totalExecutions) * 100) : 0;
    
    const statsContainer = document.getElementById('scripts-stats');
    statsContainer.innerHTML = `
        <div class="bg-gray-800 rounded-lg p-4 text-center">
            <div class="text-2xl font-bold text-white">${totalScripts}</div>
            <div class="text-sm text-gray-400">Total Scripts</div>
        </div>
        <div class="bg-gray-800 rounded-lg p-4 text-center">
            <div class="text-2xl font-bold text-green-400">${enabledScripts}</div>
            <div class="text-sm text-gray-400">Active</div>
        </div>
        <div class="bg-gray-800 rounded-lg p-4 text-center">
            <div class="text-2xl font-bold text-blue-400">${totalExecutions}</div>
            <div class="text-sm text-gray-400">Total Executions</div>
        </div>
        <div class="bg-gray-800 rounded-lg p-4 text-center">
            <div class="text-2xl font-bold text-purple-400">${successRate}%</div>
            <div class="text-sm text-gray-400">Success Rate</div>
        </div>
    `;
}

// Render custom scripts list
function renderCustomScriptsList(scripts, domainId) {
    const container = document.getElementById('scripts-list');
    
    if (scripts.length === 0) {
        container.innerHTML = `
            <div class="bg-gray-700 rounded-lg p-6 text-center">
                <i class="fas fa-code text-4xl text-gray-500 mb-4"></i>
                <h3 class="text-lg font-medium text-white mb-2">No Custom Scripts</h3>
                <p class="text-gray-400 mb-4">Create custom scripts to execute code on visitor events.</p>
                <button onclick="showAddCustomScriptForm('${domainId}')" 
                        class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium">
                    Add Your First Script
                </button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = scripts.map(script => `
        <div class="bg-gray-700 rounded-lg p-4">
            <div class="flex items-center justify-between mb-3">
                <div class="flex items-center">
                    <div class="w-3 h-3 rounded-full ${script.enabled ? 'bg-green-400' : 'bg-gray-500'} mr-3"></div>
                    <h4 class="text-lg font-medium text-white">${script.name}</h4>
                    <span class="ml-3 px-2 py-1 bg-blue-600 text-white text-xs rounded">${script.language}</span>
                </div>
                <div class="flex items-center space-x-2">
                    <button onclick="executeCustomScript('${domainId}', '${script.id}')" 
                            class="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm">
                        <i class="fas fa-play mr-1"></i>Execute
                    </button>
                    <button onclick="editCustomScript('${domainId}', '${script.id}')" 
                            class="bg-gray-600 hover:bg-gray-500 text-white px-3 py-1 rounded text-sm">
                        <i class="fas fa-edit mr-1"></i>Edit
                    </button>
                    <button onclick="deleteCustomScript('${domainId}', '${script.id}')" 
                            class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm">
                        <i class="fas fa-trash mr-1"></i>Delete
                    </button>
                </div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-3">
                <div>
                    <div class="text-gray-400">Trigger Event:</div>
                    <div class="text-white">${script.event}</div>
                </div>
                <div>
                    <div class="text-gray-400">Executions:</div>
                    <div class="text-white">${script.executions || 0}</div>
                </div>
            </div>
            
            <div class="bg-gray-800 rounded p-3 max-h-32 overflow-y-auto">
                <pre class="text-sm text-gray-300 font-mono">${script.code}</pre>
            </div>
            
            ${script.lastExecution ? `
                <div class="mt-3 pt-3 border-t border-gray-600">
                    <div class="text-xs text-gray-400">Last executed: ${new Date(script.lastExecution).toLocaleString()}</div>
                    ${script.lastError ? `<div class="text-xs text-red-400">Last error: ${script.lastError}</div>` : ''}
                </div>
            ` : ''}
        </div>
    `).join('');
}

// Show add custom script form
function showAddCustomScriptForm(domainId) {
    const modal = document.getElementById('modal');
    const modalContent = document.getElementById('modal-content');
    
    modalContent.innerHTML = `
        <div class="bg-gray-800 rounded-lg p-6 max-w-4xl w-full">
            <div class="flex items-center justify-between mb-6">
                <h3 class="text-xl font-bold text-white">
                    <i class="fas fa-plus mr-2 text-blue-400"></i>
                    Add Custom Script
                </h3>
                <button onclick="showDomainIntegrations('${domainId}')" class="text-gray-400 hover:text-white">
                    <i class="fas fa-arrow-left text-xl"></i>
                </button>
            </div>
            
            <form onsubmit="addCustomScript(event, '${domainId}')" class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-2">Script Name</label>
                        <input type="text" id="script-name" required
                               class="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-400 focus:outline-none"
                               placeholder="My Custom Script">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-2">Trigger Event</label>
                        <select id="script-event" required
                                class="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-400 focus:outline-none">
                            <option value="">Select Event</option>
                            <option value="visitor_blocked">Visitor Blocked</option>
                            <option value="visitor_allowed">Visitor Allowed</option>
                            <option value="ip_added">IP Added</option>
                            <option value="security_rule_triggered">Security Rule Triggered</option>
                            <option value="honeypot_hit">Honeypot Hit</option>
                            <option value="campaign_conversion">Campaign Conversion</option>
                            <option value="video_view">Video View</option>
                            <option value="suspicious_behavior">Suspicious Behavior</option>
                        </select>
                    </div>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-300 mb-2">Language</label>
                    <select id="script-language"
                            class="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-400 focus:outline-none">
                        <option value="javascript">JavaScript</option>
                        <option value="python" disabled>Python (Coming Soon)</option>
                    </select>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-300 mb-2">Script Code</label>
                    <textarea id="script-code" rows="12" required
                              class="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-400 focus:outline-none font-mono text-sm"
                              placeholder="// Your custom script code here
console.log('Event triggered:', event);

// Available context:
// - event: event data
// - domain: domain name  
// - console: logging functions
// - fetch: secure fetch for API calls
// - utils: utility functions

// Example:
if (event.ip === '192.168.1.1') {
    console.log('Special IP detected!');
}"></textarea>
                </div>
                
                <div class="flex items-center">
                    <input type="checkbox" id="script-enabled" checked class="mr-2">
                    <label for="script-enabled" class="text-sm text-gray-300">Enable script</label>
                </div>
                
                <div class="flex justify-end space-x-3 pt-4">
                    <button type="button" onclick="showDomainIntegrations('${domainId}')"
                            class="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors">
                        Cancel
                    </button>
                    <button type="submit"
                            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                        <i class="fas fa-plus mr-2"></i>Add Script
                    </button>
                </div>
            </form>
        </div>
    `;
}

// Add custom script
async function addCustomScript(event, domainId) {
    event.preventDefault();
    
    const scriptData = {
        name: document.getElementById('script-name').value,
        event: document.getElementById('script-event').value,
        language: document.getElementById('script-language').value,
        code: document.getElementById('script-code').value,
        enabled: document.getElementById('script-enabled').checked
    };
    
    try {
        const response = await fetch(`/api/domains/${domainId}/integrations/scripts`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(scriptData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Custom script başarıyla eklendi', 'success');
            setTimeout(() => showDomainIntegrations(domainId), 500);
        } else {
            showNotification('Error: ' + data.message, 'error');
        }
    } catch (error) {
        showNotification('Error: ' + error.message, 'error');
    }
}

// Execute custom script manually
async function executeCustomScript(domainId, scriptId) {
    try {
        const response = await fetch(`/api/domains/${domainId}/integrations/scripts/${scriptId}/execute`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ eventData: { test: true, timestamp: new Date().toISOString() } })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Script başarıyla çalıştırıldı', 'success');
        } else {
            showNotification('Error: ' + data.message, 'error');
        }
    } catch (error) {
        showNotification('Error: ' + error.message, 'error');
    }
}

// Delete custom script
async function deleteCustomScript(domainId, scriptId) {
    if (!confirm('Bu custom script\'i silmek istediğinizden emin misiniz?')) return;
    
    try {
        const response = await fetch(`/api/domains/${domainId}/integrations/scripts/${scriptId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Custom script başarıyla silindi', 'success');
            loadCustomScriptsData(domainId);
        } else {
            showNotification('Error: ' + data.message, 'error');
        }
    } catch (error) {
        showNotification('Error: ' + error.message, 'error');
    }
}

// Load API connections tab content  
async function loadApiConnectionsTab(domainId) {
    const content = document.getElementById('integration-content');
    content.innerHTML = `
        <div class="space-y-6">
            <!-- API Connections Overview -->
            <div class="bg-gray-700 rounded-lg p-4">
                <div class="flex items-center justify-between mb-4">
                    <h4 class="text-lg font-semibold text-white">
                        <i class="fas fa-link mr-2 text-green-400"></i>
                        API Connections
                    </h4>
                    <button onclick="showAddApiConnectionForm('${domainId}')" 
                            class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                        <i class="fas fa-plus mr-2"></i>Add Connection
                    </button>
                </div>
                
                <div class="text-sm text-gray-300 mb-4">
                    Connect to external APIs like CRM systems, analytics platforms, and marketing tools.
                </div>
                
                <!-- API Connections Statistics -->
                <div id="apis-stats" class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <!-- Stats will be loaded here -->
                </div>
            </div>
            
            <!-- API Connections List -->
            <div id="apis-list" class="space-y-4">
                <!-- Connections will be loaded here -->
            </div>
        </div>
    `;
    
    // Load API connections data
    await loadApiConnectionsData(domainId);
}

// Load API connections data
async function loadApiConnectionsData(domainId) {
    try {
        const response = await fetch(`/api/domains/${domainId}/integrations/apis`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        if (data.success) {
            renderApiConnectionsStats(data.connections);
            renderApiConnectionsList(data.connections, domainId);
        } else {
            showNotification('Error loading API connections: ' + data.message, 'error');
        }
    } catch (error) {
        showNotification('Error: ' + error.message, 'error');
    }
}

// Render API connections statistics
function renderApiConnectionsStats(connections) {
    const totalConnections = connections.length;
    const enabledConnections = connections.filter(c => c.enabled).length;
    const totalCalls = connections.reduce((sum, c) => sum + (c.totalCalls || 0), 0);
    const successRate = totalCalls > 0 ? Math.round((connections.reduce((sum, c) => sum + (c.successfulCalls || 0), 0) / totalCalls) * 100) : 0;
    
    const statsContainer = document.getElementById('apis-stats');
    statsContainer.innerHTML = `
        <div class="bg-gray-800 rounded-lg p-4 text-center">
            <div class="text-2xl font-bold text-white">${totalConnections}</div>
            <div class="text-sm text-gray-400">Total Connections</div>
        </div>
        <div class="bg-gray-800 rounded-lg p-4 text-center">
            <div class="text-2xl font-bold text-green-400">${enabledConnections}</div>
            <div class="text-sm text-gray-400">Active</div>
        </div>
        <div class="bg-gray-800 rounded-lg p-4 text-center">
            <div class="text-2xl font-bold text-blue-400">${totalCalls}</div>
            <div class="text-sm text-gray-400">Total API Calls</div>
        </div>
        <div class="bg-gray-800 rounded-lg p-4 text-center">
            <div class="text-2xl font-bold text-purple-400">${successRate}%</div>
            <div class="text-sm text-gray-400">Success Rate</div>
        </div>
    `;
}

// Render API connections list
function renderApiConnectionsList(connections, domainId) {
    const container = document.getElementById('apis-list');
    
    if (connections.length === 0) {
        container.innerHTML = `
            <div class="bg-gray-700 rounded-lg p-6 text-center">
                <i class="fas fa-link text-4xl text-gray-500 mb-4"></i>
                <h3 class="text-lg font-medium text-white mb-2">No API Connections</h3>
                <p class="text-gray-400 mb-4">Connect to external services and APIs.</p>
                <button onclick="showAddApiConnectionForm('${domainId}')" 
                        class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium">
                    Add Your First Connection
                </button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = connections.map(connection => `
        <div class="bg-gray-700 rounded-lg p-4">
            <div class="flex items-center justify-between mb-3">
                <div class="flex items-center">
                    <div class="w-3 h-3 rounded-full ${connection.enabled ? 'bg-green-400' : 'bg-gray-500'} mr-3"></div>
                    <h4 class="text-lg font-medium text-white">${connection.name}</h4>
                    <span class="ml-3 px-2 py-1 bg-green-600 text-white text-xs rounded">${connection.type}</span>
                </div>
                <div class="flex items-center space-x-2">
                    <button onclick="testApiConnection('${domainId}', '${connection.id}')" 
                            class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm">
                        <i class="fas fa-play mr-1"></i>Test
                    </button>
                    <button onclick="editApiConnection('${domainId}', '${connection.id}')" 
                            class="bg-gray-600 hover:bg-gray-500 text-white px-3 py-1 rounded text-sm">
                        <i class="fas fa-edit mr-1"></i>Edit
                    </button>
                    <button onclick="deleteApiConnection('${domainId}', '${connection.id}')" 
                            class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm">
                        <i class="fas fa-trash mr-1"></i>Delete
                    </button>
                </div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                    <div class="text-gray-400">Base URL:</div>
                    <div class="text-white font-mono">${connection.baseUrl}</div>
                </div>
                <div>
                    <div class="text-gray-400">API Key:</div>
                    <div class="text-white">${connection.apiKey}</div>
                </div>
                <div>
                    <div class="text-gray-400">Total Calls:</div>
                    <div class="text-white">${connection.totalCalls || 0}</div>
                </div>
                <div>
                    <div class="text-gray-400">Success Rate:</div>
                    <div class="text-white">${connection.totalCalls > 0 ? Math.round((connection.successfulCalls || 0) / connection.totalCalls * 100) : 0}%</div>
                </div>
            </div>
            
            ${connection.lastCall ? `
                <div class="mt-3 pt-3 border-t border-gray-600">
                    <div class="text-xs text-gray-400">Last called: ${new Date(connection.lastCall).toLocaleString()}</div>
                </div>
            ` : ''}
        </div>
    `).join('');
}

// Load event testing tab content
async function loadEventTestingTab(domainId) {
    const content = document.getElementById('integration-content');
    content.innerHTML = `
        <div class="space-y-6">
            <!-- Event Testing Overview -->
            <div class="bg-gray-700 rounded-lg p-4">
                <h4 class="text-lg font-semibold text-white mb-4">
                    <i class="fas fa-bolt mr-2 text-yellow-400"></i>
                    Event Testing
                </h4>
                
                <div class="text-sm text-gray-300 mb-4">
                    Test your integrations by manually triggering events and monitoring their execution.
                </div>
            </div>
            
            <!-- Event Trigger Form -->
            <div class="bg-gray-700 rounded-lg p-6">
                <h5 class="text-white font-medium mb-4">Trigger Test Event</h5>
                
                <form onsubmit="triggerTestEvent(event, '${domainId}')" class="space-y-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-2">Event Type</label>
                            <select id="test-event-type" required
                                    class="w-full p-3 bg-gray-600 border border-gray-500 rounded-lg text-white focus:border-yellow-400 focus:outline-none">
                                <option value="">Select Event Type</option>
                                <option value="visitor_blocked">Visitor Blocked</option>
                                <option value="visitor_allowed">Visitor Allowed</option>
                                <option value="ip_added">IP Added</option>
                                <option value="security_rule_triggered">Security Rule Triggered</option>
                                <option value="honeypot_hit">Honeypot Hit</option>
                                <option value="campaign_conversion">Campaign Conversion</option>
                                <option value="video_view">Video View</option>
                                <option value="suspicious_behavior">Suspicious Behavior</option>
                                <option value="test_event">Test Event</option>
                            </select>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-2">Test IP Address</label>
                            <input type="text" id="test-ip" value="192.168.1.100"
                                   class="w-full p-3 bg-gray-600 border border-gray-500 rounded-lg text-white focus:border-yellow-400 focus:outline-none"
                                   placeholder="192.168.1.100">
                        </div>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-2">Custom Event Data (JSON)</label>
                        <textarea id="test-event-data" rows="6"
                                  class="w-full p-3 bg-gray-600 border border-gray-500 rounded-lg text-white focus:border-yellow-400 focus:outline-none font-mono text-sm"
                                  placeholder='{
  "ip": "192.168.1.100",
  "userAgent": "Test User Agent",
  "country": "US",
  "timestamp": "2024-01-01T00:00:00Z"
}'>{
  "ip": "192.168.1.100",
  "userAgent": "Mozilla/5.0 (Test Browser)",
  "country": "US",
  "referer": "https://google.com",
  "timestamp": "${new Date().toISOString()}"
}</textarea>
                    </div>
                    
                    <button type="submit"
                            class="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-3 rounded-lg font-medium transition-colors">
                        <i class="fas fa-bolt mr-2"></i>Trigger Test Event
                    </button>
                </form>
            </div>
            
            <!-- Event Results -->
            <div id="event-results" class="bg-gray-700 rounded-lg p-4 hidden">
                <h5 class="text-white font-medium mb-4">Event Execution Results</h5>
                <div id="event-results-content" class="space-y-3">
                    <!-- Results will be displayed here -->
                </div>
            </div>
        </div>
    `;
}

// Trigger test event
async function triggerTestEvent(event, domainId) {
    event.preventDefault();
    
    const eventType = document.getElementById('test-event-type').value;
    let eventData;
    
    try {
        eventData = JSON.parse(document.getElementById('test-event-data').value);
    } catch (error) {
        showNotification('Invalid JSON in event data', 'error');
        return;
    }
    
    try {
        const response = await fetch(`/api/domains/${domainId}/integrations/trigger-event`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ eventType, eventData })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Event başarıyla tetiklendi', 'success');
            displayEventResults(data.results);
        } else {
            showNotification('Error: ' + data.message, 'error');
        }
    } catch (error) {
        showNotification('Error: ' + error.message, 'error');
    }
}

// Display event execution results
function displayEventResults(results) {
    const resultsContainer = document.getElementById('event-results');
    const resultsContent = document.getElementById('event-results-content');
    
    resultsContainer.classList.remove('hidden');
    
    let content = '';
    
    // Webhook results
    if (results.webhooks && results.webhooks.length > 0) {
        content += `
            <div class="bg-gray-600 rounded p-3">
                <h6 class="text-white font-medium mb-2">
                    <i class="fas fa-webhook mr-2 text-purple-400"></i>
                    Webhook Results (${results.webhooks.length})
                </h6>
                ${results.webhooks.map(result => `
                    <div class="text-sm mb-2">
                        <span class="text-gray-300">Webhook:</span> 
                        <span class="text-white">${result.webhook}</span>
                        <span class="ml-2 px-2 py-1 text-xs rounded ${result.success ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}">
                            ${result.success ? 'Success' : 'Failed'}
                        </span>
                        ${result.error ? `<div class="text-red-400 text-xs mt-1">${result.error}</div>` : ''}
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    // Custom script results
    if (results.customScripts && results.customScripts.length > 0) {
        content += `
            <div class="bg-gray-600 rounded p-3">
                <h6 class="text-white font-medium mb-2">
                    <i class="fas fa-code mr-2 text-blue-400"></i>
                    Custom Script Results (${results.customScripts.length})
                </h6>
                ${results.customScripts.map(result => `
                    <div class="text-sm mb-2">
                        <span class="text-gray-300">Script:</span> 
                        <span class="text-white">${result.script}</span>
                        <span class="ml-2 px-2 py-1 text-xs rounded ${result.success ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}">
                            ${result.success ? 'Success' : 'Failed'}
                        </span>
                        ${result.error ? `<div class="text-red-400 text-xs mt-1">${result.error}</div>` : ''}
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    if (content === '') {
        content = `
            <div class="bg-gray-600 rounded p-3 text-center">
                <div class="text-gray-400">No integrations triggered</div>
                <div class="text-sm text-gray-500 mt-1">Make sure you have webhooks or custom scripts configured for this event type</div>
            </div>
        `;
    }
    
    resultsContent.innerHTML = content;
}

// Close modal function
function closeModal() {
    const modal = document.getElementById('modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

console.log('Dashboard JavaScript with Phase 1, Phase 2, Phase 3, Phase 4, Phase 5 & Phase 6 (Hook System & Integrations) loaded successfully - Debug Mode ON');