#!/usr/bin/env node

/**
 * Nginx Log Parser for Analytics Database
 * Parses nginx access logs and imports them into SQLite database
 * Supports both batch import and real-time monitoring
 */

const fs = require('fs');
const readline = require('readline');
const sqlite3 = require('sqlite3').verbose();
const { spawn } = require('child_process');

const LOG_FILE = '/var/log/nginx/access.log';
const LOG_FILE_OLD = '/var/log/nginx/access.log.1';
const DB_FILE = './analytics.db';

// Open database connection
let db = null;

function initDatabase(callback) {
    db = new sqlite3.Database(DB_FILE, (err) => {
        if (err) {
            console.error('❌ Database error:', err);
            process.exit(1);
        }
        console.log('✅ Connected to analytics database');
        
        // Create visits table if it doesn't exist
        db.run(`CREATE TABLE IF NOT EXISTS visits (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            ip TEXT NOT NULL,
            country TEXT,
            city TEXT,
            device_type TEXT,
            browser TEXT,
            os TEXT,
            user_agent TEXT,
            url TEXT,
            referrer TEXT,
            utm_source TEXT,
            utm_medium TEXT,
            utm_campaign TEXT,
            fbclid TEXT,
            variant TEXT,
            status_code INTEGER,
            response_time INTEGER,
            bytes_sent INTEGER
        )`, (err) => {
            if (err) {
                console.error('❌ Table creation error:', err);
                process.exit(1);
            }
            
            // Create indexes
            db.run(`CREATE INDEX IF NOT EXISTS idx_timestamp ON visits(timestamp)`);
            db.run(`CREATE INDEX IF NOT EXISTS idx_ip ON visits(ip)`);
            db.run(`CREATE INDEX IF NOT EXISTS idx_device ON visits(device_type)`);
            db.run(`CREATE INDEX IF NOT EXISTS idx_utm_source ON visits(utm_source)`, () => {
                console.log('✅ Database schema initialized');
                if (callback) callback();
            });
        });
    });
}

/**
 * Parse nginx log line and extract structured data
 * Format: IP - - [timestamp] "METHOD URL HTTP/x.x" status bytes "referer" "user-agent"
 */
