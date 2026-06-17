-- AlterEnum
ALTER TYPE "PaymentStatus" ADD VALUE 'FUNDED';

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "stripePaymentId",
ADD COLUMN "gatewayInvoiceId" TEXT,
ADD COLUMN "gatewayInvoiceKey" TEXT;
