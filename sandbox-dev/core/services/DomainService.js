/**
 * DomainService
 * Business logic for domain management
 */

import BaseService from './BaseService.js';
import DomainRepository from '../../database/repositories/DomainRepository.js';

export default class DomainService extends BaseService {
  constructor(db) {
    super(db);
    this.domainRepo = new DomainRepository(db);
    this.registerRepository('domain', this.domainRepo);
  }

  /**
   * Create a new domain
   * @param {Object} domainData
   * @returns {Domain}
   */
  async createDomain(domainData) {
    try {
      // Validate input
      const validation = this.validate(domainData, {
        name: {
          required: true,
          type: 'string',
          validator: (value) => {
            const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/;
            if (!domainRegex.test(value)) {
              return 'Invalid domain name format';
            }
            return null;
          }
        },
        clean_backend: {
          required: true,
          type: 'string',
          validator: (value) => value.startsWith('http') ? null : 'Must be a valid URL'
        },
        gray_backend: {
          required: true,
          type: 'string',
          validator: (value) => value.startsWith('http') ? null : 'Must be a valid URL'
        },
        aggressive_backend: {
          required: true,
          type: 'string',
          validator: (value) => value.startsWith('http') ? null : 'Must be a valid URL'
        }
      });

      if (!validation.valid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Check if domain already exists
      const existing = this.domainRepo.findByName(domainData.name);
      if (existing) {
        throw new Error(`Domain '${domainData.name}' already exists`);
      }

      // Create domain
      const domain = this.domainRepo.create(domainData);
      
      this.logInfo(`Created domain: ${domain.get('name')}`, { id: domain.id });
      
      return domain;
    } catch (error) {
      throw this.handleError(error, 'createDomain');
    }
  }

  /**
   * Get domain by ID
   * @param {number} id
   * @returns {Domain|null}
   */
  async getDomain(id) {
    try {
      const domain = this.domainRepo.find(id);
      
      if (!domain) {
        throw new Error(`Domain with id ${id} not found`);
      }
      
      return domain;
    } catch (error) {
      return this.handleError(error, 'getDomain');
    }
  }

  /**
   * Get domain by name
   * @param {string} name
   * @returns {Domain|null}
   */
  async getDomainByName(name) {
    try {
      const domain = this.domainRepo.findByName(name);
      
      if (!domain) {
        throw new Error(`Domain '${name}' not found`);
      }
      
      return domain;
    } catch (error) {
      return this.handleError(error, 'getDomainByName');
    }
  }

  /**
   * Get all domains
   * @param {Object} options
   * @returns {Object} - Paginated result { data, total, page, pages, limit }
   */
  async getAllDomains(options = {}) {
    try {
      const { page = 1, limit = 10 } = options;
      const offset = (page - 1) * limit;
      
      // Get total count
      const total = this.domainRepo.count();
      
      // Get paginated data
      const data = this.domainRepo.findAll({ ...options, limit, offset });
      
      return {
        data,
        total,
        page,
        pages: Math.ceil(total / limit),
        limit
      };
    } catch (error) {
      throw this.handleError(error, 'getAllDomains');
    }
  }

  /**
   * Get active domains only
   * @returns {Array<Domain>}
   */
  async getActiveDomains() {
    try {
      return this.domainRepo.findActive();
    } catch (error) {
      return this.handleError(error, 'getActiveDomains');
    }
  }

  /**
   * Update domain
   * @param {number} id
   * @param {Object} updateData
   * @returns {Domain}
   */
  async updateDomain(id, updateData) {
    try {
      const domain = await this.getDomain(id);
      
      // Update fields
      for (const [key, value] of Object.entries(updateData)) {
        if (value !== undefined) {
          domain.set(key, value);
        }
      }
      
      // Save changes
      const updated = this.domainRepo.update(domain);
      
      this.logInfo(`Updated domain: ${updated.get('name')}`, { id: updated.getId() });
      
      return updated;
    } catch (error) {
      return this.handleError(error, 'updateDomain');
    }
  }

  /**
   * Update domain status
   * @param {number} id
   * @param {string} status - 'active', 'paused', 'maintenance'
   * @returns {Domain}
   */
  async updateDomainStatus(id, status) {
    try {
      this.assert(
        ['active', 'paused', 'maintenance'].includes(status),
        `Invalid status: ${status}`
      );
      
      return await this.updateDomain(id, { status });
    } catch (error) {
      return this.handleError(error, 'updateDomainStatus');
    }
  }

  /**
   * Update traffic split configuration
   * @param {number} id
   * @param {Object} split - { clean, gray, aggressive }
   * @returns {Domain}
   */
  async updateTrafficSplit(id, split) {
    try {
      // Validate split totals 100%
      const total = (split.clean || 0) + (split.gray || 0) + (split.aggressive || 0);
      this.assert(
        Math.abs(total - 100) < 0.01,
        'Traffic split must total 100%'
      );
      
      return await this.updateDomain(id, { traffic_split: split });
    } catch (error) {
      return this.handleError(error, 'updateTrafficSplit');
    }
  }

  /**
   * Delete domain
   * @param {number} id
   * @returns {boolean}
   */
  async deleteDomain(id) {
    try {
      const domain = await this.getDomain(id);
      
      const deleted = this.domainRepo.delete(id);
      
      if (deleted) {
        this.logInfo(`Deleted domain: ${domain.get('name')}`, { id });
      }
      
      return deleted;
    } catch (error) {
      return this.handleError(error, 'deleteDomain');
    }
  }

  /**
   * Check SSL certificate expiration
   * @param {number} daysThreshold
   * @returns {Array<Domain>}
   */
  async getSSLExpiringSoon(daysThreshold = 30) {
    try {
      return this.domainRepo.findSSLExpiringSoon(daysThreshold);
    } catch (error) {
      return this.handleError(error, 'getSSLExpiringSoon');
    }
  }

  /**
   * Update SSL certificate
   * @param {number} id
   * @param {Object} sslData - { certificate, private_key, expires_at }
   * @returns {Domain}
   */
  async updateSSLCertificate(id, sslData) {
    try {
      const validation = this.validate(sslData, {
        ssl_certificate: { required: true, type: 'string' },
        ssl_private_key: { required: true, type: 'string' },
        ssl_expires_at: { required: true, type: 'string' }
      });

      if (!validation.valid) {
        throw new Error(`SSL validation failed: ${validation.errors.join(', ')}`);
      }

      return await this.updateDomain(id, {
        ssl_certificate: sslData.ssl_certificate,
        ssl_private_key: sslData.ssl_private_key,
        ssl_expires_at: sslData.ssl_expires_at,
        ssl_enabled: true
      });
    } catch (error) {
      return this.handleError(error, 'updateSSLCertificate');
    }
  }

  /**
   * Get domain statistics
   * @param {number} id
   * @returns {Object}
   */
  async getDomainStats(id) {
    try {
      return this.domainRepo.getStats(id);
    } catch (error) {
      return this.handleError(error, 'getDomainStats');
    }
  }

  /**
   * Increment domain request counter
   * @param {number} id
   * @param {boolean} isBot
   */
  async incrementRequestCount(id, isBot = false) {
    try {
      this.domainRepo.updateStats(id, {
        total_requests: 1,
        total_bot_blocks: isBot ? 1 : 0
      });
    } catch (error) {
      this.logError('Failed to increment request count', error);
      // Don't throw - this is non-critical
    }
  }

  /**
   * Search domains
   * @param {string} query
   * @returns {Array<Domain>}
   */
  async searchDomains(query) {
    try {
      return this.domainRepo.search(query);
    } catch (error) {
      return this.handleError(error, 'searchDomains');
    }
  }

  /**
   * Enable/disable rate limiting
   * @param {number} id
   * @param {boolean} enabled
   * @param {Object} config - { requests, window }
   * @returns {Domain}
   */
  async updateRateLimit(id, enabled, config = {}) {
    try {
      const updateData = { rate_limit_enabled: enabled };
      
      if (config.requests) {
        updateData.rate_limit_requests = config.requests;
      }
      if (config.window) {
        updateData.rate_limit_window = config.window;
      }
      
      return await this.updateDomain(id, updateData);
    } catch (error) {
      return this.handleError(error, 'updateRateLimit');
    }
  }

  /**
   * Enable/disable A/B testing
   * @param {number} id
   * @param {boolean} enabled
   * @returns {Domain}
   */
  async toggleABTesting(id, enabled) {
    try {
      return await this.updateDomain(id, { ab_testing_enabled: enabled });
    } catch (error) {
      return this.handleError(error, 'toggleABTesting');
    }
  }
}
