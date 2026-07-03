-- CreateEnum
CREATE TYPE "RequesterCallStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- AlterTable
ALTER TABLE "Call" ALTER COLUMN "requiredLevel" DROP NOT NULL;

-- CreateTable
CREATE TABLE "RequesterCall" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "status" "RequesterCallStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RequesterCall_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RequesterCall_status_idx" ON "RequesterCall"("status");

-- CreateIndex
CREATE INDEX "RequesterCall_requesterId_idx" ON "RequesterCall"("requesterId");

-- CreateIndex
CREATE INDEX "RequesterCall_locationId_idx" ON "RequesterCall"("locationId");

-- AddForeignKey
ALTER TABLE "RequesterCall" ADD CONSTRAINT "RequesterCall_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequesterCall" ADD CONSTRAINT "RequesterCall_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "Requester"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
