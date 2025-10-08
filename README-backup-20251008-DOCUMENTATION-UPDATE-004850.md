# Traffic Management Platform

## URLs
- **Production**: https://3000-ib447iqeyssiw7k0gdxos-6532622b.e2b.dev/dashboard
- **Status**: ✅ Fully Operational - All Features Active
- **Authentication**: Demo mode (auto-token)
- **GitHub**: [serkandogan34/trafikkontrol](https://github.com/serkandogan34/trafikkontrol)

## Navigation Sections
- **🌍 Domainler**: Domain management and configuration
- **📈 Trafik**: Traffic analysis and real-time monitoring  
- **🌐 DNS**: DNS record management with advanced features
- **⚙️ NGINX**: Multi-domain NGINX configuration
- **🚀 Deploy**: Deployment management and infrastructure monitoring
- **🔒 Güvenlik**: Security center with advanced threat detection
- **⚙️ Ayarlar**: **UPGRADED!** Comprehensive system settings with tabbed navigation

## Features
- Domain yönetimi ve trafik analizi
- Bot detection (Google Bot, Facebook Bot tanıma)
- IP whitelist/blacklist yönetimi
- Real-time visitor tracking
- NGINX config generation
- **🚀 NEW: Deployment Management System** - Infrastructure monitoring, server health checks, deployment automation

## ✅ NEW ARCHITECTURE: No Cloudflare Dependencies

### **JSON-Based Data Storage System**
This system now uses **JSON file-based storage** instead of Cloudflare D1/KV/R2, making it:
- ✅ **Independent**: No external database service dependencies
- ✅ **Portable**: Deploy anywhere without cloud service requirements
- ✅ **Fast**: In-memory operations with JSON persistence
- ✅ **Flexible**: Easy data backup, migration, and version control
- ✅ **Cost-Effective**: No database service costs

### **Per-Domain Data Architecture**
Each domain has its own comprehensive configuration stored as JSON:

```javascript
// Domain Data Structure (domains/example.com/config.json)
{
  // Basic domain info
  id: string,
  name: string,
  status: 'active' | 'warning' | 'error',
  
  // IP Management (Phase 1) ✅ IMPLEMENTED
  ipRules: {
    whitelist: [{ ip, reason, addedAt, addedBy }],
    blacklist: [{ ip, reason, addedAt, addedBy }],
    graylist: [{ ip, reason, addedAt, addedBy }],
    ranges: { whitelist: [], blacklist: [], graylist: [] }
  },
  
  // Visitor Analytics (Phase 1) ✅ IMPLEMENTED
  analytics: {
    totalRequests, uniqueVisitors, humanRequests, botRequests,
    cleanServed, grayServed, aggressiveServed, blocked,
    referrers: { facebook, google, twitter, direct, other },
    countries: { 'US': { requests, humans, bots } },
    recentVisitors: [{ ip, userAgent, referer, timestamp, isBot, country, action }]
  },
  
  // Geographic Controls (Phase 2) ✅ IMPLEMENTED
  geoControls: {
    allowedCountries: ['US', 'CA'],
    blockedCountries: ['CN', 'RU'],
    redirectRules: { 'EU': 'eu.example.com' },
    defaultAction: 'allow'
  },
  
  // Time-based Access (Phase 2) ✅ IMPLEMENTED
  timeControls: {
    businessHours: { start: 9, end: 17, days: ['mon-fri'] },
    rules: [{ days, hours, action }],
    holidayBlocks: []
  },
  
  // Campaign Tracking (Phase 3) 🔄 STRUCTURE READY
  campaigns: {
    utmTracking: true,
    campaigns: { 'campaign1': { clicks, conversions, sources } },
    validUtmSources: ['facebook', 'google', 'email']
  },
  
  // Video Delivery (Phase 4) 🔄 STRUCTURE READY
  videoSystem: {
    storage: { type: 'local', basePath: '/videos/' },
    videos: { 'video1': { title, url, views, trackingData } },
    viewTracking: { methods: ['localStorage', 'cookies'], preventMultiple: true }
  }
}
```

## 🚀 PHASE 1: IP Management & Visitor Analytics (COMPLETED)

### **✅ IP Management System**
**Complete per-domain IP security rules management:**

- **Whitelist Management**: Always allow trusted IPs (office, VPN, trusted users)
- **Blacklist Management**: Always block malicious IPs (spam, attacks, competitors)
- **Graylist Management**: Monitor suspicious IPs (potential threats, unknown sources)
- **CIDR Range Support**: Block/allow entire network ranges
- **Bulk Operations**: Import/export IP lists, bulk add/remove operations
- **Real-time Processing**: Instant rule application and traffic filtering
- **Audit Trail**: Track who added/removed IPs and when

### **✅ Advanced Visitor Analytics with Production-Ready Bot Detection**
**Enterprise-grade bot detection and comprehensive visitor tracking:**

#### **🤖 Advanced Bot Detection System (NEW!)**
- **Search Engine Bot Verification**: Google Bot, Bing Bot, Yandex Bot with authenticity verification
- **Social Media Crawler Detection**: Facebook External Hit, Twitter Bot, LinkedIn Bot with verification
- **Monitoring Tool Recognition**: UptimeRobot, Pingdom, GTMetrix, Lighthouse detection
- **Malicious Bot Pattern Detection**: Python requests, curl, wget, scrapy, selenium blocking
- **Suspicious User Agent Analysis**: Fake browser detection, outdated version flagging
- **IP Range Verification**: Known bot IP ranges for Google (66.249.*), Facebook (69.171.*), Twitter (199.59.*)
- **Confidence Scoring**: 0-100% confidence level with detailed analysis
- **Real-time Verification**: Live bot authenticity verification and classification

#### **📊 Enhanced Analytics Dashboard (NEW!)**
- **Bot Type Classification**: Search engines, social crawlers, monitoring, malicious, suspicious
- **Verification Status Tracking**: Verified vs unverified bot statistics and trends
- **Bot Behavior Analysis**: Legitimate vs malicious bot breakdown with actionable insights
- **Advanced Bot Metrics**: Top bot names, confidence distribution, verification rates
- **Geographic Bot Distribution**: Bot traffic by country with detailed breakdown
- **Time-based Bot Patterns**: Hourly bot activity analysis and trends
- **Traffic Quality Assessment**: Human/bot ratio and overall traffic quality metrics

#### **🎯 Traditional Analytics Features**
- **Geographic Analysis**: Country-based visitor distribution and patterns
- **Referrer Tracking**: Facebook, Google, Twitter, direct traffic analysis
- **Content Serving Analytics**: Track clean/gray/aggressive content delivery
- **Hourly Statistics**: Time-based traffic pattern analysis
- **Recent Activity Feed**: Last 1000 visitors with enhanced bot classification
- **Advanced Filtering**: Filter by bot type, verification status, confidence level
- **Real-time Updates**: Live visitor feed with comprehensive bot data

### **Phase 1 API Endpoints**

#### **IP Management APIs**
```
GET    /api/domains/{id}/ip-rules           - Get domain IP rules
POST   /api/domains/{id}/ip-rules           - Add IP rule (whitelist/blacklist/graylist)
DELETE /api/domains/{id}/ip-rules/{ip}      - Remove IP from all lists
GET    /api/domains/{id}/ip-check/{ip}      - Check IP status
POST   /api/domains/{id}/ip-bulk            - Bulk IP operations
```

#### **Visitor Analytics APIs**
```
GET    /api/domains/{id}/analytics          - Get analytics summary
GET    /api/domains/{id}/analytics/detailed - Get filtered analytics
GET    /api/domains/{id}/visitors/live      - Real-time visitor feed
POST   /api/traffic/log                     - Enhanced traffic logging
```

### **Dashboard Features (Phase 1)**

#### **🛡️ IP Management Interface**
- **Visual IP Rules Management**: Color-coded whitelist/blacklist/graylist
- **Quick Add Forms**: Add single IPs or bulk import
- **Real-time Status**: See current IP rule counts and recent additions
- **Search & Filter**: Find IPs by address, reason, or date added
- **Export/Import**: Backup and restore IP rule configurations

#### **📊 Analytics Dashboard**
- **Real-time Metrics**: Live visitor counters and traffic breakdown
- **Geographic Visualization**: Country-based visitor distribution
- **Content Performance**: Track which content types perform best
- **Referrer Analysis**: See traffic sources and conversion patterns
- **Activity Timeline**: Live feed of visitor actions and decisions

## ✅ ALL PHASES COMPLETED

### **Phase 2: Geographic & Time Controls** ✅ IMPLEMENTED
- **Country-based Access Control**: Allow/block by visitor country with GeoIP detection
- **Time-based Restrictions**: Business hours, weekend rules, timezone-aware controls
- **Geographic Routing**: Redirect users based on location with custom redirect URLs
- **Holiday Scheduling**: Automatic holiday traffic blocking with date range support
- **Combined Access Control**: Integrated IP + Geographic + Time validation system
- **Analytics Integration**: Geographic and time-based analytics tracking

### **Phase 3: Campaign Tracking & Rate Limiting** ✅ IMPLEMENTED & TESTED
- **UTM Campaign Tracking**: Track campaign performance and attribution with real-time analytics
- **Source Analysis**: Detailed referrer and campaign analytics with top campaigns/sources breakdown
- **Advanced Rate Limiting**: Per-IP, per-session, and burst limits with bot-specific controls
- **Custom Parameters**: Track custom URL parameters and events with configurable UTM sources
- **Real-time Testing**: Built-in campaign and rate limiting test interfaces
- **Analytics Dashboard**: Comprehensive 4-tab interface for campaign and rate limiting management

### **Phase 4: Video Delivery System** ✅ IMPLEMENTED
- **Single-View Tracking**: Prevent multiple video views per user
- **Multi-Storage Detection**: Track views across localStorage, cookies, fingerprints
- **Video Analytics**: Views, completion rates, geographic distribution
- **Encrypted Delivery**: Secure video URLs with time-based tokens

### **Phase 5: Advanced Security Rules** ✅ IMPLEMENTED & TESTED
- **Custom Security Rules**: Create complex conditional security policies
- **Honeypot System**: Trap and identify malicious visitors
- **Behavior Analysis**: Detect suspicious visitor patterns
- **Security Event Monitoring**: Real-time security event tracking
- **Advanced Rule Engine**: Field-based conditions with operators
- **Risk Assessment**: Automatic threat level classification

### **Phase 6: Hook System & Integrations** ✅ IMPLEMENTED & TESTED (FINAL PHASE)
- **Webhooks**: Real-time notifications to external systems with signature verification
- **Custom Scripts**: Execute sandboxed JavaScript code on visitor events
- **API Integrations**: Connect to CRM, analytics, Slack, and marketing tools
- **Event System**: Manual and automatic event triggering with comprehensive monitoring
- **Integration Analytics**: Success rates, call statistics, and performance tracking
- **Multi-Service Support**: Slack, Discord, CRM systems, analytics platforms

## Video Delivery System (Phase 4 Architecture)

### **No Cloudflare R2 Dependencies**
The video system now supports multiple storage options:

```javascript
// Video Storage Options
{
  storage: {
    type: 'local',           // Direct file serving
    basePath: '/videos/',    // Local path
    cdnUrl: 'https://cdn.example.com',  // External CDN
    encryption: false        // Optional encryption
  },
  
  // Multi-method view tracking
  viewTracking: {
    methods: [
      'localStorage',   // Browser local storage
      'sessionStorage', // Session-based tracking  
      'cookies',        // HTTP cookies
      'fingerprint'     // Browser fingerprinting
    ],
    preventMultiple: true,
    trackingWindow: 86400  // 24 hours
  }
}
```

### **Alternative Video Hosting Options**
- **Direct File Serving**: Host videos directly on your server
- **External CDN**: Use any CDN service (AWS CloudFront, Cloudflare, etc.)
- **YouTube/Vimeo Integration**: Embed external videos with tracking
- **Third-party Storage**: AWS S3, Google Cloud Storage, etc.

## Complete API Reference - All 6 Phases

### **Phase 1: IP Management & Analytics**
```
# IP Management
GET    /api/domains/{id}/ip-rules           - View IP rules dashboard
POST   /api/domains/{id}/ip-rules           - Add IP to whitelist/blacklist/graylist
DELETE /api/domains/{id}/ip-rules/{ip}      - Remove IP rule
POST   /api/domains/{id}/ip-bulk            - Bulk IP operations

# Visitor Analytics  
GET    /api/domains/{id}/analytics          - Real-time visitor analytics
GET    /api/domains/{id}/analytics/detailed - Filtered analytics with time range
GET    /api/domains/{id}/analytics/bots     - Advanced bot detection analytics (NEW!)
GET    /api/domains/{id}/visitors/live      - Live visitor activity feed
```

### **Phase 2: Geographic & Time Controls** ✅ IMPLEMENTED
```
# Geographic Controls
GET    /api/domains/{id}/geographic         - Get geographic control settings
PUT    /api/domains/{id}/geographic         - Update geographic control settings
POST   /api/domains/{id}/access-test        - Test combined access control (IP+Geo+Time)

# Time-based Controls  
GET    /api/domains/{id}/time               - Get time-based control settings
PUT    /api/domains/{id}/time               - Update time-based control settings

# Combined Access Control
POST   /api/domains/{id}/access-test        - Test visitor access with all controls
```

### **Phase 3: Campaign Tracking & Rate Limiting** ✅ IMPLEMENTED & TESTED
```
# Campaign Tracking
GET    /api/domains/{id}/campaigns          - Get campaign analytics and settings
PUT    /api/domains/{id}/campaigns          - Update campaign tracking settings  
POST   /api/domains/{id}/campaigns/track    - Track campaign click with UTM parameters

# Rate Limiting
GET    /api/domains/{id}/rate-limiting      - Get rate limiting status and configuration
PUT    /api/domains/{id}/rate-limiting      - Update rate limiting settings
POST   /api/domains/{id}/rate-limiting/check - Check rate limit for specific IP
```

### **Phase 4: Video Delivery System**
```
# Video Management
GET    /api/domains/{id}/videos             - Video delivery configuration
POST   /api/domains/{id}/videos             - Add video configuration
GET    /api/domains/{id}/video-analytics    - Video viewing analytics
POST   /api/video-access-token             - Generate video access token
```

### **Phase 5: Advanced Security Rules**
```
# Security Management
GET    /api/domains/{id}/security          - Security system overview
PUT    /api/domains/{id}/security/toggle   - Enable/disable security system
POST   /api/domains/{id}/security/rules    - Add custom security rule
DELETE /api/domains/{id}/security/rules/{ruleId} - Delete security rule
POST   /api/domains/{id}/security/honeypots - Add honeypot trap
DELETE /api/domains/{id}/security/honeypots/{honeypotId} - Delete honeypot
```

### **Phase 6: Hook System & Integrations**
```
# Integration Overview
GET    /api/domains/{id}/integrations      - All integrations overview

# Webhook Management
GET    /api/domains/{id}/integrations/webhooks - List webhooks
POST   /api/domains/{id}/integrations/webhooks - Add webhook
PUT    /api/domains/{id}/integrations/webhooks/{webhookId} - Update webhook
DELETE /api/domains/{id}/integrations/webhooks/{webhookId} - Delete webhook
POST   /api/domains/{id}/integrations/webhooks/{webhookId}/test - Test webhook

# Custom Scripts Management
GET    /api/domains/{id}/integrations/scripts - List custom scripts
POST   /api/domains/{id}/integrations/scripts - Add custom script
PUT    /api/domains/{id}/integrations/scripts/{scriptId} - Update script
DELETE /api/domains/{id}/integrations/scripts/{scriptId} - Delete script
POST   /api/domains/{id}/integrations/scripts/{scriptId}/execute - Execute script

# API Connections Management
GET    /api/domains/{id}/integrations/apis - List API connections
POST   /api/domains/{id}/integrations/apis - Add API connection
PUT    /api/domains/{id}/integrations/apis/{connectionId} - Update connection
DELETE /api/domains/{id}/integrations/apis/{connectionId} - Delete connection
POST   /api/domains/{id}/integrations/apis/{connectionId}/test - Test connection

# Event System
POST   /api/domains/{id}/integrations/trigger-event - Trigger manual event
```

### **Core System APIs**
```
# Domain Management
GET    /api/domains                         - List all domains
POST   /api/domains                         - Add new domain
PUT    /api/domains/{id}                    - Update domain
DELETE /api/domains/{id}                    - Delete domain
POST   /api/domains/{id}/check              - Check domain status

# Traffic Logging
POST   /api/traffic/log                     - Enhanced traffic logging with analytics

# Authentication
POST   /api/login                           - Admin authentication
POST   /api/logout                          - Logout

# DNS Management
GET    /api/dns                             - DNS records management
POST   /api/dns                             - Create DNS record
PUT    /api/dns/{id}                        - Update DNS record
DELETE /api/dns/{id}                        - Delete DNS record

# Deployment Management
GET    /api/deployment/stats               - Deployment statistics 
POST   /api/deployment/quick-deploy        - Execute quick deployment
GET    /api/test-deployment               - Server health testing
```

## 🚀 NEW: Deployment Management System

### **Infrastructure Monitoring Dashboard**
The deployment section provides comprehensive infrastructure management and monitoring capabilities:

#### **📊 Deployment Status Overview**
- **Active Servers Count**: Real-time monitoring of active server instances
- **Deployed Domains**: Track domains currently deployed across environments
- **Pending Deployments**: Monitor deployment queue and processing status
- **Average Response Time**: Performance metrics across all deployments

#### **⚡ Quick Deploy System**
**Multi-Environment Deployment Support:**
- **Production Server**: Deploy to live production environment
- **Staging Environment**: Test deployments in staging
- **Development Server**: Deploy to development environment  
- **Custom Server**: Deploy to custom server configurations

**Deployment Types:**
- **NGINX Config**: Deploy NGINX configuration updates
- **DNS Records**: Deploy DNS record changes
- **SSL Certificates**: Deploy SSL certificate updates
- **Full Stack**: Complete infrastructure deployment

#### **🏥 Server Health Check System**
**Comprehensive Health Monitoring:**
- **HTTP Response Checks**: Verify server HTTP response status
- **SSL Certificate Validation**: Check SSL certificate validity and expiration
- **DNS Resolution Testing**: Verify domain name resolution
- **Backend Connection Tests**: Check backend server accessibility
- **Response Time Monitoring**: Track server response performance

#### **🌐 DNS Propagation Testing**
**Advanced DNS Verification:**
- **A Record Verification**: Check IPv4 address records
- **CNAME Record Testing**: Verify canonical name records  
- **MX Record Validation**: Check mail exchange records
- **NS Record Testing**: Verify name server records
- **Global Propagation Check**: Test DNS propagation worldwide

#### **📈 Deployment History & Logs**
**Real-time Deployment Tracking:**
- **Recent Deployments**: Track latest deployment activities
- **Live Deployment Logs**: Real-time deployment process monitoring
- **Status Tracking**: Monitor deployment success/failure rates
- **Time-stamped Activity**: Detailed deployment timeline
- **Log Download**: Export deployment logs for analysis

#### **🔧 Advanced Deployment Tools**
**Enterprise Deployment Features:**
- **Bulk Deploy**: Deploy multiple configurations simultaneously
- **Rollback System**: Quick rollback to previous deployments
- **Schedule Deploy**: Automated scheduled deployments  
- **Deployment Analytics**: Performance analysis and optimization insights

### **Deploy Section Features**

#### **Quick Deploy Workflow**
1. **Select Target Environment**: Choose production, staging, development, or custom
2. **Choose Deployment Type**: NGINX config, DNS records, SSL, or full stack
3. **Execute Deployment**: One-click deployment with live progress tracking
4. **Monitor Progress**: Real-time logs and status updates
5. **Verify Success**: Automatic health checks and validation

#### **Health Check Workflow**  
1. **Enter Server Details**: Input server IP/domain and test domain
2. **Run Health Check**: Execute comprehensive server health validation
3. **View Results**: Detailed health check results with pass/fail status
4. **DNS Propagation**: Verify DNS record propagation globally
5. **Performance Metrics**: Monitor response times and server performance

#### **Deployment History Tracking**
- **Activity Timeline**: Complete deployment history with timestamps
- **Success/Failure Rates**: Track deployment reliability
- **Performance Trends**: Monitor deployment speed improvements
- **Configuration Changes**: Track what was deployed and when
- **User Activity**: See who performed deployments

### **Integration with Other Systems**

#### **🔗 NGINX Integration**
The deployment system seamlessly integrates with NGINX configuration management:
- **Config Validation**: Automatic NGINX configuration validation before deployment
- **Backup Creation**: Automatic backup of current configurations
- **Zero Downtime**: Rolling deployment with health checks
- **Multi-Domain Support**: Deploy configurations for multiple domains

#### **🌐 DNS Integration** 
Coordinate DNS updates with infrastructure deployments:
- **DNS-First Deployment**: Update DNS records before server deployment
- **Health Check Integration**: Verify DNS propagation before marking deployment complete
- **Rollback Support**: Automatic DNS rollback on deployment failure

#### **🔒 Security Integration**
Deploy security configurations alongside infrastructure:
- **IP Rule Deployment**: Deploy whitelist/blacklist rules to servers
- **Security Policy Updates**: Push security configurations to edge servers
- **Certificate Deployment**: Automated SSL certificate deployment and renewal

### **Deployment API Endpoints**

```javascript
# Deployment Management
GET    /api/deployment/stats               - Get deployment statistics
POST   /api/deployment/quick-deploy        - Execute quick deployment
GET    /api/deployment/history            - Get deployment history
POST   /api/deployment/rollback/{id}       - Rollback deployment

# Health Monitoring  
GET    /api/test-deployment               - Server health check
POST   /api/health-check                  - Custom health check
GET    /api/deployment/status/{id}        - Check deployment status

# Configuration Management
POST   /api/deployment/validate-config     - Validate configuration
POST   /api/deployment/backup-config      - Create configuration backup
GET    /api/deployment/configs            - List configuration versions
```

### **🎯 Use Cases**

#### **Production Deployment Scenario**
1. **Development**: Create NGINX config for new domain
2. **Validation**: Validate configuration using deployment tools  
3. **Staging**: Deploy to staging environment for testing
4. **Health Check**: Run comprehensive health checks on staging
5. **Production**: Deploy to production with monitoring
6. **Verification**: Automatic post-deployment verification and monitoring

#### **Emergency Rollback Scenario**
1. **Issue Detection**: Monitor deployment logs for issues
2. **Quick Assessment**: Use health checks to confirm problems
3. **Instant Rollback**: One-click rollback to previous working state
4. **Status Verification**: Confirm rollback success with health checks
5. **Issue Analysis**: Review deployment logs to identify root cause

#### **Scheduled Maintenance Scenario**
1. **Schedule Planning**: Use scheduled deployment for maintenance windows
2. **Pre-deployment Checks**: Automated pre-deployment validation
3. **Maintenance Execution**: Automated deployment during off-peak hours
4. **Health Monitoring**: Continuous monitoring during deployment
5. **Success Notification**: Automatic notifications on completion

### **🔧 Configuration Export/Import**

**Deployment Configuration Management:**
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "servers": {
    "production": { "ip": "192.168.1.100", "status": "active" },
    "staging": { "ip": "192.168.1.101", "status": "active" },
    "development": { "ip": "192.168.1.102", "status": "active" }
  },
  "deployments": [
    { "domain": "example.com", "backend": "clean", "status": "active" },
    { "domain": "test.com", "backend": "gray", "status": "active" }
  ],
  "settings": {
    "autoBackup": true,
    "healthCheckInterval": 30,
    "failoverEnabled": true
  }
}
```

### **📊 Monitoring and Analytics**

**Real-time Deployment Metrics:**
- **Deployment Success Rate**: Track successful vs failed deployments
- **Average Deployment Time**: Monitor deployment performance trends
- **Server Health Metrics**: Continuous server performance monitoring
- **DNS Propagation Times**: Track DNS update propagation speeds
- **Configuration Drift Detection**: Monitor configuration changes over time

This deployment management system provides enterprise-grade infrastructure management while maintaining the same simplicity and reliability as the rest of the Traffic Management Platform.

## ⚙️ UPGRADED: System Settings & Configuration

### **Tabbed Settings Interface**
The settings section now features a comprehensive tabbed interface for organized system management:

#### **📋 General Settings Tab**
**Platform Configuration:**
- **Platform Name**: Customize platform branding and display name
- **Default Language**: Multi-language support (Turkish, English, German, French)
- **Timezone Configuration**: Global timezone settings for accurate time displays
- **Session Management**: Configurable session timeout and auto-logout settings

**Authentication Settings:**
- **Two-Factor Authentication**: Enable/disable 2FA requirement for admin access
- **Session Timeout**: Customizable session duration (5-1440 minutes)
- **Auto Logout**: Automatic logout on browser close
- **Password Management**: Secure admin password change functionality

**Default Configuration:**
- **Rate Limiting Defaults**: System-wide default rate limits for new domains
- **Bot Protection Defaults**: Default bot detection and limiting settings
- **Analytics Retention**: Configurable data retention period (1-365 days)

#### **🖥️ System Settings Tab**
**System Information Display:**
- **Platform Version**: Current software version information
- **Node.js Version**: Runtime environment details
- **System Uptime**: Real-time uptime monitoring
- **Memory Usage**: Current memory consumption and limits
- **CPU Usage**: Real-time CPU utilization monitoring

**File System Configuration:**
- **Max Upload Size**: Configurable file upload limits (1-1000 MB)
- **Temp File Cleanup**: Automatic cleanup interval (1-168 hours)
- **Log Compression**: Automatic log file compression settings

**API Configuration:**
- **API Rate Limiting**: Configurable API request limits (100-10000 req/min)
- **API Timeout**: Request timeout settings (5-300 seconds)
- **CORS Origins**: Cross-origin request security configuration

#### **🚀 Performance Settings Tab**
**Cache Management:**
- **Memory Cache Size**: Configurable cache memory allocation (32-2048 MB)
- **Cache TTL**: Time-to-live settings (60-86400 seconds)
- **Cache Compression**: Enable/disable cache data compression
- **Cache Clear**: Manual cache clearing functionality

**Database Performance:**
- **Connection Pool Size**: Database connection optimization (5-100 connections)
- **Query Timeout**: Database query timeout settings (1000-30000 ms)
- **Query Logging**: Enable/disable SQL query logging for debugging
- **Database Optimization**: Automated database maintenance tools

**Worker Process Configuration:**
- **Worker Count**: Multi-process worker configuration (1-16 workers)
- **Memory per Worker**: Per-worker memory limits (128-2048 MB)
- **Restart Threshold**: Automatic worker restart criteria

#### **👁️ Monitoring Settings Tab**
**Real-Time Monitoring Configuration:**
- **Monitoring Status**: Live monitoring system control
- **Refresh Interval**: Configurable monitoring update frequency (5-300 seconds)
- **Auto-start Monitoring**: Automatic monitoring system activation
- **System Resource Tracking**: CPU, memory, and performance monitoring

**Alert System:**
- **Email Alerts**: Configurable email notification system
- **SMS Alerts**: SMS notification configuration
- **Alert Thresholds**: CPU and memory alert trigger levels
- **Alert Recipients**: Admin contact information management

**Health Check Configuration:**
- **Check Interval**: System health check frequency (30-3600 seconds)
- **Timeout Settings**: Health check timeout configuration (5-60 seconds)
- **Retry Configuration**: Failed health check retry logic (1-10 retries)

#### **💾 Backup Settings Tab**
**Automatic Backup System:**
- **Auto Backup Toggle**: Enable/disable automated backup system
- **Backup Frequency**: Configurable backup intervals (hourly, daily, weekly, monthly)
- **Retention Period**: Backup file retention duration (1-365 days)
- **Size Limits**: Maximum backup file size configuration (1-100 GB)

**Manual Backup Operations:**
- **Instant Backup Creation**: On-demand backup generation
- **Backup Restore**: System restore from backup files
- **Backup Content**: Comprehensive data inclusion (domains, analytics, IP rules, DNS records)

**Backup History Management:**
- **History Viewer**: Visual backup timeline with details
- **Backup Download**: Individual backup file download
- **Backup Deletion**: Selective backup file management
- **Storage Analytics**: Backup space usage and optimization

#### **📄 Logs Settings Tab**
**Log Configuration:**
- **Log Levels**: Configurable logging verbosity (Error, Warning, Info, Debug)
- **Log Rotation**: Automatic log file rotation (10-1000 MB)
- **Max Log Files**: Log file retention count (1-100 files)
- **Console Logging**: Enable/disable console output

**Live Log Viewer:**
- **Real-time Log Stream**: Live log monitoring with color coding
- **Log Filtering**: Filter by log level and content
- **Log Export**: Download log files for analysis
- **Log Management**: Clear and refresh log display

**Log Analytics:**
- **Message Statistics**: Breakdown of log messages by type
- **Storage Usage**: Log file space consumption
- **Performance Impact**: Logging overhead monitoring
- **Trend Analysis**: Historical logging patterns

### **🔧 Settings Management Features**

#### **Configuration Export/Import:**
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "platform": "Traffic Management Platform",
  "version": "v2.1.0",
  "settings": {
    "platform": { "name": "...", "language": "tr", "timezone": "..." },
    "auth": { "sessionTimeout": 60, "require2FA": false },
    "performance": { "cacheSize": 128, "cacheTTL": 3600 },
    "monitoring": { "interval": 30, "emailAlerts": true },
    "backup": { "autoBackup": true, "frequency": "daily" },
    "logs": { "level": "info", "rotationSize": 100 }
  }
}
```

