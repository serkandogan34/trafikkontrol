// Dashboard JavaScript - External file to avoid template literal issues

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

// NGINX Functions
async function loadNginxSection() {
    // Load current domain statistics
    try {
        const response = await fetch('/api/domains', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        
        const data = await response.json();
        
        if (data.success) {
            updateNginxStats(data.domains);
        }
    } catch (error) {
        console.error('Error loading NGINX section:', error);
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
    
    document.getElementById('totalDomains').textContent = stats.total;
    document.getElementById('cleanDomains').textContent = stats.active + ' Active';
    document.getElementById('grayDomains').textContent = stats.connected + ' Connected';  
    document.getElementById('aggressiveDomains').textContent = stats.totalRequests.toLocaleString() + ' Requests';
    document.getElementById('honeypotDomains').textContent = stats.totalBlocked + ' Blocked';
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

// Initialize - show domains section by default
document.addEventListener('DOMContentLoaded', function() {
    showSection('domains');
    startRealTimeUpdates();
    
    // Start traffic simulation (for testing)
    // simulateTraffic(); // Uncomment to test real-time updates
});