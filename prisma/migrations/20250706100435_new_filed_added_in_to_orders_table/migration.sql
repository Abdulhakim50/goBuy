/*
  Warnings:

  - A unique constraint covering the columns `[tx_ref]` on the table `Order` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "tx_ref" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Order_tx_ref_key" ON "Order"("tx_ref");