#### **System Actions:**
- **Save All Settings**: Comprehensive settings persistence
- **Reset to Defaults**: Restore factory default settings
- **Export Configuration**: Full system configuration backup
- **Import Configuration**: Restore settings from backup file
- **Password Management**: Secure admin credential updates

### **🎯 Advanced Settings Features**

#### **Real-time System Monitoring:**
- **Live System Statistics**: Real-time CPU, memory, and uptime display
- **Performance Metrics**: System performance tracking and optimization
- **Resource Alerts**: Automatic threshold-based alert system
- **Health Monitoring**: Continuous system health assessment

#### **Automated Maintenance:**
- **Cache Management**: Automated cache optimization and clearing
- **Database Optimization**: Automated database maintenance routines
- **Log Rotation**: Intelligent log file management and compression
- **Backup Automation**: Scheduled backup creation and cleanup

#### **Security Configuration:**
- **Session Management**: Advanced session security and timeout controls
- **Authentication Settings**: Multi-factor authentication configuration
- **API Security**: Rate limiting and CORS security management
- **System Hardening**: Performance and security optimization settings

### **📊 Settings Integration**

The settings system integrates seamlessly with all other platform components:

#### **🔗 Domain Integration**
- **Default Settings**: New domains inherit configured defaults
- **Bulk Configuration**: Apply settings across multiple domains
- **Performance Optimization**: Domain-specific performance tuning

