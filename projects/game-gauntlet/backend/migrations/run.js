/**
 * Database Migration Runner
 * Executes SQL migrations in order
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function createMigrationsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);
  console.log('✅ Migrations table ready');
}

async function getExecutedMigrations() {
  const result = await pool.query('SELECT name FROM migrations ORDER BY id');
  return result.rows.map(row => row.name);
}

async function runMigrations() {
  console.log('🚀 Starting database migrations...');
  
  try {
    await createMigrationsTable();
    
    const executedMigrations = await getExecutedMigrations();
    const migrationsDir = path.join(__dirname);
    
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();
    
    for (const file of migrationFiles) {
      if (executedMigrations.includes(file)) {
        console.log(`⏭️  Skipping ${file} (already executed)`);
        continue;
      }
      
      console.log(`📄 Running migration: ${file}`);
      
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      await pool.query(sql);
      await pool.query('INSERT INTO migrations (name) VALUES ($1)', [file]);
      
      console.log(`✅ Completed: ${file}`);
    }
    
    console.log('🎉 All migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
