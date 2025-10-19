# 🏗️ Traffic Management Platform - Modern Architecture Design

**Tarih**: 2025-10-19  
**Versiyon**: 2.0 (Layered Architecture)  
**Durum**: Design Phase

---

## 📊 **Sistem Genel Bakış**

### **Mimari Prensipler**

1. **Separation of Concerns** - Her katman tek sorumluluk
2. **Modularity** - Bağımsız, değiştirilebilir modüller
3. **Scalability** - Yatay ve dikey ölçeklenebilir
4. **Maintainability** - Kolay bakım ve geliştirme
5. **Testability** - Birim ve entegrasyon testleri

---

## 🏛️ **Katman Yapısı**

```
traffic-management-platform/
│
├── 📦 1. DATABASE LAYER (Veri Katmanı)
│   ├── sqlite/
│   │   ├── schema.sql           # Veritabanı şeması
│   │   ├── migrations/          # Versiyon migration'ları
│   │   └── seeds/               # Test verileri
│   ├── models/
│   │   ├── Domain.js            # Domain model
│   │   ├── TrafficLog.js        # Traffic log model
│   │   ├── Session.js           # Session model
│   │   ├── DNSRecord.js         # DNS record model
│   │   ├── ABTest.js            # A/B test model
│   │   └── BotDetection.js      # Bot detection model
│   └── repositories/
│       ├── DomainRepository.js  # Domain CRUD operations
│       ├── TrafficRepository.js # Traffic log operations
│       └── ...
│
├── 🧠 2. CORE LAYER (İş Mantığı Katmanı)
│   ├── services/
│   │   ├── DomainService.js     # Domain yönetimi logic
│   │   ├── TrafficService.js    # Traffic routing logic
│   │   ├── DNSService.js        # DNS yönetimi logic
│   │   ├── ABTestService.js     # A/B testing logic
│   │   └── BotService.js        # Bot detection logic
│   ├── engines/
│   │   ├── RoutingEngine.js     # Akıllı routing algoritması
│   │   ├── LoadBalancer.js      # Load balancing logic
│   │   └── HealthChecker.js     # Backend health monitoring
│   └── utils/
│       ├── logger.js            # Logging utility
│       ├── config.js            # Configuration manager
│       └── helpers.js           # Yardımcı fonksiyonlar
│
├── 🌐 3. API LAYER (REST API Katmanı)
│   ├── routes/
│   │   ├── domains.js           # Domain API routes
│   │   ├── traffic.js           # Traffic API routes
│   │   ├── dns.js               # DNS API routes
│   │   ├── nginx.js             # NGINX config routes
│   │   ├── analytics.js         # Analytics routes
│   │   └── auth.js              # Authentication routes
│   ├── middlewares/
│   │   ├── auth.js              # Authentication middleware
│   │   ├── validation.js        # Request validation
│   │   ├── rateLimit.js         # Rate limiting
│   │   └── errorHandler.js      # Error handling
│   ├── controllers/
│   │   ├── DomainController.js  # Domain endpoint logic
│   │   ├── TrafficController.js # Traffic endpoint logic
│   │   └── ...
│   └── server.js                # API server entry point
│
├── ⚙️ 4. WORKER LAYER (Background İşlemler)
│   ├── jobs/
│   │   ├── LogParser.js         # NGINX log parsing job
│   │   ├── HealthChecker.js     # Backend health check job
│   │   ├── MetricsCollector.js  # Metrics toplama job
│   │   └── ABTestAnalyzer.js    # A/B test analiz job
│   ├── schedulers/
│   │   └── CronScheduler.js     # Job scheduling
│   └── queue/
│       └── TaskQueue.js         # Task queue management
│
├── 🔄 5. PROXY LAYER (Traffic Proxy)
│   ├── handlers/
│   │   ├── ProxyHandler.js      # Main proxy logic
│   │   ├── RequestLogger.js     # Request logging
│   │   └── ResponseCache.js     # Response caching
│   ├── rules/
│   │   ├── RoutingRules.js      # Traffic routing rules
│   │   └── FilterRules.js       # Traffic filtering rules
│   └── nginx/
│       ├── templates/           # NGINX config templates
│       └── generator.js         # Config generator
│
├── 📊 6. ANALYTICS LAYER (Analitik Motor)
│   ├── collectors/
│   │   ├── TrafficCollector.js  # Traffic data collector
│   │   ├── PerformanceCollector.js # Performance metrics
│   │   └── ConversionCollector.js # Conversion tracking
│   ├── processors/
│   │   ├── DataAggregator.js    # Veri agregasyonu
│   │   ├── TrendAnalyzer.js     # Trend analizi
│   │   └── ReportGenerator.js   # Rapor üretimi
│   └── exporters/
│       ├── CSVExporter.js       # CSV export
│       └── JSONExporter.js      # JSON export
│
├── 🤖 7. ML LAYER (Machine Learning)
│   ├── models/
│   │   ├── BotDetectionModel.js # Bot detection ML model
│   │   └── TrafficPrediction.js # Traffic prediction model
│   ├── training/
│   │   ├── DataPreparation.js   # Veri hazırlama
│   │   └── ModelTrainer.js      # Model eğitimi
│   └── inference/
│       └── PredictionEngine.js  # Tahmin motoru
│
├── 🎨 8. FRONTEND LAYER (Kullanıcı Arayüzü)
│   ├── src/
│   │   ├── components/          # React bileşenleri
│   │   │   ├── Dashboard/
│   │   │   ├── Domains/
│   │   │   ├── Traffic/
│   │   │   ├── Analytics/
│   │   │   └── Settings/
│   │   ├── pages/               # Sayfa bileşenleri
│   │   ├── hooks/               # Custom React hooks
│   │   ├── services/            # API service layer
│   │   └── utils/               # Frontend utilities
│   ├── public/                  # Static assets
│   └── vite.config.js           # Build config
│
└── 🛠️ 9. INFRASTRUCTURE LAYER (Altyapı)
    ├── config/
    │   ├── development.json     # Dev config
    │   ├── production.json      # Prod config
    │   └── testing.json         # Test config
    ├── scripts/
    │   ├── deploy.sh            # Deployment script
    │   ├── backup.sh            # Backup script
    │   └── migrate.sh           # Migration script
    ├── docker/
    │   ├── Dockerfile           # Docker image
    │   └── docker-compose.yml   # Multi-container setup
    └── monitoring/
        ├── prometheus.yml       # Metrics config
        └── grafana/             # Dashboard config
```

