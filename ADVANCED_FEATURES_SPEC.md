# 🚀 Traffic Management Platform - Advanced Features Specification

**Tarih**: 2025-10-19  
**Versiyon**: 2.0 Enhanced  
**Priority**: High-Impact Features

---

## 📋 **Ek Özellikler Listesi**

### **1. 🔥 Sunucu Performans İzleme**
### **2. 💾 Tam Yedekli Çalışma (Hot Backup)**
### **3. 📊 Meta Kampanya Takip & Analiz**
### **4. 🌍 IP Canlı Trafik Kaydı & Gelişmiş Arama**
### **5. 🎬 Video Depo & Optimizasyon**

---

## 🏗️ **Güncellenmiş Mimari**

```
traffic-management-platform/
│
├── 📦 1. DATABASE LAYER
├── 🧠 2. CORE LAYER
├── 🌐 3. API LAYER
├── ⚙️ 4. WORKER LAYER
├── 🔄 5. PROXY LAYER
├── 📊 6. ANALYTICS LAYER
├── 🤖 7. ML LAYER
├── 🎨 8. FRONTEND LAYER
├── 🛠️ 9. INFRASTRUCTURE LAYER
│
├── 🔥 10. MONITORING LAYER (YENİ!)
├── 💾 11. BACKUP LAYER (YENİ!)
├── 📊 12. CAMPAIGN LAYER (YENİ!)
├── 🌍 13. TRAFFIC LOGGER LAYER (YENİ!)
└── 🎬 14. MEDIA LAYER (YENİ!)
```

---

## 1️⃣ **SUNUCU PERFORMANS İZLEME**

### **Amaç**
- Sunucu kaynak kullanımı (CPU, RAM, Disk, Network)
- Backend health monitoring
- Response time tracking
- Uptime/Downtime monitoring
- Real-time alerts

### **Database Schema**
```sql
-- Server Metrics
CREATE TABLE server_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  server_name TEXT NOT NULL,
  metric_type TEXT NOT NULL, -- 'cpu', 'ram', 'disk', 'network'
  value REAL NOT NULL,
  unit TEXT, -- 'percent', 'mb', 'mbps'
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_server_time (server_name, timestamp)
);

-- Backend Health
CREATE TABLE backend_health (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  backend_url TEXT NOT NULL,
  status TEXT NOT NULL, -- 'healthy', 'degraded', 'down'
  response_time INTEGER, -- milliseconds
  status_code INTEGER,
  error_message TEXT,
  checked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_backend_time (backend_url, checked_at)
);

-- Uptime Records
CREATE TABLE uptime_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  service_name TEXT NOT NULL,
  is_up BOOLEAN DEFAULT 1,
  downtime_start DATETIME,
  downtime_end DATETIME,
  downtime_duration INTEGER, -- seconds
  reason TEXT,
  INDEX idx_service_time (service_name, downtime_start)
);

-- Performance Alerts
CREATE TABLE performance_alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  alert_type TEXT NOT NULL, -- 'high_cpu', 'high_memory', 'slow_response'
  severity TEXT NOT NULL, -- 'info', 'warning', 'critical'
  message TEXT,
  metric_value REAL,
  threshold_value REAL,
  is_resolved BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  resolved_at DATETIME
);
```

### **Monitoring Service**
```javascript
// monitoring/PerformanceMonitor.js
export class PerformanceMonitor {
  constructor(db, alertService) {
    this.db = db
    this.alertService = alertService
  }
  
  async collectSystemMetrics() {
    const os = require('os')
    
    // CPU Usage
    const cpuUsage = this.calculateCPUUsage()
    await this.recordMetric('main-server', 'cpu', cpuUsage, 'percent')
    
    // Memory Usage
    const totalMem = os.totalmem()
    const freeMem = os.freemem()
    const memUsage = ((totalMem - freeMem) / totalMem) * 100
    await this.recordMetric('main-server', 'ram', memUsage, 'percent')
    
    // Disk Usage
    const diskUsage = await this.getDiskUsage()
    await this.recordMetric('main-server', 'disk', diskUsage, 'percent')
    
    // Check thresholds and alert
    if (cpuUsage > 80) {
      await this.createAlert('high_cpu', 'warning', cpuUsage, 80)
    }
    if (memUsage > 85) {
      await this.createAlert('high_memory', 'critical', memUsage, 85)
    }
  }
  
  async checkBackendHealth(backendUrl) {
    const startTime = Date.now()
    
    try {
      const response = await fetch(backendUrl + '/health', {
        timeout: 5000
      })
      
      const responseTime = Date.now() - startTime
      
      await this.db.prepare(`
        INSERT INTO backend_health (backend_url, status, response_time, status_code, checked_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(
        backendUrl,
        response.ok ? 'healthy' : 'degraded',
        responseTime,
        response.status
      )
      
      // Alert on slow response
      if (responseTime > 2000) {
        await this.createAlert('slow_response', 'warning', responseTime, 2000)
      }
      
      return { status: 'healthy', responseTime }
    } catch (error) {
      await this.db.prepare(`
        INSERT INTO backend_health (backend_url, status, error_message, checked_at)
        VALUES (?, 'down', ?, CURRENT_TIMESTAMP)
      `).run(backendUrl, error.message)
      
      await this.createAlert('backend_down', 'critical', 0, 1)
      
      return { status: 'down', error: error.message }
    }
  }
  
  async getMetricsHistory(serverName, metricType, hours = 24) {
    return this.db.prepare(`
      SELECT * FROM server_metrics
      WHERE server_name = ? AND metric_type = ?
      AND timestamp > datetime('now', '-${hours} hours')
      ORDER BY timestamp DESC
    `).all(serverName, metricType)
  }
}
```

### **Dashboard UI**
```javascript
// Performance Dashboard Component
<div class="performance-dashboard">
  {/* Real-time Metrics */}
  <div class="metrics-grid">
    <MetricCard
      title="CPU Usage"
      value={cpuUsage}
      unit="%"
      trend="up"
      status={cpuUsage > 80 ? 'danger' : 'success'}
    />
    <MetricCard
      title="Memory"
      value={memUsage}
      unit="%"
      trend="stable"
      status={memUsage > 85 ? 'danger' : 'success'}
    />
    <MetricCard
      title="Network"
      value={networkSpeed}
      unit="Mbps"
      trend="down"
      status="success"
    />
  </div>
  
  {/* Response Time Chart */}
  <LineChart
    title="Backend Response Times"
    data={responseTimeHistory}
    threshold={2000}
  />
  
  {/* Backend Health Status */}
  <BackendHealthTable backends={backends} />
