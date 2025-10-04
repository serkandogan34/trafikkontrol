import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'

type Bindings = {
  // Add your Cloudflare bindings here
}

const app = new Hono<{ Bindings: Bindings }>()

// Enable CORS
app.use('/api/*', cors())

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }))

// Simple admin authentication
const ADMIN_USERNAME = 'admin'
const ADMIN_PASSWORD = 'admin123'
const sessions = new Map()

// Domain Management System
const domains = new Map()

// DNS Management System
const dnsRecords = new Map()

// DNS record types and validation
const DNS_RECORD_TYPES = {
  A: { name: 'A Record', description: 'IPv4 adresi', validation: /^(\d{1,3}\.){3}\d{1,3}$/ },
  AAAA: { name: 'AAAA Record', description: 'IPv6 adresi', validation: /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/ },
  CNAME: { name: 'CNAME Record', description: 'Canonical name', validation: /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/ },
  MX: { name: 'MX Record', description: 'Mail exchange', validation: /^\d+\s+[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/ },
  TXT: { name: 'TXT Record', description: 'Text kayıt', validation: /.+/ },
  NS: { name: 'NS Record', description: 'Name server', validation: /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/ },
  PTR: { name: 'PTR Record', description: 'Pointer record', validation: /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/ }
}

// Advanced DNS Features Configuration
const GEODNS_CONFIG = {
  enabled: true,
  rules: {
    'US': { servers: ['us1.domain.com', 'us2.domain.com'], weight: 100 },
    'EU': { servers: ['eu1.domain.com', 'eu2.domain.com'], weight: 100 },
    'AS': { servers: ['as1.domain.com', 'as2.domain.com'], weight: 80 },
    'DEFAULT': { servers: ['global1.domain.com', 'global2.domain.com'], weight: 50 }
  },
  fallback: 'global1.domain.com'
}

const DNS_HEALTH_CONFIG = {
  enabled: true,
  checkInterval: 30000, // 30 seconds
  timeout: 5000, // 5 seconds
  retries: 3,
  failoverThreshold: 3,
  autoRecovery: true,
  protocols: ['http', 'https', 'ping', 'tcp']
}

const LOAD_BALANCING_CONFIG = {
  algorithms: ['round_robin', 'least_connections', 'weighted', 'geographic'],
  healthCheckPath: '/health',
  sessionStickiness: true,
  stickyDuration: 3600 // 1 hour
}

const BOT_DETECTION_CONFIG = {
  enabled: true,
  dnsPatterns: {
    rapidQueries: { threshold: 100, window: 60 }, // 100 queries per minute
    suspiciousResolvers: ['8.8.8.8', '1.1.1.1'], // Monitor these
    tunneling: /[a-f0-9]{32,}/, // Detect long hex strings
    nonStandardPorts: [53, 853, 5353]
  },
  actions: {
    redirect: true,
    honeypot: 'honeypot.domain.com',
    delay: 2000,
    block: false,
    log: true
  }
}

const DNS_SECURITY_CONFIG = {
  rateLimiting: {
    enabled: true,
    perIP: 100, // queries per minute
    perDomain: 1000,
    burst: 20,
    window: 60
  },
  tunneling: {
    enabled: true,
    maxQuerySize: 255,
    maxSubdomainLength: 63,
    suspiciousPatterns: [
      /[a-f0-9]{32,}/, // Long hex strings
      /[A-Za-z0-9+/]{100,}/, // Base64-like patterns
      /\d{10,}/ // Long number sequences
    ]
  },
  geoBlocking: {
    enabled: false,
    blockedCountries: [],
    allowedCountries: [],
    action: 'block' // or 'redirect'
  }
}

// DNS Cache and Performance
const dnsCache = new Map()
const dnsMetrics = new Map()
const healthStatus = new Map()

// DNS providers configuration
const DNS_PROVIDERS = {
  CLOUDFLARE: {
    name: 'Cloudflare',
    apiUrl: 'https://api.cloudflare.com/client/v4',
    authType: 'token',
    icon: 'cloud',
    color: 'orange'
  },
  GODADDY: {
    name: 'GoDaddy',
    apiUrl: 'https://api.godaddy.com/v1',
    authType: 'key',
    icon: 'globe',
    color: 'green'
  },
  NAMECHEAP: {
    name: 'Namecheap',
    apiUrl: 'https://api.namecheap.com/xml.response',
    authType: 'key',
    icon: 'shopping-cart',
    color: 'blue'
  },
  CUSTOM: {
    name: 'Özel Sunucu',
    apiUrl: 'custom',
    authType: 'custom',
    icon: 'server',
    color: 'purple'
  }
}

// Advanced DNS Utility Functions

// Geographic IP detection (simplified)
const getCountryFromIP = (ip) => {
  // In production, use a real GeoIP service like MaxMind or Cloudflare
  const mockGeoData = {
    '192.168.': 'US',
    '10.0.': 'EU', 
    '172.16.': 'AS',
    '127.0.': 'DEFAULT'
  }
  
  for (const prefix in mockGeoData) {
    if (ip.startsWith(prefix)) {
      return mockGeoData[prefix]
    }
  }
  return 'DEFAULT'
}

// Health check for DNS targets
const performHealthCheck = async (target, protocol = 'https') => {
  try {
    const start = Date.now()
    let healthy = false
    
    switch (protocol) {
      case 'http':
      case 'https':
        const response = await fetch(`${protocol}://${target}/health`, { 
          method: 'HEAD',
          signal: AbortSignal.timeout(DNS_HEALTH_CONFIG.timeout)
        })
        healthy = response.ok
        break
      
      case 'ping':
        // Simplified ping check - in production use proper ICMP
        healthy = await checkTCPConnection(target, 80)
        break
        
      case 'tcp':
        healthy = await checkTCPConnection(target, 443)
        break
    }
    
    const responseTime = Date.now() - start
    
    return {
      healthy,
      responseTime,
      timestamp: new Date().toISOString(),
      protocol,
      target
    }
  } catch (error) {
    return {
      healthy: false,
      responseTime: DNS_HEALTH_CONFIG.timeout,
      timestamp: new Date().toISOString(),
      error: error.message,
      protocol,
      target
    }
  }
}

// TCP Connection check (simplified)
const checkTCPConnection = async (host, port) => {
  try {
    // In Cloudflare Workers, we can only use fetch for HTTP(S) checks
    // For production, integrate with external monitoring service
    const response = await fetch(`https://${host}:${port}`, {
      method: 'HEAD',
      signal: AbortSignal.timeout(2000)
    })
    return true
  } catch {
    return false
  }
}

// Bot detection based on DNS patterns
const detectBotFromDNSPattern = (request, clientIP) => {
  const userAgent = request.headers.get('user-agent') || ''
  const referer = request.headers.get('referer') || ''
  
  // Check for bot patterns
  const botIndicators = {
    rapidQueries: checkRapidQueries(clientIP),
    suspiciousUA: /bot|crawler|spider|scraper/i.test(userAgent),
    noReferer: !referer && !userAgent.includes('Mozilla'),
    suspiciousResolver: checkDNSResolver(clientIP),
    tunneling: checkDNSTunneling(request.url)
  }
  
  const score = Object.values(botIndicators).reduce((sum, indicator) => sum + (indicator ? 1 : 0), 0)
  
  return {
    isBot: score >= 2,
    confidence: (score / 5) * 100,
    indicators: botIndicators,
    action: score >= 3 ? 'block' : score >= 2 ? 'redirect' : 'allow'
  }
}

// Rate limiting check
const checkRapidQueries = (clientIP) => {
  const now = Date.now()
  const windowStart = now - (BOT_DETECTION_CONFIG.dnsPatterns.rapidQueries.window * 1000)
  
  if (!dnsMetrics.has(clientIP)) {
    dnsMetrics.set(clientIP, [])
  }
  
  const queries = dnsMetrics.get(clientIP)
  // Remove old queries
  const recentQueries = queries.filter(timestamp => timestamp > windowStart)
  
  // Add current query
  recentQueries.push(now)
  dnsMetrics.set(clientIP, recentQueries)
  
  return recentQueries.length > BOT_DETECTION_CONFIG.dnsPatterns.rapidQueries.threshold
}

// DNS resolver check
const checkDNSResolver = (clientIP) => {
  // Check if using suspicious DNS resolvers
  return BOT_DETECTION_CONFIG.dnsPatterns.suspiciousResolvers.includes(clientIP)
}

// DNS tunneling detection
const checkDNSTunneling = (url) => {
  const urlObj = new URL(url)
  const hostname = urlObj.hostname
  const subdomains = hostname.split('.')
  
  // Check for tunneling patterns
  for (const subdomain of subdomains) {
    if (BOT_DETECTION_CONFIG.dnsPatterns.tunneling.test(subdomain)) {
      return true
    }
    if (subdomain.length > 63) { // Max DNS label length
      return true
    }
  }
  
  return false
}

// Geographic DNS resolution
const resolveGeoDNS = (clientIP, domain) => {
  if (!GEODNS_CONFIG.enabled) {
    return GEODNS_CONFIG.fallback
  }
  
  const country = getCountryFromIP(clientIP)
  const geoRule = GEODNS_CONFIG.rules[country] || GEODNS_CONFIG.rules.DEFAULT
  
  // Simple load balancing within geographic region
  const servers = geoRule.servers
  const randomIndex = Math.floor(Math.random() * servers.length)
  
  return servers[randomIndex]
}

// DNS load balancing
const getOptimalServer = (servers, algorithm = 'round_robin') => {
  switch (algorithm) {
    case 'round_robin':
      // Simple round-robin (would need persistent counter in production)
      return servers[Math.floor(Math.random() * servers.length)]
    
    case 'least_connections':
      // Return server with least active connections
      return servers.reduce((least, current) => 
        (current.connections || 0) < (least.connections || 0) ? current : least
      )
    
    case 'weighted':
      // Weighted selection based on server capacity
      const totalWeight = servers.reduce((sum, server) => sum + (server.weight || 1), 0)
      let random = Math.random() * totalWeight
      
      for (const server of servers) {
        random -= (server.weight || 1)
        if (random <= 0) return server
      }
      return servers[0]
    
    case 'geographic':
      // Geographic proximity (would need GeoIP integration)
      return servers[0] // Simplified
    
    default:
      return servers[0]
  }
}

// DNS cache management
const cacheDNSRecord = (domain, record, ttl = 300) => {
  const cacheKey = `${domain}:${record.type}`
  const cacheEntry = {
    record,
    timestamp: Date.now(),
    ttl: ttl * 1000, // Convert to milliseconds
    hits: 0
  }
  
  dnsCache.set(cacheKey, cacheEntry)
  
  // Clean expired entries
  setTimeout(() => {
    if (dnsCache.has(cacheKey)) {
      const entry = dnsCache.get(cacheKey)
      if (Date.now() - entry.timestamp > entry.ttl) {
        dnsCache.delete(cacheKey)
      }
    }
  }, ttl * 1000)
}

// Get cached DNS record
const getCachedDNSRecord = (domain, type) => {
  const cacheKey = `${domain}:${type}`
  const entry = dnsCache.get(cacheKey)
  
  if (!entry) return null
  
  // Check if expired
  if (Date.now() - entry.timestamp > entry.ttl) {
    dnsCache.delete(cacheKey)
    return null
  }
  
  entry.hits++
  return entry.record
}

// DNS Utility Functions
const validateDNSRecord = (type, value) => {
  const recordType = DNS_RECORD_TYPES[type]
  if (!recordType) return false
  
  return recordType.validation.test(value)
}

const checkDNSPropagation = async (domain, recordType = 'A') => {
  try {
    // Simulate DNS lookup - In real implementation, use DNS API
    const response = await fetch(`https://dns.google/resolve?name=${domain}&type=${recordType}`)
    const data = await response.json()
    
    return {
      success: true,
      records: data.Answer || [],
      propagated: data.Status === 0,
      ttl: data.Answer?.[0]?.TTL || null
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
      propagated: false
    }
  }
}

const generateDNSConfig = (domain, records) => {
  let config = `; DNS Configuration for ${domain}\n`
  config += `; Generated at: ${new Date().toISOString()}\n`
  config += `; Traffic Management Platform\n\n`
  
  config += `$ORIGIN ${domain}.\n`
  config += `$TTL 3600\n\n`
  
  // SOA Record
  config += `@\tIN\tSOA\tns1.${domain}. admin.${domain}. (\n`
  config += `\t\t\t${Date.now()}\t; serial\n`
  config += `\t\t\t3600\t\t; refresh\n`
  config += `\t\t\t1800\t\t; retry\n`
  config += `\t\t\t604800\t\t; expire\n`
  config += `\t\t\t86400 )\t\t; minimum TTL\n\n`
  
  // Add each DNS record
  records.forEach(record => {
    const name = record.name === '@' ? '@' : record.name
    const ttl = record.ttl || 3600
    config += `${name}\t${ttl}\tIN\t${record.type}\t${record.value}\n`
  })
  
  return config
}

// Advanced DNS Functions
const performDNSLookup = async (domain, servers = ['8.8.8.8', '1.1.1.1', '9.9.9.9']) => {
  const results = {}
  
  for (const server of servers) {
    try {
      // Simulate different DNS servers - In real implementation, use actual DNS queries
      const response = await fetch(`https://dns.google/resolve?name=${domain}&type=A`)
      const data = await response.json()
      
      results[server] = {
        success: true,
        records: data.Answer || [],
        responseTime: Math.floor(Math.random() * 100) + 10, // Simulated response time
        server: server
      }
    } catch (error) {
      results[server] = {
        success: false,
        error: error.message,
        server: server
      }
    }
  }
  
  return results
}

const checkDNSHealth = async (domain) => {
  const checks = {
    propagation: await checkDNSPropagation(domain),
    lookup: await performDNSLookup(domain),
    connectivity: await checkDomainStatus(domain)
  }
  
  const health = {
    status: 'healthy',
    issues: [],
    score: 100
  }
  
  // Analyze results
  if (!checks.propagation.propagated) {
    health.issues.push('DNS kayıtları henüz yayılmamış')
    health.score -= 30
    health.status = 'warning'
  }
  
  if (checks.connectivity === 'error') {
    health.issues.push('Domain erişilemiyor')
    health.score -= 40
    health.status = 'error'
  }
  
  const successfulLookups = Object.values(checks.lookup).filter(r => r.success).length
  if (successfulLookups < 2) {
    health.issues.push('DNS server yanıtları tutarsız')
    health.score -= 20
    health.status = health.status === 'healthy' ? 'warning' : health.status
  }
  
  if (health.score < 50) health.status = 'error'
  else if (health.score < 80) health.status = 'warning'
  
  return { ...health, checks }
}

// Domain status checking
const checkDomainStatus = async (domainName) => {
  // Clean domain name (remove protocol if exists)
  const cleanDomain = domainName.replace(/^https?:\/\//, '')
  
  try {
    // Try HTTP first (more reliable)
    const httpResponse = await fetch(`http://${cleanDomain}`, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000)
    })
    if (httpResponse.ok) return 'active'
  } catch (error) {
    console.log(`HTTP check failed for ${cleanDomain}:`, error.message)
  }
  
  try {
    // If HTTP fails, try HTTPS
    const httpsResponse = await fetch(`https://${cleanDomain}`, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000)
    })
    if (httpsResponse.ok) return 'active'
    
    // Check for Cloudflare 521/522/523 errors (origin server down but domain exists)
    if (httpsResponse.status >= 520 && httpsResponse.status <= 530) {
      return 'warning' // Domain exists but origin server has issues
    }
    
    return 'warning'
  } catch (error) {
    console.log(`HTTPS check failed for ${cleanDomain}:`, error.message)
    return 'error'
  }
}