#### **🌐 DNS Integration**
- **Default TTL**: Configure default DNS record TTL values
- **Propagation Settings**: DNS propagation monitoring configuration
- **Provider Management**: DNS provider authentication and settings

#### **🚀 Deployment Integration**
- **Backup Coordination**: Automatic backups before deployments
- **Health Check Integration**: Pre/post-deployment health verification
- **Performance Monitoring**: Deployment impact on system resources

This comprehensive settings system provides enterprise-level control over every aspect of the Traffic Management Platform while maintaining ease of use and operational efficiency.

## 🌍 PHASE 2: Geographic & Time Controls - Complete Usage Guide

### **📍 Geographic Controls System**
**Advanced country-based access control with GeoIP detection and custom routing:**

#### **🌍 Country-based Access Control**
- **Allowed Countries**: Specify country codes (US, CA, UK, DE) to allow access
- **Blocked Countries**: Block specific countries from accessing content
- **Default Action**: Set fallback behavior for countries not in allow/block lists
- **GeoIP Detection**: Automatic visitor country detection using IP geolocation

**Configuration Example:**
```json
{
  "allowedCountries": ["US", "CA", "UK", "AU"],
  "blockedCountries": ["CN", "RU", "KP"],
  "defaultAction": "allow",
  "redirectRules": {
    "DE": "germany.example.com",
    "FR": "france.example.com"
  }
}
```

