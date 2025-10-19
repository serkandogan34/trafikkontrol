/**
 * Logging Middleware
 * 
 * Provides request/response logging with multiple formats
 * Lightweight alternative to Morgan + Winston
 * 
 * Features:
 * - Multiple log formats (dev, combined, json)
 * - Colorized console output
 * - Response time tracking
 * - Request ID tracking
 * - Error logging
 * - File logging support
 */

import fs from 'fs';
import path from 'path';

/**
 * Log levels
 */
export const LogLevels = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug'
};

/**
 * Colors for console output
 */
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m'
};

/**
 * Logger configuration
 */
let loggerConfig = {
  format: 'dev', // 'dev', 'combined', 'json'
  colorize: true,
  logFile: null,
  logLevel: LogLevels.INFO,
  includeHeaders: false,
  includeBody: false
};

/**
 * Configure logger
 */
export function configureLogger(options = {}) {
  loggerConfig = { ...loggerConfig, ...options };
  
  // Create log file if specified
  if (loggerConfig.logFile) {
    const logDir = path.dirname(loggerConfig.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }
}

/**
 * Request logging middleware
 */
export function requestLogger(format = 'dev') {
  return (req, res, next) => {
    const startTime = Date.now();
    
    // Capture original end function
    const originalEnd = res.end;
    
    // Override end function
    res.end = function(...args) {
      // Calculate response time
      const responseTime = Date.now() - startTime;
      
      // Create log entry
      const logEntry = createLogEntry(req, res, responseTime, format);
      
      // Write log
      writeLog(logEntry, format);
      
      // Call original end
      originalEnd.apply(res, args);
    };
    
    next();
  };
}

/**
 * Create log entry based on format
 */
function createLogEntry(req, res, responseTime, format) {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl || req.url;
  const status = res.statusCode;
  const contentLength = res.getHeader('content-length') || '-';
  const userAgent = req.headers['user-agent'] || '-';
  const ip = getClientIp(req);
  const requestId = req.requestId || '-';
  
  switch (format) {
    case 'dev':
      return {
        timestamp,
        method,
        url,
        status,
        responseTime: `${responseTime}ms`,
        requestId
      };
    
    case 'combined':
      return {
        timestamp,
        ip,
        method,
        url,
        status,
        contentLength,
        userAgent,
        responseTime: `${responseTime}ms`,
        requestId
      };
    
    case 'json':
      return {
        timestamp,
        request: {
          method,
          url,
          headers: loggerConfig.includeHeaders ? req.headers : undefined,
          body: loggerConfig.includeBody ? req.body : undefined,
          ip,
          requestId
        },
        response: {
          status,
          contentLength,
          responseTime
        }
      };
    
    default:
      return { timestamp, method, url, status, responseTime };
  }
}

/**
 * Write log to console and/or file
 */
function writeLog(logEntry, format) {
  // Console output
  if (format === 'dev') {
    console.log(formatDevLog(logEntry));
  } else if (format === 'json') {
    console.log(JSON.stringify(logEntry));
  } else {
    console.log(formatCombinedLog(logEntry));
  }
  
  // File output
  if (loggerConfig.logFile) {
    const logLine = JSON.stringify(logEntry) + '\n';
    fs.appendFileSync(loggerConfig.logFile, logLine);
  }
}

/**
 * Format dev log with colors
 */
function formatDevLog(entry) {
  const { method, url, status, responseTime, requestId } = entry;
  
  if (!loggerConfig.colorize) {
    return `${method} ${url} ${status} ${responseTime} [${requestId}]`;
  }
  
  // Method color
  const methodColor = method === 'GET' ? colors.green :
                      method === 'POST' ? colors.blue :
                      method === 'PUT' ? colors.yellow :
                      method === 'DELETE' ? colors.red :
                      colors.white;
  
  // Status color
  const statusColor = status >= 500 ? colors.red :
                      status >= 400 ? colors.yellow :
                      status >= 300 ? colors.cyan :
                      status >= 200 ? colors.green :
                      colors.white;
  
  // Response time color
  const timeColor = parseInt(responseTime) > 1000 ? colors.red :
                    parseInt(responseTime) > 500 ? colors.yellow :
                    colors.green;
  
  return `${methodColor}${method}${colors.reset} ` +
         `${colors.white}${url}${colors.reset} ` +
         `${statusColor}${status}${colors.reset} ` +
         `${timeColor}${responseTime}${colors.reset} ` +
         `${colors.dim}[${requestId}]${colors.reset}`;
}

/**
 * Format combined log
 */
function formatCombinedLog(entry) {
  const { timestamp, ip, method, url, status, contentLength, userAgent, responseTime, requestId } = entry;
  return `${timestamp} ${ip} "${method} ${url}" ${status} ${contentLength} "${userAgent}" ${responseTime} [${requestId}]`;
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
 * Structured logger for application logs
 */
export class Logger {
  constructor(name = 'app') {
    this.name = name;
  }
  
  log(level, message, meta = {}) {
    if (!this.shouldLog(level)) {
      return;
    }
    
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      logger: this.name,
      message,
      ...meta
    };
    
    // Console output
    this.writeToConsole(level, logEntry);
    
    // File output
    if (loggerConfig.logFile) {
      fs.appendFileSync(loggerConfig.logFile, JSON.stringify(logEntry) + '\n');
    }
  }
  
  shouldLog(level) {
    const levels = [LogLevels.ERROR, LogLevels.WARN, LogLevels.INFO, LogLevels.DEBUG];
    const configLevelIndex = levels.indexOf(loggerConfig.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex <= configLevelIndex;
  }
  
  writeToConsole(level, entry) {
    if (!loggerConfig.colorize) {
      console.log(`[${entry.level.toUpperCase()}] ${entry.message}`, entry);
      return;
    }
    
    const levelColors = {
      [LogLevels.ERROR]: colors.red,
      [LogLevels.WARN]: colors.yellow,
      [LogLevels.INFO]: colors.blue,
      [LogLevels.DEBUG]: colors.cyan
    };
    
    const color = levelColors[level] || colors.white;
    const timestamp = colors.dim + entry.timestamp + colors.reset;
    const levelStr = color + level.toUpperCase().padEnd(5) + colors.reset;
    const logger = colors.magenta + entry.logger + colors.reset;
    
    console.log(`${timestamp} ${levelStr} [${logger}] ${entry.message}`);
    
    // Print meta if available
    const { timestamp: _, level: __, logger: ___, message: ____, ...meta } = entry;
    if (Object.keys(meta).length > 0) {
      console.log(colors.dim + JSON.stringify(meta, null, 2) + colors.reset);
    }
  }
  
  error(message, meta = {}) {
    this.log(LogLevels.ERROR, message, meta);
  }
  
  warn(message, meta = {}) {
    this.log(LogLevels.WARN, message, meta);
  }
  
  info(message, meta = {}) {
    this.log(LogLevels.INFO, message, meta);
  }
  
  debug(message, meta = {}) {
    this.log(LogLevels.DEBUG, message, meta);
  }
}

/**
 * Create a logger instance
 */
export function createLogger(name) {
  return new Logger(name);
}

/**
 * Default logger instance
 */
export const logger = new Logger('app');

/**
 * Error logging middleware
 */
export function errorLogger(err, req, res, next) {
  logger.error('Request error', {
    error: {
      name: err.name,
      message: err.message,
      code: err.code,
      statusCode: err.statusCode,
      stack: err.stack
    },
    request: {
      method: req.method,
      url: req.url,
      ip: getClientIp(req),
      requestId: req.requestId
    }
  });
  
  next(err);
}

export default requestLogger;