// Domain categories for gray area rules
const DOMAIN_CATEGORIES = {
  CLEAN: { 
    name: 'Clean', 
    description: 'Bot/Reviewer için güvenli içerik',
    color: 'green',
    icon: 'shield-check'
  },
  GRAY: { 
    name: 'Gray', 
    description: 'Orta seviye pazarlama içeriği',
    color: 'yellow', 
    icon: 'exclamation-triangle'
  },
  AGGRESSIVE: { 
    name: 'Aggressive', 
    description: 'Full sales funnel',
    color: 'red',
    icon: 'fire'
  },
  HONEYPOT: { 
    name: 'Honeypot', 
    description: 'Bot tuzağı sayfalar',
    color: 'purple',
    icon: 'bug'
  }
}

// Initialize with demo domains (real counters)
const initializeDomains = () => {
  const demoDomains = [
    {
      id: '1',
      name: 'google.com',
      status: 'active',
      connected: true,
      traffic: 0,
      blocked: 0,
      totalRequests: 0,
      humanRequests: 0,
      botRequests: 0,
      cleanServed: 0,
      grayServed: 0,
      aggressiveServed: 0,
      lastTrafficUpdate: new Date().toISOString(),
      addedAt: new Date().toISOString(),
      lastChecked: new Date().toISOString()
    },
    {
      id: '2', 
      name: 'github.com',
      status: 'active',
      connected: true,
      traffic: 0,
      blocked: 0,
      totalRequests: 0,
      humanRequests: 0,
      botRequests: 0,
      cleanServed: 0,
      grayServed: 0,
      aggressiveServed: 0,
      lastTrafficUpdate: new Date().toISOString(),
      addedAt: new Date().toISOString(),
      lastChecked: new Date().toISOString()
    },
    {
      id: '3',
      name: 'nonexistentdomain12345.com',
      status: 'error',
      connected: false,
      traffic: 0,
      blocked: 0,
      totalRequests: 0,
      humanRequests: 0,
      botRequests: 0,
      cleanServed: 0,
      grayServed: 0,
      aggressiveServed: 0,
      lastTrafficUpdate: new Date().toISOString(),
      addedAt: new Date().toISOString(),
      lastChecked: new Date().toISOString()
    }
  ]

  demoDomains.forEach(domain => {
    domains.set(domain.id, domain)
  })
}

initializeDomains()

// Initialize DNS records with demo data
const initializeDNSRecords = () => {
  const demoRecords = [
    {
      id: 'dns_1',
      domain: 'example.com',
      name: '@',
      type: 'A',
      value: '207.180.204.60',
      ttl: 3600,
      priority: null,
      provider: 'CLOUDFLARE',
      status: 'active',
      lastChecked: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      propagationStatus: 'propagated'
    },
    {
      id: 'dns_2',
      domain: 'example.com',
      name: 'www',
      type: 'CNAME',
      value: 'example.com',
      ttl: 3600,
      priority: null,
      provider: 'CLOUDFLARE',
      status: 'active',
      lastChecked: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      propagationStatus: 'propagated'
    },
    {
      id: 'dns_3',
      domain: 'test-domain.com',
      name: '@',
      type: 'A',
      value: '207.180.204.60',
      ttl: 1800,
      priority: null,
      provider: 'GODADDY',
      status: 'pending',
      lastChecked: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      propagationStatus: 'propagating'
    },
    {
      id: 'dns_4',
      domain: 'example.com',
      name: 'mail',
      type: 'MX',
      value: '10 mail.example.com',
      ttl: 3600,
      priority: 10,
      provider: 'CLOUDFLARE',
      status: 'active',
      lastChecked: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      propagationStatus: 'propagated'
    }
  ]
  
  demoRecords.forEach(record => {
    dnsRecords.set(record.id, record)
  })
}

initializeDNSRecords()

// NGINX Config Generator
function generateNginxConfig(options) {
  const { domains, backends } = options
  
  let config = `# Auto-generated NGINX Configuration
# Generated at: ${new Date().toISOString()}
# Traffic Management Platform

# Upstream definitions
upstream clean_backend {
    server ${backends.clean.replace(/^https?:\/\//, '')};
}

upstream gray_backend {
    server ${backends.gray.replace(/^https?:\/\//, '')};
}

upstream aggressive_backend {
    server ${backends.aggressive.replace(/^https?:\/\//, '')};
}

# Lua shared dictionary for bot detection
lua_shared_dict bot_detection 10m;

# Main server block with Lua logic
server {
    listen 80;
    
    # Bot detection using Lua
    access_by_lua_block {
        local user_agent = ngx.var.http_user_agent or ""
        local host = ngx.var.host or ""
        
        -- Simple bot detection
        local bot_patterns = {
            "facebook", "facebookexternalhit", "bot", "crawler", 
            "spider", "scraper", "googlebot", "bingbot"
        }
        
        local is_bot = false
        for _, pattern in ipairs(bot_patterns) do
            if string.find(string.lower(user_agent), pattern) then
                is_bot = true
                break
            end
        end
        
        -- Dynamic backend selection based on traffic analysis
        local backend = "aggressive_backend"  -- default for human traffic
        
        -- Check if domain is in our managed list
        local managed_domains = {`

  // Add all domains to managed list
  domains.forEach(domain => {
    config += `"${domain.name}", `
  })

  config += `}
        
        local domain_found = false
        for _, managed_domain in ipairs(managed_domains) do
            if host == managed_domain then
                domain_found = true
                break
            end
        end
        
        -- Only apply routing for managed domains
        if domain_found then
            if is_bot then
                -- Facebook bots, crawlers → Clean content
                backend = "clean_backend"
            else
                -- Advanced analysis for human traffic
                local referrer = ngx.var.http_referer or ""
                local facebook_ref = string.find(string.lower(referrer), "facebook")
                
                if facebook_ref then
                    -- Facebook referrer + human → Aggressive content
                    backend = "aggressive_backend"
                else
                    -- No Facebook referrer → Suspicious, use Gray content
                    backend = "gray_backend"
                end
            end
        else
            -- Unknown domain, default behavior
            return ngx.exit(404)
        end`
  
  config += `        end
        
        -- Set the upstream backend
        ngx.var.backend = backend
        
        -- Log traffic to our API (async)
        local traffic_data = {
            domain = host,
            userType = is_bot and "bot" or "human",
            backendUsed = string.gsub(backend, "_backend", ""),
            userAgent = user_agent,
            referrer = referrer,
            ip = ngx.var.remote_addr,
            blocked = false
        }
        
        -- Async HTTP call to log traffic (non-blocking)
        ngx.timer.at(0, function()
            local httpc = require "resty.http".new()
            httpc:request_uri("http://localhost:3000/api/traffic/log", {
                method = "POST",
                body = require "cjson".encode(traffic_data),
                headers = {["Content-Type"] = "application/json"}
            })
        end)
    }
    
    # Proxy to selected backend
    location / {
        proxy_pass http://$backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Add custom headers for debugging
        add_header X-Backend-Used $backend;
        add_header X-Traffic-Management "Active";
        
        # Log response status for monitoring
        log_by_lua_block {
            if ngx.status >= 400 then
                -- Log errors for monitoring
                ngx.log(ngx.ERR, "Backend error: " .. ngx.status .. " for " .. ngx.var.host)
            end
        }
    }
}

# Statistics and monitoring
server {
    listen 8080;
    server_name localhost;
    
    location /nginx-status {
        stub_status on;
        access_log off;
        allow 127.0.0.1;
        deny all;
    }
}
`

  return config
}

