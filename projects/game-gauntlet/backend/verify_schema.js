require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function verifySchema() {
  try {
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('\n📋 Database Tables:');
    const tables = result.rows.map(r => r.table_name);
    tables.forEach(t => console.log(`   ✅ ${t}`));
    
    console.log('\n🔍 Expected Tables:');
    const expected = ['games', 'parties', 'events', 'bets', 'wallets', 'bet_entries'];
    const found = expected.filter(t => tables.includes(t));
    const missing = expected.filter(t => !tables.includes(t));
    
    found.forEach(t => console.log(`   ✅ ${t}`));
    missing.forEach(t => console.log(`   ❌ ${t}`));
    
    if (missing.length === 0) {
      console.log('\n✨ All expected tables created successfully!');
    } else {
      console.log(`\n⚠️  Missing tables: ${missing.join(', ')}`);
    }
    
  } catch (error) {
    console.error('❌ Verification error:', error.message);
  } finally {
    await pool.end();
  }
}

verifySchema();
