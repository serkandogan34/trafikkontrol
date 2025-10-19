/**
 * API Test Suite
 * 
 * Comprehensive tests for all API endpoints
 * Tests: Health, Domains, Traffic, Bot Detection, Analytics
 */

import APIServer from './server.js';

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

// Simple HTTP client
async function request(method, path, data = null) {
  const url = `http://localhost:3001${path}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json'
    }
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(url, options);
  const json = await response.json();
  
  return {
    status: response.status,
    data: json
  };
}

async function runTests() {
  let testsDomainId = null;
  let testResults = {
    total: 0,
    passed: 0,
    failed: 0
  };

  // Start API server
  logSection('🚀 STARTING API SERVER');
  const server = new APIServer({ port: 3001 });
  await server.start();
  
  // Wait a bit for server to be ready
  await new Promise(resolve => setTimeout(resolve, 1000));

  try {
    // ========================================
    // HEALTH API TESTS
    // ========================================
    logSection('💚 HEALTH API TESTS');

    // Test 1: Health Check
    logTest('GET /api/v1/health');
    testResults.total++;
    try {
      const res = await request('GET', '/api/v1/health');
      if (res.status === 200 && res.data.success) {
        logSuccess(`Health check passed - Status: ${res.data.data.status}`);
        logInfo(`Uptime: ${res.data.data.uptime}s`);
        testResults.passed++;
      } else {
        logError(`Health check failed - Status: ${res.status}`);
        testResults.failed++;
      }
    } catch (error) {
      logError(`Health check error: ${error.message}`);
      testResults.failed++;
    }

    // ========================================
    // DOMAIN API TESTS
    // ========================================
    logSection('🌐 DOMAIN API TESTS');

    // Test 2: Create Domain
    logTest('POST /api/v1/domains');
    testResults.total++;
    try {
      const domainData = {
        name: 'apitest.com',
        status: 'active',
        clean_backend: 'https://clean.example.com',
        gray_backend: 'https://gray.example.com',
        aggressive_backend: 'https://aggressive.example.com',
        traffic_split: {
          clean: 70,
          gray: 20,
          aggressive: 10
        },
        ssl_enabled: true,
        rate_limit_enabled: true
      };

      const res = await request('POST', '/api/v1/domains', domainData);
      if (res.status === 201 && res.data.success) {
        testsDomainId = res.data.data.id;
        logSuccess(`Domain created with ID: ${testsDomainId}`);
        logInfo(`Domain: ${res.data.data.name}`);
        testResults.passed++;
      } else {
        logError(`Create domain failed - Status: ${res.status}`);
        testResults.failed++;
      }
    } catch (error) {
      logError(`Create domain error: ${error.message}`);
      testResults.failed++;
    }

    // Test 3: Get All Domains
    logTest('GET /api/v1/domains');
    testResults.total++;
    try {
      const res = await request('GET', '/api/v1/domains?page=1&limit=10');
      if (res.status === 200 && res.data.success) {
        logSuccess(`Retrieved ${res.data.data.length} domains`);
        logInfo(`Total: ${res.data.pagination.total}`);
        testResults.passed++;
      } else {
        logError(`Get domains failed - Status: ${res.status}`);
        testResults.failed++;
      }
    } catch (error) {
      logError(`Get domains error: ${error.message}`);
      testResults.failed++;
    }

    // Test 4: Get Domain by ID
    logTest(`GET /api/v1/domains/${testsDomainId}`);
    testResults.total++;
    try {
      const res = await request('GET', `/api/v1/domains/${testsDomainId}`);
      if (res.status === 200 && res.data.success) {
        logSuccess(`Domain retrieved: ${res.data.data.name}`);
        logInfo(`Status: ${res.data.data.status}`);
        testResults.passed++;
      } else {
        logError(`Get domain failed - Status: ${res.status}`);
        testResults.failed++;
      }
    } catch (error) {
      logError(`Get domain error: ${error.message}`);
      testResults.failed++;
    }

    // Test 5: Update Domain
    logTest(`PUT /api/v1/domains/${testsDomainId}`);
    testResults.total++;
    try {
      const updateData = {
        status: 'paused'
      };
      const res = await request('PUT', `/api/v1/domains/${testsDomainId}`, updateData);
      if (res.status === 200 && res.data.success) {
        logSuccess(`Domain updated - Status: ${res.data.data.status}`);
        testResults.passed++;
      } else {
        logError(`Update domain failed - Status: ${res.status}`);
        testResults.failed++;
      }
    } catch (error) {
      logError(`Update domain error: ${error.message}`);
      testResults.failed++;
    }

    // ========================================
    // BOT DETECTION API TESTS
    // ========================================
    logSection('🤖 BOT DETECTION API TESTS');

    // Test 6: Analyze Human Request
    logTest('POST /api/v1/bot-detection/analyze (Human)');
    testResults.total++;
    try {
      const humanRequest = {
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
        ip: '192.168.1.100',
        headers: {
          'accept': 'text/html',
          'accept-language': 'en-US'
        },
        behavior_data: {
          mouse_events: 45,
          keyboard_events: 12
        }
      };

      const res = await request('POST', '/api/v1/bot-detection/analyze', humanRequest);
      if (res.status === 200 && res.data.success) {
        logSuccess(`Analysis complete - Score: ${res.data.data.score}/100`);
        logInfo(`Is Bot: ${res.data.data.is_bot}`);
        logInfo(`Recommendation: ${res.data.data.recommendation}`);
        testResults.passed++;
      } else {
        logError(`Bot detection failed - Status: ${res.status}`);
        testResults.failed++;
      }
    } catch (error) {
      logError(`Bot detection error: ${error.message}`);
      testResults.failed++;
    }

    // Test 7: Analyze Bot Request
    logTest('POST /api/v1/bot-detection/analyze (Bot)');
    testResults.total++;
    try {
      const botRequest = {
        user_agent: 'python-requests/2.28.0',
        ip: '54.239.28.85',
        headers: {},
        behavior_data: {
          mouse_events: 0,
          request_rate: 150
        }
      };

      const res = await request('POST', '/api/v1/bot-detection/analyze', botRequest);
      if (res.status === 200 && res.data.success) {
        logSuccess(`Analysis complete - Score: ${res.data.data.score}/100`);
        logInfo(`Is Bot: ${res.data.data.is_bot}`);
        logInfo(`Signals: ${res.data.data.signals.length}`);
        testResults.passed++;
      } else {
        logError(`Bot detection failed - Status: ${res.status}`);
        testResults.failed++;
      }
    } catch (error) {
      logError(`Bot detection error: ${error.message}`);
      testResults.failed++;
    }

    // ========================================
    // TRAFFIC API TESTS
    // ========================================
    logSection('🚦 TRAFFIC API TESTS');

    // Reactivate domain first
    await request('PUT', `/api/v1/domains/${testsDomainId}`, { status: 'active' });

    // Test 8: Route Request
    logTest('POST /api/v1/traffic/route');
    testResults.total++;
    try {
      const routeRequest = {
        domain_name: 'apitest.com',
        visitor_ip: '192.168.1.100',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0'
      };

      const res = await request('POST', '/api/v1/traffic/route', routeRequest);
      if (res.status === 200 && res.data.success) {
        logSuccess(`Routed to: ${res.data.data.backend} backend`);
        logInfo(`URL: ${res.data.data.backend_url}`);
        testResults.passed++;
      } else {
        logError(`Route request failed - Status: ${res.status}`);
        testResults.failed++;
      }
    } catch (error) {
      logError(`Route request error: ${error.message}`);
      testResults.failed++;
    }

    // Test 9: Log Traffic
    logTest('POST /api/v1/traffic/log');
    testResults.total++;
    try {
      const logData = {
        domain_id: testsDomainId,
        visitor_ip: '192.168.1.100',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
        request_path: '/test-page',
        backend_used: 'clean',
        bot_score: 15,
        response_time: 145,
        status_code: 200,
        country: 'US'
      };

      const res = await request('POST', '/api/v1/traffic/log', logData);
      if (res.status === 201 && res.data.success) {
        logSuccess(`Traffic logged with ID: ${res.data.data.id}`);
        testResults.passed++;
      } else {
        logError(`Log traffic failed - Status: ${res.status}`);
        testResults.failed++;
      }
    } catch (error) {
      logError(`Log traffic error: ${error.message}`);
      testResults.failed++;
    }

    // ========================================
    // ANALYTICS API TESTS
    // ========================================
    logSection('📊 ANALYTICS API TESTS');

    // Test 10: Get Dashboard
    logTest('GET /api/v1/analytics/dashboard');
    testResults.total++;
    try {
      const res = await request('GET', `/api/v1/analytics/dashboard?domain_id=${testsDomainId}`);
      if (res.status === 200 && res.data.success) {
        logSuccess(`Dashboard stats retrieved`);
        logInfo(`Total Requests: ${res.data.data.totalRequests}`);
        testResults.passed++;
      } else {
        logError(`Get dashboard failed - Status: ${res.status}`);
        testResults.failed++;
      }
    } catch (error) {
      logError(`Get dashboard error: ${error.message}`);
      testResults.failed++;
    }

    // Test 11: Get Real-time Metrics
    logTest('GET /api/v1/analytics/realtime');
    testResults.total++;
    try {
      const res = await request('GET', `/api/v1/analytics/realtime?domain_id=${testsDomainId}`);
      if (res.status === 200 && res.data.success) {
        logSuccess(`Real-time metrics retrieved`);
        logInfo(`RPM: ${res.data.data.requests_per_minute}`);
        testResults.passed++;
      } else {
        logError(`Get realtime metrics failed - Status: ${res.status}`);
        testResults.failed++;
      }
    } catch (error) {
      logError(`Get realtime metrics error: ${error.message}`);
      testResults.failed++;
    }

    // ========================================
    // CLEANUP
    // ========================================
    logSection('🧹 CLEANUP');

    // Test 12: Delete Domain
    logTest(`DELETE /api/v1/domains/${testsDomainId}`);
    testResults.total++;
    try {
      const res = await request('DELETE', `/api/v1/domains/${testsDomainId}`);
      if (res.status === 200 && res.data.success) {
        logSuccess(`Domain deleted`);
        testResults.passed++;
      } else {
        logError(`Delete domain failed - Status: ${res.status}`);
        testResults.failed++;
      }
    } catch (error) {
      logError(`Delete domain error: ${error.message}`);
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
      log('\n🎉 ALL API TESTS PASSED! API LAYER IS READY! 🎉', 'green');
    } else {
      log('\n⚠️  SOME TESTS FAILED - REVIEW ERRORS ABOVE', 'yellow');
    }

    console.log('\n' + '='.repeat(80) + '\n');

  } catch (error) {
    logError(`\n💥 FATAL ERROR: ${error.message}`);
    console.error(error);
  } finally {
    // Stop server
    await server.stop();
    process.exit(testResults.failed === 0 ? 0 : 1);
  }
}

// Run tests
runTests().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