function parseLogLine(line) {
    if (!line || line.trim() === '') return null;
    
    try {
        // Extract IP
        const ipMatch = line.match(/^([\d\.]+)/);
        if (!ipMatch) return null;
        const ip = ipMatch[1];
        
        // Extract timestamp [19/Oct/2025:02:25:12 +0200]
        const timestampMatch = line.match(/\[([^\]]+)\]/);
        let timestamp = null;
        if (timestampMatch) {
            const dateStr = timestampMatch[1];
            // Convert nginx timestamp to SQLite datetime format
            // From: 19/Oct/2025:02:25:12 +0200
            // To: 2025-10-19 02:25:12
            const parts = dateStr.match(/(\d+)\/(\w+)\/(\d+):(\d+):(\d+):(\d+)/);
            if (parts) {
                const months = {
                    'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
                    'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
                    'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
                };
                const [, day, monthStr, year, hour, min, sec] = parts;
                const month = months[monthStr] || '01';
                timestamp = `${year}-${month}-${day.padStart(2, '0')} ${hour}:${min}:${sec}`;
            }
        }
        
        // Extract method and URL "GET /page?param=value HTTP/1.1"
        const urlMatch = line.match(/"(GET|POST|HEAD|PUT|DELETE|PATCH) ([^"]+) HTTP/);
        const url = urlMatch ? urlMatch[2] : null;
        
        // Extract status code and bytes
        const statusMatch = line.match(/HTTP\/[0-9.]+" (\d{3})/);
        const status_code = statusMatch ? parseInt(statusMatch[1]) : null;
        
        const bytesMatch = line.match(/HTTP\/[0-9.]+" \d{3} (\d+)/);
        const bytes_sent = bytesMatch ? parseInt(bytesMatch[1]) : null;
        
        // Extract referer and user agent (last two quoted strings)
        const quotedStrings = line.match(/"([^"]*)"/g);
        let referrer = null;
        let user_agent = null;
        
        if (quotedStrings && quotedStrings.length >= 3) {
            referrer = quotedStrings[quotedStrings.length - 2].replace(/"/g, '');
            user_agent = quotedStrings[quotedStrings.length - 1].replace(/"/g, '');
            
            // Clean up referrer
            if (referrer === '-' || referrer === '') referrer = null;
        }
        
        // Detect device type from user agent
        let device_type = 'desktop';
        if (user_agent) {
            // Mobile detection (including Facebook App, Instagram, WhatsApp)
            if (user_agent.includes('Mobile') || user_agent.includes('iPhone') || 
                user_agent.includes('Android') || user_agent.includes('iPad') || 
                user_agent.includes('iPod') || user_agent.includes('FBAN') || 
                user_agent.includes('FBAV') || user_agent.includes('Instagram') ||
                user_agent.includes('WhatsApp') || user_agent.includes('webOS') || 
                user_agent.includes('BlackBerry')) {
                device_type = 'mobile';
            }
            // Bot detection
            else if (user_agent.includes('bot') || user_agent.includes('crawler') || 
                     user_agent.includes('spider') || user_agent.includes('Bot') || 
                     user_agent.includes('Crawler') || user_agent.includes('Spider')) {
                device_type = 'bot';
            }
        }
        
        // Detect browser
        let browser = 'Unknown';
        if (user_agent) {
            if (user_agent.includes('Chrome') && !user_agent.includes('Edg')) browser = 'Chrome';
            else if (user_agent.includes('Safari') && !user_agent.includes('Chrome')) browser = 'Safari';
            else if (user_agent.includes('Firefox')) browser = 'Firefox';
            else if (user_agent.includes('Edg')) browser = 'Edge';
            else if (user_agent.includes('FBAN') || user_agent.includes('FBAV')) browser = 'Facebook App';
            else if (user_agent.includes('Instagram')) browser = 'Instagram';
            else if (user_agent.includes('WhatsApp')) browser = 'WhatsApp';
        }
        
        // Detect OS
        let os = 'Unknown';
        if (user_agent) {
            if (user_agent.includes('Windows')) os = 'Windows';
            else if (user_agent.includes('Mac OS')) os = 'macOS';
            else if (user_agent.includes('Android')) os = 'Android';
            else if (user_agent.includes('iPhone') || user_agent.includes('iPad')) os = 'iOS';
            else if (user_agent.includes('Linux')) os = 'Linux';
        }
        
        // Extract UTM parameters and fbclid from URL
        let utm_source = null;
        let utm_medium = null;
        let utm_campaign = null;
        let fbclid = null;
        let variant = null;
        
        if (url) {
            const utmSourceMatch = url.match(/utm_source=([^&\s]+)/);
            if (utmSourceMatch) utm_source = decodeURIComponent(utmSourceMatch[1]);
            
            const utmMediumMatch = url.match(/utm_medium=([^&\s]+)/);
            if (utmMediumMatch) utm_medium = decodeURIComponent(utmMediumMatch[1]);
            
            const utmCampaignMatch = url.match(/utm_campaign=([^&\s]+)/);
            if (utmCampaignMatch) utm_campaign = decodeURIComponent(utmCampaignMatch[1]);
            
            const fbclidMatch = url.match(/fbclid=([^&\s]+)/);
            if (fbclidMatch) fbclid = fbclidMatch[1];
            
            const variantMatch = url.match(/(?:variant|force_variant)=([^&\s]+)/);
            if (variantMatch) variant = variantMatch[1].toUpperCase();
        }
        
        return {
            timestamp,
            ip,
            country: null, // Could be enriched with GeoIP
            city: null,
            device_type,
            browser,
            os,
            user_agent,
            url: url ? url.substring(0, 500) : null, // Limit URL length
            referrer: referrer ? referrer.substring(0, 500) : null,
            utm_source,
            utm_medium,
            utm_campaign,
            fbclid,
            variant,
            status_code,
            response_time: null, // Not available in standard nginx logs
            bytes_sent
        };
    } catch (error) {
        console.error('⚠️  Parse error:', error.message, 'Line:', line.substring(0, 100));
        return null;
    }
}

/**
 * Insert visit record into database
 */
function insertVisit(visit, callback) {
    const sql = `INSERT INTO visits (
        timestamp, ip, country, city, device_type, browser, os, user_agent,
        url, referrer, utm_source, utm_medium, utm_campaign, fbclid, variant,
        status_code, response_time, bytes_sent
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
    const params = [
        visit.timestamp, visit.ip, visit.country, visit.city, visit.device_type,
        visit.browser, visit.os, visit.user_agent, visit.url, visit.referrer,
        visit.utm_source, visit.utm_medium, visit.utm_campaign, visit.fbclid,
        visit.variant, visit.status_code, visit.response_time, visit.bytes_sent
    ];
    
    db.run(sql, params, callback);
}

/**
 * Batch import log file
 */
async function importLogFile(filePath) {
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(filePath)) {
            console.log(`⚠️  Log file not found: ${filePath}`);
            return resolve(0);
        }
        
        console.log(`📖 Reading log file: ${filePath}`);
        
        const fileStream = fs.createReadStream(filePath);
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        });
        
        let processed = 0;
        let imported = 0;
        let batch = [];
        const BATCH_SIZE = 100;
        
        rl.on('line', (line) => {
            processed++;
            const visit = parseLogLine(line);
            
            if (visit && visit.ip && visit.timestamp) {
                batch.push(visit);
                
                // Insert in batches for better performance
                if (batch.length >= BATCH_SIZE) {
                    db.serialize(() => {
                        db.run('BEGIN TRANSACTION');
                        batch.forEach(v => {
                            insertVisit(v, (err) => {
                                if (err) console.error('⚠️  Insert error:', err.message);
                                else imported++;
                            });
                        });
                        db.run('COMMIT');
                    });
                    batch = [];
                }
            }
            
            if (processed % 500 === 0) {
                process.stdout.write(`\r   Processed: ${processed} lines, Imported: ${imported} visits`);
            }
        });
        
        rl.on('close', () => {
            // Insert remaining batch
            if (batch.length > 0) {
                db.serialize(() => {
                    db.run('BEGIN TRANSACTION');
                    batch.forEach(v => {
                        insertVisit(v, (err) => {
                            if (err) console.error('⚠️  Insert error:', err.message);
                            else imported++;
                        });
                    });
                    db.run('COMMIT', () => {
                        console.log(`\n✅ Imported ${imported} visits from ${processed} log lines`);
                        resolve(imported);
                    });
                });
            } else {
                console.log(`\n✅ Imported ${imported} visits from ${processed} log lines`);
                resolve(imported);
            }
        });
        
        rl.on('error', reject);
    });
}

/**
 * Monitor log file in real-time
 */
function monitorLogFile(filePath) {
    console.log(`\n👀 Monitoring log file in real-time: ${filePath}`);
    console.log('   Press Ctrl+C to stop...\n');
    
    const tail = spawn('tail', ['-F', '-n', '0', filePath]);
    
    tail.stdout.on('data', (data) => {
        const lines = data.toString().split('\n');
        lines.forEach(line => {
            if (line.trim()) {
                const visit = parseLogLine(line);
                if (visit && visit.ip && visit.timestamp) {
                    insertVisit(visit, (err) => {
                        if (err) {
                            console.error('⚠️  Insert error:', err.message);
                        } else {
                            console.log(`✅ New visit: ${visit.ip} → ${visit.url?.substring(0, 50) || 'N/A'} [${visit.device_type}]`);
                        }
                    });
                }
            }
        });
    });
    
    tail.stderr.on('data', (data) => {
        console.error(`⚠️  Tail error: ${data}`);
    });
    
    tail.on('close', (code) => {
        console.log(`\n👋 Monitoring stopped (exit code ${code})`);
        db.close();
        process.exit(code);
    });
    
    // Handle Ctrl+C gracefully
    process.on('SIGINT', () => {
        console.log('\n\n👋 Shutting down gracefully...');
        tail.kill();
        db.close(() => {
            console.log('✅ Database closed');
            process.exit(0);
        });
    });
}

/**
 * Main execution
 */
async function main() {
    const args = process.argv.slice(2);
    const mode = args[0] || 'import'; // 'import' or 'monitor'
    
    console.log('\n╔══════════════════════════════════════════════════════╗');
    console.log('║     Nginx Log Parser - Analytics Database Import     ║');
    console.log('╚══════════════════════════════════════════════════════╝\n');
    
    // Initialize database first
    initDatabase(async () => {
        if (mode === 'monitor') {
            // Real-time monitoring mode
            monitorLogFile(LOG_FILE);
        } else {
            // Batch import mode
            console.log('📦 Batch Import Mode\n');
            
            // Import old log file first (if exists)
            if (fs.existsSync(LOG_FILE_OLD)) {
                await importLogFile(LOG_FILE_OLD);
            }
            
            // Import current log file
            const imported = await importLogFile(LOG_FILE);
            
            // Show final stats
            db.get('SELECT COUNT(*) as total FROM visits', (err, row) => {
                if (err) {
                    console.error('❌ Error getting stats:', err);
                } else {
                    console.log(`\n📊 Total visits in database: ${row.total}`);
                }
                
                db.close(() => {
                    console.log('✅ Database closed\n');
                    
                    if (args.includes('--monitor')) {
                        console.log('Starting monitor mode...\n');
                        setTimeout(() => {
                            initDatabase(() => {
                                monitorLogFile(LOG_FILE);
                            });
                        }, 1000);
                    }
                });
            });
        }
    });
}

// Run main function
main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});
