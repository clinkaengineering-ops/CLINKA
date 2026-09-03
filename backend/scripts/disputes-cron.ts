import db from "../src/config/db";
import { approveProjectWork } from "../src/modules/projects/project.workflow.service";
import { escalateDispute } from "../src/modules/disputes/disputes.service";
import { logSystemEvent } from "../src/utils/auditLogger";

async function main() {
  console.log("Starting disputes cron job...");
  const now = new Date();

  // 1. Auto-approve projects where dispute window has closed and no active dispute
  const projectsToApprove = await db.project.findMany({
    where: {
      status: "SUBMITTED_FOR_REVIEW",
      disputeWindowClosesAt: { lt: now },
      disputes: { none: { status: { in: ["OPEN", "AWAITING_ENGINEER_FIX", "ESCALATED_TO_ADMIN"] } } },
    }
  });

  for (const p of projectsToApprove) {
    try {
      console.log(`Auto-approving project ${p.id}...`);
      await approveProjectWork(p.clientId, p.id);
      
      await logSystemEvent({
        actorId: undefined as any, // Schema uses Int?, we can pass undefined to map to null
        actorRole: "SYSTEM",
        action: "projects.autoApprove",
        targetType: "Project",
        targetId: p.id.toString(),
        afterState: { resolutionNote: "Auto-approved due to dispute window closing without client action." }
      });
      console.log(`Successfully auto-approved project ${p.id}.`);
    } catch (err) {
      console.error(`Failed to auto-approve project ${p.id}:`, err);
    }
  }

  // 2. Auto-escalate disputes that have been in OPEN or AWAITING_ENGINEER_FIX for > 3 days
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  
  const disputesToEscalate = await db.dispute.findMany({
    where: {
      status: { in: ["OPEN", "AWAITING_ENGINEER_FIX"] },
      updatedAt: { lt: threeDaysAgo }, 
    }
  });

  for (const d of disputesToEscalate) {
    try {
      console.log(`Auto-escalating dispute ${d.id} for project ${d.projectId}...`);
      await escalateDispute(null as any, "SYSTEM", d.projectId);
      console.log(`Successfully auto-escalated dispute ${d.id}.`);
    } catch (err) {
      console.error(`Failed to auto-escalate dispute ${d.id}:`, err);
    }
  }

  console.log("Disputes cron job completed.");
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
