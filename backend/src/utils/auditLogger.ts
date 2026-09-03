import db from "../config/db";

export interface SystemAuditLogInput {
  actorId: number | null;
  actorRole: string;
  action: string;
  targetType: string;
  targetId: string;
  beforeState?: any;
  afterState?: any;
  ipAddress?: string;
  userAgent?: string;
  relatedTicketId?: number;
}

export async function logSystemEvent(data: SystemAuditLogInput) {
  try {
    await db.systemAuditLog.create({
      data: {
        actorId: data.actorId,
        actorRole: data.actorRole,
        action: data.action,
        targetType: data.targetType,
        targetId: data.targetId,
        beforeState: data.beforeState ?? undefined,
        afterState: data.afterState ?? undefined,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        relatedTicketId: data.relatedTicketId,
      },
    });
  } catch (error) {
    console.error("Failed to write system audit log:", error);
  }
}
