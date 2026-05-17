import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuditEntry {
  entityType: string;
  entityId: string;
  changedById: string;
  changeDescription: string;
  oldValue?: string;
  newValue?: string;
}

export async function createAuditLog(entry: AuditEntry) {
  try {
    await prisma.auditLog.create({ data: entry });
  } catch (err) {
    console.error('Audit log failed:', err);
  }
}
