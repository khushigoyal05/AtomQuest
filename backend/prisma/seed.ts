import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data
  await prisma.comment.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.sharedGoal.deleteMany();
  await prisma.escalation.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.checkIn.deleteMany();
  await prisma.achievement.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.cycle.deleteMany();
  await prisma.escalationRule.deleteMany();
  await prisma.user.deleteMany();

  const salt = await bcrypt.genSalt(10);

  const admin = await prisma.user.create({
    data: { name: 'Priya Sharma', email: 'admin@atomquest.com', password: await bcrypt.hash('admin123', salt), role: 'ADMIN', department: 'HR' },
  });

  const manager1 = await prisma.user.create({
    data: { name: 'Rahul Verma', email: 'manager1@atomquest.com', password: await bcrypt.hash('manager123', salt), role: 'MANAGER', department: 'Engineering' },
  });

  const manager2 = await prisma.user.create({
    data: { name: 'Anita Desai', email: 'manager2@atomquest.com', password: await bcrypt.hash('manager123', salt), role: 'MANAGER', department: 'Product' },
  });

  const emp1 = await prisma.user.create({
    data: { name: 'Arjun Patel', email: 'employee1@atomquest.com', password: await bcrypt.hash('emp123', salt), role: 'EMPLOYEE', department: 'Engineering', managerId: manager1.id },
  });
  const emp2 = await prisma.user.create({
    data: { name: 'Kavya Nair', email: 'employee2@atomquest.com', password: await bcrypt.hash('emp123', salt), role: 'EMPLOYEE', department: 'Engineering', managerId: manager1.id },
  });
  const emp3 = await prisma.user.create({
    data: { name: 'Rohan Mehta', email: 'employee3@atomquest.com', password: await bcrypt.hash('emp123', salt), role: 'EMPLOYEE', department: 'Engineering', managerId: manager1.id },
  });
  const emp4 = await prisma.user.create({
    data: { name: 'Sneha Iyer', email: 'employee4@atomquest.com', password: await bcrypt.hash('emp123', salt), role: 'EMPLOYEE', department: 'Product', managerId: manager2.id },
  });
  const emp5 = await prisma.user.create({
    data: { name: 'Vikram Singh', email: 'employee5@atomquest.com', password: await bcrypt.hash('emp123', salt), role: 'EMPLOYEE', department: 'Product', managerId: manager2.id },
  });
  const emp6 = await prisma.user.create({
    data: { name: 'Pooja Reddy', email: 'employee6@atomquest.com', password: await bcrypt.hash('emp123', salt), role: 'EMPLOYEE', department: 'Product', managerId: manager2.id },
  });

  console.log('✅ Users created');

  await prisma.cycle.createMany({
    data: [
      { phaseName: 'GOAL_SETTING', label: 'Goal Setting 2026', opensAt: new Date('2026-05-01'), closesAt: new Date('2026-06-30'), isActive: false, year: 2026 },
      { phaseName: 'Q1_CHECKIN', label: 'Q1 Check-in 2026', opensAt: new Date('2026-07-01'), closesAt: new Date('2026-07-31'), isActive: true, year: 2026 },
      { phaseName: 'Q2_CHECKIN', label: 'Q2 Check-in 2026', opensAt: new Date('2026-10-01'), closesAt: new Date('2026-10-31'), isActive: false, year: 2026 },
      { phaseName: 'Q3_CHECKIN', label: 'Q3 Check-in 2026', opensAt: new Date('2027-01-01'), closesAt: new Date('2027-01-31'), isActive: false, year: 2026 },
      { phaseName: 'Q4_ANNUAL', label: 'Annual Review 2026', opensAt: new Date('2027-03-01'), closesAt: new Date('2027-04-30'), isActive: false, year: 2026 },
    ],
  });

  await prisma.escalationRule.createMany({
    data: [
      { ruleType: 'SUBMISSION_OVERDUE', daysThreshold: 7, isActive: true },
      { ruleType: 'APPROVAL_OVERDUE', daysThreshold: 5, isActive: true },
    ],
  });

  console.log('✅ Cycles & rules created');

  // Employee 1 goals — APPROVED & LOCKED
  const g1 = await prisma.goal.create({ data: { employeeId: emp1.id, thrustArea: 'Digital Transformation', title: 'Reduce API Response Time', description: 'Optimize backend APIs to reduce average response time by 40%', uom: 'NUMERIC_LOWER', target: 200, weightage: 30, status: 'APPROVED', isLocked: true, year: 2026 } });
  const g2 = await prisma.goal.create({ data: { employeeId: emp1.id, thrustArea: 'Quality & Excellence', title: 'Achieve 95% Code Coverage', description: 'Increase test coverage across all microservices to 95%', uom: 'NUMERIC_HIGHER', target: 95, weightage: 25, status: 'APPROVED', isLocked: true, year: 2026 } });
  const g3 = await prisma.goal.create({ data: { employeeId: emp1.id, thrustArea: 'Innovation', title: 'Zero Critical Production Bugs', description: 'Maintain zero critical production bugs for the entire year', uom: 'ZERO_BASED', target: 0, weightage: 20, status: 'APPROVED', isLocked: true, year: 2026 } });
  const g4 = await prisma.goal.create({ data: { employeeId: emp1.id, thrustArea: 'Learning & Development', title: 'Complete Cloud Architecture Certification', description: 'Obtain AWS Solutions Architect certification by Q3', uom: 'TIMELINE', target: 100, weightage: 15, status: 'APPROVED', isLocked: true, deadline: new Date('2026-09-30'), year: 2026 } });
  const g5 = await prisma.goal.create({ data: { employeeId: emp1.id, thrustArea: 'Customer Success', title: 'Improve NPS Score', description: 'Increase NPS from 72 to 85', uom: 'NUMERIC_HIGHER', target: 85, weightage: 10, status: 'APPROVED', isLocked: true, year: 2026 } });

  // Employee 2 goals — SUBMITTED
  await prisma.goal.create({ data: { employeeId: emp2.id, thrustArea: 'Digital Transformation', title: 'Migrate to Microservices', description: 'Break monolith into 5 microservices', uom: 'NUMERIC_HIGHER', target: 5, weightage: 35, status: 'SUBMITTED', year: 2026 } });
  await prisma.goal.create({ data: { employeeId: emp2.id, thrustArea: 'Collaboration', title: 'Conduct 4 Knowledge Sharing Sessions', description: 'Host quarterly tech talks', uom: 'NUMERIC_HIGHER', target: 4, weightage: 25, status: 'SUBMITTED', year: 2026 } });
  await prisma.goal.create({ data: { employeeId: emp2.id, thrustArea: 'Quality & Excellence', title: 'Reduce Bug Escape Rate by 60%', description: 'Reduce bugs escaping to production', uom: 'NUMERIC_LOWER', target: 40, weightage: 25, status: 'SUBMITTED', year: 2026 } });
  await prisma.goal.create({ data: { employeeId: emp2.id, thrustArea: 'Learning & Development', title: 'Mentor 2 Junior Developers', description: 'Weekly 1:1 mentoring sessions', uom: 'NUMERIC_HIGHER', target: 2, weightage: 15, status: 'SUBMITTED', year: 2026 } });

  // Employee 3 goals — RETURNED
  await prisma.goal.create({ data: { employeeId: emp3.id, thrustArea: 'Innovation', title: 'Build AI-Powered Feature', description: 'Prototype an AI recommendation engine', uom: 'TIMELINE', target: 100, weightage: 50, status: 'RETURNED', deadline: new Date('2026-12-31'), year: 2026 } });
  await prisma.goal.create({ data: { employeeId: emp3.id, thrustArea: 'Digital Transformation', title: 'Implement CI/CD Pipeline', description: 'Set up fully automated CI/CD', uom: 'TIMELINE', target: 100, weightage: 50, status: 'RETURNED', deadline: new Date('2026-08-31'), year: 2026 } });

  // Employee 4 goals — APPROVED
  const g4_1 = await prisma.goal.create({ data: { employeeId: emp4.id, thrustArea: 'Product Excellence', title: 'Launch 3 Major Features', description: 'Define, develop, and launch 3 high-impact features', uom: 'NUMERIC_HIGHER', target: 3, weightage: 40, status: 'APPROVED', isLocked: true, year: 2026 } });
  const g4_2 = await prisma.goal.create({ data: { employeeId: emp4.id, thrustArea: 'Customer Success', title: 'Reduce Feature Time-to-Market', description: 'Cut average delivery from 6 to 4 weeks', uom: 'NUMERIC_LOWER', target: 4, weightage: 30, status: 'APPROVED', isLocked: true, year: 2026 } });
  const g4_3 = await prisma.goal.create({ data: { employeeId: emp4.id, thrustArea: 'Collaboration', title: 'Achieve 90% Sprint Velocity', description: 'Maintain 90%+ velocity all quarters', uom: 'NUMERIC_HIGHER', target: 90, weightage: 30, status: 'APPROVED', isLocked: true, year: 2026 } });

  // Employee 5 goals — DRAFT
  await prisma.goal.create({ data: { employeeId: emp5.id, thrustArea: 'Customer Success', title: 'Improve User Retention', description: 'Increase 90-day retention from 65% to 80%', uom: 'NUMERIC_HIGHER', target: 80, weightage: 40, status: 'DRAFT', year: 2026 } });
  await prisma.goal.create({ data: { employeeId: emp5.id, thrustArea: 'Analytics & Insights', title: 'Build Analytics Dashboard', description: 'Implement real-time product analytics', uom: 'TIMELINE', target: 100, weightage: 35, status: 'DRAFT', deadline: new Date('2026-09-30'), year: 2026 } });
  await prisma.goal.create({ data: { employeeId: emp5.id, thrustArea: 'Process Improvement', title: 'Document Product Processes', description: 'Create product documentation wiki', uom: 'NUMERIC_HIGHER', target: 100, weightage: 25, status: 'DRAFT', year: 2026 } });

  // Employee 6 goals — APPROVED with low scores
  const g6_1 = await prisma.goal.create({ data: { employeeId: emp6.id, thrustArea: 'Digital Transformation', title: 'Increase Mobile App Adoption', description: 'Grow mobile DAU from 10K to 50K', uom: 'NUMERIC_HIGHER', target: 50000, weightage: 40, status: 'APPROVED', isLocked: true, year: 2026 } });
  const g6_2 = await prisma.goal.create({ data: { employeeId: emp6.id, thrustArea: 'Revenue', title: 'Achieve 120% Revenue Target', description: 'Drive product-led growth to exceed revenue target', uom: 'NUMERIC_HIGHER', target: 120, weightage: 35, status: 'APPROVED', isLocked: true, year: 2026 } });
  const g6_3 = await prisma.goal.create({ data: { employeeId: emp6.id, thrustArea: 'Quality & Excellence', title: 'App Store Rating > 4.5', description: 'Improve app rating through UX improvements', uom: 'NUMERIC_HIGHER', target: 4.5, weightage: 25, status: 'APPROVED', isLocked: true, year: 2026 } });

  console.log('✅ Goals created');

  // Achievements
  await prisma.achievement.createMany({
    data: [
      { goalId: g1.id, quarter: 'Q1', actualValue: 180, status: 'ON_TRACK', computedScore: 111.11 },
      { goalId: g2.id, quarter: 'Q1', actualValue: 78, status: 'ON_TRACK', computedScore: 82.1 },
      { goalId: g3.id, quarter: 'Q1', actualValue: 0, status: 'ON_TRACK', computedScore: 100 },
      { goalId: g4.id, quarter: 'Q1', actualValue: 40, status: 'ON_TRACK', computedScore: 40 },
      { goalId: g5.id, quarter: 'Q1', actualValue: 76, status: 'ON_TRACK', computedScore: 89.4 },
      { goalId: g4_1.id, quarter: 'Q1', actualValue: 1, status: 'ON_TRACK', computedScore: 33.3 },
      { goalId: g4_2.id, quarter: 'Q1', actualValue: 4.5, status: 'ON_TRACK', computedScore: 88.9 },
      { goalId: g4_3.id, quarter: 'Q1', actualValue: 88, status: 'ON_TRACK', computedScore: 97.8 },
      { goalId: g6_1.id, quarter: 'Q1', actualValue: 12000, status: 'ON_TRACK', computedScore: 24 },
      { goalId: g6_2.id, quarter: 'Q1', actualValue: 52, status: 'ON_TRACK', computedScore: 43.3 },
      { goalId: g6_3.id, quarter: 'Q1', actualValue: 3.8, status: 'ON_TRACK', computedScore: 84.4 },
    ],
  });

  console.log('✅ Achievements created');

  await prisma.checkIn.createMany({
    data: [
      { goalId: g1.id, managerId: manager1.id, quarter: 'Q1', comment: 'Great progress on API optimization! Response time is already below target. Keep monitoring under peak load.' },
      { goalId: g2.id, managerId: manager1.id, quarter: 'Q1', comment: 'Coverage improving but below target. Prioritize unit tests for the payment module this quarter.' },
      { goalId: g4_1.id, managerId: manager2.id, quarter: 'Q1', comment: 'Good start with Feature 1. Remaining 2 features need specs by end of July.' },
      { goalId: g6_1.id, managerId: manager2.id, quarter: 'Q1', comment: '⚠️ Mobile adoption significantly below target. Review growth strategy. Consider a targeted Q2 campaign.' },
    ],
  });

  await prisma.comment.createMany({
    data: [
      { goalId: g1.id, userId: emp1.id, text: 'Implemented Redis caching which brought response times down significantly. Also profiled slow queries.' },
      { goalId: g1.id, userId: manager1.id, text: 'Excellent work! Can you document the optimization steps in Confluence?' },
      { goalId: g1.id, userId: emp1.id, text: 'Sure! Documentation will be ready by end of this week.' },
      { goalId: g6_1.id, userId: emp6.id, text: 'Numbers lower than expected due to app store algorithm change. Planning a referral program.' },
      { goalId: g6_1.id, userId: manager2.id, text: 'Good thinking. Also look at push notification optimization. Will set up a call with growth team.' },
    ],
  });

  await prisma.auditLog.createMany({
    data: [
      { entityType: 'goal', entityId: g1.id, changedById: manager1.id, changeDescription: 'Goal approved by manager', oldValue: 'SUBMITTED', newValue: 'APPROVED' },
      { entityType: 'goal', entityId: g2.id, changedById: manager1.id, changeDescription: 'Goal approved by manager', oldValue: 'SUBMITTED', newValue: 'APPROVED' },
      { entityType: 'goal', entityId: g4_1.id, changedById: admin.id, changeDescription: 'Goal unlocked by admin (reason: Target recalibration requested by VP)', oldValue: 'LOCKED', newValue: 'UNLOCKED' },
    ],
  });

  await prisma.escalation.createMany({
    data: [
      { ruleType: 'SUBMISSION_OVERDUE', triggeredForId: emp5.id, status: 'PENDING', message: 'Vikram Singh has not submitted goals after 7 days of goal-setting window opening.', triggeredAt: new Date('2026-05-08') },
      { ruleType: 'APPROVAL_OVERDUE', triggeredForId: manager1.id, status: 'RESOLVED', message: "Rahul Verma has not approved Kavya Nair's goals after 5 days of submission.", triggeredAt: new Date('2026-05-10'), resolvedAt: new Date('2026-05-12') },
      { ruleType: 'SUBMISSION_OVERDUE', triggeredForId: emp3.id, status: 'PENDING', message: 'Rohan Mehta has goals returned for rework but has not resubmitted after 7 days.', triggeredAt: new Date('2026-05-14') },
    ],
  });

  await prisma.notification.createMany({
    data: [
      { userId: emp1.id, message: 'Your goals have been approved by Rahul Verma. They are now locked.', type: 'GOAL_APPROVED', isRead: true },
      { userId: manager1.id, message: 'Kavya Nair has submitted goals for your approval.', type: 'GOAL_SUBMITTED', isRead: false },
      { userId: emp3.id, message: 'Your goals have been returned for rework. Please fix weightage distribution.', type: 'GOAL_RETURNED', isRead: false },
      { userId: emp6.id, message: '⚠️ Goal "Increase Mobile App Adoption" is At Risk (24% score). Immediate attention required.', type: 'NUDGE', isRead: false },
      { userId: manager2.id, message: '⚠️ Pooja Reddy has an At-Risk goal. Please schedule a check-in.', type: 'NUDGE', isRead: false },
      { userId: admin.id, message: 'Escalation: Vikram Singh has not submitted goals. 7-day threshold exceeded.', type: 'ESCALATION', isRead: false },
      { userId: emp5.id, message: 'Reminder: Please submit your goals for approval. The window is still open.', type: 'CHECKIN_REMINDER', isRead: false },
    ],
  });

  console.log('\n🎉 Database seeded successfully!');
  console.log('📋 Login Credentials:');
  console.log('  admin@atomquest.com / admin123');
  console.log('  manager1@atomquest.com / manager123');
  console.log('  employee1@atomquest.com / emp123');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
