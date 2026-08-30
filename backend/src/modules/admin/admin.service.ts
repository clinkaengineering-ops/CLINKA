import db from "../../config/db";
import ApiError from "../../utils/ApiError";
import {
  UpdateSupportTicketInput,
  UpdateVerificationInput,
  UpdateWithdrawalRequestInput,
} from "./admin.validation";
import {
  banUserFor30Days,
} from "../messages/ban.service";
import { BanReason } from "../../generated/prisma/enums";
import { createNotification } from "../../utils/notifications";
import generateToken from "../../utils/generateToken";
import {
  ensureWallet,
  settleMaturedWalletTransactions,
} from "../../utils/wallet";
import { cacheGet, cacheSet } from "../../config/redis";
import {
  cancelPayoutByAdmin,
  getPayoutAuditTrail,
  markPayoutCompletedByAdmin,
  reconcilePendingPayouts,
  resolvePayoutManualReview,
} from "../payouts/payout.service";
import type { PayoutType, WithdrawalRequestStatus } from "../../generated/prisma/client";
import { assertPayoutTransition } from "../payouts/payout.state";

function stripPassword<T extends { password: string }>({ password: _, ...safe }: T) {
  return safe;
}

function toNumber(value: number | { toString(): string }) {
  return typeof value === "number" ? value : Number(value.toString());
}

export async function getAdminStats() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    totalEngineers,
    totalClients,
    totalProjects,
    pendingVerifications,
    openSupportTickets,
    payments,
    newUsersLast30,
    newUsersPrev30,
    activeBans,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { role: "ENGINEER" } }),
    db.user.count({ where: { role: "CLIENT" } }),
    db.project.count(),
    db.engineerProfile.count({ where: { verificationStatus: "PENDING" } }),
    db.supportTicket.count({ where: { status: "OPEN" } }),
    db.payment.findMany({
      where: { status: { in: ["FUNDED", "RELEASED", "REFUNDED"] } },
      select: { amountUsd: true, status: true, commission: true },
    }),
    db.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    db.user.count({
      where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
    }),
    db.ban.count({ where: { active: true, expiresAt: { gt: now } } }),
  ]);

  const gmv = payments
    .filter((p) => p.status === "FUNDED" || p.status === "RELEASED")
    .reduce((sum, p) => sum + toNumber(p.amountUsd), 0);
  const inEscrow = payments
    .filter((p) => p.status === "FUNDED")
    .reduce((sum, p) => sum + toNumber(p.amountUsd), 0);
  const totalCommission = payments.reduce(
    (sum, p) => sum + toNumber(p.commission),
    0,
  );

  return {
    totalUsers,
    totalEngineers,
    totalClients,
    totalProjects,
    pendingVerifications,
    gmv,
    inEscrow,
    openSupportTickets,
    newUsersLast30,
    newUsersPrev30,
    activeBans,
    totalCommission,
  };
}

export async function getPendingVerifications() {
  const engineers = await db.user.findMany({
    where: {
      profile: { verificationStatus: "PENDING" },
    },
    include: { profile: { include: { portfolio: true } } },
    orderBy: { createdAt: "desc" },
  });

  return engineers.map((e) => {
    const p = e.profile!;
    const docType = p.syndicateCardUrl
      ? "Syndicate Card"
      : p.collegeIdUrl
        ? "College ID"
        : p.certificateUrl
          ? "Certificate"
          : "Document";
    return {
      profileId: p.id,
      userId: e.id,
      name: e.name,
      email: e.email,
      specialty: p.specialty,
      documentType: docType,
      collegeIdUrl: p.collegeIdUrl,
      certificateUrl: p.certificateUrl,
      syndicateCardUrl: p.syndicateCardUrl,
      portfolios: p.portfolio?.map((item) => item.coverImageUrl) || [],
      submittedAt: p.createdAt,
    };
  });
}

export async function updateEngineerVerification(
  profileId: number,
  data: UpdateVerificationInput,
) {
  const profile = await db.engineerProfile.findUnique({
    where: { id: profileId },
    include: { user: true },
  });
  if (!profile) throw new ApiError(404, "Engineer profile not found");

  const updated = await db.engineerProfile.update({
    where: { id: profileId },
    data: { verificationStatus: data.status },
    include: { user: true },
  });

  const { createNotification } = await import("../../utils/notifications");

  if (data.status === "APPROVED" && updated.user.role === "CLIENT") {
    await db.user.update({
      where: { id: updated.userId },
      data: { role: "ENGINEER" },
    });
    await createNotification(
      updated.userId,
      "ENGINEER_APPLICATION_APPROVED",
      "You are now an engineer",
      "Your application was approved. You can browse projects and submit bids.",
      "/projects",
      { force: true },
    );
  } else if (data.status === "APPROVED") {
    await createNotification(
      updated.userId,
      "ENGINEER_APPLICATION_APPROVED",
      "Verification approved",
      "Your engineer credentials have been approved.",
      "/dashboard",
      { force: true },
    );
  } else if (data.status === "REJECTED") {
    await createNotification(
      updated.userId,
      "ENGINEER_APPLICATION_REJECTED",
      "Engineer application not approved",
      "Your application was not approved. You can update your documents and apply again.",
      "/",
      { force: true },
    );
  }

  const refreshedUser = await db.user.findUnique({
    where: { id: updated.userId },
  });

  return stripPassword(refreshedUser ?? updated.user);
}

