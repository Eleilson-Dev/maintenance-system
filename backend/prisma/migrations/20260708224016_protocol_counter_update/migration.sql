/*
  Warnings:

  - The primary key for the `ProtocolCounter` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[type,year]` on the table `ProtocolCounter` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `id` to the `ProtocolCounter` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `ProtocolCounter` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ProtocolType" AS ENUM ('CALL', 'REQUESTER_CALL');

-- AlterTable
ALTER TABLE "ProtocolCounter" DROP CONSTRAINT "ProtocolCounter_pkey",
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "type" "ProtocolType" NOT NULL,
ADD CONSTRAINT "ProtocolCounter_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE UNIQUE INDEX "ProtocolCounter_type_year_key" ON "ProtocolCounter"("type", "year");
