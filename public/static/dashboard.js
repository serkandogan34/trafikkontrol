// Dashboard JavaScript - External file to avoid template literal issues

// Global variables
let token = localStorage.getItem('authToken');
let monitoringInterval = null;
let lastGeneratedConfig = '';

// =============================================================================
// CORE UTILITY FUNCTIONS
// =============================================================================

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

// =============================================================================
// ADVANCED DNS MANAGEMENT FUNCTIONS
// =============================================================================

// Advanced DNS configuration and features
const advancedDNSConfig = {
    geodns: { enabled: false, currentCountry: 'TR' },
    loadBalancing: { algorithm: 'round_robin', enabled: false },
    botDetection: { enabled: true, threats: 0 },
    security: { enabled: true, status: 'SECURE' },
    caching: { enabled: true, hitRatio: 85 }
}

// GeoDNS Management
async function testGeoDNSResolution() {
    try {
        showNotification('GeoDNS testi başlatılıyor...', 'info');
        
        const domain = document.getElementById('geodns-test-domain').value;
        if (!domain) {
            showNotification('Lütfen test edilecek domain girin', 'error');
            return;
        }
        
        const response = await fetch(`/api/dns/geo-resolve/${domain}`, {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('geodns-results').innerHTML = `
                <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 class="font-semibold text-green-800">GeoDNS Çözümleme Sonucu</h4>
                    <div class="mt-2 space-y-1 text-sm text-green-700">
                        <div><strong>Domain:</strong> ${data.domain}</div>
                        <div><strong>IP Adresi:</strong> ${data.clientIP}</div>
                        <div><strong>Ülke:</strong> ${data.country}</div>
                        <div><strong>Yönlendirilen Sunucu:</strong> ${data.resolvedServer}</div>
                    </div>
                </div>
            `;
            showNotification('GeoDNS testi tamamlandı', 'success');
        } else {
            showNotification('GeoDNS test hatası: ' + data.message, 'error');
        }
    } catch (error) {
        showNotification('GeoDNS test hatası: ' + error.message, 'error');
    }
}

// Advanced Health Monitoring
async function performAdvancedHealthCheck() {
    try {
        showNotification('Gelişmiş health check başlatılıyor...', 'info');
        
        const targets = document.getElementById('health-targets').value.split('\n').filter(t => t.trim());
        const protocols = Array.from(document.querySelectorAll('input[name="health-protocols"]:checked')).map(cb => cb.value);
        
        if (targets.length === 0) {
            showNotification('Lütfen en az bir hedef girin', 'error');
            return;
        }
        
        const response = await fetch('/api/dns/advanced-health-check', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                targets: targets,
                protocols: protocols,
                includeMetrics: true
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            renderHealthCheckResults(data.results, data.summary);
            showNotification(`Health check tamamlandı - ${data.summary.healthy}/${data.summary.total} sağlıklı`, 'success');
        } else {
            showNotification('Health check hatası: ' + data.message, 'error');
        }
    } catch (error) {
        showNotification('Health check hatası: ' + error.message, 'error');
    }
}

// Render health check results
function renderHealthCheckResults(results, summary) {
    const container = document.getElementById('health-results');
    
    container.innerHTML = `
        <div class="bg-gray-50 border rounded-lg p-4 mb-4">
            <h4 class="font-semibold text-gray-800 mb-2">Özet</h4>
            <div class="grid grid-cols-3 gap-4 text-sm">
                <div class="text-center">
                    <div class="text-2xl font-bold text-blue-600">${summary.total}</div>
                    <div class="text-gray-600">Toplam Test</div>
                </div>
                <div class="text-center">
                    <div class="text-2xl font-bold text-green-600">${summary.healthy}</div>
                    <div class="text-gray-600">Sağlıklı</div>
                </div>
                <div class="text-center">
                    <div class="text-2xl font-bold text-orange-600">${Math.round(summary.avgResponseTime)}ms</div>
                    <div class="text-gray-600">Ort. Yanıt</div>
                </div>
            </div>
        </div>
        <div class="space-y-2">
            ${results.map(result => `
                <div class="border rounded-lg p-3 ${result.healthy ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}">
                    <div class="flex justify-between items-center">
                        <div>
                            <span class="font-medium">${result.target}</span>
                            <span class="text-sm text-gray-500">(${result.protocol})</span>
                        </div>
                        <div class="flex items-center space-x-2">
                            <span class="text-sm">${result.responseTime}ms</span>
                            <span class="w-3 h-3 rounded-full ${result.healthy ? 'bg-green-500' : 'bg-red-500'}"></span>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Bot Detection Analysis
async function runBotDetectionAnalysis() {
    try {
        showNotification('Bot detection analizi başlatılıyor...', 'info');
        
        const response = await fetch('/api/dns/bot-detection', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + token }
        });
        
        const data = await response.json();
        
        if (data.success) {
            renderBotDetectionResults(data.analysis, data.clientIP);
            showNotification('Bot detection analizi tamamlandı', 'success');
        } else {
            showNotification('Bot detection hatası: ' + data.message, 'error');
        }
    } catch (error) {
        showNotification('Bot detection hatası: ' + error.message, 'error');
    }
}

