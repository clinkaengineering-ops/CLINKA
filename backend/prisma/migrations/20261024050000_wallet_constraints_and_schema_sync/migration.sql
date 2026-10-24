-- CreateIndex: Add index on paymentId for ManualPaymentSubmission if not exists
CREATE INDEX IF NOT EXISTS "ManualPaymentSubmission_paymentId_idx" ON "ManualPaymentSubmission"("paymentId");

-- CreateIndex: Add compound index on (paymentId, type) for PaymentLedgerEntry if not exists
CREATE INDEX IF NOT EXISTS "PaymentLedgerEntry_paymentId_type_idx" ON "PaymentLedgerEntry"("paymentId", "type");

-- Clean orphan records before adding foreign keys
UPDATE "ManualPaymentSubmission"
SET "verifiedBy" = NULL
WHERE "verifiedBy" IS NOT NULL
  AND "verifiedBy" NOT IN (SELECT "id" FROM "User");

-- AddForeignKey: ManualPaymentSubmission.verifiedBy -> User.id
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ManualPaymentSubmission_verifiedBy_fkey'
  ) THEN
    BEGIN
      ALTER TABLE "ManualPaymentSubmission"
      ADD CONSTRAINT "ManualPaymentSubmission_verifiedBy_fkey"
      FOREIGN KEY ("verifiedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not apply ManualPaymentSubmission_verifiedBy_fkey: %', SQLERRM;
    END;
  END IF;
END $$;

-- Clean orphan records before adding foreign keys
UPDATE "WithdrawalRequest"
SET "approvedById" = NULL
WHERE "approvedById" IS NOT NULL
  AND "approvedById" NOT IN (SELECT "id" FROM "User");

-- AddForeignKey: WithdrawalRequest.approvedById -> User.id
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'WithdrawalRequest_approvedById_fkey'
  ) THEN
    BEGIN
      ALTER TABLE "WithdrawalRequest"
      ADD CONSTRAINT "WithdrawalRequest_approvedById_fkey"
      FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not apply WithdrawalRequest_approvedById_fkey: %', SQLERRM;
    END;
  END IF;
END $$;

-- Clean orphan records before adding foreign keys
UPDATE "WithdrawalRequest"
SET "completedById" = NULL
WHERE "completedById" IS NOT NULL
  AND "completedById" NOT IN (SELECT "id" FROM "User");

-- AddForeignKey: WithdrawalRequest.completedById -> User.id
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'WithdrawalRequest_completedById_fkey'
  ) THEN
    BEGIN
      ALTER TABLE "WithdrawalRequest"
      ADD CONSTRAINT "WithdrawalRequest_completedById_fkey"
      FOREIGN KEY ("completedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not apply WithdrawalRequest_completedById_fkey: %', SQLERRM;
    END;
  END IF;
END $$;

-- Clean orphan records before adding foreign keys
UPDATE "WithdrawalRequest"
SET "rejectedById" = NULL
WHERE "rejectedById" IS NOT NULL
  AND "rejectedById" NOT IN (SELECT "id" FROM "User");

-- AddForeignKey: WithdrawalRequest.rejectedById -> User.id
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'WithdrawalRequest_rejectedById_fkey'
  ) THEN
    BEGIN
      ALTER TABLE "WithdrawalRequest"
      ADD CONSTRAINT "WithdrawalRequest_rejectedById_fkey"
      FOREIGN KEY ("rejectedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not apply WithdrawalRequest_rejectedById_fkey: %', SQLERRM;
    END;
  END IF;
END $$;

-- Clean negative balances if any exist before adding check constraints
UPDATE "Wallet" SET "heldByDispute" = 0 WHERE "heldByDispute" < 0;

-- CheckConstraint: Non-negative heldByDispute balance on Wallet
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Wallet_heldByDispute_non_negative'
  ) THEN
    BEGIN
      ALTER TABLE "Wallet"
      ADD CONSTRAINT "Wallet_heldByDispute_non_negative"
      CHECK ("heldByDispute" >= 0);
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not apply Wallet_heldByDispute_non_negative: %', SQLERRM;
    END;
  END IF;
END $$;

-- Clean negative balances if any exist before adding check constraints
UPDATE "Wallet" SET "availableBalance" = 0 WHERE "availableBalance" < 0;

-- CheckConstraint: Non-negative availableBalance on Wallet
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Wallet_availableBalance_non_negative'
  ) THEN
    BEGIN
      ALTER TABLE "Wallet"
      ADD CONSTRAINT "Wallet_availableBalance_non_negative"
      CHECK ("availableBalance" >= 0);
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not apply Wallet_availableBalance_non_negative: %', SQLERRM;
    END;
  END IF;
END $$;

-- Clean negative balances if any exist before adding check constraints
UPDATE "Wallet" SET "pendingBalance" = 0 WHERE "pendingBalance" < 0;

-- CheckConstraint: Non-negative pendingBalance on Wallet
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Wallet_pendingBalance_non_negative'
  ) THEN
    BEGIN
      ALTER TABLE "Wallet"
      ADD CONSTRAINT "Wallet_pendingBalance_non_negative"
      CHECK ("pendingBalance" >= 0);
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not apply Wallet_pendingBalance_non_negative: %', SQLERRM;
    END;
  END IF;
END $$;
