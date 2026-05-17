import { PrismaClient } from '@prisma/client';
import { sendEmail } from './email';

const prisma = new PrismaClient();

export async function runEscalationCheck() {
  try {
    const rules = await prisma.escalationRule.findMany({ where: { isActive: true } });
    const now = new Date();

    for (const rule of rules) {
      if (rule.ruleType === 'SUBMISSION_OVERDUE') {
        // Find employees with no submitted/approved goals, past threshold
        const employees = await prisma.user.findMany({
          where: {
            role: 'EMPLOYEE',
            goals: { none: { status: { in: ['SUBMITTED', 'APPROVED', 'LOCKED'] } } },
          },
          include: { goals: true },
        });

        for (const emp of employees) {
          const daysSinceCreated = (now.getTime() - emp.createdAt.getTime()) / (1000 * 60 * 60 * 24);
          if (daysSinceCreated < rule.daysThreshold) continue;

          // Check if escalation already exists
          const existing = await prisma.escalation.findFirst({ where: { triggeredForId: emp.id, ruleType: rule.ruleType, status: 'PENDING' } });
          if (existing) continue;

          await prisma.escalation.create({
            data: { ruleType: rule.ruleType, triggeredForId: emp.id, status: 'PENDING', message: `${emp.name} has not submitted goals after ${rule.daysThreshold} days.`, triggeredAt: now },
          });
          await sendEmail({ to: emp.email, subject: 'Action Required: Submit Your Goals', html: `<p>Hi ${emp.name},</p><p>You have not submitted your goals yet. The deadline is approaching. Please log in to AtomQuest and submit your goals immediately.</p><a href="${process.env.FRONTEND_URL}" class="btn">Go to AtomQuest</a>` });

          // Notify admin
          const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
          for (const admin of admins) {
            await prisma.notification.create({ data: { userId: admin.id, message: `Escalation: ${emp.name} has not submitted goals after ${rule.daysThreshold} days.`, type: 'ESCALATION' } });
          }
        }
      }

      if (rule.ruleType === 'APPROVAL_OVERDUE') {
        // Find managers with employees having SUBMITTED goals past threshold
        const submittedGoals = await prisma.goal.findMany({
          where: { status: 'SUBMITTED', updatedAt: { lt: new Date(now.getTime() - rule.daysThreshold * 24 * 60 * 60 * 1000) } },
          include: { employee: { include: { manager: true } } },
        });

        for (const goal of submittedGoals) {
          const manager = goal.employee.manager;
          if (!manager) continue;

          const existing = await prisma.escalation.findFirst({ where: { triggeredForId: manager.id, ruleType: rule.ruleType, status: 'PENDING' } });
          if (existing) continue;

          await prisma.escalation.create({
            data: { ruleType: rule.ruleType, triggeredForId: manager.id, status: 'PENDING', message: `Manager ${manager.name} has not approved ${goal.employee.name}'s goals after ${rule.daysThreshold} days.`, triggeredAt: now },
          });

          // Notify admin/HR
          const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
          for (const admin of admins) {
            await prisma.notification.create({ data: { userId: admin.id, message: `Escalation: ${manager.name} has not approved ${goal.employee.name}'s goals after ${rule.daysThreshold} days.`, type: 'ESCALATION' } });
            await sendEmail({ to: admin.email, subject: 'Escalation: Manager Approval Overdue', html: `<p>Manager <strong>${manager.name}</strong> has not approved <strong>${goal.employee.name}'s</strong> goals after ${rule.daysThreshold} days. Please follow up.</p>` });
          }
        }
      }
    }
    console.log('✅ Escalation check completed');
  } catch (err) {
    console.error('❌ Escalation check failed:', err);
  }
}

export async function sendNudgeIfAtRisk(goal: { id: string; title: string; employeeId: string }, employeeId: string, score: number) {
  try {
    const employee = await prisma.user.findUnique({ where: { id: employeeId }, include: { manager: true } });
    if (!employee) return;

    await prisma.notification.create({ data: { userId: employeeId, message: `⚠️ Goal "${goal.title}" is At Risk with a score of ${score.toFixed(1)}%. Please take immediate action.`, type: 'NUDGE' } });
    if (employee.manager) {
      await prisma.notification.create({ data: { userId: employee.manager.id, message: `⚠️ ${employee.name}'s goal "${goal.title}" is At Risk (${score.toFixed(1)}%). Please schedule a check-in.`, type: 'NUDGE' } });
      await sendEmail({ to: employee.manager.email, subject: `⚠️ At Risk Goal Alert: ${employee.name}`, html: `<p>Hi ${employee.manager.name},</p><p>Your team member <strong>${employee.name}</strong>'s goal <strong>"${goal.title}"</strong> has an At-Risk score of <strong>${score.toFixed(1)}%</strong>.</p><p>Please schedule a check-in meeting to provide guidance and support.</p>` });
    }
    await sendEmail({ to: employee.email, subject: '⚠️ Action Required: Your Goal is At Risk', html: `<p>Hi ${employee.name},</p><p>Your goal <strong>"${goal.title}"</strong> has a score of <strong>${score.toFixed(1)}%</strong> which is below the 50% threshold.</p><p>Please update your progress and discuss with your manager.</p>` });
  } catch (err) {
    console.error('Nudge failed:', err);
  }
}
