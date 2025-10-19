#!/usr/bin/env node
// ============================================================================
// DATABASE TEST SCRIPT
// ============================================================================

import { DatabaseConnection } from './Database.js'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

async function testDatabase() {
  console.log('🧪 Testing Database Connection...\n')
  
  try {
    // 1. Create database connection
    const dbPath = join(__dirname, '../../data/trafikkontrol.db')
    console.log(`📁 Database path: ${dbPath}`)
    
    const db = new DatabaseConnection(dbPath)
    
    // 2. Initialize schema
    console.log('\n📋 Initializing schema...')
    await db.initialize()
    
    // 3. Test basic operations
    console.log('\n✅ Testing INSERT operations...')
    
    // Insert test domain
    db.run(`
      INSERT OR REPLACE INTO domains (id, name, display_name, status, category)
      VALUES (?, ?, ?, ?, ?)
    `, ['test-domain-1', 'test.example.com', 'Test Domain', 'active', 'test'])
    
    console.log('   ✓ Domain inserted')
    
    // Insert test visit
    db.run(`
      INSERT INTO visits (
        domain, ip, country, device_type, browser, os, user_agent,
        url, referrer, status_code, response_time,
        backend_routed, routing_reason, ip_rule_applied
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      'test.example.com',
      '192.168.1.100',
      'US',
      'mobile',
      'Chrome',
      'iOS',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
      '/',
      'https://google.com',
      200,
      150,
      'clean',
      'device_mobile',
      'none'
    ])
    
    console.log('   ✓ Visit logged')
    
    // Insert IP rule
    db.run(`
      INSERT OR REPLACE INTO ip_rules (ip, rule_type, domain, reason, added_by)
      VALUES (?, ?, ?, ?, ?)
    `, ['192.168.1.1', 'whitelist', 'test.example.com', 'Office IP', 'admin'])
    
    console.log('   ✓ IP rule created')
    
    // 4. Test SELECT operations
    console.log('\n📊 Testing SELECT operations...')
    
    const domains = db.query('SELECT * FROM domains')
    console.log(`   ✓ Found ${domains.length} domain(s)`)
    
    const visits = db.query('SELECT * FROM visits LIMIT 5')
    console.log(`   ✓ Found ${visits.length} visit(s)`)
    
    const ipRules = db.query('SELECT * FROM ip_rules')
    console.log(`   ✓ Found ${ipRules.length} IP rule(s)`)
    
    const backends = db.query('SELECT * FROM backends')
    console.log(`   ✓ Found ${backends.length} backend(s)`)
    
    // 5. Test aggregation query (Hurriyet Health style)
    console.log('\n📈 Testing Analytics Query...')
    
    const stats = db.get<any>(`
      SELECT 
        COUNT(*) as totalVisits,
        COUNT(DISTINCT ip) as uniqueIPs,
        SUM(CASE WHEN status_code = 200 THEN 1 ELSE 0 END) as successful,
        SUM(CASE WHEN device_type = 'mobile' THEN 1 ELSE 0 END) as mobile,
        SUM(CASE WHEN device_type = 'desktop' THEN 1 ELSE 0 END) as desktop
      FROM visits
      WHERE domain = ?
    `, ['test.example.com'])
    
    console.log('   Analytics Stats:')
    console.log(`     Total Visits: ${stats?.totalVisits || 0}`)
    console.log(`     Unique IPs: ${stats?.uniqueIPs || 0}`)
    console.log(`     Successful: ${stats?.successful || 0}`)
    console.log(`     Mobile: ${stats?.mobile || 0}`)
    console.log(`     Desktop: ${stats?.desktop || 0}`)
    
    // 6. Test views
    console.log('\n🔍 Testing Views...')
    
    const hourlyTraffic = db.query('SELECT * FROM v_hourly_traffic LIMIT 5')
    console.log(`   ✓ v_hourly_traffic: ${hourlyTraffic.length} rows`)
    
    const backendPerf = db.query('SELECT * FROM v_backend_performance LIMIT 5')
    console.log(`   ✓ v_backend_performance: ${backendPerf.length} rows`)
    
    // 7. Database statistics
    console.log('\n💾 Database Statistics:')
    const dbStats = db.getStats()
    console.log(`   File Size: ${(dbStats.fileSize / 1024).toFixed(2)} KB`)
    console.log(`   Page Size: ${dbStats.pageSize} bytes`)
    console.log(`   Page Count: ${dbStats.pageCount}`)
    console.log(`   Unused Space: ${(dbStats.unusedSpace / 1024).toFixed(2)} KB`)
    
    // 8. Close connection
    db.close()
    
    console.log('\n✅ ALL TESTS PASSED!\n')
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error)
    process.exit(1)
  }
}

// Run tests
testDatabase()