#### **🔄 Geographic Routing & Redirects**
- **Custom Redirects**: Redirect specific countries to different domains
- **Regional Routing**: Route EU countries to EU-specific content
- **Landing Page Customization**: Show country-specific landing pages
- **Redirect Analytics**: Track redirect performance and conversion rates

#### **📊 Geographic Analytics Integration**
- **Country Statistics**: Track visitor distribution by country
- **Access Patterns**: Monitor which countries are allowed/blocked
- **Redirect Performance**: Analyze redirect success rates
- **Geographic Trends**: Identify traffic patterns by region

### **⏰ Time-based Access Controls**
**Sophisticated time and schedule-based visitor management:**

#### **🕒 Business Hours Configuration**
- **Operating Hours**: Set start/end times for content availability
- **Day Restrictions**: Configure weekday/weekend access rules
- **Timezone Support**: All times are timezone-aware for global accuracy
- **Multiple Time Zones**: Support different time zones per domain

**Business Hours Example:**
```json
{
  "businessHours": {
    "start": 9,
    "end": 17,
    "days": ["monday", "tuesday", "wednesday", "thursday", "friday"],
    "timezone": "America/New_York"
  }
}
```

#### **📅 Advanced Time Rules**
- **Custom Schedule Rules**: Create complex time-based access patterns
- **Weekend Restrictions**: Different rules for weekends vs weekdays
- **Holiday Blocks**: Automatic blocking during holidays
- **Emergency Hours**: Override normal hours for special events

