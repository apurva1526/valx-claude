-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'BID_DEADLINE_APPROACHING';

-- AlterTable
ALTER TABLE "Bid" ADD COLUMN     "deadlineAlertSentAt" TIMESTAMP(3);