---

## 🔗 **Katmanlar Arası İletişim**

```
┌─────────────┐
│  FRONTEND   │ ← User Interface
└──────┬──────┘
       │ HTTP/REST
       ↓
┌─────────────┐
│   API       │ ← REST API + Auth
└──────┬──────┘
       │ Function Calls
       ↓
┌─────────────┐
│   CORE      │ ← Business Logic
└──────┬──────┘
       │ Repository Pattern
       ↓
┌─────────────┐
│  DATABASE   │ ← Data Persistence
└─────────────┘

   ↕ (Events/Jobs)

┌─────────────┐
│  WORKERS    │ ← Background Tasks
└─────────────┘

   ↕ (Metrics)

┌─────────────┐
│ ANALYTICS   │ ← Data Analysis
└─────────────┘

   ↕ (ML Predictions)

┌─────────────┐
│     ML      │ ← Machine Learning
└─────────────┘
```

---

## 📦 **Katman Detayları**

### **1. DATABASE LAYER** 

**Sorumluluk**: Veri kalıcılığı ve erişimi

**Teknolojiler**:
- SQLite3 (better-sqlite3)
- Schema migrations
- Repository pattern

**Tablolar**:
```sql
-- Domains
CREATE TABLE domains (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'active',
  clean_backend TEXT NOT NULL,
  gray_backend TEXT NOT NULL,
  aggressive_backend TEXT NOT NULL,
  traffic_split TEXT DEFAULT '{"clean":70,"gray":20,"aggressive":10}',
  health_check_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Traffic Logs
CREATE TABLE traffic_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  domain_id INTEGER,
  visitor_ip TEXT,
  user_agent TEXT,
  backend_used TEXT,
  response_time INTEGER,
  status_code INTEGER,
  request_path TEXT,
  is_bot BOOLEAN DEFAULT 0,
  bot_score REAL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (domain_id) REFERENCES domains(id)
);

-- Sessions
CREATE TABLE sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token TEXT UNIQUE NOT NULL,
  user_data TEXT,
  expires_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- DNS Records
CREATE TABLE dns_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  domain_id INTEGER,
  record_type TEXT,
  name TEXT,
  value TEXT,
  ttl INTEGER DEFAULT 300,
  priority INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (domain_id) REFERENCES domains(id)
);

-- A/B Tests
CREATE TABLE ab_tests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  domain_id INTEGER,
  name TEXT,
  variants TEXT, -- JSON: [{name: "A", backend: "url", weight: 50}]
  status TEXT DEFAULT 'active',
  start_date DATETIME,
  end_date DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (domain_id) REFERENCES domains(id)
);

-- A/B Test Results
CREATE TABLE ab_test_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  test_id INTEGER,
  variant_name TEXT,
  conversions INTEGER DEFAULT 0,
  total_requests INTEGER DEFAULT 0,
  avg_response_time REAL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (test_id) REFERENCES ab_tests(id)
);

-- Bot Detections
CREATE TABLE bot_detections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  visitor_ip TEXT,
  user_agent TEXT,
  fingerprint TEXT,
  bot_score REAL,
  detection_reason TEXT,
  behavior_patterns TEXT, -- JSON
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Repository Pattern**:
```javascript
// Example: DomainRepository.js
class DomainRepository {
  constructor(db) {
    this.db = db
  }
  
