-- Create UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

/*
  Warnings:

  - The primary key for the `Project` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "Ban" DROP CONSTRAINT "Ban_bannedById_fkey";

-- DropForeignKey
ALTER TABLE "Ban" DROP CONSTRAINT "Ban_userId_fkey";

-- DropForeignKey
ALTER TABLE "Bid" DROP CONSTRAINT "Bid_projectId_fkey";

-- DropForeignKey
ALTER TABLE "Conversation" DROP CONSTRAINT "Conversation_clientId_fkey";

-- DropForeignKey
ALTER TABLE "Conversation" DROP CONSTRAINT "Conversation_engineerId_fkey";

-- DropForeignKey
ALTER TABLE "Conversation" DROP CONSTRAINT "Conversation_projectId_fkey";

-- DropForeignKey
ALTER TABLE "Dispute" DROP CONSTRAINT "Dispute_openedById_fkey";

-- DropForeignKey
ALTER TABLE "Dispute" DROP CONSTRAINT "Dispute_projectId_fkey";

-- DropForeignKey
ALTER TABLE "Dispute" DROP CONSTRAINT "Dispute_resolvedById_fkey";

-- DropForeignKey
ALTER TABLE "EngineerProfile" DROP CONSTRAINT "EngineerProfile_userId_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_senderId_fkey";

-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_userId_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_clientId_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_projectId_fkey";

-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_clientId_fkey";

-- DropForeignKey
ALTER TABLE "ProjectInvitation" DROP CONSTRAINT "ProjectInvitation_clientId_fkey";

-- DropForeignKey
ALTER TABLE "ProjectInvitation" DROP CONSTRAINT "ProjectInvitation_engineerId_fkey";

-- DropForeignKey
ALTER TABLE "ProjectInvitation" DROP CONSTRAINT "ProjectInvitation_projectId_fkey";

-- DropForeignKey
ALTER TABLE "ProjectSubmission" DROP CONSTRAINT "ProjectSubmission_projectId_fkey";

-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_clientId_fkey";

-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_projectId_fkey";

-- DropForeignKey
ALTER TABLE "SupportTicket" DROP CONSTRAINT "SupportTicket_resolvedById_fkey";

-- DropForeignKey
ALTER TABLE "SupportTicket" DROP CONSTRAINT "SupportTicket_userId_fkey";

-- DropForeignKey
ALTER TABLE "SystemAuditLog" DROP CONSTRAINT "SystemAuditLog_actorId_fkey";

-- DropForeignKey
ALTER TABLE "Wallet" DROP CONSTRAINT "Wallet_userId_fkey";

-- DropForeignKey
ALTER TABLE "WithdrawalRequest" DROP CONSTRAINT "WithdrawalRequest_userId_fkey";

-- AlterTable
ALTER TABLE "Ban" ALTER COLUMN "userId" SET DATA TYPE TEXT USING uuid_generate_v5(uuid_ns_url(), 'user_' || "userId"::text)::text,
ALTER COLUMN "bannedById" SET DATA TYPE TEXT USING uuid_generate_v5(uuid_ns_url(), 'user_' || "bannedById"::text)::text;

-- AlterTable
ALTER TABLE "Bid" ALTER COLUMN "projectId" SET DATA TYPE TEXT USING uuid_generate_v5(uuid_ns_url(), 'project_' || "projectId"::text)::text;

-- AlterTable
ALTER TABLE "Conversation" ALTER COLUMN "projectId" SET DATA TYPE TEXT USING uuid_generate_v5(uuid_ns_url(), 'project_' || "projectId"::text)::text,
ALTER COLUMN "clientId" SET DATA TYPE TEXT USING uuid_generate_v5(uuid_ns_url(), 'user_' || "clientId"::text)::text,
ALTER COLUMN "engineerId" SET DATA TYPE TEXT USING uuid_generate_v5(uuid_ns_url(), 'user_' || "engineerId"::text)::text;

-- AlterTable
ALTER TABLE "Dispute" ALTER COLUMN "projectId" SET DATA TYPE TEXT USING uuid_generate_v5(uuid_ns_url(), 'project_' || "projectId"::text)::text,
ALTER COLUMN "openedById" SET DATA TYPE TEXT USING uuid_generate_v5(uuid_ns_url(), 'user_' || "openedById"::text)::text,
ALTER COLUMN "resolvedById" SET DATA TYPE TEXT USING uuid_generate_v5(uuid_ns_url(), 'user_' || "resolvedById"::text)::text;

-- AlterTable
ALTER TABLE "EngineerProfile" ALTER COLUMN "userId" SET DATA TYPE TEXT USING uuid_generate_v5(uuid_ns_url(), 'user_' || "userId"::text)::text;

-- AlterTable
ALTER TABLE "InvitationEvent" ALTER COLUMN "actorId" SET DATA TYPE TEXT USING uuid_generate_v5(uuid_ns_url(), 'user_' || "actorId"::text)::text;

-- AlterTable
ALTER TABLE "Message" ALTER COLUMN "senderId" SET DATA TYPE TEXT USING uuid_generate_v5(uuid_ns_url(), 'user_' || "senderId"::text)::text;

-- AlterTable
ALTER TABLE "Notification" ALTER COLUMN "userId" SET DATA TYPE TEXT USING uuid_generate_v5(uuid_ns_url(), 'user_' || "userId"::text)::text;

-- AlterTable
ALTER TABLE "Payment" ALTER COLUMN "projectId" SET DATA TYPE TEXT USING uuid_generate_v5(uuid_ns_url(), 'project_' || "projectId"::text)::text,
ALTER COLUMN "clientId" SET DATA TYPE TEXT USING uuid_generate_v5(uuid_ns_url(), 'user_' || "clientId"::text)::text;

-- AlterTable
ALTER TABLE "PayoutAuditLog" ALTER COLUMN "actorId" SET DATA TYPE TEXT USING uuid_generate_v5(uuid_ns_url(), 'user_' || "actorId"::text)::text;

-- AlterTable
ALTER TABLE "Project" DROP CONSTRAINT "Project_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT USING uuid_generate_v5(uuid_ns_url(), 'project_' || "id"::text)::text,
ALTER COLUMN "clientId" SET DATA TYPE TEXT USING uuid_generate_v5(uuid_ns_url(), 'user_' || "clientId"::text)::text,
ADD CONSTRAINT "Project_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Project_id_seq";

-- AlterTable
ALTER TABLE "ProjectInvitation" ALTER COLUMN "projectId" SET DATA TYPE TEXT USING uuid_generate_v5(uuid_ns_url(), 'project_' || "projectId"::text)::text,
ALTER COLUMN "engineerId" SET DATA TYPE TEXT USING uuid_generate_v5(uuid_ns_url(), 'user_' || "engineerId"::text)::text,
ALTER COLUMN "clientId" SET DATA TYPE TEXT USING uuid_generate_v5(uuid_ns_url(), 'user_' || "clientId"::text)::text;

-- AlterTable
ALTER TABLE "ProjectSubmission" ALTER COLUMN "projectId" SET DATA TYPE TEXT USING uuid_generate_v5(uuid_ns_url(), 'project_' || "projectId"::text)::text;

-- AlterTable
ALTER TABLE "Review" ALTER COLUMN "projectId" SET DATA TYPE TEXT USING uuid_generate_v5(uuid_ns_url(), 'project_' || "projectId"::text)::text,
ALTER COLUMN "clientId" SET DATA TYPE TEXT USING uuid_generate_v5(uuid_ns_url(), 'user_' || "clientId"::text)::text;

-- AlterTable
ALTER TABLE "SupportTicket" ALTER COLUMN "userId" SET DATA TYPE TEXT USING uuid_generate_v5(uuid_ns_url(), 'user_' || "userId"::text)::text,
ALTER COLUMN "resolvedById" SET DATA TYPE TEXT USING uuid_generate_v5(uuid_ns_url(), 'user_' || "resolvedById"::text)::text;

-- AlterTable
ALTER TABLE "SystemAuditLog" ALTER COLUMN "actorId" SET DATA TYPE TEXT USING uuid_generate_v5(uuid_ns_url(), 'user_' || "actorId"::text)::text;

-- AlterTable
ALTER TABLE "User" DROP CONSTRAINT "User_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT USING uuid_generate_v5(uuid_ns_url(), 'user_' || "id"::text)::text,
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "User_id_seq";

-- AlterTable
ALTER TABLE "Wallet" ALTER COLUMN "userId" SET DATA TYPE TEXT USING uuid_generate_v5(uuid_ns_url(), 'user_' || "userId"::text)::text;

-- AlterTable
ALTER TABLE "WithdrawalRequest" ALTER COLUMN "userId" SET DATA TYPE TEXT USING uuid_generate_v5(uuid_ns_url(), 'user_' || "userId"::text)::text;

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
