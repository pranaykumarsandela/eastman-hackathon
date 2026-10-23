const path = require('path');
const { Client } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { runMigration } = require('./migrate');
const { runSeed } = require('./seed');

async function setupDatabase() {
  const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/smartcart_db';
  console.log('[SETUP] Initializing database setup for:', dbUrl.replace(/:[^:@]+@/, ':***@'));

  // If Supabase, database is already 'postgres', skip CREATE DATABASE
  if (dbUrl.includes('supabase.com')) {
    console.log('[SETUP] Supabase hosted database detected. Running migrations directly...');
    await runMigration();
    await runSeed();
    return;
  }

  // Parse connection details for local DB creation
  try {
    const url = new URL(dbUrl);
    const targetDbName = url.pathname.replace(/^\//, '') || 'smartcart_db';
    
    // Connect to default 'postgres' database to create target DB if needed
    url.pathname = '/postgres';
    const adminClient = new Client({
      connectionString: url.toString()
    });

    await adminClient.connect();
    console.log(`[SETUP] Checking if database "${targetDbName}" exists...`);
    
    const checkRes = await adminClient.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [targetDbName]
    );

    if (checkRes.rowCount === 0) {
      console.log(`[SETUP] Creating database "${targetDbName}"...`);
      // CREATE DATABASE cannot run in a transaction block or with parameters
      await adminClient.query(`CREATE DATABASE "${targetDbName}"`);
      console.log(`[SETUP] Database "${targetDbName}" created successfully!`);
    } else {
      console.log(`[SETUP] Database "${targetDbName}" already exists.`);
    }

    await adminClient.end();

    // Now run migration and seed
    await runMigration();
    await runSeed();

    console.log('[SETUP] All database setup steps completed successfully!');
  } catch (err) {
    console.error('[SETUP] Database setup encountered an error:');
    console.error(err.message);
    if (err.code === '28P01') {
      console.error('\n--> Authentication failed. Please verify the PostgreSQL username/password in backend/.env');
    }
    process.exit(1);
  }
}

if (require.main === module) {
  setupDatabase();
}

module.exports = { setupDatabase };
