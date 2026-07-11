-- Final international payouts (part 2): columns and index that reference
-- the enum values added in 20260709120001_final_international_payouts.
-- Split into its own migration/transaction so the enum values above are
-- already committed and safe to use here.

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