**Time Rules Example:**
```json
{
  "rules": [
    {
      "days": ["saturday", "sunday"],
      "hours": { "start": 10, "end": 14 },
      "action": "block",
      "reason": "Weekend maintenance"
    },
    {
      "days": ["monday"],
      "hours": { "start": 6, "end": 9 },
      "action": "redirect",
      "redirectUrl": "maintenance.example.com"
    }
  ]
}
```

#### **🎄 Holiday Management**
- **Holiday Blocks**: Automatically block access during holidays
- **Date Range Support**: Set start/end dates for holiday periods
- **Recurring Holidays**: Configure annual recurring holiday blocks
- **Custom Messages**: Show holiday-specific messages to visitors

**Holiday Configuration:**
```json
{
  "holidayBlocks": [
    {
      "name": "Christmas Break",
      "startDate": "2024-12-24",
      "endDate": "2024-12-26",
      "action": "block",
      "message": "Site unavailable during Christmas holiday"
    }
  ]
}
```

### **🔗 Combined Access Control System**
**Integrated IP + Geographic + Time validation for comprehensive visitor management:**

#### **🛡️ Multi-layer Validation**
The system performs validation in this order:
1. **IP Rules Check**: Whitelist/blacklist/graylist validation
2. **Geographic Validation**: Country-based access control
3. **Time Validation**: Business hours and schedule compliance

#### **⚖️ Priority System**
- **Whitelist Priority**: Whitelisted IPs bypass geo and time restrictions
- **Blacklist Override**: Blacklisted IPs are always blocked
- **Geographic Second**: Country rules apply after IP validation
- **Time Final**: Time restrictions apply last in the chain

#### **📈 Access Testing & Simulation**
- **Real-time Testing**: Test visitor access with specific IP, country, and time
- **Scenario Simulation**: Simulate different visitor scenarios
- **Rule Validation**: Verify complex rule interactions
- **Performance Testing**: Test rule processing speed

### **🎛️ Dashboard Interface Guide**
**Complete walkthrough of the Geographic & Time Controls interface:**

#### **📋 Tab 1: Geographic Controls**
- **Country Management**: Add/remove allowed and blocked countries
- **Country Search**: Search and select countries from comprehensive list
- **Redirect Configuration**: Set up country-specific redirects
- **Default Action**: Configure fallback behavior for unmatched countries

**Step-by-step Usage:**
1. Click the blue globe icon on any domain
2. Select "Geographic Controls" tab
3. Add allowed countries: Type country codes (US, CA, UK)
4. Add blocked countries: Type country codes to block
5. Set redirects: Map country codes to redirect URLs
6. Choose default action: "allow" or "block" for unmatched countries
7. Click "Update Settings" to save changes

#### **⏰ Tab 2: Time Controls**
- **Business Hours Setup**: Configure operating hours with timezone
- **Day Selection**: Choose specific days for business hours
- **Custom Rules**: Create advanced time-based rules
- **Holiday Management**: Add and manage holiday blocks

**Step-by-step Usage:**
1. Navigate to "Time Controls" tab
2. Set business hours: Start time, end time, and timezone
3. Select operating days: Check weekdays/weekends
4. Add custom rules: Set specific day/time restrictions
5. Configure holidays: Add holiday date ranges
6. Click "Update Settings" to save configuration

#### **📊 Tab 3: Analytics**
- **Geographic Statistics**: View visitor distribution by country
- **Time Patterns**: Analyze traffic patterns by hour/day
- **Access Events**: Review allowed/blocked/redirected visitors
- **Performance Metrics**: Monitor rule processing efficiency

#### **🧪 Tab 4: Access Test**
- **IP Simulation**: Enter IP address to test
- **Country Override**: Specify country for testing
- **Time Simulation**: Set custom date/time for testing
- **Result Analysis**: View detailed access decision breakdown

**Test Usage:**
1. Go to "Access Test" tab
2. Enter IP address (or leave blank for current IP)
3. Select country from dropdown (optional)
4. Set custom timestamp (optional)
5. Click "Test Access" to see results
6. Review detailed decision chain and final action

### **🔧 API Integration Guide**
**Complete API reference for programmatic access:**

#### **Geographic Controls API**
```bash
# Get current geographic settings
GET /api/domains/1759781200503/geographic

# Update geographic settings
PUT /api/domains/1759781200503/geographic
Content-Type: application/json
{
  "allowedCountries": ["US", "CA", "UK"],
  "blockedCountries": ["CN", "RU"],
  "defaultAction": "allow",
  "redirectRules": {
    "DE": "germany.example.com"
  }
}
```

#### **Time Controls API**
```bash
# Get current time settings
GET /api/domains/1759781200503/time

# Update time settings
PUT /api/domains/1759781200503/time
Content-Type: application/json
{
  "businessHours": {
    "start": 9,
    "end": 17,
    "days": ["monday", "tuesday", "wednesday", "thursday", "friday"],
    "timezone": "America/New_York"
  },
  "rules": [],
  "holidayBlocks": []
}
```

#### **Combined Access Test API**
```bash
# Test visitor access
POST /api/domains/1759781200503/access-test
Content-Type: application/json
{
  "ip": "192.168.1.100",
  "country": "US",
  "timestamp": 1699123456789,
  "userAgent": "Mozilla/5.0...",
  "referer": "https://google.com"
}

# Response
{
  "allowed": true,
  "controls": {
    "ip": { "status": "whitelist", "action": "allow" },
    "geographic": { "country": "US", "action": "allow" },
    "time": { "inBusinessHours": true, "action": "allow" }
  },
  "finalAction": "allow",
  "reason": ["IP whitelisted", "Country allowed", "Within business hours"]
}
```

### **🎯 Best Practices & Recommendations**

#### **🌍 Geographic Controls Best Practices**
- **Start Conservative**: Begin with allowed countries list, expand gradually
- **Monitor Analytics**: Review country-based analytics before blocking
- **Test Redirects**: Verify redirect URLs work correctly for target countries
- **Consider VPNs**: Account for VPN usage in geographic targeting

#### **⏰ Time Controls Best Practices**
- **Account for Timezones**: Always set correct timezone for target audience
- **Test Edge Cases**: Test behavior at business hour boundaries
- **Plan Maintenance**: Use time controls for planned maintenance windows
- **Monitor Impact**: Track how time restrictions affect traffic patterns

#### **🔗 Integration Best Practices**
- **Test Combinations**: Verify IP + Geographic + Time rule interactions
- **Document Rules**: Keep clear documentation of complex rule combinations
- **Regular Review**: Periodically review and update control settings
- **Performance Monitor**: Monitor rule processing performance impact

### **🚀 Advanced Use Cases**

#### **🌐 Multi-Regional Business**
**Setup for businesses serving different regions:**
- Configure allowed countries for each target market
- Set up country-specific redirects to regional sites
- Use business hours matching each region's timezone
- Monitor regional traffic patterns and conversion rates

#### **🕒 Scheduled Content Release**
**Time-sensitive content management:**
- Set up time-based access for scheduled releases
- Configure different access rules for different content types
- Use holiday blocks for seasonal content restrictions
- Monitor access patterns around scheduled events

#### **🛡️ Security-focused Configuration**
**Enhanced security through access controls:**
- Block high-risk countries based on threat intelligence
- Combine IP blacklisting with geographic restrictions
- Use time controls to limit attack surface during off-hours
- Monitor blocked attempts and adjust rules accordingly

