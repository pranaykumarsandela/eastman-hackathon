const app = require('./app');
const config = require('./config/env');
const { pool } = require('./config/db');

const server = app.listen(config.port, async () => {
  console.log(`===============================================`);
  console.log(`🛒 SmartCart Backend running on port ${config.port}`);
  console.log(`🌍 Environment: ${config.nodeEnv}`);
  console.log(`🔗 Health Check: http://localhost:${config.port}/api/health`);
  console.log(`📦 Database: ${config.databaseUrl.replace(/:[^:@]+@/, ':***@')}`);
  console.log(`===============================================`);

  // Quick initial check of database connectivity
  try {
    const res = await pool.query('SELECT NOW()');
    console.log(`✅ Database connection verified: ${res.rows[0].now}`);
  } catch (err) {
    console.warn(`⚠️ Database connection warning: ${err.message}`);
    console.warn(`👉 Run "npm run setup:db" or ensure your PostgreSQL server is active with matching credentials.`);
  }
});

// Graceful shutdown
const shutdown = () => {
  console.log('\n[SERVER] Gracefully shutting down...');
  server.close(async () => {
    console.log('[SERVER] Closed out remaining connections.');
    try {
      await pool.end();
      console.log('[DB] Pool has ended.');
    } catch (err) {
      console.error('[DB] Error during pool termination:', err.message);
    }
    process.exit(0);
  });

  setTimeout(() => {
    console.error('[SERVER] Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