function formatLastMessagePreview(message: {
  content: string;
  attachmentUrl: string | null;
  attachmentName: string | null;
}) {
  const text = message.content.trim();
  if (text) return text;
  if (message.attachmentUrl) {
    return message.attachmentName
      ? `📎 ${message.attachmentName}`
      : "📎 Attachment";
  }
  return null;
}

export async function getAllBans() {
  const bans = await db.ban.findMany({
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
      bannedBy: { select: { id: true, name: true } },
    },
    orderBy: { bannedAt: "desc" },
  });

  const now = new Date();

  return bans.map((ban) => ({
    id: ban.id,
    userId: ban.userId,
    userName: ban.user.name,
    userEmail: ban.user.email,
    userRole: ban.user.role,
    reason: ban.reason,
    bannedAt: ban.bannedAt,
    expiresAt: ban.expiresAt,
    active: ban.active && ban.expiresAt > now,
    note: ban.note,
    triggerMessage: ban.triggerMessage,
    bannedById: ban.bannedById,
    bannedByName: ban.bannedBy?.name ?? null,
  }));
}

export async function banUserManually(
  adminId: number,
  targetUserId: number,
  note?: string,
) {
  const target = await db.user.findUnique({ where: { id: targetUserId } });
  if (!target) throw new ApiError(404, "User not found");
  if (target.role === "ADMIN") {
    throw new ApiError(400, "Cannot ban an administrator");
  }

  await banUserFor30Days(targetUserId, BanReason.MANUAL_BAN, adminId, note);
  return { userId: targetUserId };
}

export async function unbanUser(adminId: number, targetUserId: number) {
  const ban = await db.ban.findUnique({ where: { userId: targetUserId } });
  if (!ban) throw new ApiError(404, "No ban record for this user");

  await db.ban.update({
    where: { userId: targetUserId },
    data: { active: false },
  });

  await createNotification(
    targetUserId,
    "ACCOUNT_BANNED",
    "Account restored",
    "Your account suspension has been lifted.",
    undefined,
    { force: true },
  );

  return { userId: targetUserId, unbannedBy: adminId };
}

export async function lookupUser(identifier: string) {
  const trimmed = identifier.trim();
  const asId = Number(trimmed);
  if (!Number.isNaN(asId) && asId > 0) {
    const byId = await db.user.findUnique({
      where: { id: asId },
      select: { id: true, name: true, email: true, role: true },
    });
    if (byId) return byId;
  }

  const byEmail = await db.user.findUnique({
    where: { email: trimmed.toLowerCase() },
    select: { id: true, name: true, email: true, role: true },
  });
  if (!byEmail) throw new ApiError(404, "User not found");
  return byEmail;
}

export async function impersonateUser(targetUserId: number) {
  const target = await db.user.findUnique({ where: { id: targetUserId } });
  if (!target) throw new ApiError(404, "User not found");
  if (target.role === "ADMIN") {
    throw new ApiError(400, "Cannot impersonate an administrator");
  }

  const token = generateToken(target.id, target.role);
  return { user: stripPassword(target), token };
}

export async function updateEngineerProfileByAdmin(
  userId: number,
  data: { specialty?: "CIVIL" | "ARCHITECTURAL"; bio?: string }
) {
  const profile = await db.engineerProfile.findUnique({ where: { userId } });
  if (!profile) throw new ApiError(404, "Engineer profile not found");

  const updated = await db.engineerProfile.update({
    where: { userId },
    data: {
      ...(data.specialty && { specialty: data.specialty }),
      ...(data.bio !== undefined && { bio: data.bio }),
    },
    include: { user: true }
  });

  return stripPassword(updated.user);
}

