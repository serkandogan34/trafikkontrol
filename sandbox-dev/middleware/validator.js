/**
 * Request Validation Middleware
 * 
 * Validates request data (body, query, params) against schemas
 * Sanitizes input to prevent injection attacks
 * Provides reusable validation schemas
 * 
 * Usage:
 *   app.post('/api/domains', validate(DomainSchemas.create), handler);
 */

import { ValidationError } from './errorHandler.js';

/**
 * Main validation middleware factory
 * 
 * @param {Object} schema - Validation schema
 * @param {string} source - Where to validate ('body', 'query', 'params', 'headers')
 * @returns {Function} Express middleware
 */
export function validate(schema, source = 'body') {
  return (req, res, next) => {
    try {
      const data = req[source];
      const validated = validateSchema(data, schema);
      req[source] = validated; // Replace with validated/sanitized data
      next();
    } catch (error) {
      if (error instanceof ValidationError) {
        next(error);
      } else {
        next(new ValidationError('Validation failed', { message: error.message }));
      }
    }
  };
}

/**
 * Validate data against schema
 */
function validateSchema(data, schema) {
  const result = {};
  const errors = [];

  // Validate required fields
  if (schema.required) {
    for (const field of schema.required) {
      if (!(field in data) || data[field] === null || data[field] === undefined || data[field] === '') {
        errors.push({
          field,
          message: `Field '${field}' is required`,
          type: 'required'
        });
      }
    }
  }

  // Validate each field
  for (const [field, rules] of Object.entries(schema.fields || {})) {
    const value = data[field];

    // Skip if optional and not provided
    if (!schema.required?.includes(field) && (value === undefined || value === null)) {
      continue;
    }

    try {
      result[field] = validateField(field, value, rules);
    } catch (error) {
      errors.push({
        field,
        message: error.message,
        type: error.type || 'validation'
      });
    }
  }

  // Throw if any errors
  if (errors.length > 0) {
    throw new ValidationError('Validation failed', errors);
  }

  return result;
}

/**
 * Validate a single field against rules
 */
function validateField(field, value, rules) {
  let validatedValue = value;

  // Type validation
  if (rules.type) {
    validatedValue = validateType(field, value, rules.type);
  }

  // String validations
  if (rules.type === 'string') {
    if (rules.minLength && validatedValue.length < rules.minLength) {
      throw { message: `${field} must be at least ${rules.minLength} characters`, type: 'minLength' };
    }
    if (rules.maxLength && validatedValue.length > rules.maxLength) {
      throw { message: `${field} must not exceed ${rules.maxLength} characters`, type: 'maxLength' };
    }
    if (rules.pattern && !rules.pattern.test(validatedValue)) {
      throw { message: `${field} format is invalid`, type: 'pattern' };
    }
    if (rules.email && !isValidEmail(validatedValue)) {
      throw { message: `${field} must be a valid email`, type: 'email' };
    }
    if (rules.url && !isValidUrl(validatedValue)) {
      throw { message: `${field} must be a valid URL`, type: 'url' };
    }
    if (rules.trim) {
      validatedValue = validatedValue.trim();
    }
    if (rules.lowercase) {
      validatedValue = validatedValue.toLowerCase();
    }
    if (rules.uppercase) {
      validatedValue = validatedValue.toUpperCase();
    }
  }

  // Number validations
  if (rules.type === 'number' || rules.type === 'integer') {
    if (rules.min !== undefined && validatedValue < rules.min) {
      throw { message: `${field} must be at least ${rules.min}`, type: 'min' };
    }
    if (rules.max !== undefined && validatedValue > rules.max) {
      throw { message: `${field} must not exceed ${rules.max}`, type: 'max' };
    }
    if (rules.positive && validatedValue <= 0) {
      throw { message: `${field} must be positive`, type: 'positive' };
    }
  }

  // Array validations
  if (rules.type === 'array') {
    if (rules.minLength && validatedValue.length < rules.minLength) {
      throw { message: `${field} must have at least ${rules.minLength} items`, type: 'minLength' };
    }
    if (rules.maxLength && validatedValue.length > rules.maxLength) {
      throw { message: `${field} must not exceed ${rules.maxLength} items`, type: 'maxLength' };
    }
    if (rules.items) {
      validatedValue = validatedValue.map((item, index) => 
        validateField(`${field}[${index}]`, item, rules.items)
      );
    }
  }

  // Enum validation
  if (rules.enum && !rules.enum.includes(validatedValue)) {
    throw { message: `${field} must be one of: ${rules.enum.join(', ')}`, type: 'enum' };
  }

  // Custom validation
  if (rules.custom) {
    const customResult = rules.custom(validatedValue);
    if (customResult !== true) {
      throw { message: customResult || `${field} validation failed`, type: 'custom' };
    }
  }

  return validatedValue;
}

