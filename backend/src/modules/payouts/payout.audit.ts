import crypto from "crypto";
import type { PayoutAuditEvent, WithdrawalRequestStatus } from "../../generated/prisma/client";

type TxLike = {
  payoutAuditLog: {
    findFirst: (args: any) => Promise<any>;
    create: (args: any) => Promise<any>;
  };
};

function maskPII(obj: any): any {
  if (!obj || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(maskPII);
  
  const masked = { ...obj };
  const sensitiveKeys = ["msisdn", "nationalId", "bankCardNumber", "pan", "national_id", "bank_card_number"];
  
  for (const key of Object.keys(masked)) {
    if (sensitiveKeys.includes(key) && typeof masked[key] === "string") {
      const str = masked[key] as string;
      if (str.length > 4) {
        masked[key] = str.substring(0, 2) + "***" + str.substring(str.length - 2);
      } else {
        masked[key] = "***";
      }
    } else if (typeof masked[key] === "object") {
      masked[key] = maskPII(masked[key]);
    }
  }
  return masked;
}

export async function logPayoutEvent(
  tx: TxLike,
  input: {
    withdrawalId: number;
    event: PayoutAuditEvent;
    statusBefore?: WithdrawalRequestStatus | null;
    statusAfter?: WithdrawalRequestStatus | null;
    message?: string;
    metadata?: Record<string, unknown>;
    actorId?: number;
    actorIp?: string;
    actorUserAgent?: string;
  },
) {
  const lastLog = await tx.payoutAuditLog.findFirst({
    where: { withdrawalId: input.withdrawalId },
    orderBy: { id: 'desc' },
    select: { hash: true }
  });

  const previousHash = lastLog?.hash ?? null;
  const maskedMetadata = input.metadata ? maskPII(input.metadata) : null;
  const now = new Date();

  // Compute current hash for the chain
  const hashPayload = JSON.stringify({
    withdrawalId: input.withdrawalId,
    event: input.event,
    statusBefore: input.statusBefore ?? null,
    statusAfter: input.statusAfter ?? null,
    message: input.message ?? null,
    previousHash,
    timestamp: now.toISOString(),
  });

  const currentHash = crypto.createHash("sha256").update(hashPayload).digest("hex");

  await tx.payoutAuditLog.create({
    data: {
      withdrawalId: input.withdrawalId,
      event: input.event,
      statusBefore: input.statusBefore ?? null,
      statusAfter: input.statusAfter ?? null,
      message: input.message ?? null,
      metadata: maskedMetadata,
      previousHash,
      hash: currentHash,
      actorId: input.actorId ?? null,
      actorIp: input.actorIp ?? null,
      actorUserAgent: input.actorUserAgent ?? null,
    },
  });
}
