/**
 * Database Migration System
 * Handles schema initialization and migrations
 */

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { getInstance } from '../connection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class MigrationManager {
  constructor(dbConnection) {
    this.dbConnection = dbConnection;
    this.db = dbConnection.getDB();
    this.schemaPath = path.join(__dirname, '../schema.sql');
  }

  /**
   * Initialize database with schema
   * @returns {boolean}
   */
  initialize() {
    try {
      console.log('🚀 Initializing database schema...');
      
      // Check if schema file exists
      if (!fs.existsSync(this.schemaPath)) {
        throw new Error(`Schema file not found: ${this.schemaPath}`);
      }

      // Read and execute schema
      const schema = fs.readFileSync(this.schemaPath, 'utf8');
      this.db.exec(schema);
      
      console.log('✅ Database schema initialized successfully');
      
      // Verify tables created
      const tables = this.dbConnection.getTables();
      console.log(`✅ Created ${tables.length} tables:`);
      tables.forEach(table => console.log(`   - ${table}`));
      
      return true;
    } catch (error) {
      console.error('❌ Schema initialization failed:', error.message);
      throw error;
    }
  }

  /**
   * Check if database is initialized
   * @returns {boolean}
   */
  isInitialized() {
    try {
      const tables = this.dbConnection.getTables();
      return tables.length > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get current schema version
   * @returns {string|null}
   */
  getCurrentVersion() {
    try {
      const result = this.db.prepare('SELECT version FROM schema_version WHERE id = 1').get();
      return result ? result.version : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Drop all tables (DANGEROUS!)
   */
  dropAll() {
    console.log('⚠️  WARNING: Dropping all tables...');
    
    const tables = this.dbConnection.getTables();
    
    // Disable foreign keys temporarily
    this.db.exec('PRAGMA foreign_keys = OFF');
    
    // Drop each table
    for (const table of tables) {
      console.log(`   - Dropping table: ${table}`);
      this.db.exec(`DROP TABLE IF EXISTS ${table}`);
    }
    
    // Re-enable foreign keys
    this.db.exec('PRAGMA foreign_keys = ON');
    
    console.log('✅ All tables dropped');
  }

  /**
   * Reset database (drop and reinitialize)
   */
  reset() {
    console.log('🔄 Resetting database...');
    this.dropAll();
    this.initialize();
    console.log('✅ Database reset complete');
  }

  /**
   * Verify schema integrity
   * @returns {Object}
   */
  verify() {
    console.log('🔍 Verifying database schema...');
    
    const results = {
      valid: true,
      tables: [],
      errors: []
    };

    const expectedTables = [
      // Base tables
      'domains', 'traffic_logs', 'sessions', 'dns_records', 
      'ab_tests', 'ab_test_results', 'bot_detections',
      
      // Performance monitoring
      'server_metrics', 'backend_health', 'uptime_records', 'performance_alerts',
      
      // Backup system
      'system_backups', 'backup_components', 'restore_history',
      
      // Campaign tracking
      'campaigns', 'campaign_metrics', 'ad_creatives', 'conversion_events',
      
      // Traffic logging
      'traffic_logs_detailed', 'search_queries', 'saved_searches',
      
      // Video processing
      'videos', 'video_versions', 'video_pages', 'video_analytics',
      
      // Meta
      'schema_version'
    ];

    const actualTables = this.dbConnection.getTables();

    // Check for missing tables
    for (const table of expectedTables) {
      if (actualTables.includes(table)) {
        results.tables.push({ name: table, status: 'ok' });
      } else {
        results.tables.push({ name: table, status: 'missing' });
        results.errors.push(`Missing table: ${table}`);
        results.valid = false;
      }
    }

    // Check for unexpected tables
    for (const table of actualTables) {
      if (!expectedTables.includes(table)) {
        results.errors.push(`Unexpected table: ${table}`);
      }
    }

    if (results.valid) {
      console.log('✅ Schema verification passed');
    } else {
      console.log('❌ Schema verification failed');
      results.errors.forEach(err => console.log(`   - ${err}`));
    }

    return results;
  }

  /**
   * Get database statistics
   * @returns {Object}
   */
  getStats() {
    const tables = this.dbConnection.getTables();
    const stats = {
      totalTables: tables.length,
      totalRows: 0,
      tables: []
    };

    for (const table of tables) {
      const info = this.dbConnection.getTableInfo(table);
      stats.totalRows += info.rowCount;
      stats.tables.push({
        name: table,
        rows: info.rowCount,
        columns: info.columns.length,
        indexes: info.indexes.length
      });
    }

    return stats;
  }

  /**
   * Print database status
   */
  printStatus() {
    console.log('\n📊 DATABASE STATUS');
    console.log('==================');
    
    const info = this.dbConnection.getInfo();
    console.log(`Path: ${info.path}`);
    console.log(`Size: ${info.sizeFormatted}`);
    console.log(`Connected: ${info.isConnected ? '✅' : '❌'}`);
    console.log(`Journal Mode: ${info.pragma.journal_mode}`);
    console.log(`Foreign Keys: ${info.pragma.foreign_keys ? 'ON' : 'OFF'}`);
    
    const version = this.getCurrentVersion();
    console.log(`Schema Version: ${version || 'N/A'}`);
    
    const stats = this.getStats();
    console.log(`\nTables: ${stats.totalTables}`);
    console.log(`Total Rows: ${stats.totalRows}`);
    
    console.log('\nTable Details:');
    stats.tables.forEach(table => {
      console.log(`  ${table.name.padEnd(25)} ${String(table.rows).padStart(8)} rows, ${table.columns} columns, ${table.indexes} indexes`);
    });
    
    console.log('');
  }
}

/**
 * CLI Interface
 */
const isMainModule = import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
  const command = process.argv[2] || 'help';
  
  const dbConnection = getInstance();
  const migrator = new MigrationManager(dbConnection);
  
  try {
    switch (command) {
      case 'init':
        migrator.initialize();
        migrator.printStatus();
        break;
        
      case 'reset':
        migrator.reset();
        migrator.printStatus();
        break;
        
      case 'verify':
        const verification = migrator.verify();
        if (!verification.valid) {
          process.exit(1);
        }
        break;
        
      case 'status':
        migrator.printStatus();
        break;
        
      case 'drop':
        migrator.dropAll();
        break;
        
      default:
        console.log(`
Database Migration Tool

Usage: node migrate.js <command>

Commands:
  init      Initialize database with schema
  reset     Drop all tables and reinitialize
  verify    Verify schema integrity
  status    Show database status
  drop      Drop all tables (DANGEROUS!)
  help      Show this help message

Examples:
  node migrate.js init
  node migrate.js status
  node migrate.js verify
        `);
    }
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    dbConnection.close();
  }
}

export default MigrationManager;
