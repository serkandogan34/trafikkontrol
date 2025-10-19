-- ============================================================================
-- TRAFIK KONTROL PLATFORM - DATABASE SCHEMA
-- ============================================================================
-- Version: 1.0
-- Database: SQLite3
-- Inspired by: Hurriyet Health analytics.db
-- ============================================================================

-- ============================================================================
-- 1. DOMAINS TABLE (Ana domain yönetimi)
-- ============================================================================
CREATE TABLE IF NOT EXISTS domains (
    id TEXT PRIMARY KEY,                    -- UUID
    name TEXT UNIQUE NOT NULL,              -- example.com
    display_name TEXT,                      -- "Example Site"
    status TEXT DEFAULT 'active',           -- 'active', 'warning', 'error', 'disabled'
    category TEXT DEFAULT 'general',        -- 'ecommerce', 'news', 'health', etc.
    
    -- Configuration (JSON)
    config JSON,                            -- Full domain configuration
    
    -- Metadata
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT,
    
    -- Stats (cache)
    total_visits INTEGER DEFAULT 0,
    last_visit_at DATETIME
);

CREATE INDEX idx_domains_name ON domains(name);
CREATE INDEX idx_domains_status ON domains(status);

-- ============================================================================
-- 2. VISITS TABLE (Hurriyet Health style - Enhanced)
-- ============================================================================
CREATE TABLE IF NOT EXISTS visits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- Basic info
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    domain TEXT NOT NULL,                   -- Which domain was visited
    
    -- Visitor info (Hurriyet Health fields)
    ip TEXT NOT NULL,
    country TEXT,
    city TEXT,
    device_type TEXT,                       -- 'mobile', 'desktop', 'bot'
    browser TEXT,                           -- 'Chrome', 'Safari', 'Firefox'
    os TEXT,                                -- 'iOS', 'Android', 'Windows', 'macOS'
    user_agent TEXT,                        -- Full user agent string
    
    -- Request info
    url TEXT NOT NULL,                      -- Visited page
    referrer TEXT,                          -- Where they came from
    method TEXT DEFAULT 'GET',              -- HTTP method
    
    -- UTM tracking (Hurriyet Health)
    utm_source TEXT,                        -- 'facebook', 'google', 'instagram'
    utm_medium TEXT,                        -- 'cpc', 'email', 'social'
    utm_campaign TEXT,                      -- Campaign name
    fbclid TEXT,                            -- Facebook click ID
    
    -- A/B testing
    variant TEXT,                           -- 'A' or 'B'
    
    -- Response info (Hurriyet Health)
    status_code INTEGER,                    -- HTTP status (200, 301, 404, 502)
    response_time INTEGER,                  -- Milliseconds
    bytes_sent INTEGER,                     -- Bytes transferred
    
    -- NEW: Traffic routing info
    backend_routed TEXT,                    -- Which backend: 'clean', 'gray', 'blocked', 'bot'
    routing_reason TEXT,                    -- Why: 'ip_whitelist', 'geo_rule', 'device_mobile', etc.
    routing_decision JSON,                  -- Full decision details
    
    -- NEW: IP rule applied
    ip_rule_applied TEXT,                   -- 'whitelist', 'blacklist', 'graylist', 'none'
    
    -- NEW: Bot detection
    is_bot BOOLEAN DEFAULT 0,
    bot_type TEXT,                          -- 'search_engine', 'social_crawler', 'malicious', 'unknown'
    bot_name TEXT,                          -- 'Googlebot', 'FacebookBot', etc.
    bot_confidence INTEGER                  -- 0-100
);

-- Indexes for performance (Hurriyet Health style + new fields)
CREATE INDEX idx_visits_timestamp ON visits(timestamp);
CREATE INDEX idx_visits_ip ON visits(ip);
CREATE INDEX idx_visits_domain ON visits(domain);
CREATE INDEX idx_visits_device_type ON visits(device_type);
CREATE INDEX idx_visits_status_code ON visits(status_code);
CREATE INDEX idx_visits_utm_source ON visits(utm_source);
CREATE INDEX idx_visits_backend_routed ON visits(backend_routed);
CREATE INDEX idx_visits_domain_timestamp ON visits(domain, timestamp);

-- ============================================================================
-- 3. IP_RULES TABLE (Whitelist/Blacklist Management)
-- ============================================================================
CREATE TABLE IF NOT EXISTS ip_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- Rule info
    ip TEXT NOT NULL,                       -- IP address or CIDR range
    rule_type TEXT NOT NULL,                -- 'whitelist', 'blacklist', 'graylist'
    domain TEXT NOT NULL,                   -- Which domain (or '*' for global)
    
    -- Metadata
    reason TEXT,                            -- Why was this rule added
    notes TEXT,                             -- Additional notes
    
    -- Audit trail
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    added_by TEXT,                          -- Who added this rule
    expires_at DATETIME,                    -- Optional expiration
    
    -- Stats
    hit_count INTEGER DEFAULT 0,            -- How many times this rule was triggered
    last_hit_at DATETIME,
    
    UNIQUE(ip, domain, rule_type)
);

