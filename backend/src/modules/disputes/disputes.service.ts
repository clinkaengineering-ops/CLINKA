import db from "../../config/db";
import ApiError from "../../utils/ApiError";
import { logSystemEvent } from "../../utils/auditLogger";
import { ensureWallet } from "../../utils/wallet";
import { netEngineerAmount, recordPaymentLedger } from "../../utils/paymentLedger";

export async function openDispute(clientId: number, projectId: number, reason: string) {
  const project = await db.project.findUnique({
    where: { id: projectId },
    include: {
      payment: true,
      disputes: { where: { status: { in: ["OPEN", "AWAITING_ENGINEER_FIX", "ESCALATED_TO_ADMIN"] } } },
    }
  });

  if (!project) throw new ApiError(404, "Project not found");
  if (project.clientId !== clientId) throw new ApiError(403, "Only the client can open a dispute");
  if (!project.deliveredAt || !project.disputeWindowClosesAt) {
    throw new ApiError(400, "Work has not been delivered yet");
  }

  const now = new Date();
  if (now > project.disputeWindowClosesAt) {
    throw new ApiError(400, "The dispute window has closed");
  }

  if (project.disputes.length > 0) {
    throw new ApiError(400, "An active dispute already exists for this project");
  }

  return db.$transaction(async (tx) => {
    // 1. Create the dispute
    const dispute = await tx.dispute.create({
      data: {
        projectId,
        openedById: clientId,
        reason,
        status: "AWAITING_ENGINEER_FIX",
      }
    });

    // 2. Pause the dispute window on the project and allow engineer to fix
    await tx.project.update({
      where: { id: projectId },
      data: { disputePausedAt: now, status: "REVISION_REQUESTED" }
    });

    // 3. Move funds to heldByDispute
    const payment = project.payment;
    if (payment) {
      const netAmount = netEngineerAmount(payment.amountUsd, payment.commission);
      const profile = await tx.engineerProfile.findUnique({ where: { id: payment.engineerId } });
      const wallet = await ensureWallet(tx, profile!.userId);
      
      if (payment.status === "FUNDED") {
        // Move from escrow straight to heldByDispute
        await tx.payment.update({
          where: { id: payment.id },
          data: { status: "RELEASED" }
        });
        
        await recordPaymentLedger(tx, payment.id, [
          { type: "RELEASED", amount: netAmount, note: "Dispute opened — funds held" },
          { type: "PLATFORM_COMMISSION", amount: payment.commission, note: "Platform commission retained" },
        ]);

        await tx.wallet.update({
          where: { id: wallet.id },
          data: { heldByDispute: { increment: netAmount } }
        });
        
        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            amount: netAmount,
            type: "RELEASED",
            status: "PENDING",
            description: `Payment for "${project.title}" (HELD BY DISPUTE)`,
            availableAt: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000), // Far future, will be resolved
            relatedPaymentId: payment.id,
          }
        });
      } else {
        // Funds are already released, so they are either in PENDING or AVAILABLE
        const wt = await tx.walletTransaction.findFirst({
          where: { relatedPaymentId: payment.id }
        });
        
        if (wt) {
          if (wt.status === "PENDING") {
            await tx.wallet.update({
              where: { id: wallet.id },
              data: { pendingBalance: { decrement: netAmount }, heldByDispute: { increment: netAmount } }
            });
          } else if (wt.status === "AVAILABLE") {
            await tx.wallet.update({
              where: { id: wallet.id },
              data: { availableBalance: { decrement: netAmount }, heldByDispute: { increment: netAmount } }
            });
          }
        }
      }
    }

    // 4. Audit Log
    await logSystemEvent({
      actorId: clientId,
      actorRole: "CLIENT",
      action: "disputes.open",
      targetType: "Project",
      targetId: projectId.toString(),
      afterState: { disputeId: dispute.id, reason }
    } as any);

    // 5. Notify Engineer
    const paymentRecord = project.payment;
    if (paymentRecord) {
      const profile = await tx.engineerProfile.findUnique({ where: { id: paymentRecord.engineerId } });
      await tx.notification.create({
        data: {
          userId: profile!.userId,
          type: "DISPUTE_OPENED",
          title: "Dispute Opened",
          body: `The client has opened a dispute for "${project.title}". The review window is paused.`,
          link: `/engineer/projects/${project.id}`
        }
      });
    }

    return dispute;
  });
}

