const jwt = require('jsonwebtoken');
const config = require('../config/env');
const { query } = require('../config/db');

/**
 * Authenticates user via Bearer JWT token.
 * Attaches user to req.user.
 */
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in to continue.',
        code: 'UNAUTHORIZED'
      });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, config.jwtSecret);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired session. Please log in again.',
        code: 'TOKEN_EXPIRED'
      });
    }

    // Fetch user from DB to verify status and retrieve authoritative role
    const userRes = await query(
      'SELECT id, email, full_name, role, is_active FROM users WHERE id = $1',
      [decoded.id]
    );

    if (userRes.rowCount === 0 || !userRes.rows[0].is_active) {
      return res.status(401).json({
        success: false,
        message: 'User account not found or deactivated.',
        code: 'ACCOUNT_INACTIVE'
      });
    }

    const user = userRes.rows[0];
    req.user = {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role
    };

    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Optional authentication: if token exists, attaches user, else continues as guest.
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, config.jwtSecret);
      const userRes = await query(
        'SELECT id, email, full_name, role, is_active FROM users WHERE id = $1 AND is_active = TRUE',
        [decoded.id]
      );
      if (userRes.rowCount > 0) {
        const u = userRes.rows[0];
        req.user = {
          id: u.id,
          email: u.email,
          fullName: u.full_name,
          role: u.role
        };
      }
    } catch {
      // Ignore invalid token for optional auth
    }

    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Enforces admin authorization. Must be called after authenticateUser.
 */
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Administrator privileges required for this action.',
      code: 'FORBIDDEN'
    });
  }
  next();
};

module.exports = {
  authenticateUser,
  optionalAuth,
  requireAdmin
};
