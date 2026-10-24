-- CreateIndex: Add index on paymentId for ManualPaymentSubmission if not exists
CREATE INDEX IF NOT EXISTS "ManualPaymentSubmission_paymentId_idx" ON "ManualPaymentSubmission"("paymentId");

-- CreateIndex: Add compound index on (paymentId, type) for PaymentLedgerEntry if not exists
CREATE INDEX IF NOT EXISTS "PaymentLedgerEntry_paymentId_type_idx" ON "PaymentLedgerEntry"("paymentId", "type");

-- AddForeignKey: ManualPaymentSubmission.verifiedBy -> User.id
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ManualPaymentSubmission_verifiedBy_fkey'
  ) THEN
    ALTER TABLE "ManualPaymentSubmission"
    ADD CONSTRAINT "ManualPaymentSubmission_verifiedBy_fkey"
    FOREIGN KEY ("verifiedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey: WithdrawalRequest.approvedById -> User.id
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'WithdrawalRequest_approvedById_fkey'
  ) THEN
    ALTER TABLE "WithdrawalRequest"
    ADD CONSTRAINT "WithdrawalRequest_approvedById_fkey"
    FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey: WithdrawalRequest.completedById -> User.id
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'WithdrawalRequest_completedById_fkey'
  ) THEN
    ALTER TABLE "WithdrawalRequest"
    ADD CONSTRAINT "WithdrawalRequest_completedById_fkey"
    FOREIGN KEY ("completedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey: WithdrawalRequest.rejectedById -> User.id
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'WithdrawalRequest_rejectedById_fkey'
  ) THEN
    ALTER TABLE "WithdrawalRequest"
    ADD CONSTRAINT "WithdrawalRequest_rejectedById_fkey"
    FOREIGN KEY ("rejectedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- CheckConstraint: Non-negative heldByDispute balance on Wallet
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Wallet_heldByDispute_non_negative'
  ) THEN
    ALTER TABLE "Wallet"
    ADD CONSTRAINT "Wallet_heldByDispute_non_negative"
    CHECK ("heldByDispute" >= 0);
  END IF;
END $$;

-- CheckConstraint: Non-negative availableBalance on Wallet
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Wallet_availableBalance_non_negative'
  ) THEN
    ALTER TABLE "Wallet"
    ADD CONSTRAINT "Wallet_availableBalance_non_negative"
    CHECK ("availableBalance" >= 0);
  END IF;
END $$;

-- CheckConstraint: Non-negative pendingBalance on Wallet
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Wallet_pendingBalance_non_negative'
  ) THEN
    ALTER TABLE "Wallet"
    ADD CONSTRAINT "Wallet_pendingBalance_non_negative"
    CHECK ("pendingBalance" >= 0);
  END IF;
END $$;
