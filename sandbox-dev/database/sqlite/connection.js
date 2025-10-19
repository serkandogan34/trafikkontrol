/**
 * Database Connection Manager
 * Manages SQLite database connection with better-sqlite3
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DatabaseConnection {
  constructor(options = {}) {
    this.dbPath = options.path || path.join(__dirname, 'traffic_manager.db');
    this.options = {
      verbose: options.verbose ? console.log : null,
      fileMustExist: false,
      ...options
    };
    
    this.db = null;
    this.isConnected = false;
  }

  /**
   * Connect to database
   * @returns {Database}
   */
  connect() {
    if (this.isConnected) {
      return this.db;
    }

    try {
      // Ensure directory exists
      const dir = path.dirname(this.dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Create/open database
      this.db = new Database(this.dbPath, this.options);
      
      // Enable foreign keys
      this.db.pragma('foreign_keys = ON');
      
      // Enable WAL mode for better concurrency
      this.db.pragma('journal_mode = WAL');
      
      // Optimize performance
      this.db.pragma('synchronous = NORMAL');
      this.db.pragma('cache_size = 10000');
      this.db.pragma('temp_store = MEMORY');
      
      this.isConnected = true;
      
      console.log(`✅ Database connected: ${this.dbPath}`);
      
      return this.db;
    } catch (error) {
      console.error('❌ Database connection error:', error.message);
      throw error;
    }
  }

  /**
   * Get database instance
   * @returns {Database}
   */
  getDB() {
    if (!this.isConnected) {
      return this.connect();
    }
    return this.db;
  }

  /**
   * Close database connection
   */
  close() {
    if (this.db && this.isConnected) {
      this.db.close();
      this.isConnected = false;
      console.log('✅ Database connection closed');
    }
  }

  /**
   * Check if database file exists
   * @returns {boolean}
   */
  exists() {
    return fs.existsSync(this.dbPath);
  }

  /**
   * Get database file size
   * @returns {number} - Size in bytes
   */
  getSize() {
    if (!this.exists()) {
      return 0;
    }
    const stats = fs.statSync(this.dbPath);
    return stats.size;
  }

  /**
   * Get database info
   * @returns {Object}
   */
  getInfo() {
    const db = this.getDB();
    
    return {
      path: this.dbPath,
      exists: this.exists(),
      size: this.getSize(),
      sizeFormatted: this.formatBytes(this.getSize()),
      isConnected: this.isConnected,
      inTransaction: db.inTransaction,
      pragma: {
        foreign_keys: db.pragma('foreign_keys', { simple: true }),
        journal_mode: db.pragma('journal_mode', { simple: true }),
        synchronous: db.pragma('synchronous', { simple: true }),
        cache_size: db.pragma('cache_size', { simple: true })
      }
    };
  }

  /**
   * Format bytes to human readable
   * @param {number} bytes
   * @returns {string}
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Backup database
   * @param {string} backupPath - Backup file path
   */
  backup(backupPath) {
    const db = this.getDB();
    
    return new Promise((resolve, reject) => {
      try {
        db.backup(backupPath)
          .then(() => {
            console.log(`✅ Database backed up to: ${backupPath}`);
            resolve(backupPath);
          })
          .catch(reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Optimize database (VACUUM)
   */
  optimize() {
    const db = this.getDB();
    console.log('🔧 Optimizing database...');
    
    const sizeBefore = this.getSize();
    db.exec('VACUUM');
    const sizeAfter = this.getSize();
    
    const saved = sizeBefore - sizeAfter;
    console.log(`✅ Database optimized. Saved: ${this.formatBytes(saved)}`);
  }

  /**
   * Get table list
   * @returns {Array<string>}
   */
  getTables() {
    const db = this.getDB();
    const tables = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `).all();
    
    return tables.map(t => t.name);
  }

  /**
   * Get table info
   * @param {string} tableName
   * @returns {Object}
   */
  getTableInfo(tableName) {
    const db = this.getDB();
    
    const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();
    const indexes = db.prepare(`PRAGMA index_list(${tableName})`).all();
    const count = db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get();
    
    return {
      name: tableName,
      columns: columns,
      indexes: indexes,
      rowCount: count.count
    };
  }

  /**
   * Execute SQL file
   * @param {string} filePath - Path to SQL file
   */
  executeSQLFile(filePath) {
    const db = this.getDB();
    const sql = fs.readFileSync(filePath, 'utf8');
    
    console.log(`📝 Executing SQL file: ${filePath}`);
    db.exec(sql);
    console.log('✅ SQL file executed successfully');
  }
}

// Singleton instance
let instance = null;

/**
 * Get singleton instance
 * @param {Object} options
 * @returns {DatabaseConnection}
 */
export function getInstance(options = {}) {
  if (!instance) {
    instance = new DatabaseConnection(options);
  }
  return instance;
}

/**
 * Reset singleton (for testing)
 */
export function resetInstance() {
  if (instance) {
    instance.close();
    instance = null;
  }
}

export { DatabaseConnection };
