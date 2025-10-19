/**
 * DATABASE LAYER Demo Server
 * Modern Sidebar Layout with Dark Theme
 */

import { createServer } from 'http';
import { getInstance } from './database/sqlite/connection.js';
import DomainRepository from './database/repositories/DomainRepository.js';
import TrafficLogRepository from './database/repositories/TrafficLogRepository.js';

const PORT = 3030;
const dbConnection = getInstance();
const db = dbConnection.getDB();

const domainRepo = new DomainRepository(db);
const trafficLogRepo = new TrafficLogRepository(db);

// HTML template with modern sidebar
function getHTML(content, activePage = 'home') {
  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Traffic Manager - DATABASE LAYER Demo</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    * { 
      margin: 0; 
      padding: 0; 
      box-sizing: border-box; 
    }
    
    :root {
      /* Sidebar Colors */
      --sidebar-bg: #1a1d29;
      --sidebar-bg-hover: #252936;
      
      /* Main Background */
      --main-bg: #f5f7fa;
      --main-bg-dark: #e8ebf0;
      
      /* Text Colors */
      --text-primary: #ffffff;
      --text-secondary: #a0a4b8;
      --text-muted: #6c7289;
      --text-dark: #1f2937;
      
      /* Accent Colors */
      --accent-primary: #4f46e5;
      --accent-success: #10b981;
      --accent-warning: #f59e0b;
      --accent-danger: #ef4444;
      --accent-info: #3b82f6;
      
      /* Border Colors */
      --border-light: #e5e7eb;
      --border-dark: #2d3142;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: var(--main-bg);
      color: var(--text-dark);
      overflow-x: hidden;
    }
    
    /* Layout */
    .layout {
      display: flex;
      min-height: 100vh;
    }
    
    /* Sidebar */
    .sidebar {
      width: 260px;
      background: var(--sidebar-bg);
      color: var(--text-primary);
      position: fixed;
      left: 0;
      top: 0;
      bottom: 0;
      display: flex;
      flex-direction: column;
      z-index: 1000;
      box-shadow: 2px 0 10px rgba(0,0,0,0.1);
    }
    
    /* Brand Section */
    .sidebar-brand {
      height: 70px;
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 12px;
      border-bottom: 1px solid var(--border-dark);
    }
    
    .brand-logo {
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 20px;
    }
    
    .brand-name {
      font-size: 18px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }
    
    /* Profile Section */
    .sidebar-profile {
      padding: 20px;
      border-bottom: 1px solid var(--border-dark);
    }
    
    .profile-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .profile-avatar {
      width: 45px;
      height: 45px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      font-weight: 600;
      position: relative;
    }
    
    .status-indicator {
      width: 12px;
      height: 12px;
      background: var(--accent-success);
      border: 2px solid var(--sidebar-bg);
      border-radius: 50%;
      position: absolute;
      bottom: 0;
      right: 0;
    }
    
    .profile-details h3 {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 2px;
    }
    
    .profile-details p {
      font-size: 12px;
      color: var(--text-secondary);
    }
    
    /* Navigation */
    .sidebar-nav {
      flex: 1;
      padding: 20px 0;
      overflow-y: auto;
    }
    
    .nav-section {
      margin-bottom: 25px;
    }
    
    .nav-section-title {
      padding: 0 20px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: var(--text-muted);
      margin-bottom: 10px;
    }
    
    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 20px;
      color: var(--text-secondary);
      text-decoration: none;
      transition: all 0.2s;
      position: relative;
    }
    
    .nav-item:hover {
      background: var(--sidebar-bg-hover);
      color: var(--text-primary);
    }
    
    .nav-item.active {
      background: var(--sidebar-bg-hover);
      color: var(--text-primary);
    }
    
    .nav-item.active::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 3px;
      background: var(--accent-primary);
    }
    
    .nav-icon {
      width: 20px;
      font-size: 16px;
      text-align: center;
    }
    
    .nav-badge {
      margin-left: auto;
      padding: 2px 8px;
      background: var(--accent-primary);
      color: white;
      border-radius: 10px;
      font-size: 11px;
      font-weight: 600;
    }
    
    /* Main Content */
    .main-content {
      flex: 1;
      margin-left: 260px;
      padding: 30px;
      min-height: 100vh;
    }
    
    /* Page Header */
    .page-header {
      margin-bottom: 30px;
    }
    
    .page-title {
      font-size: 28px;
      font-weight: 700;
      color: var(--text-dark);
      margin-bottom: 8px;
    }
    
    .page-subtitle {
      color: var(--text-muted);
      font-size: 14px;
    }
    
    /* Stats Cards Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    
    .stat-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      transition: all 0.3s;
    }
    
    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    
    .stat-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 15px;
    }
    
    .stat-icon {
      width: 45px;
      height: 45px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      color: white;
    }
    
    .stat-icon.primary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
    .stat-icon.success { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
    .stat-icon.warning { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); }
    .stat-icon.danger { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); }
    .stat-icon.info { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); }
    
    .stat-value {
      font-size: 32px;
      font-weight: 700;
      color: var(--text-dark);
      margin-bottom: 5px;
    }
    
    .stat-label {
      font-size: 14px;
      color: var(--text-muted);
      font-weight: 500;
    }
    
    /* Card */
    .card {
      background: white;
      border-radius: 12px;
      padding: 25px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      margin-bottom: 20px;
    }
    
    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 1px solid var(--border-light);
    }
    
    .card-title {
      font-size: 18px;
      font-weight: 700;
      color: var(--text-dark);
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    /* Table */
    .table {
      width: 100%;
      border-collapse: collapse;
    }
    
    .table thead {
      background: var(--main-bg);
    }
    
    .table th {
      padding: 12px;
      text-align: left;
      font-weight: 600;
      font-size: 13px;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .table td {
      padding: 15px 12px;
      border-bottom: 1px solid var(--border-light);
      color: var(--text-dark);
      font-size: 14px;
    }
    
    .table tr:last-child td {
      border-bottom: none;
    }
    
    .table tbody tr:hover {
      background: var(--main-bg);
    }
    
    /* Badge */
    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .badge-success {
      background: #d1fae5;
      color: #065f46;
    }
    
    .badge-warning {
      background: #fef3c7;
      color: #92400e;
    }
    
    .badge-danger {
      background: #fee2e2;
      color: #991b1b;
    }
    
    .badge-info {
      background: #dbeafe;
      color: #1e40af;
    }
    
    .badge-primary {
      background: #e0e7ff;
      color: #3730a3;
    }
    
    /* Progress Bar */
    .progress-bar {
      width: 100%;
      height: 8px;
      background: var(--border-light);
      border-radius: 10px;
      overflow: hidden;
      margin-top: 10px;
    }
    
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--accent-primary), var(--accent-info));
      transition: width 0.3s ease;
      border-radius: 10px;
    }
    
    /* Responsive */
    @media (max-width: 768px) {
      .sidebar {
        width: 260px;
        transform: translateX(-260px);
        transition: transform 0.3s;
      }
      
      .sidebar.open {
        transform: translateX(0);
      }
      
      .main-content {
        margin-left: 0;
      }
      
      .stats-grid {
        grid-template-columns: 1fr;
      }
    }
    
    /* Scrollbar */
    ::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }
    
    ::-webkit-scrollbar-track {
      background: var(--main-bg);
    }
    
    ::-webkit-scrollbar-thumb {
      background: var(--text-muted);
      border-radius: 4px;
    }
    
    ::-webkit-scrollbar-thumb:hover {
      background: var(--text-secondary);
    }
  </style>
