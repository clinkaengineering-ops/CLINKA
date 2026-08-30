-- AlterTable: Add proof metadata and receiving destination snapshot to ManualPaymentSubmission
ALTER TABLE "ManualPaymentSubmission" ADD COLUMN "proofUrl" TEXT;
ALTER TABLE "ManualPaymentSubmission" ADD COLUMN "proofOriginalName" TEXT;
ALTER TABLE "ManualPaymentSubmission" ADD COLUMN "proofMimeType" TEXT;
ALTER TABLE "ManualPaymentSubmission" ADD COLUMN "proofFileSize" INTEGER;

ALTER TABLE "ManualPaymentSubmission" ADD COLUMN "receivingMethod" TEXT;
ALTER TABLE "ManualPaymentSubmission" ADD COLUMN "receivingCountry" TEXT;
ALTER TABLE "ManualPaymentSubmission" ADD COLUMN "receivingAccountName" TEXT;
ALTER TABLE "ManualPaymentSubmission" ADD COLUMN "receivingBankName" TEXT;
ALTER TABLE "ManualPaymentSubmission" ADD COLUMN "receivingAccountNumber" TEXT;
ALTER TABLE "ManualPaymentSubmission" ADD COLUMN "receivingIban" TEXT;
ALTER TABLE "ManualPaymentSubmission" ADD COLUMN "receivingSwift" TEXT;
ALTER TABLE "ManualPaymentSubmission" ADD COLUMN "receivingCurrency" TEXT;
ALTER TABLE "ManualPaymentSubmission" ADD COLUMN "receivingWalletProvider" TEXT;
ALTER TABLE "ManualPaymentSubmission" ADD COLUMN "receivingWalletNumber" TEXT;
ALTER TABLE "ManualPaymentSubmission" ADD COLUMN "receivingInstapayAccount" TEXT;
