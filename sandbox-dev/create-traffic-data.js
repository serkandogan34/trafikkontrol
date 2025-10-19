/**
 * Create Real Traffic Data for Dashboard
 * Generates realistic traffic logs to test dashboard
 */

import { getInstance as getDatabase } from './database/sqlite/connection.js';
import { TrafficRoutingService } from './core/services/index.js';

const dbConnection = getDatabase();
dbConnection.connect();
const db = dbConnection.getDB();

const trafficService = new TrafficRoutingService(db);

// Get domains
const domains = db.prepare('SELECT * FROM domains').all();

console.log(`📊 Found ${domains.length} domains`);
console.log('🔄 Creating traffic data...\n');

// Generate 50 traffic logs
const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15',
  'Googlebot/2.1 (+http://www.google.com/bot.html)',
  'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)'
];

const ips = [
  '192.168.1.100',
  '10.0.0.50',
  '172.16.0.25',
  '203.0.113.45',
  '198.51.100.78'
];

let created = 0;

for (let i = 0; i < 50; i++) {
  const domain = domains[Math.floor(Math.random() * domains.length)];
  const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
  const ip = ips[Math.floor(Math.random() * ips.length)];
  const botScore = Math.random() * 100;
  const backend = botScore > 70 ? 'aggressive' : botScore > 40 ? 'gray' : 'clean';
  
  try {
    await trafficService.logTraffic({
      domainId: domain.id,
      domainName: domain.name,
      visitorIp: ip,
      userAgent: userAgent,
      botScore: Math.round(botScore),
      backendUsed: backend,
      responseTime: Math.floor(Math.random() * 500) + 50,
      statusCode: 200,
      requestPath: '/',
      requestMethod: 'GET'
    });
    
    created++;
    process.stdout.write(`\r✅ Created ${created}/50 traffic logs...`);
  } catch (error) {
    console.error(`\n❌ Error creating traffic log: ${error.message}`);
  }
}

console.log('\n\n🎉 Traffic data created successfully!');

// Show stats
const stats = db.prepare(`
  SELECT 
    COUNT(*) as total,
    backend_used,
    AVG(bot_score) as avg_bot_score
  FROM traffic_logs
  GROUP BY backend_used
`).all();

console.log('\n📈 Traffic Statistics:');
stats.forEach(stat => {
  console.log(`  ${stat.backend_used}: ${stat.total} requests (avg bot score: ${Math.round(stat.avg_bot_score)})`);
});

// Update domain request counts
console.log('\n🔄 Updating domain request counts...');
db.prepare(`
  UPDATE domains 
  SET total_requests = (
    SELECT COUNT(*) 
    FROM traffic_logs 
    WHERE domain_id = domains.id
  )
`).run();

console.log('✅ Domain counts updated!');

process.exit(0);
