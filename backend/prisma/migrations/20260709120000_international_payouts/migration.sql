-- International payout support
CREATE TYPE "PayoutType" AS ENUM ('EGYPTIAN_PAYMOB', 'INTERNATIONAL_IBAN');

ALTER TABLE "WithdrawalRequest"
  ADD COLUMN "payoutType" "PayoutType" NOT NULL DEFAULT 'EGYPTIAN_PAYMOB',
  ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'USD',
  ADD COLUMN "country" TEXT,
  ADD COLUMN "bankName" TEXT,
  ADD COLUMN "accountHolderName" TEXT,
  ADD COLUMN "ibanEncrypted" TEXT,
  ADD COLUMN "swiftBic" TEXT,
  ADD COLUMN "bankAddress" TEXT;

CREATE INDEX "WithdrawalRequest_payoutType_idx" ON "WithdrawalRequest"("payoutType");

UPDATE "WithdrawalRequest"
SET "payoutType" = 'EGYPTIAN_PAYMOB'
WHERE "paymobClientReference" IS NOT NULL OR "balanceHeldAt" IS NOT NULL;
