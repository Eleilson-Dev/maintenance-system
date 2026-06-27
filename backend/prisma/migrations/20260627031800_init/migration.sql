-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'TECHNICIAN');

-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('CORRECTIVE', 'PREVENTIVE', 'PREDICTIVE', 'INSTALLATION');

-- CreateEnum
CREATE TYPE "TechnicianLevel" AS ENUM ('JUNIOR', 'PLENO', 'SENIOR', 'ESPECIALISTA');

-- CreateEnum
CREATE TYPE "CallStatus" AS ENUM ('WAITING_APPROVAL', 'OPEN', 'IN_PROGRESS', 'WAITING_PARTS', 'COMPLETED', 'REJECTED');

-- CreateEnum
CREATE TYPE "CallPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "CallHistoryAction" AS ENUM ('CREATED', 'ASSIGNED', 'TRANSFERRED', 'STARTED', 'PAUSED', 'RESUMED', 'WAITING_PARTS', 'HELP_REQUESTED', 'HELP_APPROVED', 'HELP_REJECTED', 'ASSISTANT_ADDED', 'ASSISTANT_REMOVED', 'COMMENT_ADDED', 'ATTACHMENT_ADDED', 'COMPLETED', 'REOPENED', 'PRIORITY_CHANGED', 'LEVEL_CHANGED', 'CATEGORY_CHANGED', 'LOCATION_CHANGED', 'STATUS_CHANGED');

-- CreateEnum
CREATE TYPE "HelpRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AttachmentType" AS ENUM ('BEFORE', 'AFTER', 'OTHER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'TECHNICIAN',
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
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Skill" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TechnicianSkill" (
    "id" TEXT NOT NULL,
    "technicianId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,

    CONSTRAINT "TechnicianSkill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategorySkill" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,

    CONSTRAINT "CategorySkill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Requester" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "locationText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Requester_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Call" (
    "id" TEXT NOT NULL,
    "protocol" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "requiredLevel" "TechnicianLevel" NOT NULL,
    "status" "CallStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "CallPriority" NOT NULL DEFAULT 'MEDIUM',
    "serviceType" "ServiceType" NOT NULL,
    "locationId" TEXT NOT NULL,
    "categoryId" TEXT,
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
CREATE TABLE "CallSkill" (
    "id" TEXT NOT NULL,
    "callId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,

    CONSTRAINT "CallSkill_pkey" PRIMARY KEY ("id")
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
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Category_normalizedName_key" ON "Category"("normalizedName");

-- CreateIndex
CREATE UNIQUE INDEX "Skill_name_key" ON "Skill"("name");

-- CreateIndex
CREATE INDEX "TechnicianSkill_technicianId_idx" ON "TechnicianSkill"("technicianId");

-- CreateIndex
CREATE INDEX "TechnicianSkill_skillId_idx" ON "TechnicianSkill"("skillId");

-- CreateIndex
CREATE UNIQUE INDEX "TechnicianSkill_technicianId_skillId_key" ON "TechnicianSkill"("technicianId", "skillId");

-- CreateIndex
CREATE INDEX "CategorySkill_categoryId_idx" ON "CategorySkill"("categoryId");

-- CreateIndex
CREATE INDEX "CategorySkill_skillId_idx" ON "CategorySkill"("skillId");

-- CreateIndex
CREATE UNIQUE INDEX "CategorySkill_categoryId_skillId_key" ON "CategorySkill"("categoryId", "skillId");

-- CreateIndex
CREATE UNIQUE INDEX "Call_protocol_key" ON "Call"("protocol");

-- CreateIndex
CREATE INDEX "Call_status_idx" ON "Call"("status");

-- CreateIndex
CREATE INDEX "Call_priority_idx" ON "Call"("priority");

-- CreateIndex
CREATE INDEX "Call_assignedToId_idx" ON "Call"("assignedToId");

-- CreateIndex
CREATE INDEX "Call_openedById_idx" ON "Call"("openedById");

-- CreateIndex
CREATE INDEX "Call_locationId_idx" ON "Call"("locationId");

-- CreateIndex
CREATE INDEX "Call_categoryId_idx" ON "Call"("categoryId");

-- CreateIndex
CREATE INDEX "Call_requesterId_idx" ON "Call"("requesterId");

-- CreateIndex
CREATE INDEX "Call_requiredLevel_idx" ON "Call"("requiredLevel");

-- CreateIndex
CREATE INDEX "CallSkill_callId_idx" ON "CallSkill"("callId");

-- CreateIndex
CREATE INDEX "CallSkill_skillId_idx" ON "CallSkill"("skillId");

-- CreateIndex
CREATE UNIQUE INDEX "CallSkill_callId_skillId_key" ON "CallSkill"("callId", "skillId");

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

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechnicianSkill" ADD CONSTRAINT "TechnicianSkill_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechnicianSkill" ADD CONSTRAINT "TechnicianSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategorySkill" ADD CONSTRAINT "CategorySkill_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategorySkill" ADD CONSTRAINT "CategorySkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Call" ADD CONSTRAINT "Call_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Call" ADD CONSTRAINT "Call_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Call" ADD CONSTRAINT "Call_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "Requester"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Call" ADD CONSTRAINT "Call_openedById_fkey" FOREIGN KEY ("openedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Call" ADD CONSTRAINT "Call_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallSkill" ADD CONSTRAINT "CallSkill_callId_fkey" FOREIGN KEY ("callId") REFERENCES "Call"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallSkill" ADD CONSTRAINT "CallSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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
