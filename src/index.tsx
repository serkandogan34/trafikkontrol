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