CREATE INDEX idx_ip_rules_ip ON ip_rules(ip);
CREATE INDEX idx_ip_rules_domain ON ip_rules(domain);
CREATE INDEX idx_ip_rules_type ON ip_rules(rule_type);

-- ============================================================================
-- 4. GEO_RULES TABLE (Geographic Routing)
-- ============================================================================
CREATE TABLE IF NOT EXISTS geo_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- Rule info
    domain TEXT NOT NULL,
    country TEXT NOT NULL,                  -- ISO 2-letter code (US, TR, DE)
    
    -- Routing decision
    backend TEXT NOT NULL,                  -- 'clean', 'gray', 'blocked', 'custom'
    redirect_url TEXT,                      -- Optional redirect
    
    -- Configuration
    priority INTEGER DEFAULT 0,             -- Higher = more important
    enabled INTEGER DEFAULT 1,              -- 0=disabled, 1=enabled
    
    -- Metadata
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT,
    
    -- Stats
    hit_count INTEGER DEFAULT 0,
    last_hit_at DATETIME
);

CREATE INDEX idx_geo_rules_domain ON geo_rules(domain);
CREATE INDEX idx_geo_rules_country ON geo_rules(country);
CREATE INDEX idx_geo_rules_domain_country ON geo_rules(domain, country);

-- ============================================================================
-- 5. ROUTING_RULES TABLE (Advanced Routing Logic)
-- ============================================================================
CREATE TABLE IF NOT EXISTS routing_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- Rule info
    domain TEXT NOT NULL,
    rule_name TEXT NOT NULL,
    rule_type TEXT NOT NULL,                -- 'device', 'geographic', 'ab_test', 'time', 'custom'
    
    -- Conditions (JSON)
    conditions JSON,                        -- e.g. {"device": "mobile", "country": "US"}
    
    -- Action
    backend TEXT NOT NULL,                  -- Target backend
    action TEXT DEFAULT 'route',            -- 'route', 'redirect', 'block'
    redirect_url TEXT,                      -- If action=redirect
    
    -- Configuration
    priority INTEGER DEFAULT 0,             -- Higher = checked first
    enabled INTEGER DEFAULT 1,
    
    -- A/B testing
    weight INTEGER DEFAULT 100,             -- Percentage (for weighted routing)
    
    -- Metadata
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT,
    
    -- Stats
    hit_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,        -- Successful routes
    last_hit_at DATETIME
);

CREATE INDEX idx_routing_rules_domain ON routing_rules(domain);
CREATE INDEX idx_routing_rules_priority ON routing_rules(priority);
CREATE INDEX idx_routing_rules_enabled ON routing_rules(enabled);

-- ============================================================================
-- 6. BACKENDS TABLE (Backend Server Pool)
-- ============================================================================
CREATE TABLE IF NOT EXISTS backends (
    id TEXT PRIMARY KEY,                    -- UUID
    
    -- Backend info
    name TEXT UNIQUE NOT NULL,              -- 'clean', 'gray', 'blocked', 'bot-handler'
    url TEXT NOT NULL,                      -- http://localhost:8081
    type TEXT DEFAULT 'http',               -- 'http', 'https', 'custom'
    
    -- Health check
    health_check_url TEXT,                  -- /health endpoint
    health_status TEXT DEFAULT 'unknown',   -- 'healthy', 'unhealthy', 'unknown'
    last_health_check DATETIME,
    
    -- Load balancing
    weight INTEGER DEFAULT 1,               -- Load balancing weight
    max_connections INTEGER DEFAULT 1000,
    current_connections INTEGER DEFAULT 0,
    
    -- Configuration
    enabled INTEGER DEFAULT 1,
    timeout INTEGER DEFAULT 30000,          -- Milliseconds
    
    -- Stats
    total_requests INTEGER DEFAULT 0,
    successful_requests INTEGER DEFAULT 0,
    failed_requests INTEGER DEFAULT 0,
    avg_response_time INTEGER DEFAULT 0,    -- Milliseconds
    
    -- Metadata
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_backends_name ON backends(name);
CREATE INDEX idx_backends_enabled ON backends(enabled);

-- ============================================================================
-- 7. ANALYTICS_CACHE TABLE (Pre-computed Stats for Dashboard)
-- ============================================================================
CREATE TABLE IF NOT EXISTS analytics_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- Cache key
    domain TEXT NOT NULL,
    metric_name TEXT NOT NULL,              -- 'hourly_visits', 'device_breakdown', etc.
    period TEXT NOT NULL,                   -- '1h', '24h', '7d', '30d'
    
    -- Cached data
    data JSON NOT NULL,                     -- Pre-computed statistics
    
    -- Cache metadata
    computed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,
    
    UNIQUE(domain, metric_name, period)
);

CREATE INDEX idx_analytics_cache_domain ON analytics_cache(domain);
CREATE INDEX idx_analytics_cache_expires ON analytics_cache(expires_at);

