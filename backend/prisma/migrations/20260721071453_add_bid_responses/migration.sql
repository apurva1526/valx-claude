-- CreateTable
CREATE TABLE "BidResponse" (
    "id" TEXT NOT NULL,
    "bidId" TEXT NOT NULL,
    "supplierProfileId" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "comment" TEXT,
    "revisionNumber" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BidResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BidResponse_bidId_supplierProfileId_key" ON "BidResponse"("bidId", "supplierProfileId");

-- AddForeignKey
ALTER TABLE "BidResponse" ADD CONSTRAINT "BidResponse_bidId_fkey" FOREIGN KEY ("bidId") REFERENCES "Bid"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BidResponse" ADD CONSTRAINT "BidResponse_supplierProfileId_fkey" FOREIGN KEY ("supplierProfileId") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
