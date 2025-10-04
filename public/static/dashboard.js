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
                    <button onclick="showDomainAnalytics('${domain.id}')" 
                            class="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm" title="Analytics">
                        <i class="fas fa-chart-bar"></i>
                    </button>
                    <button onclick="showDomainIPManagement('${domain.id}')" 
                            class="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded text-sm" title="IP Rules">
                        <i class="fas fa-shield-alt"></i>
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

console.log('Dashboard JavaScript with Phase 1 IP Management & Analytics loaded successfully');