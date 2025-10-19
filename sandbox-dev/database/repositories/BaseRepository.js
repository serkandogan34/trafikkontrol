/**
 * BaseRepository - Abstract base class for all repositories
 * 
 * Provides common CRUD operations:
 * - find() - Find by ID
 * - findAll() - Find all records
 * - findBy() - Find by criteria
 * - create() - Create new record
 * - update() - Update existing record
 * - delete() - Delete record
 * - count() - Count records
 * 
 * @abstract
 */

class BaseRepository {
  /**
   * Constructor
   * @param {Database} db - better-sqlite3 database instance
   * @param {BaseModel} modelClass - Model class for this repository
   */
  constructor(db, modelClass) {
    if (!db) {
      throw new Error('Database instance is required');
    }
    
    if (!modelClass) {
      throw new Error('Model class is required');
    }
    
    this.db = db;
    this.modelClass = modelClass;
    this.tableName = modelClass.tableName;
    
    // Prepare common statements for better performance
    this._prepareStatements();
  }

  /**
   * Prepare frequently used SQL statements
   * @private
   */
  _prepareStatements() {
    try {
      this.stmts = {
        findById: this.db.prepare(`SELECT * FROM ${this.tableName} WHERE id = ?`),
        findAll: this.db.prepare(`SELECT * FROM ${this.tableName}`),
        count: this.db.prepare(`SELECT COUNT(*) as count FROM ${this.tableName}`),
        deleteById: this.db.prepare(`DELETE FROM ${this.tableName} WHERE id = ?`)
      };
    } catch (error) {
      console.error(`Error preparing statements for ${this.tableName}:`, error.message);
    }
  }

  /**
   * Find record by ID
   * @param {number} id - Record ID
   * @returns {BaseModel|null}
   */
  find(id) {
    try {
      const row = this.stmts.findById.get(id);
      return row ? new this.modelClass(row) : null;
    } catch (error) {
      throw new Error(`Error finding ${this.tableName} by id: ${error.message}`);
    }
  }

  /**
   * Find all records
   * @param {Object} options - Query options { limit, offset, orderBy, orderDir }
   * @returns {Array<BaseModel>}
   */
  findAll(options = {}) {
    try {
      let sql = `SELECT * FROM ${this.tableName}`;
      const params = [];

      // Order by
      if (options.orderBy) {
        const direction = options.orderDir === 'DESC' ? 'DESC' : 'ASC';
        sql += ` ORDER BY ${options.orderBy} ${direction}`;
      }

      // Limit and offset
      if (options.limit) {
        sql += ` LIMIT ?`;
        params.push(options.limit);
        
        if (options.offset) {
          sql += ` OFFSET ?`;
          params.push(options.offset);
        }
      }

      const stmt = this.db.prepare(sql);
      const rows = stmt.all(...params);
      
      return rows.map(row => new this.modelClass(row));
    } catch (error) {
      throw new Error(`Error finding all ${this.tableName}: ${error.message}`);
    }
  }

  /**
   * Find records by criteria
   * @param {Object} criteria - Search criteria as key-value pairs
   * @param {Object} options - Query options { limit, offset, orderBy, orderDir }
   * @returns {Array<BaseModel>}
   */
  findBy(criteria, options = {}) {
    try {
      const whereClause = [];
      const params = [];

      // Build WHERE clause
      for (const [key, value] of Object.entries(criteria)) {
        if (value === null) {
          whereClause.push(`${key} IS NULL`);
        } else {
          whereClause.push(`${key} = ?`);
          params.push(value);
        }
      }

      let sql = `SELECT * FROM ${this.tableName}`;
      
      if (whereClause.length > 0) {
        sql += ` WHERE ${whereClause.join(' AND ')}`;
      }

      // Order by
      if (options.orderBy) {
        const direction = options.orderDir === 'DESC' ? 'DESC' : 'ASC';
        sql += ` ORDER BY ${options.orderBy} ${direction}`;
      }

      // Limit and offset
      if (options.limit) {
        sql += ` LIMIT ?`;
        params.push(options.limit);
        
        if (options.offset) {
          sql += ` OFFSET ?`;
          params.push(options.offset);
        }
      }

      const stmt = this.db.prepare(sql);
      const rows = stmt.all(...params);
      
      return rows.map(row => new this.modelClass(row));
    } catch (error) {
      throw new Error(`Error finding ${this.tableName} by criteria: ${error.message}`);
    }
  }