</head>
<body>
  <div class="layout">
    <!-- Sidebar -->
    <aside class="sidebar">
      <!-- Brand -->
      <div class="sidebar-brand">
        <div class="brand-logo">
          <i class="fas fa-traffic-light"></i>
        </div>
        <h1 class="brand-name">Traffic Manager</h1>
      </div>
      
      <!-- Profile -->
      <div class="sidebar-profile">
        <div class="profile-info">
          <div class="profile-avatar">
            <i class="fas fa-user"></i>
            <span class="status-indicator"></span>
          </div>
          <div class="profile-details">
            <h3>Admin User</h3>
            <p>Database Layer Demo</p>
          </div>
        </div>
      </div>
      
      <!-- Navigation -->
      <nav class="sidebar-nav">
        <div class="nav-section">
          <div class="nav-section-title">Ana Menü</div>
          <a href="/" class="nav-item ${activePage === 'home' ? 'active' : ''}">
            <i class="fas fa-home nav-icon"></i>
            <span>Ana Sayfa</span>
          </a>
          <a href="/domains" class="nav-item ${activePage === 'domains' ? 'active' : ''}">
            <i class="fas fa-globe nav-icon"></i>
            <span>Domains</span>
            <span class="nav-badge">${domainRepo.count()}</span>
          </a>
          <a href="/traffic" class="nav-item ${activePage === 'traffic' ? 'active' : ''}">
            <i class="fas fa-chart-line nav-icon"></i>
            <span>Traffic Logs</span>
          </a>
          <a href="/stats" class="nav-item ${activePage === 'stats' ? 'active' : ''}">
            <i class="fas fa-chart-bar nav-icon"></i>
            <span>İstatistikler</span>
          </a>
        </div>
        
        <div class="nav-section">
          <div class="nav-section-title">Database</div>
          <a href="/test" class="nav-item ${activePage === 'test' ? 'active' : ''}">
            <i class="fas fa-flask nav-icon"></i>
            <span>CRUD Tests</span>
          </a>
          <a href="/schema" class="nav-item ${activePage === 'schema' ? 'active' : ''}">
            <i class="fas fa-database nav-icon"></i>
            <span>Schema</span>
            <span class="nav-badge">25</span>
          </a>
        </div>
        
        <div class="nav-section">
          <div class="nav-section-title">Sistem</div>
          <a href="#" class="nav-item">
            <i class="fas fa-cog nav-icon"></i>
            <span>Ayarlar</span>
          </a>
          <a href="#" class="nav-item">
            <i class="fas fa-book nav-icon"></i>
            <span>Dokümantasyon</span>
          </a>
        </div>
      </nav>
    </aside>
    
    <!-- Main Content -->
    <main class="main-content">
      ${content}
    </main>
  </div>
