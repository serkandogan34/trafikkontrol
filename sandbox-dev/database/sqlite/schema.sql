-- =============================================================================
-- Traffic Management Platform - Database Schema
-- Version: 1.0.0
-- Created: 2025-10-19
-- Description: Complete schema with 25 tables (7 base + 18 advanced features)
-- =============================================================================

-- Enable foreign keys
PRAGMA foreign_keys = ON;

-- =============================================================================
-- BASE TABLES (7 tables)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Table: domains
-- Purpose: Store domain configurations and backend routing rules
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS domains (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'paused', 'maintenance')),
  
  -- Backend URLs
  clean_backend TEXT NOT NULL,
  gray_backend TEXT NOT NULL,
  aggressive_backend TEXT NOT NULL,
  
  -- Traffic distribution (JSON)
  traffic_split TEXT DEFAULT '{"clean":70,"gray":20,"aggressive":10}',
  
  -- A/B Testing
  ab_testing_enabled BOOLEAN DEFAULT 0,
  
  -- SSL/TLS
  ssl_enabled BOOLEAN DEFAULT 1,
  ssl_certificate TEXT,
  ssl_private_key TEXT,
  ssl_expires_at TEXT,
  
  -- Rate limiting
  rate_limit_enabled BOOLEAN DEFAULT 1,
  rate_limit_requests INTEGER DEFAULT 1000,
  rate_limit_window INTEGER DEFAULT 3600,
  
  -- Statistics
  total_requests INTEGER DEFAULT 0,
  total_bot_blocks INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- Table: traffic_logs
-- Purpose: Basic traffic logging for all requests
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS traffic_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  domain_id INTEGER NOT NULL,
  
  -- Request info
  visitor_ip TEXT NOT NULL,
  user_agent TEXT,
  request_method TEXT DEFAULT 'GET',
  request_path TEXT,
  
  -- Backend routing
  backend_used TEXT NOT NULL CHECK(backend_used IN ('clean', 'gray', 'aggressive')),
  backend_url TEXT,
  
  -- Performance
  response_time INTEGER,
  response_status INTEGER,
  
  -- Bot detection
  is_bot BOOLEAN DEFAULT 0,
  bot_score REAL DEFAULT 0.0,
  
  -- Geolocation
  country TEXT,
  city TEXT,
  
  -- Timestamps
  request_time TEXT DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (domain_id) REFERENCES domains(id) ON DELETE CASCADE
);

-- -----------------------------------------------------------------------------
-- Table: sessions
-- Purpose: Track user sessions for analytics and bot detection
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT UNIQUE NOT NULL,
  domain_id INTEGER NOT NULL,
  
  -- Session info
  visitor_ip TEXT NOT NULL,
  user_agent TEXT,
  fingerprint TEXT,
  
  -- Session data (JSON)
  session_data TEXT,
  
  -- Statistics
  page_views INTEGER DEFAULT 0,
  total_time_spent INTEGER DEFAULT 0,
  
  -- Bot detection
  is_bot BOOLEAN DEFAULT 0,
  bot_score REAL DEFAULT 0.0,
  
  -- Timestamps
  first_seen TEXT DEFAULT CURRENT_TIMESTAMP,
  last_seen TEXT DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT,
  
  FOREIGN KEY (domain_id) REFERENCES domains(id) ON DELETE CASCADE
);

-- -----------------------------------------------------------------------------
-- Table: dns_records
-- Purpose: DNS management and configuration
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dns_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  domain_id INTEGER NOT NULL,
  
  -- DNS record info
  record_type TEXT NOT NULL CHECK(record_type IN ('A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS')),
  name TEXT NOT NULL,
  value TEXT NOT NULL,
  ttl INTEGER DEFAULT 3600,
  priority INTEGER DEFAULT 10,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
  
  -- Metadata
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (domain_id) REFERENCES domains(id) ON DELETE CASCADE
);

