import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { computeScore } from '../services/scoring';
import { sendEmail } from '../services/email';
import { createAuditLog } from '../services/audit';

const router = Router();
const prisma = new PrismaClient();

// GET /api/goals — get current user's goals (employee) or team goals (manager)
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { role, id } = req.user!;
    const where = role === 'EMPLOYEE' ? { employeeId: id } : {};
    const goals = await prisma.goal.findMany({
      where,
      include: {
        employee: { select: { id: true, name: true, email: true, department: true } },
        achievements: true,
        _count: { select: { comments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(goals);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
});

// GET /api/goals/:id
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const goal = await prisma.goal.findUnique({
      where: { id: req.params.id },
      include: {
        employee: { select: { id: true, name: true, email: true, managerId: true } },
        achievements: { orderBy: { quarter: 'asc' } },
        checkIns: { include: { manager: { select: { name: true } } }, orderBy: { createdAt: 'desc' } },
        comments: { include: { user: { select: { id: true, name: true, role: true } } }, orderBy: { createdAt: 'asc' } },
      },
    });
    if (!goal) return res.status(404).json({ error: 'Goal not found' });
    res.json(goal);
  } catch {
    res.status(500).json({ error: 'Failed to fetch goal' });
  }
});

// POST /api/goals — create goal (employee only)
router.post('/', authenticate, requireRole('EMPLOYEE'), async (req: AuthRequest, res) => {
  try {
    const { thrustArea, title, description, uom, target, weightage, deadline } = req.body;
    if (!thrustArea || !title || !uom || target === undefined || !weightage) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    if (weightage < 10) return res.status(400).json({ error: 'Minimum weightage is 10%' });

    const existing = await prisma.goal.findMany({ where: { employeeId: req.user!.id } });
    if (existing.length >= 8) return res.status(400).json({ error: 'Maximum 8 goals allowed per employee' });

    const goal = await prisma.goal.create({
      data: { employeeId: req.user!.id, thrustArea, title, description, uom, target: parseFloat(target), weightage: parseFloat(weightage), deadline: deadline ? new Date(deadline) : undefined },
    });
    await createAuditLog({ entityType: 'goal', entityId: goal.id, changedById: req.user!.id, changeDescription: 'Goal created', newValue: title });
    res.status(201).json(goal);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create goal' });
  }
});

// PUT /api/goals/:id — update goal (employee: draft only; manager: during review)
router.put('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const goal = await prisma.goal.findUnique({ where: { id: req.params.id } });
    if (!goal) return res.status(404).json({ error: 'Goal not found' });

    const { role, id } = req.user!;
    if (role === 'EMPLOYEE' && goal.employeeId !== id) return res.status(403).json({ error: 'Not your goal' });
    if (role === 'EMPLOYEE' && goal.isLocked) return res.status(403).json({ error: 'Goal is locked after approval' });
    if (role === 'EMPLOYEE' && !['DRAFT', 'RETURNED'].includes(goal.status)) {
      return res.status(403).json({ error: 'Cannot edit submitted goal' });
    }

    const { thrustArea, title, description, uom, target, weightage, deadline } = req.body;
    const updated = await prisma.goal.update({
      where: { id: req.params.id },
      data: { thrustArea, title, description, uom, target: target !== undefined ? parseFloat(target) : undefined, weightage: weightage !== undefined ? parseFloat(weightage) : undefined, deadline: deadline ? new Date(deadline) : undefined },
    });
    await createAuditLog({ entityType: 'goal', entityId: goal.id, changedById: id, changeDescription: `Goal updated by ${role}`, oldValue: goal.title, newValue: title || goal.title });
    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Failed to update goal' });
  }
});

// DELETE /api/goals/:id
router.delete('/:id', authenticate, requireRole('EMPLOYEE'), async (req: AuthRequest, res) => {
  try {
    const goal = await prisma.goal.findUnique({ where: { id: req.params.id } });
    if (!goal) return res.status(404).json({ error: 'Goal not found' });
    if (goal.employeeId !== req.user!.id) return res.status(403).json({ error: 'Not your goal' });
    if (!['DRAFT', 'RETURNED'].includes(goal.status)) return res.status(403).json({ error: 'Cannot delete submitted/approved goal' });
    await prisma.goal.delete({ where: { id: req.params.id } });
    res.json({ message: 'Goal deleted' });
  } catch {
    res.status(500).json({ error: 'Failed to delete goal' });
  }
});

