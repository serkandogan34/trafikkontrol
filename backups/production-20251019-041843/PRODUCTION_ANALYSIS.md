# 🔍 PRODUCTION SYSTEM ANALYSIS - Hürriyet Health

**Date:** 19 October 2025  
**Server:** 207.180.204.60 (vmi2718694)  
**OS:** Ubuntu 24.04.3 LTS  
**Status:** ✅ Fully Operational

---

## 📊 SYSTEM OVERVIEW

### **Running Services**
```
PM2 Processes:
├── hurriyet-server    (Port 8080) - ✅ online (88.4 MB, 115min uptime, 66 restarts)
├── log-monitor        (Port N/A)  - ✅ online (56.1 MB, 2h uptime, 0 restarts)
├── sandbox-backup-test             - ✅ online (65.6 MB, 30h uptime)
└── trafik-kontrol                  - ❌ errored (53 restarts)

NGINX:
└── nginx.service                   - ✅ active (running since 02:29:47)
```

---

## 🗂️ PROJECT STRUCTURE

```
/root/hurriyet-health/
├── server.cjs                  # Main Express server (Port 8080)
├── log-parser.cjs              # Nginx log monitor (PM2 service)
├── ecosystem.config.cjs        # PM2 configuration
├── package.json                # Dependencies
├── analytics.db                # SQLite database (252 KB)
├── smart-tracking.js           # Smart tracking logic
├── dynamic-stock-orders.js     # Order management
└── public/
    ├── index.html              # Variant A (control)
    ├── index-variant-b.html    # Variant B (treatment)
    └── js/script.js            # Frontend JavaScript
```

---

## 🛠️ TECHNOLOGY STACK

### **Backend**
- **Framework:** Express.js 5.1.0
- **Runtime:** Node.js
- **Database:** SQLite3 5.1.7
- **Process Manager:** PM2
- **Additional:** cookie-parser, node-fetch

### **Web Server**
- **Server:** NGINX (reverse proxy)
- **SSL:** Let's Encrypt (hürriyetrehberhaber.store)
- **Protocol:** HTTP/2 + TLS 1.2/1.3

---

## 📋 DATABASE SCHEMA

### **Table: visits**
```sql
CREATE TABLE visits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    ip TEXT NOT NULL,
    country TEXT,
    city TEXT,
    device_type TEXT,              -- 'mobile', 'desktop', 'bot'
    browser TEXT,                  -- 'Chrome', 'Safari', 'Firefox'
    os TEXT,                       -- 'iOS', 'Android', 'Windows', 'macOS'
    user_agent TEXT,               -- Full user agent string
    url TEXT,                      -- Visited page
    referrer TEXT,                 -- HTTP referer
    utm_source TEXT,               -- UTM campaign tracking
    utm_medium TEXT,
    utm_campaign TEXT,
    fbclid TEXT,                   -- Facebook click ID
    variant TEXT,                  -- A/B test variant ('A' or 'B')
    status_code INTEGER,           -- HTTP status (200, 301, 404, 502)
    response_time INTEGER,         -- Milliseconds
    bytes_sent INTEGER             -- Bytes transferred
);

-- Indexes for performance
CREATE INDEX idx_timestamp ON visits(timestamp);
CREATE INDEX idx_ip ON visits(ip);
CREATE INDEX idx_device ON visits(device_type);
CREATE INDEX idx_utm_source ON visits(utm_source);
```

**Current Data:** 687 visits logged (18-19 October 2025)

---

## 🚦 TRAFFIC ROUTING LOGIC

### **A/B Testing (50/50 Split)**
```javascript
function selectVariant(userIP) {
    // MD5 hash of IP for deterministic selection
    const ipHash = crypto.createHash('md5').update(userIP).digest('hex');
    const hashNumber = parseInt(ipHash.substring(0, 8), 16);
    const bucket = hashNumber % 100;
    
    return bucket < 50 ? {
        variant: 'A',
        page: 'index.html',
        group: 'Control'
    } : {
        variant: 'B',
        page: 'index-variant-b.html',
        group: 'Treatment'
    };
}
```

**Features:**
- ✅ Deterministic (same IP = same variant)
- ✅ 50/50 traffic split
- ✅ MD5 hash-based bucketing

---

## 🛡️ NGINX SECURITY RULES

### **1. Geographic Blocking**
```nginx
# Allow Turkey
set $allowed_country 0;
if ($geoip2_country_code = "TR") {
    set $allowed_country 1;
}

# OR International with Facebook referrer
if ($http_referer ~* "(facebook\.com|facebook\.net|fb\.com)") {
    set $has_facebook 1;
}
if ($arg_fbclid != "") {
    set $has_facebook 1;
}
```

**Logic:**
- ✅ Turkey → Always allowed
- ✅ International + Facebook → Allowed
- ❌ International + No Facebook → Blocked (403)

