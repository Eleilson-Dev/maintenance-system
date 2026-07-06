-- DropIndex
DROP INDEX "Call_assignedToId_idx";

-- DropIndex
DROP INDEX "Call_locationId_idx";

-- DropIndex
DROP INDEX "Call_openedById_idx";

-- DropIndex
DROP INDEX "Call_priority_idx";

-- DropIndex
DROP INDEX "Call_requesterId_idx";

-- DropIndex
DROP INDEX "Call_requiredLevel_idx";

-- DropIndex
DROP INDEX "Call_status_idx";

-- CreateIndex
CREATE INDEX "Call_assignedToId_status_idx" ON "Call"("assignedToId", "status");

-- CreateIndex
CREATE INDEX "Call_status_createdAt_idx" ON "Call"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Call_locationId_createdAt_idx" ON "Call"("locationId", "createdAt");

-- CreateIndex
CREATE INDEX "Call_openedById_createdAt_idx" ON "Call"("openedById", "createdAt");

-- CreateIndex
CREATE INDEX "Call_requesterId_createdAt_idx" ON "Call"("requesterId", "createdAt");

-- CreateIndex
CREATE INDEX "Call_priority_status_idx" ON "Call"("priority", "status");

-- CreateIndex
CREATE INDEX "Call_requiredLevel_status_idx" ON "Call"("requiredLevel", "status");
