// ============================================================================
// DATABASE CONNECTION AND OPERATIONS
// ============================================================================
// SQLite database with async/await support
// ============================================================================

import Database from 'better-sqlite3'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

// ES Module __dirname equivalent
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export class DatabaseConnection {
  private db: Database.Database
  private readonly dbPath: string
  
  constructor(dbPath: string = './data/trafikkontrol.db') {
    this.dbPath = dbPath
    this.db = new Database(dbPath, {
      verbose: process.env.NODE_ENV === 'development' ? console.log : undefined
    })
    
    // Enable WAL mode for better concurrency
    this.db.pragma('journal_mode = WAL')
    this.db.pragma('synchronous = NORMAL')
    this.db.pragma('foreign_keys = ON')
    
    console.log(`✅ Database connected: ${dbPath}`)
  }
  
  /**
   * Initialize database schema
   */
  async initialize(): Promise<void> {
    try {
      const schemaPath = join(__dirname, 'schema.sql')
      const schema = readFileSync(schemaPath, 'utf-8')
      
      // Remove comments and normalize
      const cleanedSchema = schema
        .split('\n')
        .filter(line => {
          const trimmed = line.trim()
          return trimmed.length > 0 && !trimmed.startsWith('--')
        })
        .join('\n')
      
      // Execute entire schema at once (SQLite handles multiple statements)
      this.db.exec(cleanedSchema)
      
      console.log('✅ Database schema initialized')
    } catch (error) {
      console.error('❌ Failed to initialize database:', error)
      throw error
    }
  }
  
  /**
   * Execute a query that returns multiple rows
   */
  query<T = any>(sql: string, params: any[] = []): T[] {
    try {
      const stmt = this.db.prepare(sql)
      return stmt.all(...params) as T[]
    } catch (error: any) {
      console.error('Query error:', error.message, sql.substring(0, 100))
      throw error
    }
  }
  
  /**
   * Execute a query that returns a single row
   */
  get<T = any>(sql: string, params: any[] = []): T | undefined {
    try {
      const stmt = this.db.prepare(sql)
      return stmt.get(...params) as T | undefined
    } catch (error: any) {
      console.error('Get error:', error.message, sql.substring(0, 100))
      throw error
    }
  }
  
  /**
   * Execute a query that modifies data (INSERT, UPDATE, DELETE)
   */
  run(sql: string, params: any[] = []): Database.RunResult {
    try {
      const stmt = this.db.prepare(sql)
      return stmt.run(...params)
    } catch (error: any) {
      console.error('Run error:', error.message, sql.substring(0, 100))
      throw error
    }
  }
  
  /**
   * Execute multiple statements in a transaction
   */
  transaction<T>(fn: () => T): T {
    const trans = this.db.transaction(fn)
    return trans()
  }
  
  /**
   * Prepare a statement for reuse
   */
  prepare<T = any>(sql: string): Database.Statement<T[]> {
    return this.db.prepare<T[]>(sql)
  }
  
  /**
   * Close the database connection
   */
  close(): void {
    this.db.close()
    console.log('✅ Database connection closed')
  }
  
  /**
   * Backup database to file
   */
  async backup(backupPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.backup(backupPath)
        .then(() => {
          console.log(`✅ Database backed up to: ${backupPath}`)
          resolve()
        })
        .catch(reject)
    })
  }
  
  /**
   * Get database statistics
   */
  getStats(): DatabaseStats {
    const pageSize = this.db.pragma('page_size', { simple: true }) as number
    const pageCount = this.db.pragma('page_count', { simple: true }) as number
    const freelistCount = this.db.pragma('freelist_count', { simple: true }) as number
    
    return {
      pageSize,
      pageCount,
      freelistCount,
      fileSize: pageSize * pageCount,
      unusedSpace: pageSize * freelistCount
    }
  }
  
  /**
   * Optimize database (VACUUM)
   */
  optimize(): void {
    console.log('🔧 Optimizing database...')
    this.db.exec('VACUUM')
    console.log('✅ Database optimized')
  }
  
  /**
   * Clear old records (cleanup)
   */
  cleanup(daysToKeep: number = 30): number {
    const sql = `
      DELETE FROM visits 
      WHERE timestamp < datetime('now', '-${daysToKeep} days')
    `
    const result = this.run(sql)
    console.log(`🗑️  Cleaned up ${result.changes} old visit records`)
    return result.changes
  }
}

export interface DatabaseStats {
  pageSize: number
  pageCount: number
  freelistCount: number
  fileSize: number
  unusedSpace: number
}

// ============================================================================
// DATABASE SINGLETON
// ============================================================================

let dbInstance: DatabaseConnection | null = null

export function getDatabase(dbPath?: string): DatabaseConnection {
  if (!dbInstance) {
    dbInstance = new DatabaseConnection(dbPath)
  }
  return dbInstance
}

export function closeDatabaseConnection(): void {
  if (dbInstance) {
    dbInstance.close()
    dbInstance = null
  }
}
