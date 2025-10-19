/**
 * TrafficLog Model
 * Represents a basic traffic log entry
 */

import BaseModel from './BaseModel.js';

class TrafficLog extends BaseModel {
  static get tableName() {
    return 'traffic_logs';
  }

  static get schema() {
    return {
      id: {
        type: 'INTEGER',
        nullable: false
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
      request_method: {
        type: 'TEXT',
        default: 'GET',
        enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']
      },
      request_path: {
        type: 'TEXT',
        nullable: true
      },
      backend_used: {
        type: 'TEXT',
        required: true,
        enum: ['clean', 'gray', 'aggressive']
      },
      backend_url: {
        type: 'TEXT',
        nullable: true
      },
      response_time: {
        type: 'INTEGER',
        nullable: true
      },
      response_status: {
        type: 'INTEGER',
        nullable: true
      },
      is_bot: {
        type: 'BOOLEAN',
        default: false
      },
      bot_score: {
        type: 'REAL',
        default: 0.0
      },
      country: {
        type: 'TEXT',
        nullable: true
      },
      city: {
        type: 'TEXT',
        nullable: true
      },
      request_time: {
        type: 'TEXT',
        default: null
      }
    };
  }

  /**
   * Check if request was from a bot
   * @returns {boolean}
   */
  isBot() {
    return this.get('is_bot') === true;
  }

  /**
   * Get bot detection confidence
   * @returns {number}
   */
  getBotScore() {
    return this.get('bot_score') || 0.0;
  }

  /**
   * Check if response was successful
   * @returns {boolean}
   */
  isSuccessful() {
    const status = this.get('response_status');
    return status >= 200 && status < 300;
  }

  /**
   * Check if response was an error
   * @returns {boolean}
   */
  isError() {
    const status = this.get('response_status');
    return status >= 400;
  }

  /**
   * Get response time category
   * @returns {string} - 'fast', 'medium', 'slow'
   */
  getResponseTimeCategory() {
    const time = this.get('response_time');
    if (time === null) return 'unknown';
    if (time < 200) return 'fast';
    if (time < 1000) return 'medium';
    return 'slow';
  }

  /**
   * Get geographic location
   * @returns {Object}
   */
  getLocation() {
    return {
      country: this.get('country'),
      city: this.get('city')
    };
  }

  /**
   * Check if request was slow
   * @param {number} threshold - Threshold in ms (default: 1000)
   * @returns {boolean}
   */
  isSlow(threshold = 1000) {
    const time = this.get('response_time');
    return time !== null && time > threshold;
  }
}

export default TrafficLog;
