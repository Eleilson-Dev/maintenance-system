/*
  Warnings:

  - A unique constraint covering the columns `[protocol]` on the table `Call` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `protocol` to the `Call` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Call" ADD COLUMN     "protocol" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Call_protocol_key" ON "Call"("protocol");
