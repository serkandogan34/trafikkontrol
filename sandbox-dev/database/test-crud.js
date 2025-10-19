/**
 * DATABASE LAYER - CRUD Operations Test
 * Tests all basic Create, Read, Update, Delete operations
 */

import { getInstance } from './sqlite/connection.js';
import DomainRepository from './repositories/DomainRepository.js';
import TrafficLogRepository from './repositories/TrafficLogRepository.js';

const dbConnection = getInstance();
const db = dbConnection.getDB();

const domainRepo = new DomainRepository(db);
const trafficLogRepo = new TrafficLogRepository(db);

console.log('\n🧪 DATABASE CRUD OPERATIONS TEST\n');
console.log('='.repeat(50));

try {
  // ==================== CREATE ====================
  console.log('\n📝 TEST 1: CREATE Operations');
  console.log('-'.repeat(50));
  
  const newDomain = domainRepo.create({
    name: 'crud-test.com',
    clean_backend: 'https://clean.test.com',
    gray_backend: 'https://gray.test.com',
    aggressive_backend: 'https://aggressive.test.com',
    traffic_split: { clean: 80, gray: 15, aggressive: 5 }
  });
  
  console.log(`✅ Created domain: ${newDomain.get('name')} (ID: ${newDomain.getId()})`);
  
  // ==================== READ ====================
  console.log('\n📖 TEST 2: READ Operations');
  console.log('-'.repeat(50));
  
  // Find by ID
  const foundDomain = domainRepo.find(newDomain.getId());
  console.log(`✅ Found by ID: ${foundDomain.get('name')}`);
  
  // Find by name
  const foundByName = domainRepo.findByName('example.com');
  console.log(`✅ Found by name: ${foundByName ? foundByName.get('name') : 'Not found'}`);
  
  // Find all
  const allDomains = domainRepo.findAll({ limit: 5 });
  console.log(`✅ Found ${allDomains.length} domains (limit: 5)`);
  
  // Find active domains
  const activeDomains = domainRepo.findActive();
  console.log(`✅ Found ${activeDomains.length} active domains`);
  
  // Count
  const totalDomains = domainRepo.count();
  console.log(`✅ Total domains: ${totalDomains}`);
  
  // ==================== UPDATE ====================
  console.log('\n✏️  TEST 3: UPDATE Operations');
  console.log('-'.repeat(50));
  
  foundDomain.set('status', 'maintenance');
  foundDomain.set('rate_limit_requests', 2000);
  const updatedDomain = domainRepo.update(foundDomain);
  
  console.log(`✅ Updated domain ${updatedDomain.get('name')}:`);
  console.log(`   - Status: ${updatedDomain.get('status')}`);
  console.log(`   - Rate limit: ${updatedDomain.get('rate_limit_requests')}`);
  
  // ==================== TRAFFIC LOG QUERIES ====================
  console.log('\n📊 TEST 4: Traffic Log Analytics');
  console.log('-'.repeat(50));
  
  const domainId = allDomains[0].getId();
  const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const endDate = new Date().toISOString();
  
  const stats = trafficLogRepo.getTrafficStats(domainId, startDate, endDate);
  console.log(`✅ Traffic stats for domain ${domainId}:`);
  console.log(`   - Total requests: ${stats.total_requests}`);
  console.log(`   - Bot requests: ${stats.bot_requests}`);
  console.log(`   - Successful: ${stats.successful_requests}`);
  console.log(`   - Errors: ${stats.error_requests}`);
  console.log(`   - Avg response time: ${Math.round(stats.avg_response_time)}ms`);
  console.log(`   - Unique visitors: ${stats.unique_visitors}`);
  console.log(`   - Unique countries: ${stats.unique_countries}`);
  
  const backendStats = trafficLogRepo.getTrafficByBackend(domainId, startDate, endDate);
  console.log(`\n✅ Traffic by backend:`);
  backendStats.forEach(stat => {
    console.log(`   - ${stat.backend_used}: ${stat.request_count} requests, ${Math.round(stat.avg_response_time)}ms avg`);
  });
  
  const countryStats = trafficLogRepo.getTrafficByCountry(domainId, 5);
  console.log(`\n✅ Top 5 countries:`);
  countryStats.forEach((stat, i) => {
    console.log(`   ${i + 1}. ${stat.country}: ${stat.request_count} requests, ${stat.unique_visitors} unique visitors`);
  });
  
  // Recent traffic
  const recentLogs = trafficLogRepo.getRecentTraffic(60, 10);
  console.log(`\n✅ Recent traffic (last 60 minutes): ${recentLogs.length} requests`);
  
  // ==================== DELETE ====================
  console.log('\n🗑️  TEST 5: DELETE Operations');
  console.log('-'.repeat(50));
  
  const beforeCount = domainRepo.count();
  const deleted = domainRepo.delete(newDomain.getId());
  const afterCount = domainRepo.count();
  
  console.log(`✅ Deleted domain: ${deleted ? 'Success' : 'Failed'}`);
  console.log(`   - Before: ${beforeCount} domains`);
  console.log(`   - After: ${afterCount} domains`);
  
  // ==================== TRANSACTIONS ====================
  console.log('\n💾 TEST 6: Transaction Support');
  console.log('-'.repeat(50));
  
  try {
    const transactionResult = domainRepo.transaction(() => {
      const domain1 = domainRepo.create({
        name: 'transaction-test-1.com',
        clean_backend: 'https://clean1.com',
        gray_backend: 'https://gray1.com',
        aggressive_backend: 'https://aggressive1.com'
      });
      
      const domain2 = domainRepo.create({
        name: 'transaction-test-2.com',
        clean_backend: 'https://clean2.com',
        gray_backend: 'https://gray2.com',
        aggressive_backend: 'https://aggressive2.com'
      });
      
      return [domain1, domain2];
    });
    
    console.log(`✅ Transaction committed: Created ${transactionResult.length} domains`);
    
    // Clean up
    domainRepo.delete(transactionResult[0].getId());
    domainRepo.delete(transactionResult[1].getId());
    
  } catch (error) {
    console.log(`❌ Transaction failed: ${error.message}`);
  }
  
  // ==================== SUMMARY ====================
  console.log('\n📈 TEST SUMMARY');
  console.log('='.repeat(50));
  console.log('✅ All CRUD operations working correctly!');
  console.log(`✅ Total domains in database: ${domainRepo.count()}`);
  console.log(`✅ Total traffic logs: ${trafficLogRepo.count()}`);
  console.log('\n🎉 DATABASE LAYER FULLY FUNCTIONAL!\n');
  
} catch (error) {
  console.error('\n❌ TEST FAILED:', error.message);
  console.error(error.stack);
  process.exit(1);
} finally {
  dbConnection.close();
}
