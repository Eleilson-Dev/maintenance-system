import { Prisma } from "../../../../generated/prisma/client.js";

type UserWithAreas = Prisma.UserGetPayload<{
  include: { userAreas: true };
}>;

export type CoverageValidationResult =
  | {
      success: true;
      technicians: any[];
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
      user: UserWithAreas;
      coveredAreas: string[];
      missingAreas: string[];
      needsAssistants: boolean;
    }
  | {
      success: false;
      message: string;
    }
  | null;