</div>
```

---

## 2️⃣ **TAM YEDEKLİ ÇALIŞMA (HOT BACKUP)**

### **Amaç**
- Tüm sistemin snapshot'ı
- Tek tuşla aktif hale getirme
- Zero-downtime recovery
- Scheduled automatic backups
- Version history

### **Database Schema**
```sql
-- System Backups
CREATE TABLE system_backups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  backup_name TEXT NOT NULL,
  backup_type TEXT NOT NULL, -- 'full', 'incremental', 'differential'
  backup_size INTEGER, -- bytes
  file_path TEXT NOT NULL,
  checksum TEXT, -- MD5/SHA256 hash
  status TEXT DEFAULT 'completed', -- 'in_progress', 'completed', 'failed'
  is_active BOOLEAN DEFAULT 0, -- Currently active backup
  created_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  restored_at DATETIME
);

-- Backup Components
CREATE TABLE backup_components (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  backup_id INTEGER NOT NULL,
  component_type TEXT NOT NULL, -- 'database', 'config', 'static_files', 'nginx'
  component_path TEXT,
  file_size INTEGER,
  checksum TEXT,
  FOREIGN KEY (backup_id) REFERENCES system_backups(id)
);

-- Restore History
CREATE TABLE restore_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  backup_id INTEGER NOT NULL,
  restored_by TEXT,
  restore_status TEXT, -- 'success', 'partial', 'failed'
  restore_duration INTEGER, -- seconds
  error_log TEXT,
  restored_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (backup_id) REFERENCES system_backups(id)
);
```

### **Backup Service**
```javascript
// backup/BackupService.js
export class BackupService {
  constructor(db, config) {
    this.db = db
    this.backupDir = config.backupDir || '/backups'
  }
  
  async createFullBackup(backupName = null) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const name = backupName || `full-backup-${timestamp}`
    
    // Create backup directory
    const backupPath = path.join(this.backupDir, name)
    await fs.mkdir(backupPath, { recursive: true })
    
    // Start backup record
    const backupId = this.db.prepare(`
      INSERT INTO system_backups (backup_name, backup_type, file_path, status)
      VALUES (?, 'full', ?, 'in_progress')
    `).run(name, backupPath).lastInsertRowid
    
