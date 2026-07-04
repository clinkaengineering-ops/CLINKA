-- AlterTable
ALTER TABLE "EngineerProfile" ADD COLUMN IF NOT EXISTS "nationalId" TEXT;

-- AlterTable
ALTER TABLE "WithdrawalRequest" ADD COLUMN IF NOT EXISTS "paymobTransactionId" TEXT;
ALTER TABLE "WithdrawalRequest" ADD COLUMN IF NOT EXISTS "paymobDisbursementStatus" TEXT;
ALTER TABLE "WithdrawalRequest" ADD COLUMN IF NOT EXISTS "paymobStatusDescription" TEXT;
ALTER TABLE "WithdrawalRequest" ADD COLUMN IF NOT EXISTS "paymobClientReference" TEXT;
