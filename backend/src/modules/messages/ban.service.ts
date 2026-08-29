import db from "../../config/db";
import { BanReason } from "../../generated/prisma/enums";
import ApiError from "../../utils/ApiError";
import { createNotification } from "../../utils/notifications";

const BAN_DAYS = 30;

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export async function banUserFor30Days(
  userId: number,
  reason: BanReason,
  bannedById?: number,
  note?: string,
  triggerMessage?: string,
) {
  const now = new Date();
  const expiresAt = addDays(now, BAN_DAYS);

  await db.ban.upsert({
    where: { userId },
    create: {
      userId,
      reason,
      bannedAt: now,
      expiresAt,
      bannedById: bannedById ?? null,
      note: note ?? null,
      triggerMessage: triggerMessage ?? null,
      active: true,
    },
    update: {
      reason,
      bannedAt: now,
      expiresAt,
      bannedById: bannedById ?? null,
      note: note ?? null,
      triggerMessage: triggerMessage ?? null,
      active: true,
    },
  });

  const body =
    reason === BanReason.CONTACT_INFO_SHARING
      ? "You have been suspended for 30 days for sharing contact information outside the platform."
      : note?.trim() ||
        "Your account has been suspended for 30 days by an administrator.";

  await createNotification(
    userId,
    "ACCOUNT_BANNED",
    "Account suspended",
    body,
    undefined,
    { force: true },
  );
}

export async function isUserBanned(
  userId: number,
): Promise<{ banned: boolean; expiresAt: Date | null; reason?: string }> {
  const ban = await db.ban.findUnique({ where: { userId } });

  if (!ban) {
    return { banned: false, expiresAt: null };
  }

  const now = new Date();

  if (!ban.active || ban.expiresAt <= now) {
    if (ban.active && ban.expiresAt <= now) {
      await db.ban.update({
        where: { userId },
        data: { active: false },
      });
    }
    return { banned: false, expiresAt: null };
  }

  const reason =
    ban.reason === "CONTACT_INFO_SHARING"
      ? "Sharing contact information outside the platform"
      : ban.note || "Administrator action";

  return { banned: true, expiresAt: ban.expiresAt, reason };
}

export function formatBanExpiry(expiresAt: Date | null): string {
  return expiresAt?.toLocaleDateString("en-EG") ?? "the expiry date";
}

export function bannedUserMessage(
  expiresAt: Date | null,
  action: string,
  reason?: string,
): string {
  const reasonText = reason ? ` Cause: ${reason}.` : "";
  return `Your account is suspended until ${formatBanExpiry(expiresAt)}.${reasonText} You cannot ${action}.`;
}

export async function assertUserNotBanned(
  userId: number,
  action: string,
): Promise<void> {
  const banStatus = await isUserBanned(userId);
  if (banStatus.banned) {
    throw new ApiError(
      403,
      bannedUserMessage(banStatus.expiresAt, action, banStatus.reason),
    );
  }
}
