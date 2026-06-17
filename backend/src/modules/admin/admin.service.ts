import db from "../../config/db";
import ApiError from "../../utils/ApiError";
import { UpdateVerificationInput } from "./admin.validation";
import {
  banUserFor30Days,
} from "../messages/ban.service";
import { BanReason } from "../../generated/prisma/enums";
import { createNotification } from "../../utils/notifications";
import generateToken from "../../utils/generateToken";

function stripPassword<T extends { password: string }>({ password: _, ...safe }: T) {
  return safe;
}

export async function getAdminStats() {
  const [
    totalUsers,
    totalEngineers,
    totalClients,
    totalProjects,
    pendingVerifications,
    payments,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { role: "ENGINEER" } }),
    db.user.count({ where: { role: "CLIENT" } }),
    db.project.count(),
    db.engineerProfile.count({ where: { verificationStatus: "PENDING" } }),
    db.payment.findMany({
      where: { status: { in: ["FUNDED", "RELEASED"] } },
      select: { amount: true, status: true },
    }),
  ]);

  const gmv = payments.reduce((sum, p) => sum + p.amount, 0);
  const inEscrow = payments
    .filter((p) => p.status === "FUNDED")
    .reduce((sum, p) => sum + p.amount, 0);

  return {
    totalUsers,
    totalEngineers,
    totalClients,
    totalProjects,
    pendingVerifications,
    gmv,
    inEscrow,
    openDisputes: 0,
  };
}

export async function getPendingVerifications() {
  const engineers = await db.user.findMany({
    where: {
      role: "ENGINEER",
      profile: { verificationStatus: "PENDING" },
    },
    include: { profile: true },
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

  return stripPassword(updated.user);
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
        projectTitle: conv.project.title,
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
    select: { amount: true, createdAt: true },
  });

  const dailySignups: Record<string, number> = {};
  users.forEach((u) => {
    const d = u.createdAt.toISOString().split("T")[0];
    dailySignups[d] = (dailySignups[d] || 0) + 1;
  });

  const dailyGmv: Record<string, number> = {};
  payments.forEach((p) => {
    const d = p.createdAt.toISOString().split("T")[0];
    dailyGmv[d] = (dailyGmv[d] || 0) + p.amount;
  });

  return {
    dailySignups: Object.entries(dailySignups).map(([date, count]) => ({ date, count })),
    dailyGmv: Object.entries(dailyGmv).map(([date, amount]) => ({ date, amount })),
  };
}

export async function getSystemLogs() {
  // In a real app, read from a log file like Winston or Pino.
  // For MVP demonstration, return mock recent events.
  return [
    { timestamp: new Date().toISOString(), level: "INFO", message: "Admin dashboard accessed." },
    { timestamp: new Date(Date.now() - 3600000).toISOString(), level: "WARN", message: "Stripe webhook failed - Retrying." },
    { timestamp: new Date(Date.now() - 7200000).toISOString(), level: "ERROR", message: "Database connection timeout in GET /projects." },
    { timestamp: new Date(Date.now() - 86400000).toISOString(), level: "INFO", message: "Server restarted successfully." },
  ];
}