/**
 * Type validation and conversion
 */
function validateType(field, value, type) {
  switch (type) {
    case 'string':
      if (typeof value !== 'string') {
        throw { message: `${field} must be a string`, type: 'type' };
      }
      return value;

    case 'number':
      const num = Number(value);
      if (isNaN(num)) {
        throw { message: `${field} must be a number`, type: 'type' };
      }
      return num;

    case 'integer':
      const int = parseInt(value, 10);
      if (isNaN(int) || int !== Number(value)) {
        throw { message: `${field} must be an integer`, type: 'type' };
      }
      return int;

    case 'boolean':
      if (typeof value === 'boolean') return value;
      if (value === 'true' || value === '1' || value === 1) return true;
      if (value === 'false' || value === '0' || value === 0) return false;
      throw { message: `${field} must be a boolean`, type: 'type' };

    case 'array':
      if (!Array.isArray(value)) {
        throw { message: `${field} must be an array`, type: 'type' };
      }
      return value;

    case 'object':
      if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        throw { message: `${field} must be an object`, type: 'type' };
      }
      return value;

    case 'date':
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw { message: `${field} must be a valid date`, type: 'type' };
      }
      return date.toISOString();

    default:
      return value;
  }
}

/**
 * Email validation
 */
function isValidEmail(email) {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern.test(email);
}

/**
 * URL validation
 */
function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitize string to prevent XSS
 */
function sanitizeString(str) {
  return str
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .trim();
}

/**
 * Pre-defined validation schemas
 */

// Domain validation schemas
export const DomainSchemas = {
  create: {
    required: ['name', 'mainBackendUrl'],
    fields: {
      name: {
        type: 'string',
        minLength: 3,
        maxLength: 255,
        trim: true,
        lowercase: true,
        pattern: /^[a-z0-9.-]+$/
      },
      mainBackendUrl: {
        type: 'string',
        url: true,
        trim: true
      },
      aggressiveBackendUrl: {
        type: 'string',
        url: true,
        trim: true
      },
      grayBackendUrl: {
        type: 'string',
        url: true,
        trim: true
      },
      trafficSplit: {
        type: 'object'
      },
      status: {
        type: 'string',
        enum: ['active', 'inactive', 'maintenance']
      }
    }
  },

  update: {
    fields: {
      name: {
        type: 'string',
        minLength: 3,
        maxLength: 255,
        trim: true,
        lowercase: true
      },
      mainBackendUrl: {
        type: 'string',
        url: true
      },
      status: {
        type: 'string',
        enum: ['active', 'inactive', 'maintenance']
      }
    }
  }
};

// Bot detection validation schema
export const BotDetectionSchema = {
  required: ['user_agent', 'ip'],
  fields: {
    user_agent: {
      type: 'string',
      maxLength: 500,
      trim: true
    },
    ip: {
      type: 'string',
      pattern: /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/,
      custom: (value) => {
        // Basic IP validation
        const parts = value.split('.');
        return parts.length === 4 && parts.every(p => parseInt(p) >= 0 && parseInt(p) <= 255) || 'Invalid IP address';
      }
    },
    headers: {
      type: 'object'
    },
    fingerprint: {
      type: 'string',
      maxLength: 100
    },
    behavior_data: {
      type: 'object'
    }
  }
};

// Traffic routing validation schema
export const TrafficRoutingSchema = {
  required: ['domain_name', 'visitor_ip', 'user_agent'],
  fields: {
    domain_name: {
      type: 'string',
      minLength: 3,
      maxLength: 255,
      trim: true
    },
    visitor_ip: {
      type: 'string',
      pattern: /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/
    },
    user_agent: {
      type: 'string',
      maxLength: 500
    },
    bot_score: {
      type: 'number',
      min: 0,
      max: 100
    }
  }
};

// Pagination validation schema
export const PaginationSchema = {
  fields: {
    page: {
      type: 'integer',
      min: 1
    },
    limit: {
      type: 'integer',
      min: 1,
      max: 100
    }
  }
};

export default validate;
