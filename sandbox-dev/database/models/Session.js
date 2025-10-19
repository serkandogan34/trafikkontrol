/**
 * Session Model
 * Represents a user session for tracking and analytics
 */

import BaseModel from './BaseModel.js';

class Session extends BaseModel {
  static get tableName() {
    return 'sessions';
  }

  static get schema() {
    return {
      id: {
        type: 'INTEGER',
        nullable: false
      },
      session_id: {
        type: 'TEXT',
        required: true
      },
      domain_id: {
        type: 'INTEGER',
        required: true
      },
      visitor_ip: {
        type: 'TEXT',
        required: true
      },
      user_agent: {
        type: 'TEXT',
        nullable: true
      },
      fingerprint: {
        type: 'TEXT',
        nullable: true
      },
      session_data: {
        type: 'JSON',
        nullable: true
      },
      page_views: {
        type: 'INTEGER',
        default: 0
      },
      total_time_spent: {
        type: 'INTEGER',
        default: 0
      },
      is_bot: {
        type: 'BOOLEAN',
        default: false
      },
      bot_score: {
        type: 'REAL',
        default: 0.0
      },
      first_seen: {
        type: 'TEXT',
        default: null
      },
      last_seen: {
        type: 'TEXT',
        default: null
      },
      expires_at: {
        type: 'TEXT',
        nullable: true
      }
    };
  }

  /**
   * Check if session is expired
   * @returns {boolean}
   */
  isExpired() {
    const expiresAt = this.get('expires_at');
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  }

  /**
   * Check if session is from a bot
   * @returns {boolean}
   */
  isBot() {
    return this.get('is_bot') === true;
  }

  /**
   * Increment page view counter
   */
  incrementPageViews() {
    const current = this.get('page_views') || 0;
    this.set('page_views', current + 1);
  }

  /**
   * Add time spent (in seconds)
   * @param {number} seconds
   */
  addTimeSpent(seconds) {
    const current = this.get('total_time_spent') || 0;
    this.set('total_time_spent', current + seconds);
  }

  /**
   * Update last seen timestamp
   */
  updateLastSeen() {
    this.set('last_seen', new Date().toISOString());
  }

  /**
   * Get session duration in seconds
   * @returns {number}
   */
  getDuration() {
    const firstSeen = new Date(this.get('first_seen'));
    const lastSeen = new Date(this.get('last_seen'));
    return Math.floor((lastSeen - firstSeen) / 1000);
  }

  /**
   * Get session data
   * @returns {Object}
   */
  getSessionData() {
    return this.get('session_data') || {};
  }

  /**
   * Set session data
   * @param {Object} data
   */
  setSessionData(data) {
    this.set('session_data', data);
  }

  /**
   * Update session data (merge)
   * @param {Object} data
   */
  updateSessionData(data) {
    const current = this.getSessionData();
    this.setSessionData({ ...current, ...data });
  }
}

export default Session;
