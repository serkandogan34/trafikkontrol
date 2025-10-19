/**
 * Security Middleware
 * 
 * Provides essential security headers and protections:
 * - CORS configuration
 * - Security headers (XSS, CSP, HSTS, etc.)
 * - Request sanitization
 * - IP filtering
 * 
 * This is a lightweight alternative to Helmet.js
 */

/**
 * CORS Middleware
 * Handles Cross-Origin Resource Sharing
 */
export function cors(options = {}) {
  const config = {
    origin: options.origin || '*',
    methods: options.methods || ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: options.allowedHeaders || ['Content-Type', 'Authorization', 'X-API-Key', 'X-Request-Id'],
    exposedHeaders: options.exposedHeaders || ['X-Request-Id', 'X-RateLimit-Limit', 'X-RateLimit-Remaining'],
    credentials: options.credentials || true,
    maxAge: options.maxAge || 86400, // 24 hours
    preflightContinue: options.preflightContinue || false
  };

  return (req, res, next) => {
    const origin = req.headers.origin;

    // Handle origin
    if (config.origin === '*') {
      res.setHeader('Access-Control-Allow-Origin', '*');
    } else if (typeof config.origin === 'string') {
      res.setHeader('Access-Control-Allow-Origin', config.origin);
    } else if (Array.isArray(config.origin)) {
      if (origin && config.origin.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
      }
    } else if (typeof config.origin === 'function') {
      const allowed = config.origin(origin, req);
      if (allowed) {
        res.setHeader('Access-Control-Allow-Origin', origin || '*');
      }
    }

    // Set other CORS headers
    res.setHeader('Access-Control-Allow-Methods', config.methods.join(', '));
    res.setHeader('Access-Control-Allow-Headers', config.allowedHeaders.join(', '));
    res.setHeader('Access-Control-Expose-Headers', config.exposedHeaders.join(', '));
    
    if (config.credentials) {
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
    
    if (config.maxAge) {
      res.setHeader('Access-Control-Max-Age', config.maxAge);
    }

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      if (config.preflightContinue) {
        next();
      } else {
        res.status(204).end();
      }
    } else {
      next();
    }
  };
}

/**
 * Security Headers Middleware
 * Adds essential security headers (similar to Helmet.js)
 */
