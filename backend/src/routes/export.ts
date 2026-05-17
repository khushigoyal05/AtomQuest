import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import * as XLSX from 'xlsx';

const router = Router();
const prisma = new PrismaClient();

// GET /api/export/achievements — Excel export of planned vs actual
router.get('/achievements', authenticate, requireRole('ADMIN', 'MANAGER'), async (req: AuthRequest, res) => {
  try {
    const goals = await prisma.goal.findMany({
      include: {
        employee: { select: { name: true, email: true, department: true, manager: { select: { name: true } } } },
        achievements: { orderBy: { quarter: 'asc' } },
      },
      orderBy: { createdAt: 'asc' },
    });

    const rows: any[] = [];
    for (const goal of goals) {
      const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
      const achMap: Record<string, any> = {};
      for (const a of goal.achievements) achMap[a.quarter] = a;

      rows.push({
        'Employee Name': goal.employee.name,
        'Employee Email': goal.employee.email,
        'Department': goal.employee.department || '',
        'Manager': goal.employee.manager?.name || '',
        'Thrust Area': goal.thrustArea,
        'Goal Title': goal.title,
        'UoM Type': goal.uom,
        'Target': goal.target,
        'Weightage (%)': goal.weightage,
        'Status': goal.status,
        'Q1 Actual': achMap['Q1']?.actualValue ?? '',
        'Q1 Score (%)': achMap['Q1']?.computedScore ?? '',
        'Q1 Status': achMap['Q1']?.status ?? '',
        'Q2 Actual': achMap['Q2']?.actualValue ?? '',
        'Q2 Score (%)': achMap['Q2']?.computedScore ?? '',
        'Q2 Status': achMap['Q2']?.status ?? '',
        'Q3 Actual': achMap['Q3']?.actualValue ?? '',
        'Q3 Score (%)': achMap['Q3']?.computedScore ?? '',
        'Q3 Status': achMap['Q3']?.status ?? '',
        'Q4 Actual': achMap['Q4']?.actualValue ?? '',
        'Q4 Score (%)': achMap['Q4']?.computedScore ?? '',
        'Q4 Status': achMap['Q4']?.status ?? '',
      });
    }

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Achievements');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=AtomQuest_Achievements.xlsx');
    res.send(buf);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Export failed' });
  }
});

export default router;
