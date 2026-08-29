-- AlterTable
ALTER TABLE "User" ADD COLUMN "avatarUrl" TEXT;
ALTER TABLE "User" ADD COLUMN "notificationPrefs" JSONB;

-- AlterTable
ALTER TABLE "EngineerProfile" ADD COLUMN "coverImageUrl" TEXT;

-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN "clientLastReadAt" TIMESTAMP(3);
ALTER TABLE "Conversation" ADD COLUMN "engineerLastReadAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Notification" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "link" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "Notification_userId_read_idx" ON "Notification"("userId", "read");