  /**
   * Find one record by criteria
   * @param {Object} criteria - Search criteria
   * @returns {BaseModel|null}
   */
  findOneBy(criteria) {
    const results = this.findBy(criteria, { limit: 1 });
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Create new record
   * @param {Object|BaseModel} data - Data or model instance
   * @returns {BaseModel} - Created model with ID
   */
  create(data) {
    try {
      // Convert to model if plain object
      const model = data instanceof this.modelClass ? data : new this.modelClass(data);

      // Validate
      const validation = model.validate();
      if (!validation.valid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Set timestamps
      model.setTimestamps();

      // Get data for insert
      const insertData = model.toObject(false);
      delete insertData.id; // Remove id for auto-increment

      // Build INSERT statement
      const columns = Object.keys(insertData);
      const placeholders = columns.map(() => '?').join(', ');
      const sql = `INSERT INTO ${this.tableName} (${columns.join(', ')}) VALUES (${placeholders})`;

      const stmt = this.db.prepare(sql);
      const result = stmt.run(...Object.values(insertData));

      // Set ID and mark as clean
      model.setId(result.lastInsertRowid);
      model.markClean();

      return model;
    } catch (error) {
      throw new Error(`Error creating ${this.tableName}: ${error.message}`);
    }
  }

  /**
   * Update existing record
   * @param {number|BaseModel} idOrModel - Record ID or model instance
   * @param {Object} data - Data to update (optional if model provided)
   * @returns {BaseModel} - Updated model
   */
  update(idOrModel, data = null) {
    try {
      let model;
      let id;

      if (idOrModel instanceof this.modelClass) {
        model = idOrModel;
        id = model.getId();
      } else {
        id = idOrModel;
        model = this.find(id);
        if (!model) {
          throw new Error(`${this.tableName} with id ${id} not found`);
        }
        if (data) {
          model.load(data);
        }
      }

      // Validate
      const validation = model.validate();
      if (!validation.valid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Update timestamp
      model.setTimestamps();

      // Get changed data
      const updateData = model.toObject(false);
      delete updateData.id;

      // Build UPDATE statement
      const columns = Object.keys(updateData);
      const setClause = columns.map(col => `${col} = ?`).join(', ');
      const sql = `UPDATE ${this.tableName} SET ${setClause} WHERE id = ?`;

      const stmt = this.db.prepare(sql);
      stmt.run(...Object.values(updateData), id);

      // Mark as clean
      model.markClean();

      return model;
    } catch (error) {
      throw new Error(`Error updating ${this.tableName}: ${error.message}`);
    }
  }

  /**
   * Delete record by ID
   * @param {number} id - Record ID
   * @returns {boolean} - True if deleted
   */
  delete(id) {
    try {
      const result = this.stmts.deleteById.run(id);
      return result.changes > 0;
    } catch (error) {
      throw new Error(`Error deleting ${this.tableName}: ${error.message}`);
    }
  }

  /**
   * Count all records
   * @param {Object} criteria - Optional search criteria
   * @returns {number}
   */
  count(criteria = null) {
    try {
      if (!criteria) {
        const result = this.stmts.count.get();
        return result.count;
      }

      // Count with criteria
      const whereClause = [];
      const params = [];

      for (const [key, value] of Object.entries(criteria)) {
        if (value === null) {
          whereClause.push(`${key} IS NULL`);
        } else {
          whereClause.push(`${key} = ?`);
          params.push(value);
        }
      }

      let sql = `SELECT COUNT(*) as count FROM ${this.tableName}`;
      if (whereClause.length > 0) {
        sql += ` WHERE ${whereClause.join(' AND ')}`;
      }

      const stmt = this.db.prepare(sql);
      const result = stmt.get(...params);
      return result.count;
    } catch (error) {
      throw new Error(`Error counting ${this.tableName}: ${error.message}`);
    }
  }

  /**
   * Check if record exists
   * @param {number} id - Record ID
   * @returns {boolean}
   */
  exists(id) {
    const row = this.stmts.findById.get(id);
    return row !== undefined;
  }

  /**
   * Execute raw SQL query
   * @param {string} sql - SQL query
   * @param {Array} params - Query parameters
   * @returns {Array}
   */
  query(sql, params = []) {
    try {
      const stmt = this.db.prepare(sql);
      return stmt.all(...params);
    } catch (error) {
      throw new Error(`Error executing query: ${error.message}`);
    }
  }

  /**
   * Execute raw SQL statement (INSERT, UPDATE, DELETE)
   * @param {string} sql - SQL statement
   * @param {Array} params - Statement parameters
   * @returns {Object} - Result with changes, lastInsertRowid
   */
  execute(sql, params = []) {
    try {
      const stmt = this.db.prepare(sql);
      return stmt.run(...params);
    } catch (error) {
      throw new Error(`Error executing statement: ${error.message}`);
    }
  }

  /**
   * Begin transaction
   */
  beginTransaction() {
    this.db.prepare('BEGIN TRANSACTION').run();
  }

  /**
   * Commit transaction
   */
  commit() {
    this.db.prepare('COMMIT').run();
  }

  /**
   * Rollback transaction
   */
  rollback() {
    this.db.prepare('ROLLBACK').run();
  }

  /**
   * Execute function in transaction
   * @param {Function} fn - Function to execute
   * @returns {*} - Return value of function
   */
  transaction(fn) {
    return this.db.transaction(fn)();
  }
}

export default BaseRepository;
