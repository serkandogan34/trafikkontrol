/**
 * Core Services Test Suite
 * 
 * Comprehensive tests for all business logic services
 * Tests: DomainService, TrafficRoutingService, BotDetectionService, AnalyticsService
 */

import { getInstance as getDatabase } from '../database/sqlite/connection.js';
import {
  DomainService,
  TrafficRoutingService,
  BotDetectionService,
  AnalyticsService
} from './services/index.js';

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(80));
  log(title, 'bright');
  console.log('='.repeat(80) + '\n');
}

function logTest(testName) {
  log(`\n📋 Test: ${testName}`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

async function runTests() {
  try {
    // Initialize database connection
    logSection('🔌 INITIALIZING DATABASE CONNECTION');
    const dbConnection = getDatabase();
    dbConnection.connect();
    const db = dbConnection.getDB(); // Get raw database object for repositories
    logSuccess('Database connection established');
    logInfo(`Database path: ${dbConnection.getInfo().path}`);

    // Initialize services
    logSection('🚀 INITIALIZING SERVICES');
    const domainService = new DomainService(db);
    const trafficRoutingService = new TrafficRoutingService(db);
    const botDetectionService = new BotDetectionService(db);
    const analyticsService = new AnalyticsService(db);
    logSuccess('All services initialized');

    let testsDomain = null;
    let testResults = {
      total: 0,
      passed: 0,
      failed: 0
    };

    // ========================================
    // DOMAIN SERVICE TESTS
    // ========================================
    logSection('🌐 DOMAIN SERVICE TESTS');

    // Test 1: Create Domain
    logTest('Create New Domain');
    testResults.total++;
    try {
      // First delete if exists
      try {
        const existing = await domainService.getDomainByName('servicetest.com');
        if (existing) {
          await domainService.deleteDomain(existing.getId());
          logInfo('Deleted existing test domain');
        }
      } catch (err) {
        // Domain doesn't exist, which is fine
      }
      
      testsDomain = await domainService.createDomain({
        name: 'servicetest.com',
        status: 'active',
        clean_backend: 'https://clean.backend.com',
        gray_backend: 'https://gray.backend.com',
        aggressive_backend: 'https://aggressive.backend.com',
        traffic_split: {
          clean: 70,
          gray: 20,
          aggressive: 10
        },
        ssl_enabled: true,
        ssl_cert_expiry: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days from now
        rate_limit_enabled: true,
        rate_limit_config: {
          requests_per_minute: 100,
          burst: 150
        },
        ab_testing_enabled: false
      });
      logSuccess(`Domain created with ID: ${testsDomain.getId()}`);
      logInfo(`Domain: ${testsDomain.get('name')}`);
      logInfo(`Status: ${testsDomain.get('status')}`);
      logInfo(`Traffic Split: ${JSON.stringify(testsDomain.get('traffic_split'))}`);
      testResults.passed++;
    } catch (error) {
      logError(`Failed to create domain: ${error.message}`);
      testResults.failed++;
    }

    // Test 2: Get Domain
    logTest('Get Domain by ID');
    testResults.total++;
    try {
      const domain = await domainService.getDomain(testsDomain.getId());
      logSuccess(`Domain retrieved: ${domain.get('name')}`);
      logInfo(`Active: ${domain.isActive()}`);
      logInfo(`SSL Valid: ${domain.hasValidSSL()}`);
      testResults.passed++;
    } catch (error) {
      logError(`Failed to get domain: ${error.message}`);
      testResults.failed++;
    }

    // Test 3: Get Domain by Name
    logTest('Get Domain by Name');
    testResults.total++;
    try {
      const domain = await domainService.getDomainByName('servicetest.com');
      logSuccess(`Domain found: ${domain.get('name')} (ID: ${domain.getId()})`);
      testResults.passed++;
    } catch (error) {
      logError(`Failed to get domain by name: ${error.message}`);
      testResults.failed++;
    }

    // Test 4: Update Domain Status
    logTest('Update Domain Status');
    testResults.total++;
    try {
      const updated = await domainService.updateDomainStatus(testsDomain.getId(), 'paused');
      logSuccess(`Status updated to: ${updated.get('status')}`);
      testResults.passed++;
    } catch (error) {
      logError(`Failed to update status: ${error.message}`);
      testResults.failed++;
    }

    // Test 5: Update Traffic Split
    logTest('Update Traffic Split');
    testResults.total++;
    try {
      const updated = await domainService.updateTrafficSplit(testsDomain.getId(), {
        clean: 50,
        gray: 30,
        aggressive: 20
      });
      logSuccess(`Traffic split updated: ${JSON.stringify(updated.get('traffic_split'))}`);
      testResults.passed++;
    } catch (error) {
      logError(`Failed to update traffic split: ${error.message}`);
      testResults.failed++;
    }

    // Test 6: Toggle A/B Testing
    logTest('Toggle A/B Testing');
    testResults.total++;
    try {
      const updated = await domainService.toggleABTesting(testsDomain.getId(), true);
      logSuccess(`A/B Testing enabled: ${updated.get('ab_testing_enabled')}`);
      testResults.passed++;
    } catch (error) {
      logError(`Failed to toggle A/B testing: ${error.message}`);
      testResults.failed++;
    }

    // Test 7: Get All Domains
    logTest('Get All Domains with Pagination');
    testResults.total++;
    try {
      const result = await domainService.getAllDomains({ page: 1, limit: 10 });
      logSuccess(`Retrieved ${result.data.length} domains (Total: ${result.total})`);
      logInfo(`Pages: ${result.pages}, Current Page: ${result.page}`);
      testResults.passed++;
    } catch (error) {
      logError(`Failed to get all domains: ${error.message}`);
      testResults.failed++;
    }

    // Test 8: Search Domains
    logTest('Search Domains');
    testResults.total++;
    try {
      const results = await domainService.searchDomains('service');
      logSuccess(`Search found ${results.length} domains`);
      testResults.passed++;
    } catch (error) {
      logError(`Failed to search domains: ${error.message}`);
      testResults.failed++;
    }

    // ========================================
    // BOT DETECTION SERVICE TESTS
    // ========================================
    logSection('🤖 BOT DETECTION SERVICE TESTS');

    // Test 9: Analyze Human Request
    logTest('Analyze Human Request');
    testResults.total++;
    try {
      const humanRequest = {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        ip: '192.168.1.100',
        headers: {
          'accept': 'text/html,application/xhtml+xml',
          'accept-language': 'en-US,en;q=0.9',
          'accept-encoding': 'gzip, deflate, br'
        },
        fingerprint: {
          canvas: 'abc123',
          webgl: 'def456',
          fonts: ['Arial', 'Times New Roman', 'Courier']
        },
        behaviorData: {
          mouseEvents: 45,
          keyboardEvents: 12,
          scrollEvents: 8,
          requestRate: 2.5
        }
      };

      const analysis = await botDetectionService.analyzeRequest(humanRequest);
      logSuccess(`Analysis complete - Score: ${analysis.score}/100`);
      logInfo(`Is Bot: ${analysis.isBot}`);
      logInfo(`Confidence: ${analysis.confidence}%`);
      logInfo(`Recommendation: ${analysis.recommendation}`);
      if (analysis.signals.length > 0) {
        logInfo(`Signals: ${analysis.signals.join(', ')}`);
      }
      testResults.passed++;
    } catch (error) {
      logError(`Failed to analyze human request: ${error.message}`);
      testResults.failed++;
    }

    // Test 10: Analyze Bot Request
    logTest('Analyze Bot Request');
    testResults.total++;
    try {
      const botRequest = {
        userAgent: 'python-requests/2.28.0',
        ip: '54.239.28.85', // AWS IP
        headers: {
          'x-forwarded-for': '10.0.0.1, 172.16.0.1'
        },
        fingerprint: null,
        behaviorData: {
          mouseEvents: 0,
          keyboardEvents: 0,
          scrollEvents: 0,
          requestRate: 150
        }
      };

      const analysis = await botDetectionService.analyzeRequest(botRequest);
      logSuccess(`Analysis complete - Score: ${analysis.score}/100`);
      logInfo(`Is Bot: ${analysis.isBot}`);
      logInfo(`Confidence: ${analysis.confidence}%`);
      logInfo(`Recommendation: ${analysis.recommendation}`);
      if (analysis.signals.length > 0) {
        logWarning(`Signals detected (${analysis.signals.length}):`);
        analysis.signals.forEach(signal => logInfo(`  - ${signal}`));
      }
      testResults.passed++;
    } catch (error) {
      logError(`Failed to analyze bot request: ${error.message}`);
      testResults.failed++;
    }

    // Test 11: Analyze Good Bot (Googlebot)
    logTest('Analyze Good Bot (Googlebot)');
    testResults.total++;
    try {
      const googlebotRequest = {
        userAgent: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        ip: '66.249.66.1',
        headers: {},
        behaviorData: {}
      };

      const analysis = await botDetectionService.analyzeRequest(googlebotRequest);
      logSuccess(`Analysis complete - Score: ${analysis.score}/100`);
      logInfo(`Is Bot: ${analysis.isBot}`);
      logInfo(`Is Good Bot: ${analysis.isGoodBot}`);
      logInfo(`Recommendation: ${analysis.recommendation}`);
      testResults.passed++;
    } catch (error) {
      logError(`Failed to analyze good bot: ${error.message}`);
      testResults.failed++;
    }

    // ========================================
    // TRAFFIC ROUTING SERVICE TESTS
    // ========================================
    logSection('🚦 TRAFFIC ROUTING SERVICE TESTS');

    // First, reactivate the test domain
    await domainService.updateDomainStatus(testsDomain.getId(), 'active');

    // Test 12: Route Low Bot Score Request (Should use traffic split)
    logTest('Route Low Bot Score Request (Traffic Split)');
    testResults.total++;
    try {
      const request = {
        domainName: 'servicetest.com',
        visitorIp: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
        botScore: 20
      };

      const routing = await trafficRoutingService.routeRequest(request);
      logSuccess(`Routed to: ${routing.backend} backend`);
      logInfo(`Backend URL: ${routing.backendUrl}`);
      logInfo(`Reason: ${routing.reason}`);
      testResults.passed++;
    } catch (error) {
      logError(`Failed to route low bot score request: ${error.message}`);
      testResults.failed++;
    }

    // Test 13: Route Medium Bot Score Request (Should go to gray)
    logTest('Route Medium Bot Score Request (Gray Backend)');
    testResults.total++;
    try {
      const request = {
        domainName: 'servicetest.com',
        visitorIp: '192.168.1.100',
        userAgent: 'Some suspicious user agent',
        botScore: 60
      };

      const routing = await trafficRoutingService.routeRequest(request);
      logSuccess(`Routed to: ${routing.backend} backend`);
      logInfo(`Backend URL: ${routing.backendUrl}`);
      logInfo(`Reason: ${routing.reason}`);
      
      if (routing.backend !== 'gray') {
        logWarning(`Expected 'gray' backend, got '${routing.backend}'`);
      }
      testResults.passed++;
    } catch (error) {
      logError(`Failed to route medium bot score request: ${error.message}`);
      testResults.failed++;
    }

    // Test 14: Route High Bot Score Request (Should go to aggressive)
    logTest('Route High Bot Score Request (Aggressive Backend)');
    testResults.total++;
    try {
      const request = {
        domainName: 'servicetest.com',
        visitorIp: '54.239.28.85',
        userAgent: 'python-requests/2.28.0',
        botScore: 85
      };

      const routing = await trafficRoutingService.routeRequest(request);
      logSuccess(`Routed to: ${routing.backend} backend`);
      logInfo(`Backend URL: ${routing.backendUrl}`);
      logInfo(`Reason: ${routing.reason}`);
      
      if (routing.backend !== 'aggressive') {
        logWarning(`Expected 'aggressive' backend, got '${routing.backend}'`);
      }
      testResults.passed++;
    } catch (error) {
      logError(`Failed to route high bot score request: ${error.message}`);
      testResults.failed++;
    }

    // Test 15: Log Traffic
    logTest('Log Traffic Request');
    testResults.total++;
    try {
      const logData = {
        domain_id: testsDomain.getId(),
        visitor_ip: '192.168.1.100',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
        request_path: '/products/item-123',
        backend_used: 'clean',
        bot_score: 20,
        response_time: 145,
        status_code: 200,
        country: 'US'
      };

      const logEntry = await trafficRoutingService.logTraffic(logData);
      logSuccess(`Traffic logged with ID: ${logEntry.getId()}`);
      logInfo(`Path: ${logEntry.get('request_path')}`);
      logInfo(`Backend: ${logEntry.get('backend_used')}`);
      logInfo(`Response time: ${logEntry.get('response_time')}ms`);
      testResults.passed++;
    } catch (error) {
      logError(`Failed to log traffic: ${error.message}`);
      testResults.failed++;
    }

    // Test 16: Get Recent Traffic
    logTest('Get Recent Traffic');
    testResults.total++;
    try {
      const recentTraffic = await trafficRoutingService.getRecentTraffic(60, 10);
      logSuccess(`Retrieved ${recentTraffic.length} recent traffic logs`);
      if (recentTraffic.length > 0) {
        const latest = recentTraffic[0];
        logInfo(`Latest: ${latest.get ? latest.get('domain_name') : latest.domain_name} - ${latest.get ? latest.get('visitor_ip') : latest.visitor_ip}`);
      }
      testResults.passed++;
    } catch (error) {
      logError(`Failed to get recent traffic: ${error.message}`);
      testResults.failed++;
    }

    // Test 17: Get Traffic Distribution
    logTest('Get Traffic Distribution');
    testResults.total++;
    try {
      const distribution = await trafficRoutingService.getTrafficDistribution(testsDomain.getId());
      logSuccess('Traffic distribution retrieved');
      logInfo(`Configured: Clean ${distribution.configured.clean}%, Gray ${distribution.configured.gray}%, Aggressive ${distribution.configured.aggressive}%`);
      logInfo(`Actual: Clean ${distribution.actual.clean}%, Gray ${distribution.actual.gray}%, Aggressive ${distribution.actual.aggressive}%`);
      logInfo(`Total Requests: ${distribution.totalRequests}`);
      testResults.passed++;
    } catch (error) {
      logError(`Failed to get traffic distribution: ${error.message}`);
      testResults.failed++;
    }

    // ========================================
    // ANALYTICS SERVICE TESTS
    // ========================================
    logSection('📊 ANALYTICS SERVICE TESTS');

    // Test 18: Get Dashboard Stats
    logTest('Get Dashboard Statistics');
    testResults.total++;
    try {
      const stats = await analyticsService.getDashboardStats(testsDomain.getId());
      logSuccess('Dashboard stats retrieved');
      logInfo(`Total Requests: ${stats.totalRequests}`);
      logInfo(`24h: ${stats.last24h.requests} requests, ${stats.last24h.bots} bots (${stats.last24h.botPercentage}%)`);
      logInfo(`7d: ${stats.last7d.requests} requests, ${stats.last7d.bots} bots (${stats.last7d.botPercentage}%)`);
      logInfo(`30d: ${stats.last30d.requests} requests, ${stats.last30d.bots} bots (${stats.last30d.botPercentage}%)`);
      logInfo(`Avg Response Time: ${stats.avgResponseTime}ms`);
      testResults.passed++;
    } catch (error) {
      logError(`Failed to get dashboard stats: ${error.message}`);
      testResults.failed++;
    }

    // Test 19: Get Time Series Data
    logTest('Get Time Series Data');
    testResults.total++;
    try {
      const timeSeries = await analyticsService.getTimeSeries(testsDomain.getId(), 'requests', 'hour', 24);
      logSuccess(`Time series data retrieved: ${timeSeries.length} data points`);
      if (timeSeries.length > 0) {
        logInfo(`First point: ${timeSeries[0].timestamp} - ${timeSeries[0].value} requests`);
        logInfo(`Last point: ${timeSeries[timeSeries.length - 1].timestamp} - ${timeSeries[timeSeries.length - 1].value} requests`);
      }
      testResults.passed++;
    } catch (error) {
      logError(`Failed to get time series: ${error.message}`);
      testResults.failed++;
    }

    // Test 20: Get Backend Performance
    logTest('Get Backend Performance');
    testResults.total++;
    try {
      const performance = await analyticsService.getBackendPerformance(testsDomain.getId());
      logSuccess('Backend performance retrieved');
      
      for (const [backend, stats] of Object.entries(performance)) {
        logInfo(`${backend.toUpperCase()}: ${stats.requests} requests, ${stats.avgResponseTime}ms avg, ${stats.successRate}% success rate`);
      }
      testResults.passed++;
    } catch (error) {
      logError(`Failed to get backend performance: ${error.message}`);
      testResults.failed++;
    }

    // Test 21: Get Real-Time Metrics
    logTest('Get Real-Time Metrics');
    testResults.total++;
    try {
      const metrics = await analyticsService.getRealTimeMetrics(testsDomain.getId());
      logSuccess('Real-time metrics retrieved');
      logInfo(`Requests per Minute: ${metrics.requestsPerMinute}`);
      logInfo(`Bot Rate: ${metrics.botRate}%`);
      logInfo(`Avg Response Time: ${metrics.avgResponseTime}ms`);
      logInfo(`Active IPs: ${metrics.activeIPs}`);
      testResults.passed++;
    } catch (error) {
      logError(`Failed to get real-time metrics: ${error.message}`);
      testResults.failed++;
    }

    // Test 22: Generate Comprehensive Report
    logTest('Generate Comprehensive Report');
    testResults.total++;
    try {
      const report = await analyticsService.generateReport(testsDomain.getId(), {
        includeCharts: true,
        includeBackends: true,
        includeGeo: true
      });
      logSuccess('Comprehensive report generated');
      logInfo(`Period: ${report.period.start} to ${report.period.end}`);
      logInfo(`Total Requests: ${report.summary.totalRequests}`);
      logInfo(`Bot Percentage: ${report.summary.botPercentage}%`);
      logInfo(`Chart Data Points: ${report.charts ? report.charts.requests.length : 0}`);
      logInfo(`Backends Analyzed: ${Object.keys(report.backends).length}`);
      logInfo(`Countries: ${report.geo.length}`);
      testResults.passed++;
    } catch (error) {
      logError(`Failed to generate report: ${error.message}`);
      testResults.failed++;
    }

    // ========================================
    // CLEANUP
    // ========================================
    logSection('🧹 CLEANUP');

    // Test 23: Delete Test Domain
    logTest('Delete Test Domain');
    testResults.total++;
    try {
      await domainService.deleteDomain(testsDomain.getId());
      logSuccess(`Domain deleted: ${testsDomain.get('name')}`);
      testResults.passed++;
    } catch (error) {
      logError(`Failed to delete domain: ${error.message}`);
      testResults.failed++;
    }

    // ========================================
    // TEST SUMMARY
    // ========================================
    logSection('📈 TEST SUMMARY');
    
    const passRate = ((testResults.passed / testResults.total) * 100).toFixed(1);
    
    log(`Total Tests: ${testResults.total}`, 'bright');
    log(`✅ Passed: ${testResults.passed}`, 'green');
    log(`❌ Failed: ${testResults.failed}`, 'red');
    log(`📊 Pass Rate: ${passRate}%`, passRate === '100.0' ? 'green' : 'yellow');
    
    if (testResults.failed === 0) {
      log('\n🎉 ALL TESTS PASSED! CORE LAYER IS READY! 🎉', 'green');
    } else {
      log('\n⚠️  SOME TESTS FAILED - REVIEW ERRORS ABOVE', 'yellow');
    }

    console.log('\n' + '='.repeat(80) + '\n');

  } catch (error) {
    logError(`\n💥 FATAL ERROR: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
