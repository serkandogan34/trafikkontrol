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
}

// Setup event listeners
function setupEventListeners() {
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
    
    // DNS edit form
    const dnsEditForm = document.getElementById('dnsEditForm');
    if (dnsEditForm) {
        dnsEditForm.addEventListener('submit', handleDNSEditSubmit);
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
                    <button onclick="checkDomain('${domain.id}')" 
                            class="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm">
                        <i class="fas fa-sync-alt"></i>
                    </button>
                    <button onclick="editDomain('${domain.id}')" 
                            class="bg-yellow-600 hover:bg-yellow-700 px-3 py-1 rounded text-sm">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteDomain('${domain.id}')" 
                            class="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm">
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

console.log('Dashboard JavaScript loaded successfully');