  findAll() {
    return this.db.prepare('SELECT * FROM domains').all()
  }
  
  findById(id) {
    return this.db.prepare('SELECT * FROM domains WHERE id = ?').get(id)
  }
  
  create(domain) {
    return this.db.prepare(`
      INSERT INTO domains (name, clean_backend, gray_backend, aggressive_backend)
      VALUES (?, ?, ?, ?)
    `).run(domain.name, domain.cleanBackend, domain.grayBackend, domain.aggressiveBackend)
  }
  
  update(id, domain) {
    return this.db.prepare(`
      UPDATE domains SET name = ?, clean_backend = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(domain.name, domain.cleanBackend, id)
  }
  
  delete(id) {
    return this.db.prepare('DELETE FROM domains WHERE id = ?').run(id)
  }
}
```

---

### **2. CORE LAYER**

**Sorumluluk**: İş mantığı ve domain logic

**Servisler**:

```javascript
// Example: DomainService.js
class DomainService {
  constructor(domainRepo, trafficRepo) {
    this.domainRepo = domainRepo
    this.trafficRepo = trafficRepo
  }
  
  async createDomain(domainData) {
    // Validation
    if (!this.validateDomain(domainData)) {
      throw new Error('Invalid domain data')
    }
    
    // Business logic
    const domain = await this.domainRepo.create(domainData)
    
    // Trigger events
    this.emit('domain:created', domain)
    
    return domain
  }
  
  async getDomainStats(domainId) {
    const domain = await this.domainRepo.findById(domainId)
    const trafficLogs = await this.trafficRepo.findByDomain(domainId)
    
    return {
      domain,
      totalRequests: trafficLogs.length,
      avgResponseTime: this.calculateAvgResponseTime(trafficLogs),
      backendDistribution: this.calculateBackendDistribution(trafficLogs)
    }
  }
  
  validateDomain(data) {
    // Domain validation logic
    return data.name && data.cleanBackend
  }
}
```

**Routing Engine**:
```javascript
// RoutingEngine.js
class RoutingEngine {
  constructor(config) {
    this.config = config
  }
  
  determineBackend(domain, visitorData) {
    const botScore = visitorData.botScore
    
    // AI bot detected
    if (botScore > 0.8) {
      return domain.aggressiveBackend
    }
    
    // Suspicious activity
    if (botScore > 0.5) {
      return domain.grayBackend
    }
    
    // Clean traffic
    return domain.cleanBackend
  }
  
  applyABTest(domain, abTest) {
    const random = Math.random()
    let cumulative = 0
    
    for (const variant of abTest.variants) {
      cumulative += variant.weight / 100
      if (random <= cumulative) {
        return variant.backend
      }
    }
    
    return domain.cleanBackend
  }
}
```

---

### **3. API LAYER**

**Sorumluluk**: HTTP endpoints ve authentication

**Route Structure**:
```javascript
// routes/domains.js
import { Router } from 'express'
import { DomainController } from '../controllers/DomainController.js'
import { authMiddleware } from '../middlewares/auth.js'
import { validateDomain } from '../middlewares/validation.js'

const router = Router()
const controller = new DomainController()

// GET /api/domains
router.get('/', authMiddleware, controller.getAll)

// GET /api/domains/:id
router.get('/:id', authMiddleware, controller.getById)

// POST /api/domains
router.post('/', authMiddleware, validateDomain, controller.create)

// PUT /api/domains/:id
router.put('/:id', authMiddleware, validateDomain, controller.update)

// DELETE /api/domains/:id
router.delete('/:id', authMiddleware, controller.delete)

// GET /api/domains/:id/stats
router.get('/:id/stats', authMiddleware, controller.getStats)

export default router
```

**Controller**:
```javascript
// controllers/DomainController.js
export class DomainController {
  constructor(domainService) {
    this.service = domainService
  }
  
  async getAll(req, res) {
    try {
      const domains = await this.service.getAllDomains()
      res.json({ success: true, domains })
    } catch (error) {
      res.status(500).json({ success: false, message: error.message })
    }
  }
  
  async create(req, res) {
    try {
      const domain = await this.service.createDomain(req.body)
      res.status(201).json({ success: true, domain })
    } catch (error) {
      res.status(400).json({ success: false, message: error.message })
    }
  }
}
```

---

### **4. WORKER LAYER**

**Sorumluluk**: Background jobs ve scheduled tasks

**Job Examples**:
```javascript
// jobs/LogParser.js
export class LogParserJob {
  async execute() {
    const logs = await this.readNginxLogs()
    
    for (const log of logs) {
      const parsed = this.parseLogLine(log)
      await this.trafficRepo.create(parsed)
    }
  }
  
  parseLogLine(line) {
    // Parse NGINX log format
    // Extract: IP, timestamp, request, response code, etc.
    return {
      visitorIp: ...,
      timestamp: ...,
      requestPath: ...,
      statusCode: ...
    }
  }
}

// jobs/HealthChecker.js
export class HealthCheckerJob {
  async execute() {
    const domains = await this.domainRepo.findAll()
    
    for (const domain of domains) {
      const healthStatus = await this.checkBackend(domain.cleanBackend)
      await this.updateHealthStatus(domain.id, healthStatus)
    }
  }
  
  async checkBackend(url) {
    try {
      const response = await fetch(url + '/health')
      return response.ok ? 'healthy' : 'unhealthy'
    } catch {
      return 'down'
    }
  }
}
```

**Scheduler**:
```javascript
// schedulers/CronScheduler.js
import cron from 'node-cron'

export class CronScheduler {
  constructor() {
    this.jobs = []
  }
  
  schedule(pattern, job) {
    const task = cron.schedule(pattern, () => job.execute())
    this.jobs.push(task)
  }
  
  start() {
    // Log parser: every minute
    this.schedule('* * * * *', new LogParserJob())
    
    // Health checker: every 5 minutes
    this.schedule('*/5 * * * *', new HealthCheckerJob())
    
    // Metrics collector: every hour
    this.schedule('0 * * * *', new MetricsCollectorJob())
  }
}
```

---

### **5. PROXY LAYER**

**Sorumluluk**: Traffic proxying ve routing

```javascript
// handlers/ProxyHandler.js
export class ProxyHandler {
  constructor(routingEngine, trafficLogger) {
    this.routingEngine = routingEngine
    this.logger = trafficLogger
  }
  
  async handle(req, res) {
    const domain = req.headers['x-original-domain']
    const visitorIp = req.headers['x-real-ip']
    
    // Get domain config
    const domainConfig = await this.getDomainConfig(domain)
    
    // Determine backend based on bot score
    const visitorData = await this.getVisitorData(visitorIp)
    const targetBackend = this.routingEngine.determineBackend(
      domainConfig,
      visitorData
    )
    
    // Proxy request
    const startTime = Date.now()
    const response = await this.forwardRequest(targetBackend, req)
    const responseTime = Date.now() - startTime
    
    // Log traffic
    await this.logger.log({
      domain,
      visitorIp,
      backend: targetBackend,
      responseTime,
      statusCode: response.status
    })
    
    return response
  }
}
```

---

### **6. ANALYTICS LAYER**

**Sorumluluk**: Veri analizi ve raporlama

```javascript
// processors/DataAggregator.js
export class DataAggregator {
  async aggregateDailyStats(domainId, date) {
    const logs = await this.trafficRepo.findByDomainAndDate(domainId, date)
    
    return {
      totalRequests: logs.length,
      uniqueVisitors: new Set(logs.map(l => l.visitorIp)).size,
      avgResponseTime: this.average(logs.map(l => l.responseTime)),
      backendDistribution: this.groupBy(logs, 'backendUsed'),
      statusCodeDistribution: this.groupBy(logs, 'statusCode'),
      topPaths: this.getTopN(logs, 'requestPath', 10)
    }
  }
  
  async generateReport(domainId, startDate, endDate) {
    const dailyStats = []
    
    for (let date = startDate; date <= endDate; date.setDate(date.getDate() + 1)) {
      const stats = await this.aggregateDailyStats(domainId, date)
      dailyStats.push({ date, stats })
    }
    
    return {
      period: { startDate, endDate },
      summary: this.summarize(dailyStats),
      daily: dailyStats,
      trends: this.analyzeTrends(dailyStats)
    }
  }
}
```

---

### **7. ML LAYER**

**Sorumluluk**: Machine learning modelleri

```javascript
// models/BotDetectionModel.js
export class BotDetectionModel {
  constructor() {
    this.weights = this.loadWeights()
  }
  
  predict(features) {
    // Feature extraction
    const {
      requestFrequency,
      userAgentAnomaly,
      fingerprintConsistency,
      behavioralPatterns
    } = features
    
    // Simple weighted scoring
    let score = 0
    score += requestFrequency > 10 ? 0.3 : 0
    score += userAgentAnomaly ? 0.2 : 0
    score += !fingerprintConsistency ? 0.2 : 0
    score += this.analyzePatterns(behavioralPatterns)
    
    return {
      botScore: Math.min(score, 1.0),
      confidence: this.calculateConfidence(features),
      reasons: this.getDetectionReasons(features)
    }
  }
  
  analyzePatterns(patterns) {
    // Behavioral pattern analysis
    // - Mouse movement
    // - Keyboard timing
    // - Scroll behavior
    // - Click patterns
    return patterns.anomalyScore || 0
  }
}
```

---

### **8. FRONTEND LAYER**

**Sorumluluk**: Kullanıcı arayüzü

**React Component Structure**:
```
src/
├── components/
│   ├── Dashboard/
│   │   ├── DashboardLayout.jsx
│   │   ├── StatsCard.jsx
│   │   └── RealtimeChart.jsx
│   ├── Domains/
│   │   ├── DomainList.jsx
│   │   ├── DomainForm.jsx
│   │   └── DomainStats.jsx
│   └── Traffic/
│       ├── TrafficMonitor.jsx
│       ├── TrafficChart.jsx
│       └── TrafficTable.jsx
├── hooks/
│   ├── useDomains.js
│   ├── useTraffic.js
│   └── useWebSocket.js
└── services/
    ├── api.js
    └── websocket.js
```

---

### **9. INFRASTRUCTURE LAYER**

**Sorumluluk**: Deployment, monitoring, configuration

**Docker Setup**:
```yaml
# docker-compose.yml
version: '3.8'

services:
  api:
    build: ./api
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DB_PATH=/data/trafik-kontrol.db
    volumes:
      - ./data:/data
  
  worker:
    build: ./worker
    depends_on:
      - api
    volumes:
      - ./data:/data
  
  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - api
  
  nginx:
    image: nginx:alpine
    ports:
      - "443:443"
    volumes:
      - ./nginx/conf:/etc/nginx/conf.d
      - ./nginx/certs:/etc/nginx/certs
```

---

## 🔄 **Migration Strategy**

### **Faz 1: Altyapı Hazırlığı**
1. Yeni klasör yapısı oluştur
2. Package.json ve dependencies ayarla
3. SQLite schema oluştur
4. Base classes ve utilities hazırla

### **Faz 2: Database Layer**
1. Models oluştur
2. Repositories implement et
3. Migration scripts yaz
4. Mevcut verileri migrate et

### **Faz 3: Core Layer**
1. Services oluştur
2. Business logic taşı
3. Routing engine implement et
4. Unit testler yaz

### **Faz 4: API Layer**
1. Routes tanımla
2. Controllers oluştur
3. Middlewares implement et
4. API testleri yaz

### **Faz 5: Worker Layer**
1. Jobs oluştur
2. Scheduler kurular
3. Background tasks implement et

### **Faz 6: Diğer Katmanlar**
1. Analytics layer
2. ML layer
3. Frontend refactor
4. Infrastructure setup

---

## 🎯 **Sonraki Adım**

Bu mimariyi kabul ediyor musun? Eğer evet ise:
1. İlk katman hangi olsun? (Database öneriyorum)
2. Nasıl bir yol haritası izleyelim?
3. Teknoloji stack'te değişiklik var mı?

**Hazır mısın? Başlayalım! 🚀**
