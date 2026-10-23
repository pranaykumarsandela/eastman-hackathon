import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../db.js';
import { setSession, clearSession, requireAuth } from '../auth.js';
const router = Router();
const wrap = fn => (req, res, next) => Promise.resolve(fn(req,res,next)).catch(next);
const email = z.string().trim().email().max(254).transform(x => x.toLowerCase());
const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email,
  password: z.string().min(8).max(72)
});
const loginSchema = z.object({ email, password: z.string().min(1) });
router.post('/register', wrap(async (req,res) => {
  const data = registerSchema.parse(req.body);
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) return res.status(409).json({ error: 'Email is already registered.' });
  const passwordHash = await bcrypt.hash(data.password, 12);
  try {
    const user = await prisma.user.create({
      data: { name: data.name, email: data.email, passwordHash },
      select: { id: true, name: true, email: true }
    });
    setSession(res, user.id);
    res.status(201).json({ user });
  } catch (e) {
    if (e.code === 'P2002') return res.status(409).json({ error: 'Email is already registered.' });
    throw e;
  }
}));
router.post('/login', wrap(async (req,res) => {
  const data = loginSchema.parse(req.body);
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  const valid = user && await bcrypt.compare(data.password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: 'Invalid email or password.' });
  setSession(res, user.id);
  res.json({ user: { id: user.id, name: user.name, email: user.email } });
}));
router.post('/logout', (_req,res) => { clearSession(res); res.json({ ok: true }); });
router.get('/me', requireAuth, (req,res) => res.json({ user: req.user }));
export default router;
