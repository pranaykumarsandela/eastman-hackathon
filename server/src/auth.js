import jwt from 'jsonwebtoken';
import { prisma } from './db.js';

const cookieName = 'smartcart_session';
const isProduction = process.env.NODE_ENV === 'production';
function secret() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('Set JWT_SECRET to a random string of at least 32 characters in server/.env');
  }
  return process.env.JWT_SECRET;
}
export function setSession(res, userId) {
  const token = jwt.sign({ sub: userId }, secret(), { expiresIn: '7d' });
  res.cookie(cookieName, token, {
    httpOnly: true, secure: isProduction, sameSite: 'lax',
    path: '/', maxAge: 7 * 24 * 60 * 60 * 1000
  });
}
export function clearSession(res) {
  res.clearCookie(cookieName, { httpOnly: true, secure: isProduction, sameSite: 'lax', path: '/' });
}
export async function optionalAuth(req, _res, next) {
  try {
    const token = req.cookies?.[cookieName];
    if (!token) { req.user = null; return next(); }
    const decoded = jwt.verify(token, secret(), { algorithms: ['HS256'] });
    req.user = await prisma.user.findUnique({
      where: { id: decoded.sub }, select: { id: true, name: true, email: true }
    });
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      req.user = null; return next();
    }
    next(err);
  }
}
export function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Please log in to continue.' });
  next();
}
