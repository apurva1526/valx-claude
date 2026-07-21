-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('INR', 'USD');

-- AlterTable
ALTER TABLE "Bid" ADD COLUMN     "targetPriceCurrency" "Currency" NOT NULL DEFAULT 'INR';