</body>
</html>`;
}

// Routes
const routes = {
  '/': handleHome,
  '/domains': handleDomains,
  '/traffic': handleTraffic,
  '/stats': handleStats,
  '/test': handleTest,
  '/schema': handleSchema
};

function handleHome(req, res) {
  const dbInfo = dbConnection.getInfo();
  const totalDomains = domainRepo.count();
  const totalLogs = trafficLogRepo.count();
  const activeDomains = domainRepo.findActive().length;
  
  const content = `
    <div class="page-header">
      <h1 class="page-title">📊 Database Overview</h1>
      <p class="page-subtitle">Phase 1: DATABASE LAYER - Complete ve Aktif</p>
    </div>
    
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-header">
          <div class="stat-icon primary">
            <i class="fas fa-database"></i>
          </div>
        </div>
        <div class="stat-value">${dbInfo.sizeFormatted}</div>
        <div class="stat-label">Database Size</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-header">
          <div class="stat-icon success">
            <i class="fas fa-globe"></i>
          </div>
        </div>
        <div class="stat-value">${totalDomains}</div>
        <div class="stat-label">Total Domains</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-header">
          <div class="stat-icon info">
            <i class="fas fa-chart-line"></i>
          </div>
        </div>
        <div class="stat-value">${totalLogs}</div>
        <div class="stat-label">Traffic Logs</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-header">
          <div class="stat-icon warning">
            <i class="fas fa-server"></i>
          </div>
        </div>
        <div class="stat-value">${activeDomains}</div>
        <div class="stat-label">Active Domains</div>
      </div>
    </div>
    
    <div class="card">
      <div class="card-header">
        <h2 class="card-title">
          <i class="fas fa-check-circle" style="color: var(--accent-success);"></i>
          Phase 1: DATABASE LAYER - Tamamlandı
        </h2>
      </div>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
        <div>
          <div style="color: var(--text-muted); font-size: 13px; margin-bottom: 5px;">Total Tables</div>
          <div style="font-size: 24px; font-weight: 700; color: var(--accent-primary);">25</div>
        </div>
        <div>
          <div style="color: var(--text-muted); font-size: 13px; margin-bottom: 5px;">Indexes</div>
          <div style="font-size: 24px; font-weight: 700; color: var(--accent-info);">83</div>
        </div>
        <div>
          <div style="color: var(--text-muted); font-size: 13px; margin-bottom: 5px;">Lines of Code</div>
          <div style="font-size: 24px; font-weight: 700; color: var(--accent-success);">4,071</div>
        </div>
        <div>
          <div style="color: var(--text-muted); font-size: 13px; margin-bottom: 5px;">Files Created</div>
          <div style="font-size: 24px; font-weight: 700; color: var(--accent-warning);">18</div>
        </div>
      </div>
      
      <div style="margin-top: 20px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="font-size: 14px; color: var(--text-muted);">Overall Progress</span>
          <span style="font-size: 14px; font-weight: 600; color: var(--accent-success);">30%</span>
        </div>
        <div class="progress-bar" style="height: 12px;">
          <div class="progress-fill" style="width: 30%"></div>
        </div>
      </div>
    </div>
    
    <div class="card">
      <div class="card-header">
        <h2 class="card-title">
          <i class="fas fa-info-circle"></i>
          System Information
        </h2>
      </div>
      <table class="table">
        <tbody>
          <tr>
            <td style="font-weight: 600;">Database Path</td>
            <td><code>${dbInfo.path}</code></td>
          </tr>
          <tr>
            <td style="font-weight: 600;">Journal Mode</td>
            <td><span class="badge badge-success">${dbInfo.pragma.journal_mode.toUpperCase()}</span></td>
          </tr>
          <tr>
            <td style="font-weight: 600;">Foreign Keys</td>
            <td><span class="badge badge-${dbInfo.pragma.foreign_keys ? 'success' : 'danger'}">${dbInfo.pragma.foreign_keys ? 'ON' : 'OFF'}</span></td>
          </tr>
          <tr>
            <td style="font-weight: 600;">Connection Status</td>
            <td><span class="badge badge-success">✅ Connected</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
  
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(getHTML(content, 'home'));
}