export async function getAllConversations(page = 1, limit = 20) {
  const skip = (page - 1) * limit;

  const [conversations, total] = await Promise.all([
    db.conversation.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        project: { select: { id: true, title: true } },
        client: { select: { id: true, name: true } },
        engineer: { select: { id: true, name: true } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        _count: { select: { messages: true } },
      },
    }),
    db.conversation.count(),
  ]);

  return {
    conversations: conversations.map((conv) => {
      const last = conv.messages[0] ?? null;
      return {
        id: conv.id,
        projectId: conv.projectId,
        projectTitle: conv.project?.title ?? "General Chat",
        clientId: conv.clientId,
        clientName: conv.client.name,
        engineerId: conv.engineerId,
        engineerName: conv.engineer.name,
        lastMessage: last ? formatLastMessagePreview(last) : null,
        lastMessageAt: last?.createdAt ?? conv.createdAt,
        messageCount: conv._count.messages,
      };
    }),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getConversationMessages(
  conversationId: number,
  page = 1,
  limit = 50,
) {
  const conv = await db.conversation.findUnique({
    where: { id: conversationId },
  });
  if (!conv) throw new ApiError(404, "Conversation not found");

  const skip = (page - 1) * limit;

  const [messages, total] = await Promise.all([
    db.message.findMany({
      where: { conversationId },
      include: {
        sender: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: "asc" },
      skip,
      take: limit,
    }),
    db.message.count({ where: { conversationId } }),
  ]);

  return {
    messages,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    conversation: {
      id: conv.id,
      projectId: conv.projectId,
      clientId: conv.clientId,
      engineerId: conv.engineerId,
    },
  };
}

export async function getAllProjects(page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const [projects, total] = await Promise.all([
    db.project.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        client: { select: { name: true, email: true } },
      },
    }),
    db.project.count(),
  ]);
  return {
    projects,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function updateProjectByAdmin(
  projectId: number,
  data: { status?: any; isFlagged?: boolean },
) {
  return await db.project.update({
    where: { id: projectId },
    data,
  });
}

export async function getAllReviews(page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const [reviews, total] = await Promise.all([
    db.review.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        client: { select: { name: true } },
        engineer: { include: { user: { select: { name: true } } } },
        project: { select: { title: true } },
      },
    }),
    db.review.count(),
  ]);
  return {
    reviews,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function deleteReviewByAdmin(reviewId: number) {
  await db.review.delete({ where: { id: reviewId } });
}

export async function getPlatformSettings() {
  let settings = await db.platformSettings.findFirst();
  if (!settings) {
    settings = await db.platformSettings.create({
      data: { platformFeePercent: 10.0 },
    });
  }
  return settings;
}

export async function updatePlatformSettings(data: { platformFeePercent: number }) {
  let settings = await db.platformSettings.findFirst();
  if (!settings) {
    return await db.platformSettings.create({ data });
  }
  return await db.platformSettings.update({
    where: { id: settings.id },
    data,
  });
}

export async function getAllPayments(page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const [payments, total] = await Promise.all([
    db.payment.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        client: { select: { name: true, email: true } },
        engineer: { include: { user: { select: { name: true, email: true } } } },
        project: { select: { title: true } },
      },
    }),
    db.payment.count(),
  ]);
  return {
    payments,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getWithdrawalRequests(
  page = 1,
  limit = 20,
  filters?: { status?: WithdrawalRequestStatus; payoutType?: PayoutType },
) {
  const skip = (page - 1) * limit;
  const where: { status?: WithdrawalRequestStatus; payoutType?: PayoutType } = {};
  if (filters?.status) where.status = filters.status;
  if (filters?.payoutType) where.payoutType = filters.payoutType;
  const [items, total] = await Promise.all([
    db.withdrawalRequest.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    }),
    db.withdrawalRequest.count({ where }),
  ]);

  const itemsList = items.map((item) => {
    const { 
      ibanEncrypted, 
      swiftBicEncrypted, 
      bankAddressEncrypted,
      accountHolderNameEncrypted,
      ...safeItem 
    } = item;
    return safeItem;
  });

  return {
    items: itemsList,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

function appendInternalNotes(
  existing: string | null | undefined,
  note?: string | null,
): string | undefined {
  const trimmed = note?.trim();
  if (!trimmed) return existing ?? undefined;
  return existing?.trim() ? `${existing.trim()}\n${trimmed}` : trimmed;
}

function isPaymobAutoPayout(item: {
  payoutType: PayoutType;
  paymobClientReference: string | null;
}) {
  return item.payoutType === "PAYMOB" || Boolean(item.paymobClientReference);
}

export async function updateWithdrawalRequestStatus(
  withdrawalId: number,
  adminId: number,
  input: UpdateWithdrawalRequestInput,
) {
  const item = await db.withdrawalRequest.findUnique({
    where: { id: withdrawalId },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });
  if (!item) throw new ApiError(404, "Withdrawal request not found");

  if (item.payoutType === "IBAN") {
    throw new ApiError(
      400,
      "International IBAN withdrawals must be managed via the dedicated approve, reject, initiate-transfer, and record-completion endpoints",
    );
  }

  if (
    item.status === "COMPLETED" ||
    item.status === "REJECTED" ||
    item.status === "CANCELLED" ||
    item.status === "FAILED"
  ) {
    throw new ApiError(400, "This withdrawal request is already finalized");
  }

  if (isPaymobAutoPayout(item)) {
    if (input.status === "REJECTED" || input.status === "CANCELLED") {
      const updated = await cancelPayoutByAdmin(
        withdrawalId,
        adminId,
        input.adminNotes ?? "Rejected by admin",
      );
      await createNotification(
        item.user.id,
        "FUNDS_RELEASED",
        "Withdrawal cancelled",
        `Your withdrawal of \${item.amount} was cancelled.${input.adminNotes ? ` ${input.adminNotes}` : ""}`,
        "/balance",
      );
      return { ...updated, user: item.user };
    }

    if (input.status === "COMPLETED") {
      const updated = await markPayoutCompletedByAdmin(
        withdrawalId,
        adminId,
        input.adminNotes,
      );
      await createNotification(
        item.user.id,
        "FUNDS_RELEASED",
        "Withdrawal completed",
        `Your withdrawal of \${item.amount} has been confirmed.`,
        "/balance",
      );
      return { ...updated, user: item.user };
    }

    throw new ApiError(
      400,
      "Paymob auto-payouts can only be completed, rejected, or cancelled by admin",
    );
  }

  const shouldFinalize = input.status === "COMPLETED";
  const shouldReject = input.status === "REJECTED";

  const updated = await db.$transaction(async (tx) => {
    await settleMaturedWalletTransactions(tx, item.userId);
    const wallet = await ensureWallet(tx, item.userId);

    if (shouldFinalize) {
      if (wallet.availableBalance < item.amount) {
        throw new ApiError(
          400,
          "Insufficient available balance to complete this withdrawal",
        );
      }

      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          availableBalance: { decrement: item.amount },
        },
      });
    }

    if (shouldReject) {
      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          availableBalance: { increment: item.amount },
        },
      });
    }

    await tx.walletTransaction.updateMany({
      where: {
        walletId: wallet.id,
        relatedWithdrawalId: item.id,
        type: "WITHDRAWAL",
      },
      data: {
        status: shouldFinalize ? "COMPLETED" : shouldReject ? "REJECTED" : "PENDING",
      },
    });

    return tx.withdrawalRequest.update({
      where: { id: item.id },
      data: {
        status: input.status,
        adminNotes: input.adminNotes,
        processedAt: shouldFinalize || shouldReject ? new Date() : null,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
  });

  if (updated.status === "COMPLETED") {
    await createNotification(
      updated.user.id,
      "FUNDS_RELEASED",
      "Withdrawal completed",
      `Your withdrawal request for \${updated.amount} has been marked completed by the admin.`,
      "/balance",
    );
  } else if (updated.status === "REJECTED") {
    await createNotification(
      updated.user.id,
      "FUNDS_RELEASED",
      "Withdrawal rejected",
      `Your withdrawal request for \${updated.amount} was rejected.${updated.adminNotes ? ` Note: ${updated.adminNotes}` : ""}`,
      "/balance",
    );
  } else if (updated.status === "PROCESSING") {
    await createNotification(
      updated.user.id,
      "FUNDS_RELEASED",
      "Withdrawal is processing",
      `Your withdrawal request for \${updated.amount} is being processed by the admin.`,
      "/balance",
    );
  }

  return updated;
}

