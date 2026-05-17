import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// GET /api/analytics/overview — org-wide stats
router.get('/overview', authenticate, async (req: AuthRequest, res) => {
  try {
    const totalEmployees = await prisma.user.count({ where: { role: 'EMPLOYEE' } });
    const totalGoals = await prisma.goal.count();
    const approvedGoals = await prisma.goal.count({ where: { status: 'APPROVED' } });
    const submittedGoals = await prisma.goal.count({ where: { status: 'SUBMITTED' } });
    const draftGoals = await prisma.goal.count({ where: { status: { in: ['DRAFT', 'RETURNED'] } } });
    const pendingEscalations = await prisma.escalation.count({ where: { status: 'PENDING' } });
    const achievements = await prisma.achievement.findMany({ where: { computedScore: { not: null } } });
    const avgScore = achievements.length > 0 ? achievements.reduce((s, a) => s + (a.computedScore || 0), 0) / achievements.length : 0;

    res.json({ totalEmployees, totalGoals, approvedGoals, submittedGoals, draftGoals, pendingEscalations, avgScore: Math.round(avgScore * 10) / 10 });
  } catch {
    res.status(500).json({ error: 'Failed to fetch overview' });
  }
});

// GET /api/analytics/department — department-level completion
router.get('/department', authenticate, async (req: AuthRequest, res) => {
  try {
    const departments = await prisma.user.groupBy({ by: ['department'], where: { role: 'EMPLOYEE' }, _count: { id: true } });
    const result = await Promise.all(departments.map(async (dept) => {
      const employees = await prisma.user.findMany({ where: { department: dept.department!, role: 'EMPLOYEE' }, select: { id: true } });
      const empIds = employees.map((e) => e.id);
      const goals = await prisma.goal.findMany({ where: { employeeId: { in: empIds } }, include: { achievements: true } });
      const scores = goals.flatMap((g) => g.achievements.map((a) => a.computedScore || 0));
      const avgScore = scores.length > 0 ? scores.reduce((s, x) => s + x, 0) / scores.length : 0;
      const approvedCount = goals.filter((g) => g.status === 'APPROVED').length;
      return { department: dept.department, employeeCount: dept._count.id, totalGoals: goals.length, approvedGoals: approvedCount, avgScore: Math.round(avgScore) };
    }));
    res.json(result);
  } catch {
    res.status(500).json({ error: 'Failed to fetch department analytics' });
  }
});

// GET /api/analytics/employee/:id — QoQ trend for an employee
router.get('/employee/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const goals = await prisma.goal.findMany({ where: { employeeId: req.params.id }, include: { achievements: { orderBy: { quarter: 'asc' } } } });
    const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
    const trend = quarters.map((q) => {
      const quarterAchs = goals.flatMap((g) => g.achievements.filter((a) => a.quarter === q));
      const avg = quarterAchs.length > 0 ? quarterAchs.reduce((s, a) => s + (a.computedScore || 0), 0) / quarterAchs.length : null;
      return { quarter: q, avgScore: avg !== null ? Math.round(avg * 10) / 10 : null };
    });
    res.json({ employeeId: req.params.id, trend, goals });
  } catch {
    res.status(500).json({ error: 'Failed to fetch employee trend' });
  }
});

// GET /api/analytics/team/:managerId — team trend
router.get('/team/:managerId', authenticate, async (req: AuthRequest, res) => {
  try {
    const employees = await prisma.user.findMany({ where: { managerId: req.params.managerId, role: 'EMPLOYEE' }, select: { id: true, name: true } });
    const data = await Promise.all(employees.map(async (emp) => {
      const goals = await prisma.goal.findMany({ where: { employeeId: emp.id }, include: { achievements: true } });
      const approved = goals.filter((g) => g.status === 'APPROVED').length;
      const scores = goals.flatMap((g) => g.achievements.map((a) => a.computedScore || 0));
      const avg = scores.length > 0 ? scores.reduce((s, x) => s + x, 0) / scores.length : 0;
      return { employee: emp, totalGoals: goals.length, approvedGoals: approved, avgScore: Math.round(avg) };
    }));
    res.json(data);
  } catch {
    res.status(500).json({ error: 'Failed to fetch team analytics' });
  }
});

// GET /api/analytics/thrust-areas — goal distribution by thrust area
router.get('/thrust-areas', authenticate, async (req: AuthRequest, res) => {
  try {
    const goals = await prisma.goal.groupBy({ by: ['thrustArea'], _count: { id: true } });
    res.json(goals.map((g) => ({ name: g.thrustArea, value: g._count.id })));
  } catch {
    res.status(500).json({ error: 'Failed to fetch thrust area data' });
  }
});

// GET /api/analytics/uom — goal distribution by UoM
router.get('/uom', authenticate, async (req: AuthRequest, res) => {
  try {
    const goals = await prisma.goal.groupBy({ by: ['uom'], _count: { id: true } });
    res.json(goals.map((g) => ({ name: g.uom, value: g._count.id })));
  } catch {
    res.status(500).json({ error: 'Failed to fetch UoM data' });
  }
});

// GET /api/analytics/manager-effectiveness — check-in completion rates
router.get('/manager-effectiveness', authenticate, async (req: AuthRequest, res) => {
  try {
    const managers = await prisma.user.findMany({ where: { role: 'MANAGER' }, include: { directReports: { include: { goals: { include: { checkIns: true, achievements: true } } } } } });
    const result = managers.map((mgr) => {
      const totalGoals = mgr.directReports.flatMap((e) => e.goals).length;
      const goalsWithCheckins = mgr.directReports.flatMap((e) => e.goals).filter((g) => g.checkIns.length > 0).length;
      const checkinRate = totalGoals > 0 ? Math.round((goalsWithCheckins / totalGoals) * 100) : 0;
      const scores = mgr.directReports.flatMap((e) => e.goals.flatMap((g) => g.achievements.map((a) => a.computedScore || 0)));
      const avgTeamScore = scores.length > 0 ? Math.round(scores.reduce((s, x) => s + x, 0) / scores.length) : 0;
      return { manager: { id: mgr.id, name: mgr.name, email: mgr.email }, teamSize: mgr.directReports.length, totalGoals, goalsWithCheckins, checkinRate, avgTeamScore };
    });
    res.json(result);
  } catch {
    res.status(500).json({ error: 'Failed to fetch manager effectiveness' });
  }
});

export default router;
