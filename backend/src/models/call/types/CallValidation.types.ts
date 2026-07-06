import { Prisma } from "../../../../generated/prisma/client.js";

type EligibleTechnician = Prisma.UserGetPayload<{
  select: {
    id: true;
    name: true;
    level: true;
    userAreas: {
      select: {
        areaId: true;
      };
    };
  };
}>;

type Technician = Prisma.UserGetPayload<{
  select: {
    id: true;
    name: true;
    level: true;
    userAreas: {
      select: {
        areaId: true;
      };
    };
  };
}>;

export interface AssignmentResult {
  responsible: {
    id: string;
    name: string;
  } | null;

  assistants: {
    id: string;
    name: string;
  }[];
}

export type NotificationPayload = {
  callId: string;
  title: string;
  responsibleId: string;
  assistantsIds: string[];
};

export type CoverageValidationResult =
  | {
      success: true;
      eligibleTechnicians: EligibleTechnician[];
      coveredAreas: string[];
      candidateTechnicians: Technician[];
    }
  | {
      success: false;
      message: string;
      missingAreas: string[];
    };

export type ResponsibleValidationResult =
  | {
      success: true;
      user: EligibleTechnician;
      coveredAreas: string[];
      missingAreas: string[];
      needsAssistants: boolean;
    }
  | {
      success: false;
      message: string;
    }
  | null;
