/*
  Warnings:

  - You are about to drop the column `categoryId` on the `Call` table. All the data in the column will be lost.
  - You are about to drop the `CallSkill` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Category` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CategorySkill` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Skill` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TechnicianSkill` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `areaId` to the `Call` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Call" DROP CONSTRAINT "Call_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "CallSkill" DROP CONSTRAINT "CallSkill_callId_fkey";

-- DropForeignKey
ALTER TABLE "CallSkill" DROP CONSTRAINT "CallSkill_skillId_fkey";

-- DropForeignKey
ALTER TABLE "CategorySkill" DROP CONSTRAINT "CategorySkill_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "CategorySkill" DROP CONSTRAINT "CategorySkill_skillId_fkey";

-- DropForeignKey
ALTER TABLE "TechnicianSkill" DROP CONSTRAINT "TechnicianSkill_skillId_fkey";

-- DropForeignKey
ALTER TABLE "TechnicianSkill" DROP CONSTRAINT "TechnicianSkill_technicianId_fkey";

-- DropIndex
DROP INDEX "Call_categoryId_idx";

-- AlterTable
ALTER TABLE "Call" DROP COLUMN "categoryId",
ADD COLUMN     "areaId" TEXT NOT NULL;

-- DropTable
DROP TABLE "CallSkill";

-- DropTable
DROP TABLE "Category";

-- DropTable
DROP TABLE "CategorySkill";

-- DropTable
DROP TABLE "Skill";

-- DropTable
DROP TABLE "TechnicianSkill";

-- CreateTable
CREATE TABLE "Area" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Area_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserArea" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "areaId" TEXT NOT NULL,

    CONSTRAINT "UserArea_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Area_name_key" ON "Area"("name");

-- CreateIndex
CREATE INDEX "Area_normalizedName_idx" ON "Area"("normalizedName");

-- CreateIndex
CREATE INDEX "UserArea_userId_idx" ON "UserArea"("userId");

-- CreateIndex
CREATE INDEX "UserArea_areaId_idx" ON "UserArea"("areaId");

-- CreateIndex
CREATE UNIQUE INDEX "UserArea_userId_areaId_key" ON "UserArea"("userId", "areaId");

-- CreateIndex
CREATE INDEX "Call_areaId_idx" ON "Call"("areaId");

-- AddForeignKey
ALTER TABLE "Call" ADD CONSTRAINT "Call_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserArea" ADD CONSTRAINT "UserArea_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserArea" ADD CONSTRAINT "UserArea_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE CASCADE ON UPDATE CASCADE;
