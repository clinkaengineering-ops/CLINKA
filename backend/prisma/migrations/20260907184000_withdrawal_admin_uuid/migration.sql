-- Drop foreign keys first to allow type changes
ALTER TABLE "WithdrawalRequest" DROP CONSTRAINT IF EXISTS "WithdrawalRequest_approvedById_fkey";
ALTER TABLE "WithdrawalRequest" DROP CONSTRAINT IF EXISTS "WithdrawalRequest_completedById_fkey";
ALTER TABLE "WithdrawalRequest" DROP CONSTRAINT IF EXISTS "WithdrawalRequest_rejectedById_fkey";

-- Alter the columns
ALTER TABLE "WithdrawalRequest" ALTER COLUMN "approvedById" SET DATA TYPE TEXT USING uuid_generate_v5(uuid_ns_url(), 'user_' || "approvedById"::text)::text;
ALTER TABLE "WithdrawalRequest" ALTER COLUMN "completedById" SET DATA TYPE TEXT USING uuid_generate_v5(uuid_ns_url(), 'user_' || "completedById"::text)::text;
ALTER TABLE "WithdrawalRequest" ALTER COLUMN "rejectedById" SET DATA TYPE TEXT USING uuid_generate_v5(uuid_ns_url(), 'user_' || "rejectedById"::text)::text;

-- Re-add foreign keys
ALTER TABLE "WithdrawalRequest" ADD CONSTRAINT "WithdrawalRequest_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WithdrawalRequest" ADD CONSTRAINT "WithdrawalRequest_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WithdrawalRequest" ADD CONSTRAINT "WithdrawalRequest_rejectedById_fkey" FOREIGN KEY ("rejectedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- Extra drift sync
ALTER TABLE "ManualPaymentSubmission" DROP CONSTRAINT IF EXISTS "ManualPaymentSubmission_verifiedBy_fkey";
ALTER TABLE "ManualPaymentSubmission" ALTER COLUMN "verifiedBy" SET DATA TYPE TEXT USING uuid_generate_v5(uuid_ns_url(), 'user_' || "verifiedBy"::text)::text;
ALTER TABLE "ManualPaymentSubmission" ADD CONSTRAINT "ManualPaymentSubmission_verifiedBy_fkey" FOREIGN KEY ("verifiedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "User" DROP COLUMN IF EXISTS "expoPushToken";
