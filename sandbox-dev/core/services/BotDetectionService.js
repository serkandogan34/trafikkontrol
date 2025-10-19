/**
 * BotDetectionService
 * Intelligent bot detection using multiple signals
 */

import BaseService from './BaseService.js';

export default class BotDetectionService extends BaseService {
  constructor(db) {
    super(db);
    
    // Known bot user agents patterns
    this.botPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /curl/i,
      /wget/i,
      /python/i,
      /java/i,
      /go-http/i,
      /headless/i,
      /phantom/i,
      /selenium/i,
      /puppeteer/i
    ];
    
    // Known good bots (search engines, monitoring)
    this.goodBotPatterns = [
      /googlebot/i,
      /bingbot/i,
      /yandexbot/i,
      /duckduckbot/i,
      /baiduspider/i,
      /facebookexternalhit/i,
      /twitterbot/i,
      /linkedinbot/i,
      /slackbot/i,
      /uptimerobot/i
    ];
    
    // Suspicious headers
    this.suspiciousHeaders = [
      'X-Forwarded-For',
      'X-Real-IP',
      'Via',
      'X-Proxy'
    ];
  }

  /**
   * Analyze request and calculate bot score
   * @param {Object} request
   * @returns {Object} - { isBot, score, confidence, reasons }
   */
  async analyzeRequest(request) {
    try {
      const {
        userAgent,
        ip,
        headers = {},
        fingerprint,
        behaviorData = {}
      } = request;

      const signals = [];
      let score = 0;

      // 1. User Agent Analysis (0-30 points)
      const uaAnalysis = this._analyzeUserAgent(userAgent);
      score += uaAnalysis.score;
      if (uaAnalysis.reason) {
        signals.push(uaAnalysis.reason);
      }

      // 2. IP Analysis (0-20 points)
      const ipAnalysis = this._analyzeIP(ip);
      score += ipAnalysis.score;
      if (ipAnalysis.reason) {
        signals.push(ipAnalysis.reason);
      }

      // 3. Header Analysis (0-20 points)
      const headerAnalysis = this._analyzeHeaders(headers);
      score += headerAnalysis.score;
      if (headerAnalysis.reason) {
        signals.push(headerAnalysis.reason);
      }

      // 4. Behavior Analysis (0-30 points)
      const behaviorAnalysis = this._analyzeBehavior(behaviorData);
      score += behaviorAnalysis.score;
      if (behaviorAnalysis.reason) {
        signals.push(behaviorAnalysis.reason);
      }

      // Calculate confidence
      const confidence = this._calculateConfidence(signals.length);

      // Determine if it's a bot (threshold: 50)
      const isBot = score >= 50;
      
      // Check if it's a good bot
      const isGoodBot = this._isGoodBot(userAgent);

      const result = {
        isBot,
        isGoodBot,
        score: Math.min(100, Math.round(score)),
        confidence: Math.round(confidence),
        signals,
        recommendation: this._getRecommendation(score, isGoodBot)
      };

      this.logInfo('Bot analysis completed', {
        ip,
        score: result.score,
        isBot: result.isBot,
        signalCount: signals.length
      });

      return result;
    } catch (error) {
      return this.handleError(error, 'analyzeRequest');
    }
  }

  /**
   * Analyze user agent string
   * @param {string} userAgent
   * @returns {Object}
   * @private
   */
  _analyzeUserAgent(userAgent) {
    if (!userAgent || userAgent.length < 10) {
      return {
        score: 30,
        reason: 'Missing or suspicious user agent'
      };
    }

    // Check against bot patterns
    for (const pattern of this.botPatterns) {
      if (pattern.test(userAgent)) {
        return {
          score: 25,
          reason: `Bot pattern in user agent: ${pattern.source}`
        };
      }
    }

    // Check for unusual user agent length
    if (userAgent.length < 30 || userAgent.length > 500) {
      return {
        score: 15,
        reason: 'Unusual user agent length'
      };
    }

    // Check for missing common browser identifiers
    const hasBrowserId = /Mozilla|Chrome|Safari|Firefox|Edge/i.test(userAgent);
    if (!hasBrowserId) {
      return {
        score: 20,
        reason: 'Missing browser identifier'
      };
    }

    return { score: 0, reason: null };
  }

  /**
   * Analyze IP address
   * @param {string} ip
   * @returns {Object}
   * @private
   */
  _analyzeIP(ip) {
    if (!ip) {
      return { score: 10, reason: 'Missing IP address' };
    }

    // Check for known datacenter IP ranges (simplified)
    // In production, use GeoIP database
    const datacenterPatterns = [
      /^23\./,  // AWS
      /^34\./,  // Google Cloud
      /^52\./,  // AWS
      /^104\./  // DigitalOcean
    ];

    for (const pattern of datacenterPatterns) {
      if (pattern.test(ip)) {
        return {
          score: 15,
          reason: 'Datacenter IP detected'
        };
      }
    }

    return { score: 0, reason: null };
  }

  /**
   * Analyze HTTP headers
   * @param {Object} headers
   * @returns {Object}
   * @private
   */
  _analyzeHeaders(headers) {
    let score = 0;
    const reasons = [];

    // Check for proxy headers
    for (const header of this.suspiciousHeaders) {
      if (headers[header] || headers[header.toLowerCase()]) {
        score += 5;
        reasons.push(`Proxy header detected: ${header}`);
      }
    }

    // Check for missing common headers
    const commonHeaders = ['accept', 'accept-language', 'accept-encoding'];
    const missingHeaders = commonHeaders.filter(h => !headers[h]);
    
    if (missingHeaders.length > 1) {
      score += 10;
      reasons.push('Missing common browser headers');
    }

    // Check for unusual header order or values
    if (headers['accept'] && headers['accept'] === '*/*') {
      score += 5;
      reasons.push('Generic accept header');
    }

    return {
      score: Math.min(20, score),
      reason: reasons.length > 0 ? reasons.join('; ') : null
    };
  }

  /**
   * Analyze behavior patterns
   * @param {Object} behaviorData
   * @returns {Object}
   * @private
   */
  _analyzeBehavior(behaviorData) {
    const {
      requestRate,      // requests per minute
      pageViewRate,     // pages per second
      mouseMovements,   // number of mouse events
      keyboardEvents,   // number of keyboard events
      sessionDuration,  // seconds
      scrollPattern     // scroll behavior
    } = behaviorData;

    let score = 0;
    const reasons = [];

    // High request rate
    if (requestRate && requestRate > 60) {
      score += 15;
      reasons.push(`High request rate: ${requestRate}/min`);
    }

    // Fast page view rate
    if (pageViewRate && pageViewRate > 2) {
      score += 10;
      reasons.push(`Rapid page views: ${pageViewRate}/sec`);
    }

    // No mouse movements
    if (mouseMovements !== undefined && mouseMovements === 0 && sessionDuration > 10) {
      score += 15;
      reasons.push('No mouse movement detected');
    }

    // No keyboard events
    if (keyboardEvents !== undefined && keyboardEvents === 0 && sessionDuration > 20) {
      score += 10;
      reasons.push('No keyboard interaction');
    }

    // Unnatural scroll pattern
    if (scrollPattern === 'linear' || scrollPattern === 'instant') {
      score += 10;
      reasons.push('Unnatural scroll pattern');
    }

    // Very short session with multiple page views
    if (sessionDuration && sessionDuration < 5 && pageViewRate > 1) {
      score += 15;
      reasons.push('Suspicious session pattern');
    }

    return {
      score: Math.min(30, score),
      reason: reasons.length > 0 ? reasons.join('; ') : null
    };
  }

  /**
   * Check if user agent is a known good bot
   * @param {string} userAgent
   * @returns {boolean}
   * @private
   */
  _isGoodBot(userAgent) {
    if (!userAgent) return false;
    
    for (const pattern of this.goodBotPatterns) {
      if (pattern.test(userAgent)) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Calculate confidence level
   * @param {number} signalCount
   * @returns {number}
   * @private
   */
  _calculateConfidence(signalCount) {
    // More signals = higher confidence
    if (signalCount >= 4) return 95;
    if (signalCount === 3) return 80;
    if (signalCount === 2) return 65;
    if (signalCount === 1) return 50;
    return 30;
  }

  /**
   * Get routing recommendation
   * @param {number} score
   * @param {boolean} isGoodBot
   * @returns {string}
   * @private
   */
  _getRecommendation(score, isGoodBot) {
    if (isGoodBot) {
      return 'ALLOW - Known good bot';
    }
    
    if (score >= 80) {
      return 'BLOCK - High confidence bot';
    } else if (score >= 50) {
      return 'CHALLENGE - Likely bot';
    } else if (score >= 30) {
      return 'MONITOR - Suspicious activity';
    } else {
      return 'ALLOW - Likely human';
    }
  }

  /**
   * Quick bot check (lightweight)
   * @param {string} userAgent
   * @returns {boolean}
   */
  quickCheck(userAgent) {
    if (!userAgent) return true;
    
    // Check against known bot patterns
    for (const pattern of this.botPatterns) {
      if (pattern.test(userAgent)) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Get bot detection statistics
   * @param {number} domainId
   * @returns {Object}
   */
  async getBotStats(domainId) {
    try {
      // This would query bot_detections table
      // For now, return placeholder
      return {
        domainId,
        totalDetections: 0,
        byScoreRange: {
          high: 0,    // 80-100
          medium: 0,  // 50-79
          low: 0      // 0-49
        },
        topReasons: [],
        detectionRate: 0
      };
    } catch (error) {
      return this.handleError(error, 'getBotStats');
    }
  }
}