-- -----------------------------------------------------------------------------
-- Table: ab_tests
-- Purpose: A/B testing configurations
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ab_tests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  domain_id INTEGER NOT NULL,
  
  -- Test info
  name TEXT NOT NULL,
  description TEXT,
  
  -- Variants (JSON array)
  variants TEXT NOT NULL,
  
  -- Traffic split (JSON)
  traffic_distribution TEXT DEFAULT '{"A":50,"B":50}',
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'running', 'paused', 'completed')),
  
  -- Test period
  start_date TEXT,
  end_date TEXT,
  
  -- Winner
  winning_variant TEXT,
  
  -- Metadata
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (domain_id) REFERENCES domains(id) ON DELETE CASCADE
);

-- -----------------------------------------------------------------------------
-- Table: ab_test_results
-- Purpose: Store A/B test performance metrics
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ab_test_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ab_test_id INTEGER NOT NULL,
  variant_name TEXT NOT NULL,
  
  -- Metrics
  impressions INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  conversion_rate REAL DEFAULT 0.0,
  
  -- Performance
  avg_response_time REAL DEFAULT 0.0,
  bounce_rate REAL DEFAULT 0.0,
  
  -- Statistics
  statistical_significance REAL DEFAULT 0.0,
  
  -- Metadata
  recorded_at TEXT DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (ab_test_id) REFERENCES ab_tests(id) ON DELETE CASCADE
);

-- -----------------------------------------------------------------------------
-- Table: bot_detections
-- Purpose: Store bot detection events and patterns
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bot_detections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  domain_id INTEGER NOT NULL,
  
  -- Detection info
  visitor_ip TEXT NOT NULL,
  user_agent TEXT,
  fingerprint TEXT,
  
  -- Detection reasons (JSON array)
  detection_reasons TEXT,
  
  -- Scores
  bot_score REAL NOT NULL,
  confidence REAL DEFAULT 0.0,
  
  -- Action taken
  action_taken TEXT CHECK(action_taken IN ('allow', 'challenge', 'block')),
  
  -- Metadata
  detected_at TEXT DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (domain_id) REFERENCES domains(id) ON DELETE CASCADE
);

-- =============================================================================
-- ADVANCED FEATURE 1: SERVER PERFORMANCE MONITORING (4 tables)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Table: server_metrics
-- Purpose: Store real-time server performance metrics
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS server_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Server identification
  server_name TEXT NOT NULL,
  server_type TEXT CHECK(server_type IN ('main', 'backend', 'database', 'cache')),
  
  -- Metric info
  metric_type TEXT NOT NULL CHECK(metric_type IN ('cpu', 'memory', 'disk', 'network', 'custom')),
  metric_value REAL NOT NULL,
  metric_unit TEXT NOT NULL,
  
  -- Thresholds
  warning_threshold REAL,
  critical_threshold REAL,
  
  -- Metadata
  collected_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- Table: backend_health
-- Purpose: Monitor health status of backend servers
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS backend_health (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Backend info
  backend_url TEXT NOT NULL,
  backend_type TEXT CHECK(backend_type IN ('clean', 'gray', 'aggressive')),
  
  -- Health check results
  is_healthy BOOLEAN DEFAULT 1,
  response_time INTEGER,
  status_code INTEGER,
  error_message TEXT,
  
  -- Consecutive failures
  consecutive_failures INTEGER DEFAULT 0,
  
  -- Metadata
  checked_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- Table: uptime_records
-- Purpose: Track system uptime and downtime events
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS uptime_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Component info
  component_name TEXT NOT NULL,
  component_type TEXT CHECK(component_type IN ('server', 'backend', 'database', 'service')),
  
  -- Status
  status TEXT NOT NULL CHECK(status IN ('up', 'down', 'degraded')),
  previous_status TEXT,
  
  -- Duration
  downtime_duration INTEGER DEFAULT 0,
  
  -- Details
  incident_details TEXT,
  
  -- Timestamps
  status_changed_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- Table: performance_alerts
-- Purpose: Store performance alerts and notifications
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS performance_alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Alert info
  alert_type TEXT NOT NULL CHECK(alert_type IN ('cpu', 'memory', 'disk', 'network', 'backend', 'custom')),
  severity TEXT NOT NULL CHECK(severity IN ('info', 'warning', 'critical')),
  
  -- Details
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metric_value REAL,
  threshold_value REAL,
  
  -- Status
  status TEXT DEFAULT 'open' CHECK(status IN ('open', 'acknowledged', 'resolved')),
  acknowledged_at TEXT,
  resolved_at TEXT,
  
  -- Metadata
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- ADVANCED FEATURE 2: HOT BACKUP SYSTEM (3 tables)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Table: system_backups
-- Purpose: Store backup metadata and status
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS system_backups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Backup info
  backup_name TEXT NOT NULL,
  backup_type TEXT NOT NULL CHECK(backup_type IN ('full', 'incremental', 'differential')),
  
  -- Status
  status TEXT DEFAULT 'in_progress' CHECK(status IN ('in_progress', 'completed', 'failed')),
  
  -- Size and location
  backup_size INTEGER DEFAULT 0,
  backup_path TEXT NOT NULL,
  
  -- Verification
  checksum TEXT,
  is_verified BOOLEAN DEFAULT 0,
  
  -- Metadata
  components_backed_up TEXT,
  error_message TEXT,
  
  -- Timestamps
  started_at TEXT DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT
);