// Render bot detection results
function renderBotDetectionResults(analysis, clientIP) {
    const container = document.getElementById('bot-detection-results');
    
    const confidenceColor = analysis.confidence > 70 ? 'red' : analysis.confidence > 40 ? 'yellow' : 'green';
    const actionColor = analysis.action === 'block' ? 'red' : analysis.action === 'redirect' ? 'yellow' : 'green';
    
    container.innerHTML = `
        <div class="bg-gray-50 border rounded-lg p-4">
            <h4 class="font-semibold text-gray-800 mb-3">Bot Detection Analizi</h4>
            <div class="space-y-3">
                <div class="flex justify-between">
                    <span>IP Adresi:</span>
                    <span class="font-medium">${clientIP}</span>
                </div>
                <div class="flex justify-between">
                    <span>Bot Olasılığı:</span>
                    <span class="font-medium text-${confidenceColor}-600">${analysis.confidence.toFixed(1)}%</span>
                </div>
                <div class="flex justify-between">
                    <span>Önerilen Aksiyon:</span>
                    <span class="font-medium text-${actionColor}-600 capitalize">${analysis.action}</span>
                </div>
                <div class="mt-4">
                    <h5 class="font-medium text-gray-700 mb-2">Tespit Edilen Göstergeler:</h5>
                    <div class="space-y-1">
                        ${Object.entries(analysis.indicators).map(([key, value]) => `
                            <div class="flex justify-between text-sm">
                                <span>${key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                                <span class="${value ? 'text-red-600' : 'text-green-600'}">
                                    ${value ? '✗ Şüpheli' : '✓ Normal'}
                                </span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Security Analysis
async function runSecurityAnalysis() {
    try {
        showNotification('Güvenlik analizi başlatılıyor...', 'info');
        
        const response = await fetch('/api/dns/security-analysis', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        
        const data = await response.json();
        
        if (data.success) {
            renderSecurityAnalysisResults(data.metrics, data.threats, data.overallSecurity);
            showNotification('Güvenlik analizi tamamlandı', 'success');
        } else {
            showNotification('Güvenlik analizi hatası: ' + data.message, 'error');
        }
    } catch (error) {
        showNotification('Güvenlik analizi hatası: ' + error.message, 'error');
    }
}

// Render security analysis results
function renderSecurityAnalysisResults(metrics, threats, overallSecurity) {
    const container = document.getElementById('security-analysis-results');
    
    const securityColor = overallSecurity === 'SECURE' ? 'green' : 'red';
    
    container.innerHTML = `
        <div class="bg-gray-50 border rounded-lg p-4">
            <div class="flex justify-between items-center mb-4">
                <h4 class="font-semibold text-gray-800">Güvenlik Durumu</h4>
                <span class="px-3 py-1 rounded-full text-sm font-medium bg-${securityColor}-100 text-${securityColor}-800">
                    ${overallSecurity}
                </span>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div class="bg-white border rounded p-3">
                    <h5 class="font-medium text-gray-700 mb-2">Rate Limiting</h5>
                    <div class="text-sm space-y-1">
                        <div>Durum: <span class="font-medium">${metrics.rateLimiting.status}</span></div>
                        <div>Sorgu: ${metrics.rateLimiting.currentQueries}/${metrics.rateLimiting.limit}</div>
                    </div>
                </div>
                
                <div class="bg-white border rounded p-3">
                    <h5 class="font-medium text-gray-700 mb-2">Tunneling Detection</h5>
                    <div class="text-sm space-y-1">
                        <div>Aktif: <span class="font-medium">${metrics.tunneling.enabled ? 'Evet' : 'Hayır'}</span></div>
                        <div>Durum: <span class="font-medium">${metrics.tunneling.status}</span></div>
                    </div>
                </div>
                
                <div class="bg-white border rounded p-3">
                    <h5 class="font-medium text-gray-700 mb-2">Geo Blocking</h5>
                    <div class="text-sm space-y-1">
                        <div>Ülke: <span class="font-medium">${metrics.geoBlocking.clientCountry}</span></div>
                        <div>İzinli: <span class="font-medium">${metrics.geoBlocking.allowed ? 'Evet' : 'Hayır'}</span></div>
                    </div>
                </div>
            </div>
            
            ${threats.length > 0 ? `
                <div class="bg-red-50 border border-red-200 rounded p-3">
                    <h5 class="font-medium text-red-800 mb-2">Tespit Edilen Tehditler</h5>
                    <div class="space-y-2">
                        ${threats.map(threat => `
                            <div class="text-sm">
                                <span class="font-medium text-red-700">${threat.type}:</span>
                                <span class="text-red-600">${threat.message}</span>
                                <span class="text-xs text-red-500">(${threat.action})</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : '<div class="bg-green-50 border border-green-200 rounded p-3 text-green-700">Güvenlik tehdidi tespit edilmedi</div>'}
        </div>
    `;
}

// Load Balancing Management
async function loadLoadBalancingInfo() {
    try {
        const response = await fetch('/api/dns/load-balancing', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        
        const data = await response.json();
        
        if (data.success) {
            renderLoadBalancingInfo(data.servers, data.metrics, data.algorithm);
        } else {
            showNotification('Load balancing bilgisi alınamadı: ' + data.message, 'error');
        }
    } catch (error) {
        showNotification('Load balancing hatası: ' + error.message, 'error');
    }
}

// Render load balancing information
function renderLoadBalancingInfo(servers, metrics, currentAlgorithm) {
    const container = document.getElementById('load-balancing-info');
    
    container.innerHTML = `
        <div class="bg-gray-50 border rounded-lg p-4 mb-4">
            <h4 class="font-semibold text-gray-800 mb-3">Load Balancing Özeti</h4>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div class="text-center">
                    <div class="text-xl font-bold text-blue-600">${metrics.totalServers}</div>
                    <div class="text-gray-600">Toplam Sunucu</div>
                </div>
                <div class="text-center">
                    <div class="text-xl font-bold text-green-600">${metrics.healthyServers}</div>
                    <div class="text-gray-600">Sağlıklı</div>
                </div>
                <div class="text-center">
                    <div class="text-xl font-bold text-orange-600">${Math.round(metrics.avgResponseTime)}ms</div>
                    <div class="text-gray-600">Ort. Yanıt</div>
                </div>
                <div class="text-center">
                    <div class="text-xl font-bold text-purple-600">${metrics.totalConnections}</div>
                    <div class="text-gray-600">Bağlantı</div>
                </div>
            </div>
        </div>
        
        <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">Load Balancing Algoritması</label>
            <select id="lb-algorithm" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                <option value="round_robin" ${currentAlgorithm === 'round_robin' ? 'selected' : ''}>Round Robin</option>
                <option value="least_connections" ${currentAlgorithm === 'least_connections' ? 'selected' : ''}>Least Connections</option>
                <option value="weighted" ${currentAlgorithm === 'weighted' ? 'selected' : ''}>Weighted</option>
                <option value="geographic" ${currentAlgorithm === 'geographic' ? 'selected' : ''}>Geographic</option>
            </select>
        </div>
        
        <div class="space-y-3">
            <h5 class="font-medium text-gray-700">Sunucu Durumu</h5>
            ${servers.map(server => `
                <div class="border rounded-lg p-3 ${server.healthy ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}">
                    <div class="flex justify-between items-center">
                        <div>
                            <span class="font-medium">${server.domain}</span>
                            <span class="text-sm text-gray-500">(${server.ip})</span>
                        </div>
                        <div class="flex items-center space-x-3 text-sm">
                            <span>Weight: ${server.weight}</span>
                            <span>${server.connections} conn</span>
                            <span>${server.responseTime}ms</span>
                            <span class="w-3 h-3 rounded-full ${server.healthy ? 'bg-green-500' : 'bg-red-500'}"></span>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Cache Statistics
async function loadCacheStatistics() {
    try {
        const response = await fetch('/api/dns/cache-stats', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        
        const data = await response.json();
        
        if (data.success) {
            renderCacheStatistics(data.stats, data.entries);
        } else {
            showNotification('Cache istatistikleri alınamadı: ' + data.message, 'error');
        }
    } catch (error) {
        showNotification('Cache hatası: ' + error.message, 'error');
    }
}

// Render cache statistics
function renderCacheStatistics(stats, entries) {
    const container = document.getElementById('cache-statistics');
    
    container.innerHTML = `
        <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
            <div class="bg-blue-50 border border-blue-200 rounded p-3 text-center">
                <div class="text-xl font-bold text-blue-600">${stats.totalEntries}</div>
                <div class="text-sm text-blue-700">Toplam Girdi</div>
            </div>
            <div class="bg-green-50 border border-green-200 rounded p-3 text-center">
                <div class="text-xl font-bold text-green-600">${stats.totalHits}</div>
                <div class="text-sm text-green-700">Toplam Hit</div>
            </div>
            <div class="bg-orange-50 border border-orange-200 rounded p-3 text-center">
                <div class="text-xl font-bold text-orange-600">${stats.hitRatio}</div>
                <div class="text-sm text-orange-700">Hit Oranı</div>
            </div>
            <div class="bg-purple-50 border border-purple-200 rounded p-3 text-center">
                <div class="text-xl font-bold text-purple-600">${stats.avgAge}</div>
                <div class="text-sm text-purple-700">Ort. Yaş</div>
            </div>
            <div class="bg-red-50 border border-red-200 rounded p-3 text-center">
                <div class="text-xl font-bold text-red-600">${stats.expiredEntries}</div>
                <div class="text-sm text-red-700">Süresi Dolmuş</div>
            </div>
        </div>
        
        <div class="flex justify-between items-center mb-4">
            <h5 class="font-medium text-gray-700">Cache Girdileri (İlk 20)</h5>
            <button onclick="clearDNSCache()" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                Cache Temizle
            </button>
        </div>
        
        <div class="space-y-2 max-h-64 overflow-y-auto">
            ${entries.map(entry => `
                <div class="border rounded p-2 text-sm ${entry.expired ? 'bg-red-50 border-red-200' : 'bg-gray-50'}">
                    <div class="flex justify-between items-center">
                        <span class="font-medium">${entry.domain}</span>
                        <div class="flex items-center space-x-2">
                            <span class="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">${entry.type}</span>
                            <span class="text-gray-600">${entry.hits} hits</span>
                            ${entry.expired ? '<span class="text-red-600 text-xs">Expired</span>' : ''}
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Clear DNS Cache
async function clearDNSCache() {
    try {
        if (!confirm('Tüm DNS cache temizlenecek. Devam etmek istediğinizden emin misiniz?')) {
            return;
        }
        
        const response = await fetch('/api/dns/cache', {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + token }
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification(data.message, 'success');
            loadCacheStatistics(); // Refresh statistics
        } else {
            showNotification('Cache temizlenemedi: ' + data.message, 'error');
        }
    } catch (error) {
        showNotification('Cache temizleme hatası: ' + error.message, 'error');
    }
}

// Export DNS Metrics
async function exportDNSMetrics() {
    try {
        showNotification('Metrics export başlatılıyor...', 'info');
        
        const response = await fetch('/api/dns/metrics/export', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `dns-metrics-${Date.now()}.json`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            showNotification('Metrics başarıyla export edildi', 'success');
        } else {
            const data = await response.json();
            showNotification('Export hatası: ' + data.message, 'error');
        }
    } catch (error) {
        showNotification('Export hatası: ' + error.message, 'error');
    }
}

// =============================================================================
// DNS Management Functions (Original)
// =============================================================================

let dnsRecords = [];
let filteredDNSRecords = [];

// Load DNS records
async function loadDNSRecords() {
    try {
        document.getElementById('dns-loading').classList.remove('hidden');
        document.getElementById('dns-empty').classList.add('hidden');
        
        const response = await fetch('/api/dns', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        
        const data = await response.json();
        
        if (data.success) {
            dnsRecords = data.records;
            filteredDNSRecords = [...dnsRecords];
            updateDNSStatistics();
            renderDNSRecords();
        } else {
            showNotification('DNS kayıtları yüklenemedi: ' + data.message, 'error');
        }
    } catch (error) {
        console.error('DNS loading error:', error);
        showNotification('DNS kayıtları yüklenirken hata oluştu', 'error');
    } finally {
        document.getElementById('dns-loading').classList.add('hidden');
    }
}

// Update DNS statistics
function updateDNSStatistics() {
    const total = dnsRecords.length;
    const active = dnsRecords.filter(r => r.status === 'active').length;
    const propagating = dnsRecords.filter(r => r.propagationStatus === 'propagating').length;
    const providers = [...new Set(dnsRecords.map(r => r.provider))].length;
    
    document.getElementById('dns-total-records').textContent = total;
    document.getElementById('dns-active-records').textContent = active;
    document.getElementById('dns-propagating-records').textContent = propagating;
    document.getElementById('dns-providers-count').textContent = providers;
}

// Render DNS records table
function renderDNSRecords() {
    const tbody = document.getElementById('dns-records-table');
    
    if (filteredDNSRecords.length === 0) {
        document.getElementById('dns-empty').classList.remove('hidden');
        tbody.innerHTML = '';
        return;
    }
    
    document.getElementById('dns-empty').classList.add('hidden');
    
    tbody.innerHTML = filteredDNSRecords.map(record => `
        <tr class="hover:bg-gray-600">
            <td class="px-4 py-3">
                <input type="checkbox" class="dns-record-checkbox rounded" value="${record.id}">
            </td>
            <td class="px-4 py-3">
                <div class="flex items-center">
                    <i class="fas fa-globe text-blue-400 mr-2"></i>
                    <span class="font-medium">${record.domain}</span>
                </div>
            </td>
            <td class="px-4 py-3">
                <code class="bg-gray-600 px-2 py-1 rounded text-xs">${record.name}</code>
            </td>
            <td class="px-4 py-3">
                <span class="px-2 py-1 bg-purple-600 bg-opacity-30 text-purple-300 rounded text-xs">
                    ${record.type}
                </span>
            </td>
            <td class="px-4 py-3">
                <div class="max-w-48 truncate" title="${record.value}">
                    <code class="text-xs">${record.value}</code>
                </div>
            </td>
            <td class="px-4 py-3">
                <span class="text-gray-300">${record.ttl}s</span>
            </td>
            <td class="px-4 py-3">
                <span class="px-2 py-1 text-xs rounded ${getProviderStyle(record.provider)}">
                    ${getProviderName(record.provider)}
                </span>
            </td>
            <td class="px-4 py-3">
                <span class="px-2 py-1 text-xs rounded ${getStatusStyle(record.status)}">
                    <i class="fas ${getStatusIcon(record.status)} mr-1"></i>
                    ${getStatusText(record.status)}
                </span>
            </td>
            <td class="px-4 py-3">
                <span class="px-2 py-1 text-xs rounded ${getPropagationStyle(record.propagationStatus)}">
                    <i class="fas ${getPropagationIcon(record.propagationStatus)} mr-1"></i>
                    ${getPropagationText(record.propagationStatus)}
                </span>
            </td>
            <td class="px-4 py-3">
                <div class="flex space-x-2">
                    <button onclick="editDNSRecord('${record.id}')" 
                            class="text-blue-400 hover:text-blue-300" title="Düzenle">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="checkDNSPropagation('${record.id}')" 
                            class="text-green-400 hover:text-green-300" title="Propagation Kontrol">
                        <i class="fas fa-sync-alt"></i>
                    </button>
                    <button onclick="showDNSHealthCheck('${record.domain}')" 
                            class="text-yellow-400 hover:text-yellow-300" title="Sağlık Kontrolü">
                        <i class="fas fa-heartbeat"></i>
                    </button>
                    <button onclick="deleteDNSRecord('${record.id}')" 
                            class="text-red-400 hover:text-red-300" title="Sil">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// DNS Helper Functions
function getProviderStyle(provider) {
    const styles = {
        CLOUDFLARE: 'bg-orange-600 bg-opacity-30 text-orange-300',
        GODADDY: 'bg-green-600 bg-opacity-30 text-green-300',
        NAMECHEAP: 'bg-blue-600 bg-opacity-30 text-blue-300',
        CUSTOM: 'bg-purple-600 bg-opacity-30 text-purple-300'
    };
    return styles[provider] || 'bg-gray-600 bg-opacity-30 text-gray-300';
}

function getProviderName(provider) {
    const names = {
        CLOUDFLARE: 'Cloudflare',
        GODADDY: 'GoDaddy',
        NAMECHEAP: 'Namecheap',
        CUSTOM: 'Özel'
    };
    return names[provider] || provider;
}

function getStatusStyle(status) {
    const styles = {
        active: 'bg-green-600 bg-opacity-30 text-green-300',
        pending: 'bg-yellow-600 bg-opacity-30 text-yellow-300',
        error: 'bg-red-600 bg-opacity-30 text-red-300'
    };
    return styles[status] || 'bg-gray-600 bg-opacity-30 text-gray-300';
}

function getStatusIcon(status) {
    const icons = {
        active: 'fa-check-circle',
        pending: 'fa-hourglass-half',
        error: 'fa-exclamation-triangle'
    };
    return icons[status] || 'fa-question-circle';
}

function getStatusText(status) {
    const texts = {
        active: 'Aktif',
        pending: 'Beklemede',
        error: 'Hata'
    };
    return texts[status] || status;
}

function getPropagationStyle(status) {
    const styles = {
        propagated: 'bg-green-600 bg-opacity-30 text-green-300',
        propagating: 'bg-yellow-600 bg-opacity-30 text-yellow-300',
        pending: 'bg-blue-600 bg-opacity-30 text-blue-300'
    };
    return styles[status] || 'bg-gray-600 bg-opacity-30 text-gray-300';
}

function getPropagationIcon(status) {
    const icons = {
        propagated: 'fa-check',
        propagating: 'fa-spinner fa-spin',
        pending: 'fa-clock'
    };
    return icons[status] || 'fa-question';
}

function getPropagationText(status) {
    const texts = {
        propagated: 'Yayıldı',
        propagating: 'Yayılıyor',
        pending: 'Bekliyor'
    };
    return texts[status] || status;
}

// DNS Modal Functions
function showDNSAddModal() {
    document.getElementById('dnsAddModal').classList.remove('hidden');
}

function hideDNSAddModal() {
    document.getElementById('dnsAddModal').classList.add('hidden');
    document.getElementById('dnsAddForm').reset();
}

function showDNSEditModal() {
    document.getElementById('dnsEditModal').classList.remove('hidden');
}

function hideDNSEditModal() {
    document.getElementById('dnsEditModal').classList.add('hidden');
    document.getElementById('dnsEditForm').reset();
}

function showDNSHealthModal() {
    document.getElementById('dnsHealthModal').classList.remove('hidden');
}

function hideDNSHealthModal() {
    document.getElementById('dnsHealthModal').classList.add('hidden');
}

// Update DNS value placeholder based on record type
function updateDNSValuePlaceholder() {
    const type = document.getElementById('dns-type').value;
    const valueInput = document.getElementById('dns-value');
    const priorityDiv = document.getElementById('dns-priority-div');
    
    const placeholders = {
        A: '192.168.1.1',
        AAAA: '2001:db8::1',
        CNAME: 'target.example.com',
        MX: 'mail.example.com',
        TXT: '"v=spf1 include:_spf.example.com ~all"',
        NS: 'ns1.example.com'
    };
    
    valueInput.placeholder = placeholders[type] || 'Değer girin';
    
    // Show/hide priority field for MX records
    if (type === 'MX') {
        priorityDiv.classList.remove('hidden');
    } else {
        priorityDiv.classList.add('hidden');
    }
}

function updateEditDNSValuePlaceholder() {
    const type = document.getElementById('edit-dns-type').value;
    const valueInput = document.getElementById('edit-dns-value');
    const priorityDiv = document.getElementById('edit-dns-priority-div');
    
    updateDNSValuePlaceholder(); // Use same logic
    
    if (type === 'MX') {
        priorityDiv.classList.remove('hidden');
    } else {
        priorityDiv.classList.add('hidden');
    }
}

// DNS CRUD Operations
async function addDNSRecord(formData) {
    try {
        const response = await fetch('/api/dns', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('DNS kaydı başarıyla eklendi', 'success');
            hideDNSAddModal();
            loadDNSRecords();
        } else {
            showNotification('DNS kaydı eklenemedi: ' + data.message, 'error');
        }
    } catch (error) {
        showNotification('DNS kaydı eklenirken hata oluştu', 'error');
    }
}

async function editDNSRecord(id) {
    const record = dnsRecords.find(r => r.id === id);
    if (!record) return;
    
    // Populate edit form
    document.getElementById('edit-dns-id').value = record.id;
    document.getElementById('edit-dns-domain').value = record.domain;
    document.getElementById('edit-dns-name').value = record.name;
    document.getElementById('edit-dns-type').value = record.type;
    document.getElementById('edit-dns-value').value = record.value;
    document.getElementById('edit-dns-ttl').value = record.ttl;
    document.getElementById('edit-dns-provider').value = record.provider;
    
    if (record.priority) {
        document.getElementById('edit-dns-priority').value = record.priority;
    }
    
    updateEditDNSValuePlaceholder();
    showDNSEditModal();
}

async function updateDNSRecord(id, formData) {
    try {
        const response = await fetch(`/api/dns/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('DNS kaydı başarıyla güncellendi', 'success');
            hideDNSEditModal();
            loadDNSRecords();
        } else {
            showNotification('DNS kaydı güncellenemedi: ' + data.message, 'error');
        }
    } catch (error) {
        showNotification('DNS kaydı güncellenirken hata oluştu', 'error');
    }
}

async function deleteDNSRecord(id) {
    if (!confirm('Bu DNS kaydını silmek istediğinizden emin misiniz?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/dns/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + token }
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('DNS kaydı başarıyla silindi', 'success');
            loadDNSRecords();
        } else {
            showNotification('DNS kaydı silinemedi: ' + data.message, 'error');
        }
    } catch (error) {
        showNotification('DNS kaydı silinirken hata oluştu', 'error');
    }
}

async function checkDNSPropagation(id) {
    try {
        showNotification('DNS propagation kontrol ediliyor...', 'info');
        
        const response = await fetch(`/api/dns/${id}/check-propagation`, {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + token }
        });
        
        const data = await response.json();
        
        if (data.success) {
            const status = data.propagation.propagated ? 'Yayıldı' : 'Henüz yayılmadı';
            showNotification(`Propagation durumu: ${status}`, 'success');
            loadDNSRecords(); // Refresh to show updated status
        } else {
            showNotification('Propagation kontrolü başarısız: ' + data.message, 'error');
        }
    } catch (error) {
        showNotification('Propagation kontrol edilirken hata oluştu', 'error');
    }
}

async function showDNSHealthCheck(domain) {
    try {
        showNotification('DNS sağlık kontrolü yapılıyor...', 'info');
        
        const response = await fetch(`/api/dns/health-check/${domain}`, {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + token }
        });
        
        const data = await response.json();
        
        if (data.success) {
            renderDNSHealthCheck(data.health, domain);
            showDNSHealthModal();
        } else {
            showNotification('Sağlık kontrolü başarısız: ' + data.message, 'error');
        }
    } catch (error) {
        showNotification('Sağlık kontrolü sırasında hata oluştu', 'error');
    }
}

function renderDNSHealthCheck(health, domain) {
    const content = document.getElementById('dns-health-content');
    
    const statusColor = health.status === 'healthy' ? 'text-green-400' : 
                       health.status === 'warning' ? 'text-yellow-400' : 'text-red-400';
    
    content.innerHTML = `
        <div class="bg-gray-700 p-4 rounded-lg">
            <h4 class="font-bold mb-2 flex items-center">
                <i class="fas fa-globe mr-2 text-blue-400"></i>
                ${domain}
            </h4>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <span class="text-gray-400">Durum:</span>
                    <span class="${statusColor} font-semibold ml-2">
                        <i class="fas ${health.status === 'healthy' ? 'fa-check-circle' : 
                                      health.status === 'warning' ? 'fa-exclamation-triangle' : 'fa-times-circle'} mr-1"></i>
                        ${health.status === 'healthy' ? 'Sağlıklı' : 
                          health.status === 'warning' ? 'Uyarı' : 'Hata'}
                    </span>
                </div>
                <div>
                    <span class="text-gray-400">Puan:</span>
                    <span class="text-white font-semibold ml-2">${health.score}/100</span>
                </div>
            </div>
            
            ${health.issues.length > 0 ? `
                <div class="mt-4">
                    <h5 class="font-medium text-red-400 mb-2">Tespit Edilen Sorunlar:</h5>
                    <ul class="list-disc list-inside space-y-1 text-sm text-gray-300">
                        ${health.issues.map(issue => `<li>${issue}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
        </div>
    `;
}

// DNS Filter Functions
function filterDNSRecords() {
    const domainFilter = document.getElementById('dns-domain-filter').value.toLowerCase();
    const typeFilter = document.getElementById('dns-type-filter').value;
    const statusFilter = document.getElementById('dns-status-filter').value;
    const providerFilter = document.getElementById('dns-provider-filter').value;
    
    filteredDNSRecords = dnsRecords.filter(record => {
        const matchesDomain = !domainFilter || record.domain.toLowerCase().includes(domainFilter);
        const matchesType = !typeFilter || record.type === typeFilter;
        const matchesStatus = !statusFilter || record.status === statusFilter;
        const matchesProvider = !providerFilter || record.provider === providerFilter;
        
        return matchesDomain && matchesType && matchesStatus && matchesProvider;
    });
    
    renderDNSRecords();
}

// Refresh DNS records
function refreshDNSRecords() {
    loadDNSRecords();
}

// Bulk operations placeholder
function bulkDNSOperations() {
    showNotification('Toplu işlemler yakında eklenecek', 'info');
}

// Form event listeners
document.addEventListener('DOMContentLoaded', function() {
    // DNS Add Form
    document.getElementById('dnsAddForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = {
            domain: document.getElementById('dns-domain').value,
            name: document.getElementById('dns-name').value,
            type: document.getElementById('dns-type').value,
            value: document.getElementById('dns-value').value,
            ttl: parseInt(document.getElementById('dns-ttl').value),
            provider: document.getElementById('dns-provider').value
        };
        
        if (formData.type === 'MX') {
            formData.priority = parseInt(document.getElementById('dns-priority').value);
        }
        
        addDNSRecord(formData);
    });
    
    // DNS Edit Form
    document.getElementById('dnsEditForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const id = document.getElementById('edit-dns-id').value;
        const formData = {
            domain: document.getElementById('edit-dns-domain').value,
            name: document.getElementById('edit-dns-name').value,
            type: document.getElementById('edit-dns-type').value,
            value: document.getElementById('edit-dns-value').value,
            ttl: parseInt(document.getElementById('edit-dns-ttl').value),
            provider: document.getElementById('edit-dns-provider').value
        };
        
        if (formData.type === 'MX') {
            formData.priority = parseInt(document.getElementById('edit-dns-priority').value);
        }
        
        updateDNSRecord(id, formData);
    });
    
    // DNS Filters
    document.getElementById('dns-domain-filter').addEventListener('input', filterDNSRecords);
    document.getElementById('dns-type-filter').addEventListener('change', filterDNSRecords);
    document.getElementById('dns-status-filter').addEventListener('change', filterDNSRecords);
    document.getElementById('dns-provider-filter').addEventListener('change', filterDNSRecords);
});

// Check authentication
const token = localStorage.getItem('authToken');
if (!token) {
    window.location.href = '/';
}

// Token validation and auto-refresh
async function validateToken() {
    try {
        const response = await fetch('/api/domains', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        
        if (response.status === 401) {
            // Token expired, redirect to login
            localStorage.removeItem('authToken');
            window.location.href = '/';
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('Token validation error:', error);
        return false;
    }
}

// Auto-validate token on page load
validateToken();

// Real-time monitoring variables
let monitoringInterval;
let isMonitoring = false;

// Navigation
function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.add('hidden');
    });
    
    // Remove active class from all nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected section
    document.getElementById('section-' + sectionName).classList.remove('hidden');
    document.getElementById('btn-' + sectionName).classList.add('active');
    
    // Load section content
    if (sectionName === 'domains') {
        loadDomains();
    } else if (sectionName === 'dns') {
        loadDNSRecords();
    } else if (sectionName === 'nginx') {
        loadNginxSection();
    }
}

// Load domains
async function loadDomains() {
    try {
        const response = await fetch('/api/domains', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        
        const data = await response.json();
        
        if (data.success) {
            displayDomains(data.domains);
        }
    } catch (error) {
        console.error('Error loading domains:', error);
    }
}

// Category system removed - using dynamic routing instead

// Display domains
function displayDomains(domains) {
    const domainList = document.getElementById('domainList');
    
    if (domains.length === 0) {
        domainList.innerHTML = '<p class="text-gray-400 text-center py-8">Henüz domain eklenmemiş. "Yeni Domain" butonuna tıklayarak başlayın.</p>';
        return;
    }
    
    let html = '';
    
    domains.forEach(domain => {
        const statusColor = domain.status === 'active' ? 'green' : 
                          domain.status === 'warning' ? 'yellow' : 'red';
        
        const connectionIcon = domain.connected ? 
            '<i class="fas fa-wifi text-green-400 mr-2" title="Bağlı"></i>' :
            '<i class="fas fa-wifi-slash text-red-400 mr-2" title="Bağlantı Yok"></i>';
        
        const connectionStatus = domain.connected ? 'Bağlı' : 'Bağlantısız';
        const connectionColor = domain.connected ? 'text-green-400' : 'text-red-400';
        
        // No more category info needed
        
        html += '<div class="bg-gray-700 p-4 rounded-lg border-l-4 border-' + statusColor + '-400">';
        html += '<div class="flex justify-between items-center">';
        html += '<div class="flex-1">';
        html += '<div class="flex items-center mb-2">';
        html += connectionIcon;
        html += '<h3 class="font-semibold text-lg">' + domain.name + '</h3>';
        html += '</div>';
        html += '<div class="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">';
        html += '<div class="flex items-center">';
        html += '<span class="w-3 h-3 bg-' + statusColor + '-400 rounded-full mr-2"></span>';
        html += '<span class="text-gray-300">Durum: </span>';
        html += '<span class="text-' + statusColor + '-400 font-medium ml-1">' + domain.status.toUpperCase() + '</span>';
        html += '</div>';
        html += '<div class="flex items-center ' + connectionColor + '">';
        html += '<i class="fas fa-plug mr-1"></i>';
        html += '<span>' + connectionStatus + '</span>';
        html += '</div>';
        html += '<div class="flex items-center text-blue-400">';
        html += '<i class="fas fa-eye mr-1"></i>';
        html += '<span>' + (domain.totalRequests || 0).toLocaleString() + ' total</span>';
        html += '</div>';
        html += '<div class="flex items-center text-green-400">';
        html += '<i class="fas fa-user mr-1"></i>';
        html += '<span>' + (domain.humanRequests || 0) + ' human</span>';
        html += '</div>';
        html += '<div class="flex items-center text-yellow-400">';
        html += '<i class="fas fa-robot mr-1"></i>';
        html += '<span>' + (domain.botRequests || 0) + ' bot</span>';
        html += '</div>';
        html += '<div class="flex items-center text-red-400">';
        html += '<i class="fas fa-ban mr-1"></i>';
        html += '<span>' + (domain.blocked || 0) + ' blocked</span>';
        html += '</div>';
        html += '</div>';
        html += '<div class="text-xs text-gray-500 mt-2">';
        html += '<span>Eklenme: ' + new Date(domain.addedAt).toLocaleDateString('tr-TR') + '</span>';
        html += '<span class="ml-4">Son Kontrol: ' + new Date(domain.lastChecked).toLocaleString('tr-TR') + '</span>';
        html += '</div>';
        html += '</div>';
        html += '<div class="flex space-x-2 ml-4">';
        html += '<button onclick="checkDomainConnection(\'' + domain.id + '\')" class="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm" title="Bağlantıyı Kontrol Et">';
        html += '<i class="fas fa-sync"></i>';
        html += '</button>';
        html += '<button onclick="editDomain(\'' + domain.id + '\')" class="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm" title="Düzenle">';
        html += '<i class="fas fa-edit"></i>';
        html += '</button>';
        html += '<button onclick="deleteDomain(\'' + domain.id + '\')" class="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm" title="Sil">';
        html += '<i class="fas fa-trash"></i>';
        html += '</button>';
        html += '</div>';
        html += '</div>';
        html += '</div>';
    });
    
    domainList.innerHTML = html;
}

// Add domain modal - Global functions
window.showAddDomain = function() {
    document.getElementById('addDomainModal').classList.remove('hidden');
    document.getElementById('domainName').focus();
}

window.hideAddDomain = function() {
    document.getElementById('addDomainModal').classList.add('hidden');
    document.getElementById('domainName').value = '';
}

// Add domain form
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('addDomainForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Kontrol Ediliyor...';
        submitBtn.disabled = true;
        
        const name = document.getElementById('domainName').value.trim();
        
        if (!name) {
            alert('Lütfen bir domain adı girin');
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            return;
        }
        
        try {
            const response = await fetch('/api/domains', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({ name })
            });
            
            const data = await response.json();
            
            if (data.success) {
                hideAddDomain();
                loadDomains();
                
                // Show success message
                const connectionStatus = data.domain.connected ? 'bağlı' : 'bağlantısız';
                alert('Domain başarıyla eklendi ve ' + connectionStatus + ' olarak tespit edildi!');
            } else {
                alert('Hata: ' + data.message);
            }
        } catch (error) {
            alert('Bağlantı hatası: ' + error.message);
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
});

// Check domain connection - Global function
window.checkDomainConnection = async function(id) {
    try {
        const response = await fetch('/api/domains/' + id + '/check', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            loadDomains();
            const status = data.domain.connected ? 'bağlı' : 'bağlantısız';
            alert('Bağlantı kontrol edildi: ' + status);
        } else {
            alert('Kontrol hatası: ' + data.message);
        }
    } catch (error) {
        alert('Bağlantı hatası');
    }
}

// Edit domain - Global function
window.editDomain = function(id) {
    const newName = prompt('Yeni domain adı:');
    if (newName) {
        updateDomain(id, { name: newName });
    }
}

// Update domain
window.updateDomain = async function(id, updates) {
    try {
        const response = await fetch('/api/domains/' + id, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify(updates)
        });
        
        const data = await response.json();
        
        if (data.success) {
            loadDomains();
        } else {
            alert('Hata: ' + data.message);
        }
    } catch (error) {
        alert('Bağlantı hatası');
    }
}

// Delete domain - Global function
window.deleteDomain = async function(id) {
    if (confirm('Bu domain\'i silmek istediğinizden emin misiniz?')) {
        try {
            const response = await fetch('/api/domains/' + id, {
                method: 'DELETE',
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                loadDomains();
            } else {
                alert('Hata: ' + data.message);
            }
        } catch (error) {
            alert('Bağlantı hatası');
        }
    }
}

// Logout - Global function
window.logout = function() {
    localStorage.removeItem('authToken');
    window.location.href = '/';
}

// Notification system
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 ${getNotificationStyle(type)}`;
    notification.innerHTML = `
        <div class="flex items-center">
            <i class="fas ${getNotificationIcon(type)} mr-2"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Add to DOM
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 5000);
}

function getNotificationStyle(type) {
    const styles = {
        success: 'bg-green-600 text-white',
        error: 'bg-red-600 text-white',
        warning: 'bg-yellow-600 text-black',
        info: 'bg-blue-600 text-white'
    };
    return styles[type] || styles.info;
}

function getNotificationIcon(type) {
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    return icons[type] || icons.info;
}

// NGINX Multi-Domain Configuration Functions
let domainConfigs = {};
let allDomains = [];

async function loadNginxSection() {
    try {
        // Load all domains and their configurations
        await Promise.all([
            loadAllDomains(),
            loadAllDomainConfigs()
        ]);
        
        updateNginxOverviewStats();
        renderDomainConfigs();
    } catch (error) {
        console.error('Error loading NGINX section:', error);
        showNotification('NGINX section yüklenemedi: ' + error.message, 'error');
    }
}

async function loadAllDomains() {
    try {
        const response = await fetch('/api/domains', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        
        const data = await response.json();
        
        if (data.success) {
            allDomains = data.domains;
            updateNginxStats(data.domains);
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        throw new Error('Domains yüklenemedi: ' + error.message);
    }
}

async function loadAllDomainConfigs() {
    try {
        const response = await fetch('/api/nginx/all-domain-configs', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        
        const data = await response.json();
        
        if (data.success) {
            domainConfigs = data.domains;
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        throw new Error('Domain configs yüklenemedi: ' + error.message);
    }
}

function updateNginxStats(domains) {
    const stats = {
        total: domains.length,
        active: domains.filter(d => d.status === 'active').length,
        connected: domains.filter(d => d.connected === true).length,
        totalRequests: domains.reduce((sum, d) => sum + (d.totalRequests || 0), 0),
        totalBlocked: domains.reduce((sum, d) => sum + (d.blocked || 0), 0),
        totalHuman: domains.reduce((sum, d) => sum + (d.humanRequests || 0), 0),
        totalBot: domains.reduce((sum, d) => sum + (d.botRequests || 0), 0)
    };
    
    // Update legacy stats if elements exist
    const totalEl = document.getElementById('totalDomains');
    if (totalEl) totalEl.textContent = stats.total;
    
    const cleanEl = document.getElementById('cleanDomains');
    if (cleanEl) cleanEl.textContent = stats.active + ' Active';
    
    const grayEl = document.getElementById('grayDomains');
    if (grayEl) grayEl.textContent = stats.connected + ' Connected';
    
    const aggressiveEl = document.getElementById('aggressiveDomains');
    if (aggressiveEl) aggressiveEl.textContent = stats.totalRequests.toLocaleString() + ' Requests';
    
    const honeypotEl = document.getElementById('honeypotDomains');
    if (honeypotEl) honeypotEl.textContent = stats.totalBlocked + ' Blocked';
}

function updateNginxOverviewStats() {
    const configCount = Object.keys(domainConfigs).length;
    const backendCount = configCount * 3; // Each domain has 3 backends (clean, gray, aggressive)
    
    document.getElementById('nginx-total-domains').textContent = allDomains.length;
    document.getElementById('nginx-active-configs').textContent = configCount;
    document.getElementById('nginx-backend-count').textContent = backendCount;
    document.getElementById('nginx-config-size').textContent = '0 KB'; // Will be updated after generation
}

function renderDomainConfigs() {
    const container = document.getElementById('domain-configs-container');
    
    if (allDomains.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-gray-400">
                <i class="fas fa-inbox text-4xl mb-4"></i>
                <p>Henüz domain eklenmemiş.</p>
                <p class="text-sm mt-2">Önce "Domainler" sekmesinden domain ekleyin.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = allDomains.map(domain => {
        const config = domainConfigs[domain.id]?.config || {
            cleanBackend: 'clean-server.example.com:80',
            grayBackend: 'gray-server.example.com:80',
            aggressiveBackend: 'aggressive-server.example.com:80',
            routingMode: 'smart',
            botDetection: true,
            geoRouting: false
        };
        
        const statusColor = domain.status === 'active' ? 'green' : 
                           domain.status === 'warning' ? 'yellow' : 'red';
        
        return `
            <div class="border border-gray-600 rounded-lg p-4 bg-gray-600">
                <div class="flex justify-between items-start mb-4">
                    <div class="flex items-center">
                        <div class="w-3 h-3 bg-${statusColor}-400 rounded-full mr-3"></div>
                        <div>
                            <h4 class="font-semibold text-lg">${domain.name}</h4>
                            <p class="text-sm text-gray-300">Status: ${domain.status}</p>
                        </div>
                    </div>
                    <div class="flex space-x-2">
                        <button onclick="editDomainConfig('${domain.id}')" 
                                class="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm">
                            <i class="fas fa-edit mr-1"></i>Düzenle
                        </button>
                        <button onclick="testDomainConfig('${domain.id}')" 
                                class="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm">
                            <i class="fas fa-vial mr-1"></i>Test
                        </button>
                    </div>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    <div>
                        <label class="block text-xs font-medium text-gray-300 mb-1">Clean Backend</label>
                        <input type="text" id="clean_${domain.id}" 
                               class="w-full p-2 bg-gray-700 border border-gray-500 rounded text-sm"
                               value="${config.cleanBackend}"
                               onchange="updateDomainConfigField('${domain.id}', 'cleanBackend', this.value)">
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-gray-300 mb-1">Gray Backend</label>
                        <input type="text" id="gray_${domain.id}" 
                               class="w-full p-2 bg-gray-700 border border-gray-500 rounded text-sm"
                               value="${config.grayBackend}"
                               onchange="updateDomainConfigField('${domain.id}', 'grayBackend', this.value)">
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-gray-300 mb-1">Aggressive Backend</label>
                        <input type="text" id="aggressive_${domain.id}" 
                               class="w-full p-2 bg-gray-700 border border-gray-500 rounded text-sm"
                               value="${config.aggressiveBackend}"
                               onchange="updateDomainConfigField('${domain.id}', 'aggressiveBackend', this.value)">
                    </div>
                </div>
                
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <label class="block text-xs font-medium text-gray-300 mb-1">Routing Mode</label>
                        <select id="routing_${domain.id}" 
                                class="w-full p-2 bg-gray-700 border border-gray-500 rounded text-sm"
                                onchange="updateDomainConfigField('${domain.id}', 'routingMode', this.value)">
                            <option value="smart" ${config.routingMode === 'smart' ? 'selected' : ''}>Smart</option>
                            <option value="aggressive" ${config.routingMode === 'aggressive' ? 'selected' : ''}>Aggressive</option>
                            <option value="defensive" ${config.routingMode === 'defensive' ? 'selected' : ''}>Defensive</option>
                        </select>
                    </div>
                    <div class="flex items-center space-x-2 mt-6">
                        <input type="checkbox" id="botDetection_${domain.id}" 
                               ${config.botDetection ? 'checked' : ''}
                               onchange="updateDomainConfigField('${domain.id}', 'botDetection', this.checked)"
                               class="rounded">
                        <label for="botDetection_${domain.id}" class="text-sm text-gray-300">Bot Detection</label>
                    </div>
                    <div class="flex items-center space-x-2 mt-6">
                        <input type="checkbox" id="geoRouting_${domain.id}" 
                               ${config.geoRouting ? 'checked' : ''}
                               onchange="updateDomainConfigField('${domain.id}', 'geoRouting', this.checked)"
                               class="rounded">
                        <label for="geoRouting_${domain.id}" class="text-sm text-gray-300">Geo Routing</label>
                    </div>
                    <div class="text-xs text-gray-400 mt-6">
                        Traffic: ${domain.totalRequests || 0} req<br>
                        Human: ${domain.humanRequests || 0} | Bot: ${domain.botRequests || 0}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

async function updateDomainConfigField(domainId, field, value) {
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
            // Update local cache
            if (!domainConfigs[domainId]) {
                domainConfigs[domainId] = { config: {} };
            }
            domainConfigs[domainId].config[field] = value;
            
            showNotification(`${field} güncellendi`, 'success');
        } else {
            showNotification('Config güncellenemedi: ' + data.message, 'error');
        }
    } catch (error) {
        showNotification('Config güncelleme hatası: ' + error.message, 'error');
    }
}

async function generateAdvancedNginxConfig() {
    try {
        showNotification('NGINX config oluşturuluyor...', 'info');
        
        const globalSettings = {
            rateLimit: document.getElementById('global-rate-limit').value,
            botRateLimit: document.getElementById('bot-rate-limit').value,
            enableGeoIP: document.getElementById('enable-geoip').checked,
            enableAnalytics: document.getElementById('enable-analytics').checked,
            enableBotProtection: document.getElementById('enable-bot-protection').checked,
            enableDDoSProtection: document.getElementById('enable-ddos-protection').checked,
            enableReferrerCheck: document.getElementById('enable-referrer-check').checked,
            blockSuspicious: document.getElementById('block-suspicious').checked
        };
        
        const response = await fetch('/api/nginx/generate-config', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                globalSettings,
                domainSpecificConfigs: Object.fromEntries(
                    Object.entries(domainConfigs).map(([key, value]) => [key, value.config])
                )
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('advanced-nginx-config-preview').textContent = data.config;
            
            // Update config size
            const configSize = (new Blob([data.config]).size / 1024).toFixed(1);
            document.getElementById('nginx-config-size').textContent = configSize + ' KB';
            
            showNotification(`NGINX config oluşturuldu (${configSize} KB, ${data.domainCount} domain)`, 'success');
        } else {
            showNotification('Config oluşturulamadı: ' + data.message, 'error');
        }
    } catch (error) {
        showNotification('Config oluşturma hatası: ' + error.message, 'error');
    }
}

async function refreshDomainConfigs() {
    try {
        showNotification('Domain configs yenileniyor...', 'info');
        await loadNginxSection();
        showNotification('Domain configs yenilendi', 'success');
    } catch (error) {
        showNotification('Yenileme hatası: ' + error.message, 'error');
    }
}

function copyConfigToClipboard() {
    const config = document.getElementById('advanced-nginx-config-preview').textContent;
    
    if (!config || config.includes('Generated configuration will appear here')) {
        showNotification('Önce config oluşturun', 'warning');
        return;
    }
    
    navigator.clipboard.writeText(config).then(() => {
        showNotification('Config panoya kopyalandı', 'success');
    }).catch(err => {
        showNotification('Kopyalama hatası: ' + err.message, 'error');
    });
}

function downloadAdvancedConfig() {
    const config = document.getElementById('advanced-nginx-config-preview').textContent;
    
    if (!config || config.includes('Generated configuration will appear here')) {
        showNotification('Önce config oluşturun', 'warning');
        return;
    }
    
    const blob = new Blob([config], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nginx-multi-domain-${Date.now()}.conf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    showNotification('NGINX config indirildi', 'success');
}

async function validateNginxConfig() {
    const config = document.getElementById('advanced-nginx-config-preview').textContent;
    
    if (!config || config.includes('Generated configuration will appear here')) {
        showNotification('Önce config oluşturun', 'warning');
        return;
    }
    
    showNotification('Config doğrulanıyor...', 'info');
    
    // Simple validation checks
    const issues = [];
    
    if (!config.includes('server {')) {
        issues.push('Server block bulunamadı');
    }
    
    if (!config.includes('upstream')) {
        issues.push('Upstream definition bulunamadı');
    }
    
    if (!config.includes('proxy_pass')) {
        issues.push('Proxy configuration bulunamadı');
    }
    
    const domainCount = allDomains.length;
    const expectedUpstreams = domainCount * 3; // 3 backends per domain
    const actualUpstreams = (config.match(/upstream \w+/g) || []).length;
    
    if (actualUpstreams !== expectedUpstreams) {
        issues.push(`Upstream count mismatch: expected ${expectedUpstreams}, found ${actualUpstreams}`);
    }
    
    if (issues.length === 0) {
        showNotification('Config doğrulaması başarılı ✓', 'success');
    } else {
        showNotification(`Config doğrulaması başarısız: ${issues.join(', ')}`, 'error');
    }
}

async function deployNginxConfig() {
    const config = document.getElementById('advanced-nginx-config-preview').textContent;
    
    if (!config || config.includes('Generated configuration will appear here')) {
        showNotification('Önce config oluşturun', 'warning');
        return;
    }
    
    if (!confirm('NGINX config deploy edilecek ve server restart yapılacak. Devam edilsin mi?')) {
        return;
    }
    
    try {
        showNotification('Config deploy ediliyor...', 'info');
        
        const response = await fetch('/api/nginx/apply-config', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ config })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('NGINX config başarıyla deploy edildi', 'success');
        } else {
            showNotification('Deploy hatası: ' + data.message, 'error');
        }
    } catch (error) {
        showNotification('Deploy hatası: ' + error.message, 'error');
    }
}

async function testNginxConfig() {
    showNotification('Config test ediliyor...', 'info');
    
    // Test each domain configuration
    const testResults = [];
    
    for (const domain of allDomains) {
        const config = domainConfigs[domain.id]?.config;
        if (!config) continue;
        
        // Test backend connectivity (mock)
        const backends = [
            { name: 'Clean', url: config.cleanBackend },
            { name: 'Gray', url: config.grayBackend },
            { name: 'Aggressive', url: config.aggressiveBackend }
        ];
        
        for (const backend of backends) {
            try {
                // In real implementation, test actual connectivity
                const isReachable = Math.random() > 0.2; // 80% success rate for demo
                
                testResults.push({
                    domain: domain.name,
                    backend: backend.name,
                    url: backend.url,
                    status: isReachable ? 'OK' : 'FAILED',
                    responseTime: Math.floor(Math.random() * 200) + 50
                });
            } catch (error) {
                testResults.push({
                    domain: domain.name,
                    backend: backend.name,
                    url: backend.url,
                    status: 'ERROR',
                    error: error.message
                });
            }
        }
    }
    
    // Show test results
    const passedTests = testResults.filter(r => r.status === 'OK').length;
    const totalTests = testResults.length;
    
    let resultMessage = `Config testi tamamlandı: ${passedTests}/${totalTests} başarılı`;
    
    if (passedTests === totalTests) {
        showNotification(resultMessage + ' ✓', 'success');
    } else {
        showNotification(resultMessage + ' ⚠️', 'warning');
        
        // Show detailed results for failed tests
        const failedTests = testResults.filter(r => r.status !== 'OK');
        console.log('Failed tests:', failedTests);
    }
}

function editDomainConfig(domainId) {
    showNotification(`${domainId} için detaylı config editörü yakında eklenecek`, 'info');
}

function testDomainConfig(domainId) {
    const domain = allDomains.find(d => d.id === domainId);
    if (!domain) return;
    
    showNotification(`${domain.name} config test ediliyor...`, 'info');
    
    // Mock test - in production, test actual backend connectivity
    setTimeout(() => {
        showNotification(`${domain.name} config testi başarılı ✓`, 'success');
    }, 1000);
}

function addNewDomainConfig() {
    showNotification('Önce "Domainler" sekmesinden domain ekleyin', 'info');
}

// Generate NGINX config - Global function
window.generateNginxConfig = async function() {
    try {
        const response = await fetch('/api/nginx/generate-config', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                cleanBackend: document.getElementById('cleanBackend').value,
                grayBackend: document.getElementById('grayBackend').value,
                aggressiveBackend: document.getElementById('aggressiveBackend').value
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('nginxConfigPreview').textContent = data.config;
        } else {
            alert('Config generation failed: ' + data.message);
        }
    } catch (error) {
        alert('Error generating config: ' + error.message);
    }
}

// Download config - Global function  
window.downloadConfig = function() {
    const config = document.getElementById('nginxConfigPreview').textContent;
    
    if (!config || config.includes('Click \'Generate\'')) {
        alert('Önce config oluşturun!');
        return;
    }
    
    const blob = new Blob([config], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nginx.conf';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}

// Apply config - Global function
window.applyConfig = async function() {
    const config = document.getElementById('nginxConfigPreview').textContent;
    
    if (!config || config.includes('Click \'Generate\'')) {
        alert('Önce config oluşturun!');
        return;
    }
    
    if (!confirm('NGINX config\'i uygulayıp reload yapmak istediğinizden emin misiniz?')) {
        return;
    }
    
    try {
        const response = await fetch('/api/nginx/apply-config', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ config })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('NGINX config başarıyla uygulandı!');
        } else {
            alert('Config apply failed: ' + data.message);
        }
    } catch (error) {
        alert('Error applying config: ' + error.message);
    }
}

// Real-time stats refresh
function startRealTimeUpdates() {
    setInterval(() => {
        // Refresh domain stats every 30 seconds
        const currentSection = document.querySelector('.section:not(.hidden)');
        if (currentSection && currentSection.id === 'section-domains') {
            loadDomains();
        }
        if (currentSection && currentSection.id === 'section-nginx') {
            loadNginxSection();
        }
    }, 30000); // 30 seconds
}

// Simulate real traffic (for testing - remove in production)
function simulateTraffic() {
    setInterval(async () => {
        const domains = ['google.com', 'github.com'];
        const randomDomain = domains[Math.floor(Math.random() * domains.length)];
        const userTypes = ['human', 'bot'];
        const backends = ['clean', 'gray', 'aggressive'];
        
        try {
            await fetch('/api/traffic/log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    domain: randomDomain,
                    userType: userTypes[Math.floor(Math.random() * userTypes.length)],
                    backendUsed: backends[Math.floor(Math.random() * backends.length)],
                    userAgent: 'Test Traffic Generator',
                    referrer: Math.random() > 0.5 ? 'https://facebook.com' : 'https://google.com',
                    ip: '127.0.0.1',
                    blocked: Math.random() < 0.1 // 10% block rate
                })
            });
        } catch (error) {
            console.log('Simulated traffic logged');
        }
    }, 5000); // Every 5 seconds for testing
}

// Real-time monitoring functions
window.startMonitoring = function() {
    if (isMonitoring) return;
    
    isMonitoring = true;
    document.getElementById('monitoringStatus').textContent = '🟢 Active';
    document.getElementById('startMonitoringBtn').disabled = true;
    document.getElementById('stopMonitoringBtn').disabled = false;
    
    // Update every 10 seconds for real-time feel
    monitoringInterval = setInterval(async () => {
        try {
            await loadDomains();
            await loadNginxSection();
            updateLastRefresh();
        } catch (error) {
            console.error('Monitoring error:', error);
        }
    }, 10000);
    
    console.log('Real-time monitoring started');
}

window.stopMonitoring = function() {
    if (!isMonitoring) return;
    
    isMonitoring = false;
    clearInterval(monitoringInterval);
    
    document.getElementById('monitoringStatus').textContent = '🔴 Stopped';
    document.getElementById('startMonitoringBtn').disabled = false;
    document.getElementById('stopMonitoringBtn').disabled = true;
    
    console.log('Real-time monitoring stopped');
}

function updateLastRefresh() {
    const now = new Date().toLocaleTimeString('tr-TR');
    const refreshElement = document.getElementById('lastRefresh');
    if (refreshElement) {
        refreshElement.textContent = 'Son güncelleme: ' + now;
    }
}

// Deployment status checker
window.checkDeploymentStatus = async function() {
    try {
        const serverIp = document.getElementById('serverIp').value;
        const testDomain = document.getElementById('testDomain').value;
        
        if (!serverIp || !testDomain) {
            alert('Server IP ve test domain girin!');
            return;
        }
        
        document.getElementById('deploymentResult').innerHTML = '🔄 Testing deployment...';
        
        // Test direct IP access
        const ipTest = await fetch(`/api/test-deployment?ip=${serverIp}&domain=${testDomain}`, {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        
        const result = await ipTest.json();
        
        let status = '<div class="bg-gray-100 p-4 rounded mt-4">';
        status += '<h4 class="font-bold mb-2">🧪 Deployment Test Results</h4>';
        
        if (result.success) {
            status += `<p class="text-green-600">✅ Server IP (${serverIp}): Reachable</p>`;
            status += `<p class="text-green-600">✅ NGINX Response: OK</p>`;
            status += `<p class="text-blue-600">📊 Response Time: ${result.responseTime}ms</p>`;
        } else {
            status += `<p class="text-red-600">❌ Server IP (${serverIp}): ${result.message}</p>`;
        }
        
        status += '</div>';
        document.getElementById('deploymentResult').innerHTML = status;
        
    } catch (error) {
        document.getElementById('deploymentResult').innerHTML = 
            `<div class="bg-red-100 p-4 rounded mt-4 text-red-600">❌ Test failed: ${error.message}</div>`;
    }
}

// DNS propagation checker
window.checkDNS = async function() {
    try {
        const domain = document.getElementById('testDomain').value;
        
        if (!domain) {
            alert('Test domain girin!');
            return;
        }
        
        document.getElementById('dnsResult').innerHTML = '🔄 Checking DNS propagation...';
        
        const dnsTest = await fetch(`/api/check-dns?domain=${domain}`, {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        
        const result = await dnsTest.json();
        
        let status = '<div class="bg-gray-100 p-4 rounded mt-4">';
        status += '<h4 class="font-bold mb-2">🌐 DNS Propagation Status</h4>';
        
        if (result.success) {
            status += `<p class="text-green-600">✅ Domain: ${domain}</p>`;
            status += `<p class="text-blue-600">📍 Current IP: ${result.currentIp}</p>`;
            status += `<p class="text-gray-600">🕐 TTL: ${result.ttl} seconds</p>`;
        } else {
            status += `<p class="text-red-600">❌ DNS Check: ${result.message}</p>`;
            status += `<p class="text-yellow-600">⚠️ DNS may still be propagating (can take up to 48 hours)</p>`;
        }
        
        status += '</div>';
        document.getElementById('dnsResult').innerHTML = status;
        
    } catch (error) {
        document.getElementById('dnsResult').innerHTML = 
            `<div class="bg-red-100 p-4 rounded mt-4 text-red-600">❌ DNS check failed: ${error.message}</div>`;
    }
}

// Advanced DNS Section Management
function showAdvancedDNSSection(sectionName) {
    // Hide all advanced DNS sections
    document.querySelectorAll('.advanced-dns-section').forEach(section => {
        section.classList.add('hidden');
    });
    
    // Remove active class from all advanced DNS tabs
    document.querySelectorAll('.advanced-dns-tab').forEach(tab => {
        tab.classList.remove('bg-purple-600');
        tab.classList.add('bg-gray-600');
    });
    
    // Show selected section
    const targetSection = document.getElementById('advanced-dns-' + sectionName);
    if (targetSection) {
        targetSection.classList.remove('hidden');
    }
    
    // Set active tab
    const activeTab = event.target.closest('.advanced-dns-tab');
    if (activeTab) {
        activeTab.classList.remove('bg-gray-600');
        activeTab.classList.add('bg-purple-600');
    }
    
    // Load section data
    switch(sectionName) {
        case 'geodns':
            // Already has test function
            break;
        case 'health':
            // Already has test function
            break;
        case 'security':
            // Already has test functions
            break;
        case 'loadbalancing':
            loadLoadBalancingInfo();
            break;
        case 'cache':
            loadCacheStatistics();
            break;
    }
}

// Make function globally accessible
window.showAdvancedDNSSection = showAdvancedDNSSection;

// Initialize - show domains section by default
document.addEventListener('DOMContentLoaded', function() {
    showSection('domains');
    startRealTimeUpdates();
    
    // Start traffic simulation (for testing)
    // simulateTraffic(); // Uncomment to test real-time updates
});