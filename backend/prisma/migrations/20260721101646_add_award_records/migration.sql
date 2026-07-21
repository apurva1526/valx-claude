-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'BID_CLOSED';

-- CreateTable
CREATE TABLE "AwardRecord" (
    "id" TEXT NOT NULL,
    "bidId" TEXT NOT NULL,
    "awardedSupplierIds" TEXT[],
    "averagePrice" DOUBLE PRECISION,
    "closedByProfileId" TEXT NOT NULL,
    "closedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AwardRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AwardRecord_bidId_key" ON "AwardRecord"("bidId");

-- AddForeignKey
ALTER TABLE "AwardRecord" ADD CONSTRAINT "AwardRecord_bidId_fkey" FOREIGN KEY ("bidId") REFERENCES "Bid"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AwardRecord" ADD CONSTRAINT "AwardRecord_closedByProfileId_fkey" FOREIGN KEY ("closedByProfileId") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
