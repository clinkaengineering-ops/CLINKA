/*
  Warnings:

  - You are about to alter the column `price` on the `Bid` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(18,2)`.
  - You are about to alter the column `amount` on the `Payment` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(18,2)`.
  - You are about to alter the column `commission` on the `Payment` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(18,2)`.
  - You are about to alter the column `amount` on the `PaymentLedgerEntry` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(18,2)`.
  - You are about to alter the column `platformFeePercent` on the `PlatformSettings` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(18,2)`.
  - You are about to alter the column `budget` on the `Project` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(18,2)`.
  - You are about to alter the column `availableBalance` on the `Wallet` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(18,2)`.
  - You are about to alter the column `pendingBalance` on the `Wallet` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(18,2)`.
  - You are about to alter the column `amount` on the `WalletTransaction` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(18,2)`.
  - You are about to alter the column `amount` on the `WithdrawalRequest` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(18,2)`.
  - A unique constraint covering the columns `[invitationId]` on the table `Conversation` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `EngineerProfile` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "AvailabilityStatus" AS ENUM ('AVAILABLE_NOW', 'OPEN_TO_WORK', 'AVAILABLE_NEXT_WEEK', 'AVAILABLE_NEXT_MONTH', 'UNAVAILABLE');

-- CreateEnum
CREATE TYPE "PortfolioProjectStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PortfolioFileType" AS ENUM ('IMAGE', 'PDF', 'LINK');

-- CreateEnum
CREATE TYPE "ProfileVisibility" AS ENUM ('PUBLIC', 'PRIVATE', 'HIDDEN');

-- CreateEnum
CREATE TYPE "VerificationLevel" AS ENUM ('BASIC', 'COMPLETE', 'VERIFIED', 'TOP_ENGINEER');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InvitationEventType" AS ENUM ('SENT', 'VIEWED', 'ACCEPTED', 'DECLINED', 'CANCELLED', 'EXPIRED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ProjectStatus" ADD VALUE 'CLOSED';
ALTER TYPE "ProjectStatus" ADD VALUE 'AWAITING_PAYMENT';

-- DropForeignKey
ALTER TABLE "Conversation" DROP CONSTRAINT "Conversation_projectId_fkey";

-- DropIndex
DROP INDEX "WithdrawalRequest_payoutType_idx";

-- AlterTable
ALTER TABLE "Bid" ALTER COLUMN "price" SET DATA TYPE DECIMAL(18,2);

-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "invitationId" INTEGER,
ALTER COLUMN "projectId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "EngineerProfile" ADD COLUMN     "about" TEXT,
ADD COLUMN     "acceptsConsultations" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "acceptsDirectMessages" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "acceptsInvitations" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "availabilityStatus" "AvailabilityStatus",
ADD COLUMN     "coverBannerUrl" TEXT,
ADD COLUMN     "currentCompany" TEXT,
ADD COLUMN     "currentPosition" TEXT,
ADD COLUMN     "expectedStartDate" TIMESTAMP(3),
ADD COLUMN     "hourlyRateUSD" DECIMAL(18,2),
ADD COLUMN     "linkedinUrl" TEXT,
ADD COLUMN     "professionalHeadline" TEXT,
ADD COLUMN     "profileCompletion" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "profileVisibility" "ProfileVisibility" NOT NULL DEFAULT 'PUBLIC',
ADD COLUMN     "slug" TEXT,
ADD COLUMN     "startingProjectPriceUSD" DECIMAL(18,2),
ADD COLUMN     "verificationLevel" "VerificationLevel" NOT NULL DEFAULT 'BASIC',
ADD COLUMN     "websiteUrl" TEXT,
ADD COLUMN     "yearsOfExperience" INTEGER;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "amountEgp" DECIMAL(18,2),
ADD COLUMN     "exchangeProvider" TEXT,
ADD COLUMN     "exchangeRate" DECIMAL(18,6),
ADD COLUMN     "invitationId" INTEGER,
ADD COLUMN     "providerTimestamp" TIMESTAMP(3),
ADD COLUMN     "rateFetchedAt" TIMESTAMP(3),
ALTER COLUMN "amount" SET DATA TYPE DECIMAL(18,2),
ALTER COLUMN "commission" SET DATA TYPE DECIMAL(18,2);

-- AlterTable
ALTER TABLE "PaymentLedgerEntry" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(18,2);

-- AlterTable
ALTER TABLE "PlatformSettings" ALTER COLUMN "platformFeePercent" SET DATA TYPE DECIMAL(18,2);

-- AlterTable
ALTER TABLE "PortfolioItem" ADD COLUMN     "clientName" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "disciplineId" INTEGER,
ADD COLUMN     "status" "PortfolioProjectStatus" NOT NULL DEFAULT 'PUBLISHED',
ADD COLUMN     "title" TEXT,
ADD COLUMN     "year" INTEGER,
ALTER COLUMN "imageUrl" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Project" ALTER COLUMN "budget" SET DATA TYPE DECIMAL(18,2);

-- AlterTable
ALTER TABLE "Wallet" ALTER COLUMN "availableBalance" SET DATA TYPE DECIMAL(18,2),
ALTER COLUMN "pendingBalance" SET DATA TYPE DECIMAL(18,2);

-- AlterTable
ALTER TABLE "WalletTransaction" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(18,2);

-- AlterTable
ALTER TABLE "WithdrawalRequest" ADD COLUMN     "retryCount" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "amount" SET DATA TYPE DECIMAL(18,2);

-- CreateTable
CREATE TABLE "ExchangeRateCache" (
    "id" TEXT NOT NULL DEFAULT 'USD_EGP',
    "base" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "rate" DECIMAL(18,6) NOT NULL,
    "provider" TEXT NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExchangeRateCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectInvitation" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "engineerId" INTEGER NOT NULL,
    "clientId" INTEGER NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvitationEvent" (
    "id" SERIAL NOT NULL,
    "invitationId" INTEGER NOT NULL,
    "event" "InvitationEventType" NOT NULL,
    "actorId" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvitationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Discipline" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Discipline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Specialization" (
    "id" SERIAL NOT NULL,
    "disciplineId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Specialization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillCategory" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SkillCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Skill" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "categoryId" INTEGER,
    "isOfficial" BOOLEAN NOT NULL DEFAULT false,
    "popularity" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceArea" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "ServiceArea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Language" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,

    CONSTRAINT "Language_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Certification" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "issuingOrganization" TEXT,
    "isOfficial" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Certification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfileSpecialization" (
    "engineerId" INTEGER NOT NULL,
    "specializationId" INTEGER NOT NULL,

    CONSTRAINT "ProfileSpecialization_pkey" PRIMARY KEY ("engineerId","specializationId")
);

-- CreateTable
CREATE TABLE "ProfileSkill" (
    "engineerId" INTEGER NOT NULL,
    "skillId" INTEGER NOT NULL,

    CONSTRAINT "ProfileSkill_pkey" PRIMARY KEY ("engineerId","skillId")
);

-- CreateTable
CREATE TABLE "ProfileServiceArea" (
    "engineerId" INTEGER NOT NULL,
    "serviceAreaId" INTEGER NOT NULL,

    CONSTRAINT "ProfileServiceArea_pkey" PRIMARY KEY ("engineerId","serviceAreaId")
);

-- CreateTable
CREATE TABLE "ProfileLanguage" (
    "engineerId" INTEGER NOT NULL,
    "languageId" INTEGER NOT NULL,
    "proficiency" TEXT,

    CONSTRAINT "ProfileLanguage_pkey" PRIMARY KEY ("engineerId","languageId")
);

-- CreateTable
CREATE TABLE "ProfileCertification" (
    "id" SERIAL NOT NULL,
    "engineerId" INTEGER NOT NULL,
    "certificationId" INTEGER NOT NULL,
    "year" INTEGER,

    CONSTRAINT "ProfileCertification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortfolioProjectSkill" (
    "portfolioProjectId" INTEGER NOT NULL,
    "skillId" INTEGER NOT NULL,

    CONSTRAINT "PortfolioProjectSkill_pkey" PRIMARY KEY ("portfolioProjectId","skillId")
);

-- CreateTable
CREATE TABLE "PortfolioFile" (
    "id" SERIAL NOT NULL,
    "portfolioProjectId" INTEGER NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" "PortfolioFileType" NOT NULL DEFAULT 'IMAGE',
    "title" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PortfolioFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfileAnalytics" (
    "engineerId" INTEGER NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "searchImpressions" INTEGER NOT NULL DEFAULT 0,
    "invitations" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProfileAnalytics_pkey" PRIMARY KEY ("engineerId")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExchangeRateCache_base_target_key" ON "ExchangeRateCache"("base", "target");

-- CreateIndex
CREATE INDEX "ProjectInvitation_projectId_status_idx" ON "ProjectInvitation"("projectId", "status");

-- CreateIndex
CREATE INDEX "ProjectInvitation_engineerId_status_idx" ON "ProjectInvitation"("engineerId", "status");

-- CreateIndex
CREATE INDEX "InvitationEvent_invitationId_createdAt_idx" ON "InvitationEvent"("invitationId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Discipline_name_key" ON "Discipline"("name");

-- CreateIndex
CREATE UNIQUE INDEX "SkillCategory_name_key" ON "SkillCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Skill_name_key" ON "Skill"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceArea_type_name_key" ON "ServiceArea"("type", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Language_name_key" ON "Language"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Language_code_key" ON "Language"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_invitationId_key" ON "Conversation"("invitationId");

-- CreateIndex
CREATE UNIQUE INDEX "EngineerProfile_slug_key" ON "EngineerProfile"("slug");

-- AddForeignKey
ALTER TABLE "PortfolioItem" ADD CONSTRAINT "PortfolioItem_disciplineId_fkey" FOREIGN KEY ("disciplineId") REFERENCES "Discipline"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "ProjectInvitation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "ProjectInvitation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectInvitation" ADD CONSTRAINT "ProjectInvitation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectInvitation" ADD CONSTRAINT "ProjectInvitation_engineerId_fkey" FOREIGN KEY ("engineerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectInvitation" ADD CONSTRAINT "ProjectInvitation_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvitationEvent" ADD CONSTRAINT "InvitationEvent_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "ProjectInvitation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Specialization" ADD CONSTRAINT "Specialization_disciplineId_fkey" FOREIGN KEY ("disciplineId") REFERENCES "Discipline"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Skill" ADD CONSTRAINT "Skill_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "SkillCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileSpecialization" ADD CONSTRAINT "ProfileSpecialization_engineerId_fkey" FOREIGN KEY ("engineerId") REFERENCES "EngineerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileSpecialization" ADD CONSTRAINT "ProfileSpecialization_specializationId_fkey" FOREIGN KEY ("specializationId") REFERENCES "Specialization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileSkill" ADD CONSTRAINT "ProfileSkill_engineerId_fkey" FOREIGN KEY ("engineerId") REFERENCES "EngineerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileSkill" ADD CONSTRAINT "ProfileSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileServiceArea" ADD CONSTRAINT "ProfileServiceArea_engineerId_fkey" FOREIGN KEY ("engineerId") REFERENCES "EngineerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileServiceArea" ADD CONSTRAINT "ProfileServiceArea_serviceAreaId_fkey" FOREIGN KEY ("serviceAreaId") REFERENCES "ServiceArea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileLanguage" ADD CONSTRAINT "ProfileLanguage_engineerId_fkey" FOREIGN KEY ("engineerId") REFERENCES "EngineerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileLanguage" ADD CONSTRAINT "ProfileLanguage_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "Language"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileCertification" ADD CONSTRAINT "ProfileCertification_engineerId_fkey" FOREIGN KEY ("engineerId") REFERENCES "EngineerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileCertification" ADD CONSTRAINT "ProfileCertification_certificationId_fkey" FOREIGN KEY ("certificationId") REFERENCES "Certification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioProjectSkill" ADD CONSTRAINT "PortfolioProjectSkill_portfolioProjectId_fkey" FOREIGN KEY ("portfolioProjectId") REFERENCES "PortfolioItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioProjectSkill" ADD CONSTRAINT "PortfolioProjectSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioFile" ADD CONSTRAINT "PortfolioFile_portfolioProjectId_fkey" FOREIGN KEY ("portfolioProjectId") REFERENCES "PortfolioItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileAnalytics" ADD CONSTRAINT "ProfileAnalytics_engineerId_fkey" FOREIGN KEY ("engineerId") REFERENCES "EngineerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