// Generate session token
function generateToken() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

// API Routes

// Login API
app.post('/api/login', async (c) => {
  const { username, password } = await c.req.json()
  
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const token = generateToken()
    sessions.set(token, { username, loginTime: Date.now() })
    
    return c.json({ 
      success: true, 
      token,
      message: 'Giriş başarılı' 
    })
  }
  
  return c.json({ 
    success: false, 
    message: 'Kullanıcı adı veya şifre hatalı' 
  }, 401)
})

// Logout API
app.post('/api/logout', async (c) => {
  const authHeader = c.req.header('Authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    sessions.delete(token)
  }
  
  return c.json({ success: true, message: 'Çıkış yapıldı' })
})

// Auth middleware
const requireAuth = async (c, next) => {
  const authHeader = c.req.header('Authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, message: 'Token gerekli' }, 401)
  }
  
  const token = authHeader.substring(7)
  const session = sessions.get(token)
  
  if (!session) {
    return c.json({ success: false, message: 'Geçersiz token' }, 401)
  }
  
  c.set('user', session)
  await next()
}

// Domain API Routes
app.get('/api/domains', requireAuth, (c) => {
  const domainList = Array.from(domains.values())
  return c.json({ 
    success: true, 
    domains: domainList, 
    total: domainList.length 
  })
})

// Get domain categories
app.get('/api/domain-categories', requireAuth, (c) => {
  return c.json({ 
    success: true, 
    categories: DOMAIN_CATEGORIES 
  })
})

