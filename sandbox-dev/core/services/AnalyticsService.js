/**
 * AnalyticsService
 * Advanced analytics and reporting
 */

import BaseService from './BaseService.js';
import DomainRepository from '../../database/repositories/DomainRepository.js';
import TrafficLogRepository from '../../database/repositories/TrafficLogRepository.js';

export default class AnalyticsService extends BaseService {
  constructor(db) {
    super(db);
    this.domainRepo = new DomainRepository(db);
    this.trafficLogRepo = new TrafficLogRepository(db);
    this.registerRepository('domain', this.domainRepo);
    this.registerRepository('traffic', this.trafficLogRepo);
  }

  /**
   * Get comprehensive dashboard statistics
   * @param {number} domainId - Optional domain filter
   * @returns {Object}
   */
  async getDashboardStats(domainId = null) {
    try {
      const now = new Date();
      const last24h = new Date(now - 24 * 60 * 60 * 1000).toISOString();
      const last7d = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
      const last30d = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();

      // Overall stats
      const totalDomains = this.domainRepo.count();
      const activeDomains = this.domainRepo.findActive().length;
      const totalTrafficLogs = this.trafficLogRepo.count();

      // Get traffic stats for selected period
      let trafficStats24h, trafficStats7d, trafficStats30d;
      
      if (domainId) {
        trafficStats24h = this.trafficLogRepo.getTrafficStats(domainId, last24h, now.toISOString());
        trafficStats7d = this.trafficLogRepo.getTrafficStats(domainId, last7d, now.toISOString());
        trafficStats30d = this.trafficLogRepo.getTrafficStats(domainId, last30d, now.toISOString());
      }

      // Format traffic stats
      const format = (stats) => stats ? {
        requests: stats.totalRequests || 0,
        bots: stats.botRequests || 0,
        botPercentage: stats.botPercentage || 0,
        avgResponseTime: stats.avgResponseTime || 0,
        successRate: stats.successRate || 0
      } : { requests: 0, bots: 0, botPercentage: 0, avgResponseTime: 0, successRate: 0 };

      return {
        totalRequests: totalTrafficLogs,
        totalDomains,
        activeDomains,
        inactiveDomains: totalDomains - activeDomains,
        last24h: format(trafficStats24h),
        last7d: format(trafficStats7d),
        last30d: format(trafficStats30d),
        avgResponseTime: trafficStats24h?.avgResponseTime || 0,
        generatedAt: this.getCurrentTimestamp()
      };
    } catch (error) {
      return this.handleError(error, 'getDashboardStats');
    }
  }

  /**
   * Get time series data for charts
   * @param {number} domainId
   * @param {string} metric - 'requests', 'response_time', 'bot_rate'
   * @param {string} interval - 'hourly', 'daily', 'weekly'
   * @param {number} points - Number of data points
   * @returns {Array}
   */
  async getTimeSeries(domainId, metric, interval = 'hourly', points = 24) {
    try {
      const data = [];
      const now = new Date();
      
      let intervalMs;
      switch (interval) {
        case 'hourly':
          intervalMs = 60 * 60 * 1000;
          break;
        case 'daily':
          intervalMs = 24 * 60 * 60 * 1000;
          break;
        case 'weekly':
          intervalMs = 7 * 24 * 60 * 60 * 1000;
          break;
        default:
          intervalMs = 60 * 60 * 1000;
      }

      for (let i = points - 1; i >= 0; i--) {
        const endTime = new Date(now - i * intervalMs);
        const startTime = new Date(endTime - intervalMs);

        const stats = this.trafficLogRepo.getTrafficStats(
          domainId,
          startTime.toISOString(),
          endTime.toISOString()
        );

        let value;
        switch (metric) {
          case 'requests':
            value = stats.total_requests;
            break;
          case 'response_time':
            value = Math.round(stats.avg_response_time);
            break;
          case 'bot_rate':
            value = stats.total_requests > 0 
              ? (stats.bot_requests / stats.total_requests) * 100 
              : 0;
            break;
          default:
            value = 0;
        }

        data.push({
          timestamp: endTime.toISOString(),
          value: value || 0,
          label: this._formatTimeLabel(endTime, interval)
        });
      }

      return data;
    } catch (error) {
      return this.handleError(error, 'getTimeSeries');
    }
  }