This comprehensive Phase 2 system provides enterprise-level geographic and time-based access control, perfect for sophisticated traffic management scenarios while maintaining ease of use and powerful analytics capabilities.

## 📊 PHASE 3: Campaign Tracking & Rate Limiting - Complete Usage Guide

### **📈 UTM Campaign Tracking System**
**Advanced campaign performance tracking with real-time analytics and attribution:**

#### **🎯 Campaign Analytics & Attribution**
- **UTM Parameter Tracking**: Automatic tracking of utm_source, utm_campaign, utm_medium, utm_content, utm_term
- **Campaign Performance**: Track clicks, conversions, and performance metrics per campaign
- **Source Analysis**: Detailed breakdown of traffic sources and their effectiveness
- **Custom Parameter Support**: Track custom URL parameters beyond standard UTM parameters

**UTM Configuration Example:**
```json
{
  "enabled": true,
  "utmTracking": true,
  "validUtmSources": ["facebook", "google", "twitter", "email", "linkedin"],
  "customParameters": ["custom_param1", "affiliate_id", "promo_code"]
}
```

#### **📊 Campaign Performance Analytics**
- **Real-time Tracking**: Live campaign click tracking and performance monitoring
- **Top Campaigns**: Identify highest-performing campaigns by clicks and conversions
- **Top Sources**: Analyze which traffic sources drive the most valuable traffic
- **Recent Activity Feed**: Live feed of campaign clicks with detailed attribution data

**Campaign Data Structure:**
```json
{
  "campaign_name": {
    "clicks": 1250,
    "conversions": 89,
    "sources": {
      "google": 800,
      "facebook": 300,
      "email": 150
    },
    "countries": {
      "US": 650,
      "CA": 200,
      "UK": 180
    },
    "firstSeen": "2024-01-15T10:00:00Z",
    "lastSeen": "2024-10-06T20:29:09Z"
  }
}
```

#### **🔗 Campaign URL Examples**
- **Google Ads**: `https://example.com/?utm_source=google&utm_campaign=summer_sale&utm_medium=cpc`
- **Facebook Ads**: `https://example.com/?utm_source=facebook&utm_campaign=product_launch&utm_medium=social`
- **Email Marketing**: `https://example.com/?utm_source=email&utm_campaign=newsletter&utm_medium=email`
- **Custom Parameters**: `https://example.com/?utm_source=affiliate&custom_param1=special_offer&promo_code=SAVE20`

### **⚡ Advanced Rate Limiting System**
**Comprehensive traffic control with intelligent bot detection and customizable limits:**

#### **🚦 Multi-Layer Rate Limiting**
- **Per-IP Limits**: Control requests per IP address per time window
- **Per-Session Limits**: Manage session-based request quotas
- **Burst Protection**: Prevent rapid-fire request attacks
- **Bot-Specific Limits**: Different rate limits for detected bots vs human traffic

**Rate Limiting Configuration:**
```json
{
  "enabled": true,
  "rules": {
    "perIP": { "requests": 60, "window": 60 },      // 60 requests per minute per IP
    "perSession": { "requests": 300, "window": 3600 }, // 300 requests per hour per session
    "burst": { "requests": 10, "window": 1 }         // Max 10 requests per second
  },
  "botLimiting": {
    "perIP": { "requests": 10, "window": 60 },      // 10 requests per minute for bots
    "burst": { "requests": 2, "window": 1 }         // Max 2 requests per second for bots
  }
}
```

#### **🤖 Intelligent Bot Rate Limiting**
- **Bot Detection Integration**: Automatic bot detection with specific rate limits
- **Legitimate Bot Allowance**: Higher limits for verified search engine bots
- **Malicious Bot Protection**: Aggressive limiting for suspicious bot traffic
- **Dynamic Adjustment**: Rate limits adjust based on traffic patterns

#### **📈 Rate Limiting Analytics**
- **Real-time Load Monitoring**: Current active connections and request rates
- **Alert System**: Automatic alerts when thresholds are exceeded
- **Performance Metrics**: Track rate limiting effectiveness and false positives
- **Historical Analysis**: Review rate limiting performance over time

### **🎛️ Dashboard Interface Guide - Campaign & Rate Limiting**
**Complete walkthrough of the Campaign Tracking & Rate Limiting interface:**

#### **🔧 Accessing the Interface**
1. Click the orange **chart-line icon** (📊) on any domain in the domain list
2. The modal opens with a comprehensive 4-tab system for full control

#### **📋 Tab 1: Campaign Tracking**
**Complete campaign management and configuration:**

**Step-by-step Setup:**
1. **Enable Campaign Tracking**: Toggle campaign tracking on/off
2. **Configure UTM Tracking**: Enable/disable UTM parameter parsing
3. **Set Valid UTM Sources**: Define allowed traffic sources (facebook, google, etc.)
4. **Add Custom Parameters**: Specify additional tracking parameters
5. **Save Settings**: Apply configuration changes

**Active Campaigns Table:**
- View all active campaigns with click counts
- See traffic sources breakdown per campaign
- Monitor campaign performance and last activity
- Export campaign data for external analysis

#### **⚡ Tab 2: Rate Limiting**
**Advanced traffic control configuration:**

**General Rate Limits Setup:**
1. **Enable Rate Limiting**: Master toggle for rate limiting system
2. **Per-IP Limits**: Set requests per minute per IP address
3. **Session Limits**: Configure requests per hour per session
4. **Burst Protection**: Set maximum requests per second

**Bot Rate Limits Setup:**
1. **Bot Detection Integration**: Automatic bot-specific limiting
2. **Bot IP Limits**: Stricter limits for detected bot traffic
3. **Bot Burst Limits**: Maximum bot requests per second

**Current Load Monitoring:**
- **Active Connections**: Real-time connection count
- **Rate Limiting Status**: System enabled/disabled status
- **Active Alerts**: Current threshold violations and warnings

#### **📊 Tab 3: Analytics**
**Comprehensive performance analytics and insights:**

**Campaign Performance Analytics:**
- **Top Campaigns Chart**: Visual ranking of highest-performing campaigns
- **Top Sources Chart**: Traffic source effectiveness breakdown
- **Recent Activity Table**: Live campaign click feed with attribution details
- **Performance Trends**: Historical campaign performance analysis

**Rate Limiting Performance:**
- **Current Load Metrics**: Real-time traffic and limiting statistics
- **Threshold Analysis**: How close to limits various IPs are running
- **Bot vs Human Traffic**: Breakdown of traffic types and limiting effectiveness
- **Historical Performance**: Rate limiting effectiveness over time

#### **🧪 Tab 4: Test & Monitor**
**Real-time testing and validation interface:**

**Campaign Tracking Test:**
1. **Enter UTM Parameters**: Test utm_source, utm_campaign, utm_medium
2. **Set Referrer**: Specify the referring website
3. **Execute Test**: Run campaign tracking simulation
4. **View Results**: See detailed tracking results and data storage

**Rate Limiting Test:**
1. **Enter Test IP**: Specify IP address to test
2. **Set User Agent**: Define user agent string for bot detection
3. **Execute Test**: Run rate limiting check
4. **View Results**: See allow/block decision with detailed reasoning

### **🔧 API Integration Guide - Phase 3**

#### **Campaign Tracking API Usage:**

**Get Campaign Analytics:**
```bash
GET /api/domains/{id}/campaigns
Authorization: Bearer {token}

# Response:
{
  "success": true,
  "domain": "example.com",
  "enabled": true,
  "totalClicks": 1250,
  "totalCampaigns": 15,
  "totalSources": 8,
  "topCampaigns": [
    ["summer_sale", {"clicks": 500, "conversions": 45}],
    ["product_launch", {"clicks": 300, "conversions": 32}]
  ],
  "topSources": [
    ["google", {"clicks": 800}],
    ["facebook", {"clicks": 450}]
  ],
  "recentClicks": [...],
  "settings": {
    "utmTracking": true,
    "validUtmSources": ["facebook", "google", "twitter"],
    "customParameters": []
  }
}
```

**Update Campaign Settings:**
```bash
PUT /api/domains/{id}/campaigns
Authorization: Bearer {token}
Content-Type: application/json

{
  "enabled": true,
  "utmTracking": true,
  "validUtmSources": ["facebook", "google", "twitter", "linkedin"],
  "customParameters": ["affiliate_id", "promo_code"]
}
```