-- -----------------------------------------------------------------------------
-- Table: backup_components
-- Purpose: Track individual components within each backup
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS backup_components (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  backup_id INTEGER NOT NULL,
  
  -- Component info
  component_name TEXT NOT NULL,
  component_type TEXT CHECK(component_type IN ('database', 'config', 'static', 'nginx', 'ssl', 'logs')),
  
  -- File info
  file_path TEXT NOT NULL,
  file_size INTEGER DEFAULT 0,
  checksum TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'completed', 'failed')),
  error_message TEXT,
  
  -- Timestamps
  backed_up_at TEXT DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (backup_id) REFERENCES system_backups(id) ON DELETE CASCADE
);

-- -----------------------------------------------------------------------------
-- Table: restore_history
-- Purpose: Track backup restoration operations
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS restore_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  backup_id INTEGER NOT NULL,
  
  -- Restore info
  restore_type TEXT CHECK(restore_type IN ('full', 'partial', 'selective')),
  components_restored TEXT,
  
  -- Status
  status TEXT DEFAULT 'in_progress' CHECK(status IN ('in_progress', 'completed', 'failed', 'rolled_back')),
  
  -- Results
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  error_message TEXT,
  
  -- Rollback info
  rollback_available BOOLEAN DEFAULT 1,
  rollback_backup_id INTEGER,
  
  -- User info
  restored_by TEXT,
  
  -- Timestamps
  started_at TEXT DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT,
  
  FOREIGN KEY (backup_id) REFERENCES system_backups(id)
);

-- =============================================================================
-- ADVANCED FEATURE 3: META CAMPAIGN TRACKING (4 tables)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Table: campaigns
-- Purpose: Store marketing campaign configurations
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campaigns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  domain_id INTEGER NOT NULL,
  
  -- Campaign info
  name TEXT NOT NULL,
  description TEXT,
  platform TEXT NOT NULL CHECK(platform IN ('facebook', 'google', 'tiktok', 'twitter', 'custom')),
  
  -- Campaign identifiers
  campaign_id_external TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  
  -- Budget
  budget REAL DEFAULT 0.0,
  budget_currency TEXT DEFAULT 'USD',
  spend REAL DEFAULT 0.0,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK(status IN ('draft', 'active', 'paused', 'completed')),
  
  -- Campaign period
  start_date TEXT,
  end_date TEXT,
  
  -- Metadata
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (domain_id) REFERENCES domains(id) ON DELETE CASCADE
);

-- -----------------------------------------------------------------------------
-- Table: campaign_metrics
-- Purpose: Store daily campaign performance metrics
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campaign_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id INTEGER NOT NULL,
  
  -- Date
  metric_date TEXT NOT NULL,
  
  -- Traffic metrics
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  ctr REAL DEFAULT 0.0,
  
  -- Conversion metrics
  conversions INTEGER DEFAULT 0,
  conversion_rate REAL DEFAULT 0.0,
  conversion_value REAL DEFAULT 0.0,
  
  -- Financial metrics
  cost REAL DEFAULT 0.0,
  cpc REAL DEFAULT 0.0,
  cpa REAL DEFAULT 0.0,
  roas REAL DEFAULT 0.0,
  roi REAL DEFAULT 0.0,
  
  -- Engagement metrics
  bounce_rate REAL DEFAULT 0.0,
  avg_session_duration INTEGER DEFAULT 0,
  pages_per_session REAL DEFAULT 0.0,
  
  -- Metadata
  synced_at TEXT DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  UNIQUE(campaign_id, metric_date)
);

