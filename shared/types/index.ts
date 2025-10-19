// ============================================================================
// SHARED TYPES - Trafik Kontrol Platform
// ============================================================================
// Bu tipler hem server hem client tarafında kullanılır
// ============================================================================

// ============================================================================
// DOMAIN TYPES
// ============================================================================

export interface Domain {
  id: string
  name: string // example.com
  display_name?: string
  status: 'active' | 'warning' | 'error' | 'disabled'
  category?: string
  config?: DomainConfig
  created_at: Date
  updated_at: Date
  created_by?: string
  total_visits?: number
  last_visit_at?: Date
}

export interface DomainConfig {
  // IP Rules
  ipRules?: {
    whitelist: IPRule[]
    blacklist: IPRule[]
    graylist: IPRule[]
  }
  
  // Geographic controls
  geoControls?: {
    allowedCountries: string[]
    blockedCountries: string[]
    redirectRules: Record<string, string>
    defaultAction: 'allow' | 'block'
  }
  
  // Time controls
  timeControls?: {
    businessHours?: {
      start: number
      end: number
      days: string[]
      timezone: string
    }
    rules?: TimeRule[]
  }
  
  // Campaign tracking
  campaigns?: {
    enabled: boolean
    utmTracking: boolean
    validUtmSources: string[]
  }
  
  // Rate limiting
  rateLimiting?: {
    enabled: boolean
    rules: RateLimitRule
    botLimiting: RateLimitRule
  }
}

export interface IPRule {
  ip: string
  reason?: string
  addedAt: Date
  addedBy?: string
}

export interface TimeRule {
  days: string[]
  hours: { start: number; end: number }
  action: 'allow' | 'block' | 'redirect'
  redirectUrl?: string
}

export interface RateLimitRule {
  perIP?: { requests: number; window: number }
  perSession?: { requests: number; window: number }
  burst?: { requests: number; window: number }
}

// ============================================================================
// VISIT TYPES (Hurriyet Health inspired)
// ============================================================================

export interface Visit {
  id?: number
  timestamp: Date
  domain: string
  
  // Visitor info
  ip: string
  country?: string
  city?: string
  device_type: 'mobile' | 'desktop' | 'bot'
  browser?: string
  os?: string
  user_agent: string
  
  // Request info
  url: string
  referrer?: string
  method: string
  
  // UTM tracking
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  fbclid?: string
  
  // A/B testing
  variant?: 'A' | 'B'
  
  // Response info
  status_code: number
  response_time?: number
  bytes_sent?: number
  
  // Traffic routing (NEW)
  backend_routed?: string
  routing_reason?: string
  routing_decision?: RoutingDecision
  
  // IP rule applied
  ip_rule_applied?: 'whitelist' | 'blacklist' | 'graylist' | 'none'
  
  // Bot detection
  is_bot?: boolean
  bot_type?: 'search_engine' | 'social_crawler' | 'malicious' | 'unknown'
  bot_name?: string
  bot_confidence?: number
}

export interface RoutingDecision {
  rule_id?: number
  rule_name?: string
  rule_type: 'ip' | 'geo' | 'device' | 'time' | 'ab_test' | 'default'
  backend: string
  reason: string
  confidence?: number
  fallback?: boolean
}

// ============================================================================
// ANALYTICS TYPES (Hurriyet Health style)
// ============================================================================

export interface AnalyticsStats {
  period: '1h' | '24h' | '7d' | '30d'
  
  // Basic stats
  totalVisits: number
  uniqueIPs: number
  
  // Success/Blocked breakdown
  successRate: {
    success: number // 200 OK
    blocked: number // 301/404/502
  }
  
  // Device breakdown (Hurriyet Health style)
  byDevice: DeviceStats[]
  byDeviceStatus: DeviceStatusStats[]
  
  // Backend routing (NEW)
  byBackend?: BackendStats[]
  
  // UTM sources
  byUTMSource: UTMStats[]
  
  // A/B testing
  byVariant: VariantStats[]
  
  // Top pages
  topPages: PageStats[]
  
  // Facebook/Instagram traffic
  facebookTraffic: number
  
  // Geographic
  byCountry?: CountryStats[]
}

export interface DeviceStats {
  device_type: 'mobile' | 'desktop' | 'bot'
  count: number
}

export interface DeviceStatusStats {
  device_type: 'mobile' | 'desktop' | 'bot'
  success: number
  blocked: number
  total: number
}

export interface BackendStats {
  backend: string
  count: number
  success: number
  failed: number
  avg_response_time: number
}

export interface UTMStats {
  utm_source: string
  count: number
}

export interface VariantStats {
  variant: 'A' | 'B'
  count: number
}

export interface PageStats {
  url: string
  count: number
}

export interface CountryStats {
  country: string
  count: number
  humans: number
  bots: number
}

// ============================================================================
// ROUTING RULE TYPES
// ============================================================================

export interface RoutingRule {
  id?: number
  domain: string
  rule_name: string
  rule_type: 'device' | 'geographic' | 'ab_test' | 'time' | 'custom'
  conditions: RoutingConditions
  backend: string
  action: 'route' | 'redirect' | 'block'
  redirect_url?: string
  priority: number
  enabled: boolean
  weight?: number
  created_at?: Date
  updated_at?: Date
  created_by?: string
  hit_count?: number
  success_count?: number
  last_hit_at?: Date
}

export interface RoutingConditions {
  device?: 'mobile' | 'desktop' | 'bot'
  country?: string
  countries?: string[]
  time_range?: { start: number; end: number }
  days?: string[]
  ip_range?: string
  user_agent_pattern?: string
  referrer_pattern?: string
  custom?: Record<string, any>
}

export interface GeoRule {
  id?: number
  domain: string
  country: string
  backend: string
  redirect_url?: string
  priority: number
  enabled: boolean
  created_at?: Date
  created_by?: string
  hit_count?: number
  last_hit_at?: Date
}

// ============================================================================
// BACKEND TYPES
// ============================================================================

export interface Backend {
  id: string
  name: string
  url: string
  type: 'http' | 'https' | 'custom'
  health_check_url?: string
  health_status: 'healthy' | 'unhealthy' | 'unknown'
  last_health_check?: Date
  weight: number
  max_connections: number
  current_connections: number
  enabled: boolean
  timeout: number
  total_requests: number
  successful_requests: number
  failed_requests: number
  avg_response_time: number
  created_at?: Date
  updated_at?: Date
}

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

export interface TrafficRequest {
  url: string
  method: string
  headers: Record<string, string>
  body?: any
  ip: string
  domain: string
  timestamp: Date
}

export interface TrafficResponse {
  status: number
  headers: Record<string, string>
  body?: any
  backend: string
  response_time: number
  bytes_sent: number
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T = any> {
  success: boolean
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

// ============================================================================
// SYSTEM TYPES
// ============================================================================

export interface SystemLog {
  id?: number
  timestamp: Date
  level: 'info' | 'warning' | 'error' | 'critical'
  category: 'routing' | 'security' | 'system' | 'api'
  event_type: string
  message: string
  details?: Record<string, any>
  domain?: string
  ip?: string
  user?: string
  request_id?: string
  url?: string
}

export interface HealthCheckResult {
  backend: string
  healthy: boolean
  response_time?: number
  error?: string
  timestamp: Date
}

// ============================================================================
// USER TYPES
// ============================================================================

export interface User {
  id: string
  username: string
  email?: string
  role: 'admin' | 'user' | 'viewer'
  created_at: Date
  last_login?: Date
}

export interface Session {
  token: string
  user: User
  expires_at: Date
}
