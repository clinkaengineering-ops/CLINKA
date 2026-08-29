-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('PAYMOB', 'MANUAL');

-- CreateEnum
CREATE TYPE "ManualPaymentStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- AlterEnum
ALTER TYPE "PayoutType" ADD VALUE 'INSTAPAY';
ALTER TYPE "PayoutType" ADD VALUE 'E_WALLET';

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN "provider" "PaymentProvider";

-- AlterTable
ALTER TABLE "PlatformSettings" ADD COLUMN "manualPaymentSettings" JSONB;

-- CreateTable
CREATE TABLE "ManualPaymentSubmission" (
    "id" SERIAL NOT NULL,
    "paymentId" INTEGER NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "transactionReference" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EGP',
    "receiptUrl" TEXT,
    "note" TEXT,
    "status" "ManualPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "adminNote" TEXT,
    "verifiedBy" INTEGER,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ManualPaymentSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ManualPaymentSubmission_paymentMethod_transactionReference_key" ON "ManualPaymentSubmission"("paymentMethod", "transactionReference");

-- AddForeignKey
ALTER TABLE "ManualPaymentSubmission" ADD CONSTRAINT "ManualPaymentSubmission_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
