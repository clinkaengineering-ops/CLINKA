-- Post-payment workflow: new project statuses, submissions, payment ledger

-- CreateEnum
CREATE TYPE "DeliverableType" AS ENUM ('FILE', 'LINK');

-- CreateEnum
CREATE TYPE "PaymentLedgerType" AS ENUM ('FUNDED', 'ENGINEER_ESCROW', 'PLATFORM_COMMISSION', 'RELEASED', 'REFUNDED');

-- AlterEnum
ALTER TYPE "ProjectStatus" ADD VALUE 'SUBMITTED_FOR_REVIEW';
ALTER TYPE "ProjectStatus" ADD VALUE 'REVISION_REQUESTED';

-- AlterTable
ALTER TABLE "Project" ADD COLUMN "progressNote" TEXT,
ADD COLUMN "progressUpdatedAt" TIMESTAMP(3);

-- Migrate legacy status to canonical name
UPDATE "Project" SET "status" = 'SUBMITTED_FOR_REVIEW' WHERE "status" = 'AWAITING_APPROVAL';

-- CreateTable
CREATE TABLE "PaymentLedgerEntry" (
    "id" SERIAL NOT NULL,
    "paymentId" INTEGER NOT NULL,
    "type" "PaymentLedgerType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentLedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectSubmission" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "engineerId" INTEGER NOT NULL,
    "notes" TEXT,
    "revisionNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectDeliverable" (
    "id" SERIAL NOT NULL,
    "submissionId" INTEGER NOT NULL,
    "type" "DeliverableType" NOT NULL,
    "url" TEXT NOT NULL,
    "name" TEXT,
    "mimeType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectDeliverable_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PaymentLedgerEntry" ADD CONSTRAINT "PaymentLedgerEntry_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectSubmission" ADD CONSTRAINT "ProjectSubmission_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectDeliverable" ADD CONSTRAINT "ProjectDeliverable_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "ProjectSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "PaymentLedgerEntry_paymentId_idx" ON "PaymentLedgerEntry"("paymentId");
CREATE INDEX "ProjectSubmission_projectId_idx" ON "ProjectSubmission"("projectId");
