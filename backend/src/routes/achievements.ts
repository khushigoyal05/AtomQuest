import { Router } from 'express';
import { PrismaClient, AchievementStatus } from '@prisma/client';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { computeScore } from '../services/scoring';
import { sendNudgeIfAtRisk } from '../services/escalation';

const router = Router();
const prisma = new PrismaClient();

// POST /api/achievements — log quarterly achievement
router.post('/', authenticate, requireRole('EMPLOYEE'), async (req: AuthRequest, res) => {
  try {
    const { goalId, quarter, actualValue, status, notes } = req.body;
    if (!goalId || !quarter) return res.status(400).json({ error: 'goalId and quarter are required' });

    const goal = await prisma.goal.findUnique({ where: { id: goalId } });
    if (!goal) return res.status(404).json({ error: 'Goal not found' });
    if (goal.employeeId !== req.user!.id) return res.status(403).json({ error: 'Not your goal' });
    if (!goal.isLocked) return res.status(400).json({ error: 'Goal must be approved before logging achievements' });

    const computedScore = actualValue !== undefined ? computeScore(goal.uom, goal.target, parseFloat(actualValue)) : undefined;

    const achievement = await prisma.achievement.upsert({
      where: { goalId_quarter: { goalId, quarter } },
      update: { actualValue: actualValue !== undefined ? parseFloat(actualValue) : undefined, status: status as AchievementStatus, notes, computedScore },
      create: { goalId, quarter, actualValue: actualValue !== undefined ? parseFloat(actualValue) : undefined, status: (status as AchievementStatus) || 'NOT_STARTED', notes, computedScore },
    });

    // Check for At-Risk
    if (computedScore !== undefined && computedScore < 50) {
      await sendNudgeIfAtRisk(goal, req.user!.id, computedScore);
    }

    res.json(achievement);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to log achievement' });
  }
});

// GET /api/achievements/:goalId — get all achievements for a goal
router.get('/:goalId', authenticate, async (req: AuthRequest, res) => {
  try {
    const achievements = await prisma.achievement.findMany({ where: { goalId: req.params.goalId }, orderBy: { quarter: 'asc' } });
    res.json(achievements);
  } catch {
    res.status(500).json({ error: 'Failed to fetch achievements' });
  }
});

export default router;
