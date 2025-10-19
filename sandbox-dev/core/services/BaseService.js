/**
 * BaseService - Abstract base class for all business logic services
 * 
 * Provides common functionality:
 * - Repository access
 * - Error handling
 * - Logging
 * - Transaction support
 * - Validation
 * 
 * @abstract
 */

export default class BaseService {
  /**
   * Constructor
   * @param {Database} db - Database instance
   */
  constructor(db) {
    if (!db) {
      throw new Error('Database instance is required');
    }
    
    this.db = db;
    this.repositories = {};
  }

  /**
   * Register a repository for use in this service
   * @param {string} name - Repository name
   * @param {BaseRepository} repository - Repository instance
   */
  registerRepository(name, repository) {
    this.repositories[name] = repository;
  }

  /**
   * Get a registered repository
   * @param {string} name - Repository name
   * @returns {BaseRepository}
   */
  getRepository(name) {
    if (!this.repositories[name]) {
      throw new Error(`Repository '${name}' not registered`);
    }
    return this.repositories[name];
  }

  /**
   * Execute function in transaction
   * @param {Function} fn - Function to execute
   * @returns {*} - Return value of function
   */
  async transaction(fn) {
    try {
      this.db.prepare('BEGIN TRANSACTION').run();
      const result = await fn();
      this.db.prepare('COMMIT').run();
      return result;
    } catch (error) {
      this.db.prepare('ROLLBACK').run();
      throw error;
    }
  }

  /**
   * Log info message
   * @param {string} message
   * @param {Object} meta
   */
  logInfo(message, meta = {}) {
    console.log(`[INFO] [${this.constructor.name}] ${message}`, meta);
  }

  /**
   * Log error message
   * @param {string} message
   * @param {Error} error
   */
  logError(message, error) {
    console.error(`[ERROR] [${this.constructor.name}] ${message}`, {
      error: error.message,
      stack: error.stack
    });
  }

  /**
   * Handle service error
   * @param {Error} error
   * @param {string} context
   * @throws {Error}
   */
  handleError(error, context) {
    this.logError(`Error in ${context}`, error);
    
    // Re-throw with context
    const serviceError = new Error(`${context}: ${error.message}`);
    serviceError.originalError = error;
    serviceError.context = context;
    throw serviceError;
  }

  /**
   * Validate input data
   * @param {Object} data - Data to validate
   * @param {Object} rules - Validation rules
   * @returns {Object} - { valid: boolean, errors: Array }
   */
  validate(data, rules) {
    const errors = [];
    
    for (const [field, rule] of Object.entries(rules)) {
      const value = data[field];
      
      // Required check
      if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push(`Field '${field}' is required`);
        continue;
      }
      
      // Type check
      if (value !== undefined && value !== null && rule.type) {
        const actualType = typeof value;
        if (actualType !== rule.type) {
          errors.push(`Field '${field}' must be of type ${rule.type}, got ${actualType}`);
        }
      }
      
      // Custom validator
      if (rule.validator && typeof rule.validator === 'function') {
        const error = rule.validator(value);
        if (error) {
          errors.push(`Field '${field}': ${error}`);
        }
      }
      
      // Min/Max for numbers
      if (typeof value === 'number') {
        if (rule.min !== undefined && value < rule.min) {
          errors.push(`Field '${field}' must be at least ${rule.min}`);
        }
        if (rule.max !== undefined && value > rule.max) {
          errors.push(`Field '${field}' must be at most ${rule.max}`);
        }
      }
      
      // Length check for strings
      if (typeof value === 'string') {
        if (rule.minLength && value.length < rule.minLength) {
          errors.push(`Field '${field}' must be at least ${rule.minLength} characters`);
        }
        if (rule.maxLength && value.length > rule.maxLength) {
          errors.push(`Field '${field}' must be at most ${rule.maxLength} characters`);
        }
      }
      
      // Enum check
      if (rule.enum && !rule.enum.includes(value)) {
        errors.push(`Field '${field}' must be one of: ${rule.enum.join(', ')}`);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Assert that condition is true
   * @param {boolean} condition
   * @param {string} message
   * @throws {Error}
   */
  assert(condition, message) {
    if (!condition) {
      throw new Error(message);
    }
  }

  /**
   * Get current timestamp
   * @returns {string}
   */
  getCurrentTimestamp() {
    return new Date().toISOString();
  }

  /**
   * Sleep for specified milliseconds
   * @param {number} ms
   * @returns {Promise}
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate unique ID
   * @returns {string}
   */
  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