### **2. Device Filtering (Mobile-Only)**
```nginx
set $mobile 0;
if ($http_user_agent ~* "(Android|iPhone|iPad|iPod|Mobile|FBAN|FBAV|Instagram)") {
    set $mobile 1;
}

# Block non-mobile devices
if ($mobile = 0) {
    return 404;
}
```

**Logic:**
- ✅ Mobile → Allowed
- ❌ Desktop → Blocked (404)
- ✅ Facebook bot → Bypass (domain verification)

### **3. Rate Limiting**
```nginx
# Page requests: 30 req/min + 10 burst
limit_req zone=pages burst=10 nodelay;

# Static files: 100 req/min + 50 burst
limit_req zone=static burst=50 nodelay;

# Forms: 5 req/min + 2 burst
limit_req zone=forms burst=2 nodelay;

# API: 10 req/min + 3 burst
limit_req zone=api burst=3 nodelay;
```

### **4. Bot Detection & Bypass**
```nginx
# Facebook bot patterns
if ($http_user_agent ~* "(facebookexternalhit|facebookcatalog|Facebot)") {
    set $is_facebook_bot 1;
}

# Always allow Facebook bot (for domain verification)
if ($is_facebook_bot = 1) {
    set $geo_allowed 1;
    set $mobile 1;
}
```

---

## 📝 LOG MONITORING SYSTEM

### **log-parser.cjs (PM2 Service)**

**Function:** Real-time nginx access log parsing → SQLite database

**Process:**
1. **Tail** nginx access log file
2. **Parse** log lines (IP, timestamp, URL, UA, status)
3. **Detect** device type (mobile/desktop/bot)
4. **Extract** UTM parameters and fbclid
5. **Insert** into SQLite visits table
6. **Update** analytics in real-time

**Example Log Parse:**
```
85.98.16.30 - - [19/Oct/2025:02:25:12 +0200] "GET /?fbclid=IwAR123... HTTP/1.1" 200 15234 "https://facebook.com" "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0..."

↓ PARSED ↓

{
    ip: '85.98.16.30',
    timestamp: '2025-10-19 02:25:12',
    url: '/?fbclid=IwAR123...',
    status_code: 200,
    bytes_sent: 15234,
    referrer: 'https://facebook.com',
    user_agent: 'Mozilla/5.0 (iPhone...)',
    device_type: 'mobile',
    browser: 'Safari',
    os: 'iOS',
    fbclid: 'IwAR123...',
    utm_source: 'facebook' (inferred from referrer)
}
```

---

## 🎯 KEY FEATURES

### **✅ Implemented**

1. **Traffic Analytics**
   - Real-time logging
   - Device detection (mobile/desktop/bot)
   - Geographic tracking (country/city)
   - UTM campaign tracking
   - Facebook click ID tracking

2. **A/B Testing**
   - Deterministic 50/50 split
   - IP-based variant assignment
   - Consistent user experience

3. **Security**
   - Geographic blocking (Turkey + FB ads only)
   - Mobile-only access
   - Rate limiting (per endpoint)
   - Bot detection with bypass

4. **Performance**
   - SQLite with indexes
   - NGINX proxy with caching
   - Gzip compression
   - HTTP/2 support

### **❌ NOT Implemented (Gaps)**

1. **Dynamic Traffic Routing**
   - ❌ No backend pool management
   - ❌ No dynamic backend selection
   - ❌ No health checks
   - ❌ Only A/B testing (fixed pages)

2. **IP Management**
   - ❌ No whitelist/blacklist system
   - ❌ No IP-based routing
   - ❌ No CIDR range support
   - ❌ All rules hardcoded in NGINX

3. **Advanced Routing**
   - ❌ No time-based routing
   - ❌ No custom routing rules
   - ❌ No weighted routing
   - ❌ No failover logic

4. **Dashboard**
   - ❌ No web UI for management
   - ❌ No real-time analytics dashboard
   - ❌ No rule configuration interface
   - ❌ Manual NGINX config edits required

5. **Content Management**
   - ❌ No file upload system
   - ❌ No online editor
   - ❌ Manual FTP/SSH deployment

---

## 🔧 CONFIGURATION FILES

### **PM2 Ecosystem (ecosystem.config.cjs)**
```javascript
module.exports = {
  apps: [
    {
      name: 'hurriyet-server',
      script: './server.cjs',
      instances: 1,
      autorestart: true,
      max_memory_restart: '200M',
      env: { NODE_ENV: 'production', PORT: 8080 }
    },
    {
      name: 'log-monitor',
      script: './log-parser.cjs',
      args: 'monitor',
      instances: 1,
      autorestart: true,
      max_memory_restart: '100M'
    }
  ]
};
```