  /**
   * Get top performing domains
   * @param {number} limit
   * @returns {Array}
   */
  async getTopDomains(limit = 10) {
    try {
      const domains = this.domainRepo.findAll();
      const domainStats = [];

      for (const domain of domains) {
        const stats = this.domainRepo.getStats(domain.getId());
        if (stats) {
          domainStats.push({
            id: domain.getId(),
            name: domain.get('name'),
            totalRequests: stats.total_requests,
            botBlockRate: stats.bot_block_rate,
            status: domain.get('status')
          });
        }
      }

      // Sort by total requests
      domainStats.sort((a, b) => b.totalRequests - a.totalRequests);

      return domainStats.slice(0, limit);
    } catch (error) {
      return this.handleError(error, 'getTopDomains');
    }
  }

  /**
   * Get traffic comparison between periods
   * @param {number} domainId
   * @param {Object} period1
   * @param {Object} period2
   * @returns {Object}
   */
  async compareTrafficPeriods(domainId, period1, period2) {
    try {
      const stats1 = this.trafficLogRepo.getTrafficStats(
        domainId,
        period1.startDate,
        period1.endDate
      );

      const stats2 = this.trafficLogRepo.getTrafficStats(
        domainId,
        period2.startDate,
        period2.endDate
      );

      const calculateChange = (old, current) => {
        if (old === 0) return current > 0 ? 100 : 0;
        return ((current - old) / old) * 100;
      };

      return {
        domainId,
        period1: {
          ...stats1,
          label: period1.label || 'Period 1'
        },
        period2: {
          ...stats2,
          label: period2.label || 'Period 2'
        },
        changes: {
          requests: calculateChange(stats1.total_requests, stats2.total_requests),
          botRate: calculateChange(
            stats1.bot_requests / stats1.total_requests,
            stats2.bot_requests / stats2.total_requests
          ),
          avgResponseTime: calculateChange(stats1.avg_response_time, stats2.avg_response_time),
          uniqueVisitors: calculateChange(stats1.unique_visitors, stats2.unique_visitors)
        }
      };
    } catch (error) {
      return this.handleError(error, 'compareTrafficPeriods');
    }
  }

  /**
   * Get geographic distribution
   * @param {number} domainId
   * @param {number} limit
   * @returns {Array}
   */
  async getGeographicDistribution(domainId, limit = 20) {
    try {
      const countryStats = this.trafficLogRepo.getTrafficByCountry(domainId, limit);
      
      return countryStats.map(stat => ({
        country: stat.country,
        requests: stat.request_count,
        uniqueVisitors: stat.unique_visitors,
        percentage: 0 // Will be calculated on client
      }));
    } catch (error) {
      return this.handleError(error, 'getGeographicDistribution');
    }
  }

  /**
   * Get backend performance comparison
   * @param {number} domainId
   * @param {Object} dateRange
   * @returns {Object}
   */
  async getBackendPerformance(domainId, dateRange = {}) {
    try {
      const startDate = dateRange.startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = dateRange.endDate || new Date().toISOString();

      const backendStats = this.trafficLogRepo.getTrafficByBackend(domainId, startDate, endDate);
      
      const totalRequests = backendStats.reduce((sum, stat) => sum + stat.request_count, 0);

      // Convert array to object with backend types as keys
      const backends = {};
      backendStats.forEach(stat => {
        backends[stat.backend_used] = {
          requests: stat.request_count,
          percentage: totalRequests > 0 ? (stat.request_count / totalRequests) * 100 : 0,
          avgResponseTime: Math.round(stat.avg_response_time),
          successRate: ((stat.successful_count / stat.request_count) * 100).toFixed(1)
        };
      });

      return backends;
    } catch (error) {
      return this.handleError(error, 'getBackendPerformance');
    }
  }

