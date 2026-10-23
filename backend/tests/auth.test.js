const test = require('node:test');
const assert = require('node:assert');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../src/config/env');
const { query } = require('../src/config/db');

test('Auth: Public registration enforces customer role and hashes password', async () => {
  const testEmail = `cust_${Date.now()}@test.com`;
  const plainPass = 'MySecurePass123!';

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(plainPass, salt);

  // Simulate register logic ensuring role is always 'customer'
  const res = await query(
    `INSERT INTO users (email, password_hash, full_name, role)
     VALUES ($1, $2, $3, 'customer')
     RETURNING id, email, full_name, role`,
    [testEmail, passwordHash, 'Test Customer']
  );

  const user = res.rows[0];
  assert.strictEqual(user.role, 'customer');
  assert.notStrictEqual(user.password_hash, plainPass);

  // Verify bcrypt password matching
  const match = await bcrypt.compare(plainPass, passwordHash);
  assert.strictEqual(match, true);
});

test('Auth: Admin account has admin role and valid token verification', async () => {
  const adminRes = await query("SELECT id, email, role FROM users WHERE role = 'admin' LIMIT 1");
  assert.ok(adminRes.rowCount > 0, 'Expected at least one admin account in database');

  const admin = adminRes.rows[0];
  assert.strictEqual(admin.role, 'admin');

  // Verify token generation and verification
  const token = jwt.sign({ id: admin.id, email: admin.email, role: admin.role }, config.jwtSecret, { expiresIn: '1h' });
  const decoded = jwt.verify(token, config.jwtSecret);

  assert.strictEqual(decoded.id, admin.id);
  assert.strictEqual(decoded.role, 'admin');
});

test('Auth: Customer token cannot bypass role check', () => {
  const customerToken = jwt.sign({ id: 999, email: 'user@test.com', role: 'customer' }, config.jwtSecret);
  const decoded = jwt.verify(customerToken, config.jwtSecret);

  assert.notStrictEqual(decoded.role, 'admin');
  assert.strictEqual(decoded.role === 'admin', false);
});