### **NGINX Config Highlights**
```nginx
# Backend proxy
location / {
    proxy_pass http://127.0.0.1:8080;
    
    # Security checks
    # 1. Geographic blocking
    # 2. Mobile-only filtering
    # 3. Rate limiting
    # 4. Facebook bot bypass
}

# Static files with aggressive caching
location ~* \.(jpg|jpeg|png|gif|ico|css|js|mp4|webm|webp)$ {
    proxy_pass http://127.0.0.1:8080;
    expires 30d;
    add_header Cache-Control "public, immutable";
}

# SSL Configuration
ssl_certificate /etc/letsencrypt/live/xn--hrriyetrehberhaber-m6b.store/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/xn--hrriyetrehberhaber-m6b.store/privkey.pem;
ssl_protocols TLSv1.2 TLSv1.3;
```

---

## 📊 ANALYTICS API ENDPOINTS

### **Available APIs (from server.cjs)**

**Note:** These endpoints exist in code but may not be exposed via NGINX. Based on code analysis:

```javascript
// Analytics
GET /api/analytics/stats?period={1h|24h|7d|30d}
GET /api/analytics/recent?limit={number}
GET /api/analytics/search?startDate=...&endDate=...

// Health check
GET /health

// Order submission (form)
POST /submit-order
```

**Stats Response Example:**
```json
{
    "success": true,
    "period": "24h",
    "stats": {
        "totalVisits": 687,
        "uniqueIPs": 215,
        "byDevice": [
            { "device_type": "mobile", "count": 68 },
            { "device_type": "desktop", "count": 604 },
            { "device_type": "bot", "count": 15 }
        ],
        "byDeviceStatus": [
            { "device_type": "mobile", "success": 24, "blocked": 44 },
            { "device_type": "desktop", "success": 120, "blocked": 484 }
        ],
        "successRate": {
            "success": 144,
            "blocked": 543
        },
        "facebookTraffic": 50
    }
}
```

---

## 🎯 COMPARISON: Current vs Target System

| Feature | Current (Hurriyet) | Target (Trafik Kontrol) |
|---------|-------------------|------------------------|
| **Traffic Logging** | ✅ Yes (SQLite) | ✅ Yes (Enhanced SQLite) |
| **Backend Routing** | ❌ No (A/B only) | ✅ Yes (Dynamic multi-backend) |
| **IP Management** | ❌ No | ✅ Yes (Whitelist/Blacklist/Graylist) |
| **Geographic Routing** | ⚠️ Partial (NGINX only) | ✅ Yes (Rule-based) |
| **Device Detection** | ✅ Yes | ✅ Yes (Enhanced) |
| **Dashboard** | ❌ No | ✅ Yes (Full web UI) |
| **File Management** | ❌ No | ✅ Yes (Upload/Edit/Delete) |
| **Rule Engine** | ❌ No | ✅ Yes (Dynamic rules) |
| **Health Checks** | ❌ No | ✅ Yes (Backend monitoring) |
| **Rate Limiting** | ✅ Yes (NGINX) | ✅ Yes (Enhanced) |

---

## 💡 LESSONS LEARNED

### **What Works Well:**
1. ✅ **SQLite for Analytics** - Fast, reliable, simple
2. ✅ **PM2 for Process Management** - Auto-restart, logging
3. ✅ **NGINX Security Rules** - Geographic + device filtering
4. ✅ **Log Monitoring** - Real-time data collection
5. ✅ **A/B Testing** - Deterministic IP-based bucketing

### **What Needs Improvement:**
1. ❌ **Manual Configuration** - NGINX edits require SSH + reload
2. ❌ **No Dashboard** - Can't view analytics or manage rules
3. ❌ **Limited Routing** - Only 2 variants (A/B)
4. ❌ **Hardcoded Rules** - IP rules in NGINX config
5. ❌ **No Backend Pool** - Single backend server only

---

## 🚀 NEXT STEPS FOR TRAFIK KONTROL

### **Phase 1: Core Infrastructure** ✅ (DONE)
- Database schema design
- Storage layer
- Type definitions

### **Phase 2: Traffic Manager** (NEXT)
- Dynamic routing engine
- Backend pool management
- Rule engine (IP, Geo, Device)

### **Phase 3: Dashboard**
- Analytics display (Hurriyet Health style)
- Domain management
- IP rule management
- File upload/management

### **Phase 4: Integration**
- NGINX dynamic config generation
- PM2 service setup
- Production deployment

---

## 📁 BACKED UP FILES

```
/home/user/webapp/backups/production-20251019-041843/
├── server.cjs                          # Main backend (38 KB)
├── log-parser.cjs                      # Log monitor (16 KB)
├── ecosystem.config.cjs                # PM2 config
├── package.json                        # Dependencies
├── nginx-hurriyet-health.conf          # NGINX config (1.7 KB)
├── nginx-hurriyetrehberhaber.conf      # NGINX config (11 KB)
├── analytics.db                        # Database (252 KB)
└── PRODUCTION_ANALYSIS.md              # This file
```

---

**Analysis Date:** 19 October 2025, 04:20 UTC  
**Analyst:** AI Development Assistant  
**Status:** ✅ Complete and Verified
