/*
  Warnings:

  - You are about to drop the column `fileUrl` on the `CallAttachment` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[storageKey]` on the table `CallAttachment` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `storageKey` to the `CallAttachment` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "CallAttachment" DROP CONSTRAINT "CallAttachment_callId_fkey";

-- AlterTable
ALTER TABLE "CallAttachment" DROP COLUMN "fileUrl",
ADD COLUMN     "mimeType" TEXT,
ADD COLUMN     "storageKey" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "CallAttachment_storageKey_key" ON "CallAttachment"("storageKey");

-- AddForeignKey
ALTER TABLE "CallAttachment" ADD CONSTRAINT "CallAttachment_callId_fkey" FOREIGN KEY ("callId") REFERENCES "Call"("id") ON DELETE CASCADE ON UPDATE CASCADE;