export async function resolveDispute(adminId: number, projectId: number, resolution: "ENGINEER" | "CLIENT", reason: string) {
  const project = await db.project.findUnique({
    where: { id: projectId },
    include: {
      payment: true,
      disputes: { where: { status: { in: ["OPEN", "AWAITING_ENGINEER_FIX", "ESCALATED_TO_ADMIN"] } } },
    }
  });

  if (!project) throw new ApiError(404, "Project not found");
  const activeDispute = project.disputes[0];
  if (!activeDispute) throw new ApiError(400, "No active dispute for this project");

  return db.$transaction(async (tx) => {
    const payment = project.payment;
    if (!payment) throw new ApiError(500, "No payment record found");
    
    const netAmount = netEngineerAmount(payment.amountUsd, payment.commission);
    const profile = await tx.engineerProfile.findUnique({ where: { id: payment.engineerId } });
    const wallet = await ensureWallet(tx, profile!.userId);

    if (resolution === "ENGINEER") {
      // Release funds back to engineer (to pending or available depending on time)
      const wt = await tx.walletTransaction.findFirst({ where: { relatedPaymentId: payment.id } });
      const availableAt = project.deliveredAt ? new Date(project.deliveredAt.getTime() + 7 * 24 * 60 * 60 * 1000) : new Date();
      const isAvailable = new Date() >= availableAt;
      
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { 
          heldByDispute: { decrement: netAmount },
          ...(isAvailable ? { availableBalance: { increment: netAmount } } : { pendingBalance: { increment: netAmount } })
        }
      });
      
      if (wt) {
        await tx.walletTransaction.update({
          where: { id: wt.id },
          data: { status: isAvailable ? "AVAILABLE" : "PENDING", availableAt }
        });
      }

      await tx.dispute.update({
        where: { id: activeDispute.id },
        data: { status: "RESOLVED_ENGINEER", resolvedAt: new Date(), resolvedById: adminId, resolutionNote: reason }
      });

      await tx.project.update({
        where: { id: projectId },
        data: { status: "COMPLETED" }
      });
      
    } else {
      // Client favor: Administrator will refund via manual payout flow.
      // Move from heldByDispute to 0. 
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { heldByDispute: { decrement: netAmount } }
      });
      
      const wt = await tx.walletTransaction.findFirst({ where: { relatedPaymentId: payment.id } });
      if (wt) {
        await tx.walletTransaction.update({
          where: { id: wt.id },
          data: { status: "REJECTED" }
        });
      }

      await tx.dispute.update({
        where: { id: activeDispute.id },
        data: { status: "RESOLVED_CLIENT", resolvedAt: new Date(), resolvedById: adminId, resolutionNote: reason }
      });
    }

    await logSystemEvent({
      actorId: adminId,
      actorRole: "ADMIN",
      action: "disputes.resolve",
      targetType: "Project",
      targetId: projectId.toString(),
      afterState: { resolution, reason, disputeId: activeDispute.id }
    } as any);

    // Notify Client and Engineer
    await tx.notification.createMany({
      data: [
        {
          userId: profile!.userId,
          type: "DISPUTE_RESOLVED",
          title: "Dispute Resolved",
          body: `The dispute for "${project.title}" has been resolved in favor of the ${resolution === "ENGINEER" ? "Engineer" : "Client"}.`,
          link: `/engineer/projects/${project.id}`
        },
        {
          userId: project.clientId,
          type: "DISPUTE_RESOLVED",
          title: "Dispute Resolved",
          body: `The dispute for "${project.title}" has been resolved in favor of the ${resolution === "ENGINEER" ? "Engineer" : "Client"}.`,
          link: `/client/projects/${project.id}`
        }
      ]
    });

    return activeDispute;
  });
}