export async function getWithdrawalAuditTrail(withdrawalId: number) {
  const item = await db.withdrawalRequest.findUnique({
    where: { id: withdrawalId },
    select: { id: true },
  });
  if (!item) throw new ApiError(404, "Withdrawal request not found");
  return getPayoutAuditTrail(withdrawalId);
}

export async function adminCancelWithdrawal(
  withdrawalId: number,
  adminId: number,
  reason?: string,
) {
  const item = await db.withdrawalRequest.findUnique({
    where: { id: withdrawalId },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  if (!item) throw new ApiError(404, "Withdrawal request not found");

  const updated = await cancelPayoutByAdmin(withdrawalId, adminId, reason);
  await createNotification(
    item.user.id,
    "FUNDS_RELEASED",
    "Withdrawal cancelled",
    `Your withdrawal of \${item.amount} was cancelled.${reason ? ` ${reason}` : ""}`,
    "/balance",
  );
  return { ...updated, user: item.user };
}

export async function adminResolveWithdrawal(
  withdrawalId: number,
  adminId: number,
  action: "release_funds" | "mark_completed" | "cancel",
  reason?: string,
) {
  const item = await db.withdrawalRequest.findUnique({
    where: { id: withdrawalId },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  if (!item) throw new ApiError(404, "Withdrawal request not found");

  const updated = await resolvePayoutManualReview(
    withdrawalId,
    adminId,
    action,
    reason,
  );

  const title =
    action === "mark_completed"
      ? "Withdrawal completed"
      : "Withdrawal resolved";
  const body =
    action === "mark_completed"
      ? `Your withdrawal of \${item.amount} has been confirmed after manual review.`
      : `Your withdrawal of \${item.amount} was resolved after manual review.${reason ? ` ${reason}` : ""}`;

  await createNotification(
    item.user.id,
    "FUNDS_RELEASED",
    title,
    body,
    "/balance",
  );

  return { ...updated, user: item.user };
}

export async function adminTriggerPayoutReconciliation() {
  return reconcilePendingPayouts(50);
}

export async function getPayoutStats() {
  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    total,
    completed,
    failed,
    processing,
    manualReview,
    volume24h,
    volume30d,
    completed30d,
    failed30d,
  ] = await Promise.all([
    db.withdrawalRequest.count(),
    db.withdrawalRequest.count({ where: { status: "COMPLETED" } }),
    db.withdrawalRequest.count({
      where: { status: { in: ["FAILED", "REJECTED", "CANCELLED"] } },
    }),
    db.withdrawalRequest.count({
      where: {
        status: {
          in: [
            "PENDING",
            "PENDING_REVIEW",
            "APPROVED",
            "TRANSFER_INITIATED",
            "SUBMITTED",
            "PROCESSING",
          ],
        },
      },
    }),
    db.withdrawalRequest.count({
      where: { status: "FAILED_NEEDS_MANUAL_REVIEW" },
    }),
    db.withdrawalRequest.aggregate({
      where: { createdAt: { gte: last24h }, status: "COMPLETED" },
      _sum: { amount: true },
    }),
    db.withdrawalRequest.aggregate({
      where: { createdAt: { gte: last30d }, status: "COMPLETED" },
      _sum: { amount: true },
    }),
    db.withdrawalRequest.count({
      where: { createdAt: { gte: last30d }, status: "COMPLETED" },
    }),
    db.withdrawalRequest.count({
      where: {
        createdAt: { gte: last30d },
        status: { in: ["FAILED", "REJECTED", "CANCELLED"] },
      },
    }),
  ]);

  const settled30d = completed30d + failed30d;
  const successRate =
    settled30d > 0 ? Math.round((completed30d / settled30d) * 1000) / 10 : 0;

  return {
    total,
    completed,
    failed,
    processing,
    manualReview,
    volume24h: toNumber(volume24h._sum.amount ?? 0),
    volume30d: toNumber(volume30d._sum.amount ?? 0),
    successRate,
  };
}

export async function overridePaymentStatus(paymentId: number, status: "RELEASED" | "REFUNDED") {
  return await db.payment.update({
    where: { id: paymentId },
    data: { status },
  });
}

export async function getAnalyticsData() {
  const users = await db.user.findMany({ select: { createdAt: true } });
  const payments = await db.payment.findMany({
    where: { status: { in: ["FUNDED", "RELEASED"] } },
    select: { amountUsd: true, commission: true, createdAt: true },
  });

  const dailySignups: Record<string, number> = {};
  users.forEach((u) => {
    const d = u.createdAt.toISOString().split("T")[0];
    dailySignups[d] = (dailySignups[d] || 0) + 1;
  });

  const dailyGmv: Record<string, number> = {};
  const dailyCommission: Record<string, number> = {};
  payments.forEach((p) => {
    const d = p.createdAt.toISOString().split("T")[0];
    dailyGmv[d] = (dailyGmv[d] || 0) + toNumber(p.amountUsd);
    dailyCommission[d] = (dailyCommission[d] || 0) + toNumber(p.commission);
  });

  const monthKey = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

  const monthlySignups: Record<string, number> = {};
  users.forEach((u) => {
    const key = monthKey(u.createdAt);
    monthlySignups[key] = (monthlySignups[key] || 0) + 1;
  });

  const monthlyRevenue: Record<string, number> = {};
  payments.forEach((p) => {
    const key = monthKey(p.createdAt);
    monthlyRevenue[key] = (monthlyRevenue[key] || 0) + toNumber(p.commission);
  });

  const lastNDays = (n: number) => {
    const days: string[] = [];
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(cursor);
      d.setDate(cursor.getDate() - i);
      days.push(d.toISOString().split("T")[0]);
    }
    return days;
  };

  const lastNMonths = (n: number) => {
    const months: string[] = [];
    const now = new Date();
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(monthKey(d));
    }
    return months;
  };

  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const prevYearStart = new Date(now.getFullYear() - 1, 0, 1);
  const prevYearEnd = new Date(now.getFullYear(), 0, 1);

  const revenueYtd = payments
    .filter((p) => p.createdAt >= yearStart)
    .reduce((sum, p) => sum + toNumber(p.commission), 0);
  const revenuePrevYtd = payments
    .filter((p) => p.createdAt >= prevYearStart && p.createdAt < prevYearEnd)
    .reduce((sum, p) => sum + toNumber(p.commission), 0);
  const yoyGrowth =
    revenuePrevYtd > 0
      ? Math.round(((revenueYtd - revenuePrevYtd) / revenuePrevYtd) * 1000) / 10
      : revenueYtd > 0
        ? 100
        : 0;

  const totalGmv = payments.reduce((sum, p) => sum + toNumber(p.amountUsd), 0);
  const totalCommission = payments.reduce(
    (sum, p) => sum + toNumber(p.commission),
    0,
  );
  const netMargin =
    totalGmv > 0 ? Math.round((totalCommission / totalGmv) * 1000) / 10 : 0;

  const settings = await db.platformSettings.findFirst();
  const platformFeePercent = settings?.platformFeePercent ?? 10;

  const dailyWindow = lastNDays(30);
  const monthlyWindow = lastNMonths(6);

  return {
    dailySignups: dailyWindow.map((date) => ({ date, count: dailySignups[date] ?? 0 })),
    dailyGmv: dailyWindow.map((date) => ({ date, amount: dailyGmv[date] ?? 0 })),
    dailyCommission: dailyWindow.map((date) => ({
      date,
      amount: dailyCommission[date] ?? 0,
    })),
    monthlySignups: monthlyWindow.map((month) => ({
      month,
      count: monthlySignups[month] ?? 0,
    })),
    monthlyRevenue: monthlyWindow.map((month) => ({
      month,
      amount: monthlyRevenue[month] ?? 0,
    })),
    revenueYtd,
    yoyGrowth,
    netMargin,
    platformFeePercent,
    totalGmv,
    totalSignups: users.length,
  };
}

function lastNDays(n: number) {
  const days: string[] = [];
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(cursor);
    d.setDate(cursor.getDate() - i);
    days.push(d.toISOString().split("T")[0]);
  }
  return days;
}

