/**
 * Database Migration Rollback
 * Rolls back the last migration
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function rollback() {
  console.log('🔄 Rolling back last migration...');
  
  try {
    // Get last executed migration
    const result = await pool.query(
      'SELECT name FROM migrations ORDER BY id DESC LIMIT 1'
    );
    
    if (result.rows.length === 0) {
      console.log('ℹ️  No migrations to rollback');
      return;
    }
    
    const lastMigration = result.rows[0].name;
    console.log(`📄 Rolling back: ${lastMigration}`);
    
    // For now, we just remove the migration record
    // In a full implementation, you'd have down migrations
    await pool.query('DELETE FROM migrations WHERE name = $1', [lastMigration]);
    
    console.log(`✅ Rolled back: ${lastMigration}`);
    console.log('⚠️  Note: Database changes were NOT reversed. Manual cleanup may be required.');
    
  } catch (error) {
    console.error('❌ Rollback failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

rollback();