-- -----------------------------------------------------------------------------
-- Table: ad_creatives
-- Purpose: Store ad creative assets and performance
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ad_creatives (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id INTEGER NOT NULL,
  
  -- Creative info
  name TEXT NOT NULL,
  creative_type TEXT CHECK(creative_type IN ('image', 'video', 'carousel', 'text')),
  
  -- Content
  headline TEXT,
  description TEXT,
  call_to_action TEXT,
  
  -- Assets
  image_url TEXT,
  video_url TEXT,
  thumbnail_url TEXT,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'paused', 'archived')),
  
  -- Performance
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  ctr REAL DEFAULT 0.0,
  conversions INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
);

-- -----------------------------------------------------------------------------
-- Table: conversion_events
-- Purpose: Track individual conversion events from campaigns
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS conversion_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id INTEGER,
  
  -- Tracking info
  click_id TEXT,
  fbclid TEXT,
  gclid TEXT,
  
  -- Session info
  session_id TEXT,
  visitor_ip TEXT,
  
  -- UTM parameters
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  
  -- Conversion info
  conversion_type TEXT CHECK(conversion_type IN ('page_view', 'signup', 'purchase', 'lead', 'custom')),
  conversion_value REAL DEFAULT 0.0,
  
  -- Attribution
  attribution_model TEXT DEFAULT 'last_click',
  time_to_conversion INTEGER,
  
  -- Metadata
  event_data TEXT,
  converted_at TEXT DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE SET NULL
);

-- =============================================================================
-- ADVANCED FEATURE 4: LIVE IP TRAFFIC LOGGING (3 tables)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Table: traffic_logs_detailed
-- Purpose: Comprehensive traffic logging with advanced search capabilities
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS traffic_logs_detailed (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Request identification
  request_id TEXT UNIQUE NOT NULL,
  domain_id INTEGER NOT NULL,
  session_id TEXT,
  
  -- Visitor info
  visitor_ip TEXT NOT NULL,
  ip_version TEXT CHECK(ip_version IN ('ipv4', 'ipv6')),
  user_agent TEXT,
  
  -- Browser & Device
  browser TEXT,
  browser_version TEXT,
  os TEXT,
  os_version TEXT,
  device_type TEXT CHECK(device_type IN ('desktop', 'mobile', 'tablet', 'bot')),
  device_brand TEXT,
  device_model TEXT,
  
  -- Geolocation
  country TEXT,
  country_code TEXT,
  region TEXT,
  city TEXT,
  latitude REAL,
  longitude REAL,
  timezone TEXT,
  isp TEXT,
  organization TEXT,
  
  -- Request details
  request_method TEXT DEFAULT 'GET',
  request_path TEXT NOT NULL,
  request_query TEXT,
  request_headers TEXT,
  request_body_size INTEGER DEFAULT 0,
  
  -- Referrer
  referrer TEXT,
  referrer_domain TEXT,
  
  -- UTM parameters
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  
  -- Backend routing
  backend_used TEXT NOT NULL,
  backend_url TEXT,
  
  -- Response
  response_status INTEGER,
  response_time INTEGER,
  response_size INTEGER DEFAULT 0,
  response_headers TEXT,
  
  -- Bot detection
  is_bot BOOLEAN DEFAULT 0,
  bot_score REAL DEFAULT 0.0,
  bot_type TEXT,
  bot_name TEXT,
  
  -- Security
  is_proxy BOOLEAN DEFAULT 0,
  is_vpn BOOLEAN DEFAULT 0,
  is_tor BOOLEAN DEFAULT 0,
  threat_level TEXT CHECK(threat_level IN ('none', 'low', 'medium', 'high')),
  
  -- Performance
  dns_lookup_time INTEGER,
  tcp_connection_time INTEGER,
  ssl_handshake_time INTEGER,
  time_to_first_byte INTEGER,
  
  -- Metadata
  request_time TEXT DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (domain_id) REFERENCES domains(id) ON DELETE CASCADE
);

