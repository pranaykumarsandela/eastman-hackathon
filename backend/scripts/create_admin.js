const bcrypt = require('bcryptjs');
const { query } = require('../src/config/db');

async function createAdmin() {
  const args = process.argv.slice(2);
  const emailIndex = args.indexOf('--email');
  const passIndex = args.indexOf('--password');
  const nameIndex = args.indexOf('--name');

  const email = emailIndex !== -1 ? args[emailIndex + 1] : null;
  const password = passIndex !== -1 ? args[passIndex + 1] : null;
  const name = nameIndex !== -1 ? args[nameIndex + 1] : 'System Administrator';

  if (!email || !password) {
    console.error('Usage: node scripts/create_admin.js --email <email> --password <password> [--name <name>]');
    process.exit(1);
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const res = await query(
      `INSERT INTO users (email, password_hash, full_name, role, is_active)
       VALUES ($1, $2, $3, 'admin', TRUE)
       ON CONFLICT (email) DO UPDATE
       SET role = 'admin', password_hash = EXCLUDED.password_hash, full_name = EXCLUDED.full_name
       RETURNING id, email, full_name, role, created_at`,
      [email.trim().toLowerCase(), passwordHash, name]
    );

    console.log('✅ Admin user successfully provisioned:');
    console.log(res.rows[0]);
  } catch (err) {
    console.error('❌ Failed to provision admin:', err.message);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

createAdmin();
