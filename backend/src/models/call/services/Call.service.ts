import { injectable } from "tsyringe";
import { prisma } from "../../../config/db/database.js";
import { AppError } from "../../../shared/errors/AppError.js";
import { CreateCallDTO } from "../schemas/Call.schema.js";
import { CoverageValidationResult } from "../types/CallValidation.types.js";

@injectable()
export class CallService {
  previewCall = async (callData: CreateCallDTO) => {
    const coverage = await this.validateCoverage(callData);

    if (!coverage.success) {
      return {
        success: false,
        step: "coverage",
        message: coverage.message,
        missingAreas: coverage.missingAreas,
      };
    }

    const rules = this.validateAssignmentRules(callData);

    const result = {
      success: true,
      coverage: {
        technicians: coverage.eligibleTechnicians,
        coveredAreas: coverage.coveredAreas,
      },
      rules,
    };

    return result;
  };

  private validateCoverage = async (
    callData: CreateCallDTO,
  ): Promise<CoverageValidationResult> => {
    const candidateTechnicians = await prisma.user.findMany({
      where: {
        userAreas: {
          some: {
            areaId: {
              in: callData.areaIds,
            },
          },
        },
      },
      select: {
        id: true,
        name: true,
        level: true,
        userAreas: {
          select: {
            areaId: true,
          },
        },
      },
    });

    const LEVEL_ORDER = {
      JUNIOR: 1,
      MID: 2,
      SENIOR: 3,
      SPECIALIST: 4,
    } as const;

    const eligibleTechnicians = candidateTechnicians.filter(
      (technician) =>
        LEVEL_ORDER[technician.level] >= LEVEL_ORDER[callData.requiredLevel],
    );

    console.log(eligibleTechnicians);

    const coveredAreas = new Set<string>();

    eligibleTechnicians.forEach((technician) => {
      technician.userAreas.forEach((technicianArea) => {
        const technicianCoversThisArea = callData.areaIds.includes(
          technicianArea.areaId,
        );

        if (technicianCoversThisArea) {
          coveredAreas.add(technicianArea.areaId);
        }
      });
    });

    const missingAreas = callData.areaIds.filter(
      (areaId) => !coveredAreas.has(areaId),
    );

    if (missingAreas.length > 0) {
      return {
        success: false,
        message:
          "Não existem técnicos com área e nível suficientes para atender todas as áreas do chamado.",
        missingAreas,
      };
    }

    return {
      success: true,
      eligibleTechnicians,
      coveredAreas: [...coveredAreas],
    };
  };

  private validateAssignmentRules = (callData: CreateCallDTO) => {
    const isMultiAreaCall = callData.areaIds.length > 1;

    const requiresResponsible = isMultiAreaCall;
    const requiresTeam = isMultiAreaCall;

    return {
      requiresResponsible,
      requiresTeam,
    };
  };

  createAdminCall = async (userId: string, callData: CreateCallDTO) => {
    try {
      console.log("🚀 Iniciando criação do chamado");
    } catch (error) {
      console.log("💥 Error:", error);

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(500, "Internal server error.");
    }
  };

  getCalls = async () => {
    try {
      const allCalls = await prisma.call.findMany({
        include: { sector: true, openedBy: true, assignedTo: true },
        orderBy: { createdAt: "desc" },
      });

      return allCalls;
    } catch (error) {
      console.log(error);

      throw new AppError(400, "Error searching all sectors.");
    }
  };
}