**Track Campaign Click:**
```bash
POST /api/domains/{id}/campaigns/track
Authorization: Bearer {token}
Content-Type: application/json

{
  "utmSource": "google",
  "utmCampaign": "summer_sale",
  "utmMedium": "cpc",
  "utmContent": "ad_variant_1",
  "utmTerm": "buy_now",
  "referrer": "https://google.com",
  "ip": "192.168.1.100",
  "country": "US"
}
```

#### **Rate Limiting API Usage:**

**Get Rate Limiting Status:**
```bash
GET /api/domains/{id}/rate-limiting
Authorization: Bearer {token}

# Response:
{
  "success": true,
  "domain": "example.com",
  "enabled": true,
  "rules": {
    "perIP": {"requests": 60, "window": 60},
    "perSession": {"requests": 300, "window": 3600},
    "burst": {"requests": 10, "window": 1}
  },
  "botLimiting": {
    "perIP": {"requests": 10, "window": 60},
    "burst": {"requests": 2, "window": 1}
  },
  "currentLoad": 25,
  "alerts": []
}
```

**Update Rate Limiting Settings:**
```bash
PUT /api/domains/{id}/rate-limiting
Authorization: Bearer {token}
Content-Type: application/json

{
  "enabled": true,
  "rules": {
    "perIP": {"requests": 120, "window": 60},
    "perSession": {"requests": 500, "window": 3600},
    "burst": {"requests": 15, "window": 1}
  },
  "botLimiting": {
    "perIP": {"requests": 20, "window": 60},
    "burst": {"requests": 3, "window": 1}
  }
}
```

**Check Rate Limit for IP:**
```bash
POST /api/domains/{id}/rate-limiting/check
Authorization: Bearer {token}
Content-Type: application/json

{
  "ip": "192.168.1.100",
  "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
}

# Response:
{
  "success": true,
  "ip": "192.168.1.100",
  "allowed": true,
  "reason": null,
  "retryAfter": null
}
```

### **🎯 Best Practices & Optimization**

#### **📈 Campaign Tracking Best Practices**
- **Consistent UTM Naming**: Use standardized campaign and source names
- **Regular Analytics Review**: Monitor campaign performance weekly
- **A/B Test Campaigns**: Compare campaign variations for optimization
- **Source Attribution**: Properly attribute traffic to the correct sources

#### **⚡ Rate Limiting Best Practices**
- **Gradual Implementation**: Start with conservative limits and adjust based on traffic patterns
- **Bot Differentiation**: Use different limits for bots vs human traffic
- **Monitor False Positives**: Ensure legitimate users aren't blocked
- **Peak Traffic Planning**: Adjust limits during high-traffic periods

#### **🔗 Integration Best Practices**
- **Automated Alerts**: Set up notifications for rate limiting violations
- **Campaign ROI Tracking**: Integrate with analytics for conversion tracking
- **Performance Monitoring**: Regular review of both systems' effectiveness
- **Data Export**: Regular backup of campaign and rate limiting data

### **🚀 Advanced Use Cases - Phase 3**

#### **📊 E-commerce Campaign Optimization**
**Multi-channel campaign tracking for online stores:**
- Track UTM campaigns across Google Ads, Facebook Ads, email marketing
- Monitor conversion rates by campaign and traffic source
- Identify highest-value traffic sources for budget allocation
- Implement rate limiting to prevent bot scraping of product pages

#### **📱 SaaS Marketing Attribution**
**Complete marketing funnel analysis:**
- Track trial signups by campaign source and medium
- Monitor conversion from trial to paid subscription by campaign
- Rate limit API endpoints to prevent abuse while allowing legitimate usage
- Analyze campaign effectiveness for different customer segments

#### **🛡️ High-Traffic Site Protection**
**Enterprise-level traffic management:**
- Implement aggressive rate limiting during traffic spikes
- Use campaign tracking to identify organic vs paid traffic quality
- Bot-specific rate limits to allow search engines while blocking scrapers
- Real-time monitoring and automatic adjustment of rate limits

This comprehensive Phase 3 system provides enterprise-level campaign tracking and rate limiting capabilities, perfect for businesses requiring detailed marketing attribution and robust traffic control while maintaining optimal user experience and powerful analytics insights.

## Dashboard Usage Guide

### **IP Management Workflow**
1. **Access Domain**: Go to "Domainler" tab, find your domain
2. **Open IP Manager**: Click the purple shield icon for IP management
3. **Add IP Rules**: 
   - **Whitelist**: Add trusted IPs (always allow)
   - **Blacklist**: Add malicious IPs (always block)
   - **Graylist**: Add suspicious IPs (monitor)
4. **Bulk Operations**: Import IP lists or perform bulk changes
5. **Monitor**: View real-time IP rule statistics and activity

### **Analytics Dashboard Usage**
1. **Access Analytics**: Click the green chart icon on any domain
2. **View Overview**: See total requests, human vs bot traffic
3. **Filter Data**: Use time range, country, and referrer filters
4. **Analyze Patterns**: Review geographic distribution and referrer sources
5. **Monitor Activity**: Watch live visitor feed for real-time insights

### **Geographic & Time Controls Usage (Phase 2)**
1. **Access Controls**: Click the blue globe icon on any domain to manage geographic and time controls
2. **Geographic Controls Tab**: 
   - Set allowed/blocked countries using country codes (US, CA, UK, etc.)
   - Configure redirect rules for specific countries or regions
   - Set default action for unmatched countries (allow/block)
3. **Time Controls Tab**:
   - Define business hours (start/end times with timezone)
   - Set day-specific rules (weekday/weekend restrictions)
   - Add holiday blocks with date ranges
4. **Analytics Tab**: View geographic and time-based analytics
5. **Access Test Tab**: Test visitor access with IP, country, and time simulation

### **Integration with NGINX**
The IP rules and analytics integrate seamlessly with NGINX:

```nginx
# NGINX integration example
location / {
    # Check IP against rules (implemented in Lua)
    access_by_lua_block {
        local ip = ngx.var.remote_addr
        local domain = ngx.var.host
        
        -- Check IP status via API
        local ip_status = check_ip_rules(domain, ip)
        if ip_status == "blacklisted" then
            return ngx.exit(403)
        elseif ip_status == "whitelisted" then
            -- Allow with clean content
            ngx.var.backend = "clean"
        else
            -- Apply normal detection logic
            ngx.var.backend = detect_visitor_type()
        end
        
        -- Log visitor for analytics
        log_visitor(domain, ip, ngx.var.http_user_agent, ngx.var.http_referer)
    }
    
    proxy_pass http://$backend;
}
```

## Data Architecture & Storage

### **JSON File Structure**
```
domains/
├── example.com/
│   ├── config.json          # Main domain configuration
│   ├── analytics-hourly.json # Hourly analytics data
│   └── visitors-recent.json  # Recent visitor log
├── another-domain.com/
│   ├── config.json
│   └── ...
└── global/
    ├── settings.json         # Global platform settings
    └── users.json           # Admin users and permissions
```

### **Performance Benefits**
- **In-Memory Speed**: All data cached in memory for instant access
- **JSON Persistence**: Automatic background saving to JSON files
- **No Network Latency**: No external database calls during traffic processing
- **Horizontal Scaling**: Easy to replicate data across multiple servers

### **Backup & Migration**
- **Simple Backup**: Just copy the `domains/` directory
- **Version Control**: JSON files can be tracked in Git
- **Easy Migration**: Move JSON files to any new server
- **Data Import/Export**: Standard JSON format for easy integration

## Deployment

### **Platform Independence** 
- **No Cloud Dependencies**: Runs on any hosting platform
- **Containerized**: Easy Docker deployment
- **Edge Compatible**: Still works great with Cloudflare Pages
- **Self-Hosted**: Complete control over your data and infrastructure

### **Current Status**
- **Status**: ✅ Active - **ALL PHASES COMPLETE (100% DONE!) + UI/UX Issues Fixed**
- **Completion**: 6 out of 6 phases implemented and tested successfully
- **Tech Stack**: Hono + TypeScript + JSON Storage + TailwindCSS
- **Architecture**: JSON-based, no external dependencies, enterprise-ready
- **Performance**: Optimized for high-traffic scenarios with real-time capabilities
- **Security**: Advanced security rules engine with honeypots and behavioral analysis
- **Integrations**: Full webhook system, custom scripts, and API connections
- **Last Updated**: October 8, 2025 - **✅ CRITICAL FIXES APPLIED** - Fixed all dashboard errors: 404 JavaScript files, 401 authentication issues, infinite loading loops, and Domain Edit UI cleanup. Removed backend URL configuration from Domain Edit modal, ensuring proper separation of concerns. Dashboard fully operational with working domain creation and NGINX integration.

