import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.get('/', authenticate, async (req: AuthRequest, res) => {
  const notifications = await prisma.notification.findMany({ where: { userId: req.user!.id }, orderBy: { createdAt: 'desc' }, take: 50 });
  res.json(notifications);
});

router.put('/:id/read', authenticate, async (req: AuthRequest, res) => {
  const n = await prisma.notification.update({ where: { id: req.params.id }, data: { isRead: true } });
  res.json(n);
});

router.put('/read-all', authenticate, async (req: AuthRequest, res) => {
  await prisma.notification.updateMany({ where: { userId: req.user!.id, isRead: false }, data: { isRead: true } });
  res.json({ message: 'All notifications marked as read' });
});

export default router;
