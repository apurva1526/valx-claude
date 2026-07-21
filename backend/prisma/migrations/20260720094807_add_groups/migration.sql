-- CreateTable
CREATE TABLE "Group" (
    "id" TEXT NOT NULL,
    "buyerProfileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupSupplier" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "contactName" TEXT,
    "supplierProfileId" TEXT,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupSupplier_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GroupSupplier_groupId_phoneNumber_key" ON "GroupSupplier"("groupId", "phoneNumber");

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_buyerProfileId_fkey" FOREIGN KEY ("buyerProfileId") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupSupplier" ADD CONSTRAINT "GroupSupplier_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupSupplier" ADD CONSTRAINT "GroupSupplier_supplierProfileId_fkey" FOREIGN KEY ("supplierProfileId") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
