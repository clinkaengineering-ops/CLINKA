BEGIN;

CREATE TEMP TABLE "TargetUsers" AS
SELECT id AS "userId"
FROM "User"
WHERE role = 'ENGINEER' AND (email ILIKE '%alashkam%' OR email ILIKE '%test%' OR email ILIKE '%upload%');

CREATE TEMP TABLE "TargetProfiles" AS
SELECT id AS "engineerId"
FROM "EngineerProfile"
WHERE "userId" IN (SELECT "userId" FROM "TargetUsers");

-- Delete from deepest dependencies first
DELETE FROM "ProfileSpecialization" WHERE "engineerId" IN (SELECT "engineerId" FROM "TargetProfiles");
DELETE FROM "ProfileSkill" WHERE "engineerId" IN (SELECT "engineerId" FROM "TargetProfiles");
DELETE FROM "ProfileServiceArea" WHERE "engineerId" IN (SELECT "engineerId" FROM "TargetProfiles");
DELETE FROM "ProfileLanguage" WHERE "engineerId" IN (SELECT "engineerId" FROM "TargetProfiles");
DELETE FROM "ProfileCertification" WHERE "engineerId" IN (SELECT "engineerId" FROM "TargetProfiles");

DELETE FROM "PortfolioProjectSkill" WHERE "portfolioProjectId" IN (SELECT id FROM "PortfolioItem" WHERE "engineerId" IN (SELECT "engineerId" FROM "TargetProfiles"));
DELETE FROM "PortfolioFile" WHERE "portfolioProjectId" IN (SELECT id FROM "PortfolioItem" WHERE "engineerId" IN (SELECT "engineerId" FROM "TargetProfiles"));
DELETE FROM "PortfolioItem" WHERE "engineerId" IN (SELECT "engineerId" FROM "TargetProfiles");

DELETE FROM "Bid" WHERE "engineerId" IN (SELECT "engineerId" FROM "TargetProfiles");

-- Delete Payment dependencies
DELETE FROM "PaymentLedgerEntry" WHERE "paymentId" IN (SELECT id FROM "Payment" WHERE "engineerId" IN (SELECT "engineerId" FROM "TargetProfiles") OR "clientId" IN (SELECT "userId" FROM "TargetUsers"));
DELETE FROM "ManualPaymentSubmission" WHERE "paymentId" IN (SELECT id FROM "Payment" WHERE "engineerId" IN (SELECT "engineerId" FROM "TargetProfiles") OR "clientId" IN (SELECT "userId" FROM "TargetUsers"));
DELETE FROM "Payment" WHERE "engineerId" IN (SELECT "engineerId" FROM "TargetProfiles") OR "clientId" IN (SELECT "userId" FROM "TargetUsers");

DELETE FROM "Review" WHERE "engineerId" IN (SELECT "engineerId" FROM "TargetProfiles") OR "clientId" IN (SELECT "userId" FROM "TargetUsers");

-- Delete Messages and Conversations
DELETE FROM "Message" WHERE "conversationId" IN (SELECT id FROM "Conversation" WHERE "clientId" IN (SELECT "userId" FROM "TargetUsers") OR "engineerId" IN (SELECT "userId" FROM "TargetUsers"));
DELETE FROM "Message" WHERE "senderId" IN (SELECT "userId" FROM "TargetUsers");
DELETE FROM "Conversation" WHERE "clientId" IN (SELECT "userId" FROM "TargetUsers") OR "engineerId" IN (SELECT "userId" FROM "TargetUsers");

-- Delete Project submissions and deliverables
DELETE FROM "ProjectDeliverable" WHERE "submissionId" IN (SELECT id FROM "ProjectSubmission" WHERE "engineerId" IN (SELECT "userId" FROM "TargetUsers"));
DELETE FROM "ProjectSubmission" WHERE "engineerId" IN (SELECT "userId" FROM "TargetUsers");

-- Project Invitation Events
DELETE FROM "InvitationEvent" WHERE "invitationId" IN (SELECT id FROM "ProjectInvitation" WHERE "engineerId" IN (SELECT "userId" FROM "TargetUsers") OR "clientId" IN (SELECT "userId" FROM "TargetUsers"));
DELETE FROM "ProjectInvitation" WHERE "engineerId" IN (SELECT "userId" FROM "TargetUsers") OR "clientId" IN (SELECT "userId" FROM "TargetUsers");

-- Wallet
DELETE FROM "WalletTransaction" WHERE "walletId" IN (SELECT id FROM "Wallet" WHERE "userId" IN (SELECT "userId" FROM "TargetUsers"));
DELETE FROM "Wallet" WHERE "userId" IN (SELECT "userId" FROM "TargetUsers");

-- PayoutAuditLog
DELETE FROM "PayoutAuditLog" WHERE "withdrawalId" IN (SELECT id FROM "WithdrawalRequest" WHERE "userId" IN (SELECT "userId" FROM "TargetUsers"));
DELETE FROM "WithdrawalRequest" WHERE "userId" IN (SELECT "userId" FROM "TargetUsers");

-- Miscellaneous
DELETE FROM "SystemAuditLog" WHERE "actorId" IN (SELECT "userId" FROM "TargetUsers");
DELETE FROM "Notification" WHERE "userId" IN (SELECT "userId" FROM "TargetUsers");
DELETE FROM "Ban" WHERE "userId" IN (SELECT "userId" FROM "TargetUsers");
DELETE FROM "SupportTicket" WHERE "userId" IN (SELECT "userId" FROM "TargetUsers") OR "resolvedById" IN (SELECT "userId" FROM "TargetUsers");
DELETE FROM "Dispute" WHERE "openedById" IN (SELECT "userId" FROM "TargetUsers") OR "resolvedById" IN (SELECT "userId" FROM "TargetUsers");

-- Project (just in case they were client)
DELETE FROM "Bid" WHERE "projectId" IN (SELECT id FROM "Project" WHERE "clientId" IN (SELECT "userId" FROM "TargetUsers"));
DELETE FROM "Project" WHERE "clientId" IN (SELECT "userId" FROM "TargetUsers");

-- Now delete the profiles and the user
DELETE FROM "EngineerProfile" WHERE "userId" IN (SELECT "userId" FROM "TargetUsers");
DELETE FROM "User" WHERE id IN (SELECT "userId" FROM "TargetUsers");

DROP TABLE "TargetUsers";
DROP TABLE "TargetProfiles";

COMMIT;
