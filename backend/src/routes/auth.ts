import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

const generateTokens = (user: { id: string; role: string; email: string; name: string }) => {
  const access = jwt.sign(user, process.env.JWT_SECRET || 'secret', { expiresIn: (process.env.JWT_EXPIRES_IN || '24h') as any });
  const refresh = jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET || 'refresh_secret', { expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as any });
  return { access, refresh };
};

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const payload = { id: user.id, role: user.role, email: user.email, name: user.name };
    const { access, refresh } = generateTokens(payload);

    res.json({
      token: access,
      refreshToken: refresh,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, department: user.department, managerId: user.managerId },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'refresh_secret') as { id: string };
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) return res.status(401).json({ error: 'User not found' });

    const payload = { id: user.id, role: user.role, email: user.email, name: user.name };
    const { access, refresh } = generateTokens(payload);
    res.json({ token: access, refreshToken: refresh });
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, name: true, email: true, role: true, department: true, managerId: true, manager: { select: { id: true, name: true, email: true } } },
    });
    res.json(user);
  } catch {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

export default router;
