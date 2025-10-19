/**
 * DomainRepository
 * Repository for Domain model with specialized queries
 */

import BaseRepository from './BaseRepository.js';
import Domain from '../models/Domain.js';

class DomainRepository extends BaseRepository {
  constructor(db) {
    super(db, Domain);
  }

  /**
   * Find domain by name
   * @param {string} name - Domain name
   * @returns {Domain|null}
   */
  findByName(name) {
    return this.findOneBy({ name });
  }

  /**
   * Find all active domains
   * @returns {Array<Domain>}
   */
  findActive() {
    return this.findBy({ status: 'active' });
  }

  /**
   * Find domains with SSL expiring soon
   * @param {number} daysThreshold - Days threshold (default: 30)
   * @returns {Array<Domain>}
   */
  findSSLExpiringSoon(daysThreshold = 30) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysThreshold);
    
    const sql = `
      SELECT * FROM ${this.tableName}
      WHERE ssl_enabled = 1
      AND ssl_expires_at IS NOT NULL
      AND datetime(ssl_expires_at) <= datetime(?)
      AND datetime(ssl_expires_at) > datetime('now')
      ORDER BY ssl_expires_at ASC
    `;
    
    const rows = this.query(sql, [futureDate.toISOString()]);
    return rows.map(row => new Domain(row));
  }

  /**
   * Get domain statistics
   * @param {number} domainId - Domain ID
   * @returns {Object}
   */
  getStats(domainId) {
    const domain = this.find(domainId);
    if (!domain) return null;

    return {
      id: domain.getId(),
      name: domain.get('name'),
      total_requests: domain.get('total_requests'),
      total_bot_blocks: domain.get('total_bot_blocks'),
      bot_block_rate: domain.get('total_requests') > 0 
        ? (domain.get('total_bot_blocks') / domain.get('total_requests')) * 100 
        : 0
    };
  }

  /**
   * Update domain statistics
   * @param {number} domainId - Domain ID
   * @param {Object} stats - { total_requests, total_bot_blocks }
   */
  updateStats(domainId, stats) {
    const sql = `
      UPDATE ${this.tableName}
      SET total_requests = total_requests + ?,
          total_bot_blocks = total_bot_blocks + ?,
          updated_at = datetime('now')
      WHERE id = ?
    `;
    
    this.execute(sql, [
      stats.total_requests || 0,
      stats.total_bot_blocks || 0,
      domainId
    ]);
  }

  /**
   * Search domains
   * @param {string} query - Search query
   * @returns {Array<Domain>}
   */
  search(query) {
    const sql = `
      SELECT * FROM ${this.tableName}
      WHERE name LIKE ?
      OR clean_backend LIKE ?
      OR gray_backend LIKE ?
      OR aggressive_backend LIKE ?
      ORDER BY name ASC
    `;
    
    const searchPattern = `%${query}%`;
    const rows = this.query(sql, [searchPattern, searchPattern, searchPattern, searchPattern]);
    return rows.map(row => new Domain(row));
  }
}

export default DomainRepository;
