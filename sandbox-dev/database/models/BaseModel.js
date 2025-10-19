/**
 * BaseModel - Abstract base class for all database models
 * 
 * Provides common functionality:
 * - Property validation
 * - Data transformation
 * - Timestamp management
 * - JSON serialization
 * - Dirty tracking
 * 
 * @abstract
 */

class BaseModel {
  /**
   * Constructor
   * @param {Object} data - Initial data for the model
   */
  constructor(data = {}) {
    // Initialize internal state
    this._data = {};
    this._originalData = {};
    this._isDirty = false;
    this._isNew = true;

    // Set default values from schema
    this._initializeDefaults();

    // Load provided data
    if (data && typeof data === 'object') {
      this.load(data);
      
      // If data has an ID, it's not a new record
      if (data.id) {
        this._isNew = false;
        this._originalData = { ...this._data };
      }
    }
  }

  /**
   * Get the table name for this model
   * Must be implemented by subclasses
   * @returns {string}
   */
  static get tableName() {
    throw new Error('tableName must be implemented by subclass');
  }

  /**
   * Get the schema definition for this model
   * Must be implemented by subclasses
   * @returns {Object}
   */
  static get schema() {
    throw new Error('schema must be implemented by subclass');
  }

  /**
   * Initialize default values from schema
   * @private
   */
  _initializeDefaults() {
    const schema = this.constructor.schema;
    
    for (const [field, config] of Object.entries(schema)) {
      if (config.default !== undefined) {
        this._data[field] = config.default;
      }
    }
  }

  /**
   * Load data into the model
   * @param {Object} data - Data to load
   * @returns {BaseModel} - Returns this for chaining
   */
  load(data) {
    const schema = this.constructor.schema;
    
    for (const [key, value] of Object.entries(data)) {
      if (schema[key]) {
        this._data[key] = this._transformValue(key, value);
      }
    }
    
    return this;
  }

  /**
   * Transform value based on field type
   * @param {string} field - Field name
   * @param {*} value - Value to transform
   * @returns {*} - Transformed value
   * @private
   */
  _transformValue(field, value) {
    const schema = this.constructor.schema;
    const config = schema[field];
    
    if (value === null || value === undefined) {
      return config.nullable ? null : config.default;
    }
    
    // Type transformations
    switch (config.type) {
      case 'INTEGER':
        return parseInt(value, 10);
      
      case 'REAL':
        return parseFloat(value);
      
      case 'BOOLEAN':
        return Boolean(value);
      
      case 'JSON':
        if (typeof value === 'string') {
          try {
            return JSON.parse(value);
          } catch (e) {
            return config.default || null;
          }
        }
        return value;
      
      case 'TEXT':
      default:
        return String(value);
    }
  }

  /**
   * Get a property value
   * @param {string} key - Property name
   * @returns {*} - Property value
   */
  get(key) {
    return this._data[key];
  }

  /**
   * Set a property value
   * @param {string} key - Property name
   * @param {*} value - Property value
   * @returns {BaseModel} - Returns this for chaining
   */
  set(key, value) {
    const schema = this.constructor.schema;
    
    if (!schema[key]) {
      throw new Error(`Field '${key}' is not defined in schema for ${this.constructor.name}`);
    }
    
    const transformedValue = this._transformValue(key, value);
    
    // Mark as dirty if value changed
    if (this._data[key] !== transformedValue) {
      this._isDirty = true;
      this._data[key] = transformedValue;
    }
    
    return this;
  }

  /**
   * Get all data as plain object
   * @param {boolean} includeNull - Include null values (default: true)
   * @returns {Object}
   */
  toObject(includeNull = true) {
    const result = {};
    
    for (const [key, value] of Object.entries(this._data)) {
      if (!includeNull && value === null) {
        continue;
      }
      
      const schema = this.constructor.schema;
      
      // Convert JSON objects to strings for database storage
      if (schema[key] && schema[key].type === 'JSON' && typeof value === 'object' && value !== null) {
        result[key] = JSON.stringify(value);
      }
      // Convert booleans to integers for SQLite (0/1)
      else if (schema[key] && schema[key].type === 'BOOLEAN' && typeof value === 'boolean') {
        result[key] = value ? 1 : 0;
      }
      else {
        result[key] = value;
      }
    }
    
    return result;
  }

