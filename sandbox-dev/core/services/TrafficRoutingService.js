/**
 * TrafficRoutingService
 * Handles intelligent traffic routing based on bot detection and traffic split
 */

import BaseService from './BaseService.js';
import DomainRepository from '../../database/repositories/DomainRepository.js';
import TrafficLogRepository from '../../database/repositories/TrafficLogRepository.js';

export default class TrafficRoutingService extends BaseService {
  constructor(db) {
    super(db);
    this.domainRepo = new DomainRepository(db);
    this.trafficLogRepo = new TrafficLogRepository(db);
    this.registerRepository('domain', this.domainRepo);
    this.registerRepository('traffic', this.trafficLogRepo);
  }

  /**
   * Route incoming request to appropriate backend
   * @param {Object} request
   * @returns {Object} - { backend, backendUrl, reason }
   */
  async routeRequest(request) {
    try {
      const { domainName, visitorIp, userAgent, botScore = 0 } = request;
      
      // Get domain configuration
      const domain = this.domainRepo.findByName(domainName);
      if (!domain) {
        throw new Error(`Domain '${domainName}' not found`);
      }

      // Check if domain is active
      if (domain.get('status') !== 'active') {
        throw new Error(`Domain '${domainName}' is not active (status: ${domain.get('status')})`);
      }

      // Determine backend based on bot score
      let backend;
      let reason;

      if (botScore >= 80) {
        // High bot score -> aggressive backend
        backend = 'aggressive';
        reason = `High bot score: ${botScore}`;
      } else if (botScore >= 50) {
        // Medium bot score -> gray backend
        backend = 'gray';
        reason = `Medium bot score: ${botScore}`;
      } else {
        // Low bot score or human -> use traffic split
        backend = this._selectBackendByTrafficSplit(domain);
        reason = `Traffic split selection (bot score: ${botScore})`;
      }

      const backendUrl = domain.getBackend(backend);

      this.logInfo('Routed request', {
        domain: domainName,
        ip: visitorIp,
        backend,
        botScore,
        reason
      });

      return {
        backend,
        backendUrl,
        reason,
        domainId: domain.getId()
      };
    } catch (error) {
      return this.handleError(error, 'routeRequest');
    }
  }

  /**
   * Select backend based on traffic split configuration
   * @param {Domain} domain
   * @returns {string} - 'clean', 'gray', or 'aggressive'
   * @private
   */
  _selectBackendByTrafficSplit(domain) {
    const split = domain.getTrafficSplit();
    const random = Math.random() * 100;

    let cumulative = 0;
    
    // Clean backend
    cumulative += split.clean || 0;
    if (random < cumulative) {
      return 'clean';
    }

    // Gray backend
    cumulative += split.gray || 0;
    if (random < cumulative) {
      return 'gray';
    }

    // Aggressive backend (fallback)
    return 'aggressive';
  }

  /**
   * Log traffic request
   * @param {Object} logData
   * @returns {TrafficLog}
   */
  async logTraffic(logData) {
    try {
      const validation = this.validate(logData, {
        domain_id: { required: true, type: 'number' },
        visitor_ip: { required: true, type: 'string' },
        backend_used: { 
          required: true, 
          type: 'string',
          enum: ['clean', 'gray', 'aggressive']
        }
      });

      if (!validation.valid) {
        throw new Error(`Log validation failed: ${validation.errors.join(', ')}`);
      }

      // Create traffic log
      const log = this.trafficLogRepo.create(logData);

      return log;
    } catch (error) {
      this.logError('Failed to log traffic', error);
      // Don't throw - logging should not break the main flow
      return null;
    }
  }

