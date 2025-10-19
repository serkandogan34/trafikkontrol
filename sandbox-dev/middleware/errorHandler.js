/**
 * Error Handling Middleware
 * 
 * Centralized error handling for the entire application
 * Converts all errors to consistent JSON responses
 * Logs errors for monitoring and debugging
 * 
 * Features:
 * - Custom error classes for different error types
 * - Automatic error logging
 * - Stack trace hiding in production
 * - HTTP status code mapping
 * - Detailed error context
 */

/**
 * Custom Error Classes
 */

export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, 409, 'CONFLICT');
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded', resetTime = null) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED', { resetTime });
  }
}

export class DatabaseError extends AppError {
  constructor(message = 'Database operation failed', originalError = null) {
    super(message, 500, 'DATABASE_ERROR', { originalError: originalError?.message });
  }
}

export class ExternalServiceError extends AppError {
  constructor(service, message = 'External service error') {
    super(message, 503, 'EXTERNAL_SERVICE_ERROR', { service });
  }
}

/**
 * Main error handler middleware
 * This should be the last middleware in the chain
 */
export function errorHandler(err, req, res, next) {
  // Default values
  let statusCode = err.statusCode || 500;
  let code = err.code || 'INTERNAL_ERROR';
  let message = err.message || 'An unexpected error occurred';
  let details = err.details || null;

  // Handle specific error types
  if (err.name === 'ValidationError' && err.errors) {
    // Mongoose/Joi validation errors
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    details = Object.keys(err.errors).map(key => ({
      field: key,
      message: err.errors[key].message
    }));
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = 'INVALID_TOKEN';
    message = 'Invalid authentication token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'TOKEN_EXPIRED';
    message = 'Authentication token has expired';
  } else if (err.name === 'SyntaxError' && err.status === 400 && 'body' in err) {
    statusCode = 400;
    code = 'INVALID_JSON';
    message = 'Invalid JSON in request body';
  }

  // Log error (in production, this should go to a logging service)
  logError(err, req);

  // Prepare error response
  const errorResponse = {
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
      ...(req.requestId && { requestId: req.requestId })
    }
  };

  // Include stack trace in development
  if (process.env.NODE_ENV !== 'production' && err.stack) {
    errorResponse.error.stack = err.stack.split('\n').map(line => line.trim());
  }

  // Send error response
  res.status(statusCode).json(errorResponse);
}

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors automatically
 * 
 * Usage:
 *   app.get('/route', asyncHandler(async (req, res) => {
 *     const data = await someAsyncOperation();
 *     res.json(data);
 *   }));
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * 404 Not Found handler
 * Should be placed before error handler middleware
 */
export function notFoundHandler(req, res, next) {
  const error = new NotFoundError(`Route ${req.method} ${req.path}`);
  next(error);
}

/**
 * Error logger
 */
function logError(err, req) {
  const errorLog = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.headers['user-agent'],
    error: {
      name: err.name,
      message: err.message,
      code: err.code,
      statusCode: err.statusCode,
      stack: err.stack
    }
  };

  // In production, send to logging service (e.g., Winston, Sentry)
  if (err.statusCode >= 500) {
    console.error('❌ Server Error:', JSON.stringify(errorLog, null, 2));
  } else {
    console.warn('⚠️  Client Error:', JSON.stringify(errorLog, null, 2));
  }
}

/**
 * Validation helper
 * Validates data against a schema and throws ValidationError if invalid
 */
export function validate(data, schema, options = {}) {
  // This is a placeholder - implement with Joi or Zod
  // For now, just basic validation
  if (schema.required) {
    for (const field of schema.required) {
      if (!(field in data) || data[field] === null || data[field] === undefined) {
        throw new ValidationError(`Field '${field}' is required`, {
          field,
          type: 'required'
        });
      }
    }
  }

  return data;
}

/**
 * Safe JSON parse with error handling
 */
export function safeJsonParse(str, fallback = null) {
  try {
    return JSON.parse(str);
  } catch (error) {
    return fallback;
  }
}

/**
 * Error response helper for route handlers
 */
export function sendError(res, statusCode, code, message, details = null) {
  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(details && { details })
    }
  });
}

/**
 * Database error handler
 * Converts database errors to AppErrors
 */
export function handleDatabaseError(error, operation = 'Database operation') {
  // SQLite specific errors
  if (error.code === 'SQLITE_CONSTRAINT') {
    if (error.message.includes('UNIQUE')) {
      throw new ConflictError('A record with this value already exists');
    }
    if (error.message.includes('FOREIGN KEY')) {
      throw new ValidationError('Invalid reference to related record');
    }
    throw new ValidationError('Database constraint violation');
  }

  if (error.code === 'SQLITE_ERROR') {
    throw new DatabaseError(`${operation} failed: ${error.message}`, error);
  }

  // Generic database error
  throw new DatabaseError(`${operation} failed`, error);
}

/**
 * Request ID middleware
 * Adds unique request ID for tracking
 */
export function requestIdMiddleware(req, res, next) {
  req.requestId = req.headers['x-request-id'] || generateRequestId();
  res.setHeader('X-Request-Id', req.requestId);
  next();
}

function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export default errorHandler;
