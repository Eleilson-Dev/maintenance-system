/*
  Warnings:

  - You are about to drop the column `userId` on the `CallPlanningMember` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "CallPlanningMember" DROP CONSTRAINT "CallPlanningMember_userId_fkey";

-- AlterTable
ALTER TABLE "CallPlanningMember" DROP COLUMN "userId";
