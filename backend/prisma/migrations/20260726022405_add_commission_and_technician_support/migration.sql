-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isTechnician" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "CommissionSettlement" (
    "id" TEXT NOT NULL,
    "technicianId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "totalCalls" INTEGER NOT NULL,
    "observation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommissionSettlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommissionSettlementCall" (
    "id" TEXT NOT NULL,
    "settlementId" TEXT NOT NULL,
    "callId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommissionSettlementCall_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CommissionSettlement_technicianId_idx" ON "CommissionSettlement"("technicianId");

-- CreateIndex
CREATE INDEX "CommissionSettlement_createdById_idx" ON "CommissionSettlement"("createdById");

-- CreateIndex
CREATE INDEX "CommissionSettlement_createdAt_idx" ON "CommissionSettlement"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CommissionSettlementCall_callId_key" ON "CommissionSettlementCall"("callId");

-- CreateIndex
CREATE INDEX "CommissionSettlementCall_settlementId_idx" ON "CommissionSettlementCall"("settlementId");

-- AddForeignKey
ALTER TABLE "CommissionSettlement" ADD CONSTRAINT "CommissionSettlement_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionSettlement" ADD CONSTRAINT "CommissionSettlement_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionSettlementCall" ADD CONSTRAINT "CommissionSettlementCall_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "CommissionSettlement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionSettlementCall" ADD CONSTRAINT "CommissionSettlementCall_callId_fkey" FOREIGN KEY ("callId") REFERENCES "Call"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