app.post('/api/domains', requireAuth, async (c) => {
  const { name } = await c.req.json()
  
  if (!name) {
    return c.json({ success: false, message: 'Domain adı gerekli' }, 400)
  }
  
  // Clean domain name
  const cleanDomain = name.replace(/^https?:\/\//, '').replace(/\/$/, '')
  
  // Check if domain already exists
  const existingDomain = Array.from(domains.values()).find(d => d.name === cleanDomain)
  if (existingDomain) {
    return c.json({ success: false, message: 'Bu domain zaten mevcut' }, 400)
  }
  
  const id = Date.now().toString()
  
  // Check domain status
  const status = await checkDomainStatus(cleanDomain)
  const connected = status === 'active'
  
  const domain = {
    id,
    name: cleanDomain,
    status,
    connected,
    traffic: 0, // Real traffic counter - starts from 0
    blocked: 0, // Real blocked counter - starts from 0
    totalRequests: 0,
    humanRequests: 0,
    botRequests: 0,
    cleanServed: 0,
    grayServed: 0,
    aggressiveServed: 0,
    lastTrafficUpdate: new Date().toISOString(),
    addedAt: new Date().toISOString(),
    lastChecked: new Date().toISOString()
  }
  
  domains.set(id, domain)
  
  return c.json({ success: true, domain })
})

app.put('/api/domains/:id', requireAuth, async (c) => {
  const id = c.req.param('id')
  const updates = await c.req.json()
  
  const domain = domains.get(id)
  if (!domain) {
    return c.json({ success: false, message: 'Domain bulunamadı' }, 404)
  }
  
  const updatedDomain = { ...domain, ...updates }
  domains.set(id, updatedDomain)
  
  return c.json({ success: true, domain: updatedDomain })
})

app.delete('/api/domains/:id', requireAuth, (c) => {
  const id = c.req.param('id')
  
  if (!domains.has(id)) {
    return c.json({ success: false, message: 'Domain bulunamadı' }, 404)
  }
  
  domains.delete(id)
  
  return c.json({ success: true, message: 'Domain silindi' })
})

// Check domain connection
app.post('/api/domains/:id/check', requireAuth, async (c) => {
  const id = c.req.param('id')
  
  const domain = domains.get(id)
  if (!domain) {
    return c.json({ success: false, message: 'Domain bulunamadı' }, 404)
  }
  
  // Check domain status
  const status = await checkDomainStatus(domain.name)
  const connected = status === 'active'
  
  // Update domain
  const updatedDomain = {
    ...domain,
    status,
    connected,
    lastChecked: new Date().toISOString()
  }
  
  domains.set(id, updatedDomain)
  
  return c.json({ success: true, domain: updatedDomain })
})

// NGINX Configuration API
app.post('/api/nginx/generate-config', requireAuth, async (c) => {
  const { cleanBackend, grayBackend, aggressiveBackend } = await c.req.json()
  
  const domainList = Array.from(domains.values())
  
  // Generate NGINX config for dynamic routing
  const config = generateNginxConfig({
    domains: domainList,
    backends: {
      clean: cleanBackend,
      gray: grayBackend,
      aggressive: aggressiveBackend
    }
  })
  
  return c.json({ success: true, config })
})

app.post('/api/nginx/apply-config', requireAuth, async (c) => {
  const { config } = await c.req.json()
  
  // TODO: Write config to file and reload NGINX
  // For now, just return success
  
  return c.json({ 
    success: true, 
    message: 'Config applied successfully (demo mode)' 
  })
})

// Real traffic tracking API (NGINX will call this)
app.post('/api/traffic/log', async (c) => {
  const { 
    domain, 
    userType, // 'bot' | 'human'
    backendUsed, // 'clean' | 'gray' | 'aggressive'
    userAgent,
    referrer,
    ip,
    blocked = false
  } = await c.req.json()
  
  const domainObj = Array.from(domains.values()).find(d => d.name === domain)
  if (!domainObj) {
    return c.json({ success: false, message: 'Domain not found' }, 404)
  }
  
  // Update real statistics
  domainObj.totalRequests += 1
  domainObj.traffic += 1
  
  if (blocked) {
    domainObj.blocked += 1
  }
  
  if (userType === 'bot') {
    domainObj.botRequests += 1
  } else {
    domainObj.humanRequests += 1
  }
  
  if (backendUsed === 'clean') {
    domainObj.cleanServed += 1
  } else if (backendUsed === 'gray') {
    domainObj.grayServed += 1
  } else if (backendUsed === 'aggressive') {
    domainObj.aggressiveServed += 1
  }
  
  domainObj.lastTrafficUpdate = new Date().toISOString()
  domains.set(domainObj.id, domainObj)
  
  return c.json({ success: true })
})

// Real-time domain statistics API
app.get('/api/domains/:id/stats', requireAuth, (c) => {
  const id = c.req.param('id')
  const domain = domains.get(id)
  
  if (!domain) {
    return c.json({ success: false, message: 'Domain bulunamadı' }, 404)
  }
  
  const stats = {
    totalRequests: domain.totalRequests || 0,
    humanRequests: domain.humanRequests || 0,
    botRequests: domain.botRequests || 0,
    cleanServed: domain.cleanServed || 0,
    grayServed: domain.grayServed || 0,
    aggressiveServed: domain.aggressiveServed || 0,
    blocked: domain.blocked || 0,
    humanRate: domain.totalRequests > 0 ? (domain.humanRequests / domain.totalRequests * 100).toFixed(1) : '0',
    botRate: domain.totalRequests > 0 ? (domain.botRequests / domain.totalRequests * 100).toFixed(1) : '0',
    lastUpdate: domain.lastTrafficUpdate
  }
  
  return c.json({ success: true, stats })
})

// =============================================================================
// DNS Management API Routes
// =============================================================================

// Get all DNS records
app.get('/api/dns', requireAuth, (c) => {
  const records = Array.from(dnsRecords.values()).map(record => ({
    ...record,
    // Add computed fields
    isHealthy: record.status === 'active' && record.propagationStatus === 'propagated',
    ageInDays: Math.floor((Date.now() - new Date(record.createdAt).getTime()) / (1000 * 60 * 60 * 24))
  }))
  
  return c.json({ 
    success: true, 
    records,
    total: records.length,
    providers: DNS_PROVIDERS,
    recordTypes: DNS_RECORD_TYPES
  })
})

// Get DNS records for a specific domain
app.get('/api/dns/domain/:domain', requireAuth, (c) => {
  const domain = c.req.param('domain')
  const records = Array.from(dnsRecords.values()).filter(record => record.domain === domain)
  
  return c.json({ 
    success: true, 
    domain,
    records,
    total: records.length 
  })
})

// Add new DNS record
app.post('/api/dns', requireAuth, async (c) => {
  try {
    const { domain, name, type, value, ttl, priority, provider } = await c.req.json()
    
    // Validation
    if (!domain || !name || !type || !value) {
      return c.json({ 
        success: false, 
        message: 'Domain, name, type ve value alanları zorunludur' 
      }, 400)
    }
    
    if (!DNS_RECORD_TYPES[type]) {
      return c.json({ 
        success: false, 
        message: 'Geçersiz DNS record tipi' 
      }, 400)
    }
    
    if (!validateDNSRecord(type, value)) {
      return c.json({ 
        success: false, 
        message: `${type} record için geçersiz değer formatı` 
      }, 400)
    }
    
    const recordId = 'dns_' + Date.now()
    const newRecord = {
      id: recordId,
      domain: domain.toLowerCase(),
      name: name || '@',
      type: type.toUpperCase(),
      value,
      ttl: ttl || 3600,
      priority: type === 'MX' ? priority : null,
      provider: provider || 'CUSTOM',
      status: 'pending',
      lastChecked: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      propagationStatus: 'pending'
    }
    
    dnsRecords.set(recordId, newRecord)
    
    // Simulate DNS propagation check (async)
    setTimeout(async () => {
      const record = dnsRecords.get(recordId)
      if (record) {
        record.status = 'active'
        record.propagationStatus = 'propagated'
        record.lastChecked = new Date().toISOString()
        dnsRecords.set(recordId, record)
      }
    }, 3000)
    
    return c.json({ 
      success: true, 
      message: 'DNS kaydı başarıyla oluşturuldu',
      record: newRecord
    })
  } catch (error) {
    return c.json({ 
      success: false, 
      message: 'DNS kaydı oluşturulurken hata oluştu' 
    }, 500)
  }
})

// Update DNS record
app.put('/api/dns/:id', requireAuth, async (c) => {
  try {
    const id = c.req.param('id')
    const updates = await c.req.json()
    
    const record = dnsRecords.get(id)
    if (!record) {
      return c.json({ 
        success: false, 
        message: 'DNS kaydı bulunamadı' 
      }, 404)
    }
    
    // Validate if value is being updated
    if (updates.value && updates.type && !validateDNSRecord(updates.type, updates.value)) {
      return c.json({ 
        success: false, 
        message: `${updates.type} record için geçersiz değer formatı` 
      }, 400)
    }
    
    // Update record
    const updatedRecord = {
      ...record,
      ...updates,
      lastChecked: new Date().toISOString(),
      status: updates.value || updates.type ? 'pending' : record.status,
      propagationStatus: updates.value || updates.type ? 'pending' : record.propagationStatus
    }
    
    dnsRecords.set(id, updatedRecord)
    
    return c.json({ 
      success: true, 
      message: 'DNS kaydı güncellendi',
      record: updatedRecord
    })
  } catch (error) {
    return c.json({ 
      success: false, 
      message: 'DNS kaydı güncellenirken hata oluştu' 
    }, 500)
  }
})

// Delete DNS record
app.delete('/api/dns/:id', requireAuth, (c) => {
  const id = c.req.param('id')
  
  if (!dnsRecords.has(id)) {
    return c.json({ 
      success: false, 
      message: 'DNS kaydı bulunamadı' 
    }, 404)
  }
  
  dnsRecords.delete(id)
  
  return c.json({ 
    success: true, 
    message: 'DNS kaydı silindi' 
  })
})

// Check DNS propagation
app.post('/api/dns/:id/check-propagation', requireAuth, async (c) => {
  try {
    const id = c.req.param('id')
    const record = dnsRecords.get(id)
    
    if (!record) {
      return c.json({ 
        success: false, 
        message: 'DNS kaydı bulunamadı' 
      }, 404)
    }
    
    const propagation = await checkDNSPropagation(record.domain, record.type)
    
    // Update record status based on propagation
    record.propagationStatus = propagation.propagated ? 'propagated' : 'propagating'
    record.lastChecked = new Date().toISOString()
    dnsRecords.set(id, record)
    
    return c.json({ 
      success: true, 
      propagation,
      record
    })
  } catch (error) {
    return c.json({ 
      success: false, 
      message: 'DNS propagation kontrolünde hata oluştu' 
    }, 500)
  }
})

// Bulk DNS operations
app.post('/api/dns/bulk', requireAuth, async (c) => {
  try {
    const { action, records } = await c.req.json()
    
    if (!action || !Array.isArray(records)) {
      return c.json({ 
        success: false, 
        message: 'Geçersiz bulk işlem parametreleri' 
      }, 400)
    }
    
    const results = []
    
    for (const recordData of records) {
      try {
        switch (action) {
          case 'create':
            const recordId = 'dns_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5)
            const newRecord = {
              id: recordId,
              ...recordData,
              status: 'pending',
              createdAt: new Date().toISOString(),
              lastChecked: new Date().toISOString(),
              propagationStatus: 'pending'
            }
            dnsRecords.set(recordId, newRecord)
            results.push({ success: true, record: newRecord })
            break
            
          case 'delete':
            if (dnsRecords.has(recordData.id)) {
              dnsRecords.delete(recordData.id)
              results.push({ success: true, id: recordData.id })
            } else {
              results.push({ success: false, id: recordData.id, error: 'Record not found' })
            }
            break
            
          default:
            results.push({ success: false, error: 'Unknown action' })
        }
      } catch (error) {
        results.push({ success: false, error: error.message })
      }
    }
    
    return c.json({ 
      success: true, 
      message: `Bulk ${action} işlemi tamamlandı`,
      results
    })
  } catch (error) {
    return c.json({ 
      success: false, 
      message: 'Bulk işlem sırasında hata oluştu' 
    }, 500)
  }
})

// DNS health check for domain
app.post('/api/dns/health-check/:domain', requireAuth, async (c) => {
  try {
    const domain = c.req.param('domain')
    const health = await checkDNSHealth(domain)
    
    return c.json({ 
      success: true, 
      domain,
      health
    })
  } catch (error) {
    return c.json({ 
      success: false, 
      message: 'DNS health check sırasında hata oluştu' 
    }, 500)
  }
})

// Generate DNS zone file
app.get('/api/dns/zone-file/:domain', requireAuth, (c) => {
  try {
    const domain = c.req.param('domain')
    const domainRecords = Array.from(dnsRecords.values()).filter(record => record.domain === domain)
    
    if (domainRecords.length === 0) {
      return c.json({ 
        success: false, 
        message: 'Bu domain için DNS kaydı bulunamadı' 
      }, 404)
    }
    
    const zoneFile = generateDNSConfig(domain, domainRecords)
    
    // Set headers for file download
    c.header('Content-Type', 'text/plain')
    c.header('Content-Disposition', `attachment; filename="${domain}.zone"`)
    
    return c.text(zoneFile)
  } catch (error) {
    return c.json({ 
      success: false, 
      message: 'Zone file oluşturulurken hata oluştu' 
    }, 500)
  }
})

// ==============================================================================
// ADVANCED DNS MANAGEMENT ENDPOINTS
// ==============================================================================

// Geographic DNS Resolution
app.get('/api/dns/geo-resolve/:domain', requireAuth, async (c) => {
  try {
    const domain = c.req.param('domain')
    const clientIP = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || '127.0.0.1'
    
    if (!GEODNS_CONFIG.enabled) {
      return c.json({
        success: false,
        message: 'GeoDNS özelliği devre dışı'
      })
    }
    
    const resolvedServer = resolveGeoDNS(clientIP, domain)
    const country = getCountryFromIP(clientIP)
    
    return c.json({
      success: true,
      domain,
      clientIP,
      country,
      resolvedServer,
      geoRule: GEODNS_CONFIG.rules[country] || GEODNS_CONFIG.rules.DEFAULT
    })
  } catch (error) {
    return c.json({
      success: false,
      message: 'GeoDNS çözümleme hatası: ' + error.message
    }, 500)
  }
})

// Advanced Health Monitoring
app.post('/api/dns/advanced-health-check', requireAuth, async (c) => {
  try {
    const { targets, protocols = ['https'], includeMetrics = true } = await c.req.json()
    
    if (!targets || !Array.isArray(targets)) {
      return c.json({
        success: false,
        message: 'Targets array gereklidir'
      }, 400)
    }
    
    const results = []
    
    for (const target of targets) {
      for (const protocol of protocols) {
        const healthResult = await performHealthCheck(target, protocol)
        
        if (includeMetrics) {
          // Store health metrics
          const metricKey = `${target}:${protocol}`
          if (!healthStatus.has(metricKey)) {
            healthStatus.set(metricKey, [])
          }
          
          const metrics = healthStatus.get(metricKey)
          metrics.push(healthResult)
          
          // Keep only last 100 entries
          if (metrics.length > 100) {
            metrics.splice(0, metrics.length - 100)
          }
        }
        
        results.push({
          target,
          protocol,
          ...healthResult
        })
      }
    }
    
    return c.json({
      success: true,
      results,
      summary: {
        total: results.length,
        healthy: results.filter(r => r.healthy).length,
        avgResponseTime: results.reduce((sum, r) => sum + r.responseTime, 0) / results.length
      }
    })
  } catch (error) {
    return c.json({
      success: false,
      message: 'Gelişmiş health check hatası: ' + error.message
    }, 500)
  }
})

// Bot Detection Analysis
app.post('/api/dns/bot-detection', requireAuth, async (c) => {
  try {
    const clientIP = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || '127.0.0.1'
    const userAgent = c.req.header('user-agent') || ''
    const referer = c.req.header('referer') || ''
    
    // Create a mock request object for analysis
    const mockRequest = {
      headers: new Map([
        ['user-agent', userAgent],
        ['referer', referer]
      ]),
      url: c.req.url
    }
    
    const botAnalysis = detectBotFromDNSPattern(mockRequest, clientIP)
    
    // Log the analysis if enabled
    if (BOT_DETECTION_CONFIG.actions.log) {
      console.log('Bot Detection Analysis:', {
        clientIP,
        userAgent,
        referer,
        analysis: botAnalysis,
        timestamp: new Date().toISOString()
      })
    }
    
    return c.json({
      success: true,
      clientIP,
      analysis: botAnalysis,
      config: BOT_DETECTION_CONFIG,
      recommendedAction: botAnalysis.action
    })
  } catch (error) {
    return c.json({
      success: false,
      message: 'Bot detection analizi hatası: ' + error.message
    }, 500)
  }
})

// DNS Security Analysis
app.get('/api/dns/security-analysis', requireAuth, (c) => {
  try {
    const clientIP = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || '127.0.0.1'
    
    // Analyze current security metrics
    const securityMetrics = {
      rateLimiting: {
        enabled: DNS_SECURITY_CONFIG.rateLimiting.enabled,
        currentQueries: dnsMetrics.has(clientIP) ? dnsMetrics.get(clientIP).length : 0,
        limit: DNS_SECURITY_CONFIG.rateLimiting.perIP,
        status: checkRapidQueries(clientIP) ? 'EXCEEDED' : 'OK'
      },
      tunneling: {
        enabled: DNS_SECURITY_CONFIG.tunneling.enabled,
        detectedPatterns: [],
        status: 'OK'
      },
      geoBlocking: {
        enabled: DNS_SECURITY_CONFIG.geoBlocking.enabled,
        clientCountry: getCountryFromIP(clientIP),
        blocked: false,
        allowed: true
      }
    }
    
    // Check for security threats
    const threats = []
    if (securityMetrics.rateLimiting.status === 'EXCEEDED') {
      threats.push({
        type: 'RATE_LIMITING',
        severity: 'HIGH',
        message: 'IP adresi rate limit aştı',
        action: 'BLOCK_RECOMMENDED'
      })
    }
    
    // Check if IP is from blocked country
    if (DNS_SECURITY_CONFIG.geoBlocking.enabled && 
        DNS_SECURITY_CONFIG.geoBlocking.blockedCountries.includes(securityMetrics.geoBlocking.clientCountry)) {
      securityMetrics.geoBlocking.blocked = true
      securityMetrics.geoBlocking.allowed = false
      threats.push({
        type: 'GEO_BLOCKING',
        severity: 'MEDIUM',
        message: 'IP adresi bloklu ülkeden',
        action: 'BLOCK'
      })
    }
    
    return c.json({
      success: true,
      clientIP,
      metrics: securityMetrics,
      threats,
      overallSecurity: threats.length === 0 ? 'SECURE' : 'AT_RISK',
      config: DNS_SECURITY_CONFIG
    })
  } catch (error) {
    return c.json({
      success: false,
      message: 'Güvenlik analizi hatası: ' + error.message
    }, 500)
  }
})

// Load Balancing Configuration
app.get('/api/dns/load-balancing', requireAuth, (c) => {
  try {
    // Get current load balancing status
    const servers = Array.from(dnsRecords.values())
      .filter(record => record.type === 'A' || record.type === 'AAAA')
      .map(record => ({
        id: record.id,
        domain: record.domain,
        ip: record.value,
        healthy: record.status === 'active',
        connections: Math.floor(Math.random() * 100), // Mock data
        weight: record.priority || 1,
        responseTime: Math.floor(Math.random() * 200) + 50
      }))
    
    return c.json({
      success: true,
      config: LOAD_BALANCING_CONFIG,
      servers,
      algorithm: 'round_robin', // Current algorithm
      metrics: {
        totalServers: servers.length,
        healthyServers: servers.filter(s => s.healthy).length,
        avgResponseTime: servers.reduce((sum, s) => sum + s.responseTime, 0) / servers.length || 0,
        totalConnections: servers.reduce((sum, s) => sum + s.connections, 0)
      }
    })
  } catch (error) {
    return c.json({
      success: false,
      message: 'Load balancing bilgisi alınamadı: ' + error.message
    }, 500)
  }
})

// Update Load Balancing Algorithm
app.post('/api/dns/load-balancing/algorithm', requireAuth, async (c) => {
  try {
    const { algorithm, weights } = await c.req.json()
    
    if (!LOAD_BALANCING_CONFIG.algorithms.includes(algorithm)) {
      return c.json({
        success: false,
        message: 'Geçersiz load balancing algoritması'
      }, 400)
    }
    
    // Update algorithm (in production, this would be persisted)
    LOAD_BALANCING_CONFIG.currentAlgorithm = algorithm
    
    // Update server weights if provided
    if (weights && typeof weights === 'object') {
      for (const [serverId, weight] of Object.entries(weights)) {
        if (dnsRecords.has(serverId)) {
          const record = dnsRecords.get(serverId)
          record.priority = weight
          dnsRecords.set(serverId, record)
        }
      }
    }
    
    return c.json({
      success: true,
      message: 'Load balancing algoritması güncellendi',
      algorithm,
      weights
    })
  } catch (error) {
    return c.json({
      success: false,
      message: 'Load balancing güncellenemedi: ' + error.message
    }, 500)
  }
})

// DNS Cache Statistics
app.get('/api/dns/cache-stats', requireAuth, (c) => {
  try {
    const cacheEntries = Array.from(dnsCache.entries()).map(([key, entry]) => ({
      key,
      domain: key.split(':')[0],
      type: key.split(':')[1],
      hits: entry.hits,
      age: Date.now() - entry.timestamp,
      ttl: entry.ttl,
      expired: (Date.now() - entry.timestamp) > entry.ttl
    }))
    
    const stats = {
      totalEntries: cacheEntries.length,
      totalHits: cacheEntries.reduce((sum, entry) => sum + entry.hits, 0),
      expiredEntries: cacheEntries.filter(entry => entry.expired).length,
      hitRatio: cacheEntries.length > 0 ? 
        (cacheEntries.reduce((sum, entry) => sum + entry.hits, 0) / cacheEntries.length).toFixed(2) : 0,
      avgAge: cacheEntries.length > 0 ?
        (cacheEntries.reduce((sum, entry) => sum + entry.age, 0) / cacheEntries.length / 1000).toFixed(2) + 's' : '0s'
    }
    
    return c.json({
      success: true,
      stats,
      entries: cacheEntries.slice(0, 20), // Return first 20 entries
      cacheConfig: {
        defaultTTL: 300,
        maxEntries: 1000,
        cleanupInterval: 60
      }
    })
  } catch (error) {
    return c.json({
      success: false,
      message: 'Cache istatistikleri alınamadı: ' + error.message
    }, 500)
  }
})

// Clear DNS Cache
app.delete('/api/dns/cache', requireAuth, (c) => {
  try {
    const clearedEntries = dnsCache.size
    dnsCache.clear()
    
    return c.json({
      success: true,
      message: `${clearedEntries} cache girdisi temizlendi`,
      clearedEntries
    })
  } catch (error) {
    return c.json({
      success: false,
      message: 'Cache temizlenemedi: ' + error.message
    }, 500)
  }
})

// DNS Metrics Export
app.get('/api/dns/metrics/export', requireAuth, (c) => {
  try {
    const exportData = {
      timestamp: new Date().toISOString(),
      dnsRecords: Array.from(dnsRecords.values()),
      healthMetrics: Object.fromEntries(healthStatus),
      queryMetrics: Object.fromEntries(dnsMetrics),
      cacheStats: {
        totalEntries: dnsCache.size,
        entries: Array.from(dnsCache.entries())
      },
      configuration: {
        geodns: GEODNS_CONFIG,
        health: DNS_HEALTH_CONFIG,
        security: DNS_SECURITY_CONFIG,
        loadBalancing: LOAD_BALANCING_CONFIG,
        botDetection: BOT_DETECTION_CONFIG
      }
    }
    
    c.header('Content-Type', 'application/json')
    c.header('Content-Disposition', `attachment; filename="dns-metrics-${Date.now()}.json"`)
    
    return c.json(exportData)
  } catch (error) {
    return c.json({
      success: false,
      message: 'Metrics export hatası: ' + error.message
    }, 500)
  }
})

// Deployment testing API
app.get('/api/test-deployment', requireAuth, async (c) => {
  const serverIp = c.req.query('ip')
  const testDomain = c.req.query('domain')
  
  if (!serverIp || !testDomain) {
    return c.json({ success: false, message: 'Server IP and domain required' }, 400)
  }
  
  try {
    const startTime = Date.now()
    
    // Test direct IP access with Host header
    const response = await fetch(`http://${serverIp}`, {
      method: 'HEAD',
      headers: {
        'Host': testDomain,
        'User-Agent': 'GrayArea-Deployment-Test/1.0'
      },
      signal: AbortSignal.timeout(10000)
    })
    
    const responseTime = Date.now() - startTime
    
    return c.json({ 
      success: true, 
      responseTime,
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      message: `Server responded with status ${response.status}`
    })
    
  } catch (error) {
    return c.json({ 
      success: false, 
      message: `Connection failed: ${error.message}` 
    })
  }
})

// DNS propagation checker API
app.get('/api/check-dns', requireAuth, async (c) => {
  const domain = c.req.query('domain')
  
  if (!domain) {
    return c.json({ success: false, message: 'Domain required' }, 400)
  }
  
  try {
    // Simple DNS check using a public DNS API
    const dnsResponse = await fetch(`https://dns.google/resolve?name=${domain}&type=A`, {
      signal: AbortSignal.timeout(10000)
    })
    
    const dnsData = await dnsResponse.json()
    
    if (dnsData.Answer && dnsData.Answer.length > 0) {
      const aRecord = dnsData.Answer.find(record => record.type === 1) // A record
      
      if (aRecord) {
        return c.json({ 
          success: true,
          currentIp: aRecord.data,
          ttl: aRecord.TTL || 300,
          domain: domain
        })
      }
    }
    
    return c.json({ 
      success: false, 
      message: 'No A record found for domain' 
    })
    
  } catch (error) {
    return c.json({ 
      success: false, 
      message: `DNS lookup failed: ${error.message}` 
    })
  }
})

// Main pages
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="tr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Traffic Management Platform</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-900 text-white min-h-screen">
        <div class="min-h-screen flex items-center justify-center">
            <div class="bg-gray-800 p-8 rounded-lg shadow-lg w-96">
                <div class="text-center mb-8">
                    <h1 class="text-2xl font-bold mb-2">
                        <i class="fas fa-shield-alt mr-2 text-blue-400"></i>
                        Traffic Management
                    </h1>
                    <p class="text-gray-400">Admin Girişi</p>
                </div>
                
                <form id="loginForm" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium mb-2">Kullanıcı Adı</label>
                        <input type="text" id="username" required 
                               class="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-blue-400 focus:outline-none"
                               placeholder="admin">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium mb-2">Şifre</label>
                        <input type="password" id="password" required
                               class="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-blue-400 focus:outline-none"
                               placeholder="admin123">
                    </div>
                    
                    <button type="submit" 
                            class="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors">
                        <i class="fas fa-sign-in-alt mr-2"></i>Giriş Yap
                    </button>
                </form>
                
                <div id="message" class="mt-4 text-center text-sm"></div>
            </div>
        </div>

        <script>
            document.getElementById('loginForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const username = document.getElementById('username').value;
                const password = document.getElementById('password').value;
                
                try {
                    const response = await fetch('/api/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username, password })
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        localStorage.setItem('authToken', data.token);
                        window.location.href = '/dashboard';
                    } else {
                        document.getElementById('message').innerHTML = 
                            '<span class="text-red-400">' + data.message + '</span>';
                    }
                } catch (error) {
                    document.getElementById('message').innerHTML = 
                        '<span class="text-red-400">Bağlantı hatası</span>';
                }
            });
        </script>
    </body>
    </html>
  `)
})

// Dashboard with navigation
app.get('/dashboard', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="tr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Traffic Management - Dashboard</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-900 text-white min-h-screen">
        <!-- Top Navigation -->
        <nav class="bg-gray-800 border-b border-gray-700">
            <div class="max-w-7xl mx-auto px-4">
                <div class="flex items-center justify-between h-16">
                    <div class="flex items-center">
                        <h1 class="text-xl font-bold">
                            <i class="fas fa-shield-alt mr-2 text-blue-400"></i>
                            Traffic Management
                        </h1>
                    </div>
                    
                    <div class="flex space-x-4">
                        <button onclick="showSection('domains')" id="btn-domains" 
                                class="nav-btn px-4 py-2 rounded-lg transition-colors">
                            <i class="fas fa-globe mr-2"></i>Domainler
                        </button>
                        <button onclick="showSection('traffic')" id="btn-traffic"
                                class="nav-btn px-4 py-2 rounded-lg transition-colors">
                            <i class="fas fa-chart-line mr-2"></i>Trafik
                        </button>
                        <button onclick="showSection('dns')" id="btn-dns"
                                class="nav-btn px-4 py-2 rounded-lg transition-colors">
                            <i class="fas fa-network-wired mr-2"></i>DNS
                        </button>
                        <button onclick="showSection('nginx')" id="btn-nginx"
                                class="nav-btn px-4 py-2 rounded-lg transition-colors">
                            <i class="fas fa-server mr-2"></i>NGINX
                        </button>
                        <button onclick="showSection('security')" id="btn-security"
                                class="nav-btn px-4 py-2 rounded-lg transition-colors">
                            <i class="fas fa-lock mr-2"></i>Güvenlik
                        </button>
                        <button onclick="showSection('settings')" id="btn-settings"
                                class="nav-btn px-4 py-2 rounded-lg transition-colors">
                            <i class="fas fa-rocket mr-2"></i>Deploy
                        </button>
                        <button onclick="logout()" class="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors">
                            <i class="fas fa-sign-out-alt mr-2"></i>Çıkış
                        </button>
                    </div>
                </div>
            </div>
        </nav>

        <!-- Main Content -->
        <div class="max-w-7xl mx-auto px-4 py-6">
            <!-- Domain Management Section -->
            <div id="section-domains" class="section">
                <div class="bg-gray-800 rounded-lg p-6">
                    <div class="flex justify-between items-center mb-6">
                        <h2 class="text-2xl font-bold">
                            <i class="fas fa-globe mr-2 text-blue-400"></i>
                            Domain Yönetimi
                        </h2>
                        <button onclick="showAddDomain()" class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors">
                            <i class="fas fa-plus mr-2"></i>Yeni Domain
                        </button>
                    </div>
                    
                    <div id="domainList" class="space-y-4">
                        <!-- Domains will be loaded here -->
                    </div>
                </div>
            </div>

            <!-- Traffic Analysis Section -->
            <div id="section-traffic" class="section hidden">
                <div class="bg-gray-800 rounded-lg p-6">
                    <h2 class="text-2xl font-bold mb-6">
                        <i class="fas fa-chart-line mr-2 text-green-400"></i>
                        Trafik Analizi
                    </h2>
                    <p class="text-gray-400">Trafik analizi modülü yakında eklenecek...</p>
                </div>
            </div>

            <!-- NGINX Section -->
            <div id="section-nginx" class="section hidden">
                <div class="bg-gray-800 rounded-lg p-6">
                    <h2 class="text-2xl font-bold mb-6">
                        <i class="fas fa-server mr-2 text-purple-400"></i>
                        NGINX Konfigürasyonu
                    </h2>
                    
                    <!-- Backend Servers -->
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        <div class="bg-gray-700 p-4 rounded-lg">
                            <h3 class="text-lg font-semibold mb-4 flex items-center">
                                <i class="fas fa-server mr-2 text-green-400"></i>
                                Backend Sunucular
                            </h3>
                            <div class="space-y-3">
                                <div>
                                    <label class="block text-sm font-medium mb-1">Clean Backend</label>
                                    <input type="text" id="cleanBackend" 
                                           class="w-full p-2 bg-gray-600 border border-gray-500 rounded"
                                           placeholder="207.180.204.60:8081 veya http://clean-server:8080" 
                                           value="207.180.204.60:8081">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium mb-1">Gray Backend</label>
                                    <input type="text" id="grayBackend"
                                           class="w-full p-2 bg-gray-600 border border-gray-500 rounded"
                                           placeholder="207.180.204.60:8082 veya http://gray-server:8080"
                                           value="207.180.204.60:8082">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium mb-1">Aggressive Backend</label>
                                    <input type="text" id="aggressiveBackend"
                                           class="w-full p-2 bg-gray-600 border border-gray-500 rounded"
                                           placeholder="207.180.204.60:8083 veya http://aggressive-server:8080"
                                           value="207.180.204.60:8083">
                                </div>
                            </div>
                        </div>
                        
                        <div class="bg-gray-700 p-4 rounded-lg">
                            <h3 class="text-lg font-semibold mb-4 flex items-center">
                                <i class="fas fa-cogs mr-2 text-blue-400"></i>
                                Config Status
                            </h3>
                            <div class="space-y-2 text-sm">
                                <div class="flex justify-between">
                                    <span>Total Domains:</span>
                                    <span id="totalDomains">0</span>
                                </div>
                                <div class="flex justify-between">
                                    <span>Active Status:</span>
                                    <span id="cleanDomains" class="text-green-400">0 Active</span>
                                </div>
                                <div class="flex justify-between">
                                    <span>Connected:</span>
                                    <span id="grayDomains" class="text-yellow-400">0 Connected</span>
                                </div>
                                <div class="flex justify-between">
                                    <span>Total Traffic:</span>
                                    <span id="aggressiveDomains" class="text-blue-400">0 Traffic</span>
                                </div>
                                <div class="flex justify-between">
                                    <span>Blocked Requests:</span>
                                    <span id="honeypotDomains" class="text-red-400">0 Blocked</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Config Preview -->
                    <div class="bg-gray-700 p-4 rounded-lg mb-4">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="text-lg font-semibold flex items-center">
                                <i class="fas fa-eye mr-2 text-cyan-400"></i>
                                Config Preview
                            </h3>
                        </div>
                        <div class="bg-black p-4 rounded border font-mono text-sm overflow-auto max-h-96">
                            <pre id="nginxConfigPreview" class="text-green-400">
# NGINX Config will be generated here
# Click 'Generate' to create configuration
                            </pre>
                        </div>
                    </div>
                    
                    <!-- Actions -->
                    <div class="flex space-x-4">
                        <button onclick="generateNginxConfig()" 
                                class="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium">
                            <i class="fas fa-magic mr-2"></i>Generate Config
                        </button>
                        <button onclick="downloadConfig()" 
                                class="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-medium">
                            <i class="fas fa-download mr-2"></i>Download
                        </button>
                        <button onclick="applyConfig()" 
                                class="bg-yellow-600 hover:bg-yellow-700 px-6 py-3 rounded-lg font-medium">
                            <i class="fas fa-rocket mr-2"></i>Deploy
                        </button>
                    </div>
                </div>
            </div>

            <!-- DNS Management Section -->
            <div id="section-dns" class="section hidden">
                <div class="bg-gray-800 rounded-lg p-6">
                    <div class="flex justify-between items-center mb-6">
                        <h2 class="text-2xl font-bold">
                            <i class="fas fa-network-wired mr-2 text-purple-400"></i>
                            DNS Yönetimi
                        </h2>
                        
                        <div class="flex space-x-3">
                            <button onclick="showDNSAddModal()" 
                                    class="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg font-medium">
                                <i class="fas fa-plus mr-2"></i>DNS Kaydı Ekle
                            </button>
                            <button onclick="bulkDNSOperations()" 
                                    class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-medium">
                                <i class="fas fa-layer-group mr-2"></i>Toplu İşlem
                            </button>
                            <button onclick="refreshDNSRecords()" 
                                    class="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-medium">
                                <i class="fas fa-sync-alt mr-2"></i>Yenile
                            </button>
                        </div>
                    </div>

                    <!-- DNS Statistics Cards -->
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div class="bg-gray-700 p-4 rounded-lg">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-gray-300 text-sm">Toplam Kayıt</p>
                                    <p class="text-2xl font-bold text-purple-400" id="dns-total-records">0</p>
                                </div>
                                <div class="bg-purple-500 bg-opacity-20 p-3 rounded-full">
                                    <i class="fas fa-list text-purple-400"></i>
                                </div>
                            </div>
                        </div>
                        
                        <div class="bg-gray-700 p-4 rounded-lg">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-gray-300 text-sm">Aktif Kayıt</p>
                                    <p class="text-2xl font-bold text-green-400" id="dns-active-records">0</p>
                                </div>
                                <div class="bg-green-500 bg-opacity-20 p-3 rounded-full">
                                    <i class="fas fa-check-circle text-green-400"></i>
                                </div>
                            </div>
                        </div>
                        
                        <div class="bg-gray-700 p-4 rounded-lg">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-gray-300 text-sm">Propagation</p>
                                    <p class="text-2xl font-bold text-yellow-400" id="dns-propagating-records">0</p>
                                </div>
                                <div class="bg-yellow-500 bg-opacity-20 p-3 rounded-full">
                                    <i class="fas fa-hourglass-half text-yellow-400"></i>
                                </div>
                            </div>
                        </div>
                        
                        <div class="bg-gray-700 p-4 rounded-lg">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-gray-300 text-sm">Sağlayıcı</p>
                                    <p class="text-2xl font-bold text-blue-400" id="dns-providers-count">0</p>
                                </div>
                                <div class="bg-blue-500 bg-opacity-20 p-3 rounded-full">
                                    <i class="fas fa-cloud text-blue-400"></i>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- DNS Records Filter -->
                    <div class="bg-gray-700 p-4 rounded-lg mb-6">
                        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-300 mb-2">Domain Filtresi</label>
                                <input type="text" id="dns-domain-filter" placeholder="Domain ara..." 
                                       class="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-300 mb-2">Record Tipi</label>
                                <select id="dns-type-filter" class="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white">
                                    <option value="">Tümü</option>
                                    <option value="A">A Record</option>
                                    <option value="AAAA">AAAA Record</option>
                                    <option value="CNAME">CNAME Record</option>
                                    <option value="MX">MX Record</option>
                                    <option value="TXT">TXT Record</option>
                                    <option value="NS">NS Record</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-300 mb-2">Durum</label>
                                <select id="dns-status-filter" class="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white">
                                    <option value="">Tümü</option>
                                    <option value="active">Aktif</option>
                                    <option value="pending">Beklemede</option>
                                    <option value="error">Hatalı</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-300 mb-2">Sağlayıcı</label>
                                <select id="dns-provider-filter" class="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white">
                                    <option value="">Tümü</option>
                                    <option value="CLOUDFLARE">Cloudflare</option>
                                    <option value="GODADDY">GoDaddy</option>
                                    <option value="NAMECHEAP">Namecheap</option>
                                    <option value="CUSTOM">Özel</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <!-- DNS Records Table -->
                    <div class="bg-gray-700 rounded-lg overflow-hidden">
                        <div class="overflow-x-auto">
                            <table class="w-full text-sm">
                                <thead class="bg-gray-600">
                                    <tr>
                                        <th class="px-4 py-3 text-left">
                                            <input type="checkbox" id="select-all-dns" class="rounded">
                                        </th>
                                        <th class="px-4 py-3 text-left">Domain</th>
                                        <th class="px-4 py-3 text-left">Name</th>
                                        <th class="px-4 py-3 text-left">Type</th>
                                        <th class="px-4 py-3 text-left">Value</th>
                                        <th class="px-4 py-3 text-left">TTL</th>
                                        <th class="px-4 py-3 text-left">Provider</th>
                                        <th class="px-4 py-3 text-left">Status</th>
                                        <th class="px-4 py-3 text-left">Propagation</th>
                                        <th class="px-4 py-3 text-left">İşlemler</th>
                                    </tr>
                                </thead>
                                <tbody id="dns-records-table" class="divide-y divide-gray-600">
                                    <!-- DNS records will be populated here -->
                                </tbody>
                            </table>
                        </div>
                        
                        <div id="dns-loading" class="text-center py-8 hidden">
                            <i class="fas fa-spinner fa-spin text-2xl text-purple-400"></i>
                            <p class="text-gray-400 mt-2">DNS kayıtları yükleniyor...</p>
                        </div>
                        
                        <div id="dns-empty" class="text-center py-8 hidden">
                            <i class="fas fa-inbox text-4xl text-gray-500 mb-4"></i>
                            <p class="text-gray-400">Henüz DNS kaydı bulunmuyor.</p>
                            <button onclick="showDNSAddModal()" 
                                    class="mt-4 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg">
                                <i class="fas fa-plus mr-2"></i>İlk DNS kaydını ekle
                            </button>
                        </div>
                    </div>
                    
                    <!-- Advanced DNS Features -->
                    <div class="mt-8 space-y-6">
                        <!-- Advanced Features Tab Navigation -->
                        <div class="bg-gray-700 p-4 rounded-lg">
                            <h3 class="text-lg font-semibold mb-4 text-purple-300">
                                <i class="fas fa-rocket mr-2"></i>Gelişmiş DNS Özellikleri
                            </h3>
                            <div class="flex flex-wrap gap-2 mb-4">
                                <button onclick="showAdvancedDNSSection('geodns')" 
                                        class="advanced-dns-tab px-4 py-2 bg-gray-600 hover:bg-purple-600 rounded-lg transition-colors">
                                    <i class="fas fa-globe mr-2"></i>GeoDNS
                                </button>
                                <button onclick="showAdvancedDNSSection('health')" 
                                        class="advanced-dns-tab px-4 py-2 bg-gray-600 hover:bg-purple-600 rounded-lg transition-colors">
                                    <i class="fas fa-heartbeat mr-2"></i>Health Check
                                </button>
                                <button onclick="showAdvancedDNSSection('security')" 
                                        class="advanced-dns-tab px-4 py-2 bg-gray-600 hover:bg-purple-600 rounded-lg transition-colors">
                                    <i class="fas fa-shield-alt mr-2"></i>Güvenlik
                                </button>
                                <button onclick="showAdvancedDNSSection('loadbalancing')" 
                                        class="advanced-dns-tab px-4 py-2 bg-gray-600 hover:bg-purple-600 rounded-lg transition-colors">
                                    <i class="fas fa-balance-scale mr-2"></i>Load Balancing
                                </button>
                                <button onclick="showAdvancedDNSSection('cache')" 
                                        class="advanced-dns-tab px-4 py-2 bg-gray-600 hover:bg-purple-600 rounded-lg transition-colors">
                                    <i class="fas fa-database mr-2"></i>Cache
                                </button>
                                <button onclick="exportDNSMetrics()" 
                                        class="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors">
                                    <i class="fas fa-download mr-2"></i>Export
                                </button>
                            </div>
                        </div>

                        <!-- GeoDNS Section -->
                        <div id="advanced-dns-geodns" class="advanced-dns-section hidden bg-gray-700 p-4 rounded-lg">
                            <h4 class="font-semibold text-purple-300 mb-3">
                                <i class="fas fa-globe mr-2"></i>GeoDNS Management
                            </h4>
                            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div>
                                    <div class="mb-4">
                                        <label class="block text-sm font-medium text-gray-300 mb-2">Test Domain</label>
                                        <input type="text" id="geodns-test-domain" 
                                               class="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white"
                                               placeholder="example.com">
                                    </div>
                                    <button onclick="testGeoDNSResolution()" 
                                            class="w-full bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg">
                                        <i class="fas fa-test-tube mr-2"></i>GeoDNS Testi Yap
                                    </button>
                                </div>
                                <div id="geodns-results" class="text-sm">
                                    <div class="bg-gray-600 p-3 rounded border-2 border-dashed border-gray-500 text-center text-gray-400">
                                        GeoDNS test sonuçları burada görünecek
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Advanced Health Check Section -->
                        <div id="advanced-dns-health" class="advanced-dns-section hidden bg-gray-700 p-4 rounded-lg">
                            <h4 class="font-semibold text-purple-300 mb-3">
                                <i class="fas fa-heartbeat mr-2"></i>Gelişmiş Health Monitoring
                            </h4>
                            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div class="space-y-4">
                                    <div>
                                        <label class="block text-sm font-medium text-gray-300 mb-2">Hedef Sunucular (Her satırda bir)</label>
                                        <textarea id="health-targets" rows="4" 
                                                  class="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white"
                                                  placeholder="example.com&#10;api.example.com&#10;cdn.example.com"></textarea>
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-300 mb-2">Protokoller</label>
                                        <div class="flex space-x-4">
                                            <label class="flex items-center">
                                                <input type="checkbox" name="health-protocols" value="https" checked class="mr-2">
                                                HTTPS
                                            </label>
                                            <label class="flex items-center">
                                                <input type="checkbox" name="health-protocols" value="http" class="mr-2">
                                                HTTP
                                            </label>
                                            <label class="flex items-center">
                                                <input type="checkbox" name="health-protocols" value="tcp" class="mr-2">
                                                TCP
                                            </label>
                                        </div>
                                    </div>
                                    <button onclick="performAdvancedHealthCheck()" 
                                            class="w-full bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg">
                                        <i class="fas fa-stethoscope mr-2"></i>Health Check Başlat
                                    </button>
                                </div>
                                <div id="health-results" class="text-sm max-h-64 overflow-y-auto">
                                    <div class="bg-gray-600 p-3 rounded border-2 border-dashed border-gray-500 text-center text-gray-400">
                                        Health check sonuçları burada görünecek
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Security Analysis Section -->
                        <div id="advanced-dns-security" class="advanced-dns-section hidden bg-gray-700 p-4 rounded-lg">
                            <h4 class="font-semibold text-purple-300 mb-3">
                                <i class="fas fa-shield-alt mr-2"></i>DNS Güvenlik Analizi
                            </h4>
                            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div class="space-y-4">
                                    <button onclick="runBotDetectionAnalysis()" 
                                            class="w-full bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded-lg">
                                        <i class="fas fa-robot mr-2"></i>Bot Detection Analizi
                                    </button>
                                    <button onclick="runSecurityAnalysis()" 
                                            class="w-full bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg">
                                        <i class="fas fa-scan mr-2"></i>Güvenlik Taraması
                                    </button>
                                    <div id="bot-detection-results" class="text-sm">
                                        <div class="bg-gray-600 p-3 rounded border-2 border-dashed border-gray-500 text-center text-gray-400">
                                            Bot detection analizi burada görünecek
                                        </div>
                                    </div>
                                </div>
                                <div id="security-analysis-results" class="text-sm">
                                    <div class="bg-gray-600 p-3 rounded border-2 border-dashed border-gray-500 text-center text-gray-400">
                                        Güvenlik analizi sonuçları burada görünecek
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Load Balancing Section -->
                        <div id="advanced-dns-loadbalancing" class="advanced-dns-section hidden bg-gray-700 p-4 rounded-lg">
                            <h4 class="font-semibold text-purple-300 mb-3">
                                <i class="fas fa-balance-scale mr-2"></i>DNS Load Balancing
                            </h4>
                            <div id="load-balancing-info">
                                <div class="bg-gray-600 p-3 rounded border-2 border-dashed border-gray-500 text-center text-gray-400">
                                    <i class="fas fa-spinner fa-spin mr-2"></i>Load balancing bilgileri yükleniyor...
                                </div>
                            </div>
                        </div>

                        <!-- Cache Management Section -->
                        <div id="advanced-dns-cache" class="advanced-dns-section hidden bg-gray-700 p-4 rounded-lg">
                            <h4 class="font-semibold text-purple-300 mb-3">
                                <i class="fas fa-database mr-2"></i>DNS Cache Management
                            </h4>
                            <div id="cache-statistics">
                                <div class="bg-gray-600 p-3 rounded border-2 border-dashed border-gray-500 text-center text-gray-400">
                                    <i class="fas fa-spinner fa-spin mr-2"></i>Cache istatistikleri yükleniyor...
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Security Section -->
            <div id="section-security" class="section hidden">
                <div class="bg-gray-800 rounded-lg p-6">
                    <h2 class="text-2xl font-bold mb-6">
                        <i class="fas fa-lock mr-2 text-red-400"></i>
                        Güvenlik Ayarları
                    </h2>
                    <p class="text-gray-400">Güvenlik modülü yakında eklenecek...</p>
                </div>
            </div>

            <!-- Settings Section -->
            <div id="section-settings" class="section hidden">
                <div class="bg-gray-800 rounded-lg p-6">
                    <h2 class="text-2xl font-bold mb-6">
                        <i class="fas fa-cog mr-2 text-yellow-400"></i>
                        Deployment & Monitoring
                    </h2>
                    
                    <!-- Real-time Monitoring Controls -->
                    <div class="bg-gray-700 p-4 rounded-lg mb-6">
                        <h3 class="text-lg font-semibold mb-4 flex items-center">
                            <i class="fas fa-eye mr-2 text-green-400"></i>
                            Real-Time Monitoring
                        </h3>
                        <div class="flex items-center space-x-4 mb-4">
                            <div class="flex items-center space-x-2">
                                <span class="text-sm">Status:</span>
                                <span id="monitoringStatus" class="font-semibold">🔴 Stopped</span>
                            </div>
                            <div class="text-sm text-gray-400" id="lastRefresh">
                                Henüz güncelleme yapılmadı
                            </div>
                        </div>
                        <div class="flex space-x-4">
                            <button onclick="startMonitoring()" id="startMonitoringBtn"
                                    class="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-sm">
                                <i class="fas fa-play mr-2"></i>Start Monitoring
                            </button>
                            <button onclick="stopMonitoring()" id="stopMonitoringBtn" disabled
                                    class="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm disabled:opacity-50">
                                <i class="fas fa-stop mr-2"></i>Stop Monitoring
                            </button>
                        </div>
                    </div>
                    
                    <!-- Deployment Testing -->
                    <div class="bg-gray-700 p-4 rounded-lg mb-6">
                        <h3 class="text-lg font-semibold mb-4 flex items-center">
                            <i class="fas fa-rocket mr-2 text-blue-400"></i>
                            Deployment Testing
                        </h3>
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label class="block text-sm font-medium mb-2">NGINX Server IP</label>
                                <input type="text" id="serverIp"
                                       class="w-full p-2 bg-gray-600 border border-gray-500 rounded"
                                       placeholder="192.168.1.100 veya domain.com">
                            </div>
                            <div>
                                <label class="block text-sm font-medium mb-2">Test Domain</label>
                                <input type="text" id="testDomain"
                                       class="w-full p-2 bg-gray-600 border border-gray-500 rounded"
                                       placeholder="your-domain.com">
                            </div>
                        </div>
                        <div class="flex space-x-4 mb-4">
                            <button onclick="checkDeploymentStatus()"
                                    class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm">
                                <i class="fas fa-server mr-2"></i>Test Server
                            </button>
                            <button onclick="checkDNS()"
                                    class="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-sm">
                                <i class="fas fa-globe mr-2"></i>Check DNS
                            </button>
                        </div>
                        <div id="deploymentResult" class="text-sm"></div>
                        <div id="dnsResult" class="text-sm"></div>
                    </div>
                    
                    <!-- Quick Commands -->
                    <div class="bg-gray-700 p-4 rounded-lg">
                        <h3 class="text-lg font-semibold mb-4 flex items-center">
                            <i class="fas fa-terminal mr-2 text-cyan-400"></i>
                            Quick Deploy Commands
                        </h3>
                        <div class="bg-black p-4 rounded font-mono text-sm space-y-2">
                            <div class="text-green-400"># 1. Server kurulumu</div>
                            <div class="text-white">wget https://your-domain.com/nginx-setup.sh && chmod +x nginx-setup.sh && ./nginx-setup.sh</div>
                            
                            <div class="text-green-400 mt-4"># 2. Config deployment</div>
                            <div class="text-white">wget https://your-domain.com/deploy-config.sh && chmod +x deploy-config.sh && ./deploy-config.sh</div>
                            
                            <div class="text-green-400 mt-4"># 3. DNS kontrol</div>
                            <div class="text-white">nslookup your-domain.com 8.8.8.8</div>
                            
                            <div class="text-green-400 mt-4"># 4. Traffic test</div>
                            <div class="text-white">curl -H "User-Agent: facebookexternalhit/1.1" -H "Referer: https://facebook.com/" -I http://your-domain.com</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Add Domain Modal -->
        <div id="addDomainModal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div class="bg-gray-800 p-6 rounded-lg w-96">
                <h3 class="text-xl font-bold mb-4">Yeni Domain Ekle</h3>
                <form id="addDomainForm">
                    <div class="mb-4">
                        <label class="block text-sm font-medium mb-2">Domain Adı</label>
                        <input type="text" id="domainName" required
                               class="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-blue-400 focus:outline-none"
                               placeholder="google.com (https:// olmadan)">
                    </div>

                    <div class="flex space-x-4">
                        <button type="submit" class="flex-1 bg-blue-600 hover:bg-blue-700 py-2 rounded-lg">
                            Ekle
                        </button>
                        <button type="button" onclick="hideAddDomain()" class="flex-1 bg-gray-600 hover:bg-gray-700 py-2 rounded-lg">
                            İptal
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <!-- DNS Add Modal -->
        <div id="dnsAddModal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-gray-800 p-6 rounded-lg w-full max-w-md">
                <h3 class="text-xl font-bold mb-4 flex items-center">
                    <i class="fas fa-plus text-purple-400 mr-2"></i>
                    DNS Kaydı Ekle
                </h3>
                <form id="dnsAddForm">
                    <div class="grid grid-cols-1 gap-4">
                        <div>
                            <label class="block text-sm font-medium mb-2">Domain</label>
                            <input type="text" id="dns-domain" required
                                   class="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-purple-400 focus:outline-none"
                                   placeholder="example.com">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium mb-2">Name</label>
                            <input type="text" id="dns-name" required
                                   class="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-purple-400 focus:outline-none"
                                   placeholder="@ veya subdomain">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium mb-2">Type</label>
                            <select id="dns-type" required onchange="updateDNSValuePlaceholder()"
                                    class="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-purple-400 focus:outline-none">
                                <option value="">Seçiniz</option>
                                <option value="A">A Record (IPv4)</option>
                                <option value="AAAA">AAAA Record (IPv6)</option>
                                <option value="CNAME">CNAME Record</option>
                                <option value="MX">MX Record</option>
                                <option value="TXT">TXT Record</option>
                                <option value="NS">NS Record</option>
                            </select>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium mb-2">Value</label>
                            <input type="text" id="dns-value" required
                                   class="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-purple-400 focus:outline-none"
                                   placeholder="Değer">
                        </div>
                        
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium mb-2">TTL</label>
                                <select id="dns-ttl"
                                        class="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-purple-400 focus:outline-none">
                                    <option value="300">5 dakika</option>
                                    <option value="1800">30 dakika</option>
                                    <option value="3600" selected>1 saat</option>
                                    <option value="7200">2 saat</option>
                                    <option value="86400">1 gün</option>
                                </select>
                            </div>
                            
                            <div id="dns-priority-div" class="hidden">
                                <label class="block text-sm font-medium mb-2">Priority</label>
                                <input type="number" id="dns-priority" min="0" max="65535"
                                       class="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-purple-400 focus:outline-none"
                                       placeholder="10">
                            </div>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium mb-2">Provider</label>
                            <select id="dns-provider"
                                    class="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-purple-400 focus:outline-none">
                                <option value="CLOUDFLARE">Cloudflare</option>
                                <option value="GODADDY">GoDaddy</option>
                                <option value="NAMECHEAP">Namecheap</option>
                                <option value="CUSTOM">Özel Sunucu</option>
                            </select>
                        </div>
                    </div>

                    <div class="flex space-x-4 mt-6">
                        <button type="submit" class="flex-1 bg-purple-600 hover:bg-purple-700 py-2 rounded-lg font-medium">
                            <i class="fas fa-plus mr-2"></i>Ekle
                        </button>
                        <button type="button" onclick="hideDNSAddModal()" class="flex-1 bg-gray-600 hover:bg-gray-700 py-2 rounded-lg font-medium">
                            <i class="fas fa-times mr-2"></i>İptal
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <!-- DNS Edit Modal -->
        <div id="dnsEditModal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-gray-800 p-6 rounded-lg w-full max-w-md">
                <h3 class="text-xl font-bold mb-4 flex items-center">
                    <i class="fas fa-edit text-blue-400 mr-2"></i>
                    DNS Kaydı Düzenle
                </h3>
                <form id="dnsEditForm">
                    <input type="hidden" id="edit-dns-id">
                    
                    <div class="grid grid-cols-1 gap-4">
                        <div>
                            <label class="block text-sm font-medium mb-2">Domain</label>
                            <input type="text" id="edit-dns-domain" required
                                   class="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-blue-400 focus:outline-none">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium mb-2">Name</label>
                            <input type="text" id="edit-dns-name" required
                                   class="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-blue-400 focus:outline-none">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium mb-2">Type</label>
                            <select id="edit-dns-type" required onchange="updateEditDNSValuePlaceholder()"
                                    class="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-blue-400 focus:outline-none">
                                <option value="A">A Record (IPv4)</option>
                                <option value="AAAA">AAAA Record (IPv6)</option>
                                <option value="CNAME">CNAME Record</option>
                                <option value="MX">MX Record</option>
                                <option value="TXT">TXT Record</option>
                                <option value="NS">NS Record</option>
                            </select>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium mb-2">Value</label>
                            <input type="text" id="edit-dns-value" required
                                   class="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-blue-400 focus:outline-none">
                        </div>
                        
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium mb-2">TTL</label>
                                <select id="edit-dns-ttl"
                                        class="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-blue-400 focus:outline-none">
                                    <option value="300">5 dakika</option>
                                    <option value="1800">30 dakika</option>
                                    <option value="3600">1 saat</option>
                                    <option value="7200">2 saat</option>
                                    <option value="86400">1 gün</option>
                                </select>
                            </div>
                            
                            <div id="edit-dns-priority-div" class="hidden">
                                <label class="block text-sm font-medium mb-2">Priority</label>
                                <input type="number" id="edit-dns-priority" min="0" max="65535"
                                       class="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-blue-400 focus:outline-none">
                            </div>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium mb-2">Provider</label>
                            <select id="edit-dns-provider"
                                    class="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-blue-400 focus:outline-none">
                                <option value="CLOUDFLARE">Cloudflare</option>
                                <option value="GODLADDY">GoDaddy</option>
                                <option value="NAMECHEAP">Namecheap</option>
                                <option value="CUSTOM">Özel Sunucu</option>
                            </select>
                        </div>
                    </div>

                    <div class="flex space-x-4 mt-6">
                        <button type="submit" class="flex-1 bg-blue-600 hover:bg-blue-700 py-2 rounded-lg font-medium">
                            <i class="fas fa-save mr-2"></i>Güncelle
                        </button>
                        <button type="button" onclick="hideDNSEditModal()" class="flex-1 bg-gray-600 hover:bg-gray-700 py-2 rounded-lg font-medium">
                            <i class="fas fa-times mr-2"></i>İptal
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <!-- DNS Health Check Modal -->
        <div id="dnsHealthModal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-gray-800 p-6 rounded-lg w-full max-w-2xl">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-xl font-bold flex items-center">
                        <i class="fas fa-heartbeat text-red-400 mr-2"></i>
                        DNS Sağlık Kontrolü
                    </h3>
                    <button onclick="hideDNSHealthModal()" class="text-gray-400 hover:text-white">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div id="dns-health-content" class="space-y-4">
                    <!-- Health check results will be populated here -->
                </div>
                
                <div class="flex justify-end mt-6">
                    <button onclick="hideDNSHealthModal()" class="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg">
                        Kapat
                    </button>
                </div>
            </div>
        </div>

        <style>
            .nav-btn {
                background-color: #374151;
            }
            .nav-btn:hover, .nav-btn.active {
                background-color: #4F46E5;
            }
        </style>

        <script src="/static/dashboard.js"></script>
    </body>
    </html>
  `)
})

export default app