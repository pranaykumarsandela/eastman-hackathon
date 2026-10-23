const { query } = require('../src/config/db');

async function inspect() {
  try {
    const tables = await query(
      "SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema IN ('public', 'auth') ORDER BY table_schema, table_name"
    );
    console.log('--- FOUND TABLES ---');
    console.log(tables.rows);

    const columns = await query(
      "SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' ORDER BY table_name, ordinal_position"
    );
    console.log('--- PUBLIC COLUMNS ---');
    console.log(columns.rows);
  } catch (err) {
    console.error('Inspection failed:', err.message);
  } finally {
    process.exit(0);
  }
}

inspect();
