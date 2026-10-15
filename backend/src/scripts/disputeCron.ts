import db from "../config/db";
import { logSystemEvent } from "../utils/auditLogger";

/**
 * Auto-approve projects whose 6-day dispute window has closed with no client action.
 */
export async function autoApproveProjects() {
  const now = new Date();
  
  // Find projects that have been delivered, are SUBMITTED_FOR_REVIEW,
  // and the dispute window has closed
  const projects = await db.project.findMany({
    where: {
      status: "SUBMITTED_FOR_REVIEW",
      disputeWindowClosesAt: { lt: now },
      deliveredAt: { not: null }
    }
  });

  for (const project of projects) {
    try {
      await db.$transaction(async (tx) => {
        // Just update project status
        await tx.project.update({
          where: { id: project.id },
          data: { status: "COMPLETED" }
        });

        // Log it
        await logSystemEvent({
          actorId: null,
          actorRole: "SYSTEM",
          action: "projects.auto_approve",
          targetType: "Project",
          targetId: project.id.toString(),
          afterState: { status: "COMPLETED", resolvedBy: "SYSTEM" }
        });
        
        console.log(`Auto-approved project ${project.id}`);
      });
    } catch (e) {
      console.error(`Error auto-approving project ${project.id}:`, e);
    }
  }
}

/**
 * Auto-escalate disputes that remain in OPEN or AWAITING_ENGINEER_FIX for > 3 days.
 */
export async function autoEscalateDisputes() {
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  const disputes = await db.dispute.findMany({
    where: {
      status: { in: ["OPEN", "AWAITING_ENGINEER_FIX"] },
      updatedAt: { lt: threeDaysAgo }
    },
    include: {
      project: {
        include: {
          client: { select: { id: true, name: true, email: true } },
          payment: {
            include: {
              engineer: {
                include: {
                  user: { select: { id: true, name: true, email: true } }
                }
              }
            }
          }
        }
      }
    }
  });

  for (const dispute of disputes) {
    try {
      await db.$transaction(async (tx) => {
        await tx.dispute.update({
          where: { id: dispute.id },
          data: { status: "ESCALATED_TO_ADMIN" }
        });

        await logSystemEvent({
          actorId: null,
          actorRole: "SYSTEM",
          action: "disputes.auto_escalate",
          targetType: "Dispute",
          targetId: dispute.id.toString(),
          afterState: { status: "ESCALATED_TO_ADMIN", resolvedBy: "SYSTEM" }
        });
        
        console.log(`Auto-escalated dispute ${dispute.id}`);
      });

      // Notify Admins
      try {
        const { notifyAdminsDisputeEscalated } = await import("../utils/adminNotifications");
        const engineerUser = dispute.project?.payment?.engineer?.user;
        const amountStr = dispute.project?.payment?.amountUsd
          ? `$${Number(dispute.project.payment.amountUsd).toFixed(2)}`
          : undefined;

        await notifyAdminsDisputeEscalated({
          disputeId: dispute.id,
          projectId: dispute.projectId,
          projectTitle: dispute.project?.title ?? `Project #${dispute.projectId}`,
          clientName: dispute.project?.client?.name,
          clientEmail: dispute.project?.client?.email,
          engineerName: engineerUser?.name,
          engineerEmail: engineerUser?.email,
          reason: dispute.reason,
          amount: amountStr,
          escalatedAt: new Date(),
        });
      } catch (err) {
        console.error("Failed to notify admins of auto-escalated dispute:", err);
      }
    } catch (e) {
      console.error(`Error auto-escalating dispute ${dispute.id}:`, e);
    }
  }
}

async function runCron() {
  console.log("Starting dispute cron jobs...");
  await autoApproveProjects();
  await autoEscalateDisputes();
  console.log("Dispute cron jobs finished.");
  process.exit(0);
}

if (require.main === module) {
  runCron();
}