    try {
      const components = []
      
      // 1. Backup Database
      console.log('Backing up database...')
      const dbBackup = await this.backupDatabase(backupPath)
      components.push({ type: 'database', ...dbBackup })
      
      // 2. Backup Configuration
      console.log('Backing up configuration...')
      const configBackup = await this.backupConfig(backupPath)
      components.push({ type: 'config', ...configBackup })
      
      // 3. Backup Static Files
      console.log('Backing up static files...')
      const staticBackup = await this.backupStaticFiles(backupPath)
      components.push({ type: 'static_files', ...staticBackup })
      
      // 4. Backup NGINX Config
      console.log('Backing up NGINX config...')
      const nginxBackup = await this.backupNginxConfig(backupPath)
      components.push({ type: 'nginx', ...nginxBackup })
      
      // 5. Create manifest file
      await this.createManifest(backupPath, components)
      
      // 6. Calculate total size and checksum
      const totalSize = components.reduce((sum, c) => sum + c.size, 0)
      const checksum = await this.calculateChecksum(backupPath)
      
      // Update backup record
      this.db.prepare(`
        UPDATE system_backups
        SET status = 'completed', backup_size = ?, checksum = ?
        WHERE id = ?
      `).run(totalSize, checksum, backupId)
      
      // Save components
      for (const component of components) {
        this.db.prepare(`
          INSERT INTO backup_components (backup_id, component_type, component_path, file_size, checksum)
          VALUES (?, ?, ?, ?, ?)
        `).run(backupId, component.type, component.path, component.size, component.checksum)
      }
      
      console.log(`✓ Backup completed: ${name}`)
      return { success: true, backupId, backupPath }
      
    } catch (error) {
      // Mark backup as failed
      this.db.prepare(`
        UPDATE system_backups
        SET status = 'failed'
        WHERE id = ?
      `).run(backupId)
      
      console.error('Backup failed:', error)
      return { success: false, error: error.message }
    }
  }
  
  async restoreBackup(backupId) {
    const startTime = Date.now()
    
    // Get backup info
    const backup = this.db.prepare(`
      SELECT * FROM system_backups WHERE id = ?
    `).get(backupId)
    
    if (!backup) {
      throw new Error('Backup not found')
    }
    
    console.log(`Starting restore: ${backup.backup_name}`)
    
    try {
      // Get all components
      const components = this.db.prepare(`
        SELECT * FROM backup_components WHERE backup_id = ?
      `).all(backupId)
      
      // Restore each component
      for (const component of components) {
        console.log(`Restoring ${component.component_type}...`)
        await this.restoreComponent(component)
      }
      
      // Set as active backup
      this.db.prepare(`UPDATE system_backups SET is_active = 0`).run()
      this.db.prepare(`UPDATE system_backups SET is_active = 1 WHERE id = ?`).run(backupId)
      
      const duration = Math.floor((Date.now() - startTime) / 1000)
      
      // Record restore
      this.db.prepare(`
        INSERT INTO restore_history (backup_id, restore_status, restore_duration)
        VALUES (?, 'success', ?)
      `).run(backupId, duration)
      
      console.log(`✓ Restore completed in ${duration}s`)
      
      // Restart services
      await this.restartServices()
      
      return { success: true, duration }
      
    } catch (error) {
      const duration = Math.floor((Date.now() - startTime) / 1000)
      
      this.db.prepare(`
        INSERT INTO restore_history (backup_id, restore_status, restore_duration, error_log)
        VALUES (?, 'failed', ?, ?)
      `).run(backupId, duration, error.message)
      
      console.error('Restore failed:', error)
      return { success: false, error: error.message }
    }
  }
  
  async scheduleAutoBackup(cronPattern = '0 2 * * *') {
    // Daily backup at 2 AM
    const cron = require('node-cron')
    
    cron.schedule(cronPattern, async () => {
      console.log('Running scheduled backup...')
      await this.createFullBackup()
      
      // Clean old backups (keep last 30 days)
      await this.cleanOldBackups(30)
    })
  }
}
```

### **One-Click Restore UI**
```javascript
// Backup Dashboard
<div class="backup-dashboard">
  <div class="backup-header">
    <h2>System Backups</h2>
    <button onClick={createBackup} class="btn-primary">
      <i class="fas fa-plus"></i>
      Create Backup
    </button>
  </div>
  
  <div class="backup-list">
    {backups.map(backup => (
      <div class={`backup-card ${backup.is_active ? 'active' : ''}`}>
        <div class="backup-info">
          <h3>{backup.backup_name}</h3>
          <p>Size: {formatSize(backup.backup_size)}</p>
          <p>Created: {formatDate(backup.created_at)}</p>
          {backup.is_active && <span class="badge-success">Active</span>}
        </div>
        
        <div class="backup-actions">
          <button 
            onClick={() => restoreBackup(backup.id)}
            class="btn-success"
            disabled={backup.is_active}
          >
            <i class="fas fa-undo"></i>
            Restore
          </button>
          
          <button onClick={() => downloadBackup(backup.id)} class="btn-info">
            <i class="fas fa-download"></i>
            Download
          </button>
          
          <button onClick={() => deleteBackup(backup.id)} class="btn-danger">
            <i class="fas fa-trash"></i>
            Delete
          </button>
        </div>
      </div>
    ))}
  </div>
</div>
```

---

## 3️⃣ **META KAMPANYA TAKİP & ANALİZ**

### **Amaç**
- Facebook/Instagram kampanya tracking
- Google Ads integration
- Conversion tracking
- ROI analysis
- Campaign performance metrics

### **Database Schema**
```sql
-- Campaigns
CREATE TABLE campaigns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_name TEXT NOT NULL,
  platform TEXT NOT NULL, -- 'facebook', 'google', 'instagram', 'tiktok'
  campaign_id TEXT, -- External platform ID
  budget REAL,
  daily_budget REAL,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'active', -- 'active', 'paused', 'completed'
  objective TEXT, -- 'conversions', 'traffic', 'awareness'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Campaign Metrics
CREATE TABLE campaign_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id INTEGER NOT NULL,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  spend REAL DEFAULT 0,
  ctr REAL, -- Click-through rate
  cpc REAL, -- Cost per click
  cpa REAL, -- Cost per acquisition
  roas REAL, -- Return on ad spend
  revenue REAL DEFAULT 0,
  date DATE NOT NULL,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
  UNIQUE(campaign_id, date)
);

-- Ad Creatives
CREATE TABLE ad_creatives (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id INTEGER NOT NULL,
  creative_name TEXT,
  creative_type TEXT, -- 'image', 'video', 'carousel'
  headline TEXT,
  description TEXT,
  call_to_action TEXT,
  destination_url TEXT,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
);

-- Conversion Events
CREATE TABLE conversion_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id INTEGER,
  creative_id INTEGER,
  visitor_ip TEXT,
  user_agent TEXT,
  referrer TEXT,
  landing_page TEXT,
  conversion_type TEXT, -- 'purchase', 'signup', 'download', 'lead'
  conversion_value REAL,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  fbclid TEXT, -- Facebook Click ID
  gclid TEXT, -- Google Click ID
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
  FOREIGN KEY (creative_id) REFERENCES ad_creatives(id)
);
```

### **Campaign Tracking Service**
```javascript
// campaign/CampaignTracker.js
export class CampaignTracker {
  constructor(db) {
    this.db = db
  }
  
