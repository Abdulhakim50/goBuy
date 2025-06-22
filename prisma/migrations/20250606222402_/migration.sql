/*
  Warnings:

  - Added the required column `priceAtPurchase` to the `CartItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Cart" ADD COLUMN     "sessionId" TEXT;

-- AlterTable
ALTER TABLE "CartItem" ADD COLUMN     "priceAtPurchase" DOUBLE PRECISION NOT NULL;
