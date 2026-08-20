-- CreateEnum
CREATE TYPE "PinType" AS ENUM ('GROUP', 'BID');

-- CreateTable
CREATE TABLE "Pin" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "type" "PinType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Pin_profileId_type_targetId_key" ON "Pin"("profileId", "type", "targetId");

-- AddForeignKey
ALTER TABLE "Pin" ADD CONSTRAINT "Pin_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
