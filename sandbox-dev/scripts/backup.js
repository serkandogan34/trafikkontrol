#!/usr/bin/env node
/**
 * Database Backup Script
 * 
 * Automated backup solution for SQLite database
 * - Creates timestamped backups
 * - Retains last N backups
 * - Supports compression
 * - Can upload to cloud storage
 * 
 * Usage:
 *   node scripts/backup.js
 *   node scripts/backup.js --compress
 *   node scripts/backup.js --retain 30
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const config = {
  dbPath: process.env.DATABASE_PATH || path.join(__dirname, '../database/sqlite/traffic_manager.db'),
  backupDir: process.env.DATABASE_BACKUP_PATH || path.join(__dirname, '../backups'),
  retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '30', 10),
  compress: process.argv.includes('--compress'),
  uploadToCloud: process.env.BACKUP_UPLOAD_ENABLED === 'true'
};

// Ensure backup directory exists
if (!fs.existsSync(config.backupDir)) {
  fs.mkdirSync(config.backupDir, { recursive: true });
}

/**
 * Create timestamp for backup filename
 */
function getTimestamp() {
  const now = new Date();
  return now.toISOString().replace(/[:.]/g, '-').split('T').join('_').split('.')[0];
}

/**
 * Create database backup
 */
function createBackup() {
  try {
    console.log('📦 Starting database backup...');
    console.log(`📍 Database: ${config.dbPath}`);
    console.log(`📍 Backup directory: ${config.backupDir}`);

    // Check if database exists
    if (!fs.existsSync(config.dbPath)) {
      console.error(`❌ Database not found: ${config.dbPath}`);
      process.exit(1);
    }

    // Get database size
    const stats = fs.statSync(config.dbPath);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`📊 Database size: ${sizeMB} MB`);

    // Create backup filename
    const timestamp = getTimestamp();
    const backupName = `traffic_manager_${timestamp}.db`;
    const backupPath = path.join(config.backupDir, backupName);

    // Copy database file
    console.log(`💾 Creating backup: ${backupName}`);
    fs.copyFileSync(config.dbPath, backupPath);

    // Copy WAL and SHM files if they exist
    const walPath = `${config.dbPath}-wal`;
    const shmPath = `${config.dbPath}-shm`;
    
    if (fs.existsSync(walPath)) {
      fs.copyFileSync(walPath, `${backupPath}-wal`);
      console.log(`💾 Copied WAL file`);
    }
    
    if (fs.existsSync(shmPath)) {
      fs.copyFileSync(shmPath, `${backupPath}-shm`);
      console.log(`💾 Copied SHM file`);
    }

    // Compress backup if requested
    let finalBackupPath = backupPath;
    if (config.compress) {
      console.log(`🗜️  Compressing backup...`);
      const compressedName = `${backupName}.gz`;
      const compressedPath = path.join(config.backupDir, compressedName);
      
      execSync(`gzip -c "${backupPath}" > "${compressedPath}"`);
      
      // Remove uncompressed file
      fs.unlinkSync(backupPath);
      if (fs.existsSync(`${backupPath}-wal`)) fs.unlinkSync(`${backupPath}-wal`);
      if (fs.existsSync(`${backupPath}-shm`)) fs.unlinkSync(`${backupPath}-shm`);
      
      finalBackupPath = compressedPath;
      
      const compressedStats = fs.statSync(compressedPath);
      const compressedSizeMB = (compressedStats.size / (1024 * 1024)).toFixed(2);
      console.log(`✅ Compressed to: ${compressedSizeMB} MB`);
    }

    // Get final backup size
    const backupStats = fs.statSync(finalBackupPath);
    const backupSizeMB = (backupStats.size / (1024 * 1024)).toFixed(2);

    console.log(`✅ Backup created successfully!`);
    console.log(`📍 Location: ${finalBackupPath}`);
    console.log(`📊 Size: ${backupSizeMB} MB`);

    // Upload to cloud storage if enabled
    if (config.uploadToCloud) {
      uploadBackupToCloud(finalBackupPath);
    }

    // Clean old backups
    cleanOldBackups();

    return finalBackupPath;
  } catch (error) {
    console.error(`❌ Backup failed: ${error.message}`);
    throw error;
  }
}

/**
 * Upload backup to cloud storage
 */
function uploadBackupToCloud(backupPath) {
  console.log(`☁️  Uploading backup to cloud storage...`);
  
  // TODO: Implement cloud upload
  // Examples:
  // - AWS S3: aws s3 cp <backup> s3://bucket/backups/
  // - Google Cloud Storage: gsutil cp <backup> gs://bucket/backups/
  // - Azure Blob Storage: az storage blob upload ...
  
  console.log(`⚠️  Cloud upload not configured. Skipping...`);
}

