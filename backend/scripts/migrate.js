const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/smartcart_db';

const pool = new Pool({
  connectionString,
  ssl: connectionString.includes('supabase.com') ? { rejectUnauthorized: false } : false
});

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log('[MIGRATE] Connected to database. Running schema migrations...');
    const migrationsDir = path.join(__dirname, '..', 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql') && !f.includes('seed'))
      .sort();

    await client.query('BEGIN');
    for (const file of files) {
      console.log(`[MIGRATE] Applying ${file}...`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      await client.query(sql);
    }
    await client.query('COMMIT');

    console.log('[MIGRATE] All schema migrations applied successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[MIGRATE] Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  runMigration();
}

module.exports = { runMigration };
