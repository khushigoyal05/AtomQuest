import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// ─── Cycle Management ─────────────────────────────────────────────────────────
router.get('/cycles', authenticate, async (req, res) => {
  const cycles = await prisma.cycle.findMany({ orderBy: { opensAt: 'asc' } });
  res.json(cycles);
});

router.put('/cycles/:id', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { label, opensAt, closesAt, isActive } = req.body;
    if (isActive) await prisma.cycle.updateMany({ data: { isActive: false } });
    const cycle = await prisma.cycle.update({ where: { id: req.params.id }, data: { label, opensAt: opensAt ? new Date(opensAt) : undefined, closesAt: closesAt ? new Date(closesAt) : undefined, isActive } });
    res.json(cycle);
  } catch {
    res.status(500).json({ error: 'Failed to update cycle' });
  }
});

router.post('/cycles', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { phaseName, label, opensAt, closesAt, isActive, year } = req.body;
    if (isActive) await prisma.cycle.updateMany({ data: { isActive: false } });
    const cycle = await prisma.cycle.create({ data: { phaseName, label, opensAt: new Date(opensAt), closesAt: new Date(closesAt), isActive: isActive || false, year: year || 2026 } });
    res.status(201).json(cycle);
  } catch {
    res.status(500).json({ error: 'Failed to create cycle' });
  }
});

// ─── Org Hierarchy ────────────────────────────────────────────────────────────
router.get('/users', authenticate, requireRole('ADMIN'), async (req, res) => {
  const users = await prisma.user.findMany({ include: { manager: { select: { id: true, name: true } }, directReports: { select: { id: true, name: true, role: true } } }, orderBy: { name: 'asc' } });
  res.json(users.map((u) => ({ ...u, password: undefined })));
});

router.put('/users/:id/manager', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { managerId } = req.body;
    const user = await prisma.user.update({ where: { id: req.params.id }, data: { managerId } });
    res.json({ ...user, password: undefined });
  } catch {
    res.status(500).json({ error: 'Failed to update manager' });
  }
});

// ─── Audit Log ────────────────────────────────────────────────────────────────
router.get('/audit', authenticate, requireRole('ADMIN'), async (req, res) => {
  const logs = await prisma.auditLog.findMany({ include: { changedBy: { select: { name: true, email: true, role: true } } }, orderBy: { changedAt: 'desc' }, take: 200 });
  res.json(logs);
});

// ─── Escalations ──────────────────────────────────────────────────────────────
router.get('/escalations', authenticate, requireRole('ADMIN'), async (req, res) => {
  const escalations = await prisma.escalation.findMany({ include: { triggeredFor: { select: { name: true, email: true, role: true } } }, orderBy: { triggeredAt: 'desc' } });
  res.json(escalations);
});

router.put('/escalations/:id/resolve', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const esc = await prisma.escalation.update({ where: { id: req.params.id }, data: { status: 'RESOLVED', resolvedAt: new Date(), resolvedByUserId: req.user!.id } });
    res.json(esc);
  } catch {
    res.status(500).json({ error: 'Failed to resolve escalation' });
  }
});

// ─── Escalation Rules ─────────────────────────────────────────────────────────
router.get('/escalation-rules', authenticate, requireRole('ADMIN'), async (req, res) => {
  const rules = await prisma.escalationRule.findMany();
  res.json(rules);
});

router.put('/escalation-rules/:id', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { daysThreshold, isActive } = req.body;
    const rule = await prisma.escalationRule.update({ where: { id: req.params.id }, data: { daysThreshold: parseInt(daysThreshold), isActive } });
    res.json(rule);
  } catch {
    res.status(500).json({ error: 'Failed to update rule' });
  }
});

// ─── Shared Goals ─────────────────────────────────────────────────────────────
router.post('/shared-goals', authenticate, requireRole('ADMIN', 'MANAGER'), async (req: AuthRequest, res) => {
  try {
    const { title, description, thrustArea, uom, target, recipientIds, weightage } = req.body;
    if (!recipientIds || !Array.isArray(recipientIds) || recipientIds.length === 0) {
      return res.status(400).json({ error: 'At least one recipient required' });
    }
    const parentGoal = await prisma.goal.create({
      data: { employeeId: recipientIds[0], thrustArea, title, description, uom, target: parseFloat(target), weightage: parseFloat(weightage), isShared: true, status: 'APPROVED', isLocked: true },
    });
    const shared = await Promise.all(recipientIds.map((rid: string) =>
      prisma.sharedGoal.create({ data: { goalId: parentGoal.id, recipientId: rid, customWeightage: parseFloat(weightage) } })
    ));
    for (const rid of recipientIds) {
      await prisma.notification.create({ data: { userId: rid, message: `A shared goal "${title}" has been assigned to you.`, type: 'SHARED_GOAL' } });
    }
    res.status(201).json({ parentGoal, shared });
  } catch {
    res.status(500).json({ error: 'Failed to push shared goal' });
  }
});

// ─── Completion Rates ─────────────────────────────────────────────────────────
router.get('/completion-rates', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const total = await prisma.user.count({ where: { role: 'EMPLOYEE' } });
    const withApproved = await prisma.user.count({ where: { role: 'EMPLOYEE', goals: { some: { status: 'APPROVED' } } } });
    const withSubmitted = await prisma.user.count({ where: { role: 'EMPLOYEE', goals: { some: { status: 'SUBMITTED' } } } });
    const withDraft = await prisma.user.count({ where: { role: 'EMPLOYEE', goals: { some: { status: 'DRAFT' } } } });
    const withNone = total - withApproved - withSubmitted - withDraft;
    res.json({ total, withApproved, withSubmitted, withDraft, withNone: Math.max(0, withNone) });
  } catch {
    res.status(500).json({ error: 'Failed to fetch completion rates' });
  }
});

export default router;