/**
 * Clean old backups based on retention policy
 */
function cleanOldBackups() {
  try {
    console.log(`🧹 Cleaning old backups (retention: ${config.retentionDays} days)...`);

    const files = fs.readdirSync(config.backupDir);
    const backupFiles = files.filter(f => f.startsWith('traffic_manager_') && (f.endsWith('.db') || f.endsWith('.gz')));

    const now = Date.now();
    const retentionMs = config.retentionDays * 24 * 60 * 60 * 1000;
    
    let deletedCount = 0;
    let deletedSize = 0;

    for (const file of backupFiles) {
      const filePath = path.join(config.backupDir, file);
      const stats = fs.statSync(filePath);
      const age = now - stats.mtimeMs;

      if (age > retentionMs) {
        console.log(`  🗑️  Deleting old backup: ${file}`);
        deletedSize += stats.size;
        fs.unlinkSync(filePath);
        
        // Delete associated WAL and SHM files
        if (fs.existsSync(`${filePath}-wal`)) fs.unlinkSync(`${filePath}-wal`);
        if (fs.existsSync(`${filePath}-shm`)) fs.unlinkSync(`${filePath}-shm`);
        
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      const freedMB = (deletedSize / (1024 * 1024)).toFixed(2);
      console.log(`✅ Deleted ${deletedCount} old backup(s), freed ${freedMB} MB`);
    } else {
      console.log(`✅ No old backups to clean`);
    }

    // Show remaining backups
    const remainingBackups = backupFiles.length - deletedCount;
    console.log(`📊 Total backups: ${remainingBackups}`);
  } catch (error) {
    console.error(`❌ Failed to clean old backups: ${error.message}`);
  }
}

/**
 * Restore database from backup
 */
function restoreBackup(backupPath) {
  try {
    console.log(`🔄 Restoring database from backup...`);
    console.log(`📍 Backup: ${backupPath}`);

    if (!fs.existsSync(backupPath)) {
      console.error(`❌ Backup not found: ${backupPath}`);
      process.exit(1);
    }

    // Stop application before restore
    console.log(`⚠️  IMPORTANT: Ensure the application is stopped before restoring!`);

    // Decompress if needed
    let dbFilePath = backupPath;
    if (backupPath.endsWith('.gz')) {
      console.log(`🗜️  Decompressing backup...`);
      const decompressedPath = backupPath.replace('.gz', '');
      execSync(`gzip -d -c "${backupPath}" > "${decompressedPath}"`);
      dbFilePath = decompressedPath;
    }

    // Backup current database
    const currentBackupPath = `${config.dbPath}.before-restore-${getTimestamp()}`;
    if (fs.existsSync(config.dbPath)) {
      console.log(`💾 Backing up current database to: ${currentBackupPath}`);
      fs.copyFileSync(config.dbPath, currentBackupPath);
    }

    // Restore database
    console.log(`🔄 Restoring database...`);
    fs.copyFileSync(dbFilePath, config.dbPath);

    console.log(`✅ Database restored successfully!`);
    console.log(`📍 Current database backed up to: ${currentBackupPath}`);
    console.log(`⚠️  Restart the application to use the restored database.`);
  } catch (error) {
    console.error(`❌ Restore failed: ${error.message}`);
    throw error;
  }
}

/**
 * List all backups
 */
function listBackups() {
  console.log(`📋 Available backups in ${config.backupDir}:\n`);

  const files = fs.readdirSync(config.backupDir);
  const backupFiles = files.filter(f => f.startsWith('traffic_manager_') && (f.endsWith('.db') || f.endsWith('.gz')));

  if (backupFiles.length === 0) {
    console.log(`  No backups found.`);
    return;
  }

  backupFiles.sort().reverse();

  for (const file of backupFiles) {
    const filePath = path.join(config.backupDir, file);
    const stats = fs.statSync(filePath);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    const date = new Date(stats.mtime).toLocaleString();
    
    console.log(`  📦 ${file}`);
    console.log(`     Size: ${sizeMB} MB`);
    console.log(`     Date: ${date}\n`);
  }

  console.log(`  Total: ${backupFiles.length} backup(s)`);
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];

  try {
    if (command === 'restore') {
      const backupPath = process.argv[3];
      if (!backupPath) {
        console.error(`❌ Usage: node backup.js restore <backup-path>`);
        process.exit(1);
      }
      restoreBackup(backupPath);
    } else if (command === 'list') {
      listBackups();
    } else {
      // Default: create backup
      createBackup();
    }
  } catch (error) {
    console.error(`❌ Operation failed: ${error.message}`);
    process.exit(1);
  }
}

export { createBackup, restoreBackup, listBackups, cleanOldBackups };
