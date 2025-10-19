/**
 * Domain Model
 * Represents a domain with routing rules and backend configurations
 */

import BaseModel from './BaseModel.js';

class Domain extends BaseModel {
  static get tableName() {
    return 'domains';
  }

  static get schema() {
    return {
      id: {
        type: 'INTEGER',
        nullable: false
      },
      name: {
        type: 'TEXT',
        required: true,
        maxLength: 255,
        validate: (value) => {
          // Basic domain validation
          const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/;
          if (!domainRegex.test(value)) {
            return 'Invalid domain name format';
          }
          return null;
        }
      },
      status: {
        type: 'TEXT',
        default: 'active',
        enum: ['active', 'paused', 'maintenance']
      },
      clean_backend: {
        type: 'TEXT',
        required: true,
        validate: (value) => {
          if (!value || !value.startsWith('http')) {
            return 'Backend URL must start with http:// or https://';
          }
          return null;
        }
      },
      gray_backend: {
        type: 'TEXT',
        required: true,
        validate: (value) => {
          if (!value || !value.startsWith('http')) {
            return 'Backend URL must start with http:// or https://';
          }
          return null;
        }
      },
      aggressive_backend: {
        type: 'TEXT',
        required: true,
        validate: (value) => {
          if (!value || !value.startsWith('http')) {
            return 'Backend URL must start with http:// or https://';
          }
          return null;
        }
      },
      traffic_split: {
        type: 'JSON',
        default: { clean: 70, gray: 20, aggressive: 10 },
        validate: (value) => {
          if (typeof value !== 'object') return 'Traffic split must be an object';
          const total = (value.clean || 0) + (value.gray || 0) + (value.aggressive || 0);
          if (Math.abs(total - 100) > 0.01) {
            return 'Traffic split must total 100%';
          }
          return null;
        }
      },
      ab_testing_enabled: {
        type: 'BOOLEAN',
        default: false
      },
      ssl_enabled: {
        type: 'BOOLEAN',
        default: true
      },
      ssl_certificate: {
        type: 'TEXT',
        nullable: true
      },
      ssl_private_key: {
        type: 'TEXT',
        nullable: true
      },
      ssl_expires_at: {
        type: 'TEXT',
        nullable: true
      },
      rate_limit_enabled: {
        type: 'BOOLEAN',
        default: true
      },
      rate_limit_requests: {
        type: 'INTEGER',
        default: 1000
      },
      rate_limit_window: {
        type: 'INTEGER',
        default: 3600
      },
      total_requests: {
        type: 'INTEGER',
        default: 0
      },
      total_bot_blocks: {
        type: 'INTEGER',
        default: 0
      },
      created_at: {
        type: 'TEXT',
        default: null
      },
      updated_at: {
        type: 'TEXT',
        default: null
      }
    };
  }

  /**
   * Get backend URL based on traffic type
   * @param {string} type - 'clean', 'gray', or 'aggressive'
   * @returns {string|null}
   */
  getBackend(type) {
    const backends = {
      clean: this.get('clean_backend'),
      gray: this.get('gray_backend'),
      aggressive: this.get('aggressive_backend')
    };
    return backends[type] || null;
  }

  /**
   * Check if domain is active
   * @returns {boolean}
   */
  isActive() {
    return this.get('status') === 'active';
  }

  /**
   * Check if SSL is enabled and valid
   * @returns {boolean}
   */
  hasValidSSL() {
    if (!this.get('ssl_enabled')) {
      return false;
    }

    const expiresAt = this.get('ssl_expires_at');
    if (!expiresAt) {
      return false;
    }

    const expiryDate = new Date(expiresAt);
    return expiryDate > new Date();
  }

  /**
   * Get traffic split configuration
   * @returns {Object}
   */
  getTrafficSplit() {
    return this.get('traffic_split') || { clean: 70, gray: 20, aggressive: 10 };
  }

  /**
   * Update traffic split
   * @param {Object} split - { clean, gray, aggressive }
   * @returns {Domain}
   */
  setTrafficSplit(split) {
    const total = (split.clean || 0) + (split.gray || 0) + (split.aggressive || 0);
    if (Math.abs(total - 100) > 0.01) {
      throw new Error('Traffic split must total 100%');
    }
    return this.set('traffic_split', split);
  }

  /**
   * Increment request counter
   */
  incrementRequests() {
    const current = this.get('total_requests') || 0;
    this.set('total_requests', current + 1);
  }

  /**
   * Increment bot block counter
   */
  incrementBotBlocks() {
    const current = this.get('total_bot_blocks') || 0;
    this.set('total_bot_blocks', current + 1);
  }

  /**
   * Check if rate limit is enabled
   * @returns {boolean}
   */
  hasRateLimit() {
    return this.get('rate_limit_enabled') === true;
  }

  /**
   * Get rate limit configuration
   * @returns {Object}
   */
  getRateLimitConfig() {
    return {
      requests: this.get('rate_limit_requests') || 1000,
      window: this.get('rate_limit_window') || 3600
    };
  }
}

export default Domain;
