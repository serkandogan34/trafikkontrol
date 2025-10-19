/**
 * Traffic Management Dashboard JavaScript
 * Handles API calls, data visualization, and UI interactions
 */

// ================================
// CONFIGURATION
// ================================

const CONFIG = {
    API_BASE_URL: window.location.origin.includes('3002')
        ? window.location.origin.replace('3002', '3001')
        : window.location.protocol + '//' + window.location.host.replace(':3002', ':3001'),
    REFRESH_INTERVAL: 30000, // 30 seconds
    CHART_COLORS: {
        primary: '#6366f1',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        info: '#3b82f6',
        purple: '#8b5cf6'
    }
};

// ================================
// STATE MANAGEMENT
// ================================

const AppState = {
    data: {
        dashboard: null,
        traffic: [],
        domains: [],
        analytics: null
    },
    charts: {
        traffic: null,
        backend: null
    },
    refreshInterval: null
};

// ================================
// API SERVICE
// ================================

class ApiService {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }

    async request(endpoint, options = {}) {
        try {
            const url = `${this.baseUrl}${endpoint}`;
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error(`API Error (${endpoint}):`, error);
            throw error;
        }
    }

    // Dashboard APIs
    async getDashboardStats() {
        return this.request('/api/v1/analytics/dashboard');
    }

    async getRealtimeAnalytics() {
        return this.request('/api/v1/analytics/realtime');
    }

    async getBackendStats(domainId = null) {
        const params = domainId ? `?domain_id=${domainId}` : '';
        return this.request(`/api/v1/analytics/backends${params}`);
    }

    async getRecentTraffic(limit = 10) {
        return this.request(`/api/v1/traffic/recent?limit=${limit}`);
    }

    async getDomains(page = 1, limit = 10) {
        return this.request(`/api/v1/domains?page=${page}&limit=${limit}`);
    }

    async getHealth() {
        return this.request('/api/v1/health');
    }
}

const api = new ApiService(CONFIG.API_BASE_URL);

// ================================
// TOAST NOTIFICATIONS
// ================================

class ToastManager {
    constructor() {
        this.container = document.getElementById('toastContainer');
    }