export function securityHeaders(options = {}) {
  const config = {
    // Content Security Policy
    csp: options.csp !== false,
    cspDirectives: options.cspDirectives || {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    },

    // HSTS (HTTP Strict Transport Security)
    hsts: options.hsts !== false,
    hstsMaxAge: options.hstsMaxAge || 31536000, // 1 year
    hstsIncludeSubDomains: options.hstsIncludeSubDomains !== false,
    hstsPreload: options.hstsPreload || false,

    // Other security headers
    noSniff: options.noSniff !== false, // X-Content-Type-Options
    frameguard: options.frameguard !== false, // X-Frame-Options
    xssFilter: options.xssFilter !== false, // X-XSS-Protection
    hidePoweredBy: options.hidePoweredBy !== false, // Remove X-Powered-By
    referrerPolicy: options.referrerPolicy || 'strict-origin-when-cross-origin'
  };

  return (req, res, next) => {
    // Content Security Policy
    if (config.csp) {
      const cspString = Object.entries(config.cspDirectives)
        .map(([key, values]) => {
          const directive = key.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`);
          return `${directive} ${values.join(' ')}`;
        })
        .join('; ');
      res.setHeader('Content-Security-Policy', cspString);
    }

    // HSTS
    if (config.hsts && req.secure) {
      let hstsValue = `max-age=${config.hstsMaxAge}`;
      if (config.hstsIncludeSubDomains) {
        hstsValue += '; includeSubDomains';
      }
      if (config.hstsPreload) {
        hstsValue += '; preload';
      }
      res.setHeader('Strict-Transport-Security', hstsValue);
    }

    // X-Content-Type-Options
    if (config.noSniff) {
      res.setHeader('X-Content-Type-Options', 'nosniff');
    }

    // X-Frame-Options
    if (config.frameguard) {
      res.setHeader('X-Frame-Options', 'DENY');
    }

    // X-XSS-Protection
    if (config.xssFilter) {
      res.setHeader('X-XSS-Protection', '1; mode=block');
    }

    // Remove X-Powered-By
    if (config.hidePoweredBy) {
      res.removeHeader('X-Powered-By');
    }

    // Referrer-Policy
    if (config.referrerPolicy) {
      res.setHeader('Referrer-Policy', config.referrerPolicy);
    }

    // Additional security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-DNS-Prefetch-Control', 'off');
    res.setHeader('X-Download-Options', 'noopen');
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');

    next();
  };
}

/**
 * Request Sanitization Middleware
 * Sanitizes user input to prevent injection attacks
 */
export function sanitizeRequest(req, res, next) {
  // Sanitize query parameters
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  // Sanitize body
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize params
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }

  next();
}

/**
 * Sanitize an object recursively
 */
function sanitizeObject(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return sanitizeValue(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    sanitized[key] = sanitizeObject(value);
  }
  return sanitized;
}

/**
 * Sanitize a single value
 */
function sanitizeValue(value) {
  if (typeof value !== 'string') {
    return value;
  }

  // Remove potentially dangerous characters
  return value
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
}

/**
 * IP Whitelist/Blacklist Middleware
 */
export function ipFilter(options = {}) {
  const whitelist = options.whitelist || [];
  const blacklist = options.blacklist || [];
  const mode = options.mode || 'blacklist'; // 'whitelist' or 'blacklist'

  return (req, res, next) => {
    const ip = getClientIp(req);

    if (mode === 'whitelist') {
      if (whitelist.length > 0 && !whitelist.includes(ip)) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'IP_NOT_ALLOWED',
            message: 'Your IP address is not allowed to access this resource'
          }
        });
      }
    } else if (mode === 'blacklist') {
      if (blacklist.includes(ip)) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'IP_BLOCKED',
            message: 'Your IP address has been blocked'
          }
        });
      }
    }

    next();
  };
}

/**
 * Get client IP address
 */
function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0].trim() ||
         req.headers['x-real-ip'] ||
         req.connection.remoteAddress ||
         req.socket.remoteAddress ||
         req.ip;
}

/**
 * Request size limiter
 * Prevents large payload attacks
 */
export function requestSizeLimit(options = {}) {
  const maxSize = options.maxSize || 10 * 1024 * 1024; // 10MB default

  return (req, res, next) => {
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);

    if (contentLength > maxSize) {
      return res.status(413).json({
        success: false,
        error: {
          code: 'PAYLOAD_TOO_LARGE',
          message: `Request payload too large. Maximum size: ${maxSize} bytes`,
          maxSize,
          actualSize: contentLength
        }
      });
    }

    next();
  };
}

/**
 * Combined security middleware
 * Applies all security measures at once
 */
export function secure(options = {}) {
  const middlewares = [
    cors(options.cors),
    securityHeaders(options.headers),
    sanitizeRequest,
    requestSizeLimit(options.sizeLimit)
  ];

  if (options.ipFilter) {
    middlewares.push(ipFilter(options.ipFilter));
  }

  return (req, res, next) => {
    let index = 0;

    const runNext = (err) => {
      if (err) return next(err);
      if (index >= middlewares.length) return next();
      
      const middleware = middlewares[index++];
      middleware(req, res, runNext);
    };

    runNext();
  };
}

/**
 * API Key validation middleware
 */
export function validateApiKey(validKeys = []) {
  return (req, res, next) => {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'MISSING_API_KEY',
          message: 'API key is required. Provide X-API-Key header.'
        }
      });
    }

    if (!validKeys.includes(apiKey)) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_API_KEY',
          message: 'Invalid API key'
        }
      });
    }

    next();
  };
}

export default secure;
