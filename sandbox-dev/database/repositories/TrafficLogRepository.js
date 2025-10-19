/**
 * TrafficLogRepository
 * Repository for TrafficLog model with analytics queries
 */

import BaseRepository from './BaseRepository.js';
import TrafficLog from '../models/TrafficLog.js';

class TrafficLogRepository extends BaseRepository {
  constructor(db) {
    super(db, TrafficLog);
  }

  /**
   * Find logs by domain
   * @param {number} domainId - Domain ID
   * @param {Object} options - Query options
   * @returns {Array<TrafficLog>}
   */
  findByDomain(domainId, options = {}) {
    return this.findBy({ domain_id: domainId }, options);
  }

  /**
   * Find logs by IP address
   * @param {string} ip - IP address
   * @param {Object} options - Query options
   * @returns {Array<TrafficLog>}
   */
  findByIP(ip, options = {}) {
    return this.findBy({ visitor_ip: ip }, options);
  }

  /**
   * Find bot traffic
   * @param {number} domainId - Optional domain ID filter
   * @param {Object} options - Query options
   * @returns {Array<TrafficLog>}
   */
  findBotTraffic(domainId = null, options = {}) {
    const criteria = { is_bot: 1 };
    if (domainId) {
      criteria.domain_id = domainId;
    }
    return this.findBy(criteria, options);
  }

  /**
   * Get traffic statistics for domain
   * @param {number} domainId - Domain ID
   * @param {string} startDate - Start date (ISO format)
   * @param {string} endDate - End date (ISO format)
   * @returns {Object}
   */
  getTrafficStats(domainId, startDate, endDate) {
    const sql = `
      SELECT 
        COUNT(*) as total_requests,
        SUM(CASE WHEN is_bot = 1 THEN 1 ELSE 0 END) as bot_requests,
        SUM(CASE WHEN response_status >= 200 AND response_status < 300 THEN 1 ELSE 0 END) as successful_requests,
        SUM(CASE WHEN response_status >= 400 THEN 1 ELSE 0 END) as error_requests,
        AVG(response_time) as avg_response_time,
        MAX(response_time) as max_response_time,
        MIN(response_time) as min_response_time,
        COUNT(DISTINCT visitor_ip) as unique_visitors,
        COUNT(DISTINCT country) as unique_countries
      FROM ${this.tableName}
      WHERE domain_id = ?
      AND datetime(request_time) >= datetime(?)
      AND datetime(request_time) <= datetime(?)
    `;
    
    const result = this.db.prepare(sql).get(domainId, startDate, endDate);
    return result;
  }

  /**
   * Get traffic by backend type
   * @param {number} domainId - Domain ID
   * @param {string} startDate - Start date
   * @param {string} endDate - End date
   * @returns {Array}
   */
  getTrafficByBackend(domainId, startDate, endDate) {
    const sql = `
      SELECT 
        backend_used,
        COUNT(*) as request_count,
        AVG(response_time) as avg_response_time,
        SUM(CASE WHEN response_status >= 200 AND response_status < 300 THEN 1 ELSE 0 END) as successful_count
      FROM ${this.tableName}
      WHERE domain_id = ?
      AND datetime(request_time) >= datetime(?)
      AND datetime(request_time) <= datetime(?)
      GROUP BY backend_used
    `;
    
    return this.query(sql, [domainId, startDate, endDate]);
  }

  /**
   * Get traffic by country
   * @param {number} domainId - Domain ID
   * @param {number} limit - Limit results (default: 10)
   * @returns {Array}
   */
  getTrafficByCountry(domainId, limit = 10) {
    const sql = `
      SELECT 
        country,
        COUNT(*) as request_count,
        COUNT(DISTINCT visitor_ip) as unique_visitors
      FROM ${this.tableName}
      WHERE domain_id = ?
      AND country IS NOT NULL
      GROUP BY country
      ORDER BY request_count DESC
      LIMIT ?
    `;
    
    return this.query(sql, [domainId, limit]);
  }

  /**
   * Get recent traffic (last N minutes)
   * @param {number} minutes - Minutes to look back
   * @param {number} limit - Limit results
   * @returns {Array<TrafficLog>}
   */
  getRecentTraffic(minutes = 5, limit = 100) {
    const sql = `
      SELECT * FROM ${this.tableName}
      WHERE datetime(request_time) >= datetime('now', '-${minutes} minutes')
      ORDER BY request_time DESC
      LIMIT ?
    `;
    
    const rows = this.query(sql, [limit]);
    return rows.map(row => new TrafficLog(row));
  }

  /**
   * Get slow requests
   * @param {number} threshold - Response time threshold in ms
   * @param {number} limit - Limit results
   * @returns {Array<TrafficLog>}
   */
  getSlowRequests(threshold = 1000, limit = 50) {
    const sql = `
      SELECT * FROM ${this.tableName}
      WHERE response_time > ?
      ORDER BY response_time DESC
      LIMIT ?
    `;
    
    const rows = this.query(sql, [threshold, limit]);
    return rows.map(row => new TrafficLog(row));
  }

  /**
   * Clean old logs
   * @param {number} daysToKeep - Days to keep (default: 90)
   * @returns {number} - Number of deleted rows
   */
  cleanOldLogs(daysToKeep = 90) {
    const sql = `
      DELETE FROM ${this.tableName}
      WHERE datetime(request_time) < datetime('now', '-${daysToKeep} days')
    `;
    
    const result = this.execute(sql);
    return result.changes;
  }
}

export default TrafficLogRepository;