  /**
   * Get all data as JSON string
   * @returns {string}
   */
  toJSON() {
    return JSON.stringify(this.toObject());
  }

  /**
   * Validate model data
   * @returns {Object} - { valid: boolean, errors: Array }
   */
  validate() {
    const errors = [];
    const schema = this.constructor.schema;
    
    for (const [field, config] of Object.entries(schema)) {
      const value = this._data[field];
      
      // Check required fields
      if (config.required && (value === null || value === undefined || value === '')) {
        errors.push(`Field '${field}' is required`);
        continue;
      }
      
      // Skip validation if value is null and field is nullable
      if (value === null && config.nullable) {
        continue;
      }
      
      // Type validation
      if (value !== null && value !== undefined) {
        const isValidType = this._validateType(value, config.type);
        if (!isValidType) {
          errors.push(`Field '${field}' must be of type ${config.type}`);
        }
      }
      
      // Custom validation function
      if (config.validate && typeof config.validate === 'function') {
        const validationError = config.validate(value);
        if (validationError) {
          errors.push(`Field '${field}': ${validationError}`);
        }
      }
      
      // Length validation for TEXT fields
      if (config.type === 'TEXT' && config.maxLength && value) {
        if (value.length > config.maxLength) {
          errors.push(`Field '${field}' exceeds maximum length of ${config.maxLength}`);
        }
      }
      
      // Enum validation
      if (config.enum && value) {
        if (!config.enum.includes(value)) {
          errors.push(`Field '${field}' must be one of: ${config.enum.join(', ')}`);
        }
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate value type
   * @param {*} value - Value to validate
   * @param {string} type - Expected type
   * @returns {boolean}
   * @private
   */
  _validateType(value, type) {
    switch (type) {
      case 'INTEGER':
        return Number.isInteger(value);
      
      case 'REAL':
        return typeof value === 'number' && !isNaN(value);
      
      case 'BOOLEAN':
        return typeof value === 'boolean';
      
      case 'JSON':
        return typeof value === 'object' || typeof value === 'string';
      
      case 'TEXT':
        return typeof value === 'string';
      
      default:
        return true;
    }
  }

  /**
   * Check if model has unsaved changes
   * @returns {boolean}
   */
  isDirty() {
    return this._isDirty;
  }

  /**
   * Check if model is a new record
   * @returns {boolean}
   */
  isNew() {
    return this._isNew;
  }

  /**
   * Mark model as saved (clean)
   */
  markClean() {
    this._isDirty = false;
    this._isNew = false;
    this._originalData = { ...this._data };
  }

  /**
   * Revert changes to original state
   */
  revert() {
    this._data = { ...this._originalData };
    this._isDirty = false;
  }

  /**
   * Get changed fields
   * @returns {Object} - Object with changed fields and their values
   */
  getChanges() {
    const changes = {};
    
    for (const [key, value] of Object.entries(this._data)) {
      if (this._originalData[key] !== value) {
        changes[key] = {
          old: this._originalData[key],
          new: value
        };
      }
    }
    
    return changes;
  }

  /**
   * Set timestamps (created_at, updated_at)
   */
  setTimestamps() {
    const now = new Date().toISOString();
    const schema = this.constructor.schema;
    
    // Only set created_at if it exists in schema and model is new
    if (schema.created_at && this._isNew && (this._data.created_at === undefined || this._data.created_at === null)) {
      this._data.created_at = now;
    }
    
    // Only set updated_at if it exists in schema
    if (schema.updated_at && (this._data.updated_at === undefined || this._data.updated_at === null)) {
      this._data.updated_at = now;
    }
  }

  /**
   * Clone the model
   * @returns {BaseModel}
   */
  clone() {
    const ModelClass = this.constructor;
    return new ModelClass(this._data);
  }

  /**
   * Get primary key value
   * @returns {number|null}
   */
  getId() {
    return this._data.id || null;
  }

  /**
   * Set primary key value
   * @param {number} id
   */
  setId(id) {
    this._data.id = id;
    this._isNew = false;
  }

  /**
   * String representation
   * @returns {string}
   */
  toString() {
    return `${this.constructor.name}(${this.getId() || 'new'})`;
  }
}

export default BaseModel;
