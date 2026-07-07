-- Payout hardening: expanded statuses, audit log, idempotency

ALTER TYPE "WithdrawalRequestStatus" ADD VALUE IF NOT EXISTS 'SUBMITTED';
ALTER TYPE "WithdrawalRequestStatus" ADD VALUE IF NOT EXISTS 'FAILED';
ALTER TYPE "WithdrawalRequestStatus" ADD VALUE IF NOT EXISTS 'CANCELLED';
ALTER TYPE "WithdrawalRequestStatus" ADD VALUE IF NOT EXISTS 'REVERSED';

CREATE TYPE "PayoutAuditEvent" AS ENUM (
  'CREATED',
  'BALANCE_HELD',
  'SUBMITTED',
  'PAYMOB_RESPONSE',
  'CALLBACK_RECEIVED',
  'INQUIRY_UPDATED',
  'COMPLETED',
  'FAILED',
  'CANCELLED',
  'REVERSED',
  'BALANCE_RELEASED',
  'ADMIN_OVERRIDE',
  'RECONCILIATION'
);

ALTER TABLE "WithdrawalRequest" ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT;
ALTER TABLE "WithdrawalRequest" ADD COLUMN IF NOT EXISTS "failureReason" TEXT;
ALTER TABLE "WithdrawalRequest" ADD COLUMN IF NOT EXISTS "balanceHeldAt" TIMESTAMP(3);
ALTER TABLE "WithdrawalRequest" ADD COLUMN IF NOT EXISTS "submittedAt" TIMESTAMP(3);
ALTER TABLE "WithdrawalRequest" ADD COLUMN IF NOT EXISTS "lastInquiryAt" TIMESTAMP(3);

UPDATE "WithdrawalRequest"
SET "status" = 'FAILED'
WHERE "status" = 'REJECTED';

CREATE UNIQUE INDEX IF NOT EXISTS "WithdrawalRequest_paymobClientReference_key"
  ON "WithdrawalRequest"("paymobClientReference")
  WHERE "paymobClientReference" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "WithdrawalRequest_userId_idempotencyKey_key"
  ON "WithdrawalRequest"("userId", "idempotencyKey")
  WHERE "idempotencyKey" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "WithdrawalRequest_status_updatedAt_idx"
  ON "WithdrawalRequest"("status", "updatedAt");

CREATE INDEX IF NOT EXISTS "WithdrawalRequest_paymobTransactionId_idx"
  ON "WithdrawalRequest"("paymobTransactionId");

CREATE TABLE IF NOT EXISTS "PayoutAuditLog" (
  "id" SERIAL NOT NULL,
  "withdrawalId" INTEGER NOT NULL,
  "event" "PayoutAuditEvent" NOT NULL,
  "statusBefore" "WithdrawalRequestStatus",
  "statusAfter" "WithdrawalRequestStatus",
  "message" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PayoutAuditLog_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PayoutAuditLog_withdrawalId_fkey"
    FOREIGN KEY ("withdrawalId") REFERENCES "WithdrawalRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "PayoutAuditLog_withdrawalId_createdAt_idx"
  ON "PayoutAuditLog"("withdrawalId", "createdAt");
