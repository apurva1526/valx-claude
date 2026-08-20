-- AlterTable
ALTER TABLE "AwardRecord" ADD COLUMN     "supplierComments" JSONB;

-- AlterTable
ALTER TABLE "BidResponse" ADD COLUMN     "revokedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "BidResponseRevision" ADD COLUMN     "revokedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "deactivatedAt" TIMESTAMP(3);
