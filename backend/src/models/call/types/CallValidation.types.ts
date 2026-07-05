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
export type CoverageValidationResult =
  | {
      success: true;
      eligibleTechnicians: EligibleTechnician[];
      coveredAreas: string[];
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
