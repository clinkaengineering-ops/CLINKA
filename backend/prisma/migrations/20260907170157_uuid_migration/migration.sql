-- Create UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Idempotent converters: numeric ids → deterministic UUIDs; already-UUID text kept as-is.
-- This survives partial / retried applies where some columns were already converted.
CREATE OR REPLACE FUNCTION pg_temp.to_user_uuid(val text) RETURNS text AS $$
  SELECT CASE
    WHEN val IS NULL OR btrim(val) = '' THEN NULL
    WHEN btrim(val) ~ '^[0-9]+$' THEN uuid_generate_v5(uuid_ns_url(), 'user_' || btrim(val))::text
    ELSE btrim(val)
  END;
$$ LANGUAGE sql;

CREATE OR REPLACE FUNCTION pg_temp.to_project_uuid(val text) RETURNS text AS $$
  SELECT CASE
    WHEN val IS NULL OR btrim(val) = '' THEN NULL
    WHEN btrim(val) ~ '^[0-9]+$' THEN uuid_generate_v5(uuid_ns_url(), 'project_' || btrim(val))::text
    ELSE btrim(val)
  END;
$$ LANGUAGE sql;

/*
  Warnings:

  - The primary key for the `Project` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "Ban" DROP CONSTRAINT IF EXISTS "Ban_bannedById_fkey";

-- DropForeignKey
ALTER TABLE "Ban" DROP CONSTRAINT IF EXISTS "Ban_userId_fkey";

-- DropForeignKey
ALTER TABLE "Bid" DROP CONSTRAINT IF EXISTS "Bid_projectId_fkey";

-- DropForeignKey
ALTER TABLE "Conversation" DROP CONSTRAINT IF EXISTS "Conversation_clientId_fkey";

-- DropForeignKey
ALTER TABLE "Conversation" DROP CONSTRAINT IF EXISTS "Conversation_engineerId_fkey";

-- DropForeignKey
ALTER TABLE "Conversation" DROP CONSTRAINT IF EXISTS "Conversation_projectId_fkey";

-- DropForeignKey
ALTER TABLE "Dispute" DROP CONSTRAINT IF EXISTS "Dispute_openedById_fkey";

-- DropForeignKey
ALTER TABLE "Dispute" DROP CONSTRAINT IF EXISTS "Dispute_projectId_fkey";

-- DropForeignKey
ALTER TABLE "Dispute" DROP CONSTRAINT IF EXISTS "Dispute_resolvedById_fkey";

-- DropForeignKey
ALTER TABLE "EngineerProfile" DROP CONSTRAINT IF EXISTS "EngineerProfile_userId_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT IF EXISTS "Message_senderId_fkey";

-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT IF EXISTS "Notification_userId_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT IF EXISTS "Payment_clientId_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT IF EXISTS "Payment_projectId_fkey";

-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT IF EXISTS "Project_clientId_fkey";

-- DropForeignKey
ALTER TABLE "ProjectInvitation" DROP CONSTRAINT IF EXISTS "ProjectInvitation_clientId_fkey";

-- DropForeignKey
ALTER TABLE "ProjectInvitation" DROP CONSTRAINT IF EXISTS "ProjectInvitation_engineerId_fkey";

-- DropForeignKey
ALTER TABLE "ProjectInvitation" DROP CONSTRAINT IF EXISTS "ProjectInvitation_projectId_fkey";

-- DropForeignKey
ALTER TABLE "ProjectSubmission" DROP CONSTRAINT IF EXISTS "ProjectSubmission_projectId_fkey";

-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT IF EXISTS "Review_clientId_fkey";

-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT IF EXISTS "Review_projectId_fkey";

-- DropForeignKey
ALTER TABLE "SupportTicket" DROP CONSTRAINT IF EXISTS "SupportTicket_resolvedById_fkey";

-- DropForeignKey
ALTER TABLE "SupportTicket" DROP CONSTRAINT IF EXISTS "SupportTicket_userId_fkey";

-- DropForeignKey
ALTER TABLE "SystemAuditLog" DROP CONSTRAINT IF EXISTS "SystemAuditLog_actorId_fkey";

-- DropForeignKey
ALTER TABLE "Wallet" DROP CONSTRAINT IF EXISTS "Wallet_userId_fkey";

-- DropForeignKey
ALTER TABLE "WithdrawalRequest" DROP CONSTRAINT IF EXISTS "WithdrawalRequest_userId_fkey";

-- AlterTable
ALTER TABLE "Ban" ALTER COLUMN "userId" SET DATA TYPE TEXT USING pg_temp.to_user_uuid("userId"::text),
ALTER COLUMN "bannedById" SET DATA TYPE TEXT USING pg_temp.to_user_uuid("bannedById"::text);

-- AlterTable
ALTER TABLE "Bid" ALTER COLUMN "projectId" SET DATA TYPE TEXT USING pg_temp.to_project_uuid("projectId"::text);

-- AlterTable
ALTER TABLE "Conversation" ALTER COLUMN "projectId" SET DATA TYPE TEXT USING pg_temp.to_project_uuid("projectId"::text),
ALTER COLUMN "clientId" SET DATA TYPE TEXT USING pg_temp.to_user_uuid("clientId"::text),
ALTER COLUMN "engineerId" SET DATA TYPE TEXT USING pg_temp.to_user_uuid("engineerId"::text);

-- AlterTable
ALTER TABLE "Dispute" ALTER COLUMN "projectId" SET DATA TYPE TEXT USING pg_temp.to_project_uuid("projectId"::text),
ALTER COLUMN "openedById" SET DATA TYPE TEXT USING pg_temp.to_user_uuid("openedById"::text),
ALTER COLUMN "resolvedById" SET DATA TYPE TEXT USING pg_temp.to_user_uuid("resolvedById"::text);

-- AlterTable
ALTER TABLE "EngineerProfile" ALTER COLUMN "userId" SET DATA TYPE TEXT USING pg_temp.to_user_uuid("userId"::text);

-- AlterTable
ALTER TABLE "InvitationEvent" ALTER COLUMN "actorId" SET DATA TYPE TEXT USING pg_temp.to_user_uuid("actorId"::text);

-- AlterTable
ALTER TABLE "Message" ALTER COLUMN "senderId" SET DATA TYPE TEXT USING pg_temp.to_user_uuid("senderId"::text);

-- AlterTable
ALTER TABLE "Notification" ALTER COLUMN "userId" SET DATA TYPE TEXT USING pg_temp.to_user_uuid("userId"::text);

-- AlterTable
ALTER TABLE "Payment" ALTER COLUMN "projectId" SET DATA TYPE TEXT USING pg_temp.to_project_uuid("projectId"::text),
ALTER COLUMN "clientId" SET DATA TYPE TEXT USING pg_temp.to_user_uuid("clientId"::text);

-- AlterTable
ALTER TABLE "PayoutAuditLog" ALTER COLUMN "actorId" SET DATA TYPE TEXT USING pg_temp.to_user_uuid("actorId"::text);

-- AlterTable
ALTER TABLE "Project" DROP CONSTRAINT IF EXISTS "Project_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT USING pg_temp.to_project_uuid("id"::text),
ALTER COLUMN "clientId" SET DATA TYPE TEXT USING pg_temp.to_user_uuid("clientId"::text),
ADD CONSTRAINT "Project_pkey" PRIMARY KEY ("id");
-- Sequence may already be gone after DROP DEFAULT / type change on a serial column
DROP SEQUENCE IF EXISTS "Project_id_seq";

-- AlterTable
ALTER TABLE "ProjectInvitation" ALTER COLUMN "projectId" SET DATA TYPE TEXT USING pg_temp.to_project_uuid("projectId"::text),
ALTER COLUMN "engineerId" SET DATA TYPE TEXT USING pg_temp.to_user_uuid("engineerId"::text),
ALTER COLUMN "clientId" SET DATA TYPE TEXT USING pg_temp.to_user_uuid("clientId"::text);

-- AlterTable
ALTER TABLE "ProjectSubmission" ALTER COLUMN "projectId" SET DATA TYPE TEXT USING pg_temp.to_project_uuid("projectId"::text);

-- AlterTable
ALTER TABLE "Review" ALTER COLUMN "projectId" SET DATA TYPE TEXT USING pg_temp.to_project_uuid("projectId"::text),
ALTER COLUMN "clientId" SET DATA TYPE TEXT USING pg_temp.to_user_uuid("clientId"::text);

-- AlterTable
ALTER TABLE "SupportTicket" ALTER COLUMN "userId" SET DATA TYPE TEXT USING pg_temp.to_user_uuid("userId"::text),
ALTER COLUMN "resolvedById" SET DATA TYPE TEXT USING pg_temp.to_user_uuid("resolvedById"::text);

-- AlterTable
ALTER TABLE "SystemAuditLog" ALTER COLUMN "actorId" SET DATA TYPE TEXT USING pg_temp.to_user_uuid("actorId"::text);

-- AlterTable
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT USING pg_temp.to_user_uuid("id"::text),
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");
-- Sequence may already be gone after DROP DEFAULT / type change on a serial column
DROP SEQUENCE IF EXISTS "User_id_seq";

-- AlterTable
ALTER TABLE "Wallet" ALTER COLUMN "userId" SET DATA TYPE TEXT USING pg_temp.to_user_uuid("userId"::text);

-- AlterTable
ALTER TABLE "WithdrawalRequest" ALTER COLUMN "userId" SET DATA TYPE TEXT USING pg_temp.to_user_uuid("userId"::text);

-- Orphan cleanup so FK re-adds succeed on historically inconsistent rows
DELETE FROM "Ban" b WHERE NOT EXISTS (SELECT 1 FROM "User" u WHERE u."id" = b."userId");
UPDATE "Ban" SET "bannedById" = NULL
WHERE "bannedById" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "User" u WHERE u."id" = "Ban"."bannedById");

DELETE FROM "EngineerProfile" e WHERE NOT EXISTS (SELECT 1 FROM "User" u WHERE u."id" = e."userId");

DELETE FROM "Bid" b WHERE NOT EXISTS (SELECT 1 FROM "Project" p WHERE p."id" = b."projectId");
DELETE FROM "Payment" pay WHERE NOT EXISTS (SELECT 1 FROM "Project" p WHERE p."id" = pay."projectId");
DELETE FROM "Payment" pay WHERE NOT EXISTS (SELECT 1 FROM "User" u WHERE u."id" = pay."clientId");
DELETE FROM "ProjectSubmission" ps WHERE NOT EXISTS (SELECT 1 FROM "Project" p WHERE p."id" = ps."projectId");
DELETE FROM "Notification" n WHERE NOT EXISTS (SELECT 1 FROM "User" u WHERE u."id" = n."userId");
DELETE FROM "Review" r WHERE NOT EXISTS (SELECT 1 FROM "Project" p WHERE p."id" = r."projectId");
DELETE FROM "Review" r WHERE NOT EXISTS (SELECT 1 FROM "User" u WHERE u."id" = r."clientId");

DELETE FROM "PayoutAuditLog" pal
WHERE EXISTS (
  SELECT 1 FROM "WithdrawalRequest" wr
  WHERE wr."id" = pal."withdrawalId"
    AND NOT EXISTS (SELECT 1 FROM "User" u WHERE u."id" = wr."userId")
);
DELETE FROM "WithdrawalRequest" wr WHERE NOT EXISTS (SELECT 1 FROM "User" u WHERE u."id" = wr."userId");

DELETE FROM "WalletTransaction" wt
WHERE EXISTS (
  SELECT 1 FROM "Wallet" w
  WHERE w."id" = wt."walletId"
    AND NOT EXISTS (SELECT 1 FROM "User" u WHERE u."id" = w."userId")
);
DELETE FROM "Wallet" w WHERE NOT EXISTS (SELECT 1 FROM "User" u WHERE u."id" = w."userId");

DELETE FROM "InvitationEvent" ie
WHERE EXISTS (
  SELECT 1 FROM "ProjectInvitation" pi
  WHERE pi."id" = ie."invitationId"
    AND (
      NOT EXISTS (SELECT 1 FROM "Project" p WHERE p."id" = pi."projectId")
      OR NOT EXISTS (SELECT 1 FROM "User" u WHERE u."id" = pi."engineerId")
      OR NOT EXISTS (SELECT 1 FROM "User" u WHERE u."id" = pi."clientId")
    )
);
DELETE FROM "ProjectInvitation" pi WHERE NOT EXISTS (SELECT 1 FROM "Project" p WHERE p."id" = pi."projectId");
DELETE FROM "ProjectInvitation" pi WHERE NOT EXISTS (SELECT 1 FROM "User" u WHERE u."id" = pi."engineerId");
DELETE FROM "ProjectInvitation" pi WHERE NOT EXISTS (SELECT 1 FROM "User" u WHERE u."id" = pi."clientId");

DELETE FROM "Dispute" d WHERE NOT EXISTS (SELECT 1 FROM "Project" p WHERE p."id" = d."projectId");
DELETE FROM "Dispute" d WHERE NOT EXISTS (SELECT 1 FROM "User" u WHERE u."id" = d."openedById");
UPDATE "Dispute" SET "resolvedById" = NULL
WHERE "resolvedById" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "User" u WHERE u."id" = "Dispute"."resolvedById");

UPDATE "Conversation" SET "projectId" = NULL
WHERE "projectId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "Project" p WHERE p."id" = "Conversation"."projectId");

DELETE FROM "Message" m WHERE NOT EXISTS (SELECT 1 FROM "User" u WHERE u."id" = m."senderId");
DELETE FROM "Message" m
WHERE EXISTS (
  SELECT 1 FROM "Conversation" c
  WHERE c."id" = m."conversationId"
    AND (
      NOT EXISTS (SELECT 1 FROM "User" u WHERE u."id" = c."clientId")
      OR NOT EXISTS (SELECT 1 FROM "User" u WHERE u."id" = c."engineerId")
    )
);
DELETE FROM "Conversation" c WHERE NOT EXISTS (SELECT 1 FROM "User" u WHERE u."id" = c."clientId");
DELETE FROM "Conversation" c WHERE NOT EXISTS (SELECT 1 FROM "User" u WHERE u."id" = c."engineerId");

-- Projects whose client no longer exists: remove dependents, then the project
DELETE FROM "Bid" b
WHERE EXISTS (
  SELECT 1 FROM "Project" p
  WHERE p."id" = b."projectId"
    AND NOT EXISTS (SELECT 1 FROM "User" u WHERE u."id" = p."clientId")
);
DELETE FROM "Payment" pay
WHERE EXISTS (
  SELECT 1 FROM "Project" p
  WHERE p."id" = pay."projectId"
    AND NOT EXISTS (SELECT 1 FROM "User" u WHERE u."id" = p."clientId")
);
DELETE FROM "ProjectSubmission" ps
WHERE EXISTS (
  SELECT 1 FROM "Project" p
  WHERE p."id" = ps."projectId"
    AND NOT EXISTS (SELECT 1 FROM "User" u WHERE u."id" = p."clientId")
);
DELETE FROM "Review" r
WHERE EXISTS (
  SELECT 1 FROM "Project" p
  WHERE p."id" = r."projectId"
    AND NOT EXISTS (SELECT 1 FROM "User" u WHERE u."id" = p."clientId")
);
DELETE FROM "Dispute" d
WHERE EXISTS (
  SELECT 1 FROM "Project" p
  WHERE p."id" = d."projectId"
    AND NOT EXISTS (SELECT 1 FROM "User" u WHERE u."id" = p."clientId")
);
DELETE FROM "InvitationEvent" ie
WHERE EXISTS (
  SELECT 1 FROM "ProjectInvitation" pi
  JOIN "Project" p ON p."id" = pi."projectId"
  WHERE pi."id" = ie."invitationId"
    AND NOT EXISTS (SELECT 1 FROM "User" u WHERE u."id" = p."clientId")
);
DELETE FROM "ProjectInvitation" pi
WHERE EXISTS (
  SELECT 1 FROM "Project" p
  WHERE p."id" = pi."projectId"
    AND NOT EXISTS (SELECT 1 FROM "User" u WHERE u."id" = p."clientId")
);
UPDATE "Conversation" SET "projectId" = NULL
WHERE EXISTS (
  SELECT 1 FROM "Project" p
  WHERE p."id" = "Conversation"."projectId"
    AND NOT EXISTS (SELECT 1 FROM "User" u WHERE u."id" = p."clientId")
);
DELETE FROM "Project" p WHERE NOT EXISTS (SELECT 1 FROM "User" u WHERE u."id" = p."clientId");

UPDATE "SupportTicket" SET "userId" = NULL
WHERE "userId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "User" u WHERE u."id" = "SupportTicket"."userId");
UPDATE "SupportTicket" SET "resolvedById" = NULL
WHERE "resolvedById" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "User" u WHERE u."id" = "SupportTicket"."resolvedById");
UPDATE "SystemAuditLog" SET "actorId" = NULL
WHERE "actorId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "User" u WHERE u."id" = "SystemAuditLog"."actorId");

-- AddForeignKey
ALTER TABLE "Ban" ADD CONSTRAINT "Ban_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ban" ADD CONSTRAINT "Ban_bannedById_fkey" FOREIGN KEY ("bannedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EngineerProfile" ADD CONSTRAINT "EngineerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectSubmission" ADD CONSTRAINT "ProjectSubmission_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_engineerId_fkey" FOREIGN KEY ("engineerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WithdrawalRequest" ADD CONSTRAINT "WithdrawalRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectInvitation" ADD CONSTRAINT "ProjectInvitation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectInvitation" ADD CONSTRAINT "ProjectInvitation_engineerId_fkey" FOREIGN KEY ("engineerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectInvitation" ADD CONSTRAINT "ProjectInvitation_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemAuditLog" ADD CONSTRAINT "SystemAuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_openedById_fkey" FOREIGN KEY ("openedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
