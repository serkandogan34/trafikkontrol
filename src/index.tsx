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

// ====================================================================
// JSON-BASED DATA STORAGE SYSTEM (NO CLOUDFLARE DEPENDENCIES)
// ====================================================================

// In-memory domain management with JSON persistence simulation
const domains = new Map()

// Per-domain data structure for comprehensive traffic management
const domainDataStore = new Map()

// DNS Management System
const dnsRecords = new Map()

// Data structure for each domain's comprehensive configuration
class DomainDataManager {
  constructor(domainName) {
    this.domainName = domainName
    this.data = {
      // Domain basic info
      id: Date.now().toString(),
      name: domainName,
      status: 'active',
      connected: true,
      addedAt: new Date().toISOString(),
      lastChecked: new Date().toISOString(),
      
      // IP Management (Phase 1)
      ipRules: {
        whitelist: [], // { ip: '192.168.1.1', reason: 'Trusted office', addedAt: ISO, addedBy: 'admin' }
        blacklist: [], // { ip: '1.2.3.4', reason: 'Spam source', addedAt: ISO, addedBy: 'admin' }
        graylist: [],  // { ip: '5.6.7.8', reason: 'Suspicious activity', addedAt: ISO, addedBy: 'admin' }
        ranges: {      // CIDR ranges
          whitelist: [], // { range: '192.168.0.0/24', reason: 'Company network' }
          blacklist: [], // { range: '10.0.0.0/8', reason: 'Blocked network' }
          graylist: []   // { range: '172.16.0.0/12', reason: 'Monitor network' }
        }
      },
      
      // Visitor Analytics (Phase 1)
      analytics: {
        totalRequests: 0,
        uniqueVisitors: 0,
        humanRequests: 0,
        botRequests: 0,
        blocked: 0,
        
        // Content type served counters
        cleanServed: 0,
        grayServed: 0,
        aggressiveServed: 0,
        
        // Referrer analytics
        referrers: {
          facebook: 0,
          google: 0,
          twitter: 0,
          instagram: 0,
          direct: 0,
          other: 0
        },
        
        // Geographic analytics
        countries: {}, // { 'US': { requests: 100, humans: 80, bots: 20 } }
        
        // Time-based analytics
        hourlyStats: {}, // { '2024-01-01-14': { requests: 50, humans: 40, bots: 10 } }
        
        // Recent visitor tracking (last 1000 visitors)
        recentVisitors: [], // { ip, userAgent, referer, timestamp, isBot, country, action }
        
        // Last update timestamp
        lastUpdate: new Date().toISOString()
      },
      
      // Geographic Controls (Phase 2 - structure ready)
      geoControls: {
        enabled: false,
        allowedCountries: [], // ['US', 'CA', 'GB']
        blockedCountries: [], // ['CN', 'RU']
        redirectRules: {},    // { 'US': 'us.example.com', 'EU': 'eu.example.com' }
        defaultAction: 'allow' // 'allow' | 'block' | 'redirect'
      },
      
      // Time-based Access Controls (Phase 2 - structure ready)
      timeControls: {
        enabled: false,
        timezone: 'UTC',
        rules: [], // { days: ['mon', 'tue'], hours: [9, 17], action: 'block' }
        businessHours: { start: 9, end: 17, days: ['mon', 'tue', 'wed', 'thu', 'fri'] },
        holidayBlocks: [] // { date: '2024-12-25', action: 'block' }
      },
      
      // Campaign Tracking (Phase 3 - structure ready)
      campaigns: {
        enabled: false,
        utmTracking: true,
        campaigns: {}, // { 'campaign1': { clicks: 100, conversions: 10, sources: {...} } }
        sources: {},   // { 'facebook': { clicks: 50, campaigns: [...] } }
        validUtmSources: ['facebook', 'google', 'twitter', 'email'],
        customParameters: [] // ['custom_param1', 'custom_param2']
      },
      
      // Rate Limiting (Phase 3 - structure ready)
      rateLimiting: {
        enabled: true,
        rules: {
          perIP: { requests: 60, window: 60 }, // 60 requests per minute
          perSession: { requests: 300, window: 3600 }, // 300 requests per hour
          burst: { requests: 10, window: 1 } // Max 10 requests per second
        },
        botLimiting: {
          perIP: { requests: 10, window: 60 }, // 10 requests per minute for bots
          burst: { requests: 2, window: 1 } // Max 2 requests per second for bots
        }
      },
      
      // Video Delivery System (Phase 4 - structure ready)
      videoSystem: {
        enabled: false,
        storage: {
          type: 'local', // 'local' | 'external' | 'cdn'
          basePath: '/videos/',
          cdnUrl: '',
          encryptionEnabled: false
        },
        videos: {}, // { 'video1': { title, url, views, uniqueViews, trackingData } }
        viewTracking: {
          methods: ['localStorage', 'sessionStorage', 'cookies', 'fingerprint'],
          preventMultipleViews: true,
          trackingWindow: 86400 // 24 hours
        },
        analytics: {
          totalViews: 0,
          uniqueViews: 0,
          viewsByVideo: {},
          viewsByCountry: {},
          viewsByReferrer: {}
        }
      },
      
      // Advanced Security Rules (Phase 5 - structure ready)
      securityRules: {
        enabled: false,
        customRules: [], // { name, condition, action, priority }
        honeypots: [],   // { url, triggers, actions }
        behaviorAnalysis: {
          enabled: false,
          suspiciousPatterns: [],
          actions: {}
        }
      },
      
      // Hook System (Phase 6 - structure ready)
      hooks: {
        enabled: false,
        webhooks: [], // { event, url, method, headers, retries }
        events: ['visitor_detected', 'bot_blocked', 'campaign_click', 'video_view'],
        customScripts: [] // { event, script, enabled }
      }
    }
  }
  
  // Simulate JSON file save (in production, this would write to actual files)
  async save() {
    // In production: await writeFile(`domains/${this.domainName}/config.json`, JSON.stringify(this.data, null, 2))
    console.log(`[DataManager] Saving data for ${this.domainName}:`, this.data)
    return true
  }
  
  // Simulate JSON file load (in production, this would read from actual files)
  async load() {
    // In production: this.data = JSON.parse(await readFile(`domains/${this.domainName}/config.json`))
    console.log(`[DataManager] Loading data for ${this.domainName}`)
    return this.data
  }
  
  // Add IP to whitelist/blacklist/graylist
  addIPRule(listType, ip, reason = '', addedBy = 'admin') {
    if (!['whitelist', 'blacklist', 'graylist'].includes(listType)) return false
    
    const rule = {
      ip: ip.trim(),
      reason: reason || `Added to ${listType}`,
      addedAt: new Date().toISOString(),
      addedBy
    }
    
    // Remove from other lists first
    const otherLists = ['whitelist', 'blacklist', 'graylist'].filter(l => l !== listType)
    otherLists.forEach(list => {
      this.data.ipRules[list] = this.data.ipRules[list].filter(r => r.ip !== ip)
    })
    
    // Add to specified list
    this.data.ipRules[listType].push(rule)
    this.save()
    return true
  }
  
  // Remove IP from all lists
  removeIPRule(ip) {
    ['whitelist', 'blacklist', 'graylist'].forEach(list => {
      this.data.ipRules[list] = this.data.ipRules[list].filter(r => r.ip !== ip)
    })
    this.save()
    return true
  }
  
  // Check IP status
  checkIPStatus(ip) {
    const whitelist = this.data.ipRules.whitelist.find(r => r.ip === ip)
    const blacklist = this.data.ipRules.blacklist.find(r => r.ip === ip)
    const graylist = this.data.ipRules.graylist.find(r => r.ip === ip)
    
    if (whitelist) return { status: 'whitelisted', rule: whitelist }
    if (blacklist) return { status: 'blacklisted', rule: blacklist }
    if (graylist) return { status: 'graylisted', rule: graylist }
    
    return { status: 'unknown', rule: null }
  }
  
  // Log visitor analytics
  logVisitor(visitorData) {
    const { ip, userAgent, referer, isBot, country, action } = visitorData
    
    // Update counters
    this.data.analytics.totalRequests++
    if (isBot) {
      this.data.analytics.botRequests++
    } else {
      this.data.analytics.humanRequests++
    }
    
    // Update action counters
    if (action === 'clean') this.data.analytics.cleanServed++
    else if (action === 'gray') this.data.analytics.grayServed++
    else if (action === 'aggressive') this.data.analytics.aggressiveServed++
    else if (action === 'blocked') this.data.analytics.blocked++
    
    // Update referrer stats
    const referrerType = this.analyzeReferrer(referer)
    this.data.analytics.referrers[referrerType]++
    
    // Update country stats
    if (!this.data.analytics.countries[country]) {
      this.data.analytics.countries[country] = { requests: 0, humans: 0, bots: 0 }
    }
    this.data.analytics.countries[country].requests++
    if (isBot) {
      this.data.analytics.countries[country].bots++
    } else {
      this.data.analytics.countries[country].humans++
    }
    
    // Update hourly stats
    const hourKey = new Date().toISOString().substring(0, 13) // YYYY-MM-DDTHH
    if (!this.data.analytics.hourlyStats[hourKey]) {
      this.data.analytics.hourlyStats[hourKey] = { requests: 0, humans: 0, bots: 0 }
    }
    this.data.analytics.hourlyStats[hourKey].requests++
    if (isBot) {
      this.data.analytics.hourlyStats[hourKey].bots++
    } else {
      this.data.analytics.hourlyStats[hourKey].humans++
    }
    
    // Add to recent visitors (keep last 1000)
    const visitor = {
      ip,
      userAgent: userAgent?.substring(0, 200) || 'Unknown',
      referer: referer?.substring(0, 200) || '',
      timestamp: new Date().toISOString(),
      isBot,
      country,
      action
    }
    
    this.data.analytics.recentVisitors.unshift(visitor)
    if (this.data.analytics.recentVisitors.length > 1000) {
      this.data.analytics.recentVisitors = this.data.analytics.recentVisitors.slice(0, 1000)
    }
    
    // Update timestamp
    this.data.analytics.lastUpdate = new Date().toISOString()
    
    // Save data
    this.save()
  }
  
  // Analyze referrer type
  analyzeReferrer(referer) {
    if (!referer || referer === '') return 'direct'
    
    const lower = referer.toLowerCase()
    if (lower.includes('facebook') || lower.includes('fb.')) return 'facebook'
    if (lower.includes('google')) return 'google'
    if (lower.includes('twitter') || lower.includes('t.co')) return 'twitter'
    if (lower.includes('instagram')) return 'instagram'
    
    return 'other'
  }
  
  // Get analytics summary
  getAnalyticsSummary() {
    const analytics = this.data.analytics
    
    return {
      overview: {
        totalRequests: analytics.totalRequests,
        uniqueVisitors: analytics.uniqueVisitors,
        humanRequests: analytics.humanRequests,
        botRequests: analytics.botRequests,
        blocked: analytics.blocked,
        humanRate: analytics.totalRequests > 0 ? 
          ((analytics.humanRequests / analytics.totalRequests) * 100).toFixed(1) : '0',
        botRate: analytics.totalRequests > 0 ? 
          ((analytics.botRequests / analytics.totalRequests) * 100).toFixed(1) : '0'
      },
      content: {
        cleanServed: analytics.cleanServed,
        grayServed: analytics.grayServed,
        aggressiveServed: analytics.aggressiveServed
      },
      referrers: analytics.referrers,
      topCountries: Object.entries(analytics.countries)
        .sort(([,a], [,b]) => b.requests - a.requests)
        .slice(0, 10)
        .map(([country, stats]) => ({ country, ...stats })),
      recentActivity: analytics.recentVisitors.slice(0, 50),
      lastUpdate: analytics.lastUpdate
    }
  }
  
  // =============================================================================
  // PHASE 3: CAMPAIGN TRACKING & RATE LIMITING METHODS
  // =============================================================================
  
  // Check rate limits for IP and user agent
  checkRateLimit(ip, userAgent) {
    if (!this.data.rateLimiting.enabled) {
      return { allowed: true }
    }
    
    const now = Date.now()
    const rateLimits = this.data.rateLimiting
    const isBot = this.detectBot(userAgent)
    
    // Use bot-specific limits if detected as bot
    const rules = isBot ? rateLimits.botLimiting : rateLimits.rules
    
    // Initialize rate limiting storage if not exists
    if (!this.rateLimitStore) {
      this.rateLimitStore = {
        perIP: {},
        perSession: {},
        burst: {}
      }
    }
    
    // Check burst limit (per second)
    const burstKey = `${ip}-${Math.floor(now / 1000)}`
    if (!this.rateLimitStore.burst[burstKey]) {
      this.rateLimitStore.burst[burstKey] = 0
    }
    
    if (this.rateLimitStore.burst[burstKey] >= rules.burst.requests) {
      return { 
        allowed: false, 
        reason: 'Burst limit exceeded', 
        retryAfter: 1 
      }
    }
    
    // Check per-IP limit (per minute)
    const ipKey = `${ip}-${Math.floor(now / (rules.perIP.window * 1000))}`
    if (!this.rateLimitStore.perIP[ipKey]) {
      this.rateLimitStore.perIP[ipKey] = 0
    }
    
    if (this.rateLimitStore.perIP[ipKey] >= rules.perIP.requests) {
      return { 
        allowed: false, 
        reason: 'Rate limit exceeded', 
        retryAfter: rules.perIP.window 
      }
    }
    
    // Increment counters
    this.rateLimitStore.burst[burstKey]++
    this.rateLimitStore.perIP[ipKey]++
    
    // Clean old entries (keep only last 2 time windows)
    this.cleanRateLimitStore(now, rules)
    
    return { allowed: true }
  }
  
  // Clean old rate limit entries
  cleanRateLimitStore(now, rules) {
    const currentSecond = Math.floor(now / 1000)
    const currentMinute = Math.floor(now / (rules.perIP.window * 1000))
    
    // Clean burst store (keep last 2 seconds)
    Object.keys(this.rateLimitStore.burst).forEach(key => {
      const keyTime = parseInt(key.split('-').pop())
      if (keyTime < currentSecond - 2) {
        delete this.rateLimitStore.burst[key]
      }
    })
    
    // Clean IP store (keep last 2 time windows)
    Object.keys(this.rateLimitStore.perIP).forEach(key => {
      const keyTime = parseInt(key.split('-').pop())
      if (keyTime < currentMinute - 2) {
        delete this.rateLimitStore.perIP[key]
      }
    })
  }
  
  // Track campaign click
  trackCampaignClick(campaignData) {
    const { utmSource, utmMedium, utmCampaign, utmContent, utmTerm, referrer, ip, country, timestamp, customParams } = campaignData
    
    if (!this.data.campaigns.enabled) return
    
    // Create campaign key
    const campaignKey = utmCampaign || 'direct'
    const sourceKey = utmSource || this.parseReferrerSource(referrer) || 'direct'
    
    // Initialize campaign tracking
    if (!this.data.campaigns.campaigns[campaignKey]) {
      this.data.campaigns.campaigns[campaignKey] = {
        name: campaignKey,
        clicks: 0,
        conversions: 0,
        sources: {},
        countries: {},
        firstSeen: new Date(timestamp).toISOString(),
        lastSeen: new Date(timestamp).toISOString()
      }
    }
    
    // Initialize source tracking
    if (!this.data.campaigns.sources[sourceKey]) {
      this.data.campaigns.sources[sourceKey] = {
        name: sourceKey,
        clicks: 0,
        campaigns: {},
        countries: {}
      }
    }
    
    // Update campaign statistics
    const campaign = this.data.campaigns.campaigns[campaignKey]
    campaign.clicks++
    campaign.lastSeen = new Date(timestamp).toISOString()
    
    if (!campaign.sources[sourceKey]) {
      campaign.sources[sourceKey] = 0
    }
    campaign.sources[sourceKey]++
    
    if (!campaign.countries[country]) {
      campaign.countries[country] = 0
    }
    campaign.countries[country]++
    
    // Update source statistics
    const source = this.data.campaigns.sources[sourceKey]
    source.clicks++
    
    if (!source.campaigns[campaignKey]) {
      source.campaigns[campaignKey] = 0
    }
    source.campaigns[campaignKey]++
    
    if (!source.countries[country]) {
      source.countries[country] = 0
    }
    source.countries[country]++
    
    // Store detailed click data
    const clickData = {
      timestamp: new Date(timestamp).toISOString(),
      ip,
      country,
      campaign: campaignKey,
      source: sourceKey,
      medium: utmMedium,
      content: utmContent,
      term: utmTerm,
      referrer,
      customParams
    }
    
    // Add to recent clicks (keep last 1000)
    if (!this.data.campaigns.recentClicks) {
      this.data.campaigns.recentClicks = []
    }
    
    this.data.campaigns.recentClicks.unshift(clickData)
    if (this.data.campaigns.recentClicks.length > 1000) {
      this.data.campaigns.recentClicks = this.data.campaigns.recentClicks.slice(0, 1000)
    }
  }
  
  // Parse referrer to extract source name
  parseReferrerSource(referrer) {
    if (!referrer) return null
    
    const url = referrer.toLowerCase()
    if (url.includes('facebook.com') || url.includes('fb.com')) return 'facebook'
    if (url.includes('google.com') || url.includes('google.')) return 'google'
    if (url.includes('twitter.com') || url.includes('t.co')) return 'twitter'
    if (url.includes('instagram.com')) return 'instagram'
    if (url.includes('linkedin.com')) return 'linkedin'
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube'
    if (url.includes('tiktok.com')) return 'tiktok'
    if (url.includes('pinterest.com')) return 'pinterest'
    
    // Extract domain name
    try {
      const domain = new URL(referrer).hostname.replace('www.', '')
      return domain
    } catch {
      return 'unknown'
    }
  }
  
