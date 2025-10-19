/**
 * Middleware Layer - Phase 4
 * 
 * Centralized export for all middleware modules
 * 
 * Usage:
 *   import { authenticate, rateLimiter, errorHandler } from './middleware/index.js';
 */

// Authentication
export {
  authenticate,
  optionalAuth,
  requireRole,
  requirePermission,
  generateToken,
  verifyToken,
  addApiKey,
  removeApiKey,
  listApiKeys
} from './auth.js';

// Rate Limiting
export {
  createRateLimiter,
  RateLimitPresets,
  globalRateLimiter,
  strictRateLimiter,
  relaxedRateLimiter,
  perSecondRateLimiter,
  botDetectionRateLimiter,
  userKeyGenerator,
  apiKeyGenerator,
  getRateLimitStatus,
  resetRateLimit,
  getAllRateLimits
} from './rateLimiter.js';

// Error Handling
export {
  errorHandler,
  asyncHandler,
  notFoundHandler,
  requestIdMiddleware,
  sendError,
  handleDatabaseError,
  validate as validateData,
  safeJsonParse,
  // Error classes
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  DatabaseError,
  ExternalServiceError
} from './errorHandler.js';

// Request Validation
export {
  validate,
  DomainSchemas,
  BotDetectionSchema,
  TrafficRoutingSchema,
  PaginationSchema
} from './validator.js';

// Security
export {
  cors,
  securityHeaders,
  sanitizeRequest,
  ipFilter,
  requestSizeLimit,
  secure,
  validateApiKey
} from './security.js';

// Logging
export {
  requestLogger,
  errorLogger,
  configureLogger,
  createLogger,
  logger,
  LogLevels
} from './logger.js';

/**
 * Default middleware stack for quick setup
 * 
 * Usage:
 *   import { applyDefaultMiddleware } from './middleware/index.js';
 *   applyDefaultMiddleware(app);
 */
export function applyDefaultMiddleware(app, options = {}) {
  const {
    cors: corsEnabled = true,
    security: securityEnabled = true,
    rateLimit: rateLimitEnabled = true,
    logging: loggingEnabled = true,
    errorHandling: errorHandlingEnabled = true
  } = options;

  // Import required modules
  const { cors: corsMiddleware, securityHeaders, sanitizeRequest } = require('./security.js');
  const { requestLogger } = require('./logger.js');
  const { globalRateLimiter } = require('./rateLimiter.js');
  const { errorHandler, notFoundHandler, requestIdMiddleware } = require('./errorHandler.js');

  // Request ID
  app.use(requestIdMiddleware);

  // Logging
  if (loggingEnabled) {
    app.use(requestLogger());
  }

  // CORS
  if (corsEnabled) {
    app.use(corsMiddleware());
  }

  // Security Headers
  if (securityEnabled) {
    app.use(securityHeaders());
    app.use(sanitizeRequest);
  }

  // Rate Limiting
  if (rateLimitEnabled) {
    app.use(globalRateLimiter);
  }

  // Note: Route handlers go here

  // 404 Handler (add this after all routes)
  if (errorHandlingEnabled) {
    app.use(notFoundHandler);
  }

  // Error Handler (must be last)
  if (errorHandlingEnabled) {
    app.use(errorHandler);
  }

  return app;
}

/**
 * Production-ready middleware stack
 */
export function applyProductionMiddleware(app) {
  return applyDefaultMiddleware(app, {
    cors: true,
    security: true,
    rateLimit: true,
    logging: true,
    errorHandling: true
  });
}

/**
 * Development middleware stack (more relaxed)
 */
export function applyDevelopmentMiddleware(app) {
  return applyDefaultMiddleware(app, {
    cors: true,
    security: false, // Disable some security features for easier development
    rateLimit: false, // Disable rate limiting in development
    logging: true,
    errorHandling: true
  });
}

export default {
  applyDefaultMiddleware,
  applyProductionMiddleware,
  applyDevelopmentMiddleware
};
