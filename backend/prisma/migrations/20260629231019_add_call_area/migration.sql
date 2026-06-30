/*
  Warnings:

  - You are about to drop the column `areaId` on the `Call` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Call" DROP CONSTRAINT "Call_areaId_fkey";

-- DropIndex
DROP INDEX "Call_areaId_idx";

-- AlterTable
ALTER TABLE "Call" DROP COLUMN "areaId";

-- CreateTable
CREATE TABLE "CallArea" (
    "id" TEXT NOT NULL,
    "callId" TEXT NOT NULL,
    "areaId" TEXT NOT NULL,

    CONSTRAINT "CallArea_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CallArea_callId_idx" ON "CallArea"("callId");

-- CreateIndex
CREATE INDEX "CallArea_areaId_idx" ON "CallArea"("areaId");

-- CreateIndex
CREATE UNIQUE INDEX "CallArea_callId_areaId_key" ON "CallArea"("callId", "areaId");

-- AddForeignKey
ALTER TABLE "CallArea" ADD CONSTRAINT "CallArea_callId_fkey" FOREIGN KEY ("callId") REFERENCES "Call"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallArea" ADD CONSTRAINT "CallArea_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE CASCADE ON UPDATE CASCADE;