## Implementation Benefits

### **🎯 Why This Architecture is Superior**

1. **🔧 No Dependencies**: Zero external service requirements
2. **💰 Cost Effective**: No database or storage service fees  
3. **🚀 High Performance**: In-memory operations with JSON persistence
4. **🔒 Data Control**: Complete ownership of your traffic data
5. **📦 Easy Deployment**: Deploy anywhere without service setup
6. **🔄 Simple Backup**: Standard file-based backups and migration
7. **⚡ Development Speed**: Rapid feature development without DB schema changes
8. **🌍 Platform Agnostic**: Works on any hosting platform or server

### **🔥 Perfect for Traffic Management**
- **Real-time Processing**: Instant IP rule checking and visitor logging
- **Scalable Design**: Handle high traffic with efficient data structures  
- **Granular Control**: Per-domain configuration and analytics
- **Advanced Features**: Ready for phases 2-6 implementation
- **Production Ready**: Tested architecture with proven performance

This JSON-based architecture provides enterprise-level traffic management capabilities while maintaining simplicity, performance, and cost-effectiveness. Perfect for sophisticated traffic cloaking operations without the complexity and costs of external database services.

## 🚀 **MAJOR UPGRADE: Advanced Traffic Analytics & DNS Management Platform**

### **Complete Traffic Analytics Overhaul (7-Tab Enterprise System)**
The Traffic section has been completely redesigned into an enterprise-level analytics platform with comprehensive visitor management capabilities:

#### **📊 Tab 1: Overview Analytics**
- **Real-time Statistics**: Live visitor counters, request metrics, and performance indicators
- **Traffic Quality Analysis**: Human vs Bot ratio with confidence scoring
- **Geographic Distribution**: Interactive world map with country-based visitor breakdown
- **Top Referrers**: Leading traffic sources with conversion analytics
- **Performance Metrics**: Average response time, bandwidth usage, and server performance

#### **⚡ Tab 2: Real-time Monitoring**
- **Live Traffic Stream**: Real-time visitor activity with comprehensive details
- **Instant Bot Detection**: Real-time bot classification with confidence levels
- **Geographic Tracking**: Live geographic distribution updates
- **Activity Timeline**: Recent visitor actions and system events

#### **🌍 Tab 3: Geographic Analytics**
- **Interactive World Map**: Visual geographic traffic distribution
- **Country Performance**: Detailed country-based analytics and metrics
- **Regional Insights**: Continental and regional traffic patterns
- **Traffic Quality by Region**: Geographic breakdown of human vs bot traffic

#### **📱 Tab 4: Device & Browser Analytics**
- **Device Category Breakdown**: Desktop, mobile, tablet traffic distribution
- **Operating System Analytics**: Windows, macOS, Linux, iOS, Android statistics
- **Browser Analysis**: Chrome, Firefox, Safari, Edge usage patterns
- **Technology Adoption**: Browser version adoption and compatibility metrics

#### **🔗 Tab 5: Traffic Sources & Referrers**
- **Referrer Analysis**: Detailed breakdown of traffic sources and referrers
- **Search Engine Traffic**: Google, Bing, Yahoo organic traffic analysis
- **Social Media Analytics**: Facebook, Twitter, LinkedIn traffic performance
- **Campaign Attribution**: UTM parameter tracking and campaign performance

#### **👥 Tab 6: Visitor Behavior Analytics**
- **User Journey Mapping**: Visitor flow and navigation pattern analysis
- **Session Analytics**: Session duration, page views, and engagement metrics
- **Bounce Rate Analysis**: Entry and exit page performance
- **Conversion Funnel**: Visitor conversion path analysis

#### **🛡️ Tab 7: Security & Threat Analytics**
- **Threat Detection Dashboard**: Real-time security threat identification
- **Bot Classification System**: Advanced bot categorization with verification
- **Attack Pattern Analysis**: Security incident pattern recognition
- **IP Reputation Intelligence**: IP address reputation and risk assessment

### **Complete DNS Interface Overhaul (7-Tab Enterprise System)**
The DNS section has been completely redesigned into an enterprise-level DNS management platform:

#### **📋 Tab 1: DNS Records Management**
- **Multi-Record Type Support**: A, AAAA, CNAME, MX, TXT, SRV, NS, PTR records
- **Bulk Operations**: Mass import/export, bulk editing, and batch operations
- **Validation Engine**: Real-time DNS record validation with mathematical checks
- **Record History**: Change tracking and audit trail for all modifications

#### **🏢 Tab 2: DNS Zones & Domains**
- **Zone Configuration**: Complete DNS zone setup and management
- **Domain Portfolio**: Multi-domain DNS management dashboard
- **Zone File Management**: Import/export BIND zone files
- **Delegation Management**: DNS delegation and nameserver configuration

#### **📊 Tab 3: DNS Analytics & Performance**
- **Query Analytics**: DNS query volume and pattern analysis
- **Response Time Monitoring**: DNS resolution performance tracking
- **Geographic Performance**: DNS performance by geographic region
- **Performance Optimization**: DNS performance improvement recommendations

#### **🔒 Tab 4: DNS Security & Protection**
- **DNSSEC Management**: DNS Security Extensions configuration
- **DDoS Protection**: DNS-based DDoS mitigation and monitoring
- **Malware Detection**: DNS-based malware and phishing protection
- **Security Monitoring**: Real-time DNS security event tracking

#### **🏥 Tab 5: Health Checks & Monitoring**
- **Health Check Configuration**: Automated DNS health monitoring
- **Uptime Monitoring**: DNS service availability tracking
- **Failover Management**: Automatic DNS failover configuration
- **SLA Monitoring**: DNS service level agreement tracking

#### **🌍 Tab 6: GeoDNS & Load Balancing**
- **GeoDNS Configuration**: Location-based DNS response management
- **Load Balancing**: DNS-based traffic distribution and load balancing
- **Latency Optimization**: Automatic latency-based DNS routing
- **CDN Integration**: Content delivery network DNS integration

#### **🔧 Tab 7: DNS Tools & Diagnostics**
- **DNS Lookup Tools**: Comprehensive DNS record lookup and analysis
- **Propagation Checker**: Global DNS propagation verification
- **DNS Trace**: Complete DNS resolution path tracing
- **Troubleshooting Wizard**: Automated DNS problem diagnosis and resolution

### **🎯 Key Upgrade Features**

#### **Mathematical Validation System**
- **IPv4 Range Validation**: Strict 0-255 range validation for IPv4 addresses
- **IPv6 Format Support**: Complete IPv6 address format validation including compressed notation
- **MX Priority Validation**: Proper MX record priority range checking (0-65535)
- **TTL Range Enforcement**: TTL value validation with recommended ranges

#### **Multi-Provider DNS Support**
- **Cloudflare API Integration**: Native Cloudflare DNS API support
- **Route53 Compatibility**: Amazon Route53 DNS management
- **Google Cloud DNS**: Google Cloud Platform DNS integration
- **Azure DNS**: Microsoft Azure DNS service support

#### **Enhanced Analytics APIs**
```javascript
// New Enhanced APIs
GET    /api/traffic/analytics/realtime          - Live traffic monitoring
GET    /api/traffic/analytics/geographic        - Geographic analytics
GET    /api/traffic/analytics/devices           - Device analytics
GET    /api/dns/records                         - DNS records management
GET    /api/dns/analytics                       - DNS performance analytics
GET    /api/dns/health                          - DNS health monitoring
```

### **🚀 Production Benefits**
- **Enterprise-Grade Interface**: Professional 7-tab analytics and DNS management
- **Real-time Processing**: Live data updates with WebSocket connections
- **Mathematical Accuracy**: Strict validation for all DNS and network configurations
- **Multi-Provider Support**: Work with any DNS provider through unified interface
- **Advanced Security**: Comprehensive threat detection and DNS security management
- **Export Capabilities**: Full data export in multiple formats (CSV, JSON, PDF)
- **Performance Optimization**: Intelligent caching and query optimization