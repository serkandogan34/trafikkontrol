/**
 * Authentication Middleware
 * 
 * Supports two authentication methods:
 * 1. JWT Bearer Token (for user sessions)
 * 2. API Key (for programmatic access)
 * 
 * Usage:
 *   app.use(authenticate); // Protect all routes
 *   app.get('/api/resource', authenticate, handler); // Protect specific route
 */

import jwt from 'jsonwebtoken';

// Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// In-memory API key store (in production, use database)
const API_KEYS = new Map([
  ['test-api-key-12345', { name: 'Test Client', permissions: ['read', 'write'] }],
  ['demo-api-key-67890', { name: 'Demo Client', permissions: ['read'] }]
]);

/**
 * Main authentication middleware
 * Checks for JWT token or API key in request headers
 */
export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  const apiKey = req.headers['x-api-key'];

  // Try API Key authentication first
  if (apiKey) {
    return authenticateApiKey(apiKey, req, res, next);
  }

  // Try JWT authentication
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    return authenticateJWT(token, req, res, next);
  }

  // No authentication provided
  return res.status(401).json({
    success: false,
    error: {
      code: 'UNAUTHORIZED',
      message: 'Authentication required. Provide Bearer token or X-API-Key header.'
    }
  });
}

/**
 * JWT Token authentication
 */
function authenticateJWT(token, req, res, next) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Attach user info to request
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role || 'user',
      authMethod: 'jwt'
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Authentication token has expired.'
        }
      });
    }

    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid authentication token.'
      }
    });
  }
}

/**
 * API Key authentication
 */
function authenticateApiKey(apiKey, req, res, next) {
  const keyInfo = API_KEYS.get(apiKey);

  if (!keyInfo) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_API_KEY',
        message: 'Invalid API key.'
      }
    });
  }

  // Attach API key info to request
  req.user = {
    name: keyInfo.name,
    permissions: keyInfo.permissions,
    authMethod: 'api-key'
  };

  next();
}

/**
 * Optional authentication middleware
 * Continues even if authentication fails (useful for public endpoints with optional auth)
 */
export function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const apiKey = req.headers['x-api-key'];

  if (apiKey) {
    const keyInfo = API_KEYS.get(apiKey);
    if (keyInfo) {
      req.user = {
        name: keyInfo.name,
        permissions: keyInfo.permissions,
        authMethod: 'api-key'
      };
    }
  } else if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role || 'user',
        authMethod: 'jwt'
      };
    } catch (error) {
      // Ignore authentication errors for optional auth
    }
  }

  next();
}

/**
 * Role-based access control middleware
 * Usage: app.get('/admin', authenticate, requireRole('admin'), handler)
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required.'
        }
      });
    }

    const userRole = req.user.role || 'user';
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Access denied. Required role: ${allowedRoles.join(' or ')}`
        }
      });
    }

    next();
  };
}

/**
 * Permission-based access control middleware
 * Usage: app.post('/resource', authenticate, requirePermission('write'), handler)
 */
export function requirePermission(...requiredPermissions) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required.'
        }
      });
    }

    const userPermissions = req.user.permissions || [];
    
    const hasPermission = requiredPermissions.every(perm => 
      userPermissions.includes(perm)
    );

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Missing required permissions: ${requiredPermissions.join(', ')}`
        }
      });
    }

    next();
  };
}

/**
 * Generate JWT token
 * Used during login/registration
 */
export function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });
}

/**
 * Verify JWT token
 * Can be used for custom verification logic
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Add new API key (for admin use)
 */
export function addApiKey(key, info) {
  API_KEYS.set(key, info);
}

/**
 * Remove API key (for admin use)
 */
export function removeApiKey(key) {
  return API_KEYS.delete(key);
}

/**
 * Get all API keys (for admin use)
 */
export function listApiKeys() {
  return Array.from(API_KEYS.entries()).map(([key, info]) => ({
    key: key.substring(0, 8) + '...',
    ...info
  }));
}

export default authenticate;