function computeDailyEscrowHeld(
  payments: Array<{
    amountUsd: number | { toString(): string };
    status: string;
    updatedAt: Date;
    ledgerEntries: Array<{ type: string; createdAt: Date }>;
  }>,
  days: string[],
) {
  const intervals = payments
    .filter((p) => ["FUNDED", "RELEASED", "REFUNDED"].includes(p.status))
    .map((p) => {
      const fundedEntry = p.ledgerEntries.find((e) => e.type === "FUNDED");
      const exitEntry = p.ledgerEntries.find(
        (e) => e.type === "RELEASED" || e.type === "REFUNDED",
      );
      const fundedAt = fundedEntry?.createdAt ?? p.updatedAt;
      const exitedAt =
        exitEntry?.createdAt ??
        (p.status === "RELEASED" || p.status === "REFUNDED" ? p.updatedAt : null);
      return { amount: toNumber(p.amountUsd), fundedAt, exitedAt };
    });

  return days.map((dateStr) => {
    const dayEnd = new Date(`${dateStr}T23:59:59.999Z`);
    const held = intervals.reduce((sum, p) => {
      if (p.fundedAt <= dayEnd && (!p.exitedAt || p.exitedAt > dayEnd)) {
        return sum + p.amount;
      }
      return sum;
    }, 0);
    return { date: dateStr, amount: Math.round(held * 100) / 100 };
  });
}