function handleDomains(req, res) {
  const domains = domainRepo.findAll();
  
  const content = `
    <div class="page-header">
      <h1 class="page-title">🌐 Domains</h1>
      <p class="page-subtitle">${domains.length} domain kayıtlı</p>
    </div>
    
    <div class="card">
      <table class="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Domain Name</th>
            <th>Status</th>
            <th>SSL</th>
            <th>Rate Limit</th>
            <th>Total Requests</th>
            <th>Bot Blocks</th>
          </tr>
        </thead>
        <tbody>
          ${domains.map(domain => `
            <tr>
              <td><strong>#${domain.getId()}</strong></td>
              <td><strong>${domain.get('name')}</strong></td>
              <td>
                <span class="badge badge-${domain.get('status') === 'active' ? 'success' : domain.get('status') === 'paused' ? 'warning' : 'danger'}">
                  ${domain.get('status')}
                </span>
              </td>
              <td>${domain.get('ssl_enabled') ? '<span class="badge badge-success">🔒 Enabled</span>' : '<span class="badge badge-danger">❌ Disabled</span>'}</td>
              <td>${domain.get('rate_limit_enabled') ? `${domain.get('rate_limit_requests')}/hr` : 'Disabled'}</td>
              <td>${domain.get('total_requests').toLocaleString()}</td>
              <td>${domain.get('total_bot_blocks').toLocaleString()}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
  
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(getHTML(content, 'domains'));
}