  // Track incoming traffic from ads
  async trackAdClick(req) {
    const {
      fbclid,
      gclid,
      utm_source,
      utm_medium,
      utm_campaign,
      utm_content,
      utm_term
    } = req.query
    
    const visitorIp = req.headers['x-real-ip']
    const userAgent = req.headers['user-agent']
    const referrer = req.headers['referer']
    const landingPage = req.url
    
    // Find campaign by UTM parameters
    const campaign = this.db.prepare(`
      SELECT id FROM campaigns
      WHERE campaign_name = ? AND platform = ?
    `).get(utm_campaign, utm_source)
    
    if (campaign) {
      // Store click event
      this.db.prepare(`
        INSERT INTO conversion_events (
          campaign_id, visitor_ip, user_agent, referrer, landing_page,
          utm_source, utm_medium, utm_campaign, utm_content, utm_term,
          fbclid, gclid
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        campaign.id, visitorIp, userAgent, referrer, landingPage,
        utm_source, utm_medium, utm_campaign, utm_content, utm_term,
        fbclid, gclid
      )
      
      // Update campaign metrics
      this.updateCampaignClicks(campaign.id)
    }
    
    // Set tracking cookie
    return {
      trackingId: this.generateTrackingId(),
      campaignId: campaign?.id
    }
  }
  
  // Track conversion (purchase, signup, etc.)
  async trackConversion(trackingId, conversionData) {
    const { type, value, campaignId } = conversionData
    
    this.db.prepare(`
      INSERT INTO conversion_events (
        campaign_id, conversion_type, conversion_value, timestamp
      ) VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `).run(campaignId, type, value)
    
    // Update metrics
    this.updateCampaignConversions(campaignId, value)
  }
  
  // Get campaign performance
  async getCampaignAnalytics(campaignId, startDate, endDate) {
    const metrics = this.db.prepare(`
      SELECT 
        date,
        SUM(impressions) as total_impressions,
        SUM(clicks) as total_clicks,
        SUM(conversions) as total_conversions,
        SUM(spend) as total_spend,
        SUM(revenue) as total_revenue,
        AVG(ctr) as avg_ctr,
        AVG(cpc) as avg_cpc,
        AVG(cpa) as avg_cpa,
        AVG(roas) as avg_roas
      FROM campaign_metrics
      WHERE campaign_id = ? 
      AND date BETWEEN ? AND ?
      GROUP BY date
      ORDER BY date
    `).all(campaignId, startDate, endDate)
    
    return {
      daily: metrics,
      summary: this.calculateSummary(metrics)
    }
  }
  
  // Facebook Ads API Integration
  async syncFacebookAds(adAccountId, accessToken) {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${adAccountId}/insights`,
      {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      }
    )
    
    const data = await response.json()
    
    // Update campaign metrics
    for (const insight of data.data) {
      this.updateMetrics(insight)
    }
  }
  
  // Google Ads API Integration
  async syncGoogleAds(customerId, refreshToken) {
    // Google Ads API implementation
    // ...
  }
}
```

### **Campaign Dashboard UI**
```javascript
// Campaign Analytics Dashboard
<div class="campaign-dashboard">
  <div class="campaign-summary">
    <StatCard title="Total Spend" value={totalSpend} format="currency" />
    <StatCard title="Total Revenue" value={totalRevenue} format="currency" />
    <StatCard title="ROAS" value={roas} format="ratio" color="success" />
    <StatCard title="Conversions" value={conversions} format="number" />
  </div>
  
  <div class="campaign-charts">
    <LineChart
      title="Spend vs Revenue"
      data={spendRevenueData}
      lines={['spend', 'revenue']}
    />
    
    <PieChart
      title="Traffic Sources"
      data={trafficSources}
    />
  </div>
  
  <div class="campaign-table">
    <h3>Active Campaigns</h3>
    <table>
      <thead>
        <tr>
          <th>Campaign</th>
          <th>Platform</th>
          <th>Impressions</th>
          <th>Clicks</th>
          <th>CTR</th>
          <th>Conversions</th>
          <th>Spend</th>
          <th>Revenue</th>
          <th>ROAS</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {campaigns.map(campaign => (
          <CampaignRow key={campaign.id} campaign={campaign} />
        ))}
      </tbody>
    </table>
  </div>
</div>
```

---

## 4️⃣ **IP CANLI TRAFİK KAYDI & GELİŞMİŞ ARAMA**

### **Amaç**
- Her ziyaretçi kaydı
- Gerçek zamanlı trafik görüntüleme
- Gelişmiş filtreleme ve arama
- Tarihsel analiz
- IP geolocation
- Behavior tracking

### **Database Schema**
```sql
-- Enhanced Traffic Logs (Daha detaylı)
CREATE TABLE traffic_logs_detailed (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Request Info
  request_id TEXT UNIQUE NOT NULL, -- UUID
  domain TEXT NOT NULL,
  path TEXT NOT NULL,
  method TEXT NOT NULL, -- GET, POST, etc.
  query_string TEXT,
  
  -- Visitor Info
  visitor_ip TEXT NOT NULL,
  user_agent TEXT,
  browser TEXT,
  browser_version TEXT,
  os TEXT,
  os_version TEXT,
  device_type TEXT, -- desktop, mobile, tablet
  
  -- Geolocation
  country TEXT,
  country_code TEXT,
  region TEXT,
  city TEXT,
  latitude REAL,
  longitude REAL,
  isp TEXT,
  
  -- Referrer & UTM
  referrer TEXT,
  referrer_domain TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  
  -- Backend Info
  backend_used TEXT NOT NULL,
  backend_response_time INTEGER, -- milliseconds
  backend_status_code INTEGER,
  
  -- Bot Detection
  is_bot BOOLEAN DEFAULT 0,
  bot_score REAL,
  bot_type TEXT, -- 'search', 'social', 'malicious', 'unknown'
  
  -- Session Info
  session_id TEXT,
  is_first_visit BOOLEAN DEFAULT 0,
  page_views INTEGER DEFAULT 1,
  
  -- Timing
  request_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  response_time INTEGER, -- milliseconds
  
  -- Additional Data
  request_headers TEXT, -- JSON
  response_headers TEXT, -- JSON
  request_body TEXT, -- JSON (for POST)
  
  -- Indexes for fast search
  INDEX idx_ip (visitor_ip),
  INDEX idx_domain (domain),
  INDEX idx_time (request_time),
  INDEX idx_country (country),
  INDEX idx_referrer (referrer_domain),
  INDEX idx_bot (is_bot),
  INDEX idx_session (session_id)
);

-- Search Queries (Save search history)
CREATE TABLE search_queries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  query_text TEXT,
  filters TEXT, -- JSON
  result_count INTEGER,
  executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Saved Searches
CREATE TABLE saved_searches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  search_name TEXT NOT NULL,
  query_text TEXT,
  filters TEXT, -- JSON
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### **Traffic Logger Service**
```javascript
// traffic/TrafficLogger.js
export class TrafficLogger {
  constructor(db, geoipService) {
    this.db = db
    this.geoip = geoipService
  }
  
  async logRequest(req, backend, responseTime, statusCode) {
    const requestId = this.generateUUID()
    
    // Parse user agent
    const uaParser = require('ua-parser-js')
    const ua = uaParser(req.headers['user-agent'])
    
    // Get geolocation
    const ip = req.headers['x-real-ip'] || req.connection.remoteAddress
    const geo = await this.geoip.lookup(ip)
    
    // Parse URL
    const url = new URL(req.url, `http://${req.headers.host}`)
    const utm = this.extractUTMParams(url.searchParams)
    
