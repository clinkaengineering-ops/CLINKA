-- Final international payouts (part 1): enum renames and new enum values only.
-- IMPORTANT: new enum values added here cannot be referenced by any statement
-- in this same migration/transaction (Postgres 55P04). Anything that USES
-- these values (columns, indexes, etc.) must live in a LATER migration.

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
