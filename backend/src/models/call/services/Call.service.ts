import { injectable } from "tsyringe";
import { prisma } from "../../../config/db/database.js";
import { AppError } from "../../../shared/errors/AppError.js";
import { CreateCallDTO } from "../schemas/Call.schema.js";
import {
  AssignmentResult,
  CoverageValidationResult,
} from "../types/CallValidation.types.js";
import { generateProtocol } from "../utils/generateProtocol.js";
import { CallStatus, Prisma } from "../../../../generated/prisma/client.js";

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

  createAdminCall = async (userId: string, callData: CreateCallDTO) => {
    try {
      const assignment = await this.validateAssignment(callData);

      const result = await prisma.$transaction(async (tx) => {
        const status = await this.getInitialStatus(tx, assignment);

        const createdCall = await tx.call.create({
          data: {
            title: callData.title,
            description: callData.description,
            priority: callData.priority,
            serviceType: callData.serviceType,
            requiredLevel: callData.requiredLevel,
            locationId: callData.locationId,
            openedById: userId,
            assignedToId: assignment.responsible?.id ?? null,
            status,
          },
        });

        const sideEffects = {
          history: [] as any[],
          notifications: [] as any[],
        };

        await tx.callArea.createMany({
          data: callData.areaIds.map((areaId) => ({
            callId: createdCall.id,
            areaId,
          })),
        });

        if (assignment.assistants.length > 0) {
          await tx.callAssistant.createMany({
            data: assignment.assistants.map((assistant) => ({
              callId: createdCall.id,
              technicianId: assistant.id,
              addedById: userId,
            })),
          });
        }

        sideEffects.history.push({
          callId: createdCall.id,
          userId,
          action: "CREATED",
          observation: "Chamado criado.",
        });

        if (assignment.responsible) {
          sideEffects.history.push({
            callId: createdCall.id,
            userId,
            action: "ASSIGNED",
            observation: "Responsável atribuído ao chamado.",
          });

          sideEffects.notifications.push({
            userId: assignment.responsible.id,
            callId: createdCall.id,
            type: "CALL_ASSIGNED",
            title: "Novo chamado atribuído",
            message: `Você foi designado como responsável pelo chamado "${createdCall.title}".`,
          });
        }

        if (assignment.assistants.length > 0) {
          sideEffects.history.push(
            ...assignment.assistants.map((assistant) => ({
              callId: createdCall.id,
              userId,
              action: "ASSISTANT_ADDED",
              observation: `${assistant.name} adicionado como auxiliar.`,
            })),
          );

          sideEffects.notifications.push(
            ...assignment.assistants.map((assistant) => ({
              userId: assistant.id,
              callId: createdCall.id,
              type: "NEW_CALL",
              title: "Você foi adicionado à equipe",
              message: `Você foi adicionado como auxiliar no chamado "${createdCall.title}".`,
            })),
          );
        }

        return {
          call: createdCall,
          sideEffects,
        };
      });

      const { sideEffects } = result;

      if (sideEffects.notifications.length > 0) {
        await Promise.allSettled(
          sideEffects.notifications.map((n) =>
            prisma.notification.create({ data: n }),
          ),
        );
      }

      if (sideEffects.history.length > 0) {
        await prisma.callHistory.createMany({
          data: sideEffects.history,
        });
      }

      return result.call;
    } catch (error) {
      console.log("💥 Error:", error);

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(500, "Internal server error.");
    }
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

    const coveredAreas = new Set<string>();

    eligibleTechnicians.forEach((technician) => {
      technician.userAreas.forEach((technicianArea) => {
        if (callData.areaIds.includes(technicianArea.areaId)) {
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
      candidateTechnicians,
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

  private validateAssignment = async (callData: CreateCallDTO) => {
    const coverage = await this.validateCoverage(callData);

    if (!coverage.success) {
      throw new AppError(400, coverage.message);
    }

    const isMultiArea = callData.areaIds.length > 1;

    let responsible = null;

    if (callData.assignedToId) {
      responsible = coverage.eligibleTechnicians.find(
        (user) => user.id === callData.assignedToId,
      );

      if (!responsible) {
        throw new AppError(
          400,
          "Responsável inválido ou sem permissão para atender o chamado.",
        );
      }
    }

    if (isMultiArea && !responsible) {
      throw new AppError(
        400,
        "Chamados com múltiplas áreas devem possuir um responsável.",
      );
    }

    if (!responsible && !isMultiArea) {
      return {
        responsible: null,
        assistants: [],
        coveredAreas: [],
      };
    }

    const assistantIds = callData.assistantIds ?? [];

    if (new Set(assistantIds).size !== assistantIds.length) {
      throw new AppError(
        400,
        "Existem técnicos duplicados na equipe de apoio.",
      );
    }

    if (responsible && assistantIds.includes(responsible.id)) {
      throw new AppError(
        400,
        "O responsável não pode fazer parte da equipe de apoio.",
      );
    }

    const coveredAreas = new Set<string>();

    responsible?.userAreas.forEach((area) => {
      if (callData.areaIds.includes(area.areaId)) {
        coveredAreas.add(area.areaId);
      }
    });

    const assistants = assistantIds.map((assistantId) => {
      const assistant = coverage.candidateTechnicians.find(
        (user) => user.id === assistantId,
      );

      if (!assistant) {
        throw new AppError(
          400,
          "O auxiliar não atua em nenhuma das áreas do chamado.",
        );
      }

      const assistantAreas = assistant.userAreas
        .map((area) => area.areaId)
        .filter((areaId) => callData.areaIds.includes(areaId));

      const coversMissingArea = assistantAreas.some(
        (areaId) => !coveredAreas.has(areaId),
      );

      if (coversMissingArea) {
        const eligible = coverage.eligibleTechnicians.some(
          (user) => user.id === assistant.id,
        );

        if (!eligible) {
          throw new AppError(
            400,
            "O auxiliar não possui nível suficiente para cobrir uma das áreas pendentes do chamado.",
          );
        }
      }

      assistantAreas.forEach((areaId) => coveredAreas.add(areaId));

      return assistant;
    });

    const uncoveredAreas = callData.areaIds.filter(
      (areaId) => !coveredAreas.has(areaId),
    );

    if (uncoveredAreas.length > 0) {
      throw new AppError(
        400,
        "A equipe selecionada não cobre todas as áreas do chamado.",
      );
    }

    return {
      responsible,
      assistants,
      coveredAreas: [...coveredAreas],
      uncoveredAreas,
    };
  };

  private getInitialStatus = async (
    tx: Prisma.TransactionClient,
    assignment: AssignmentResult,
  ): Promise<CallStatus> => {
    // Não existe responsável
    if (!assignment.responsible) {
      return "OPEN";
    }

    const technicianIds = [
      assignment.responsible.id,
      ...assignment.assistants.map((a) => a.id),
    ];

    const busyTechnicians = await tx.call.findFirst({
      where: {
        status: "IN_PROGRESS",
        OR: [
          {
            assignedToId: {
              in: technicianIds,
            },
          },
          {
            assistants: {
              some: {
                technicianId: {
                  in: technicianIds,
                },
              },
            },
          },
        ],
      },
    });

    return busyTechnicians ? "QUEUED" : "IN_PROGRESS";
  };

  getCalls = async (page = 1, limit = 20) => {
    const skip = (page - 1) * limit;

    const calls = await prisma.call.findMany({
      select: {
        id: true,
        protocol: true,
        title: true,
        status: true,
        priority: true,
        createdAt: true,

        location: {
          select: {
            id: true,
            name: true,
          },
        },

        openedBy: {
          select: {
            id: true,
            name: true,
          },
        },

        assignedTo: {
          select: {
            id: true,
            name: true,
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },

      take: limit,
      skip,
    });

    return calls;
  };
}
