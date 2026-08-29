-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "attachmentUrl" TEXT,
ADD COLUMN     "attachmentName" TEXT,
ADD COLUMN     "attachmentMime" TEXT,
ALTER COLUMN "content" SET DEFAULT '';