    // Check if bot
    const botDetection = await this.detectBot(req)
    
    // Get or create session
    const sessionId = req.cookies.session_id || this.generateSessionId()
    const isFirstVisit = !req.cookies.session_id
    
    // Log to database
    this.db.prepare(`
      INSERT INTO traffic_logs_detailed (
        request_id, domain, path, method, query_string,
        visitor_ip, user_agent,
        browser, browser_version, os, os_version, device_type,
        country, country_code, region, city, latitude, longitude, isp,
        referrer, referrer_domain,
        utm_source, utm_medium, utm_campaign, utm_content, utm_term,
        backend_used, backend_response_time, backend_status_code,
        is_bot, bot_score, bot_type,
        session_id, is_first_visit,
        request_time, response_time,
        request_headers, response_headers
      ) VALUES (
        ?, ?, ?, ?, ?,
        ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?,
        ?, ?,
        CURRENT_TIMESTAMP, ?,
        ?, ?
      )
    `).run(
      requestId, req.headers.host, url.pathname, req.method, url.search,
      ip, req.headers['user-agent'],
      ua.browser.name, ua.browser.version, ua.os.name, ua.os.version, ua.device.type,
      geo.country, geo.countryCode, geo.region, geo.city, geo.lat, geo.lon, geo.isp,
      req.headers['referer'], this.extractDomain(req.headers['referer']),
      utm.source, utm.medium, utm.campaign, utm.content, utm.term,
      backend, responseTime, statusCode,
      botDetection.isBot, botDetection.score, botDetection.type,
      sessionId, isFirstVisit,
      responseTime,
      JSON.stringify(req.headers), JSON.stringify({})
    )
    
    return { requestId, sessionId }
  }
  
  // Advanced Search
  async search(searchParams) {
    const {
      ipAddress,
      domain,
      country,
      referrer,
      dateFrom,
      dateTo,
      isBot,
      deviceType,
      browser,
      minResponseTime,
      maxResponseTime,
      statusCode,
      utmSource,
      utmCampaign,
      page = 1,
      limit = 100
    } = searchParams
    
    let query = `SELECT * FROM traffic_logs_detailed WHERE 1=1`
    const params = []
    
    // Dynamic filters
    if (ipAddress) {
      query += ` AND visitor_ip LIKE ?`
      params.push(`%${ipAddress}%`)
    }
    if (domain) {
      query += ` AND domain = ?`
      params.push(domain)
    }
    if (country) {
      query += ` AND country = ?`
      params.push(country)
    }
    if (referrer) {
      query += ` AND referrer_domain LIKE ?`
      params.push(`%${referrer}%`)
    }
    if (dateFrom) {
      query += ` AND request_time >= ?`
      params.push(dateFrom)
    }
    if (dateTo) {
      query += ` AND request_time <= ?`
      params.push(dateTo)
    }
    if (isBot !== undefined) {
      query += ` AND is_bot = ?`
      params.push(isBot ? 1 : 0)
    }
    if (deviceType) {
      query += ` AND device_type = ?`
      params.push(deviceType)
    }
    if (browser) {
      query += ` AND browser = ?`
      params.push(browser)
    }
    if (minResponseTime) {
      query += ` AND response_time >= ?`
      params.push(minResponseTime)
    }
    if (maxResponseTime) {
      query += ` AND response_time <= ?`
      params.push(maxResponseTime)
    }
    if (statusCode) {
      query += ` AND backend_status_code = ?`
      params.push(statusCode)
    }
    if (utmSource) {
      query += ` AND utm_source = ?`
      params.push(utmSource)
    }
    if (utmCampaign) {
      query += ` AND utm_campaign = ?`
      params.push(utmCampaign)
    }
    
    // Pagination
    const offset = (page - 1) * limit
    query += ` ORDER BY request_time DESC LIMIT ? OFFSET ?`
    params.push(limit, offset)
    
    const results = this.db.prepare(query).all(...params)
    
    // Get total count
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total').split('ORDER BY')[0]
    const { total } = this.db.prepare(countQuery).get(...params.slice(0, -2))
    
    return {
      results,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  }
  
  // Get live traffic (last 5 minutes)
  async getLiveTraffic() {
    return this.db.prepare(`
      SELECT * FROM traffic_logs_detailed
      WHERE request_time > datetime('now', '-5 minutes')
      ORDER BY request_time DESC
      LIMIT 100
    `).all()
  }
  
  // Get visitor journey (all requests from a session)
  async getVisitorJourney(sessionId) {
    return this.db.prepare(`
      SELECT * FROM traffic_logs_detailed
      WHERE session_id = ?
      ORDER BY request_time ASC
    `).all(sessionId)
  }
}
```

### **Advanced Search UI**
```javascript
// Traffic Search Dashboard
<div class="traffic-search">
  <div class="search-filters">
    <h3>Search Filters</h3>
    
    <div class="filter-group">
      <label>IP Address</label>
      <input type="text" placeholder="192.168.1.1" />
    </div>
    
    <div class="filter-group">
      <label>Domain</label>
      <select>
        <option value="">All Domains</option>
        {domains.map(d => <option value={d}>{d}</option>)}
      </select>
    </div>
    
    <div class="filter-group">
      <label>Date Range</label>
      <DateRangePicker />
    </div>
    
    <div class="filter-group">
      <label>Country</label>
      <CountrySelect />
    </div>
    
    <div class="filter-group">
      <label>Referrer</label>
      <input type="text" placeholder="google.com" />
    </div>
    
    <div class="filter-group">
      <label>Device Type</label>
      <select>
        <option value="">All</option>
        <option value="desktop">Desktop</option>
        <option value="mobile">Mobile</option>
        <option value="tablet">Tablet</option>
      </select>
    </div>
    
    <div class="filter-group">
      <label>Bot Traffic</label>
      <select>
        <option value="">All</option>
        <option value="0">Real Users Only</option>
        <option value="1">Bots Only</option>
      </select>
    </div>
    
    <div class="filter-actions">
      <button onClick={search} class="btn-primary">
        <i class="fas fa-search"></i>
        Search
      </button>
      <button onClick={reset} class="btn-secondary">
        Clear
      </button>
      <button onClick={saveSearch} class="btn-info">
        Save Search
      </button>
    </div>
  </div>
  
  <div class="search-results">
    <div class="results-header">
      <h3>Results: {totalResults.toLocaleString()}</h3>
      <div class="results-actions">
        <button onClick={exportCSV}>Export CSV</button>
        <button onClick={exportJSON}>Export JSON</button>
      </div>
    </div>
    
    <table class="results-table">
      <thead>
        <tr>
          <th>Time</th>
          <th>IP</th>
          <th>Country</th>
          <th>Domain</th>
          <th>Path</th>
          <th>Referrer</th>
          <th>Device</th>
          <th>Browser</th>
          <th>Backend</th>
          <th>Response</th>
          <th>Bot</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {results.map(log => (
          <TrafficLogRow key={log.id} log={log} />
        ))}
      </tbody>
    </table>
    
    <Pagination {...pagination} />
  </div>
  
  {/* Live Traffic Feed */}
  <div class="live-traffic">
    <h3><i class="fas fa-circle pulse"></i> Live Traffic</h3>
    <div class="live-feed">
      {liveTraffic.map(log => (
        <div class="live-item">
          <span class="flag">{getFlagEmoji(log.country_code)}</span>
          <span class="ip">{log.visitor_ip}</span>
          <span class="arrow">→</span>
          <span class="domain">{log.domain}{log.path}</span>
          <span class="time">{timeAgo(log.request_time)}</span>
        </div>
      ))}
    </div>
  </div>
