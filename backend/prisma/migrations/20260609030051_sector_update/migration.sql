/*
  Warnings:

  - A unique constraint covering the columns `[normalizedName]` on the table `Sector` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `normalizedName` to the `Sector` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Sector" ADD COLUMN     "normalizedName" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Sector_normalizedName_key" ON "Sector"("normalizedName");