  // Get campaign analytics
  getCampaignAnalytics() {
    const campaigns = this.data.campaigns
    
    return {
      enabled: campaigns.enabled,
      totalClicks: Object.values(campaigns.campaigns).reduce((sum, c) => sum + (c.clicks || 0), 0),
      totalCampaigns: Object.keys(campaigns.campaigns).length,
      totalSources: Object.keys(campaigns.sources).length,
      topCampaigns: Object.entries(campaigns.campaigns)
        .sort(([,a], [,b]) => (b.clicks || 0) - (a.clicks || 0))
        .slice(0, 10),
      topSources: Object.entries(campaigns.sources)
        .sort(([,a], [,b]) => (b.clicks || 0) - (a.clicks || 0))
        .slice(0, 10),
      recentClicks: campaigns.recentClicks?.slice(0, 50) || [],
      settings: {
        utmTracking: campaigns.utmTracking,
        validUtmSources: campaigns.validUtmSources,
        customParameters: campaigns.customParameters
      }
    }
  }
  
  // Get rate limiting status
  getRateLimitingStatus() {
    const rateLimiting = this.data.rateLimiting
    
    // Calculate current load
    let currentLoad = 0
    if (this.rateLimitStore?.perIP) {
      currentLoad = Object.values(this.rateLimitStore.perIP).reduce((sum, count) => sum + count, 0)
    }
    
    return {
      enabled: rateLimiting.enabled,
      rules: rateLimiting.rules,
      botLimiting: rateLimiting.botLimiting,
      currentLoad,
      alerts: this.generateRateLimitingAlerts()
    }
  }
  
  // Generate rate limiting alerts
  generateRateLimitingAlerts() {
    const alerts = []
    
    if (this.rateLimitStore?.perIP) {
      const ipCounts = Object.values(this.rateLimitStore.perIP)
      const maxRequests = Math.max(...ipCounts, 0)
      const avgRequests = ipCounts.length > 0 ? ipCounts.reduce((sum, count) => sum + count, 0) / ipCounts.length : 0
      
      if (maxRequests > this.data.rateLimiting.rules.perIP.requests * 0.8) {
        alerts.push({
          type: 'warning',
          message: `High traffic detected: ${maxRequests} requests from single IP`,
          timestamp: new Date().toISOString()
        })
      }
      
      if (avgRequests > this.data.rateLimiting.rules.perIP.requests * 0.5) {
        alerts.push({
          type: 'info',
          message: `Average load: ${Math.round(avgRequests)} requests per minute`,
          timestamp: new Date().toISOString()
        })
      }
    }
    
    return alerts
  }
  
  // Simple bot detection
  detectBot(userAgent) {
    if (!userAgent) return true
    
    const botPatterns = [
      /bot/i, /crawler/i, /spider/i, /scraper/i,
      /googlebot/i, /bingbot/i, /slurp/i, /duckduckbot/i,
      /facebookexternalhit/i, /twitterbot/i, /linkedinbot/i,
      /whatsapp/i, /telegram/i, /curl/i, /wget/i
    ]
    
    return botPatterns.some(pattern => pattern.test(userAgent))
  }
  
  // =============================================================================
  // PHASE 4: VIDEO DELIVERY SYSTEM METHODS
  // =============================================================================
  
  // Add or update video
  addVideo(videoData) {
    const { id, title, url, description, thumbnailUrl, duration, fileSize, format, quality } = videoData
    
    if (!this.data.videoSystem.videos[id]) {
      this.data.videoSystem.videos[id] = {
        id,
        title,
        url,
        description: description || '',
        thumbnailUrl: thumbnailUrl || '',
        duration: duration || 0,
        fileSize: fileSize || 0,
        format: format || 'mp4',
        quality: quality || '720p',
        views: 0,
        uniqueViews: 0,
        watchTime: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
        trackingData: {
          viewsByCountry: {},
          viewsByHour: {},
          viewsByDevice: {},
          averageWatchTime: 0,
          dropOffPoints: {},
          engagementRate: 0
        }
      }
    } else {
      // Update existing video
      Object.assign(this.data.videoSystem.videos[id], {
        title,
        url,
        description: description || this.data.videoSystem.videos[id].description,
        thumbnailUrl: thumbnailUrl || this.data.videoSystem.videos[id].thumbnailUrl,
        duration: duration || this.data.videoSystem.videos[id].duration,
        fileSize: fileSize || this.data.videoSystem.videos[id].fileSize,
        format: format || this.data.videoSystem.videos[id].format,
        quality: quality || this.data.videoSystem.videos[id].quality,
        updatedAt: new Date().toISOString()
      })
    }
    
    return this.data.videoSystem.videos[id]
  }
  
  // Remove video
  removeVideo(videoId) {
    if (this.data.videoSystem.videos[videoId]) {
      delete this.data.videoSystem.videos[videoId]
      return true
    }
    return false
  }
  
  // Get video by ID
  getVideo(videoId) {
    return this.data.videoSystem.videos[videoId] || null
  }
  
  // Get all videos
  getAllVideos() {
    return Object.values(this.data.videoSystem.videos)
  }
  
  // Track video view
  trackVideoView(viewData) {
    const { 
      videoId, 
      ip, 
      country, 
      userAgent, 
      sessionId, 
      watchTime = 0, 
      dropOffTime = null,
      isBot = false,
      timestamp = Date.now() 
    } = viewData
    
    if (!this.data.videoSystem.enabled) return false
    
    const video = this.data.videoSystem.videos[videoId]
    if (!video) return false
    
    // Check if this should count as unique view
    const isUniqueView = this.isUniqueVideoView(videoId, ip, sessionId, timestamp)
    
    // Update video statistics
    video.views++
    if (isUniqueView && !isBot) {
      video.uniqueViews++
    }
    
    // Update watch time
    if (watchTime > 0) {
      video.watchTime += watchTime
      video.trackingData.averageWatchTime = video.watchTime / video.views
      
      // Calculate engagement rate (% of video watched)
      if (video.duration > 0) {
        const engagementPercent = (watchTime / video.duration) * 100
        video.trackingData.engagementRate = 
          (video.trackingData.engagementRate * (video.views - 1) + engagementPercent) / video.views
      }
    }
    
    // Track drop-off point
    if (dropOffTime !== null && video.duration > 0) {
      const dropOffPercent = Math.floor((dropOffTime / video.duration) * 100)
      if (!video.trackingData.dropOffPoints[dropOffPercent]) {
        video.trackingData.dropOffPoints[dropOffPercent] = 0
      }
      video.trackingData.dropOffPoints[dropOffPercent]++
    }
    
    // Update country statistics
    if (!video.trackingData.viewsByCountry[country]) {
      video.trackingData.viewsByCountry[country] = 0
    }
    video.trackingData.viewsByCountry[country]++
    
    // Update hourly statistics
    const hour = new Date(timestamp).getHours()
    if (!video.trackingData.viewsByHour[hour]) {
      video.trackingData.viewsByHour[hour] = 0
    }
    video.trackingData.viewsByHour[hour]++
    
    // Update device statistics
    const device = this.detectDevice(userAgent)
    if (!video.trackingData.viewsByDevice[device]) {
      video.trackingData.viewsByDevice[device] = 0
    }
    video.trackingData.viewsByDevice[device]++
    
    // Update global video analytics
    this.data.videoSystem.analytics.totalViews++
    if (isUniqueView && !isBot) {
      this.data.videoSystem.analytics.uniqueViews++
    }
    
    // Update global country stats
    if (!this.data.videoSystem.analytics.viewsByCountry[country]) {
      this.data.videoSystem.analytics.viewsByCountry[country] = 0
    }
    this.data.videoSystem.analytics.viewsByCountry[country]++
    
    // Store view record for detailed tracking
    if (!this.data.videoSystem.recentViews) {
      this.data.videoSystem.recentViews = []
    }
    
    this.data.videoSystem.recentViews.unshift({
      videoId,
      ip,
      country,
      userAgent,
      sessionId,
      watchTime,
      dropOffTime,
      isBot,
      isUniqueView,
      timestamp: new Date(timestamp).toISOString()
    })
    
    // Keep only last 1000 views
    if (this.data.videoSystem.recentViews.length > 1000) {
      this.data.videoSystem.recentViews = this.data.videoSystem.recentViews.slice(0, 1000)
    }
    
    video.updatedAt = new Date().toISOString()
    return true
  }
  
  // Check if this is a unique video view
  isUniqueVideoView(videoId, ip, sessionId, timestamp) {
    if (!this.data.videoSystem.viewTracking.preventMultipleViews) {
      return true
    }
    
    const trackingWindow = this.data.videoSystem.viewTracking.trackingWindow * 1000 // Convert to ms
    const cutoffTime = timestamp - trackingWindow
    
    // Check recent views for this video from same IP/session
    const recentViews = this.data.videoSystem.recentViews || []
    
    return !recentViews.some(view => 
      view.videoId === videoId &&
      (view.ip === ip || view.sessionId === sessionId) &&
      new Date(view.timestamp).getTime() > cutoffTime
    )
  }
  
