/**
 * Rate Limiting Middleware
 * 
 * Protects API from abuse and DDoS attacks
 * Uses in-memory store (can be upgraded to Redis for distributed systems)
 * 
 * Features:
 * - IP-based rate limiting
 * - User-based rate limiting (after authentication)
 * - Configurable time windows and request limits
 * - Automatic cleanup of old entries
 * - Custom error responses
 * 
 * Usage:
 *   app.use(createRateLimiter({ windowMs: 60000, maxRequests: 100 }));
 */

// In-memory store for rate limit tracking
const requestCounts = new Map();

// Cleanup interval (remove old entries every 5 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of requestCounts.entries()) {
    if (now - data.resetTime > data.windowMs) {
      requestCounts.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Rate limiter configuration presets
 */
export const RateLimitPresets = {
  // Very strict - for sensitive endpoints
  STRICT: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 10,
    message: 'Too many requests from this IP, please try again later.'
  },
  
  // Standard - for general API endpoints
  STANDARD: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    message: 'Rate limit exceeded. Please try again later.'
  },
  
  // Relaxed - for public read-only endpoints
  RELAXED: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60,
    message: 'Rate limit exceeded. Please slow down.'
  },
  
  // Per second - for high-frequency endpoints
  PER_SECOND: {
    windowMs: 1000, // 1 second
    maxRequests: 10,
    message: 'Too many requests per second.'
  },
  
  // Per hour - for expensive operations
  PER_HOUR: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 1000,
    message: 'Hourly rate limit exceeded.'
  }
};

/**
 * Create a rate limiter middleware with custom configuration
 * 
 * @param {Object} options - Configuration options
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {number} options.maxRequests - Maximum requests per window
 * @param {string} options.message - Error message when limit exceeded
 * @param {Function} options.keyGenerator - Custom function to generate rate limit key
 * @param {boolean} options.skipSuccessfulRequests - Don't count successful requests
 * @param {boolean} options.skipFailedRequests - Don't count failed requests
 * @param {Function} options.handler - Custom handler when limit exceeded
 * @returns {Function} Express middleware function
 */
export function createRateLimiter(options = {}) {
  const config = {
    windowMs: options.windowMs || 15 * 60 * 1000, // 15 minutes default
    maxRequests: options.maxRequests || 100,
    message: options.message || 'Rate limit exceeded. Please try again later.',
    keyGenerator: options.keyGenerator || defaultKeyGenerator,
    skipSuccessfulRequests: options.skipSuccessfulRequests || false,
    skipFailedRequests: options.skipFailedRequests || false,
    handler: options.handler || defaultHandler
  };

  return async (req, res, next) => {
    const key = config.keyGenerator(req);
    const now = Date.now();

    // Get or create rate limit entry
    let rateLimitData = requestCounts.get(key);
    
    if (!rateLimitData || now - rateLimitData.resetTime > config.windowMs) {
      // Create new rate limit window
      rateLimitData = {
        count: 0,
        resetTime: now,
        windowMs: config.windowMs
      };
      requestCounts.set(key, rateLimitData);
    }

    // Increment request count
    rateLimitData.count++;

    // Calculate remaining requests and reset time
    const remainingRequests = Math.max(0, config.maxRequests - rateLimitData.count);
    const resetTime = new Date(rateLimitData.resetTime + config.windowMs);

    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', config.maxRequests);
    res.setHeader('X-RateLimit-Remaining', remainingRequests);
    res.setHeader('X-RateLimit-Reset', resetTime.toISOString());

    // Check if limit exceeded
    if (rateLimitData.count > config.maxRequests) {
      return config.handler(req, res, {
        limit: config.maxRequests,
        current: rateLimitData.count,
        resetTime: resetTime,
        message: config.message
      });
    }

    // Store original end function
    const originalEnd = res.end;
    
    // Wrap end function to handle skip options
    res.end = function(...args) {
      if (config.skipSuccessfulRequests && res.statusCode < 400) {
        rateLimitData.count--;
      }
      
      if (config.skipFailedRequests && res.statusCode >= 400) {
        rateLimitData.count--;
      }
      
      originalEnd.apply(res, args);
    };

    next();
  };
}

/**
 * Default key generator - uses IP address
 */
function defaultKeyGenerator(req) {
  // Get IP from various headers (handles proxies)
  const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() ||
             req.headers['x-real-ip'] ||
             req.connection.remoteAddress ||
             req.socket.remoteAddress ||
             req.ip;
  
  return `ratelimit:${ip}`;
}

/**
 * User-based key generator (for authenticated users)
 */
export function userKeyGenerator(req) {
  if (req.user && req.user.id) {
    return `ratelimit:user:${req.user.id}`;
  }
  return defaultKeyGenerator(req);
}

/**
 * API key-based rate limiting
 */
export function apiKeyGenerator(req) {
  const apiKey = req.headers['x-api-key'];
  if (apiKey) {
    return `ratelimit:apikey:${apiKey}`;
  }
  return defaultKeyGenerator(req);
}

/**
 * Default handler when rate limit exceeded
 */
function defaultHandler(req, res, rateLimitInfo) {
  res.status(429).json({
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: rateLimitInfo.message,
      limit: rateLimitInfo.limit,
      current: rateLimitInfo.current,
      resetTime: rateLimitInfo.resetTime
    }
  });
}

/**
 * Preset rate limiters for common use cases
 */

// Global rate limiter - applies to all routes
export const globalRateLimiter = createRateLimiter(RateLimitPresets.STANDARD);

// Strict rate limiter - for authentication endpoints
export const strictRateLimiter = createRateLimiter(RateLimitPresets.STRICT);

// Relaxed rate limiter - for public endpoints
export const relaxedRateLimiter = createRateLimiter(RateLimitPresets.RELAXED);

// Per-second rate limiter - for high-frequency endpoints
export const perSecondRateLimiter = createRateLimiter(RateLimitPresets.PER_SECOND);

// Bot detection rate limiter - very strict for bot-prone endpoints
export const botDetectionRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 20,
  message: 'Too many bot detection requests. Please slow down.',
  keyGenerator: (req) => {
    // Combine IP and User-Agent for bot detection
    const ip = defaultKeyGenerator(req);
    const ua = req.headers['user-agent'] || 'unknown';
    return `${ip}:${ua.substring(0, 50)}`;
  }
});

/**
 * Get rate limit status for a key
 */
export function getRateLimitStatus(key) {
  const data = requestCounts.get(key);
  if (!data) {
    return null;
  }
  
  return {
    count: data.count,
    resetTime: new Date(data.resetTime + data.windowMs),
    windowMs: data.windowMs
  };
}

/**
 * Reset rate limit for a specific key
 */
export function resetRateLimit(key) {
  return requestCounts.delete(key);
}

/**
 * Get all rate limit entries (for monitoring)
 */
export function getAllRateLimits() {
  const now = Date.now();
  const entries = [];
  
  for (const [key, data] of requestCounts.entries()) {
    entries.push({
      key,
      count: data.count,
      resetTime: new Date(data.resetTime + data.windowMs),
      isExpired: now - data.resetTime > data.windowMs
    });
  }
  
  return entries;
}

export default createRateLimiter;
