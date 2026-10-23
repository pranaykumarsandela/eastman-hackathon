const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/env');
const { query } = require('../config/db');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
};

/**
 * POST /api/auth/register
 * Public registration ALWAYS assigns role: 'customer'
 */
const register = async (req, res, next) => {
  try {
    const { email, password, fullName, phone } = req.body;

    const normalizedEmail = email.trim().toLowerCase();

    // Check if email already registered
    const existing = await query(
      'SELECT id FROM users WHERE LOWER(email) = $1',
      [normalizedEmail]
    );

    if (existing.rowCount > 0) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists. Please log in.',
        code: 'EMAIL_EXISTS'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Explicitly enforce role = 'customer' on server side
    const result = await query(
      `INSERT INTO users (email, password_hash, full_name, phone, role, is_active)
       VALUES ($1, $2, $3, $4, 'customer', TRUE)
       RETURNING id, email, full_name, phone, role, created_at`,
      [normalizedEmail, passwordHash, fullName.trim(), phone ? phone.trim() : null]
    );

    const newUser = result.rows[0];
    const token = generateToken(newUser);

    res.status(201).json({
      success: true,
      message: 'Account registered successfully! Welcome to SmartCart.',
      data: {
        user: {
          id: newUser.id,
          email: newUser.email,
          fullName: newUser.full_name,
          phone: newUser.phone,
          role: newUser.role,
          createdAt: newUser.created_at
        },
        token
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const normalizedEmail = email.trim().toLowerCase();
    const result = await query(
      'SELECT id, email, password_hash, full_name, phone, role, is_active FROM users WHERE LOWER(email) = $1',
      [normalizedEmail]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password. Please check your credentials.',
        code: 'INVALID_CREDENTIALS'
      });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Your account is deactivated. Please contact customer support.',
        code: 'ACCOUNT_DEACTIVATED'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password. Please check your credentials.',
        code: 'INVALID_CREDENTIALS'
      });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      message: `Welcome back, ${user.full_name}!`,
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          phone: user.phone,
          role: user.role
        },
        token
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/auth/me
 */
const getMe = async (req, res, next) => {
  try {
    const result = await query(
      'SELECT id, email, full_name, phone, role, created_at FROM users WHERE id = $1 AND is_active = TRUE',
      [req.user.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.',
        code: 'USER_NOT_FOUND'
      });
    }

    const user = result.rows[0];

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        phone: user.phone,
        role: user.role,
        createdAt: user.created_at
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  getMe
};