  /**
   * Get real-time metrics
   * @param {number} domainId
   * @returns {Object}
   */
  async getRealTimeMetrics(domainId = null) {
    try {
      const recentLogs = this.trafficLogRepo.getRecentTraffic(5, 100);
      
      let filtered = recentLogs;
      if (domainId) {
        filtered = recentLogs.filter(log => log.get('domain_id') === domainId);
      }

      const requestsPerMinute = filtered.length * 12; // Extrapolate from 5 min to 60 min
      const botRequests = filtered.filter(log => log.get('is_bot')).length;
      const avgResponseTime = filtered.reduce((sum, log) => 
        sum + (log.get('response_time') || 0), 0) / (filtered.length || 1);
      const uniqueIPs = new Set(filtered.map(log => log.get('visitor_ip'))).size;

      return {
        requestsPerMinute,
        botRate: filtered.length > 0 ? (botRequests / filtered.length) * 100 : 0,
        avgResponseTime: Math.round(avgResponseTime),
        activeRequests: filtered.length,
        activeIPs: uniqueIPs,
        timestamp: this.getCurrentTimestamp()
      };
    } catch (error) {
      return this.handleError(error, 'getRealTimeMetrics');
    }
  }

  /**
   * Generate performance report
   * @param {number} domainId
   * @param {Object} options
   * @returns {Object}
   */
  async generateReport(domainId, options = {}) {
    try {
      const {
        period = '7d',
        includeCharts = true,
        includeGeo = true,
        includeBackends = true,
        includeGeographic = true, // Deprecated alias
        includeBackendAnalysis = true // Deprecated alias
      } = options;
      
      const shouldIncludeGeo = includeGeo || includeGeographic;
      const shouldIncludeBackends = includeBackends || includeBackendAnalysis;

      const domain = this.domainRepo.find(domainId);
      if (!domain) {
        throw new Error(`Domain with id ${domainId} not found`);
      }

      const now = new Date();
      let startDate;
      
      switch (period) {
        case '24h':
          startDate = new Date(now - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
      }

      const stats = this.trafficLogRepo.getTrafficStats(
        domainId,
        startDate.toISOString(),
        now.toISOString()
      );

      const report = {
        domain: {
          id: domain.getId(),
          name: domain.get('name'),
          status: domain.get('status')
        },
        period: {
          start: startDate.toISOString(),
          end: now.toISOString(),
          label: period
        },
        summary: {
          totalRequests: stats.totalRequests || 0,
          botRequests: stats.botRequests || 0,
          botPercentage: stats.botPercentage || 0,
          avgResponseTime: stats.avgResponseTime || 0,
          successRate: stats.successRate || 0
        },
        generatedAt: this.getCurrentTimestamp()
      };

      if (includeCharts) {
        report.charts = {
          requests: await this.getTimeSeries(domainId, 'requests', 'hourly', 24),
          responseTime: await this.getTimeSeries(domainId, 'response_time', 'hourly', 24),
          botRate: await this.getTimeSeries(domainId, 'bot_rate', 'hourly', 24)
        };
      }

      if (shouldIncludeGeo) {
        report.geo = await this.getGeographicDistribution(domainId, 10);
      }

      if (shouldIncludeBackends) {
        report.backends = await this.getBackendPerformance(domainId, {
          startDate: startDate.toISOString(),
          endDate: now.toISOString()
        });
      }

      return report;
    } catch (error) {
      return this.handleError(error, 'generateReport');
    }
  }

  /**
   * Format time label for charts
   * @param {Date} date
   * @param {string} interval
   * @returns {string}
   * @private
   */
  _formatTimeLabel(date, interval) {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const day = date.getDate();
    const month = date.getMonth() + 1;

    switch (interval) {
      case 'hourly':
        return `${hours}:${minutes}`;
      case 'daily':
        return `${day}/${month}`;
      case 'weekly':
        return `Week ${Math.ceil(day / 7)}`;
      default:
        return `${hours}:${minutes}`;
    }
  }
}
