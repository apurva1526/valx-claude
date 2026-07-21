-- CreateEnum
CREATE TYPE "AccessLevel" AS ENUM ('VIEW', 'EDIT', 'MANAGE');

-- CreateTable
CREATE TABLE "TeamMember" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "contactName" TEXT,
    "userId" TEXT,
    "accessLevel" "AccessLevel" NOT NULL DEFAULT 'MANAGE',
    "scopeGroupId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TeamMember_profileId_phoneNumber_key" ON "TeamMember"("profileId", "phoneNumber");

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_scopeGroupId_fkey" FOREIGN KEY ("scopeGroupId") REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;
