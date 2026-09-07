-- Drop foreign keys first to allow type changes
ALTER TABLE "WithdrawalRequest" DROP CONSTRAINT IF EXISTS "WithdrawalRequest_approvedById_fkey";
ALTER TABLE "WithdrawalRequest" DROP CONSTRAINT IF EXISTS "WithdrawalRequest_completedById_fkey";
ALTER TABLE "WithdrawalRequest" DROP CONSTRAINT IF EXISTS "WithdrawalRequest_rejectedById_fkey";

CREATE OR REPLACE FUNCTION pg_temp.to_user_uuid(val text) RETURNS text AS $$
  SELECT CASE
    WHEN val IS NULL OR btrim(val) = '' THEN NULL
    WHEN btrim(val) ~ '^[0-9]+$' THEN uuid_generate_v5(uuid_ns_url(), 'user_' || btrim(val))::text
    ELSE btrim(val)
  END;
$$ LANGUAGE sql;

-- Alter the columns (idempotent: keep already-UUID values)
ALTER TABLE "WithdrawalRequest" ALTER COLUMN "approvedById" SET DATA TYPE TEXT USING pg_temp.to_user_uuid("approvedById"::text);
ALTER TABLE "WithdrawalRequest" ALTER COLUMN "completedById" SET DATA TYPE TEXT USING pg_temp.to_user_uuid("completedById"::text);
ALTER TABLE "WithdrawalRequest" ALTER COLUMN "rejectedById" SET DATA TYPE TEXT USING pg_temp.to_user_uuid("rejectedById"::text);

UPDATE "WithdrawalRequest" SET "approvedById" = NULL
WHERE "approvedById" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "User" u WHERE u."id" = "WithdrawalRequest"."approvedById");
UPDATE "WithdrawalRequest" SET "completedById" = NULL
WHERE "completedById" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "User" u WHERE u."id" = "WithdrawalRequest"."completedById");
UPDATE "WithdrawalRequest" SET "rejectedById" = NULL
WHERE "rejectedById" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "User" u WHERE u."id" = "WithdrawalRequest"."rejectedById");

-- Re-add foreign keys
ALTER TABLE "WithdrawalRequest" ADD CONSTRAINT "WithdrawalRequest_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WithdrawalRequest" ADD CONSTRAINT "WithdrawalRequest_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WithdrawalRequest" ADD CONSTRAINT "WithdrawalRequest_rejectedById_fkey" FOREIGN KEY ("rejectedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Extra drift sync
ALTER TABLE "ManualPaymentSubmission" DROP CONSTRAINT IF EXISTS "ManualPaymentSubmission_verifiedBy_fkey";
ALTER TABLE "ManualPaymentSubmission" ALTER COLUMN "verifiedBy" SET DATA TYPE TEXT USING pg_temp.to_user_uuid("verifiedBy"::text);
UPDATE "ManualPaymentSubmission" SET "verifiedBy" = NULL
WHERE "verifiedBy" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "User" u WHERE u."id" = "ManualPaymentSubmission"."verifiedBy");
ALTER TABLE "ManualPaymentSubmission" ADD CONSTRAINT "ManualPaymentSubmission_verifiedBy_fkey" FOREIGN KEY ("verifiedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "User" DROP COLUMN IF EXISTS "expoPushToken";