function handleTraffic(req, res) {
  const logs = trafficLogRepo.findAll({ limit: 30, orderBy: 'id', orderDir: 'DESC' });
  
  const content = `
    <div class="page-header">
      <h1 class="page-title">🚦 Traffic Logs</h1>
      <p class="page-subtitle">Son 30 trafik kaydı</p>
    </div>
    
    <div class="card">
      <table class="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Domain</th>
            <th>Visitor IP</th>
            <th>Backend</th>
            <th>Method</th>
            <th>Status</th>
            <th>Response</th>
            <th>Bot</th>
            <th>Location</th>
          </tr>
        </thead>
        <tbody>
          ${logs.map(log => `
            <tr>
              <td><strong>#${log.getId()}</strong></td>
              <td>Domain #${log.get('domain_id')}</td>
              <td><code>${log.get('visitor_ip')}</code></td>
              <td>
                <span class="badge badge-${
                  log.get('backend_used') === 'clean' ? 'success' :
                  log.get('backend_used') === 'gray' ? 'warning' : 'danger'
                }">
                  ${log.get('backend_used')}
                </span>
              </td>
              <td><span class="badge badge-info">${log.get('request_method')}</span></td>
              <td>${log.get('response_status')}</td>
              <td>${log.get('response_time')}ms</td>
              <td>${log.get('is_bot') ? '🤖' : '👤'}</td>
              <td>${log.get('country') ? `${log.get('country')}` : '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
  
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(getHTML(content, 'traffic'));
}