-- -----------------------------------------------------------------------------
-- Table: search_queries
-- Purpose: Store user's advanced search queries for quick access
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS search_queries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Query info
  query_name TEXT NOT NULL,
  query_description TEXT,
  
  -- Search parameters (JSON)
  search_params TEXT NOT NULL,
  
  -- Usage stats
  usage_count INTEGER DEFAULT 0,
  last_used_at TEXT,
  
  -- User info
  created_by TEXT,
  is_shared BOOLEAN DEFAULT 0,
  
  -- Metadata
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- Table: saved_searches
-- Purpose: Save specific search result sets for later reference
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS saved_searches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Search info
  search_name TEXT NOT NULL,
  search_description TEXT,
  
  -- Search criteria
  search_criteria TEXT NOT NULL,
  
  -- Results
  result_count INTEGER DEFAULT 0,
  result_ids TEXT,
  
  -- Metadata
  created_by TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- ADVANCED FEATURE 5: VIDEO STORAGE & OPTIMIZATION (4 tables)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Table: videos
-- Purpose: Store video metadata and processing status
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS videos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Video info
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  tags TEXT,
  
  -- Original file
  original_filename TEXT NOT NULL,
  original_path TEXT NOT NULL,
  original_size INTEGER NOT NULL,
  original_format TEXT,
  
  -- Video properties
  duration INTEGER,
  width INTEGER,
  height INTEGER,
  aspect_ratio TEXT,
  framerate REAL,
  bitrate INTEGER,
  codec TEXT,
  
  -- Processing status
  processing_status TEXT DEFAULT 'pending' CHECK(processing_status IN ('pending', 'processing', 'completed', 'failed')),
  processing_progress INTEGER DEFAULT 0,
  processing_error TEXT,
  
  -- Thumbnail
  thumbnail_url TEXT,
  
  -- Storage
  storage_path TEXT,
  total_storage_size INTEGER DEFAULT 0,
  
  -- HLS/DASH
  hls_playlist_url TEXT,
  dash_manifest_url TEXT,
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'published', 'archived')),
  visibility TEXT DEFAULT 'public' CHECK(visibility IN ('public', 'unlisted', 'private')),
  
  -- Statistics
  view_count INTEGER DEFAULT 0,
  
  -- Metadata
  uploaded_by TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  published_at TEXT
);

-- -----------------------------------------------------------------------------
-- Table: video_versions
-- Purpose: Store multiple quality versions of each video
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS video_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  video_id INTEGER NOT NULL,
  
  -- Version info
  quality_name TEXT NOT NULL,
  quality_label TEXT NOT NULL,
  
  -- Resolution
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  
  -- Encoding settings
  bitrate INTEGER NOT NULL,
  codec TEXT NOT NULL,
  format TEXT NOT NULL,
  
  -- File info
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_url TEXT,
  
  -- Processing
  processing_time INTEGER,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'completed', 'failed')),
  
  -- Metadata
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE,
  UNIQUE(video_id, quality_name)
);

-- -----------------------------------------------------------------------------
-- Table: video_pages
-- Purpose: Create custom pages/embeds for videos
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS video_pages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  video_id INTEGER NOT NULL,
  domain_id INTEGER,
  
  -- Page info
  page_slug TEXT UNIQUE NOT NULL,
  page_title TEXT NOT NULL,
  page_description TEXT,
  
  -- SEO
  meta_title TEXT,
  meta_description TEXT,
  meta_keywords TEXT,
  og_image TEXT,
  
  -- Player settings (JSON)
  player_config TEXT DEFAULT '{"autoplay":false,"controls":true,"loop":false}',
  
  -- Custom CSS/JS
  custom_css TEXT,
  custom_js TEXT,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
  
  -- Statistics
  view_count INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE,
  FOREIGN KEY (domain_id) REFERENCES domains(id) ON DELETE SET NULL
);

-- -----------------------------------------------------------------------------
-- Table: video_analytics
-- Purpose: Track video viewing analytics
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS video_analytics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  video_id INTEGER NOT NULL,
  video_page_id INTEGER,
  
  -- Viewer info
  session_id TEXT,
  visitor_ip TEXT,
  user_agent TEXT,
  
  -- Geolocation
  country TEXT,
  city TEXT,
  
  -- Viewing metrics
  watch_duration INTEGER DEFAULT 0,
  completion_rate REAL DEFAULT 0.0,
  quality_selected TEXT,
  
  -- Events (JSON array)
  events TEXT,
  
  -- Device info
  device_type TEXT,
  browser TEXT,
  os TEXT,
  
  -- Metadata
  viewed_at TEXT DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE,
  FOREIGN KEY (video_page_id) REFERENCES video_pages(id) ON DELETE SET NULL
);