</div>
```

---

## 5️⃣ **VİDEO DEPO & OPTİMİZASYON**

### **Amaç**
- Video upload
- Automatic compression
- Multiple quality versions (480p, 720p, 1080p)
- Adaptive streaming (HLS/DASH)
- CDN integration
- Fast loading

### **Database Schema**
```sql
-- Videos
CREATE TABLE videos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  video_name TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_size INTEGER, -- bytes
  duration INTEGER, -- seconds
  width INTEGER,
  height INTEGER,
  fps INTEGER,
  codec TEXT,
  status TEXT DEFAULT 'processing', -- 'processing', 'ready', 'failed'
  upload_progress INTEGER DEFAULT 0,
  uploaded_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Video Versions (Different qualities)
CREATE TABLE video_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  video_id INTEGER NOT NULL,
  version_name TEXT NOT NULL, -- '1080p', '720p', '480p', '360p'
  resolution TEXT, -- '1920x1080'
  bitrate INTEGER, -- kbps
  file_path TEXT NOT NULL,
  file_size INTEGER,
  format TEXT, -- 'mp4', 'webm'
  processing_status TEXT DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (video_id) REFERENCES videos(id)
);

-- Video Pages (Where videos are embedded)
CREATE TABLE video_pages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_url TEXT NOT NULL,
  page_title TEXT,
  video_id INTEGER NOT NULL,
  autoplay BOOLEAN DEFAULT 0,
  loop BOOLEAN DEFAULT 0,
  controls BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (video_id) REFERENCES videos(id)
);

-- Video Analytics
CREATE TABLE video_analytics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  video_id INTEGER NOT NULL,
  visitor_ip TEXT,
  play_count INTEGER DEFAULT 0,
  watch_duration INTEGER, -- seconds actually watched
  completion_rate REAL, -- percentage
  quality_selected TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (video_id) REFERENCES videos(id)
);
```

### **Video Processing Service**
```javascript
// media/VideoProcessor.js
import ffmpeg from 'fluent-ffmpeg'
import { promisify } from 'util'
import fs from 'fs/promises'

export class VideoProcessor {
  constructor(db, config) {
    this.db = db
    this.uploadDir = config.uploadDir || '/media/uploads'
    this.processedDir = config.processedDir || '/media/processed'
  }
  