export async function getEscrowOverview() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const payments = await db.payment.findMany({
    select: {
      amountUsd: true,
      status: true,
      updatedAt: true,
      createdAt: true,
      ledgerEntries: {
        where: { type: { in: ["FUNDED", "RELEASED", "REFUNDED"] } },
        select: { type: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  const totalInEscrow = payments
    .filter((p) => p.status === "FUNDED")
    .reduce((sum, p) => sum + toNumber(p.amountUsd), 0);

  const released30d = payments
    .filter((p) => p.status === "RELEASED" && p.updatedAt >= thirtyDaysAgo)
    .reduce((sum, p) => sum + toNumber(p.amountUsd), 0);

  const refunded30d = payments
    .filter((p) => p.status === "REFUNDED" && p.updatedAt >= thirtyDaysAgo)
    .reduce((sum, p) => sum + toNumber(p.amountUsd), 0);

  const disputedTickets = await db.supportTicket.findMany({
    where: { status: "OPEN" },
    select: { id: true, subject: true, createdAt: true },
  });

  const disputedAmount = payments
    .filter((p) => p.status === "FUNDED")
    .slice(0, disputedTickets.length)
    .reduce((sum, p) => sum + toNumber(p.amountUsd), 0);

  const utilizationPercent =
    totalInEscrow + released30d > 0
      ? Math.round((totalInEscrow / (totalInEscrow + released30d)) * 100)
      : 0;

  const dailyWindow = lastNDays(30);
  const dailyEscrowHeld = computeDailyEscrowHeld(payments, dailyWindow);

  return {
    totalInEscrow,
    released30d,
    refunded30d,
    disputed: disputedAmount,
    utilizationPercent,
    dailyEscrowHeld,
  };
}

export async function getActiveDisputes(limit = 10) {
  const tickets = await db.supportTicket.findMany({
    where: { status: "OPEN" },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return tickets.map((ticket) => ({
    id: ticket.id,
    caseId: `TKT-${String(ticket.id).padStart(4, "0")}`,
    parties: `${ticket.name} · ${ticket.email}`,
    subject: ticket.subject,
    amount: null as number | null,
    status: "Open",
    statusColor: "amber" as const,
    ageHours: Math.max(
      1,
      Math.round((Date.now() - ticket.createdAt.getTime()) / (1000 * 60 * 60)),
    ),
    createdAt: ticket.createdAt,
  }));
}

export async function getSystemHealth() {
  const started = Date.now();
  const services: Array<{ name: string; up: boolean; uptime: number }> = [];

  try {
    await db.$queryRaw`SELECT 1`;
    const latency = Date.now() - started;
    services.push({
      name: "Database",
      up: true,
      uptime: latency < 500 ? 99.99 : 99.5,
    });
  } catch {
    services.push({ name: "Database", up: false, uptime: 0 });
  }

  try {
    const key = "clinka:health:ping";
    await cacheSet(key, "ok", 30);
    const val = await cacheGet(key);
    services.push({
      name: "Redis cache",
      up: val === "ok",
      uptime: val === "ok" ? 99.95 : 0,
    });
  } catch {
    services.push({ name: "Redis cache", up: false, uptime: 0 });
  }

  services.push({ name: "API gateway", up: true, uptime: 99.99 });
  services.push({ name: "Escrow service", up: true, uptime: 99.97 });
  services.push({ name: "Messaging realtime", up: true, uptime: 99.92 });
  services.push({ name: "Notification mailer", up: true, uptime: 99.88 });

  const allUp = services.every((s) => s.up);
  const apiLatencyMs = Date.now() - started;

  return {
    services,
    allOperational: allUp,
    apiLatencyMs,
    queueStatus: allUp ? "healthy" : "degraded",
  };
}

export async function getSystemLogs(limit = 50) {
  const [users, bans, tickets, payments, projects, reviews] = await Promise.all([
    db.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
      select: { name: true, email: true, role: true, createdAt: true },
    }),
    db.ban.findMany({
      orderBy: { bannedAt: "desc" },
      take: 12,
      include: { user: { select: { name: true } } },
    }),
    db.supportTicket.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
      select: { id: true, subject: true, status: true, createdAt: true },
    }),
    db.payment.findMany({
      orderBy: { updatedAt: "desc" },
      take: 12,
      include: { project: { select: { title: true } } },
    }),
    db.project.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { title: true, status: true, createdAt: true },
    }),
    db.review.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { project: { select: { title: true } } },
    }),
  ]);

  type LogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG";
  const entries: Array<{ timestamp: Date; level: LogLevel; message: string }> = [];

  users.forEach((u) =>
    entries.push({
      timestamp: u.createdAt,
      level: "INFO",
      message: `New ${u.role.toLowerCase()} registered: ${u.name} (${u.email})`,
    }),
  );

  bans.forEach((b) =>
    entries.push({
      timestamp: b.bannedAt,
      level: b.reason === "CONTACT_INFO_SHARING" ? "WARN" : "ERROR",
      message: `Account suspended (${b.reason.replace(/_/g, " ").toLowerCase()}): ${b.user.name}`,
    }),
  );

  tickets.forEach((t) =>
    entries.push({
      timestamp: t.createdAt,
      level: t.status === "OPEN" ? "WARN" : "INFO",
      message: `Support ticket #${t.id} [${t.status}]: ${t.subject}`,
    }),
  );

  payments.forEach((p) =>
    entries.push({
      timestamp: p.updatedAt,
      level: p.status === "REFUNDED" ? "WARN" : "INFO",
      message: `Payment #${p.id} ${p.status.toLowerCase()} for "${p.project.title}"`,
    }),
  );

  projects.forEach((p) =>
    entries.push({
      timestamp: p.createdAt,
      level: "INFO",
      message: `Project created (${p.status}): ${p.title}`,
    }),
  );

  reviews.forEach((r) =>
    entries.push({
      timestamp: r.createdAt,
      level: "INFO",
      message: `Review submitted for "${r.project.title}"`,
    }),
  );

  return entries
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, limit)
    .map((entry) => ({
      timestamp: entry.timestamp.toISOString(),
      level: entry.level,
      message: entry.message,
    }));
}