-- ============================================================================
-- 8. SYSTEM_LOGS TABLE (Audit Trail)
-- ============================================================================
CREATE TABLE IF NOT EXISTS system_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- Log info
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    level TEXT NOT NULL,                    -- 'info', 'warning', 'error', 'critical'
    category TEXT,                          -- 'routing', 'security', 'system', 'api'
    
    -- Event details
    event_type TEXT,                        -- 'rule_created', 'backend_down', 'ip_blocked'
    message TEXT NOT NULL,
    details JSON,                           -- Additional structured data
    
    -- Context
    domain TEXT,
    ip TEXT,
    user TEXT,
    
    -- Request info
    request_id TEXT,
    url TEXT
);

CREATE INDEX idx_system_logs_timestamp ON system_logs(timestamp);
CREATE INDEX idx_system_logs_level ON system_logs(level);
CREATE INDEX idx_system_logs_domain ON system_logs(domain);

-- ============================================================================
-- VIEWS (Helper Views for Common Queries)
-- ============================================================================

-- Hourly traffic summary (Hurriyet Health style)
CREATE VIEW IF NOT EXISTS v_hourly_traffic AS
SELECT 
    domain,
    strftime('%Y-%m-%d %H:00', timestamp) as hour,
    COUNT(*) as total_visits,
    COUNT(DISTINCT ip) as unique_ips,
    SUM(CASE WHEN status_code = 200 THEN 1 ELSE 0 END) as successful,
    SUM(CASE WHEN status_code != 200 THEN 1 ELSE 0 END) as blocked,
    SUM(CASE WHEN device_type = 'mobile' THEN 1 ELSE 0 END) as mobile,
    SUM(CASE WHEN device_type = 'desktop' THEN 1 ELSE 0 END) as desktop,
    SUM(CASE WHEN is_bot = 1 THEN 1 ELSE 0 END) as bots
FROM visits
GROUP BY domain, hour
ORDER BY hour DESC;

-- Backend performance summary
CREATE VIEW IF NOT EXISTS v_backend_performance AS
SELECT 
    domain,
    backend_routed,
    COUNT(*) as total_routes,
    AVG(response_time) as avg_response_time,
    SUM(CASE WHEN status_code = 200 THEN 1 ELSE 0 END) as successful,
    SUM(CASE WHEN status_code >= 500 THEN 1 ELSE 0 END) as errors
FROM visits
WHERE backend_routed IS NOT NULL
GROUP BY domain, backend_routed;

-- IP activity summary
CREATE VIEW IF NOT EXISTS v_ip_activity AS
SELECT 
    domain,
    ip,
    COUNT(*) as visit_count,
    MIN(timestamp) as first_seen,
    MAX(timestamp) as last_seen,
    COUNT(DISTINCT device_type) as device_types,
    SUM(CASE WHEN is_bot = 1 THEN 1 ELSE 0 END) as bot_visits,
    ip_rule_applied
FROM visits
GROUP BY domain, ip
ORDER BY visit_count DESC;

-- ============================================================================
-- TRIGGERS (Auto-update timestamps and stats)
-- ============================================================================

-- Update domains.updated_at on modification
CREATE TRIGGER IF NOT EXISTS update_domains_timestamp 
AFTER UPDATE ON domains
BEGIN
    UPDATE domains SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Update domain stats on new visit
CREATE TRIGGER IF NOT EXISTS update_domain_stats
AFTER INSERT ON visits
BEGIN
    UPDATE domains 
    SET 
        total_visits = total_visits + 1,
        last_visit_at = NEW.timestamp
    WHERE name = NEW.domain;
END;

-- Increment IP rule hit count
CREATE TRIGGER IF NOT EXISTS update_ip_rule_hits
AFTER INSERT ON visits
WHEN NEW.ip_rule_applied IS NOT NULL AND NEW.ip_rule_applied != 'none'
BEGIN
    UPDATE ip_rules 
    SET 
        hit_count = hit_count + 1,
        last_hit_at = NEW.timestamp
    WHERE ip = NEW.ip AND domain IN (NEW.domain, '*');
END;

-- Increment routing rule hit count
CREATE TRIGGER IF NOT EXISTS update_routing_rule_hits
AFTER INSERT ON visits
WHEN NEW.routing_decision IS NOT NULL
BEGIN
    UPDATE routing_rules
    SET 
        hit_count = hit_count + 1,
        success_count = success_count + CASE WHEN NEW.status_code = 200 THEN 1 ELSE 0 END,
        last_hit_at = NEW.timestamp
    WHERE domain = NEW.domain 
    AND json_extract(NEW.routing_decision, '$.rule_id') = id;
END;

-- ============================================================================
-- INITIAL DATA (Default backends)
-- ============================================================================

INSERT OR IGNORE INTO backends (id, name, url, type) VALUES
    ('backend-clean', 'clean', 'http://localhost:8081', 'http'),
    ('backend-gray', 'gray', 'http://localhost:8082', 'http'),
    ('backend-blocked', 'blocked', 'http://localhost:8083', 'http'),
    ('backend-bot', 'bot-handler', 'http://localhost:8084', 'http'),
    ('backend-mobile', 'mobile-clean', 'http://localhost:8085', 'http');

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
