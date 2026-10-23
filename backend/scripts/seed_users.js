const bcrypt = require('bcryptjs');
const { query } = require('../src/config/db');

async function seedUsers() {
  try {
    console.log('[SEED USERS] Seeding default demo Customer and Admin...');

    const salt = await bcrypt.genSalt(10);
    const adminPassHash = await bcrypt.hash('AdminSecret2026!', salt);
    const customerPassHash = await bcrypt.hash('Customer123!', salt);

    // 1. Seed or update Admin
    await query(
      `INSERT INTO users (email, password_hash, full_name, phone, role, is_active)
       VALUES ($1, $2, $3, $4, 'admin', TRUE)
       ON CONFLICT (email) DO UPDATE 
       SET password_hash = EXCLUDED.password_hash, role = 'admin', full_name = EXCLUDED.full_name`,
      ['admin@smartcart.com', adminPassHash, 'SmartCart Admin', '+91 9900011223']
    );
    console.log('✅ Admin user created/updated: admin@smartcart.com / AdminSecret2026!');

    // 2. Seed or update Customer
    await query(
      `INSERT INTO users (email, password_hash, full_name, phone, role, is_active)
       VALUES ($1, $2, $3, $4, 'customer', TRUE)
       ON CONFLICT (email) DO UPDATE 
       SET password_hash = EXCLUDED.password_hash, role = 'customer', full_name = EXCLUDED.full_name`,
      ['customer@smartcart.com', customerPassHash, 'Rahul Sharma (Customer)', '+91 9876543210']
    );
    console.log('✅ Customer user created/updated: customer@smartcart.com / Customer123!');

    console.log('[SEED USERS] Completed successfully.');
  } catch (err) {
    console.error('[SEED USERS] Error seeding users:', err.message);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

seedUsers();
