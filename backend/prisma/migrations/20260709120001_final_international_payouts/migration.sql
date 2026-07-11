-- Final international payouts: align enum values, statuses, columns, and indexes with schema.prisma

-- Rename legacy PayoutType values (20260709120000 used EGYPTIAN_PAYMOB / INTERNATIONAL_IBAN)
DO $$ BEGIN
  ALTER TYPE "PayoutType" RENAME VALUE 'EGYPTIAN_PAYMOB' TO 'PAYMOB';
EXCEPTION
  WHEN undefined_object THEN NULL;
  WHEN invalid_parameter_value THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE "PayoutType" RENAME VALUE 'INTERNATIONAL_IBAN' TO 'IBAN';
EXCEPTION
  WHEN undefined_object THEN NULL;
  WHEN invalid_parameter_value THEN NULL;
END $$;

-- International withdrawal lifecycle statuses
ALTER TYPE "WithdrawalRequestStatus" ADD VALUE IF NOT EXISTS 'PENDING_REVIEW';
ALTER TYPE "WithdrawalRequestStatus" ADD VALUE IF NOT EXISTS 'APPROVED';
ALTER TYPE "WithdrawalRequestStatus" ADD VALUE IF NOT EXISTS 'TRANSFER_INITIATED';
ALTER TYPE "WithdrawalRequestStatus" ADD VALUE IF NOT EXISTS 'FAILED_NEEDS_MANUAL_REVIEW';

-- International payout audit events
ALTER TYPE "PayoutAuditEvent" ADD VALUE IF NOT EXISTS 'ADMIN_APPROVED';
ALTER TYPE "PayoutAuditEvent" ADD VALUE IF NOT EXISTS 'ADMIN_REJECTED';
ALTER TYPE "PayoutAuditEvent" ADD VALUE IF NOT EXISTS 'ADMIN_VIEWED_BANK_DETAILS';
ALTER TYPE "PayoutAuditEvent" ADD VALUE IF NOT EXISTS 'TRANSFER_INITIATED';
ALTER TYPE "PayoutAuditEvent" ADD VALUE IF NOT EXISTS 'IDEMPOTENT_REQUEST_REUSED';

-- WithdrawalRequest international fields
ALTER TABLE "WithdrawalRequest"
  ADD COLUMN IF NOT EXISTS "accountHolderNameEncrypted" TEXT,
  ADD COLUMN IF NOT EXISTS "swiftBicEncrypted" TEXT,
  ADD COLUMN IF NOT EXISTS "bankAddressEncrypted" TEXT,
  ADD COLUMN IF NOT EXISTS "externalReference" TEXT,
  ADD COLUMN IF NOT EXISTS "internalNotes" TEXT,
  ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT,
  ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "approvedById" INTEGER,
  ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "completedById" INTEGER,
  ADD COLUMN IF NOT EXISTS "rejectedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "rejectedById" INTEGER,
  ADD COLUMN IF NOT EXISTS "reconciledAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "reconciledById" INTEGER;

-- Optimistic concurrency for wallet mutations
ALTER TABLE "Wallet" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;

-- Audit log hardening columns (may pre-exist on some deploys)
ALTER TABLE "PayoutAuditLog"
  ADD COLUMN IF NOT EXISTS "previousHash" TEXT,
  ADD COLUMN IF NOT EXISTS "hash" TEXT,
  ADD COLUMN IF NOT EXISTS "actorId" INTEGER,
  ADD COLUMN IF NOT EXISTS "actorIp" TEXT,
  ADD COLUMN IF NOT EXISTS "actorUserAgent" TEXT;

-- One active international withdrawal per engineer
CREATE UNIQUE INDEX IF NOT EXISTS "one_active_iban_per_user"
  ON "WithdrawalRequest"("userId")
  WHERE "payoutType" = 'IBAN'
    AND status IN ('PENDING_REVIEW', 'APPROVED', 'TRANSFER_INITIATED', 'PROCESSING');