  async uploadVideo(file, metadata) {
    // Create video record
    const videoId = this.db.prepare(`
      INSERT INTO videos (
        video_name, original_filename, file_size, status, uploaded_by
      ) VALUES (?, ?, ?, 'processing', ?)
    `).run(
      metadata.name,
      file.originalname,
      file.size,
      metadata.uploadedBy
    ).lastInsertRowid
    
    // Save original file
    const originalPath = path.join(this.uploadDir, `${videoId}_original${path.extname(file.originalname)}`)
    await fs.writeFile(originalPath, file.buffer)
    
    // Get video info
    const videoInfo = await this.getVideoInfo(originalPath)
    
    // Update video record
    this.db.prepare(`
      UPDATE videos
      SET duration = ?, width = ?, height = ?, fps = ?, codec = ?
      WHERE id = ?
    `).run(
      videoInfo.duration,
      videoInfo.width,
      videoInfo.height,
      videoInfo.fps,
      videoInfo.codec,
      videoId
    )
    
    // Start processing (async)
    this.processVideo(videoId, originalPath).catch(console.error)
    
    return { videoId, status: 'processing' }
  }
  
  async processVideo(videoId, originalPath) {
    console.log(`Processing video ${videoId}...`)
    
    const qualities = [
      { name: '1080p', resolution: '1920x1080', bitrate: '5000k' },
      { name: '720p', resolution: '1280x720', bitrate: '2500k' },
      { name: '480p', resolution: '854x480', bitrate: '1000k' },
      { name: '360p', resolution: '640x360', bitrate: '750k' }
    ]
    
    for (const quality of qualities) {
      try {
        console.log(`  Creating ${quality.name} version...`)
        
        const outputPath = path.join(
          this.processedDir,
          `${videoId}_${quality.name}.mp4`
        )
        
        // Insert version record
        const versionId = this.db.prepare(`
          INSERT INTO video_versions (
            video_id, version_name, resolution, bitrate, file_path, format, processing_status
          ) VALUES (?, ?, ?, ?, ?, 'mp4', 'processing')
        `).run(
          videoId,
          quality.name,
          quality.resolution,
          parseInt(quality.bitrate),
          outputPath
        ).lastInsertRowid
        
        // Transcode video
        await this.transcodeVideo(originalPath, outputPath, quality)
        
        // Get file size
        const stats = await fs.stat(outputPath)
        
        // Update version record
        this.db.prepare(`
          UPDATE video_versions
          SET file_size = ?, processing_status = 'ready'
          WHERE id = ?
        `).run(stats.size, versionId)
        
        console.log(`  ✓ ${quality.name} complete`)
        
      } catch (error) {
        console.error(`  ✗ ${quality.name} failed:`, error)
        
        this.db.prepare(`
          UPDATE video_versions
          SET processing_status = 'failed'
          WHERE video_id = ? AND version_name = ?
        `).run(videoId, quality.name)
      }
    }
    
    // Mark video as ready
    this.db.prepare(`
      UPDATE videos SET status = 'ready' WHERE id = ?
    `).run(videoId)
    
    console.log(`✓ Video ${videoId} processing complete`)
    
    // Generate HLS playlist (optional)
    await this.generateHLS(videoId)
  }
  
  async transcodeVideo(inputPath, outputPath, quality) {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .videoCodec('libx264')
        .audioCodec('aac')
        .size(quality.resolution)
        .videoBitrate(quality.bitrate)
        .audioBitrate('128k')
        .outputOptions([
          '-preset fast',
          '-movflags faststart', // Enable fast start for web
          '-pix_fmt yuv420p'
        ])
        .output(outputPath)
        .on('end', resolve)
        .on('error', reject)
        .on('progress', (progress) => {
          console.log(`    Progress: ${progress.percent?.toFixed(1)}%`)
        })
        .run()
    })
  }
  
  async generateHLS(videoId) {
    // Generate HLS playlist for adaptive streaming
    const video = this.db.prepare(`SELECT * FROM videos WHERE id = ?`).get(videoId)
    const versions = this.db.prepare(`
      SELECT * FROM video_versions WHERE video_id = ? AND processing_status = 'ready'
    `).all(videoId)
    
    if (versions.length === 0) return
    
    const hlsDir = path.join(this.processedDir, `${videoId}_hls`)
    await fs.mkdir(hlsDir, { recursive: true })
    
    // Create master playlist
    let masterPlaylist = '#EXTM3U\n#EXT-X-VERSION:3\n'
    
    for (const version of versions) {
      const [width, height] = version.resolution.split('x')
      
      masterPlaylist += `
#EXT-X-STREAM-INF:BANDWIDTH=${version.bitrate * 1000},RESOLUTION=${version.resolution}
${version.version_name}/playlist.m3u8
`
      
      // Create individual playlist for each quality
      const versionDir = path.join(hlsDir, version.version_name)
      await fs.mkdir(versionDir, { recursive: true })
      
      await this.createHLSPlaylist(version.file_path, versionDir)
    }
    
    // Save master playlist
    await fs.writeFile(path.join(hlsDir, 'master.m3u8'), masterPlaylist)
    
    console.log(`  ✓ HLS playlist generated`)
  }
  
  async createHLSPlaylist(inputPath, outputDir) {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions([
          '-codec copy',
          '-start_number 0',
          '-hls_time 10',
          '-hls_list_size 0',
          '-f hls'
        ])
        .output(path.join(outputDir, 'playlist.m3u8'))
        .on('end', resolve)
        .on('error', reject)
        .run()
    })
  }
  
  // Get video embed code
  getEmbedCode(videoId, options = {}) {
    const {
      autoplay = false,
      loop = false,
      controls = true,
      width = '100%',
      height = 'auto'
    } = options
    
    return `
<div class="video-player" data-video-id="${videoId}">
  <video 
    id="video-${videoId}"
    width="${width}" 
    height="${height}"
    ${controls ? 'controls' : ''}
    ${autoplay ? 'autoplay' : ''}
    ${loop ? 'loop' : ''}
    playsinline
  >
    <source src="/api/video/${videoId}/stream/1080p" type="video/mp4">
    <source src="/api/video/${videoId}/stream/720p" type="video/mp4">
    <source src="/api/video/${videoId}/stream/480p" type="video/mp4">
    Your browser doesn't support video playback.
  </video>
</div>

<script>
  // Track video analytics
  const video = document.getElementById('video-${videoId}')
  let watchTime = 0
  
  video.addEventListener('play', () => {
    fetch('/api/video/${videoId}/analytics/play', { method: 'POST' })
  })
  
  video.addEventListener('timeupdate', () => {
    watchTime = video.currentTime
  })
  
  video.addEventListener('ended', () => {
    fetch('/api/video/${videoId}/analytics/complete', {
      method: 'POST',
      body: JSON.stringify({ watchTime, duration: video.duration })
    })
  })
</script>
    `.trim()
  }
}
```

### **Video Management UI**
```javascript
// Video Library Dashboard
<div class="video-library">
  <div class="library-header">
    <h2>Video Library</h2>
    <button onClick={openUploadModal} class="btn-primary">
      <i class="fas fa-cloud-upload"></i>
      Upload Video
    </button>
  </div>
  
  <div class="video-grid">
    {videos.map(video => (
      <div class="video-card">
        <div class="video-thumbnail">
          <img src={video.thumbnail} alt={video.name} />
          <div class="video-duration">{formatDuration(video.duration)}</div>
          {video.status === 'processing' && (
            <div class="processing-overlay">
              <div class="spinner"></div>
              <p>Processing...</p>
            </div>
          )}
        </div>
        
        <div class="video-info">
          <h3>{video.name}</h3>
          <p>{formatSize(video.file_size)} • {video.width}x{video.height}</p>
          
          <div class="video-versions">
            {video.versions.map(v => (
              <span class={`version-badge ${v.processing_status}`}>
                {v.version_name}
              </span>
            ))}
          </div>
          
          <div class="video-actions">
            <button onClick={() => previewVideo(video.id)} class="btn-sm">
              <i class="fas fa-play"></i>
              Preview
            </button>
            <button onClick={() => getEmbedCode(video.id)} class="btn-sm">
              <i class="fas fa-code"></i>
              Embed
            </button>
            <button onClick={() => downloadVideo(video.id)} class="btn-sm">
              <i class="fas fa-download"></i>
              Download
            </button>
            <button onClick={() => deleteVideo(video.id)} class="btn-sm btn-danger">
              <i class="fas fa-trash"></i>
              Delete
            </button>
          </div>
        </div>
      </div>
    ))}
  </div>
  
  {/* Upload Modal */}
  <VideoUploadModal 
    isOpen={uploadModalOpen}
    onClose={closeUploadModal}
    onUploadComplete={handleUploadComplete}
  />
