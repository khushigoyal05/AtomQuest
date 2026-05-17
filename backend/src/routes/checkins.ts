import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// POST /api/checkins
router.post('/', authenticate, requireRole('MANAGER', 'ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { goalId, quarter, comment } = req.body;
    if (!goalId || !quarter || !comment) return res.status(400).json({ error: 'goalId, quarter, and comment are required' });

    const checkin = await prisma.checkIn.upsert({
      where: { goalId_quarter_managerId: { goalId, quarter, managerId: req.user!.id } } as any,
      update: { comment },
      create: { goalId, managerId: req.user!.id, quarter, comment },
      include: { manager: { select: { name: true } } },
    });
    res.json(checkin);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save check-in' });
  }
});

// GET /api/checkins/:goalId
router.get('/:goalId', authenticate, async (req, res) => {
  try {
    const checkins = await prisma.checkIn.findMany({
      where: { goalId: req.params.goalId },
      include: { manager: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(checkins);
  } catch {
    res.status(500).json({ error: 'Failed to fetch check-ins' });
  }
});

export default router;
