/*
  Warnings:

  - You are about to drop the column `protocol` on the `Call` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[requesterCallId]` on the table `Call` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[protocol]` on the table `RequesterCall` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `protocol` to the `RequesterCall` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Call_protocol_key";

-- AlterTable
ALTER TABLE "Call" DROP COLUMN "protocol",
ADD COLUMN     "requesterCallId" TEXT;

-- AlterTable
ALTER TABLE "RequesterCall" ADD COLUMN     "protocol" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Call_requesterCallId_key" ON "Call"("requesterCallId");

-- CreateIndex
CREATE UNIQUE INDEX "RequesterCall_protocol_key" ON "RequesterCall"("protocol");

-- AddForeignKey
ALTER TABLE "Call" ADD CONSTRAINT "Call_requesterCallId_fkey" FOREIGN KEY ("requesterCallId") REFERENCES "RequesterCall"("id") ON DELETE SET NULL ON UPDATE CASCADE;
