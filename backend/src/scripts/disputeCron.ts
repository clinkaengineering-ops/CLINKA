import db from "../config/db";
import { logSystemEvent } from "../utils/auditLogger";
import { netEngineerAmount, recordPaymentLedger } from "../utils/paymentLedger";
import { ensureWallet, walletHoldReleaseDate } from "../utils/wallet";
import { createNotification } from "../utils/notifications";

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
    },
    include: {
      payment: true,
      disputes: {
        where: {
          status: { in: ["OPEN", "AWAITING_ENGINEER_FIX", "ESCALATED_TO_ADMIN"] }
        }
      }
    }
  });

  for (const project of projects) {
    try {
      const payment = project.payment;
      const activeDispute = project.disputes?.[0];
      const projectTitle = project.title;

      let engineerUserId: string | null = null;
      if (payment) {
        const engineerProfile = await db.engineerProfile.findUnique({
          where: { id: payment.engineerId },
          select: { userId: true }
        });
        if (engineerProfile) {
          engineerUserId = engineerProfile.userId;
        }
      }

      const holdReleaseDate = walletHoldReleaseDate(project.deliveredAt ?? now);
      const isMatured = now >= holdReleaseDate;

      await db.$transaction(async (tx) => {
        if (payment && typeof tx.$executeRaw === "function") {
          await tx.$executeRaw`SELECT id FROM "Payment" WHERE id = ${payment.id} FOR UPDATE`;
        }

        if (payment) {
          const isFunded = payment.status === "FUNDED";
          const isHeldByDispute = activeDispute && payment.status === "RELEASED";

          if (isFunded || isHeldByDispute) {
            const netAmount = netEngineerAmount(
              payment.amountUsd,
              payment.commission
            );

            if (activeDispute) {
              const disputeClaim = await tx.dispute.updateMany({
                where: {
                  id: activeDispute.id,
                  status: { in: ["OPEN", "AWAITING_ENGINEER_FIX", "ESCALATED_TO_ADMIN"] },
                },
                data: {
                  status: "RESOLVED_ENGINEER",
                  resolvedAt: now,
                  resolutionNote: "Auto-approved: dispute window closed with no client action.",
                },
              });

              if (disputeClaim.count === 0) {
                return;
              }

              if (engineerUserId) {
                const wallet = await ensureWallet(tx, engineerUserId);

                const walletUpdate = await tx.wallet.updateMany({
                  where: {
                    id: wallet.id,
                    heldByDispute: { gte: netAmount },
                  },
                  data: {
                    heldByDispute: { decrement: netAmount },
                    ...(isMatured
                      ? { availableBalance: { increment: netAmount } }
                      : { pendingBalance: { increment: netAmount } }),
                  },
                });

                if (walletUpdate.count === 0) return;

                const existingTx = await tx.walletTransaction.findFirst({
                  where: { relatedPaymentId: payment.id },
                });
                if (existingTx) {
                  await tx.walletTransaction.update({
                    where: { id: existingTx.id },
                    data: {
                      status: isMatured ? "AVAILABLE" : "PENDING",
                      availableAt: holdReleaseDate,
                      description: `Payment for "${projectTitle}". Available 7 days after delivery.`,
                    },
                  });
                } else {
                  await tx.walletTransaction.create({
                    data: {
                      walletId: wallet.id,
                      amount: netAmount,
                      type: "RELEASED",
                      status: isMatured ? "AVAILABLE" : "PENDING",
                      description: `Payment for "${projectTitle}". Available 7 days after delivery.`,
                      availableAt: holdReleaseDate,
                      relatedPaymentId: payment.id,
                    },
                  });
                }
              }
            } else {
              const paymentClaim = await tx.payment.updateMany({
                where: { id: payment.id, status: "FUNDED" },
                data: { status: "RELEASED" },
              });

              if (paymentClaim.count === 0) {
                return;
              }

              if (engineerUserId) {
                const wallet = await ensureWallet(tx, engineerUserId);

                const existingLedger = await tx.paymentLedgerEntry.findFirst({
                  where: { paymentId: payment.id, type: "RELEASED" },
                  select: { id: true },
                });

                if (!existingLedger) {
                  await recordPaymentLedger(tx, payment.id, [
                    {
                      type: "RELEASED",
                      amount: netAmount,
                      note: "Client approved work — engineer earnings released",
                    },
                    {
                      type: "PLATFORM_COMMISSION",
                      amount: payment.commission,
                      note: "Platform commission retained",
                    },
                  ]);
                }

                await tx.wallet.update({
                  where: { id: wallet.id },
                  data: isMatured
                    ? { availableBalance: { increment: netAmount } }
                    : { pendingBalance: { increment: netAmount } },
                });

                const existingTx = await tx.walletTransaction.findFirst({
                  where: { relatedPaymentId: payment.id, type: "RELEASED" },
                  select: { id: true },
                });

                if (!existingTx) {
                  await tx.walletTransaction.create({
                    data: {
                      walletId: wallet.id,
                      amount: netAmount,
                      type: "RELEASED",
                      status: isMatured ? "AVAILABLE" : "PENDING",
                      description: `Payment for "${projectTitle}". Available 7 days after delivery.`,
                      availableAt: holdReleaseDate,
                      relatedPaymentId: payment.id,
                    },
                  });
                }
              }
            }
          }
        }

        await tx.project.update({
          where: { id: project.id },
          data: { status: "COMPLETED" },
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

      // Send appropriate notifications to both the client and the engineer
      try {
        await createNotification(
          project.clientId,
          "PROJECT_COMPLETED",
          "Project completed",
          `Review window for "${projectTitle}" has closed. The project has been automatically approved and payment released.`,
          `/projects?id=${project.id}`
        );

        if (engineerUserId) {
          await createNotification(
            engineerUserId,
            "WORK_APPROVED",
            "Work approved",
            `The review window for "${projectTitle}" has closed and work was automatically approved. Earnings are now ${
              isMatured ? "available" : "pending"
            } in your wallet.`,
            `/balance`
          );

          await createNotification(
            engineerUserId,
            "FUNDS_RELEASED",
            isMatured ? "Funds released" : "Payment queued to wallet",
            isMatured
              ? `Payment for "${projectTitle}" has been released to your available balance.`
              : `Payment for "${projectTitle}" will become available after the 7-day holding period.`,
            `/balance`
          );
        }
      } catch (notifErr) {
        console.error(`Failed to send notifications for auto-approved project ${project.id}:`, notifErr);
      }
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

        const clientUserId = dispute.project?.client?.id;
        const engineerUserId = dispute.project?.payment?.engineer?.user?.id;
        const projectTitle = dispute.project?.title ?? `Project #${dispute.projectId}`;

        const notifData: Array<{ userId: string; type: string; title: string; body: string; link: string }> = [];
        if (clientUserId) {
          notifData.push({
            userId: clientUserId,
            type: "DISPUTE_ESCALATED",
            title: "Dispute Escalated",
            body: `The dispute for "${projectTitle}" has been escalated to Admin.`,
            link: `/projects/${dispute.projectId}`,
          });
        }
        if (engineerUserId) {
          notifData.push({
            userId: engineerUserId,
            type: "DISPUTE_ESCALATED",
            title: "Dispute Escalated",
            body: `The dispute for "${projectTitle}" has been escalated to Admin.`,
            link: `/projects/${dispute.projectId}`,
          });
        }
        if (notifData.length > 0) {
          await tx.notification.createMany({ data: notifData });
        }

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