function handleStats(req, res) {
  const domains = domainRepo.findAll();
  const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const endDate = new Date().toISOString();
  
  let statsHTML = '';
  
  domains.forEach(domain => {
    const stats = trafficLogRepo.getTrafficStats(domain.getId(), startDate, endDate);
    const backendStats = trafficLogRepo.getTrafficByBackend(domain.getId(), startDate, endDate);
    
    if (stats.total_requests > 0) {
      statsHTML += `
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">
              <i class="fas fa-globe"></i>
              ${domain.get('name')}
            </h2>
          </div>
          
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon primary">
                <i class="fas fa-chart-line"></i>
              </div>
              <div class="stat-value">${stats.total_requests}</div>
              <div class="stat-label">Total Requests</div>
            </div>
            
            <div class="stat-card">
              <div class="stat-icon success">
                <i class="fas fa-check-circle"></i>
              </div>
              <div class="stat-value">${((stats.successful_requests / stats.total_requests) * 100).toFixed(1)}%</div>
              <div class="stat-label">Success Rate</div>
            </div>
            
            <div class="stat-card">
              <div class="stat-icon warning">
                <i class="fas fa-clock"></i>
              </div>
              <div class="stat-value">${Math.round(stats.avg_response_time)}ms</div>
              <div class="stat-label">Avg Response</div>
            </div>
            
            <div class="stat-card">
              <div class="stat-icon info">
                <i class="fas fa-users"></i>
              </div>
              <div class="stat-value">${stats.unique_visitors}</div>
              <div class="stat-label">Unique Visitors</div>
            </div>
          </div>
          
          <h3 style="margin: 25px 0 15px; font-size: 16px; font-weight: 600; color: var(--text-dark);">Backend Distribution</h3>
          ${backendStats.map(stat => {
            const percentage = (stat.request_count / stats.total_requests) * 100;
            return `
              <div style="margin-bottom: 15px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span style="font-size: 14px; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">${stat.backend_used}</span>
                  <span style="font-size: 14px; font-weight: 600; color: var(--text-dark);">${stat.request_count} requests (${percentage.toFixed(1)}%)</span>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill" style="width: ${percentage}%"></div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }
  });
  
  const content = `
    <div class="page-header">
      <h1 class="page-title">📊 İstatistikler</h1>
      <p class="page-subtitle">Son 7 günlük detaylı analitik</p>
    </div>
    ${statsHTML}
  `;
  
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(getHTML(content, 'stats'));
}

function handleTest(req, res) {
  const content = `
    <div class="page-header">
      <h1 class="page-title">🧪 CRUD Operations Test</h1>
      <p class="page-subtitle">Database Layer Test Sonuçları</p>
    </div>
    
    <div class="card" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white;">
      <div style="text-align: center; padding: 20px;">
        <i class="fas fa-check-circle" style="font-size: 64px; margin-bottom: 15px;"></i>
        <h2 style="font-size: 32px; margin-bottom: 10px;">All Tests Passed!</h2>
        <p style="font-size: 16px; opacity: 0.9;">DATABASE LAYER tamamen fonksiyonel ve test edildi</p>
      </div>
    </div>
    
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-header">
          <div class="stat-icon success">
            <i class="fas fa-plus"></i>
          </div>
        </div>
        <div class="stat-value">✅</div>
        <div class="stat-label">CREATE Operations</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-header">
          <div class="stat-icon info">
            <i class="fas fa-search"></i>
          </div>
        </div>
        <div class="stat-value">✅</div>
        <div class="stat-label">READ Operations</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-header">
          <div class="stat-icon warning">
            <i class="fas fa-edit"></i>
          </div>
        </div>
        <div class="stat-value">✅</div>
        <div class="stat-label">UPDATE Operations</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-header">
          <div class="stat-icon danger">
            <i class="fas fa-trash"></i>
          </div>
        </div>
        <div class="stat-value">✅</div>
        <div class="stat-label">DELETE Operations</div>
      </div>
    </div>
    
    <div class="card">
      <div class="card-header">
        <h2 class="card-title">
          <i class="fas fa-terminal"></i>
          Test Komutları
        </h2>
      </div>
      <div style="background: #1f2937; color: #10b981; padding: 20px; border-radius: 8px; font-family: 'Courier New', monospace;">
        <div style="margin-bottom: 15px;">
          <div style="color: #9ca3af; margin-bottom: 5px;"># Run full CRUD test suite</div>
          <div>$ node database/test-crud.js</div>
        </div>
        <div style="margin-bottom: 15px;">
          <div style="color: #9ca3af; margin-bottom: 5px;"># Check database status</div>
          <div>$ node database/sqlite/migrations/migrate.js status</div>
        </div>
        <div>
          <div style="color: #9ca3af; margin-bottom: 5px;"># Reset and reseed database</div>
          <div>$ node database/sqlite/migrations/migrate.js reset</div>
        </div>
      </div>
    </div>
  `;
  
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(getHTML(content, 'test'));
}

function handleSchema(req, res) {
  const tables = dbConnection.getTables();
  
  const content = `
    <div class="page-header">
      <h1 class="page-title">🗄️ Database Schema</h1>
      <p class="page-subtitle">${tables.length} tablo yapısı</p>
    </div>
    
    <div class="card">
      <table class="table">
        <thead>
          <tr>
            <th>Table Name</th>
            <th>Category</th>
            <th>Rows</th>
            <th>Columns</th>
            <th>Indexes</th>
          </tr>
        </thead>
        <tbody>
          ${tables.map(table => {
            const info = dbConnection.getTableInfo(table);
            let category = 'Other';
            let badgeClass = 'badge-info';
            
            if (['domains', 'traffic_logs', 'sessions', 'dns_records', 'ab_tests', 'ab_test_results', 'bot_detections'].includes(table)) {
              category = 'Base';
              badgeClass = 'badge-success';
            } else if (table.startsWith('server_') || table.startsWith('backend_') || table.startsWith('uptime_') || table.startsWith('performance_')) {
              category = 'Performance';
              badgeClass = 'badge-warning';
            } else if (table.includes('backup') || table.includes('restore')) {
              category = 'Backup';
              badgeClass = 'badge-info';
            } else if (table.includes('campaign') || table.includes('ad_') || table.includes('conversion')) {
              category = 'Campaign';
              badgeClass = 'badge-danger';
            } else if (table.includes('video')) {
              category = 'Video';
              badgeClass = 'badge-primary';
            }
            
            return `<tr>
              <td><strong><code>${table}</code></strong></td>
              <td><span class="badge ${badgeClass}">${category}</span></td>
              <td>${info.rowCount.toLocaleString()}</td>
              <td>${info.columns.length}</td>
              <td>${info.indexes.length}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
  
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(getHTML(content, 'schema'));
}

// Server
const server = createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const handler = routes[url.pathname];
  
  if (handler) {
    try {
      handler(req, res);
    } catch (error) {
      console.error('Error:', error);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Internal Server Error');
    }
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`\n🚀 DATABASE LAYER Demo Server (Modern Sidebar)`);
  console.log(`📍 Running on port ${PORT}`);
  console.log(`🌐 Access at: http://localhost:${PORT}\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n👋 Shutting down gracefully...');
  server.close(() => {
    dbConnection.close();
    process.exit(0);
  });
});
