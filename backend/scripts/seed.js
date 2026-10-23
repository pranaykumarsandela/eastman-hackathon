const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/smartcart_db';

const pool = new Pool({
  connectionString,
  ssl: connectionString.includes('supabase.com') ? { rejectUnauthorized: false } : false
});

async function runSeed() {
  const client = await pool.connect();
  try {
    console.log('[SEED] Connected to database. Seeding demo products and coupons...');
    const seedFile = path.join(__dirname, '..', 'migrations', '002_seed_demo_data.sql');
    const sql = fs.readFileSync(seedFile, 'utf8');

    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');

    const productCountRes = await client.query('SELECT COUNT(*) FROM products');
    const couponCountRes = await client.query('SELECT COUNT(*) FROM coupons');

    console.log(`[SEED] Success! Total products: ${productCountRes.rows[0].count}, Total coupons: ${couponCountRes.rows[0].count}`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[SEED] Seeding failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  runSeed();
}

module.exports = { runSeed };