    show(message, type = 'info', title = null) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type} fade-in`;

        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };

        toast.innerHTML = `
            <i class="fas ${icons[type]} toast-icon text-${type}"></i>
            <div class="toast-content">
                ${title ? `<div class="toast-title">${title}</div>` : ''}
                <div class="toast-message">${message}</div>
            </div>
        `;

        this.container.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    }

    success(message, title = 'Success') {
        this.show(message, 'success', title);
    }

    error(message, title = 'Error') {
        this.show(message, 'error', title);
    }

    warning(message, title = 'Warning') {
        this.show(message, 'warning', title);
    }

    info(message, title = 'Info') {
        this.show(message, 'info', title);
    }
}

const toast = new ToastManager();

// ================================
// UTILITY FUNCTIONS
// ================================

function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;

    // Less than 1 minute
    if (diff < 60000) {
        return 'Just now';
    }

    // Less than 1 hour
    if (diff < 3600000) {
        const minutes = Math.floor(diff / 60000);
        return `${minutes}m ago`;
    }

    // Less than 24 hours
    if (diff < 86400000) {
        const hours = Math.floor(diff / 3600000);
        return `${hours}h ago`;
    }

    // More than 24 hours
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getBotScoreClass(score) {
    if (score < 30) return 'bot-score-low';
    if (score < 70) return 'bot-score-medium';
    return 'bot-score-high';
}

function getBackendClass(backend) {
    const map = {
        'clean': 'backend-clean',
        'gray': 'backend-gray',
        'aggressive': 'backend-aggressive'
    };
    return map[backend] || 'backend-clean';
}

// ================================
// CHART INITIALIZATION
// ================================

function initTrafficChart() {
    const ctx = document.getElementById('trafficChart');
    if (!ctx) return null;

    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Total Requests',
                    data: [],
                    borderColor: CONFIG.CHART_COLORS.primary,
                    backgroundColor: CONFIG.CHART_COLORS.primary + '20',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Bot Requests',
                    data: [],
                    borderColor: CONFIG.CHART_COLORS.danger,
                    backgroundColor: CONFIG.CHART_COLORS.danger + '20',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: '#cbd5e1',
                        font: { size: 12 },
                        usePointStyle: true
                    }
                },
                tooltip: {
                    backgroundColor: '#1e293b',
                    titleColor: '#f1f5f9',
                    bodyColor: '#cbd5e1',
                    borderColor: '#334155',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: true
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: '#334155',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#94a3b8',
                        font: { size: 11 }
                    }
                },
                x: {
                    grid: {
                        color: '#334155',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#94a3b8',
                        font: { size: 11 }
                    }
                }
            }
        }
    });
}

function initBackendChart() {
    const ctx = document.getElementById('backendChart');
    if (!ctx) return null;

    return new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Clean', 'Gray', 'Aggressive'],
            datasets: [{
                data: [0, 0, 0],
                backgroundColor: [
                    CONFIG.CHART_COLORS.success,
                    CONFIG.CHART_COLORS.warning,
                    CONFIG.CHART_COLORS.danger
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#cbd5e1',
                        font: { size: 12 },
                        padding: 15,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    backgroundColor: '#1e293b',
                    titleColor: '#f1f5f9',
                    bodyColor: '#cbd5e1',
                    borderColor: '#334155',
                    borderWidth: 1,
                    padding: 12
                }
            }
        }
    });
}

// ================================
// DATA LOADING FUNCTIONS
// ================================

async function loadDashboardStats() {
    try {
        const response = await api.getDashboardStats();
        
        if (response.success && response.data) {
            const data = response.data;
            AppState.data.dashboard = data;

            // Update statistics cards
            document.getElementById('totalDomains').textContent = data.totalDomains || 0;
            document.getElementById('activeDomains').textContent = data.activeDomains || 0;
            document.getElementById('totalRequests').textContent = formatNumber(data.totalRequests || 0);

            // Last 24h stats
            if (data.last24h) {
                document.getElementById('requests24h').textContent = formatNumber(data.last24h.requests || 0);
                document.getElementById('botPercentage').textContent = 
                    (data.last24h.botPercentage || 0).toFixed(1) + '%';
                document.getElementById('botsBlocked').textContent = formatNumber(data.last24h.bots || 0);
                document.getElementById('avgResponseTime').textContent = 
                    Math.round(data.last24h.avgResponseTime || 0) + 'ms';
            }

            return data;
        }
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
        toast.error('Failed to load dashboard statistics');
    }
}

async function loadRecentTraffic() {
    try {
        const response = await api.getRecentTraffic(10);
        
        if (response.success && response.data) {
            AppState.data.traffic = response.data;
            renderTrafficTable(response.data);
        }
    } catch (error) {
        console.error('Error loading recent traffic:', error);
        toast.error('Failed to load recent traffic');
    }
}

async function loadBackendStats() {
    try {
        // Get backend stats across all domains (summary)
        const response = await api.getBackendStats();
        
        if (response.success && response.data) {
            const data = response.data;
            
            // Update backend statistics
            const clean = data.distribution.clean || { count: 0, percentage: 0 };
            const gray = data.distribution.gray || { count: 0, percentage: 0 };
            const aggressive = data.distribution.aggressive || { count: 0, percentage: 0 };

            // Update progress bars
            document.getElementById('cleanPercentage').textContent = clean.percentage.toFixed(1) + '%';
            document.getElementById('cleanProgress').style.width = clean.percentage + '%';
            document.getElementById('cleanCount').textContent = formatNumber(clean.count);

            document.getElementById('grayPercentage').textContent = gray.percentage.toFixed(1) + '%';
            document.getElementById('grayProgress').style.width = gray.percentage + '%';
            document.getElementById('grayCount').textContent = formatNumber(gray.count);

            document.getElementById('aggressivePercentage').textContent = aggressive.percentage.toFixed(1) + '%';
            document.getElementById('aggressiveProgress').style.width = aggressive.percentage + '%';
            document.getElementById('aggressiveCount').textContent = formatNumber(aggressive.count);

            // Update backend chart
            if (AppState.charts.backend) {
                AppState.charts.backend.data.datasets[0].data = [
                    clean.count,
                    gray.count,
                    aggressive.count
                ];
                AppState.charts.backend.update();
            }
        }
    } catch (error) {
        console.error('Error loading backend stats:', error);
        toast.error('Failed to load backend statistics');
    }
}

async function loadRealtimeAnalytics() {
    try {
        const response = await api.getRealtimeAnalytics();
        
        if (response.success && response.data) {
            const data = response.data;
            
            // Update traffic chart with hourly data
            if (AppState.charts.traffic && data.hourly) {
                const labels = data.hourly.map(item => {
                    const date = new Date(item.hour);
                    return date.getHours() + ':00';
                });

                const totalRequests = data.hourly.map(item => item.requests);
                const botRequests = data.hourly.map(item => item.bot_requests || 0);

                AppState.charts.traffic.data.labels = labels;
                AppState.charts.traffic.data.datasets[0].data = totalRequests;
                AppState.charts.traffic.data.datasets[1].data = botRequests;
                AppState.charts.traffic.update();
            }
        }
    } catch (error) {
        console.error('Error loading realtime analytics:', error);
    }
}

// ================================
// RENDER FUNCTIONS
// ================================

function renderTrafficTable(traffic) {
    const tbody = document.querySelector('#recentTrafficTable tbody');
    
    if (!traffic || traffic.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center">
                    <div style="padding: 2rem; color: var(--text-muted);">
                        <i class="fas fa-inbox" style="font-size: 2rem; margin-bottom: 0.5rem;"></i>
                        <p>No traffic data available</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = traffic.map(item => `
        <tr>
            <td>
                <strong style="color: var(--text-primary);">${item.domain_name || 'N/A'}</strong>
            </td>
            <td>
                <code style="color: var(--text-secondary);">${item.visitor_ip || 'N/A'}</code>
            </td>
            <td>
                <span class="bot-score-badge ${getBotScoreClass(item.bot_score || 0)}">
                    ${item.bot_score || 0}
                </span>
            </td>
            <td>
                <span class="backend-badge ${getBackendClass(item.backend_used || 'clean')}">
                    ${(item.backend_used || 'clean').toUpperCase()}
                </span>
            </td>
            <td style="color: var(--text-muted);">
                ${formatDate(item.request_time)}
            </td>
        </tr>
    `).join('');
}

// ================================
// UI INTERACTIONS
// ================================

function initSidebarToggle() {
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');

    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
        });
    }

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }
}

function initRefreshButton() {
    const refreshBtn = document.getElementById('refreshBtn');
    
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            refreshBtn.classList.add('spinning');
            await refreshDashboard();
            setTimeout(() => {
                refreshBtn.classList.remove('spinning');
            }, 1000);
        });
    }
}

function initChartPeriodButtons() {
    const buttons = document.querySelectorAll('.chart-controls .btn-small');
    
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            buttons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            const period = button.dataset.period;
            console.log('Chart period changed to:', period);
            // TODO: Implement period-based data loading
        });
    });
}

// ================================
// DASHBOARD REFRESH
// ================================

async function refreshDashboard() {
    try {
        await Promise.all([
            loadDashboardStats(),
            loadRecentTraffic(),
            loadBackendStats(),
            loadRealtimeAnalytics()
        ]);
        
        console.log('Dashboard refreshed successfully');
    } catch (error) {
        console.error('Error refreshing dashboard:', error);
    }
}

function startAutoRefresh() {
    // Clear existing interval
    if (AppState.refreshInterval) {
        clearInterval(AppState.refreshInterval);
    }

    // Start new interval
    AppState.refreshInterval = setInterval(() => {
        console.log('Auto-refreshing dashboard...');
        refreshDashboard();
    }, CONFIG.REFRESH_INTERVAL);
}

function stopAutoRefresh() {
    if (AppState.refreshInterval) {
        clearInterval(AppState.refreshInterval);
        AppState.refreshInterval = null;
    }
}

// ================================
// INITIALIZATION
// ================================

async function initDashboard() {
    try {
        console.log('Initializing dashboard...');
        console.log('API Base URL:', CONFIG.API_BASE_URL);

        // Initialize UI components
        initSidebarToggle();
        initRefreshButton();
        initChartPeriodButtons();

        // Initialize charts
        AppState.charts.traffic = initTrafficChart();
        AppState.charts.backend = initBackendChart();

        // Load initial data
        await refreshDashboard();

        // Start auto-refresh
        startAutoRefresh();

        // Show success message
        toast.success('Dashboard loaded successfully', 'Welcome');

        console.log('Dashboard initialization complete');
    } catch (error) {
        console.error('Dashboard initialization error:', error);
        toast.error('Failed to initialize dashboard');
    }
}

// ================================
// PAGE LOAD
// ================================

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDashboard);
} else {
    initDashboard();
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    stopAutoRefresh();
});

// Export for debugging
window.AppState = AppState;
window.api = api;
window.toast = toast;