  // Detect device type from user agent
  detectDevice(userAgent) {
    if (!userAgent) return 'unknown'
    
    const ua = userAgent.toLowerCase()
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) return 'mobile'
    if (ua.includes('tablet') || ua.includes('ipad')) return 'tablet'
    if (ua.includes('smart-tv') || ua.includes('roku') || ua.includes('chromecast')) return 'tv'
    return 'desktop'
  }
  
  // Get video analytics
  getVideoAnalytics() {
    const videos = this.getAllVideos()
    
    return {
      enabled: this.data.videoSystem.enabled,
      totalVideos: videos.length,
      activeVideos: videos.filter(v => v.isActive).length,
      totalViews: this.data.videoSystem.analytics.totalViews,
      uniqueViews: this.data.videoSystem.analytics.uniqueViews,
      totalWatchTime: videos.reduce((sum, v) => sum + (v.watchTime || 0), 0),
      averageEngagement: videos.length > 0 ? 
        videos.reduce((sum, v) => sum + (v.trackingData.engagementRate || 0), 0) / videos.length : 0,
      topVideos: videos
        .sort((a, b) => (b.views || 0) - (a.views || 0))
        .slice(0, 10)
        .map(v => ({
          id: v.id,
          title: v.title,
          views: v.views,
          uniqueViews: v.uniqueViews,
          watchTime: v.watchTime,
          engagementRate: v.trackingData.engagementRate || 0
        })),
      viewsByCountry: this.data.videoSystem.analytics.viewsByCountry,
      recentViews: (this.data.videoSystem.recentViews || []).slice(0, 50),
      settings: {
        storage: this.data.videoSystem.storage,
        viewTracking: this.data.videoSystem.viewTracking
      }
    }
  }
  
  // Get video access URL with security token
  getVideoAccessUrl(videoId, visitorInfo) {
    const { ip, country, userAgent, isBot } = visitorInfo
    const video = this.getVideo(videoId)
    
    if (!video || !video.isActive) {
      return null
    }
    
    // Check if video access is allowed based on geo/time controls
    const accessCheck = checkDomainAccess(this, visitorInfo)
    if (!accessCheck.allowed) {
      return null
    }
    
    // Generate secure access token
    const accessToken = this.generateVideoAccessToken(videoId, ip, country)
    
    // Return video URL with access token
    return {
      videoUrl: video.url,
      accessToken,
      thumbnailUrl: video.thumbnailUrl,
      title: video.title,
      duration: video.duration,
      quality: video.quality,
      format: video.format
    }
  }
  
  // Generate secure access token for video
  generateVideoAccessToken(videoId, ip, country) {
    const timestamp = Date.now()
    const expiresAt = timestamp + (3600 * 1000) // 1 hour expiry
    
    // Simple token generation (in production, use proper JWT or similar)
    const tokenData = {
      videoId,
      ip,
      country,
      timestamp,
      expiresAt
    }
    
    return Buffer.from(JSON.stringify(tokenData)).toString('base64')
  }
  
  // Validate video access token
  validateVideoAccessToken(token, ip) {
    try {
      const tokenData = JSON.parse(Buffer.from(token, 'base64').toString())
      const now = Date.now()
      
      // Check if token is expired
      if (now > tokenData.expiresAt) {
        return false
      }
      
      // Check if IP matches (optional, for extra security)
      if (tokenData.ip !== ip) {
        return false
      }
      
      return tokenData
    } catch {
      return false
    }
  }
  
  // =============================================================================
  // PHASE 5: ADVANCED SECURITY RULES METHODS
  // =============================================================================
  
  // Add custom security rule
  addSecurityRule(ruleData) {
    const { name, condition, action, priority = 5, enabled = true } = ruleData
    
    const rule = {
      id: Date.now().toString() + Math.random().toString(36).substring(7),
      name,
      condition, // { field, operator, value, logic }
      action, // { type, parameters }
      priority, // 1-10 (1 = highest priority)
      enabled,
      triggered: 0,
      lastTriggered: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    this.data.securityRules.customRules.push(rule)
    
    // Sort by priority (lower number = higher priority)
    this.data.securityRules.customRules.sort((a, b) => a.priority - b.priority)
    
    return rule
  }
  
  // Remove security rule
  removeSecurityRule(ruleId) {
    const index = this.data.securityRules.customRules.findIndex(rule => rule.id === ruleId)
    if (index !== -1) {
      this.data.securityRules.customRules.splice(index, 1)
      return true
    }
    return false
  }
  
  // Update security rule
  updateSecurityRule(ruleId, updates) {
    const rule = this.data.securityRules.customRules.find(r => r.id === ruleId)
    if (rule) {
      Object.assign(rule, updates, { updatedAt: new Date().toISOString() })
      return rule
    }
    return null
  }
  
  // Evaluate security rules for visitor
  evaluateSecurityRules(visitorData) {
    if (!this.data.securityRules.enabled) {
      return { allowed: true, actions: [] }
    }
    
    const results = []
    const triggeredActions = []
    
    for (const rule of this.data.securityRules.customRules) {
      if (!rule.enabled) continue
      
      const matched = this.evaluateRuleCondition(rule.condition, visitorData)
      
      if (matched) {
        rule.triggered++
        rule.lastTriggered = new Date().toISOString()
        
        results.push({
          ruleId: rule.id,
          ruleName: rule.name,
          action: rule.action
        })
        
        triggeredActions.push(rule.action)
        
        // If action is 'block', stop processing further rules
        if (rule.action.type === 'block') {
          return {
            allowed: false,
            reason: `Blocked by security rule: ${rule.name}`,
            triggeredRules: results,
            actions: triggeredActions
          }
        }
      }
    }
    
    return {
      allowed: true,
      triggeredRules: results,
      actions: triggeredActions
    }
  }
  
  // Evaluate individual rule condition
  evaluateRuleCondition(condition, visitorData) {
    const { field, operator, value, logic = 'AND' } = condition
    
    // Handle complex conditions with multiple clauses
    if (Array.isArray(condition)) {
      if (logic === 'OR') {
        return condition.some(cond => this.evaluateRuleCondition(cond, visitorData))
      } else {
        return condition.every(cond => this.evaluateRuleCondition(cond, visitorData))
      }
    }
    
    const fieldValue = this.getVisitorFieldValue(field, visitorData)
    
    switch (operator) {
      case 'equals':
        return fieldValue === value
      case 'not_equals':
        return fieldValue !== value
      case 'contains':
        return String(fieldValue).toLowerCase().includes(String(value).toLowerCase())
      case 'not_contains':
        return !String(fieldValue).toLowerCase().includes(String(value).toLowerCase())
      case 'starts_with':
        return String(fieldValue).toLowerCase().startsWith(String(value).toLowerCase())
      case 'ends_with':
        return String(fieldValue).toLowerCase().endsWith(String(value).toLowerCase())
      case 'matches_regex':
        try {
          const regex = new RegExp(value, 'i')
          return regex.test(String(fieldValue))
        } catch {
          return false
        }
      case 'greater_than':
        return parseFloat(fieldValue) > parseFloat(value)
      case 'less_than':
        return parseFloat(fieldValue) < parseFloat(value)
      case 'in_list':
        return Array.isArray(value) && value.includes(fieldValue)
      case 'not_in_list':
        return Array.isArray(value) && !value.includes(fieldValue)
      default:
        return false
    }
  }
  
  // Get visitor field value for rule evaluation
  getVisitorFieldValue(field, visitorData) {
    const { ip, country, userAgent, referrer, sessionId, timestamp, isBot } = visitorData
    
    switch (field) {
      case 'ip':
        return ip
      case 'country':
        return country
      case 'user_agent':
        return userAgent || ''
      case 'referrer':
        return referrer || ''
      case 'session_id':
        return sessionId
      case 'is_bot':
        return isBot
      case 'hour':
        return new Date(timestamp).getHours()
      case 'day_of_week':
        return new Date(timestamp).getDay()
      case 'request_count':
        // Count requests from this IP in last hour
        const hourAgo = timestamp - (3600 * 1000)
        return (this.data.analytics.recentVisitors || [])
          .filter(v => v.ip === ip && new Date(v.timestamp).getTime() > hourAgo).length
      case 'browser':
        return this.detectBrowser(userAgent)
      case 'device':
        return this.detectDevice(userAgent)
      case 'os':
        return this.detectOS(userAgent)
      default:
        return null
    }
  }
  
  // Detect browser from user agent
  detectBrowser(userAgent) {
    if (!userAgent) return 'unknown'
    
    const ua = userAgent.toLowerCase()
    if (ua.includes('chrome') && !ua.includes('edg')) return 'chrome'
    if (ua.includes('firefox')) return 'firefox'
    if (ua.includes('safari') && !ua.includes('chrome')) return 'safari'
    if (ua.includes('edg')) return 'edge'
    if (ua.includes('opera')) return 'opera'
    return 'unknown'
  }
  
  // Detect OS from user agent
  detectOS(userAgent) {
    if (!userAgent) return 'unknown'
    
    const ua = userAgent.toLowerCase()
    if (ua.includes('windows')) return 'windows'
    if (ua.includes('mac')) return 'macos'
    if (ua.includes('linux')) return 'linux'
    if (ua.includes('android')) return 'android'
    if (ua.includes('iphone') || ua.includes('ipad')) return 'ios'
    return 'unknown'
  }
  
  // Add honeypot trap
  addHoneypot(honeypotData) {
    const { url, triggers, actions, description } = honeypotData
    
    const honeypot = {
      id: Date.now().toString() + Math.random().toString(36).substring(7),
      url,
      triggers, // { condition, threshold }
      actions, // { type, parameters }
      description,
      hits: 0,
      lastHit: null,
      createdAt: new Date().toISOString(),
      enabled: true
    }
    
    this.data.securityRules.honeypots.push(honeypot)
    return honeypot
  }
  
  // Check if URL is honeypot
  checkHoneypot(url, visitorData) {
    const honeypot = this.data.securityRules.honeypots.find(h => h.enabled && h.url === url)
    
    if (honeypot) {
      honeypot.hits++
      honeypot.lastHit = new Date().toISOString()
      
      // Log honeypot hit
      this.logSecurityEvent({
        type: 'honeypot_hit',
        honeypotId: honeypot.id,
        url,
        visitorData,
        timestamp: new Date().toISOString()
      })
      
      return {
        isHoneypot: true,
        honeypot,
        actions: honeypot.actions
      }
    }
    
    return { isHoneypot: false }
  }
  
  // Analyze visitor behavior patterns
  analyzeBehavior(visitorData) {
    if (!this.data.securityRules.behaviorAnalysis.enabled) {
      return { suspicious: false, score: 0 }
    }
    
    const { ip, userAgent, timestamp, sessionId } = visitorData
    let suspiciousScore = 0
    const reasons = []
    
    // Get recent activity for this IP
    const recentActivity = (this.data.analytics.recentVisitors || [])
      .filter(v => v.ip === ip)
      .slice(0, 100)
    
    // Pattern 1: High request frequency
    const lastMinute = timestamp - (60 * 1000)
    const recentRequests = recentActivity.filter(v => new Date(v.timestamp).getTime() > lastMinute)
    
    if (recentRequests.length > 10) {
      suspiciousScore += 30
      reasons.push('High request frequency')
    }
    
    // Pattern 2: Suspicious user agent patterns
    if (userAgent) {
      const suspiciousPatterns = [
        /python/i, /curl/i, /wget/i, /scrapy/i, /selenium/i,
        /phantomjs/i, /headless/i, /automation/i
      ]
      
      if (suspiciousPatterns.some(pattern => pattern.test(userAgent))) {
        suspiciousScore += 40
        reasons.push('Suspicious user agent')
      }
      
      // Check for missing common browser indicators
      if (!userAgent.includes('Mozilla') || userAgent.length < 50) {
        suspiciousScore += 20
        reasons.push('Unusual user agent structure')
      }
    }
    
    // Pattern 3: Sequential access patterns (potential scraping)
    if (recentActivity.length > 5) {
      const intervals = []
      for (let i = 1; i < Math.min(recentActivity.length, 10); i++) {
        const diff = new Date(recentActivity[i-1].timestamp).getTime() - 
                    new Date(recentActivity[i].timestamp).getTime()
        intervals.push(diff)
      }
      
      // Check for very regular intervals (bot-like behavior)
      const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length
      const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length
      
      if (variance < avgInterval * 0.1 && avgInterval < 5000) { // Very regular, fast requests
        suspiciousScore += 35
        reasons.push('Regular sequential access pattern')
      }
    }
    
    // Pattern 4: Multiple session IDs from same IP
    const uniqueSessions = [...new Set(recentActivity.map(v => v.sessionId))].length
    if (uniqueSessions > 5) {
      suspiciousScore += 25
      reasons.push('Multiple sessions from same IP')
    }
    
    // Pattern 5: No referrer on multiple requests
    const noReferrerCount = recentActivity.filter(v => !v.referer || v.referer === '').length
    if (noReferrerCount > recentActivity.length * 0.8 && recentActivity.length > 3) {
      suspiciousScore += 15
      reasons.push('Consistently missing referrer')
    }
    
    return {
      suspicious: suspiciousScore >= 50,
      score: Math.min(suspiciousScore, 100),
      reasons,
      riskLevel: suspiciousScore >= 80 ? 'high' : suspiciousScore >= 50 ? 'medium' : 'low'
    }
  }
  
  // Log security event
  logSecurityEvent(eventData) {
    if (!this.data.securityRules.events) {
      this.data.securityRules.events = []
    }
    
    this.data.securityRules.events.unshift({
      id: Date.now().toString() + Math.random().toString(36).substring(7),
      ...eventData
    })
    
    // Keep only last 1000 events
    if (this.data.securityRules.events.length > 1000) {
      this.data.securityRules.events = this.data.securityRules.events.slice(0, 1000)
    }
  }
  
  // Get security analytics
  getSecurityAnalytics() {
    const rules = this.data.securityRules.customRules || []
    const honeypots = this.data.securityRules.honeypots || []
    const events = this.data.securityRules.events || []
    
    const now = Date.now()
    const last24Hours = now - (24 * 60 * 60 * 1000)
    const recentEvents = events.filter(e => new Date(e.timestamp).getTime() > last24Hours)
    
    return {
      enabled: this.data.securityRules.enabled,
      totalRules: rules.length,
      activeRules: rules.filter(r => r.enabled).length,
      totalHoneypots: honeypots.length,
      activeHoneypots: honeypots.filter(h => h.enabled).length,
      behaviorAnalysisEnabled: this.data.securityRules.behaviorAnalysis.enabled,
      
      // Statistics
      totalEvents: events.length,
      eventsLast24h: recentEvents.length,
      totalTriggered: rules.reduce((sum, r) => sum + (r.triggered || 0), 0),
      totalHoneypotHits: honeypots.reduce((sum, h) => sum + (h.hits || 0), 0),
      
      // Recent activity
      recentEvents: events.slice(0, 50),
      topTriggeredRules: rules
        .filter(r => r.triggered > 0)
        .sort((a, b) => (b.triggered || 0) - (a.triggered || 0))
        .slice(0, 10),
      
      // Event types breakdown
      eventTypes: this.groupEventsByType(recentEvents),
      
      // Risk levels
      riskLevels: this.calculateRiskLevels(recentEvents)
    }
  }
  
  // Group events by type
  groupEventsByType(events) {
    const types = {}
    events.forEach(event => {
      types[event.type] = (types[event.type] || 0) + 1
    })
    return types
  }
  
  // Calculate risk level distribution
  calculateRiskLevels(events) {
    const levels = { low: 0, medium: 0, high: 0 }
    
    events.forEach(event => {
      if (event.riskLevel) {
        levels[event.riskLevel] = (levels[event.riskLevel] || 0) + 1
      }
    })
    
    return levels
  }
  
  // =============================================================================
  // PHASE 6: HOOK SYSTEM & INTEGRATIONS METHODS
  // =============================================================================
  
  // Add webhook configuration
  addWebhook(webhookData) {
    const { name, url, events, headers = {}, enabled = true, secret = null } = webhookData
    
    if (!this.data.integrations) {
      this.data.integrations = {
        webhooks: [],
        customScripts: [],
        apiConnections: []
      }
    }
    
    const webhook = {
      id: Date.now().toString() + Math.random().toString(36).substring(7),
      name,
      url,
      events, // Array of event types to trigger on
      headers, // Custom headers to send
      secret, // Optional secret for webhook verification
      enabled,
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      lastCall: null,
      lastError: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    this.data.integrations.webhooks.push(webhook)
    return webhook
  }
  
  // Trigger webhooks for specific events
  async triggerWebhooks(eventType, eventData) {
    if (!this.data.integrations?.webhooks) return
    
    const relevantWebhooks = this.data.integrations.webhooks.filter(
      webhook => webhook.enabled && webhook.events.includes(eventType)
    )
    
    const results = []
    
    for (const webhook of relevantWebhooks) {
      try {
        // Prepare webhook payload
        const payload = {
          event: eventType,
          domain: this.domainName,
          timestamp: new Date().toISOString(),
          data: eventData
        }
        
        // Add webhook signature if secret is configured
        const headers = { ...webhook.headers, 'Content-Type': 'application/json' }
        if (webhook.secret) {
          // In production, use proper HMAC-SHA256 signature
          headers['X-Webhook-Signature'] = `sha256=${webhook.secret}`
        }
        
        // Make webhook call (in production environment)
        const response = await this.makeWebhookCall(webhook.url, payload, headers)
        
        // Update webhook statistics
        webhook.totalCalls++
        webhook.successfulCalls++
        webhook.lastCall = new Date().toISOString()
        webhook.lastError = null
        
        results.push({ webhook: webhook.id, success: true, response })
        
      } catch (error) {
        webhook.totalCalls++
        webhook.failedCalls++
        webhook.lastCall = new Date().toISOString()
        webhook.lastError = error.message
        
        results.push({ webhook: webhook.id, success: false, error: error.message })
      }
    }
    
    return results
  }
  
  // Make actual webhook HTTP call (simulated in development)
  async makeWebhookCall(url, payload, headers) {
    // In development, we simulate the call
    console.log(`[Webhook] Calling ${url}:`, payload)
    
    // In production, this would be:
    // const response = await fetch(url, {
    //   method: 'POST',
    //   headers,
    //   body: JSON.stringify(payload)
    // })
    // return await response.json()
    
    // Simulate successful response
    return { success: true, received: true }
  }
  
  // Add custom script
  addCustomScript(scriptData) {
    const { name, event, code, enabled = true, language = 'javascript' } = scriptData
    
    if (!this.data.integrations) {
      this.data.integrations = { webhooks: [], customScripts: [], apiConnections: [] }
    }
    
    const script = {
      id: Date.now().toString() + Math.random().toString(36).substring(7),
      name,
      event, // Event that triggers this script
      code, // The actual script code
      language, // javascript, python, etc.
      enabled,
      executions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      lastExecution: null,
      lastError: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    this.data.integrations.customScripts.push(script)
    return script
  }
  
  // Execute custom scripts for specific events
  async executeCustomScripts(eventType, eventData) {
    if (!this.data.integrations?.customScripts) return
    
    const relevantScripts = this.data.integrations.customScripts.filter(
      script => script.enabled && script.event === eventType
    )
    
    const results = []
    
    for (const script of relevantScripts) {
      try {
        script.executions++
        
        // Execute script (sandboxed execution in production)
        const result = await this.executeScript(script, eventData)
        
        script.successfulExecutions++
        script.lastExecution = new Date().toISOString()
        script.lastError = null
        
        results.push({ script: script.id, success: true, result })
        
      } catch (error) {
        script.failedExecutions++
        script.lastExecution = new Date().toISOString()
        script.lastError = error.message
        
        results.push({ script: script.id, success: false, error: error.message })
      }
    }
    
    return results
  }
  
  // Execute individual script (sandboxed)
  async executeScript(script, eventData) {
    console.log(`[CustomScript] Executing ${script.name}:`, eventData)
    
    // In production, this would use a proper sandboxed execution environment
    // For now, we simulate script execution
    
    try {
      // Create safe execution context
      const context = {
        event: eventData,
        domain: this.domainName,
        console: { log: (msg) => console.log(`[Script:${script.name}]`, msg) },
        fetch: this.securedFetch.bind(this), // Secured fetch for API calls
        utils: {
          formatDate: (date) => new Date(date).toISOString(),
          generateId: () => Date.now().toString() + Math.random().toString(36).substring(7)
        }
      }
      
      // In production: use vm or isolated-vm for safe execution
      // const result = vm.runInNewContext(script.code, context)
      
      // For development, simulate script result
      return { executed: true, context: Object.keys(context) }
      
    } catch (error) {
      throw new Error(`Script execution failed: ${error.message}`)
    }
  }
  
  // Add API connection
  addApiConnection(connectionData) {
    const { name, type, baseUrl, apiKey, headers = {}, enabled = true } = connectionData
    
    if (!this.data.integrations) {
      this.data.integrations = { webhooks: [], customScripts: [], apiConnections: [] }
    }
    
    const connection = {
      id: Date.now().toString() + Math.random().toString(36).substring(7),
      name,
      type, // 'crm', 'analytics', 'marketing', 'slack', 'discord', etc.
      baseUrl,
      apiKey, // Encrypted in production
      headers,
      enabled,
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      lastCall: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    this.data.integrations.apiConnections.push(connection)
    return connection
  }
  
  // Make API call through connection
  async callApi(connectionId, endpoint, method = 'GET', data = null) {
    const connection = this.data.integrations?.apiConnections?.find(c => c.id === connectionId)
    if (!connection || !connection.enabled) {
      throw new Error('API connection not found or disabled')
    }
    
    try {
      const url = `${connection.baseUrl}${endpoint}`
      const headers = {
        ...connection.headers,
        'Authorization': `Bearer ${connection.apiKey}`,
        'Content-Type': 'application/json'
      }
      
      connection.totalCalls++
      
      // Make API call (simulated in development)
      const response = await this.securedFetch(url, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined
      })
      
      connection.successfulCalls++
      connection.lastCall = new Date().toISOString()
      
      return response
      
    } catch (error) {
      connection.failedCalls++
      connection.lastCall = new Date().toISOString()
      throw error
    }
  }
  
  // Secured fetch wrapper for API calls
  async securedFetch(url, options = {}) {
    console.log(`[API Call] ${options.method || 'GET'} ${url}`)
    
    // In production, this would make actual API calls
    // const response = await fetch(url, options)
    // return await response.json()
    
    // For development, simulate API response
    return { success: true, data: 'Simulated API response' }
  }
  
  // Get integration analytics
  getIntegrationAnalytics() {
    const webhooks = this.data.integrations?.webhooks || []
    const scripts = this.data.integrations?.customScripts || []
    const apiConnections = this.data.integrations?.apiConnections || []
    
    return {
      webhooks: {
        total: webhooks.length,
        enabled: webhooks.filter(w => w.enabled).length,
        totalCalls: webhooks.reduce((sum, w) => sum + (w.totalCalls || 0), 0),
        successRate: this.calculateSuccessRate(webhooks, 'totalCalls', 'successfulCalls')
      },
      customScripts: {
        total: scripts.length,
        enabled: scripts.filter(s => s.enabled).length,
        totalExecutions: scripts.reduce((sum, s) => sum + (s.executions || 0), 0),
        successRate: this.calculateSuccessRate(scripts, 'executions', 'successfulExecutions')
      },
      apiConnections: {
        total: apiConnections.length,
        enabled: apiConnections.filter(c => c.enabled).length,
        totalCalls: apiConnections.reduce((sum, c) => sum + (c.totalCalls || 0), 0),
        successRate: this.calculateSuccessRate(apiConnections, 'totalCalls', 'successfulCalls')
      }
    }
  }
  
  // Calculate success rate
  calculateSuccessRate(items, totalField, successField) {
    const total = items.reduce((sum, item) => sum + (item[totalField] || 0), 0)
    const successful = items.reduce((sum, item) => sum + (item[successField] || 0), 0)
    return total > 0 ? Math.round((successful / total) * 100) : 0
  }
  
  // Event system - trigger all integrations for an event
  async triggerEvent(eventType, eventData) {
    const results = {
      webhooks: [],
      customScripts: [],
      timestamp: new Date().toISOString()
    }
    
    try {
      // Trigger webhooks
      results.webhooks = await this.triggerWebhooks(eventType, eventData)
      
      // Execute custom scripts
      results.customScripts = await this.executeCustomScripts(eventType, eventData)
      
      // Log the event execution
      console.log(`[Event System] Triggered ${eventType} for ${this.domainName}:`, results)
      
    } catch (error) {
      console.error(`[Event System] Error triggering ${eventType}:`, error)
    }
    
    return results
  }
}

// Available countries for geographic controls
const AVAILABLE_COUNTRIES = [
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'CN', name: 'China', flag: '🇨🇳' },
  { code: 'RU', name: 'Russia', flag: '🇷🇺' },
  { code: 'TR', name: 'Turkey', flag: '🇹🇷' },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦' }
]

// Available timezones
const AVAILABLE_TIMEZONES = [
  { value: 'UTC', name: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', name: 'Eastern Time (ET)' },
  { value: 'America/Los_Angeles', name: 'Pacific Time (PT)' },
  { value: 'America/Chicago', name: 'Central Time (CT)' },
  { value: 'Europe/London', name: 'Greenwich Mean Time (GMT)' },
  { value: 'Europe/Berlin', name: 'Central European Time (CET)' },
  { value: 'Europe/Istanbul', name: 'Turkey Time (TRT)' },
  { value: 'Asia/Tokyo', name: 'Japan Standard Time (JST)' },
  { value: 'Asia/Shanghai', name: 'China Standard Time (CST)' },
  { value: 'Asia/Dubai', name: 'Gulf Standard Time (GST)' },
  { value: 'Australia/Sydney', name: 'Australian Eastern Time (AET)' }
]

// Check domain access based on geographic and time controls
function checkDomainAccess(dataManager, visitorInfo) {
  const { ip, country, userAgent, timestamp } = visitorInfo
  const geoControls = dataManager.data.geoControls
  const timeControls = dataManager.data.timeControls
  
  const result = {
    allowed: true,
    reason: null,
    redirect: null,
    summary: {
      geoCheck: 'passed',
      timeCheck: 'passed',
      finalDecision: 'allow'
    }
  }
  
  // Check geographic controls
  if (geoControls.enabled) {
    // Check if country is blocked
    if (geoControls.blockedCountries.includes(country)) {
      result.allowed = false
      result.reason = `Country ${country} is blocked`
      result.summary.geoCheck = 'blocked'
      result.summary.finalDecision = 'block'
      return result
    }
    
    // Check if only allowed countries are specified and visitor is not in list
    if (geoControls.allowedCountries.length > 0 && !geoControls.allowedCountries.includes(country)) {
      if (geoControls.defaultAction === 'block') {
        result.allowed = false
        result.reason = `Country ${country} not in allowed list`
        result.summary.geoCheck = 'blocked'
        result.summary.finalDecision = 'block'
        return result
      }
    }
    
    // Check for geographic redirect
    if (geoControls.redirectRules[country]) {
      result.redirect = geoControls.redirectRules[country]
      result.summary.geoCheck = 'redirect'
      result.summary.finalDecision = 'redirect'
    }
  }
  
  // Check time-based controls
  if (timeControls.enabled) {
    const visitorTime = new Date(timestamp || Date.now())
    const timeResult = checkTimeAccess(timeControls, visitorTime)
    
    if (!timeResult.allowed) {
      result.allowed = false
      result.reason = timeResult.reason
      result.summary.timeCheck = 'blocked'
      result.summary.finalDecision = 'block'
      return result
    }
  }
  
  return result
}

// Check time-based access
function checkTimeAccess(timeControls, visitorTime) {
  // Convert to domain's timezone
  const domainTime = new Date(visitorTime.toLocaleString('en-US', { timeZone: timeControls.timezone }))
  const dayOfWeek = domainTime.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase()
  const hour = domainTime.getHours()
  const dateString = domainTime.toISOString().split('T')[0]
  
  // Check holiday blocks
  for (const holiday of timeControls.holidayBlocks) {
    if (holiday.date === dateString) {
      return {
        allowed: false,
        reason: `Access blocked on holiday: ${holiday.date}`
      }
    }
  }
  
  // Check custom time rules
  for (const rule of timeControls.rules) {
    const dayMatches = rule.days.includes(dayOfWeek) || rule.days.includes('all')
    const hourInRange = hour >= rule.hours[0] && hour <= rule.hours[1]
    
    if (dayMatches && hourInRange && rule.action === 'block') {
      return {
        allowed: false,
        reason: `Access blocked during ${rule.days.join(',')} ${rule.hours[0]}:00-${rule.hours[1]}:00`
      }
    }
  }
  
  // Check business hours if enabled
  if (timeControls.businessHours && timeControls.businessHours.enabled) {
    const bh = timeControls.businessHours
    const dayInBusinessDays = bh.days.includes(dayOfWeek)
    const hourInBusinessHours = hour >= bh.start && hour <= bh.end
    
    if (bh.blockOutsideHours && (!dayInBusinessDays || !hourInBusinessHours)) {
      return {
        allowed: false,
        reason: `Access only allowed during business hours: ${bh.days.join(',')} ${bh.start}:00-${bh.end}:00`
      }
    }
  }
  
  return { allowed: true, reason: null }
}

// Get or create domain data manager
function getDomainDataManager(domainName) {
  if (!domainDataStore.has(domainName)) {
    domainDataStore.set(domainName, new DomainDataManager(domainName))
  }
  return domainDataStore.get(domainName)
}

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

// Advanced NGINX Config Generator
function generateAdvancedNginxConfig(options) {
  const { domains, globalBackends, domainConfigs, globalSettings } = options
  
  let config = `# Advanced Multi-Domain NGINX Configuration
# Generated at: ${new Date().toISOString()}
# Traffic Management Platform - ${domains.length} Domains Configured
# 
# Features:
# - Per-domain backend configuration
# - Advanced bot detection with ML-style patterns
# - Geographic routing support
# - Real-time traffic analytics
# - Fallback and health check support

# Rate limiting zones
limit_req_zone $binary_remote_addr zone=general:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=bots:10m rate=1r/s;

# GeoIP configuration (if available)
# geoip_country /usr/share/GeoIP/GeoIP.dat;

# Lua shared dictionaries
lua_shared_dict bot_detection 10m;
lua_shared_dict domain_stats 10m;
lua_shared_dict rate_limiting 10m;

# Log format for analytics
log_format traffic_analytics '$remote_addr - $remote_user [$time_local] '
                           '"$request" $status $body_bytes_sent '
                           '"$http_referer" "$http_user_agent" '
                           '"$host" "$upstream_addr" "$request_time" '
                           '"$bot_detected" "$backend_used" "$geo_country"';

`

  // Generate upstream definitions for each domain
  domains.forEach(domain => {
    const domainConfig = domainConfigs[domain.id] || getDomainBackendConfig(domain.id)
    
    config += `
# Upstream definitions for ${domain.name}
upstream ${domain.name.replace(/[^a-zA-Z0-9]/g, '_')}_clean {
    server ${domainConfig.cleanBackend.replace(/^https?:\/\//, '')};
    # Health check and backup servers can be added here
}

upstream ${domain.name.replace(/[^a-zA-Z0-9]/g, '_')}_gray {
    server ${domainConfig.grayBackend.replace(/^https?:\/\//, '')};
}

upstream ${domain.name.replace(/[^a-zA-Z0-9]/g, '_')}_aggressive {
    server ${domainConfig.aggressiveBackend.replace(/^https?:\/\//, '')};
}
`
  })

  // Generate main server block with advanced Lua logic
  config += `
# Main server block with multi-domain routing
server {
    listen 80;
    listen [::]:80;
    
    # Enable real IP from Cloudflare
    set_real_ip_from 103.21.244.0/22;
    set_real_ip_from 103.22.200.0/22;
    set_real_ip_from 103.31.4.0/22;
    real_ip_header CF-Connecting-IP;
    
    # Variables for dynamic routing
    set $bot_detected "false";
    set $backend_used "unknown";
    set $geo_country "unknown";
    
    # Advanced traffic analysis and routing
    access_by_lua_block {
        local json = require "cjson"
        local http = require "resty.http"
        
        -- Get request data
        local user_agent = ngx.var.http_user_agent or ""
        local host = ngx.var.host or ""
        local remote_addr = ngx.var.remote_addr or ""
        local referer = ngx.var.http_referer or ""
        local request_uri = ngx.var.request_uri or ""
        
        -- Domain configuration mapping
        local domain_configs = {`

  // Generate domain configuration mapping
  domains.forEach(domain => {
    const domainConfig = domainConfigs[domain.id] || getDomainBackendConfig(domain.id)
    const cleanName = domain.name.replace(/[^a-zA-Z0-9]/g, '_')
    
    config += `
            ["${domain.name}"] = {
                clean_upstream = "${cleanName}_clean",
                gray_upstream = "${cleanName}_gray",
                aggressive_upstream = "${cleanName}_aggressive",
                routing_mode = "${domainConfig.routingMode}",
                bot_detection = ${domainConfig.botDetection},
                geo_routing = ${domainConfig.geoRouting}
            },`
  })

  config += `
        }
        
        -- Check if domain is managed
        local domain_config = domain_configs[host]
        if not domain_config then
            ngx.log(ngx.ERR, "Unmanaged domain: " .. host)
            return ngx.exit(404)
        end
        
        -- Enhanced bot detection patterns
        local bot_patterns = {
            -- Social media crawlers
            "facebookexternalhit", "facebot", "facebook", "twitterbot", "linkedinbot",
            "whatsapp", "telegram", "instagram", "snapchat",
            
            -- Search engine bots
            "googlebot", "bingbot", "slurp", "duckduckbot", "baiduspider", "yandexbot",
            
            -- Generic bots and crawlers
            "bot", "crawler", "spider", "scraper", "parser", "fetcher", "checker",
            "monitor", "uptime", "scanner", "validator", "analyzer",
            
            -- Headless browsers and automation
            "headless", "phantom", "selenium", "webdriver", "puppeteer", "playwright",
            
            -- Security and analysis tools
            "curl", "wget", "http", "python", "go%-http", "java", "ruby", "perl"
        }
        
        -- Advanced bot detection
        local is_bot = false
        local bot_score = 0
        
        -- Check user agent patterns
        local lower_ua = string.lower(user_agent)
        for _, pattern in ipairs(bot_patterns) do
            if string.find(lower_ua, pattern) then
                is_bot = true
                bot_score = bot_score + 10
                break
            end
        end
        
        -- Additional bot indicators
        if user_agent == "" or user_agent == "-" then
            bot_score = bot_score + 8  -- No user agent
        end
        
        if not string.find(lower_ua, "mozilla") and not is_bot then
            bot_score = bot_score + 5  -- Suspicious UA structure
        end
        
        -- Check for automation indicators
        if string.find(request_uri, "wp%-admin") or 
           string.find(request_uri, "%.php") or
           string.find(request_uri, "/admin") then
            bot_score = bot_score + 3  -- Automated scanning
        end
        
        -- Referrer analysis
        local facebook_referrer = false
        local social_referrer = false
        
        if referer ~= "" then
            local lower_ref = string.lower(referer)
            if string.find(lower_ref, "facebook") or string.find(lower_ref, "fb%.") then
                facebook_referrer = true
                social_referrer = true
            elseif string.find(lower_ref, "twitter") or string.find(lower_ref, "instagram") or 
                   string.find(lower_ref, "linkedin") or string.find(lower_ref, "tiktok") then
                social_referrer = true
            end
        end
        
        -- Geographic detection (mock implementation)
        local geo_country = "US"  -- Default, in production use real GeoIP
        -- ngx.var.geo_country = ngx.var.geoip_country_code or "US"
        
        -- Dynamic backend selection based on analysis
        local selected_upstream
        local routing_decision = "default"
        
        if domain_config.routing_mode == "smart" then
            if is_bot or bot_score >= 8 then
                -- Bots get clean content
                selected_upstream = domain_config.clean_upstream
                routing_decision = "bot_detected"
                ngx.var.bot_detected = "true"
            elseif facebook_referrer then
                -- Facebook traffic gets aggressive content
                selected_upstream = domain_config.aggressive_upstream
                routing_decision = "facebook_referrer"
            elseif social_referrer then
                -- Other social media gets gray content
                selected_upstream = domain_config.gray_upstream
                routing_decision = "social_referrer"
            else
                -- Direct traffic analysis
                if referer == "" then
                    -- Direct traffic - potentially suspicious
                    selected_upstream = domain_config.gray_upstream
                    routing_decision = "direct_traffic"
                else
                    -- Organic traffic gets aggressive content
                    selected_upstream = domain_config.aggressive_upstream
                    routing_decision = "organic_traffic"
                end
            end
        elseif domain_config.routing_mode == "aggressive" then
            -- Aggressive mode - mostly aggressive content
            if is_bot then
                selected_upstream = domain_config.clean_upstream
                routing_decision = "aggressive_mode_bot"
            else
                selected_upstream = domain_config.aggressive_upstream
                routing_decision = "aggressive_mode_human"
            end
        elseif domain_config.routing_mode == "defensive" then
            -- Defensive mode - mostly clean content
            if facebook_referrer and not is_bot then
                selected_upstream = domain_config.gray_upstream
                routing_decision = "defensive_mode_facebook"
            else
                selected_upstream = domain_config.clean_upstream
                routing_decision = "defensive_mode_default"
            end
        else
            -- Default fallback
            selected_upstream = domain_config.clean_upstream
            routing_decision = "fallback"
        end
        
        -- Set variables for logging and upstream selection
        ngx.var.backend_used = selected_upstream
        ngx.var.upstream_backend = selected_upstream
        
        -- Log traffic for analytics (async)
        local analytics_data = {
            domain = host,
            user_agent = user_agent,
            referer = referer,
            remote_addr = remote_addr,
            is_bot = is_bot,
            bot_score = bot_score,
            backend_used = selected_upstream,
            routing_decision = routing_decision,
            facebook_referrer = facebook_referrer,
            timestamp = ngx.time()
        }
        
        -- Store analytics (in production, send to analytics API)
        ngx.shared.domain_stats:set(host .. "_" .. ngx.time(), json.encode(analytics_data), 3600)
        
        -- Rate limiting based on bot detection
        if is_bot then
            ngx.var.rate_limit_zone = "bots"
        else
            ngx.var.rate_limit_zone = "general" 
        end
    }
    
    # Apply rate limiting
    limit_req zone=general burst=20 nodelay;
    
    # Set upstream backend variable
    set $upstream_backend "default_clean";
    
    # Proxy configuration
    location / {
        # Health check for upstream
        proxy_next_upstream error timeout invalid_header http_500 http_502 http_503 http_504;
        
        # Proxy headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Bot-Detected $bot_detected;
        proxy_set_header X-Backend-Used $backend_used;
        
        # Timeout settings
        proxy_connect_timeout 5s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
        
        # Pass to selected backend
        proxy_pass http://$upstream_backend;
        
        # Enable buffering for better performance
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
        
        # Access logging with analytics
        access_log /var/log/nginx/traffic_analytics.log traffic_analytics;
    }
    
    # Health check endpoint
    location /nginx-health {
        access_log off;
        return 200 "OK";
        add_header Content-Type text/plain;
    }
    
    # Analytics endpoint for real-time stats
    location /nginx-stats {
        access_log off;
        allow 127.0.0.1;
        deny all;
        
        content_by_lua_block {
            local json = require "cjson"
            local stats = {}
            
            -- Get stored analytics data
            local keys = ngx.shared.domain_stats:get_keys(100)
            for _, key in ipairs(keys) do
                local data = ngx.shared.domain_stats:get(key)
                if data then
                    table.insert(stats, json.decode(data))
                end
            end
            
            ngx.header.content_type = "application/json"
            ngx.say(json.encode({
                success = true,
                stats = stats,
                total_entries = #stats,
                generated_at = ngx.time()
            }))
        }
    }
}

# Error pages
error_page 404 /404.html;
error_page 500 502 503 504 /50x.html;

location = /404.html {
    root /usr/share/nginx/html;
    internal;
}

location = /50x.html {
    root /usr/share/nginx/html;
    internal;
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

// Domain Backend Configuration Storage
const domainBackendConfigs = new Map()

// Initialize or get domain backend configuration
const getDomainBackendConfig = (domainId) => {
  if (!domainBackendConfigs.has(domainId)) {
    domainBackendConfigs.set(domainId, {
      cleanBackend: 'clean-server.example.com:80',
      grayBackend: 'gray-server.example.com:80', 
      aggressiveBackend: 'aggressive-server.example.com:80',
      routingMode: 'smart', // 'smart', 'aggressive', 'defensive'
      botDetection: true,
      geoRouting: false,
      customRules: []
    })
  }
  return domainBackendConfigs.get(domainId)
}

// NGINX Configuration APIs
app.post('/api/nginx/generate-config', requireAuth, async (c) => {
  try {
    const requestBody = await c.req.json()
    const { 
      globalBackends = {},
      domainSpecificConfigs = {},
      globalSettings = {}
    } = requestBody
    
    const domainList = Array.from(domains.values())
    
    // Generate comprehensive NGINX config
    const config = generateAdvancedNginxConfig({
      domains: domainList,
      globalBackends,
      domainConfigs: domainSpecificConfigs,
      globalSettings
    })
    
    return c.json({ 
      success: true, 
      config,
      domainCount: domainList.length,
      generatedAt: new Date().toISOString()
    })
  } catch (error) {
    return c.json({
      success: false,
      message: 'Config generation failed: ' + error.message
    }, 500)
  }
})

// Get domain-specific backend configuration
app.get('/api/nginx/domain-config/:domainId', requireAuth, (c) => {
  try {
    const domainId = c.req.param('domainId')
    const domain = domains.get(domainId)
    
    if (!domain) {
      return c.json({
        success: false,
        message: 'Domain bulunamadı'
      }, 404)
    }
    
    const config = getDomainBackendConfig(domainId)
    
    return c.json({
      success: true,
      domain: domain,
      config: config
    })
  } catch (error) {
    return c.json({
      success: false,
      message: 'Config alınamadı: ' + error.message
    }, 500)
  }
})

// Update domain-specific backend configuration
app.post('/api/nginx/domain-config/:domainId', requireAuth, async (c) => {
  try {
    const domainId = c.req.param('domainId')
    const domain = domains.get(domainId)
    
    if (!domain) {
      return c.json({
        success: false,
        message: 'Domain bulunamadı'
      }, 404)
    }
    
    const updateData = await c.req.json()
    const currentConfig = getDomainBackendConfig(domainId)
    
    // Update configuration
    const newConfig = {
      ...currentConfig,
      ...updateData,
      updatedAt: new Date().toISOString()
    }
    
    domainBackendConfigs.set(domainId, newConfig)
    
    return c.json({
      success: true,
      message: 'Domain backend config güncellendi',
      config: newConfig
    })
  } catch (error) {
    return c.json({
      success: false,
      message: 'Config güncellenemedi: ' + error.message
    }, 500)
  }
})

// Get all domain configurations for NGINX
app.get('/api/nginx/all-domain-configs', requireAuth, (c) => {
  try {
    const domainList = Array.from(domains.values())
    const configs = {}
    
    domainList.forEach(domain => {
      configs[domain.id] = {
        domain: domain,
        config: getDomainBackendConfig(domain.id)
      }
    })
    
    return c.json({
      success: true,
      domains: configs,
      totalDomains: domainList.length
    })
  } catch (error) {
    return c.json({
      success: false,
      message: 'Configs alınamadı: ' + error.message
    }, 500)
  }
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

// Download NGINX configuration file
app.get('/api/nginx/download-config', requireAuth, async (c) => {
  try {
    const domainList = Array.from(domains.values())
    const domainConfigs = {}
    
    domainList.forEach(domain => {
      domainConfigs[domain.id] = getDomainBackendConfig(domain.id)
    })
    
    // Generate comprehensive NGINX config
    const config = generateAdvancedNginxConfig({
      domains: domainList,
      globalBackends: {},
      domainConfigs: domainConfigs,
      globalSettings: {}
    })
    
    // Set headers for file download
    c.header('Content-Type', 'text/plain')
    c.header('Content-Disposition', `attachment; filename="nginx-traffic-management-${Date.now()}.conf"`)
    c.header('Cache-Control', 'no-cache')
    
    return c.text(config)
  } catch (error) {
    return c.json({
      success: false,
      message: 'Config download failed: ' + error.message
    }, 500)
  }
})

// ====================================================================
// PHASE 1: IP MANAGEMENT & VISITOR ANALYTICS API ENDPOINTS
// ====================================================================

// Get domain IP rules
app.get('/api/domains/:id/ip-rules', requireAuth, (c) => {
  const id = c.req.param('id')
  const domain = domains.get(id)
  
  if (!domain) {
    return c.json({ success: false, message: 'Domain bulunamadı' }, 404)
  }
  
  const dataManager = getDomainDataManager(domain.name)
  const ipRules = dataManager.data.ipRules
  
  return c.json({
    success: true,
    domain: domain.name,
    ipRules,
    summary: {
      whitelistCount: ipRules.whitelist.length,
      blacklistCount: ipRules.blacklist.length,
      graylistCount: ipRules.graylist.length,
      rangeRulesCount: Object.values(ipRules.ranges).flat().length
    }
  })
})

// Add IP rule
app.post('/api/domains/:id/ip-rules', requireAuth, async (c) => {
  const id = c.req.param('id')
  const { ip, listType, reason } = await c.req.json()
  
  const domain = domains.get(id)
  if (!domain) {
    return c.json({ success: false, message: 'Domain bulunamadı' }, 404)
  }
  
  if (!ip || !listType) {
    return c.json({ success: false, message: 'IP adresi ve liste tipi gerekli' }, 400)
  }
  
  // Validate IP address
  const ipRegex = /^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}$/
  if (!ipRegex.test(ip)) {
    return c.json({ success: false, message: 'Geçersiz IP adresi formatı' }, 400)
  }
  
  const dataManager = getDomainDataManager(domain.name)
  const success = dataManager.addIPRule(listType, ip, reason)
  
  if (success) {
    return c.json({ 
      success: true, 
      message: `IP ${ip} ${listType} listesine eklendi`,
      ipRules: dataManager.data.ipRules
    })
  } else {
    return c.json({ success: false, message: 'IP kuralı eklenirken hata oluştu' }, 500)
  }
})

// Remove IP rule
app.delete('/api/domains/:id/ip-rules/:ip', requireAuth, (c) => {
  const id = c.req.param('id')
  const ip = c.req.param('ip')
  
  const domain = domains.get(id)
  if (!domain) {
    return c.json({ success: false, message: 'Domain bulunamadı' }, 404)
  }
  
  const dataManager = getDomainDataManager(domain.name)
  const success = dataManager.removeIPRule(ip)
  
  if (success) {
    return c.json({ 
      success: true, 
      message: `IP ${ip} tüm listelerden kaldırıldı`,
      ipRules: dataManager.data.ipRules
    })
  } else {
    return c.json({ success: false, message: 'IP kuralı kaldırılırken hata oluştu' }, 500)
  }
})

// Check IP status
app.get('/api/domains/:id/ip-check/:ip', requireAuth, (c) => {
  const id = c.req.param('id')
  const ip = c.req.param('ip')
  
  const domain = domains.get(id)
  if (!domain) {
    return c.json({ success: false, message: 'Domain bulunamadı' }, 404)
  }
  
  const dataManager = getDomainDataManager(domain.name)
  const result = dataManager.checkIPStatus(ip)
  
  return c.json({ success: true, ip, ...result })
})

// Bulk IP operations
app.post('/api/domains/:id/ip-bulk', requireAuth, async (c) => {
  const id = c.req.param('id')
  const { action, ips, listType, reason } = await c.req.json()
  
  const domain = domains.get(id)
  if (!domain) {
    return c.json({ success: false, message: 'Domain bulunamadı' }, 404)
  }
  
  if (!ips || !Array.isArray(ips)) {
    return c.json({ success: false, message: 'IP listesi gerekli' }, 400)
  }
  
  const dataManager = getDomainDataManager(domain.name)
  const results = []
  
  for (const ip of ips) {
    try {
      if (action === 'add') {
        const success = dataManager.addIPRule(listType, ip, reason)
        results.push({ ip, success, action: 'added' })
      } else if (action === 'remove') {
        const success = dataManager.removeIPRule(ip)
        results.push({ ip, success, action: 'removed' })
      }
    } catch (error) {
      results.push({ ip, success: false, error: error.message })
    }
  }
  
  return c.json({ 
    success: true, 
    message: `Toplu ${action} işlemi tamamlandı`,
    results,
    ipRules: dataManager.data.ipRules
  })
})

// Get visitor analytics
app.get('/api/domains/:id/analytics', requireAuth, (c) => {
  const id = c.req.param('id')
  const domain = domains.get(id)
  
  if (!domain) {
    return c.json({ success: false, message: 'Domain bulunamadı' }, 404)
  }
  
  const dataManager = getDomainDataManager(domain.name)
  const analytics = dataManager.getAnalyticsSummary()
  
  return c.json({ 
    success: true,
    domain: domain.name,
    analytics
  })
})

// Get detailed analytics with filters
app.get('/api/domains/:id/analytics/detailed', requireAuth, (c) => {
  const id = c.req.param('id')
  const timeRange = c.req.query('timeRange') || '24h' // 1h, 24h, 7d, 30d
  const country = c.req.query('country')
  const referrer = c.req.query('referrer')
  
  const domain = domains.get(id)
  if (!domain) {
    return c.json({ success: false, message: 'Domain bulunamadı' }, 404)
  }
  
  const dataManager = getDomainDataManager(domain.name)
  const analytics = dataManager.data.analytics
  
  // Filter recent visitors based on query parameters
  let filteredVisitors = analytics.recentVisitors
  
  // Time range filter
  const now = new Date()
  const timeRanges = {
    '1h': 1 * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000
  }
  
  if (timeRanges[timeRange]) {
    const cutoff = new Date(now.getTime() - timeRanges[timeRange])
    filteredVisitors = filteredVisitors.filter(v => new Date(v.timestamp) > cutoff)
  }
  
  // Country filter
  if (country) {
    filteredVisitors = filteredVisitors.filter(v => v.country === country)
  }
  
  // Referrer filter  
  if (referrer) {
    filteredVisitors = filteredVisitors.filter(v => 
      v.referer && v.referer.toLowerCase().includes(referrer.toLowerCase())
    )
  }
  
  return c.json({
    success: true,
    domain: domain.name,
    timeRange,
    filters: { country, referrer },
    analytics: {
      filteredVisitors,
      summary: {
        totalFiltered: filteredVisitors.length,
        humanCount: filteredVisitors.filter(v => !v.isBot).length,
        botCount: filteredVisitors.filter(v => v.isBot).length,
        actionBreakdown: {
          clean: filteredVisitors.filter(v => v.action === 'clean').length,
          gray: filteredVisitors.filter(v => v.action === 'gray').length,
          aggressive: filteredVisitors.filter(v => v.action === 'aggressive').length,
          blocked: filteredVisitors.filter(v => v.action === 'blocked').length
        }
      },
      hourlyBreakdown: analytics.hourlyStats
    }
  })
})

// Real-time visitor feed (for live dashboard updates)
app.get('/api/domains/:id/visitors/live', requireAuth, (c) => {
  const id = c.req.param('id')
  const since = c.req.query('since') // ISO timestamp
  const limit = parseInt(c.req.query('limit') || '20')
  
  const domain = domains.get(id)
  if (!domain) {
    return c.json({ success: false, message: 'Domain bulunamadı' }, 404)
  }
  
  const dataManager = getDomainDataManager(domain.name)
  let recentVisitors = dataManager.data.analytics.recentVisitors
  
  // Filter by timestamp if provided
  if (since) {
    const sinceDate = new Date(since)
    recentVisitors = recentVisitors.filter(v => new Date(v.timestamp) > sinceDate)
  }
  
  // Limit results
  recentVisitors = recentVisitors.slice(0, limit)
  
  return c.json({
    success: true,
    domain: domain.name,
    visitors: recentVisitors,
    timestamp: new Date().toISOString()
  })
})

// Enhanced traffic logging API with comprehensive analytics
app.post('/api/traffic/log', async (c) => {
  const { 
    domain, 
    userType, // 'bot' | 'human'
    backendUsed, // 'clean' | 'gray' | 'aggressive' | 'blocked'
    userAgent,
    referrer,
    ip,
    country = 'Unknown',
    blocked = false,
    // New analytics fields
    sessionId,
    timestamp
  } = await c.req.json()
  
  const domainObj = Array.from(domains.values()).find(d => d.name === domain)
  if (!domainObj) {
    return c.json({ success: false, message: 'Domain not found' }, 404)
  }
  
  // Get domain data manager
  const dataManager = getDomainDataManager(domain)
  
  // Check IP status for enhanced security
  const ipStatus = dataManager.checkIPStatus(ip)
  
  // Determine final action based on IP status and backend decision
  let finalAction = backendUsed
  if (ipStatus.status === 'blacklisted') {
    finalAction = 'blocked'
  } else if (ipStatus.status === 'whitelisted') {
    // Whitelisted IPs get clean content unless explicitly overridden
    if (backendUsed !== 'blocked') {
      finalAction = 'clean'
    }
  }
  
  // Log comprehensive visitor data
  dataManager.logVisitor({
    ip,
    userAgent,
    referer: referrer,
    isBot: userType === 'bot',
    country,
    action: finalAction,
    sessionId,
    timestamp: timestamp || new Date().toISOString()
  })
  
  // Update legacy domain statistics for backward compatibility
  domainObj.totalRequests = dataManager.data.analytics.totalRequests
  domainObj.traffic = dataManager.data.analytics.totalRequests
  domainObj.humanRequests = dataManager.data.analytics.humanRequests
  domainObj.botRequests = dataManager.data.analytics.botRequests
  domainObj.blocked = dataManager.data.analytics.blocked
  domainObj.cleanServed = dataManager.data.analytics.cleanServed
  domainObj.grayServed = dataManager.data.analytics.grayServed
  domainObj.aggressiveServed = dataManager.data.analytics.aggressiveServed
  domainObj.lastTrafficUpdate = new Date().toISOString()
  
  domains.set(domainObj.id, domainObj)
  
  return c.json({ 
    success: true, 
    action: finalAction,
    ipStatus: ipStatus.status,
    analytics: dataManager.getAnalyticsSummary().overview
  })
})

// ====================================================================
// PHASE 2: GEOGRAPHIC & TIME-BASED ACCESS CONTROLS API ENDPOINTS
// ====================================================================

// Get domain geographic controls
app.get('/api/domains/:id/geo-controls', requireAuth, (c) => {
  const id = c.req.param('id')
  const domain = domains.get(id)
  
  if (!domain) {
    return c.json({ success: false, message: 'Domain bulunamadı' }, 404)
  }
  
  const dataManager = getDomainDataManager(domain.name)
  const geoControls = dataManager.data.geoControls
  
  return c.json({
    success: true,
    domain: domain.name,
    geoControls,
    availableCountries: AVAILABLE_COUNTRIES
  })
})

// Update domain geographic controls
app.post('/api/domains/:id/geo-controls', requireAuth, async (c) => {
  const id = c.req.param('id')
  const updates = await c.req.json()
  
  const domain = domains.get(id)
  if (!domain) {
    return c.json({ success: false, message: 'Domain bulunamadı' }, 404)
  }
  
  const dataManager = getDomainDataManager(domain.name)
  
  try {
    // Handle complex operations for country lists
    if (updates.allowedCountries) {
      if (updates.allowedCountries.action === 'add') {
        if (!dataManager.data.geoControls.allowedCountries.includes(updates.allowedCountries.country)) {
          dataManager.data.geoControls.allowedCountries.push(updates.allowedCountries.country)
        }
      } else if (updates.allowedCountries.action === 'remove') {
        const index = dataManager.data.geoControls.allowedCountries.indexOf(updates.allowedCountries.country)
        if (index > -1) {
          dataManager.data.geoControls.allowedCountries.splice(index, 1)
        }
      }
      delete updates.allowedCountries
    }
    
    if (updates.blockedCountries) {
      if (updates.blockedCountries.action === 'add') {
        if (!dataManager.data.geoControls.blockedCountries.includes(updates.blockedCountries.country)) {
          dataManager.data.geoControls.blockedCountries.push(updates.blockedCountries.country)
        }
      } else if (updates.blockedCountries.action === 'remove') {
        const index = dataManager.data.geoControls.blockedCountries.indexOf(updates.blockedCountries.country)
        if (index > -1) {
          dataManager.data.geoControls.blockedCountries.splice(index, 1)
        }
      }
      delete updates.blockedCountries
    }
    
    if (updates.redirectRules) {
      if (updates.redirectRules.action === 'add') {
        dataManager.data.geoControls.redirectRules[updates.redirectRules.country] = updates.redirectRules.url
      } else if (updates.redirectRules.action === 'remove') {
        delete dataManager.data.geoControls.redirectRules[updates.redirectRules.country]
      }
      delete updates.redirectRules
    }
    
    // Update remaining simple properties
    Object.assign(dataManager.data.geoControls, updates)
    await dataManager.save()
    
    return c.json({
      success: true,
      message: 'Coğrafi kontroller güncellendi',
      geoControls: dataManager.data.geoControls
    })
  } catch (error) {
    console.error('Geo controls update error:', error)
    return c.json({ 
      success: false, 
      message: 'Coğrafi kontroller güncellenirken hata oluştu: ' + error.message 
    }, 500)
  }
})

// Get domain time controls
app.get('/api/domains/:id/time-controls', requireAuth, (c) => {
  const id = c.req.param('id')
  const domain = domains.get(id)
  
  if (!domain) {
    return c.json({ success: false, message: 'Domain bulunamadı' }, 404)
  }
  
  const dataManager = getDomainDataManager(domain.name)
  const timeControls = dataManager.data.timeControls
  
  return c.json({
    success: true,
    domain: domain.name,
    timeControls,
    availableTimezones: AVAILABLE_TIMEZONES
  })
})

// Update domain time controls
app.post('/api/domains/:id/time-controls', requireAuth, async (c) => {
  const id = c.req.param('id')
  const updates = await c.req.json()
  
  const domain = domains.get(id)
  if (!domain) {
    return c.json({ success: false, message: 'Domain bulunamadı' }, 404)
  }
  
  const dataManager = getDomainDataManager(domain.name)
  
  try {
    // Handle complex operations for rules and holiday blocks
    if (updates.rules) {
      if (updates.rules.action === 'add') {
        if (!dataManager.data.timeControls.rules) {
          dataManager.data.timeControls.rules = []
        }
        dataManager.data.timeControls.rules.push(updates.rules.rule)
      } else if (updates.rules.action === 'remove') {
        if (dataManager.data.timeControls.rules && updates.rules.index >= 0) {
          dataManager.data.timeControls.rules.splice(updates.rules.index, 1)
        }
      }
      // Remove the rules operation from updates to avoid double processing
      delete updates.rules
    }
    
    if (updates.holidayBlocks) {
      if (updates.holidayBlocks.action === 'add') {
        if (!dataManager.data.timeControls.holidayBlocks) {
          dataManager.data.timeControls.holidayBlocks = []
        }
        dataManager.data.timeControls.holidayBlocks.push(updates.holidayBlocks.holiday)
      } else if (updates.holidayBlocks.action === 'remove') {
        if (dataManager.data.timeControls.holidayBlocks && updates.holidayBlocks.index >= 0) {
          dataManager.data.timeControls.holidayBlocks.splice(updates.holidayBlocks.index, 1)
        }
      }
      // Remove the holidayBlocks operation from updates to avoid double processing
      delete updates.holidayBlocks
    }
    
    // Update remaining simple properties
    Object.assign(dataManager.data.timeControls, updates)
    await dataManager.save()
    
    return c.json({
      success: true,
      message: 'Zaman kontrolleri güncellendi',
      timeControls: dataManager.data.timeControls
    })
  } catch (error) {
    console.error('Time controls update error:', error)
    return c.json({ 
      success: false, 
      message: 'Zaman kontrolleri güncellenirken hata oluştu: ' + error.message 
    }, 500)
  }
})

// Check geographic and time access for visitor
app.post('/api/domains/:id/check-access', requireAuth, async (c) => {
  const id = c.req.param('id')
  const { ip, country, userAgent, timestamp } = await c.req.json()
  
  const domain = domains.get(id)
  if (!domain) {
    return c.json({ success: false, message: 'Domain bulunamadı' }, 404)
  }
  
  const dataManager = getDomainDataManager(domain.name)
  const accessResult = checkDomainAccess(dataManager, { ip, country, userAgent, timestamp })
  
  return c.json({
    success: true,
    domain: domain.name,
    accessResult
  })
})

// Enhanced traffic logging with geographic, time, and campaign tracking + rate limiting
app.post('/api/traffic/log-enhanced', async (c) => {
  const { 
    domain, 
    userType,
    backendUsed,
    userAgent,
    referrer,
    ip,
    country = 'Unknown',
    timestamp,
    sessionId,
    // Phase 3: Campaign tracking parameters
    utmSource,
    utmMedium,
    utmCampaign,
    utmContent,
    utmTerm,
    customParams = {}
  } = await c.req.json()
  
  const domainObj = Array.from(domains.values()).find(d => d.name === domain)
  if (!domainObj) {
    return c.json({ success: false, message: 'Domain not found' }, 404)
  }
  
  const dataManager = getDomainDataManager(domain)
  
  // Phase 3: Rate limiting check
  const rateLimitResult = dataManager.checkRateLimit(ip, userAgent)
  if (!rateLimitResult.allowed) {
    return c.json({ 
      success: true, 
      action: 'rate_limited',
      reason: rateLimitResult.reason,
      retryAfter: rateLimitResult.retryAfter 
    })
  }
  
  // Phase 5: Security rules evaluation
  const visitorData = { ip, country, userAgent, referrer, sessionId, timestamp: timestamp || Date.now() }
  const securityResult = dataManager.evaluateSecurityRules(visitorData)
  
  if (!securityResult.allowed) {
    dataManager.logSecurityEvent({
      type: 'security_rule_triggered',
      visitorData,
      triggeredRules: securityResult.triggeredRules,
      timestamp: new Date().toISOString()
    })
    
    return c.json({ 
      success: true, 
      action: 'blocked',
      reason: securityResult.reason,
      triggeredRules: securityResult.triggeredRules 
    })
  }
  
  // Phase 5: Behavior analysis
  const behaviorAnalysis = dataManager.analyzeBehavior(visitorData)
  if (behaviorAnalysis.suspicious && behaviorAnalysis.score >= 80) {
    dataManager.logSecurityEvent({
      type: 'suspicious_behavior',
      visitorData,
      behaviorScore: behaviorAnalysis.score,
      reasons: behaviorAnalysis.reasons,
      timestamp: new Date().toISOString()
    })
    
    // High risk behavior - block or flag
    if (behaviorAnalysis.riskLevel === 'high') {
      return c.json({ 
        success: true, 
        action: 'blocked',
        reason: 'Suspicious behavior detected',
        behaviorAnalysis 
      })
    }
  }
  
  // Check all access controls
  const ipStatus = dataManager.checkIPStatus(ip)
  const accessCheck = checkDomainAccess(dataManager, { ip, country, userAgent, timestamp })
  
  // Determine final action based on all checks
  let finalAction = backendUsed
  let blockReason = null
  
  if (ipStatus.status === 'blacklisted') {
    finalAction = 'blocked'
    blockReason = 'IP blacklisted'
  } else if (!accessCheck.allowed) {
    finalAction = 'blocked'
    blockReason = accessCheck.reason
  } else if (ipStatus.status === 'whitelisted') {
    finalAction = 'clean'
  }
  
  // Apply geographic redirect if configured
  if (accessCheck.redirect) {
    finalAction = 'redirect'
  }
  
  // Phase 3: Campaign tracking (if enabled and valid UTM parameters)
  if (dataManager.data.campaigns.enabled && (utmSource || utmMedium || utmCampaign)) {
    dataManager.trackCampaignClick({
      utmSource,
      utmMedium,
      utmCampaign,
      utmContent,
      utmTerm,
      referrer,
      ip,
      country,
      timestamp: timestamp || Date.now(),
      customParams
    })
  }
  
  // Log comprehensive visitor data
  dataManager.logVisitor({
    ip,
    userAgent,
    referer: referrer,
    isBot: userType === 'bot',
    country,
    action: finalAction,
    sessionId,
    timestamp: timestamp || new Date().toISOString(),
    blockReason,
    accessCheck: accessCheck.summary
  })
  
  // Update legacy domain statistics
  domainObj.totalRequests = dataManager.data.analytics.totalRequests
  domainObj.traffic = dataManager.data.analytics.totalRequests
  domainObj.humanRequests = dataManager.data.analytics.humanRequests
  domainObj.botRequests = dataManager.data.analytics.botRequests
  domainObj.blocked = dataManager.data.analytics.blocked
  domainObj.lastTrafficUpdate = new Date().toISOString()
  
  domains.set(domainObj.id, domainObj)
  
  return c.json({ 
    success: true, 
    action: finalAction,
    ipStatus: ipStatus.status,
    accessCheck: accessCheck.summary,
    redirect: accessCheck.redirect || null,
    blockReason,
    analytics: dataManager.getAnalyticsSummary().overview
  })
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
// PHASE 3: CAMPAIGN TRACKING & RATE LIMITING API Routes
// =============================================================================

// Get domain campaign analytics
app.get('/api/domains/:id/campaigns', requireAuth, (c) => {
  const id = c.req.param('id')
  const domain = domains.get(id)
  
  if (!domain) {
    return c.json({ success: false, message: 'Domain bulunamadı' }, 404)
  }
  
  const dataManager = getDomainDataManager(domain.name)
  const campaignAnalytics = dataManager.getCampaignAnalytics()
  
  return c.json({
    success: true,
    domain: domain.name,
    ...campaignAnalytics
  })
})

// Update domain campaign settings
app.post('/api/domains/:id/campaigns', requireAuth, async (c) => {
  const id = c.req.param('id')
  const updates = await c.req.json()
  
  const domain = domains.get(id)
  if (!domain) {
    return c.json({ success: false, message: 'Domain bulunamadı' }, 404)
  }
  
  const dataManager = getDomainDataManager(domain.name)
  
  try {
    // Update campaign settings
    if (updates.enabled !== undefined) {
      dataManager.data.campaigns.enabled = updates.enabled
    }
    if (updates.utmTracking !== undefined) {
      dataManager.data.campaigns.utmTracking = updates.utmTracking
    }
    if (updates.validUtmSources) {
      dataManager.data.campaigns.validUtmSources = updates.validUtmSources
    }
    if (updates.customParameters) {
      dataManager.data.campaigns.customParameters = updates.customParameters
    }
    
    await dataManager.save()
    
    return c.json({
      success: true,
      message: 'Campaign settings updated',
      campaigns: dataManager.data.campaigns
    })
  } catch (error) {
    console.error('Campaign update error:', error)
    return c.json({ 
      success: false, 
      message: 'Campaign settings güncellenirken hata oluştu: ' + error.message 
    }, 500)
  }
})

// Get domain rate limiting status
app.get('/api/domains/:id/rate-limiting', requireAuth, (c) => {
  const id = c.req.param('id')
  const domain = domains.get(id)
  
  if (!domain) {
    return c.json({ success: false, message: 'Domain bulunamadı' }, 404)
  }
  
  const dataManager = getDomainDataManager(domain.name)
  const rateLimitingStatus = dataManager.getRateLimitingStatus()
  
  return c.json({
    success: true,
    domain: domain.name,
    ...rateLimitingStatus
  })
})

// Update domain rate limiting settings
app.post('/api/domains/:id/rate-limiting', requireAuth, async (c) => {
  const id = c.req.param('id')
  const updates = await c.req.json()
  
  const domain = domains.get(id)
  if (!domain) {
    return c.json({ success: false, message: 'Domain bulunamadı' }, 404)
  }
  
  const dataManager = getDomainDataManager(domain.name)
  
  try {
    // Update rate limiting settings
    if (updates.enabled !== undefined) {
      dataManager.data.rateLimiting.enabled = updates.enabled
    }
    if (updates.rules) {
      if (updates.rules.perIP) {
        Object.assign(dataManager.data.rateLimiting.rules.perIP, updates.rules.perIP)
      }
      if (updates.rules.perSession) {
        Object.assign(dataManager.data.rateLimiting.rules.perSession, updates.rules.perSession)
      }
      if (updates.rules.burst) {
        Object.assign(dataManager.data.rateLimiting.rules.burst, updates.rules.burst)
      }
    }
    if (updates.botLimiting) {
      if (updates.botLimiting.perIP) {
        Object.assign(dataManager.data.rateLimiting.botLimiting.perIP, updates.botLimiting.perIP)
      }
      if (updates.botLimiting.burst) {
        Object.assign(dataManager.data.rateLimiting.botLimiting.burst, updates.botLimiting.burst)
      }
    }
    
    await dataManager.save()
    
    return c.json({
      success: true,
      message: 'Rate limiting settings updated',
      rateLimiting: dataManager.data.rateLimiting
    })
  } catch (error) {
    console.error('Rate limiting update error:', error)
    return c.json({ 
      success: false, 
      message: 'Rate limiting ayarları güncellenirken hata oluştu: ' + error.message 
    }, 500)
  }
})

// Get campaign click details
app.get('/api/domains/:id/campaign-clicks', requireAuth, (c) => {
  const id = c.req.param('id')
  const domain = domains.get(id)
  
  if (!domain) {
    return c.json({ success: false, message: 'Domain bulunamadı' }, 404)
  }
  
  const dataManager = getDomainDataManager(domain.name)
  const recentClicks = dataManager.data.campaigns.recentClicks || []
  
  return c.json({
    success: true,
    domain: domain.name,
    clicks: recentClicks.slice(0, 100), // Last 100 clicks
    total: recentClicks.length
  })
})

// =============================================================================
// PHASE 4: VIDEO DELIVERY SYSTEM API Routes
// =============================================================================

// Get domain video analytics
app.get('/api/domains/:id/videos', requireAuth, (c) => {
  const id = c.req.param('id')
  const domain = domains.get(id)
  
  if (!domain) {
    return c.json({ success: false, message: 'Domain bulunamadı' }, 404)
  }
  
  const dataManager = getDomainDataManager(domain.name)
  const videoAnalytics = dataManager.getVideoAnalytics()
  
  return c.json({
    success: true,
    domain: domain.name,
    ...videoAnalytics
  })
})

// Update domain video system settings
app.post('/api/domains/:id/videos/settings', requireAuth, async (c) => {
  const id = c.req.param('id')
  const updates = await c.req.json()
  
  const domain = domains.get(id)
  if (!domain) {
    return c.json({ success: false, message: 'Domain bulunamadı' }, 404)
  }
  
  const dataManager = getDomainDataManager(domain.name)
  
  try {
    // Update video system settings
    if (updates.enabled !== undefined) {
      dataManager.data.videoSystem.enabled = updates.enabled
    }
    if (updates.storage) {
      Object.assign(dataManager.data.videoSystem.storage, updates.storage)
    }
    if (updates.viewTracking) {
      Object.assign(dataManager.data.videoSystem.viewTracking, updates.viewTracking)
    }
    
    await dataManager.save()
    
    return c.json({
      success: true,
      message: 'Video system settings updated',
      videoSystem: dataManager.data.videoSystem
    })
  } catch (error) {
    console.error('Video system update error:', error)
    return c.json({ 
      success: false, 
      message: 'Video system ayarları güncellenirken hata oluştu: ' + error.message 
    }, 500)
  }
})

// Add or update video
app.post('/api/domains/:id/videos/add', requireAuth, async (c) => {
  const id = c.req.param('id')
  const videoData = await c.req.json()
  
  const domain = domains.get(id)
  if (!domain) {
    return c.json({ success: false, message: 'Domain bulunamadı' }, 404)
  }
  
  const dataManager = getDomainDataManager(domain.name)
  
  try {
    // Validate required fields
    if (!videoData.id || !videoData.title || !videoData.url) {
      return c.json({ 
        success: false, 
        message: 'Video ID, title, and URL are required' 
      }, 400)
    }
    
    const video = dataManager.addVideo(videoData)
    await dataManager.save()
    
    return c.json({
      success: true,
      message: 'Video added successfully',
      video
    })
  } catch (error) {
    console.error('Add video error:', error)
    return c.json({ 
      success: false, 
      message: 'Video eklenirken hata oluştu: ' + error.message 
    }, 500)
  }
})

// Remove video
app.delete('/api/domains/:id/videos/:videoId', requireAuth, async (c) => {
  const id = c.req.param('id')
  const videoId = c.req.param('videoId')
  
  const domain = domains.get(id)
  if (!domain) {
    return c.json({ success: false, message: 'Domain bulunamadı' }, 404)
  }
  
  const dataManager = getDomainDataManager(domain.name)
  
  try {
    const removed = dataManager.removeVideo(videoId)
    if (removed) {
      await dataManager.save()
      return c.json({
        success: true,
        message: 'Video removed successfully'
      })
    } else {
      return c.json({ 
        success: false, 
        message: 'Video not found' 
      }, 404)
    }
  } catch (error) {
    console.error('Remove video error:', error)
    return c.json({ 
      success: false, 
      message: 'Video silinirken hata oluştu: ' + error.message 
    }, 500)
  }
})

// Get video access URL with security token
app.post('/api/domains/:id/videos/:videoId/access', async (c) => {
  const id = c.req.param('id')
  const videoId = c.req.param('videoId')
  const { ip, country, userAgent, sessionId } = await c.req.json()
  
  const domain = domains.get(id)
  if (!domain) {
    return c.json({ success: false, message: 'Domain not found' }, 404)
  }
  
  const dataManager = getDomainDataManager(domain.name)
  
  try {
    const visitorInfo = { 
      ip, 
      country, 
      userAgent, 
      sessionId,
      timestamp: Date.now(),
      isBot: dataManager.detectBot(userAgent)
    }
    
    const videoAccess = dataManager.getVideoAccessUrl(videoId, visitorInfo)
    
    if (!videoAccess) {
      return c.json({ 
        success: false, 
        message: 'Video access denied or video not found' 
      }, 403)
    }
    
    return c.json({
      success: true,
      ...videoAccess
    })
  } catch (error) {
    console.error('Video access error:', error)
    return c.json({ 
      success: false, 
      message: 'Video access request failed: ' + error.message 
    }, 500)
  }
})

// Track video view
app.post('/api/domains/:id/videos/:videoId/view', async (c) => {
  const id = c.req.param('id')
  const videoId = c.req.param('videoId')
  const viewData = await c.req.json()
  
  const domain = domains.get(id)
  if (!domain) {
    return c.json({ success: false, message: 'Domain not found' }, 404)
  }
  
  const dataManager = getDomainDataManager(domain.name)
  
  try {
    const tracked = dataManager.trackVideoView({
      videoId,
      ...viewData,
      isBot: dataManager.detectBot(viewData.userAgent)
    })
    
    if (tracked) {
      await dataManager.save()
      return c.json({
        success: true,
        message: 'Video view tracked'
      })
    } else {
      return c.json({ 
        success: false, 
        message: 'Video tracking failed' 
      }, 400)
    }
  } catch (error) {
    console.error('Video view tracking error:', error)
    return c.json({ 
      success: false, 
      message: 'Video view tracking failed: ' + error.message 
    }, 500)
  }
})

// Validate video access token and serve video (public endpoint)
app.get('/api/video/:token', async (c) => {
  const token = c.req.param('token')
  const clientIP = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || '127.0.0.1'
  
  try {
    // Find domain that contains this video token
    let targetDomain = null
    let tokenData = null
    
    for (const domain of domains.values()) {
      const dataManager = getDomainDataManager(domain.name)
      const validated = dataManager.validateVideoAccessToken(token, clientIP)
      if (validated) {
        targetDomain = domain
        tokenData = validated
        break
      }
    }
    
    if (!targetDomain || !tokenData) {
      return c.json({ success: false, message: 'Invalid or expired token' }, 403)
    }
    
    const dataManager = getDomainDataManager(targetDomain.name)
    const video = dataManager.getVideo(tokenData.videoId)
    
    if (!video || !video.isActive) {
      return c.json({ success: false, message: 'Video not found or inactive' }, 404)
    }
    
    // In a real implementation, you would stream the video file here
    // For now, we return the video metadata and URL
    return c.json({
      success: true,
      video: {
        id: video.id,
        title: video.title,
        url: video.url,
        duration: video.duration,
        format: video.format,
        quality: video.quality,
        thumbnailUrl: video.thumbnailUrl
      },
      message: 'Video access granted'
    })
  } catch (error) {
    console.error('Video token validation error:', error)
    return c.json({ 
      success: false, 
      message: 'Token validation failed: ' + error.message 
    }, 500)
  }
})

// =============================================================================
// PHASE 5: ADVANCED SECURITY RULES API Routes
// =============================================================================

// Get domain security analytics
app.get('/api/domains/:id/security', requireAuth, (c) => {
  const id = c.req.param('id')
  const domain = domains.get(id)
  
  if (!domain) {
    return c.json({ success: false, message: 'Domain bulunamadı' }, 404)
  }
  
  const dataManager = getDomainDataManager(domain.name)
  const securityAnalytics = dataManager.getSecurityAnalytics()
  
  return c.json({
    success: true,
    domain: domain.name,
    ...securityAnalytics
  })
})

// Update domain security system settings
app.post('/api/domains/:id/security/settings', requireAuth, async (c) => {
  const id = c.req.param('id')
  const updates = await c.req.json()
  
  const domain = domains.get(id)
  if (!domain) {
    return c.json({ success: false, message: 'Domain bulunamadı' }, 404)
  }
  
  const dataManager = getDomainDataManager(domain.name)
  
  try {
    // Update security system settings
    if (updates.enabled !== undefined) {
      dataManager.data.securityRules.enabled = updates.enabled
    }
    if (updates.behaviorAnalysis !== undefined) {
      Object.assign(dataManager.data.securityRules.behaviorAnalysis, updates.behaviorAnalysis)
    }
    
    await dataManager.save()
    
    return c.json({
      success: true,
      message: 'Security settings updated',
      securityRules: dataManager.data.securityRules
    })
  } catch (error) {
    console.error('Security system update error:', error)
    return c.json({ 
      success: false, 
      message: 'Security system ayarları güncellenirken hata oluştu: ' + error.message 
    }, 500)
  }
})

// Add security rule
app.post('/api/domains/:id/security/rules', requireAuth, async (c) => {
  const id = c.req.param('id')
  const ruleData = await c.req.json()
  
  const domain = domains.get(id)
  if (!domain) {
    return c.json({ success: false, message: 'Domain bulunamadı' }, 404)
  }
  
  const dataManager = getDomainDataManager(domain.name)
  
  try {
    // Validate rule data
    if (!ruleData.name || !ruleData.condition || !ruleData.action) {
      return c.json({ 
        success: false, 
        message: 'Rule name, condition, and action are required' 
      }, 400)
    }
    
    const rule = dataManager.addSecurityRule(ruleData)
    await dataManager.save()
    
    return c.json({
      success: true,
      message: 'Security rule added successfully',
      rule
    })
  } catch (error) {
    console.error('Add security rule error:', error)
    return c.json({ 
      success: false, 
      message: 'Security rule eklenirken hata oluştu: ' + error.message 
    }, 500)
  }
})

// Update security rule
app.put('/api/domains/:id/security/rules/:ruleId', requireAuth, async (c) => {
  const id = c.req.param('id')
  const ruleId = c.req.param('ruleId')
  const updates = await c.req.json()
  
  const domain = domains.get(id)
  if (!domain) {
    return c.json({ success: false, message: 'Domain bulunamadı' }, 404)
  }
  
  const dataManager = getDomainDataManager(domain.name)
  
  try {
    const rule = dataManager.updateSecurityRule(ruleId, updates)
    if (rule) {
      await dataManager.save()
      return c.json({
        success: true,
        message: 'Security rule updated successfully',
        rule
      })
    } else {
      return c.json({ 
        success: false, 
        message: 'Security rule not found' 
      }, 404)
    }
  } catch (error) {
    console.error('Update security rule error:', error)
    return c.json({ 
      success: false, 
      message: 'Security rule güncellenirken hata oluştu: ' + error.message 
    }, 500)
  }
})

// Delete security rule
app.delete('/api/domains/:id/security/rules/:ruleId', requireAuth, async (c) => {
  const id = c.req.param('id')
  const ruleId = c.req.param('ruleId')
  
  const domain = domains.get(id)
  if (!domain) {
    return c.json({ success: false, message: 'Domain bulunamadı' }, 404)
  }
  
  const dataManager = getDomainDataManager(domain.name)
  
  try {
    const removed = dataManager.removeSecurityRule(ruleId)
    if (removed) {
      await dataManager.save()
      return c.json({
        success: true,
        message: 'Security rule removed successfully'
      })
    } else {
      return c.json({ 
        success: false, 
        message: 'Security rule not found' 
      }, 404)
    }
  } catch (error) {
    console.error('Remove security rule error:', error)
    return c.json({ 
      success: false, 
      message: 'Security rule silinirken hata oluştu: ' + error.message 
    }, 500)
  }
})

// Add honeypot trap
app.post('/api/domains/:id/security/honeypots', requireAuth, async (c) => {
  const id = c.req.param('id')
  const honeypotData = await c.req.json()
  
  const domain = domains.get(id)
  if (!domain) {
    return c.json({ success: false, message: 'Domain bulunamadı' }, 404)
  }
  
  const dataManager = getDomainDataManager(domain.name)
  
  try {
    // Validate honeypot data
    if (!honeypotData.url) {
      return c.json({ 
        success: false, 
        message: 'Honeypot URL is required' 
      }, 400)
    }
    
    const honeypot = dataManager.addHoneypot(honeypotData)
    await dataManager.save()
    
    return c.json({
      success: true,
      message: 'Honeypot trap added successfully',
      honeypot
    })
  } catch (error) {
    console.error('Add honeypot error:', error)
    return c.json({ 
      success: false, 
      message: 'Honeypot eklenirken hata oluştu: ' + error.message 
    }, 500)
  }
})

// Check honeypot (public endpoint for actual honeypot URLs)
app.get('/honeypot/:path', async (c) => {
  const path = c.req.param('path')
  const clientIP = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || '127.0.0.1'
  const userAgent = c.req.header('user-agent') || ''
  const referrer = c.req.header('referer') || ''
  
  // Find which domain owns this honeypot
  let targetDomain = null
  let honeypotResult = null
  
  for (const domain of domains.values()) {
    const dataManager = getDomainDataManager(domain.name)
    const result = dataManager.checkHoneypot(`/honeypot/${path}`, {
      ip: clientIP,
      userAgent,
      referrer,
      timestamp: Date.now()
    })
    
    if (result.isHoneypot) {
      targetDomain = domain
      honeypotResult = result
      break
    }
  }
  
  if (honeypotResult?.isHoneypot) {
    // Return a fake response to fool the bot
    return c.html(`
      <!DOCTYPE html>
      <html>
      <head><title>Secret Admin Panel</title></head>
      <body>
        <h1>Administrative Interface</h1>
        <p>Please enter your credentials...</p>
        <!-- This is a honeypot - accessing this triggers security measures -->
      </body>
      </html>
    `)
  }
  
  return c.notFound()
})

// Analyze visitor behavior (public endpoint)
app.post('/api/analyze-behavior', async (c) => {
  const { domain, ip, userAgent, sessionId, timestamp } = await c.req.json()
  
  const domainObj = Array.from(domains.values()).find(d => d.name === domain)
  if (!domainObj) {
    return c.json({ success: false, message: 'Domain not found' }, 404)
  }
  
  const dataManager = getDomainDataManager(domain)
  
  try {
    const behaviorAnalysis = dataManager.analyzeBehavior({
      ip,
      userAgent,
      sessionId,
      timestamp: timestamp || Date.now()
    })
    
    if (behaviorAnalysis.suspicious) {
      dataManager.logSecurityEvent({
        type: 'behavior_analysis',
        visitorData: { ip, userAgent, sessionId },
        behaviorScore: behaviorAnalysis.score,
        reasons: behaviorAnalysis.reasons,
        timestamp: new Date().toISOString()
      })
    }
    
    return c.json({
      success: true,
      analysis: behaviorAnalysis
    })
  } catch (error) {
    console.error('Behavior analysis error:', error)
    return c.json({ 
      success: false, 
      message: 'Behavior analysis failed: ' + error.message 
    }, 500)
  }
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

// Favicon route - prevent 500 error
app.get('/favicon.ico', (c) => {
  // Return 204 No Content for favicon requests
  c.header('Cache-Control', 'public, max-age=86400')
  return c.body(null, 204)
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
        <script>
          // Suppress Tailwind production warning
          window.process = { env: { NODE_ENV: 'development' } };
        </script>
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

// =============================================================================
// PHASE 6: HOOK SYSTEM & INTEGRATIONS API ENDPOINTS
// =============================================================================

// Get domain integrations overview
app.get('/api/domains/:id/integrations', requireAuth, async (c) => {
  const id = c.req.param('id')
  
  const domain = domains.get(id)
  if (!domain) {
    return c.json({ success: false, message: 'Domain bulunamadı' }, 404)
  }
  
  const dataManager = getDomainDataManager(domain.name)
  const analytics = dataManager.getIntegrationAnalytics()
  
  return c.json({
    success: true,
    domain: domain.name,
    ...analytics,
    webhooks: dataManager.data.integrations?.webhooks || [],
    customScripts: dataManager.data.integrations?.customScripts || [],
    apiConnections: dataManager.data.integrations?.apiConnections || []
  })
})

// Webhook Management API Endpoints

// Get domain webhooks
app.get('/api/domains/:id/integrations/webhooks', requireAuth, async (c) => {
  const id = c.req.param('id')
  
  const domain = domains.get(id)
  if (!domain) {
    return c.json({ success: false, message: 'Domain bulunamadı' }, 404)
  }
  
  const dataManager = getDomainDataManager(domain.name)
  const webhooks = dataManager.data.integrations?.webhooks || []
  
  return c.json({
    success: true,
    domain: domain.name,
    webhooks
  })
})

// Add webhook
app.post('/api/domains/:id/integrations/webhooks', requireAuth, async (c) => {
  const id = c.req.param('id')
  const webhookData = await c.req.json()
  
  const domain = domains.get(id)
  if (!domain) {
    return c.json({ success: false, message: 'Domain bulunamadı' }, 404)
  }
  
  const dataManager = getDomainDataManager(domain.name)
  
  try {
    // Validate webhook data
    if (!webhookData.name || !webhookData.url || !webhookData.events) {
      return c.json({ 
        success: false, 
        message: 'Webhook name, URL, and events are required' 
      }, 400)
    }
    
    const webhook = dataManager.addWebhook(webhookData)
    await dataManager.save()
    
    return c.json({
      success: true,
      message: 'Webhook başarıyla eklendi',
      webhook
    })
  } catch (error) {
    console.error('Webhook creation error:', error)
    return c.json({ 
      success: false, 
      message: 'Webhook oluşturulurken hata oluştu: ' + error.message 
    }, 500)
  }
})

// Update webhook
app.put('/api/domains/:id/integrations/webhooks/:webhookId', requireAuth, async (c) => {
  const id = c.req.param('id')
  const webhookId = c.req.param('webhookId')
  const updateData = await c.req.json()
  
  const domain = domains.get(id)
  if (!domain) {
    return c.json({ success: false, message: 'Domain bulunamadı' }, 404)
  }
  
  const dataManager = getDomainDataManager(domain.name)
  const webhooks = dataManager.data.integrations?.webhooks || []
  const webhook = webhooks.find(w => w.id === webhookId)
  
  if (!webhook) {
    return c.json({ success: false, message: 'Webhook bulunamadı' }, 404)
  }
  
  try {
    // Update webhook properties
    Object.keys(updateData).forEach(key => {
      if (key !== 'id' && key !== 'createdAt') {
        webhook[key] = updateData[key]
      }
    })
    
    webhook.updatedAt = new Date().toISOString()
    await dataManager.save()
    
    return c.json({
      success: true,
      message: 'Webhook başarıyla güncellendi',
      webhook
    })
  } catch (error) {
    console.error('Webhook update error:', error)
    return c.json({ 
      success: false, 
      message: 'Webhook güncellenirken hata oluştu: ' + error.message 
    }, 500)
  }
})

// Delete webhook
app.delete('/api/domains/:id/integrations/webhooks/:webhookId', requireAuth, async (c) => {
  const id = c.req.param('id')
  const webhookId = c.req.param('webhookId')
  
  const domain = domains.get(id)
  if (!domain) {
    return c.json({ success: false, message: 'Domain bulunamadı' }, 404)
  }
  
  const dataManager = getDomainDataManager(domain.name)
  
  if (!dataManager.data.integrations?.webhooks) {
    return c.json({ success: false, message: 'Webhook bulunamadı' }, 404)
  }
  
  const initialLength = dataManager.data.integrations.webhooks.length
  dataManager.data.integrations.webhooks = dataManager.data.integrations.webhooks.filter(w => w.id !== webhookId)
  
  if (dataManager.data.integrations.webhooks.length === initialLength) {
    return c.json({ success: false, message: 'Webhook bulunamadı' }, 404)
  }
  
  await dataManager.save()
  
  return c.json({
    success: true,
    message: 'Webhook başarıyla silindi'
  })
})

// Test webhook
app.post('/api/domains/:id/integrations/webhooks/:webhookId/test', requireAuth, async (c) => {
  const id = c.req.param('id')
  const webhookId = c.req.param('webhookId')
  
  const domain = domains.get(id)
  if (!domain) {
    return c.json({ success: false, message: 'Domain bulunamadı' }, 404)
  }
  
  const dataManager = getDomainDataManager(domain.name)
  const webhooks = dataManager.data.integrations?.webhooks || []
  const webhook = webhooks.find(w => w.id === webhookId)
  
  if (!webhook) {
    return c.json({ success: false, message: 'Webhook bulunamadı' }, 404)
  }
  
  try {
    const testData = {
      test: true,
      timestamp: new Date().toISOString(),
      message: 'This is a test webhook call'
    }
    
    const result = await dataManager.triggerWebhooks('test_event', testData)
    
    return c.json({
      success: true,
      message: 'Test webhook başarıyla gönderildi',
      result
    })
  } catch (error) {
    console.error('Webhook test error:', error)
    return c.json({ 
      success: false, 
      message: 'Webhook test edilirken hata oluştu: ' + error.message 
    }, 500)
  }
})

// Custom Scripts Management API Endpoints

// Get domain custom scripts
app.get('/api/domains/:id/integrations/scripts', requireAuth, async (c) => {
  const id = c.req.param('id')
  
  const domain = domains.get(id)
  if (!domain) {
    return c.json({ success: false, message: 'Domain bulunamadı' }, 404)
  }
  
  const dataManager = getDomainDataManager(domain.name)
  const scripts = dataManager.data.integrations?.customScripts || []
  
  return c.json({
    success: true,
    domain: domain.name,
    scripts
  })
})

// Add custom script
app.post('/api/domains/:id/integrations/scripts', requireAuth, async (c) => {
  const id = c.req.param('id')
  const scriptData = await c.req.json()
  
  const domain = domains.get(id)
  if (!domain) {
    return c.json({ success: false, message: 'Domain bulunamadı' }, 404)
  }
  
  const dataManager = getDomainDataManager(domain.name)
  
  try {
    // Validate script data
    if (!scriptData.name || !scriptData.event || !scriptData.code) {
      return c.json({ 
        success: false, 
        message: 'Script name, event, and code are required' 
      }, 400)
    }
    
    const script = dataManager.addCustomScript(scriptData)
    await dataManager.save()
    
    return c.json({
      success: true,
      message: 'Custom script başarıyla eklendi',
      script
    })
  } catch (error) {
    console.error('Custom script creation error:', error)
    return c.json({ 
      success: false, 
      message: 'Custom script oluşturulurken hata oluştu: ' + error.message 
    }, 500)
  }
})

// Update custom script
app.put('/api/domains/:id/integrations/scripts/:scriptId', requireAuth, async (c) => {
  const id = c.req.param('id')
  const scriptId = c.req.param('scriptId')
  const updateData = await c.req.json()
  
  const domain = domains.get(id)
  if (!domain) {
    return c.json({ success: false, message: 'Domain bulunamadı' }, 404)
  }
  
  const dataManager = getDomainDataManager(domain.name)
  const scripts = dataManager.data.integrations?.customScripts || []
  const script = scripts.find(s => s.id === scriptId)
  
  if (!script) {
    return c.json({ success: false, message: 'Custom script bulunamadı' }, 404)
  }
  
  try {
    // Update script properties
    Object.keys(updateData).forEach(key => {
      if (key !== 'id' && key !== 'createdAt') {
        script[key] = updateData[key]
      }
    })
    
    script.updatedAt = new Date().toISOString()
    await dataManager.save()
    
    return c.json({
      success: true,
      message: 'Custom script başarıyla güncellendi',
      script
    })
  } catch (error) {
    console.error('Custom script update error:', error)
    return c.json({ 
      success: false, 
      message: 'Custom script güncellenirken hata oluştu: ' + error.message 
    }, 500)
  }
})

// Delete custom script
app.delete('/api/domains/:id/integrations/scripts/:scriptId', requireAuth, async (c) => {
  const id = c.req.param('id')
  const scriptId = c.req.param('scriptId')
  
  const domain = domains.get(id)
  if (!domain) {
    return c.json({ success: false, message: 'Domain bulunamadı' }, 404)
  }
  
  const dataManager = getDomainDataManager(domain.name)
  
  if (!dataManager.data.integrations?.customScripts) {
    return c.json({ success: false, message: 'Custom script bulunamadı' }, 404)
  }
  
  const initialLength = dataManager.data.integrations.customScripts.length
  dataManager.data.integrations.customScripts = dataManager.data.integrations.customScripts.filter(s => s.id !== scriptId)
  
  if (dataManager.data.integrations.customScripts.length === initialLength) {
    return c.json({ success: false, message: 'Custom script bulunamadı' }, 404)
  }
  
  await dataManager.save()
  
  return c.json({
    success: true,
    message: 'Custom script başarıyla silindi'
  })
})

// Execute custom script manually
app.post('/api/domains/:id/integrations/scripts/:scriptId/execute', requireAuth, async (c) => {
  const id = c.req.param('id')
  const scriptId = c.req.param('scriptId')
  const { eventData = {} } = await c.req.json()
  
  const domain = domains.get(id)
  if (!domain) {
    return c.json({ success: false, message: 'Domain bulunamadı' }, 404)
  }
  
  const dataManager = getDomainDataManager(domain.name)
  const scripts = dataManager.data.integrations?.customScripts || []
  const script = scripts.find(s => s.id === scriptId)
  
  if (!script) {
    return c.json({ success: false, message: 'Custom script bulunamadı' }, 404)
  }
  
  try {
    const result = await dataManager.executeScript(script, eventData)
    
    return c.json({
      success: true,
      message: 'Custom script başarıyla çalıştırıldı',
      result
    })
  } catch (error) {
    console.error('Custom script execution error:', error)
    return c.json({ 
      success: false, 
      message: 'Custom script çalıştırılırken hata oluştu: ' + error.message 
    }, 500)
  }
})

// API Connections Management API Endpoints

// Get domain API connections
app.get('/api/domains/:id/integrations/apis', requireAuth, async (c) => {
  const id = c.req.param('id')
  
  const domain = domains.get(id)
  if (!domain) {
    return c.json({ success: false, message: 'Domain bulunamadı' }, 404)
  }
  
  const dataManager = getDomainDataManager(domain.name)
  const connections = dataManager.data.integrations?.apiConnections || []
  
  // Hide API keys in response
  const safeConnections = connections.map(conn => ({
    ...conn,
    apiKey: conn.apiKey ? '***encrypted***' : null
  }))
  
  return c.json({
    success: true,
    domain: domain.name,
    connections: safeConnections
  })
})

// Add API connection
app.post('/api/domains/:id/integrations/apis', requireAuth, async (c) => {
  const id = c.req.param('id')
  const connectionData = await c.req.json()
  
  const domain = domains.get(id)
  if (!domain) {
    return c.json({ success: false, message: 'Domain bulunamadı' }, 404)
  }
  
  const dataManager = getDomainDataManager(domain.name)
  
  try {
    // Validate connection data
    if (!connectionData.name || !connectionData.type || !connectionData.baseUrl) {
      return c.json({ 
        success: false, 
        message: 'Connection name, type, and base URL are required' 
      }, 400)
    }
    
    const connection = dataManager.addApiConnection(connectionData)
    await dataManager.save()
    
    // Hide API key in response
    const safeConnection = {
      ...connection,
      apiKey: connection.apiKey ? '***encrypted***' : null
    }
    
    return c.json({
      success: true,
      message: 'API connection başarıyla eklendi',
      connection: safeConnection
    })
  } catch (error) {
    console.error('API connection creation error:', error)
    return c.json({ 
      success: false, 
      message: 'API connection oluşturulurken hata oluştu: ' + error.message 
    }, 500)
  }
})

// Update API connection
app.put('/api/domains/:id/integrations/apis/:connectionId', requireAuth, async (c) => {
  const id = c.req.param('id')
  const connectionId = c.req.param('connectionId')
  const updateData = await c.req.json()
  
  const domain = domains.get(id)
  if (!domain) {
    return c.json({ success: false, message: 'Domain bulunamadı' }, 404)
  }
  
  const dataManager = getDomainDataManager(domain.name)
  const connections = dataManager.data.integrations?.apiConnections || []
  const connection = connections.find(c => c.id === connectionId)
  
  if (!connection) {
    return c.json({ success: false, message: 'API connection bulunamadı' }, 404)
  }
  
  try {
    // Update connection properties
    Object.keys(updateData).forEach(key => {
      if (key !== 'id' && key !== 'createdAt') {
        connection[key] = updateData[key]
      }
    })
    
    connection.updatedAt = new Date().toISOString()
    await dataManager.save()
    
    // Hide API key in response
    const safeConnection = {
      ...connection,
      apiKey: connection.apiKey ? '***encrypted***' : null
    }
    
    return c.json({
      success: true,
      message: 'API connection başarıyla güncellendi',
      connection: safeConnection
    })
  } catch (error) {
    console.error('API connection update error:', error)
    return c.json({ 
      success: false, 
      message: 'API connection güncellenirken hata oluştu: ' + error.message 
    }, 500)
  }
})

// Delete API connection
app.delete('/api/domains/:id/integrations/apis/:connectionId', requireAuth, async (c) => {
  const id = c.req.param('id')
  const connectionId = c.req.param('connectionId')
  
  const domain = domains.get(id)
  if (!domain) {
    return c.json({ success: false, message: 'Domain bulunamadı' }, 404)
  }
  
  const dataManager = getDomainDataManager(domain.name)
  
  if (!dataManager.data.integrations?.apiConnections) {
    return c.json({ success: false, message: 'API connection bulunamadı' }, 404)
  }
  
  const initialLength = dataManager.data.integrations.apiConnections.length
  dataManager.data.integrations.apiConnections = dataManager.data.integrations.apiConnections.filter(c => c.id !== connectionId)
  
  if (dataManager.data.integrations.apiConnections.length === initialLength) {
    return c.json({ success: false, message: 'API connection bulunamadı' }, 404)
  }
  
  await dataManager.save()
  
  return c.json({
    success: true,
    message: 'API connection başarıyla silindi'
  })
})

// Test API connection
app.post('/api/domains/:id/integrations/apis/:connectionId/test', requireAuth, async (c) => {
  const id = c.req.param('id')
  const connectionId = c.req.param('connectionId')
  const { endpoint = '/', method = 'GET', data = null } = await c.req.json()
  
  const domain = domains.get(id)
  if (!domain) {
    return c.json({ success: false, message: 'Domain bulunamadı' }, 404)
  }
  
  const dataManager = getDomainDataManager(domain.name)
  
  try {
    const result = await dataManager.callApi(connectionId, endpoint, method, data)
    
    return c.json({
      success: true,
      message: 'API connection testi başarılı',
      result
    })
  } catch (error) {
    console.error('API connection test error:', error)
    return c.json({ 
      success: false, 
      message: 'API connection test edilirken hata oluştu: ' + error.message 
    }, 500)
  }
})

// Event System API Endpoint

// Trigger manual event for testing integrations
app.post('/api/domains/:id/integrations/trigger-event', requireAuth, async (c) => {
  const id = c.req.param('id')
  const { eventType, eventData = {} } = await c.req.json()
  
  const domain = domains.get(id)
  if (!domain) {
    return c.json({ success: false, message: 'Domain bulunamadı' }, 404)
  }
  
  if (!eventType) {
    return c.json({ success: false, message: 'Event type gereklidir' }, 400)
  }
  
  const dataManager = getDomainDataManager(domain.name)
  
  try {
    const results = await dataManager.triggerEvent(eventType, {
      ...eventData,
      triggeredBy: 'manual',
      timestamp: new Date().toISOString()
    })
    
    return c.json({
      success: true,
      message: 'Event başarıyla tetiklendi',
      results
    })
  } catch (error) {
    console.error('Event trigger error:', error)
    return c.json({ 
      success: false, 
      message: 'Event tetiklenirken hata oluştu: ' + error.message 
    }, 500)
  }
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
        <script>
          // Suppress Tailwind production warning
          window.process = { env: { NODE_ENV: 'development' } };
        </script>
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
                    <div class="flex justify-between items-center mb-6">
                        <h2 class="text-2xl font-bold">
                            <i class="fas fa-chart-line mr-2 text-green-400"></i>
                            Traffic Analysis & Visitor Management
                        </h2>
                        <div class="flex space-x-3">
                            <button onclick="loadTrafficData()" 
                                    class="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-medium">
                                <i class="fas fa-sync-alt mr-2"></i>Refresh Data
                            </button>
                        </div>
                    </div>
                    
                    <!-- Phase 1 Features Overview -->
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        <!-- IP Management Overview -->
                        <div class="bg-gray-700 p-6 rounded-lg border-l-4 border-purple-500">
                            <h3 class="text-xl font-bold text-purple-300 mb-4 flex items-center">
                                <i class="fas fa-shield-alt mr-3"></i>
                                Per-Domain IP Management
                            </h3>
                            <p class="text-gray-300 mb-4">
                                Control access with whitelist, blacklist, and graylist rules. 
                                Each domain has its own IP security configuration.
                            </p>
                            <div class="space-y-2 text-sm text-gray-400 mb-4">
                                <div class="flex items-center">
                                    <i class="fas fa-check-circle text-green-400 mr-2"></i>
                                    <span>Whitelist: Always allow trusted IPs</span>
                                </div>
                                <div class="flex items-center">
                                    <i class="fas fa-ban text-red-400 mr-2"></i>
                                    <span>Blacklist: Always block malicious IPs</span>
                                </div>
                                <div class="flex items-center">
                                    <i class="fas fa-exclamation-triangle text-yellow-400 mr-2"></i>
                                    <span>Graylist: Monitor suspicious IPs</span>
                                </div>
                                <div class="flex items-center">
                                    <i class="fas fa-layer-group text-blue-400 mr-2"></i>
                                    <span>Bulk operations for IP ranges</span>
                                </div>
                            </div>
                            <p class="text-xs text-gray-500">
                                Click the purple shield button on any domain to manage its IP rules.
                            </p>
                        </div>
                        
                        <!-- Analytics Overview -->
                        <div class="bg-gray-700 p-6 rounded-lg border-l-4 border-green-500">
                            <h3 class="text-xl font-bold text-green-300 mb-4 flex items-center">
                                <i class="fas fa-chart-bar mr-3"></i>
                                Advanced Visitor Analytics
                            </h3>
                            <p class="text-gray-300 mb-4">
                                Real-time visitor tracking with comprehensive analytics. 
                                Monitor human vs bot traffic, geographic distribution, and content serving patterns.
                            </p>
                            <div class="space-y-2 text-sm text-gray-400 mb-4">
                                <div class="flex items-center">
                                    <i class="fas fa-users text-blue-400 mr-2"></i>
                                    <span>Human vs Bot traffic analysis</span>
                                </div>
                                <div class="flex items-center">
                                    <i class="fas fa-globe text-cyan-400 mr-2"></i>
                                    <span>Geographic visitor distribution</span>
                                </div>
                                <div class="flex items-center">
                                    <i class="fas fa-external-link-alt text-orange-400 mr-2"></i>
                                    <span>Referrer source tracking</span>
                                </div>
                                <div class="flex items-center">
                                    <i class="fas fa-clock text-pink-400 mr-2"></i>
                                    <span>Real-time visitor activity feed</span>
                                </div>
                            </div>
                            <p class="text-xs text-gray-500">
                                Click the green chart button on any domain to view its analytics dashboard.
                            </p>
                        </div>
                    </div>
                    
                    <!-- Implementation Status -->
                    <div class="bg-gray-700 p-4 rounded-lg mb-6">
                        <h4 class="text-lg font-semibold text-white mb-4 flex items-center">
                            <i class="fas fa-tasks text-blue-400 mr-2"></i>
                            Phase 1 Implementation Status
                        </h4>
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div class="flex items-center space-x-2">
                                <i class="fas fa-check-circle text-green-400"></i>
                                <span class="text-gray-300">JSON Data Storage</span>
                            </div>
                            <div class="flex items-center space-x-2">
                                <i class="fas fa-check-circle text-green-400"></i>
                                <span class="text-gray-300">Per-Domain IP Rules</span>
                            </div>
                            <div class="flex items-center space-x-2">
                                <i class="fas fa-check-circle text-green-400"></i>
                                <span class="text-gray-300">Visitor Analytics</span>
                            </div>
                            <div class="flex items-center space-x-2">
                                <i class="fas fa-check-circle text-green-400"></i>
                                <span class="text-gray-300">Real-time Tracking</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Next Phases Preview -->
                    <div class="bg-gray-700 p-4 rounded-lg">
                        <h4 class="text-lg font-semibold text-white mb-4 flex items-center">
                            <i class="fas fa-road text-yellow-400 mr-2"></i>
                            Upcoming Features (Next Phases)
                        </h4>
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <!-- Phase 2 -->
                            <div class="bg-gray-600 p-3 rounded">
                                <h5 class="font-semibold text-cyan-400 mb-2">Phase 2: Geographic & Time Controls</h5>
                                <ul class="text-sm text-gray-300 space-y-1">
                                    <li>• Country-based access control</li>
                                    <li>• Time-based access rules</li>
                                    <li>• Business hours restrictions</li>
                                    <li>• Holiday blocking</li>
                                </ul>
                            </div>
                            
                            <!-- Phase 3 -->
                            <div class="bg-gray-600 p-3 rounded">
                                <h5 class="font-semibold text-orange-400 mb-2">Phase 3: Campaign & Rate Limiting</h5>
                                <ul class="text-sm text-gray-300 space-y-1">
                                    <li>• UTM campaign tracking</li>
                                    <li>• Source attribution</li>
                                    <li>• Advanced rate limiting</li>
                                    <li>• Per-IP rate rules</li>
                                </ul>
                            </div>
                            
                            <!-- Phase 4 -->
                            <div class="bg-gray-600 p-3 rounded">
                                <h5 class="font-semibold text-purple-400 mb-2">Phase 4: Video Delivery System</h5>
                                <ul class="text-sm text-gray-300 space-y-1">
                                    <li>• Single-view video tracking</li>
                                    <li>• Multi-storage detection</li>
                                    <li>• Video analytics</li>
                                    <li>• Encrypted delivery</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- NGINX Multi-Domain Configuration Section -->
            <div id="section-nginx" class="section hidden">
                <div class="bg-gray-800 rounded-lg p-6">
                    <div class="flex justify-between items-center mb-6">
                        <h2 class="text-2xl font-bold">
                            <i class="fas fa-server mr-2 text-purple-400"></i>
                            NGINX Multi-Domain Konfigürasyonu
                        </h2>
                        <div class="flex space-x-3">
                            <button onclick="refreshDomainConfigs()" 
                                    class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-medium">
                                <i class="fas fa-sync-alt mr-2"></i>Yenile
                            </button>
                            <button onclick="generateAdvancedNginxConfig()" 
                                    class="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-medium">
                                <i class="fas fa-magic mr-2"></i>Config Oluştur
                            </button>
                        </div>
                    </div>

                    <!-- Overview Stats -->
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div class="bg-gray-700 p-4 rounded-lg">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-gray-300 text-sm">Toplam Domain</p>
                                    <p class="text-2xl font-bold text-purple-400" id="nginx-total-domains">0</p>
                                </div>
                                <div class="bg-purple-500 bg-opacity-20 p-3 rounded-full">
                                    <i class="fas fa-globe text-purple-400"></i>
                                </div>
                            </div>
                        </div>
                        
                        <div class="bg-gray-700 p-4 rounded-lg">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-gray-300 text-sm">Aktif Config</p>
                                    <p class="text-2xl font-bold text-green-400" id="nginx-active-configs">0</p>
                                </div>
                                <div class="bg-green-500 bg-opacity-20 p-3 rounded-full">
                                    <i class="fas fa-check-circle text-green-400"></i>
                                </div>
                            </div>
                        </div>
                        
                        <div class="bg-gray-700 p-4 rounded-lg">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-gray-300 text-sm">Backend Servers</p>
                                    <p class="text-2xl font-bold text-blue-400" id="nginx-backend-count">0</p>
                                </div>
                                <div class="bg-blue-500 bg-opacity-20 p-3 rounded-full">
                                    <i class="fas fa-server text-blue-400"></i>
                                </div>
                            </div>
                        </div>
                        
                        <div class="bg-gray-700 p-4 rounded-lg">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-gray-300 text-sm">Config Size</p>
                                    <p class="text-2xl font-bold text-orange-400" id="nginx-config-size">0 KB</p>
                                </div>
                                <div class="bg-orange-500 bg-opacity-20 p-3 rounded-full">
                                    <i class="fas fa-file-code text-orange-400"></i>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Domain Configuration Management -->
                    <div class="bg-gray-700 p-4 rounded-lg mb-6">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="text-lg font-semibold flex items-center">
                                <i class="fas fa-cog mr-2 text-yellow-400"></i>
                                Domain Backend Konfigürasyonları
                            </h3>
                            <button onclick="addNewDomainConfig()" 
                                    class="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded text-sm">
                                <i class="fas fa-plus mr-1"></i>Yeni Config
                            </button>
                        </div>
                        
                        <div id="domain-configs-container" class="space-y-4">
                            <!-- Domain configurations will be loaded here -->
                            <div class="text-center py-8 text-gray-400">
                                <i class="fas fa-spinner fa-spin text-2xl mb-2"></i>
                                <p>Domain konfigürasyonları yükleniyor...</p>
                            </div>
                        </div>
                    </div>

                    <!-- Global Settings -->
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        <div class="bg-gray-700 p-4 rounded-lg">
                            <h3 class="text-lg font-semibold mb-4 flex items-center">
                                <i class="fas fa-globe mr-2 text-cyan-400"></i>
                                Global Settings
                            </h3>
                            <div class="space-y-3">
                                <div>
                                    <label class="block text-sm font-medium mb-1">Rate Limiting (req/sec)</label>
                                    <input type="number" id="global-rate-limit" 
                                           class="w-full p-2 bg-gray-600 border border-gray-500 rounded"
                                           value="10" min="1" max="100">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium mb-1">Bot Rate Limit (req/sec)</label>
                                    <input type="number" id="bot-rate-limit" 
                                           class="w-full p-2 bg-gray-600 border border-gray-500 rounded"
                                           value="1" min="1" max="10">
                                </div>
                                <div class="flex items-center space-x-2">
                                    <input type="checkbox" id="enable-geoip" class="rounded">
                                    <label for="enable-geoip" class="text-sm">Enable GeoIP Detection</label>
                                </div>
                                <div class="flex items-center space-x-2">
                                    <input type="checkbox" id="enable-analytics" class="rounded" checked>
                                    <label for="enable-analytics" class="text-sm">Enable Traffic Analytics</label>
                                </div>
                            </div>
                        </div>
                        
                        <div class="bg-gray-700 p-4 rounded-lg">
                            <h3 class="text-lg font-semibold mb-4 flex items-center">
                                <i class="fas fa-shield-alt mr-2 text-red-400"></i>
                                Security Settings
                            </h3>
                            <div class="space-y-3">
                                <div class="flex items-center space-x-2">
                                    <input type="checkbox" id="enable-bot-protection" class="rounded" checked>
                                    <label for="enable-bot-protection" class="text-sm">Advanced Bot Protection</label>
                                </div>
                                <div class="flex items-center space-x-2">
                                    <input type="checkbox" id="enable-ddos-protection" class="rounded" checked>
                                    <label for="enable-ddos-protection" class="text-sm">DDoS Protection</label>
                                </div>
                                <div class="flex items-center space-x-2">
                                    <input type="checkbox" id="enable-referrer-check" class="rounded" checked>
                                    <label for="enable-referrer-check" class="text-sm">Facebook Referrer Detection</label>
                                </div>
                                <div class="flex items-center space-x-2">
                                    <input type="checkbox" id="block-suspicious" class="rounded">
                                    <label for="block-suspicious" class="text-sm">Block Suspicious Traffic</label>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Config Preview and Actions -->
                    <div class="bg-gray-700 p-4 rounded-lg mb-4">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="text-lg font-semibold flex items-center">
                                <i class="fas fa-eye mr-2 text-cyan-400"></i>
                                Generated NGINX Configuration
                            </h3>
                            <div class="flex space-x-2">
                                <button onclick="copyConfigToClipboard()" 
                                        class="bg-gray-600 hover:bg-gray-500 px-3 py-1 rounded text-sm">
                                    <i class="fas fa-copy mr-1"></i>Copy
                                </button>
                                <button onclick="downloadAdvancedConfig()" 
                                        class="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm">
                                    <i class="fas fa-download mr-1"></i>Download
                                </button>
                            </div>
                        </div>
                        <div class="bg-black p-4 rounded border font-mono text-xs overflow-auto max-h-96">
                            <pre id="advanced-nginx-config-preview" class="text-green-400 whitespace-pre-wrap">
# Multi-Domain NGINX Configuration
# Generated configuration will appear here after clicking "Config Oluştur"
# 
# Features:
# - Per-domain backend routing
# - Advanced bot detection with Lua
# - Rate limiting and DDoS protection
# - Traffic analytics and monitoring
# - Facebook referrer detection
# - Geographic routing support
# 
# Click "Config Oluştur" to generate configuration for all domains
                            </pre>
                        </div>
                    </div>
                    
                    <!-- Deploy Actions -->
                    <div class="flex flex-wrap gap-4">
                        <button onclick="generateAdvancedNginxConfig()" 
                                class="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium">
                            <i class="fas fa-magic mr-2"></i>Config Oluştur
                        </button>
                        <button onclick="validateNginxConfig()" 
                                class="bg-yellow-600 hover:bg-yellow-700 px-6 py-3 rounded-lg font-medium">
                            <i class="fas fa-check-circle mr-2"></i>Config Doğrula
                        </button>
                        <button onclick="deployNginxConfig()" 
                                class="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg font-medium">
                            <i class="fas fa-rocket mr-2"></i>Deploy Config
                        </button>
                        <button onclick="testNginxConfig()" 
                                class="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-medium">
                            <i class="fas fa-vial mr-2"></i>Test Config
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

        <!-- Universal Modal for Integrations -->
        <div id="modal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div id="modal-content">
                <!-- Modal content will be dynamically loaded here -->
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