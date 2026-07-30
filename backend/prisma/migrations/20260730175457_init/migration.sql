-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'TECHNICIAN');

-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('CORRECTIVE', 'PREVENTIVE', 'PREDICTIVE', 'INSTALLATION');

-- CreateEnum
CREATE TYPE "TechnicianLevel" AS ENUM ('JUNIOR', 'MID', 'SENIOR', 'SPECIALIST');

-- CreateEnum
CREATE TYPE "RequesterCallStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CallStatus" AS ENUM ('PLANNING', 'OPEN', 'READY', 'IN_PROGRESS', 'HELP_REQUESTED', 'WAITING_PARTS', 'WAITING_APPROVAL', 'COMPLETED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CallPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "CallHistoryAction" AS ENUM ('CREATED', 'ASSIGNED', 'TRANSFERRED', 'STARTED', 'PAUSED', 'RESUMED', 'WAITING_PARTS', 'HELP_REQUESTED', 'HELP_APPROVED', 'HELP_REJECTED', 'ASSISTANT_ADDED', 'ASSISTANT_REMOVED', 'COMMENT_ADDED', 'ATTACHMENT_ADDED', 'COMPLETED', 'REOPENED', 'PRIORITY_CHANGED', 'LEVEL_CHANGED', 'CATEGORY_CHANGED', 'LOCATION_CHANGED', 'STATUS_CHANGED', 'PLANNING_STARTED', 'PLANNING_UPDATED', 'PLANNING_CONFIRMED', 'PLANNING_CANCELLED', 'TEAM_CONFIRMED', 'READY_FOR_EXECUTION');

-- CreateEnum
CREATE TYPE "HelpRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AttachmentType" AS ENUM ('BEFORE', 'AFTER', 'OTHER');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('NEW_CALL', 'CALL_ASSIGNED', 'CALL_TRANSFERRED', 'HELP_REQUEST', 'HELP_APPROVED', 'HELP_REJECTED', 'WAITING_PARTS', 'COMMENT', 'CALL_COMPLETED', 'CALL_REOPENED', 'PRIORITY_CHANGED', 'SYSTEM');

-- CreateEnum
CREATE TYPE "ProtocolType" AS ENUM ('CALL', 'REQUESTER_CALL');

-- CreateEnum
CREATE TYPE "PlanningStatus" AS ENUM ('DRAFT', 'READY_TO_CONFIRM', 'CONFIRMED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PlanningMemberRole" AS ENUM ('RESPONSIBLE', 'ASSISTANT');

-- CreateEnum
CREATE TYPE "PlanningRequirementType" AS ENUM ('PART', 'TOOL', 'PPE', 'PERMIT', 'SHUTDOWN', 'OTHER');

-- CreateEnum
CREATE TYPE "PlanningRequirementStatus" AS ENUM ('PENDING', 'AVAILABLE', 'UNAVAILABLE', 'WAIVED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'TECHNICIAN',
    "isTechnician" BOOLEAN NOT NULL DEFAULT true,
    "level" "TechnicianLevel" NOT NULL DEFAULT 'JUNIOR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "locationCode" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Requester" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Requester_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequesterCall" (
    "id" TEXT NOT NULL,
    "protocol" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "RequesterCallStatus" NOT NULL DEFAULT 'PENDING',
    "locationId" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RequesterCall_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Call" (
    "id" TEXT NOT NULL,
    "protocol" TEXT NOT NULL,
    "requesterCallId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "requiredLevel" "TechnicianLevel",
    "status" "CallStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "CallPriority" NOT NULL DEFAULT 'MEDIUM',
    "serviceType" "ServiceType" NOT NULL,
    "locationId" TEXT NOT NULL,
    "requesterId" TEXT,
    "openedById" TEXT NOT NULL,
    "assignedToId" TEXT,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Call_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CallPlanning" (
    "id" TEXT NOT NULL,
    "callId" TEXT NOT NULL,
    "status" "PlanningStatus" NOT NULL DEFAULT 'DRAFT',
    "plannedStartAt" TIMESTAMP(3),
    "plannedEndAt" TIMESTAMP(3),
    "instructions" TEXT,
    "observations" TEXT,
    "requiresShutdown" BOOLEAN NOT NULL DEFAULT false,
    "requiresPermit" BOOLEAN NOT NULL DEFAULT false,
    "requiresParts" BOOLEAN NOT NULL DEFAULT false,
    "requiresTools" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "confirmedById" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CallPlanning_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CallPlanningMember" (
    "id" TEXT NOT NULL,
    "planningId" TEXT NOT NULL,
    "technicianId" TEXT NOT NULL,
    "role" "PlanningMemberRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CallPlanningMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CallPlanningRequirement" (
    "id" TEXT NOT NULL,
    "planningId" TEXT NOT NULL,
    "type" "PlanningRequirementType" NOT NULL,
    "status" "PlanningRequirementStatus" NOT NULL DEFAULT 'PENDING',
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(65,30),
    "unit" TEXT,
    "observation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CallPlanningRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProtocolCounter" (
    "id" TEXT NOT NULL,
    "type" "ProtocolType" NOT NULL,
    "year" INTEGER NOT NULL,
    "value" INTEGER NOT NULL,

    CONSTRAINT "ProtocolCounter_pkey" PRIMARY KEY ("id")
);

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
CREATE TABLE "CallArea" (
    "id" TEXT NOT NULL,
    "callId" TEXT NOT NULL,
    "areaId" TEXT NOT NULL,

    CONSTRAINT "CallArea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserArea" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "areaId" TEXT NOT NULL,

    CONSTRAINT "UserArea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CallAssistant" (
    "id" TEXT NOT NULL,
    "callId" TEXT NOT NULL,
    "technicianId" TEXT NOT NULL,
    "addedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CallAssistant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HelpRequest" (
    "id" TEXT NOT NULL,
    "callId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "technicianId" TEXT NOT NULL,
    "status" "HelpRequestStatus" NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HelpRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CallAttachment" (
    "id" TEXT NOT NULL,
    "callId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "type" "AttachmentType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CallAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "callId" TEXT NOT NULL,
    "serviceDone" TEXT NOT NULL,
    "partChanged" BOOLEAN NOT NULL DEFAULT false,
    "partName" TEXT,
    "observations" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkLog" (
    "id" TEXT NOT NULL,
    "callId" TEXT NOT NULL,
    "technicianId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "batchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HourBatch" (
    "id" TEXT NOT NULL,
    "technicianId" TEXT NOT NULL,
    "pdfPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HourBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CallHistory" (
    "id" TEXT NOT NULL,
    "action" "CallHistoryAction" NOT NULL,
    "observation" TEXT,
    "callId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CallHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "callId" TEXT,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

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
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_level_idx" ON "User"("level");

-- CreateIndex
CREATE UNIQUE INDEX "Location_locationCode_key" ON "Location"("locationCode");

-- CreateIndex
CREATE INDEX "Location_parentId_idx" ON "Location"("parentId");

-- CreateIndex
CREATE INDEX "Location_normalizedName_idx" ON "Location"("normalizedName");

-- CreateIndex
CREATE UNIQUE INDEX "RequesterCall_protocol_key" ON "RequesterCall"("protocol");

-- CreateIndex
CREATE INDEX "RequesterCall_status_idx" ON "RequesterCall"("status");

-- CreateIndex
CREATE INDEX "RequesterCall_requesterId_idx" ON "RequesterCall"("requesterId");

-- CreateIndex
CREATE INDEX "RequesterCall_locationId_idx" ON "RequesterCall"("locationId");

-- CreateIndex
CREATE UNIQUE INDEX "Call_protocol_key" ON "Call"("protocol");

-- CreateIndex
CREATE UNIQUE INDEX "Call_requesterCallId_key" ON "Call"("requesterCallId");

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

-- CreateIndex
CREATE UNIQUE INDEX "CallPlanning_callId_key" ON "CallPlanning"("callId");

-- CreateIndex
CREATE INDEX "CallPlanning_status_idx" ON "CallPlanning"("status");

-- CreateIndex
CREATE INDEX "CallPlanning_plannedStartAt_idx" ON "CallPlanning"("plannedStartAt");

-- CreateIndex
CREATE INDEX "CallPlanning_createdById_idx" ON "CallPlanning"("createdById");

-- CreateIndex
CREATE INDEX "CallPlanning_confirmedById_idx" ON "CallPlanning"("confirmedById");

-- CreateIndex
CREATE INDEX "CallPlanningMember_planningId_idx" ON "CallPlanningMember"("planningId");

-- CreateIndex
CREATE INDEX "CallPlanningMember_technicianId_idx" ON "CallPlanningMember"("technicianId");

-- CreateIndex
CREATE INDEX "CallPlanningMember_role_idx" ON "CallPlanningMember"("role");

-- CreateIndex
CREATE UNIQUE INDEX "CallPlanningMember_planningId_technicianId_key" ON "CallPlanningMember"("planningId", "technicianId");

-- CreateIndex
CREATE INDEX "CallPlanningRequirement_planningId_idx" ON "CallPlanningRequirement"("planningId");

-- CreateIndex
CREATE INDEX "CallPlanningRequirement_type_status_idx" ON "CallPlanningRequirement"("type", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ProtocolCounter_type_year_key" ON "ProtocolCounter"("type", "year");

-- CreateIndex
CREATE UNIQUE INDEX "Area_name_key" ON "Area"("name");

-- CreateIndex
CREATE INDEX "Area_normalizedName_idx" ON "Area"("normalizedName");

-- CreateIndex
CREATE INDEX "CallArea_callId_idx" ON "CallArea"("callId");

-- CreateIndex
CREATE INDEX "CallArea_areaId_idx" ON "CallArea"("areaId");

-- CreateIndex
CREATE UNIQUE INDEX "CallArea_callId_areaId_key" ON "CallArea"("callId", "areaId");

-- CreateIndex
CREATE INDEX "UserArea_userId_idx" ON "UserArea"("userId");

-- CreateIndex
CREATE INDEX "UserArea_areaId_idx" ON "UserArea"("areaId");

-- CreateIndex
CREATE UNIQUE INDEX "UserArea_userId_areaId_key" ON "UserArea"("userId", "areaId");

-- CreateIndex
CREATE INDEX "CallAssistant_callId_idx" ON "CallAssistant"("callId");

-- CreateIndex
CREATE INDEX "CallAssistant_technicianId_idx" ON "CallAssistant"("technicianId");

-- CreateIndex
CREATE UNIQUE INDEX "CallAssistant_callId_technicianId_key" ON "CallAssistant"("callId", "technicianId");

-- CreateIndex
CREATE INDEX "HelpRequest_callId_idx" ON "HelpRequest"("callId");

-- CreateIndex
CREATE INDEX "HelpRequest_requestedById_idx" ON "HelpRequest"("requestedById");

-- CreateIndex
CREATE INDEX "HelpRequest_technicianId_idx" ON "HelpRequest"("technicianId");

-- CreateIndex
CREATE INDEX "HelpRequest_status_idx" ON "HelpRequest"("status");

-- CreateIndex
CREATE INDEX "CallAttachment_callId_idx" ON "CallAttachment"("callId");

-- CreateIndex
CREATE INDEX "CallAttachment_uploadedById_idx" ON "CallAttachment"("uploadedById");

-- CreateIndex
CREATE INDEX "CallAttachment_type_idx" ON "CallAttachment"("type");

-- CreateIndex
CREATE UNIQUE INDEX "Report_callId_key" ON "Report"("callId");

-- CreateIndex
CREATE INDEX "Report_createdById_idx" ON "Report"("createdById");

-- CreateIndex
CREATE INDEX "WorkLog_callId_idx" ON "WorkLog"("callId");

-- CreateIndex
CREATE INDEX "WorkLog_technicianId_idx" ON "WorkLog"("technicianId");

-- CreateIndex
CREATE INDEX "WorkLog_batchId_idx" ON "WorkLog"("batchId");

-- CreateIndex
CREATE INDEX "HourBatch_technicianId_idx" ON "HourBatch"("technicianId");

-- CreateIndex
CREATE INDEX "CallHistory_callId_idx" ON "CallHistory"("callId");

-- CreateIndex
CREATE INDEX "CallHistory_userId_idx" ON "CallHistory"("userId");

-- CreateIndex
CREATE INDEX "CallHistory_action_idx" ON "CallHistory"("action");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_callId_idx" ON "Notification"("callId");

-- CreateIndex
CREATE INDEX "Notification_read_idx" ON "Notification"("read");

-- CreateIndex
CREATE INDEX "Notification_type_idx" ON "Notification"("type");

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
ALTER TABLE "Location" ADD CONSTRAINT "Location_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequesterCall" ADD CONSTRAINT "RequesterCall_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequesterCall" ADD CONSTRAINT "RequesterCall_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "Requester"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Call" ADD CONSTRAINT "Call_requesterCallId_fkey" FOREIGN KEY ("requesterCallId") REFERENCES "RequesterCall"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Call" ADD CONSTRAINT "Call_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Call" ADD CONSTRAINT "Call_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "Requester"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Call" ADD CONSTRAINT "Call_openedById_fkey" FOREIGN KEY ("openedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Call" ADD CONSTRAINT "Call_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallPlanning" ADD CONSTRAINT "CallPlanning_callId_fkey" FOREIGN KEY ("callId") REFERENCES "Call"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallPlanning" ADD CONSTRAINT "CallPlanning_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallPlanning" ADD CONSTRAINT "CallPlanning_confirmedById_fkey" FOREIGN KEY ("confirmedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallPlanningMember" ADD CONSTRAINT "CallPlanningMember_planningId_fkey" FOREIGN KEY ("planningId") REFERENCES "CallPlanning"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallPlanningMember" ADD CONSTRAINT "CallPlanningMember_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallPlanningRequirement" ADD CONSTRAINT "CallPlanningRequirement_planningId_fkey" FOREIGN KEY ("planningId") REFERENCES "CallPlanning"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallArea" ADD CONSTRAINT "CallArea_callId_fkey" FOREIGN KEY ("callId") REFERENCES "Call"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallArea" ADD CONSTRAINT "CallArea_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserArea" ADD CONSTRAINT "UserArea_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserArea" ADD CONSTRAINT "UserArea_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallAssistant" ADD CONSTRAINT "CallAssistant_callId_fkey" FOREIGN KEY ("callId") REFERENCES "Call"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallAssistant" ADD CONSTRAINT "CallAssistant_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallAssistant" ADD CONSTRAINT "CallAssistant_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HelpRequest" ADD CONSTRAINT "HelpRequest_callId_fkey" FOREIGN KEY ("callId") REFERENCES "Call"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HelpRequest" ADD CONSTRAINT "HelpRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HelpRequest" ADD CONSTRAINT "HelpRequest_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallAttachment" ADD CONSTRAINT "CallAttachment_callId_fkey" FOREIGN KEY ("callId") REFERENCES "Call"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallAttachment" ADD CONSTRAINT "CallAttachment_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_callId_fkey" FOREIGN KEY ("callId") REFERENCES "Call"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkLog" ADD CONSTRAINT "WorkLog_callId_fkey" FOREIGN KEY ("callId") REFERENCES "Call"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkLog" ADD CONSTRAINT "WorkLog_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkLog" ADD CONSTRAINT "WorkLog_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "HourBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HourBatch" ADD CONSTRAINT "HourBatch_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallHistory" ADD CONSTRAINT "CallHistory_callId_fkey" FOREIGN KEY ("callId") REFERENCES "Call"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallHistory" ADD CONSTRAINT "CallHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_callId_fkey" FOREIGN KEY ("callId") REFERENCES "Call"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionSettlement" ADD CONSTRAINT "CommissionSettlement_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionSettlement" ADD CONSTRAINT "CommissionSettlement_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionSettlementCall" ADD CONSTRAINT "CommissionSettlementCall_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "CommissionSettlement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionSettlementCall" ADD CONSTRAINT "CommissionSettlementCall_callId_fkey" FOREIGN KEY ("callId") REFERENCES "Call"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