// POST /api/goals/submit — submit all draft goals for approval
router.post('/submit', authenticate, requireRole('EMPLOYEE'), async (req: AuthRequest, res) => {
  try {
    const goals = await prisma.goal.findMany({ where: { employeeId: req.user!.id, status: { in: ['DRAFT', 'RETURNED'] } } });
    if (goals.length === 0) return res.status(400).json({ error: 'No goals to submit' });

    const totalWeightage = goals.reduce((sum, g) => sum + g.weightage, 0);
    if (Math.abs(totalWeightage - 100) > 0.01) {
      return res.status(400).json({ error: `Total weightage must be 100% (currently ${totalWeightage.toFixed(1)}%)` });
    }

    await prisma.goal.updateMany({ where: { employeeId: req.user!.id, status: { in: ['DRAFT', 'RETURNED'] } }, data: { status: 'SUBMITTED' } });

    // Notify manager
    const employee = await prisma.user.findUnique({ where: { id: req.user!.id }, include: { manager: true } });
    if (employee?.manager) {
      await prisma.notification.create({ data: { userId: employee.manager.id, message: `${employee.name} has submitted goals for your approval.`, type: 'GOAL_SUBMITTED' } });
      await sendEmail({ to: employee.manager.email, subject: 'Goals Submitted for Approval', html: `<p><strong>${employee.name}</strong> has submitted their goals for your approval. Please log in to AtomQuest to review.</p>` });
    }
    for (const g of goals) {
      await createAuditLog({ entityType: 'goal', entityId: g.id, changedById: req.user!.id, changeDescription: 'Goal submitted for approval', oldValue: g.status, newValue: 'SUBMITTED' });
    }
    res.json({ message: 'Goals submitted successfully', count: goals.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit goals' });
  }
});

// POST /api/goals/:id/approve — manager approves goal
router.post('/:id/approve', authenticate, requireRole('MANAGER', 'ADMIN'), async (req: AuthRequest, res) => {
  try {
    const goal = await prisma.goal.findUnique({ where: { id: req.params.id }, include: { employee: true } });
    if (!goal) return res.status(404).json({ error: 'Goal not found' });

    const updated = await prisma.goal.update({ where: { id: req.params.id }, data: { status: 'APPROVED', isLocked: true } });
    await prisma.notification.create({ data: { userId: goal.employeeId, message: `Your goal "${goal.title}" has been approved.`, type: 'GOAL_APPROVED' } });
    await sendEmail({ to: goal.employee.email, subject: 'Goal Approved', html: `<p>Your goal <strong>"${goal.title}"</strong> has been approved and is now locked.</p>` });
    await createAuditLog({ entityType: 'goal', entityId: goal.id, changedById: req.user!.id, changeDescription: 'Goal approved by manager', oldValue: goal.status, newValue: 'APPROVED' });
    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Failed to approve goal' });
  }
});

// POST /api/goals/:id/return — manager returns goal for rework
router.post('/:id/return', authenticate, requireRole('MANAGER', 'ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ error: 'Rejection reason is required' });

    const goal = await prisma.goal.findUnique({ where: { id: req.params.id }, include: { employee: true } });
    if (!goal) return res.status(404).json({ error: 'Goal not found' });

    const updated = await prisma.goal.update({ where: { id: req.params.id }, data: { status: 'RETURNED', isLocked: false } });
    await prisma.notification.create({ data: { userId: goal.employeeId, message: `Your goal "${goal.title}" was returned for rework. Reason: ${reason}`, type: 'GOAL_RETURNED' } });
    await sendEmail({ to: goal.employee.email, subject: 'Goal Returned for Rework', html: `<p>Your goal <strong>"${goal.title}"</strong> has been returned for rework.</p><p><strong>Reason:</strong> ${reason}</p>` });
    await createAuditLog({ entityType: 'goal', entityId: goal.id, changedById: req.user!.id, changeDescription: `Goal returned for rework. Reason: ${reason}`, oldValue: goal.status, newValue: 'RETURNED' });
    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Failed to return goal' });
  }
});

// POST /api/goals/:id/unlock — admin unlocks a goal
router.post('/:id/unlock', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ error: 'Unlock reason is required' });
    const goal = await prisma.goal.findUnique({ where: { id: req.params.id } });
    if (!goal) return res.status(404).json({ error: 'Goal not found' });
    const updated = await prisma.goal.update({ where: { id: req.params.id }, data: { isLocked: false, status: 'RETURNED' } });
    await createAuditLog({ entityType: 'goal', entityId: goal.id, changedById: req.user!.id, changeDescription: `Goal unlocked by admin. Reason: ${reason}`, oldValue: 'LOCKED', newValue: 'UNLOCKED' });
    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Failed to unlock goal' });
  }
});

// GET /api/goals/manager/team — manager gets their team's goals
router.get('/manager/team', authenticate, requireRole('MANAGER', 'ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { role, id } = req.user!;
    const whereEmployee = role === 'MANAGER' ? { managerId: id } : {};
    const employees = await prisma.user.findMany({ where: { ...whereEmployee, role: 'EMPLOYEE' }, select: { id: true, name: true, email: true, department: true } });
    const employeeIds = employees.map((e) => e.id);
    const goals = await prisma.goal.findMany({
      where: { employeeId: { in: employeeIds } },
      include: { employee: { select: { id: true, name: true, email: true, department: true } }, achievements: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ employees, goals });
  } catch {
    res.status(500).json({ error: 'Failed to fetch team goals' });
  }
});

export default router;
