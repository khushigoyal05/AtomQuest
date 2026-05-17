import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.get('/:goalId', authenticate, async (req, res) => {
  const comments = await prisma.comment.findMany({
    where: { goalId: req.params.goalId },
    include: { user: { select: { id: true, name: true, role: true } } },
    orderBy: { createdAt: 'asc' },
  });
  res.json(comments);
});

router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { goalId, text } = req.body;
    if (!goalId || !text) return res.status(400).json({ error: 'goalId and text are required' });
    const comment = await prisma.comment.create({
      data: { goalId, userId: req.user!.id, text },
      include: { user: { select: { id: true, name: true, role: true } } },
    });
    res.status(201).json(comment);
  } catch {
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const comment = await prisma.comment.findUnique({ where: { id: req.params.id } });
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    if (comment.userId !== req.user!.id && req.user!.role !== 'ADMIN') return res.status(403).json({ error: 'Not authorized' });
    await prisma.comment.delete({ where: { id: req.params.id } });
    res.json({ message: 'Comment deleted' });
  } catch {
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

export default router;
