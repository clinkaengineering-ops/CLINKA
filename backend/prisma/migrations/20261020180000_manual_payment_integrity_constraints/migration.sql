-- Create partial unique index to enforce at most one VERIFIED manual payment submission per payment
CREATE UNIQUE INDEX IF NOT EXISTS "ManualPaymentSubmission_paymentId_verified_unique"
ON "ManualPaymentSubmission"("paymentId")
WHERE "status" = 'VERIFIED';

-- Create partial unique index to enforce at most one PENDING manual payment submission per payment
CREATE UNIQUE INDEX IF NOT EXISTS "ManualPaymentSubmission_paymentId_pending_unique"
ON "ManualPaymentSubmission"("paymentId")
WHERE "status" = 'PENDING';

-- Create partial unique index to prevent duplicate FUNDED ledger entries for the same payment
CREATE UNIQUE INDEX IF NOT EXISTS "PaymentLedgerEntry_paymentId_funded_unique"
ON "PaymentLedgerEntry"("paymentId")
WHERE "type" = 'FUNDED';

-- Create index on paymentId for PaymentLedgerEntry
CREATE INDEX IF NOT EXISTS "PaymentLedgerEntry_paymentId_idx"
ON "PaymentLedgerEntry"("paymentId");

-- Create index on (paymentId, status) for ManualPaymentSubmission
CREATE INDEX IF NOT EXISTS "ManualPaymentSubmission_paymentId_status_idx"
ON "ManualPaymentSubmission"("paymentId", "status");
