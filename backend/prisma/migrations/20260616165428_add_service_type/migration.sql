/*
  Warnings:

  - Added the required column `serviceType` to the `Call` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('CORRECTIVE', 'PREVENTIVE', 'PREDICTIVE', 'INSTALLATION');

-- AlterTable
ALTER TABLE "Call" ADD COLUMN     "serviceType" "ServiceType" NOT NULL;
