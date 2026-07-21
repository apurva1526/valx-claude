-- CreateTable
CREATE TABLE "BidResponseRevision" (
    "id" TEXT NOT NULL,
    "bidResponseId" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "comment" TEXT,
    "revisionNumber" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BidResponseRevision_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "BidResponseRevision" ADD CONSTRAINT "BidResponseRevision_bidResponseId_fkey" FOREIGN KEY ("bidResponseId") REFERENCES "BidResponse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