-- =============================================================================
-- SCHEMA VERSION TRACKING
-- =============================================================================


-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_domain_name ON domains(name);
CREATE INDEX IF NOT EXISTS idx_domain_status ON domains(status);
CREATE INDEX IF NOT EXISTS idx_traffic_domain ON traffic_logs(domain_id);
CREATE INDEX IF NOT EXISTS idx_traffic_ip ON traffic_logs(visitor_ip);
CREATE INDEX IF NOT EXISTS idx_traffic_time ON traffic_logs(request_time);
CREATE INDEX IF NOT EXISTS idx_traffic_bot ON traffic_logs(is_bot);
CREATE INDEX IF NOT EXISTS idx_session_id ON sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_session_ip ON sessions(visitor_ip);
CREATE INDEX IF NOT EXISTS idx_session_domain ON sessions(domain_id);
CREATE INDEX IF NOT EXISTS idx_dns_domain ON dns_records(domain_id);
CREATE INDEX IF NOT EXISTS idx_dns_type ON dns_records(record_type);
CREATE INDEX IF NOT EXISTS idx_ab_domain ON ab_tests(domain_id);
CREATE INDEX IF NOT EXISTS idx_ab_status ON ab_tests(status);
CREATE INDEX IF NOT EXISTS idx_ab_results_test ON ab_test_results(ab_test_id);
CREATE INDEX IF NOT EXISTS idx_ab_results_variant ON ab_test_results(variant_name);
CREATE INDEX IF NOT EXISTS idx_bot_domain ON bot_detections(domain_id);
CREATE INDEX IF NOT EXISTS idx_bot_ip ON bot_detections(visitor_ip);
CREATE INDEX IF NOT EXISTS idx_bot_score ON bot_detections(bot_score);
CREATE INDEX IF NOT EXISTS idx_metrics_server ON server_metrics(server_name);
CREATE INDEX IF NOT EXISTS idx_metrics_type ON server_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_metrics_time ON server_metrics(collected_at);
CREATE INDEX IF NOT EXISTS idx_health_url ON backend_health(backend_url);
CREATE INDEX IF NOT EXISTS idx_health_status ON backend_health(is_healthy);
CREATE INDEX IF NOT EXISTS idx_health_time ON backend_health(checked_at);
CREATE INDEX IF NOT EXISTS idx_uptime_component ON uptime_records(component_name);
CREATE INDEX IF NOT EXISTS idx_uptime_status ON uptime_records(status);
CREATE INDEX IF NOT EXISTS idx_uptime_time ON uptime_records(status_changed_at);
CREATE INDEX IF NOT EXISTS idx_alerts_type ON performance_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON performance_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON performance_alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_time ON performance_alerts(created_at);
CREATE INDEX IF NOT EXISTS idx_backup_name ON system_backups(backup_name);
CREATE INDEX IF NOT EXISTS idx_backup_status ON system_backups(status);
CREATE INDEX IF NOT EXISTS idx_backup_time ON system_backups(started_at);
CREATE INDEX IF NOT EXISTS idx_component_backup ON backup_components(backup_id);
CREATE INDEX IF NOT EXISTS idx_component_type ON backup_components(component_type);
CREATE INDEX IF NOT EXISTS idx_restore_backup ON restore_history(backup_id);
CREATE INDEX IF NOT EXISTS idx_restore_status ON restore_history(status);
CREATE INDEX IF NOT EXISTS idx_restore_time ON restore_history(started_at);
CREATE INDEX IF NOT EXISTS idx_campaign_domain ON campaigns(domain_id);
CREATE INDEX IF NOT EXISTS idx_campaign_platform ON campaigns(platform);
CREATE INDEX IF NOT EXISTS idx_campaign_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_metrics_campaign ON campaign_metrics(campaign_id);
CREATE INDEX IF NOT EXISTS idx_metrics_date ON campaign_metrics(metric_date);
CREATE INDEX IF NOT EXISTS idx_creative_campaign ON ad_creatives(campaign_id);
CREATE INDEX IF NOT EXISTS idx_creative_status ON ad_creatives(status);
CREATE INDEX IF NOT EXISTS idx_conversion_campaign ON conversion_events(campaign_id);
CREATE INDEX IF NOT EXISTS idx_conversion_type ON conversion_events(conversion_type);
CREATE INDEX IF NOT EXISTS idx_conversion_time ON conversion_events(converted_at);
CREATE INDEX IF NOT EXISTS idx_conversion_fbclid ON conversion_events(fbclid);
CREATE INDEX IF NOT EXISTS idx_conversion_gclid ON conversion_events(gclid);
CREATE INDEX IF NOT EXISTS idx_detailed_request_id ON traffic_logs_detailed(request_id);
CREATE INDEX IF NOT EXISTS idx_detailed_domain ON traffic_logs_detailed(domain_id);
CREATE INDEX IF NOT EXISTS idx_detailed_ip ON traffic_logs_detailed(visitor_ip);
CREATE INDEX IF NOT EXISTS idx_detailed_session ON traffic_logs_detailed(session_id);
CREATE INDEX IF NOT EXISTS idx_detailed_time ON traffic_logs_detailed(request_time);
CREATE INDEX IF NOT EXISTS idx_detailed_country ON traffic_logs_detailed(country);
CREATE INDEX IF NOT EXISTS idx_detailed_city ON traffic_logs_detailed(city);
CREATE INDEX IF NOT EXISTS idx_detailed_referrer ON traffic_logs_detailed(referrer_domain);
CREATE INDEX IF NOT EXISTS idx_detailed_utm_source ON traffic_logs_detailed(utm_source);
CREATE INDEX IF NOT EXISTS idx_detailed_utm_campaign ON traffic_logs_detailed(utm_campaign);
CREATE INDEX IF NOT EXISTS idx_detailed_backend ON traffic_logs_detailed(backend_used);
CREATE INDEX IF NOT EXISTS idx_detailed_status ON traffic_logs_detailed(response_status);
CREATE INDEX IF NOT EXISTS idx_detailed_bot ON traffic_logs_detailed(is_bot);
CREATE INDEX IF NOT EXISTS idx_detailed_device ON traffic_logs_detailed(device_type);
CREATE INDEX IF NOT EXISTS idx_search_name ON search_queries(query_name);
CREATE INDEX IF NOT EXISTS idx_search_usage ON search_queries(usage_count);
CREATE INDEX IF NOT EXISTS idx_saved_name ON saved_searches(search_name);
CREATE INDEX IF NOT EXISTS idx_saved_time ON saved_searches(created_at);
CREATE INDEX IF NOT EXISTS idx_video_status ON videos(status);
CREATE INDEX IF NOT EXISTS idx_video_processing ON videos(processing_status);
CREATE INDEX IF NOT EXISTS idx_video_uploaded ON videos(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_video_created ON videos(created_at);
CREATE INDEX IF NOT EXISTS idx_version_video ON video_versions(video_id);
CREATE INDEX IF NOT EXISTS idx_version_quality ON video_versions(quality_name);
CREATE INDEX IF NOT EXISTS idx_version_status ON video_versions(status);
CREATE INDEX IF NOT EXISTS idx_page_video ON video_pages(video_id);
CREATE INDEX IF NOT EXISTS idx_page_slug ON video_pages(page_slug);
CREATE INDEX IF NOT EXISTS idx_page_status ON video_pages(status);
CREATE INDEX IF NOT EXISTS idx_analytics_video ON video_analytics(video_id);
CREATE INDEX IF NOT EXISTS idx_analytics_page ON video_analytics(video_page_id);
CREATE INDEX IF NOT EXISTS idx_analytics_time ON video_analytics(viewed_at);
CREATE INDEX IF NOT EXISTS idx_analytics_country ON video_analytics(country);

CREATE TABLE IF NOT EXISTS schema_version (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  version TEXT NOT NULL,
  applied_at TEXT DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO schema_version (id, version) VALUES (1, '1.0.0');

-- =============================================================================
-- END OF SCHEMA
-- =============================================================================