export async function escalateDispute(actorId: number, actorRole: string, projectId: number) {
  const project = await db.project.findUnique({
    where: { id: projectId },
    include: { 
      payment: true,
      disputes: { where: { status: { in: ["OPEN", "AWAITING_ENGINEER_FIX"] } } } 
    },
  });

  if (!project) throw new ApiError(404, "Project not found");
  const activeDispute = project.disputes[0];
  if (!activeDispute) throw new ApiError(400, "No active dispute eligible for escalation");

  return db.$transaction(async (tx) => {
    const updatedDispute = await tx.dispute.update({
      where: { id: activeDispute.id },
      data: { status: "ESCALATED_TO_ADMIN" }
    });

    await logSystemEvent({
      actorId: actorId ?? null,
      actorRole: actorId ? "CLIENT" : "SYSTEM",
      action: "disputes.escalate",
      targetType: "Project",
      targetId: projectId.toString(),
      afterState: { disputeId: activeDispute.id }
    } as any);

    // Notify Client and Engineer
    const payment = project.payment;
    if (payment) {
      const profile = await tx.engineerProfile.findUnique({ where: { id: payment.engineerId } });
      await tx.notification.createMany({
        data: [
          {
            userId: profile!.userId,
            type: "DISPUTE_ESCALATED",
            title: "Dispute Escalated",
            body: `The dispute for "${project.title}" has been escalated to Admin.`,
            link: `/engineer/projects/${project.id}`
          },
          {
            userId: project.clientId,
            type: "DISPUTE_ESCALATED",
            title: "Dispute Escalated",
            body: `The dispute for "${project.title}" has been escalated to Admin.`,
            link: `/client/projects/${project.id}`
          }
        ]
      });
    }

    return updatedDispute;
  });
}

export async function manualFreeze(adminId: number, engineerId: number, amount: number, reason: string) {
  const engineerProfile = await db.engineerProfile.findUnique({ where: { id: engineerId } });
  if (!engineerProfile) throw new ApiError(404, "Engineer not found");
  
  const engineerUserId = engineerProfile.userId;
  const wallet = await db.wallet.findUnique({ where: { userId: engineerUserId } });
  if (!wallet) throw new ApiError(404, "Engineer wallet not found");

  if (wallet.availableBalance.toNumber() + wallet.pendingBalance.toNumber() < amount) {
    throw new ApiError(400, "Insufficient combined available and pending balance to freeze");
  }

  return db.$transaction(async (tx) => {
    let remainingToFreeze = amount;
    
    // Freeze from available first, then pending
    const availableToFreeze = Math.min(wallet.availableBalance.toNumber(), remainingToFreeze);
    remainingToFreeze -= availableToFreeze;
    const pendingToFreeze = Math.min(wallet.pendingBalance.toNumber(), remainingToFreeze);
    
    await tx.wallet.update({
      where: { id: wallet.id },
      data: {
        availableBalance: { decrement: availableToFreeze },
        pendingBalance: { decrement: pendingToFreeze },
        heldByDispute: { increment: amount }
      }
    });

    await logSystemEvent({
      actorId: adminId,
      actorRole: "ADMIN",
      action: "wallet.manual_freeze",
      targetType: "Wallet",
      targetId: wallet.id.toString(),
      afterState: { amount, reason }
    } as any);

    // Notify Engineer
    await tx.notification.create({
      data: {
        userId: engineerUserId,
        type: "MANUAL_FREEZE",
        title: "Funds Frozen",
        body: `An amount of $${amount} has been frozen in your wallet by Admin. Reason: ${reason}`,
        link: `/engineer/escrow`
      }
    });

    return { frozenAmount: amount, reason };
  });
}
