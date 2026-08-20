-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'BID_RESPONSE_SUBMITTED';
ALTER TYPE "NotificationType" ADD VALUE 'ADDED_TO_GROUP';
ALTER TYPE "NotificationType" ADD VALUE 'NEW_CHAT_MESSAGE';