  /**
   * Get backend health status
   * @param {string} backendUrl
   * @returns {Object} - { healthy, responseTime, error }
   */
  async checkBackendHealth(backendUrl) {
    const startTime = Date.now();
    
    try {
      // Simple health check with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(backendUrl + '/health', {
        method: 'GET',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const responseTime = Date.now() - startTime;
      const healthy = response.ok;

      return {
        healthy,
        responseTime,
        statusCode: response.status,
        error: null
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      return {
        healthy: false,
        responseTime,
        statusCode: null,
        error: error.message
      };
    }
  }

  /**
   * Check all backends for a domain
   * @param {number} domainId
   * @returns {Object}
   */
  async checkAllBackends(domainId) {
    try {
      const domain = this.domainRepo.find(domainId);
      if (!domain) {
        throw new Error(`Domain with id ${domainId} not found`);
      }

      const backends = {
        clean: domain.get('clean_backend'),
        gray: domain.get('gray_backend'),
        aggressive: domain.get('aggressive_backend')
      };

      const results = {};

      for (const [type, url] of Object.entries(backends)) {
        results[type] = await this.checkBackendHealth(url);
      }

      return {
        domainId,
        domainName: domain.get('name'),
        backends: results,
        allHealthy: Object.values(results).every(r => r.healthy),
        checkedAt: this.getCurrentTimestamp()
      };
    } catch (error) {
      return this.handleError(error, 'checkAllBackends');
    }
  }

  /**
   * Get traffic statistics for a domain
   * @param {number} domainId
   * @param {Object} dateRange - { startDate, endDate }
   * @returns {Object}
   */
  async getTrafficStats(domainId, dateRange = {}) {
    try {
      const startDate = dateRange.startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = dateRange.endDate || new Date().toISOString();

      const stats = this.trafficLogRepo.getTrafficStats(domainId, startDate, endDate);
      const backendStats = this.trafficLogRepo.getTrafficByBackend(domainId, startDate, endDate);
      const countryStats = this.trafficLogRepo.getTrafficByCountry(domainId, 10);

      return {
        domainId,
        period: { startDate, endDate },
        overall: stats,
        byBackend: backendStats,
        byCountry: countryStats
      };
    } catch (error) {
      return this.handleError(error, 'getTrafficStats');
    }
  }

  /**
   * Get recent traffic logs
   * @param {number} minutes
   * @param {number} limit
   * @returns {Array<TrafficLog>}
   */
  async getRecentTraffic(minutes = 5, limit = 100) {
    try {
      return this.trafficLogRepo.getRecentTraffic(minutes, limit);
    } catch (error) {
      return this.handleError(error, 'getRecentTraffic');
    }
  }

  /**
   * Get slow requests
   * @param {number} threshold - Response time threshold in ms
   * @param {number} limit
   * @returns {Array<TrafficLog>}
   */
  async getSlowRequests(threshold = 1000, limit = 50) {
    try {
      return this.trafficLogRepo.getSlowRequests(threshold, limit);
    } catch (error) {
      return this.handleError(error, 'getSlowRequests');
    }
  }

  /**
   * Clean old traffic logs
   * @param {number} daysToKeep
   * @returns {number} - Number of deleted logs
   */
  async cleanOldLogs(daysToKeep = 90) {
    try {
      const deleted = this.trafficLogRepo.cleanOldLogs(daysToKeep);
      
      this.logInfo(`Cleaned old traffic logs`, { 
        deleted, 
        daysToKeep 
      });

      return deleted;
    } catch (error) {
      return this.handleError(error, 'cleanOldLogs');
    }
  }

  /**
   * Get traffic distribution summary
   * @param {number} domainId
   * @returns {Object}
   */
  async getTrafficDistribution(domainId) {
    try {
      const domain = this.domainRepo.find(domainId);
      if (!domain) {
        throw new Error(`Domain with id ${domainId} not found`);
      }

      const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const endDate = new Date().toISOString();

      const backendStats = this.trafficLogRepo.getTrafficByBackend(domainId, startDate, endDate);
      const configuredSplit = domain.getTrafficSplit();

      // Calculate actual vs configured percentages
      const totalRequests = backendStats.reduce((sum, stat) => sum + stat.request_count, 0);
      
      const actualDistribution = {};
      const performanceMetrics = {};

      backendStats.forEach(stat => {
        const percentage = totalRequests > 0 ? (stat.request_count / totalRequests) * 100 : 0;
        actualDistribution[stat.backend_used] = {
          requests: stat.request_count,
          percentage: parseFloat(percentage.toFixed(2)),
          avgResponseTime: Math.round(stat.avg_response_time)
        };
        performanceMetrics[stat.backend_used] = {
          avgResponseTime: Math.round(stat.avg_response_time),
          successRate: (stat.successful_count / stat.request_count) * 100
        };
      });

      return {
        domainId,
        domainName: domain.get('name'),
        period: '24 hours',
        configured: configuredSplit,
        actual: actualDistribution,
        performance: performanceMetrics,
        totalRequests
      };
    } catch (error) {
      return this.handleError(error, 'getTrafficDistribution');
    }
  }
}