</div>
```

---

## 🎯 **Güncellenmiş Katman Yapısı**

```
traffic-management-platform/
│
├── database/              # Layer 1
├── core/                  # Layer 2
├── api/                   # Layer 3
├── workers/               # Layer 4
├── proxy/                 # Layer 5
├── analytics/             # Layer 6
├── ml/                    # Layer 7
├── frontend/              # Layer 8
├── infrastructure/        # Layer 9
│
├── monitoring/            # Layer 10 (YENİ!)
│   ├── PerformanceMonitor.js
│   ├── HealthChecker.js
│   └── AlertService.js
│
├── backup/                # Layer 11 (YENİ!)
│   ├── BackupService.js
│   ├── RestoreService.js
│   └── SchedulerService.js
│
├── campaign/              # Layer 12 (YENİ!)
│   ├── CampaignTracker.js
│   ├── ConversionTracker.js
│   └── PlatformIntegrations.js
│
├── traffic/               # Layer 13 (YENİ!)
│   ├── TrafficLogger.js
│   ├── SearchService.js
│   └── GeoIPService.js
│
└── media/                 # Layer 14 (YENİ!)
    ├── VideoProcessor.js
    ├── VideoStreamer.js
    └── MediaOptimizer.js
```

---

## 📊 **Yeni Database Tabloları Özeti**

```sql
-- Performance Monitoring (4 tables)
- server_metrics
- backend_health
- uptime_records
- performance_alerts

-- Backup System (3 tables)
- system_backups
- backup_components
- restore_history

-- Campaign Tracking (4 tables)
- campaigns
- campaign_metrics
- ad_creatives
- conversion_events

-- Traffic Logging (3 tables)
- traffic_logs_detailed
- search_queries
- saved_searches

-- Video Management (4 tables)
- videos
- video_versions
- video_pages
- video_analytics

TOTAL: 18 yeni tablo (önceki 7 + yeni 18 = 25 tablo!)
```

---

## 🚀 **Geliştirme Sırası (Güncellenmiş)**

### **Priority 1: Foundation** (Hemen)
1. DATABASE LAYER (7 temel tablo)
2. CORE LAYER (Business logic)
3. API LAYER (REST endpoints)

### **Priority 2: Essential Features** (Sonra)
4. TRAFFIC LOGGER (IP tracking, search)
5. MONITORING (Performance, health)
6. BACKUP SYSTEM (One-click restore)

### **Priority 3: Advanced Features** (Daha sonra)
7. CAMPAIGN TRACKING (Meta, Google Ads)
8. MEDIA LAYER (Video processing)
9. ML LAYER (Bot detection)

---

## ✅ **Onay İster misin?**

Bu özellikleri ekledik:
1. ✅ Sunucu performans izleme (CPU, RAM, Health)
2. ✅ Tam yedekli çalışma (Hot backup + restore)
3. ✅ Meta kampanya takip (Facebook/Google Ads)
4. ✅ IP canlı trafik kaydı (Gelişmiş arama)
5. ✅ Video depo (Upload, compress, optimize)

**Şimdi DATABASE LAYER ile başlayalım mı?** 🚀

Yoksa başka eklemek istediğin özellik var mı?