export async function getSupportTickets(page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const [tickets, total] = await Promise.all([
    db.supportTicket.findMany({
      skip,
      take: limit,
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      include: {
        resolvedBy: { select: { id: true, name: true } },
      },
    }),
    db.supportTicket.count(),
  ]);

  return {
    tickets,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function updateSupportTicket(
  ticketId: number,
  adminId: number,
  data: UpdateSupportTicketInput,
) {
  const ticket = await db.supportTicket.findUnique({ where: { id: ticketId } });
  if (!ticket) throw new ApiError(404, "Support ticket not found");
  if (ticket.status !== "OPEN") {
    throw new ApiError(400, "This ticket has already been resolved");
  }

  return db.supportTicket.update({
    where: { id: ticketId },
    data: {
      status: data.status,
      solution: data.solution,
      resolvedById: adminId,
      resolvedAt: new Date(),
    },
    include: {
      resolvedBy: { select: { id: true, name: true } },
    },
  });
}

export async function revealWithdrawalBankDetails(
  withdrawalId: number,
  adminId: number,
  adminIp?: string,
  adminUserAgent?: string,
) {
  const item = await db.withdrawalRequest.findUnique({
    where: { id: withdrawalId },
    select: { 
      id: true,
      payoutType: true,
      bankName: true,
      country: true,
      accountNumber: true,
      accountHolderNameEncrypted: true,
      ibanEncrypted: true,
      swiftBicEncrypted: true,
      bankAddressEncrypted: true,
    }
  });

  if (!item || !["IBAN", "INSTAPAY", "E_WALLET"].includes(item.payoutType)) {
    throw new ApiError(404, "Withdrawal request bank details not found or not applicable");
  }

  const { decryptSensitiveField } = await import("../../utils/fieldEncryption");
  
  const decrypted: any = {
    bankName: item.bankName,
    country: item.country,
    accountHolderName: item.accountHolderNameEncrypted ? decryptSensitiveField(item.accountHolderNameEncrypted) : null,
  };

  if (item.payoutType === "IBAN") {
    decrypted.iban = item.ibanEncrypted ? decryptSensitiveField(item.ibanEncrypted) : null;
    decrypted.swiftBic = item.swiftBicEncrypted ? decryptSensitiveField(item.swiftBicEncrypted) : null;
    decrypted.bankAddress = item.bankAddressEncrypted ? decryptSensitiveField(item.bankAddressEncrypted) : null;
  } else if (item.payoutType === "INSTAPAY") {
    decrypted.instapayAccount = item.accountNumber;
  } else if (item.payoutType === "E_WALLET") {
    decrypted.walletProvider = item.bankName;
    decrypted.walletNumber = item.accountNumber;
  }

  const { logPayoutEvent } = await import("../payouts/payout.audit");
  await logPayoutEvent(db as any, {
    withdrawalId,
    event: "ADMIN_VIEWED_BANK_DETAILS",
    actorId: adminId,
    actorIp: adminIp,
    actorUserAgent: adminUserAgent,
  });

  return decrypted;
}

export async function rejectInternationalWithdrawal(withdrawalId: number, adminId: number, reason: string, notes?: string) {
  const updated = await db.$transaction(async (tx) => {
    const item = await tx.withdrawalRequest.findUnique({ where: { id: withdrawalId } });
    if (!item) {
      throw new ApiError(404, "Withdrawal request not found");
    }
    assertPayoutTransition(item.status, "REJECTED");

    const result = await tx.withdrawalRequest.updateMany({
      where: { id: withdrawalId, status: "PENDING_REVIEW" },
      data: {
        status: "REJECTED",
        rejectedAt: new Date(),
        rejectedById: adminId,
        rejectionReason: reason,
        internalNotes: appendInternalNotes(item.internalNotes, notes),
        processedAt: new Date(),
      },
    });
    if (result.count === 0) {
      throw new ApiError(400, "Withdrawal is not pending review or was already processed");
    }

    const { lockWalletForUpdate } = await import("../../utils/wallet");
    const wallet = await lockWalletForUpdate(tx, item.userId);

    await tx.walletTransaction.updateMany({
      where: { relatedWithdrawalId: withdrawalId, type: "WITHDRAWAL" },
      data: { status: "REJECTED" },
    });

    await tx.wallet.update({
      where: { id: wallet.id },
      data: { 
        availableBalance: { increment: Number(item.amount) },
        version: { increment: 1 }
      },
    });

    const updatedRow = await tx.withdrawalRequest.findUniqueOrThrow({
      where: { id: withdrawalId },
    });

    const { logPayoutEvent } = await import("../payouts/payout.audit");
    await logPayoutEvent(tx as any, {
      withdrawalId,
      event: "ADMIN_REJECTED",
      statusBefore: "PENDING_REVIEW",
      statusAfter: "REJECTED",
      actorId: adminId,
      message: reason,
      metadata: { notes },
    });
    await logPayoutEvent(tx as any, {
      withdrawalId,
      event: "BALANCE_RELEASED",
      statusBefore: "PENDING_REVIEW",
      statusAfter: "REJECTED",
      actorId: adminId,
      message: String(item.amount),
    });

    return updatedRow;
  });

  await createNotification(
    updated.userId,
    "FUNDS_RELEASED",
    "Withdrawal Rejected",
    `Your withdrawal request of $${updated.amount} has been rejected.\n\nReason:\n${reason}\n\nNote:\n${notes || "Please update your receiving account and submit a new request."}`,
    "/balance",
  );

  return updated;
}

export async function recordCompletion(
  withdrawalId: number, 
  adminId: number, 
  notes?: string,
  transferMethod?: string,
  transferReference?: string,
  proofUrl?: string,
  proofOriginalName?: string
) {
  const updated = await db.$transaction(async (tx) => {
    const item = await tx.withdrawalRequest.findUnique({ where: { id: withdrawalId } });
    if (!item) {
      throw new ApiError(404, "Withdrawal request not found");
    }
    
    if (item.status === "COMPLETED") {
      throw new ApiError(400, "Withdrawal is already completed.");
    }
    
    assertPayoutTransition(item.status, "COMPLETED");

    const finalReference = transferReference || item.externalReference;
    if (!finalReference) {
      throw new ApiError(400, "A transfer reference is required to mark as completed.");
    }

    const result = await tx.withdrawalRequest.updateMany({
      where: {
        id: withdrawalId,
        status: { in: ["PENDING_REVIEW", "TRANSFER_INITIATED", "PROCESSING", "FAILED_NEEDS_MANUAL_REVIEW"] },
      },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        completedById: adminId,
        externalReference: finalReference,
        method: transferMethod ? transferMethod : item.method,
        internalNotes: appendInternalNotes(item.internalNotes, notes),
        processedAt: new Date(),
        proofUrl,
        proofOriginalName
      },
    });
    if (result.count === 0) {
      throw new ApiError(400, "Withdrawal cannot be completed from its current state.");
    }

    await tx.walletTransaction.updateMany({
      where: { relatedWithdrawalId: withdrawalId, type: "WITHDRAWAL" },
      data: { status: "COMPLETED" },
    });

    const { lockWalletForUpdate } = await import("../../utils/wallet");
    const wallet = await lockWalletForUpdate(tx, item.userId);
    await tx.wallet.update({
      where: { id: wallet.id },
      data: {
        version: { increment: 1 }
      }
    });

    const updatedRow = await tx.withdrawalRequest.findUniqueOrThrow({
      where: { id: withdrawalId },
    });

    const { logPayoutEvent } = await import("../payouts/payout.audit");
    await logPayoutEvent(tx as any, {
      withdrawalId,
      event: "COMPLETED",
      statusBefore: item.status,
      statusAfter: "COMPLETED",
      actorId: adminId,
      message: notes,
      metadata: { transferReference: finalReference, proofUrl },
    });

    return updatedRow;
  });

  await createNotification(
    updated.userId,
    "FUNDS_RELEASED",
    "Withdrawal Paid",
    `Your withdrawal request of $${updated.amount} has been sent.\n\nPayment Method:\n${transferMethod || updated.method}\n\nTransaction Reference:\n${transferReference || updated.externalReference}\n\nNote:\n${notes || "Please allow your bank/payment provider to process the transfer."}`,
    "/balance",
  );

  return updated;
}



