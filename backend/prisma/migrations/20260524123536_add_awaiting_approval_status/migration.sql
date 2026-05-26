-- AlterEnum
ALTER TYPE "ProjectStatus" ADD VALUE 'AWAITING_APPROVAL';

-- DropIndex
DROP INDEX "Notification_userId_read_idx";
