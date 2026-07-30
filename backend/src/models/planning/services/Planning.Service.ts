import { injectable } from "tsyringe";

import { prisma } from "../../../config/db/database.js";

import { AppError } from "../../../shared/errors/AppError.js";

import {
  PlanningParamsDTO,
  UpdatePlanningTeamDTO,
} from "../schemas/Planning.schema.js";

@injectable()
export class PlanningService {
  updatePlanningTeam = async (
    { callId }: PlanningParamsDTO,
    data: UpdatePlanningTeamDTO,
  ) => {
    const call = await prisma.call.findUnique({
      where: {
        id: callId,
      },
      select: {
        id: true,
        status: true,
        openedById: true,
      },
    });

    if (!call) {
      throw new AppError(404, "Chamado não encontrado.");
    }

    if (call.status !== "PLANNING") {
      throw new AppError(
        400,
        "A equipe só pode ser definida enquanto o chamado estiver em planejamento.",
      );
    }

    const planning = await prisma.callPlanning.findUnique({
      where: {
        callId,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!planning) {
      throw new AppError(
        404,
        "O planejamento deste chamado não foi encontrado.",
      );
    }

    if (planning.status !== "DRAFT") {
      throw new AppError(
        400,
        "Somente planejamentos em rascunho podem ter a equipe alterada.",
      );
    }

    if (call.openedById === data.responsibleId) {
      throw new AppError(
        400,
        "Quem criou o chamado não pode ser definido como responsável.",
      );
    }

    if (data.assistantIds.includes(call.openedById)) {
      throw new AppError(
        400,
        "Quem criou o chamado não pode participar como auxiliar.",
      );
    }

    if (data.assistantIds.includes(data.responsibleId)) {
      throw new AppError(
        400,
        "O responsável não pode também participar como auxiliar.",
      );
    }

    const uniqueAssistantIds = [...new Set(data.assistantIds)];

    if (uniqueAssistantIds.length !== data.assistantIds.length) {
      throw new AppError(400, "Não é permitido informar auxiliares repetidos.");
    }

    const technicianIds = [data.responsibleId, ...uniqueAssistantIds];

    const technicians = await prisma.user.findMany({
      where: {
        id: {
          in: technicianIds,
        },
        role: "TECHNICIAN",
        isTechnician: true,
      },
      select: {
        id: true,
        name: true,
        email: true,

        userAreas: {
          select: {
            areaId: true,

            area: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (technicians.length !== technicianIds.length) {
      const foundTechnicianIds = new Set(
        technicians.map((technician) => technician.id),
      );

      const invalidTechnicianIds = technicianIds.filter(
        (technicianId) => !foundTechnicianIds.has(technicianId),
      );

      throw new AppError(
        400,
        `Um ou mais técnicos não foram encontrados: ${invalidTechnicianIds.join(", ")}.`,
      );
    }

    const responsible = technicians.find(
      (technician) => technician.id === data.responsibleId,
    );

    if (!responsible) {
      throw new AppError(400, "O técnico responsável não foi encontrado.");
    }

    const callAreas = await prisma.callArea.findMany({
      where: {
        callId,
      },
      select: {
        areaId: true,

        area: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (callAreas.length === 0) {
      throw new AppError(400, "O chamado não possui áreas vinculadas.");
    }

    const callAreaIds = new Set(callAreas.map((callArea) => callArea.areaId));

    const coveredAreaIds = new Set<string>();

    technicians.forEach((technician) => {
      technician.userAreas.forEach((userArea) => {
        if (callAreaIds.has(userArea.areaId)) {
          coveredAreaIds.add(userArea.areaId);
        }
      });
    });

    const uncoveredAreas = callAreas.filter(
      (callArea) => !coveredAreaIds.has(callArea.areaId),
    );

    if (uncoveredAreas.length > 0) {
      const uncoveredAreaNames = uncoveredAreas.map(
        (callArea) => callArea.area.name,
      );

      throw new AppError(
        400,
        uncoveredAreaNames.length === 1
          ? `A equipe selecionada não cobre a área ${uncoveredAreaNames[0]}.`
          : `A equipe selecionada não cobre as áreas ${uncoveredAreaNames.join(", ")}.`,
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.callPlanningMember.deleteMany({
        where: {
          planningId: planning.id,
        },
      });

      await tx.callPlanningMember.create({
        data: {
          planningId: planning.id,
          technicianId: data.responsibleId,
          role: "RESPONSIBLE",
        },
      });

      if (uniqueAssistantIds.length > 0) {
        await tx.callPlanningMember.createMany({
          data: uniqueAssistantIds.map((technicianId) => ({
            planningId: planning.id,
            technicianId,
            role: "ASSISTANT" as const,
          })),
        });
      }
    });

    const updatedPlanning = await prisma.callPlanning.findUnique({
      where: {
        id: planning.id,
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
        updatedAt: true,

        teamMembers: {
          select: {
            id: true,
            role: true,

            technician: {
              select: {
                id: true,
                name: true,
                email: true,

                userAreas: {
                  select: {
                    area: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!updatedPlanning) {
      throw new AppError(
        500,
        "A equipe foi salva, mas não foi possível carregar o planejamento.",
      );
    }

    const responsibleMember = updatedPlanning.teamMembers.find(
      (member) => member.role === "RESPONSIBLE",
    );

    const assistantMembers = updatedPlanning.teamMembers.filter(
      (member) => member.role === "ASSISTANT",
    );

    return {
      id: updatedPlanning.id,
      status: updatedPlanning.status,
      createdAt: updatedPlanning.createdAt,
      updatedAt: updatedPlanning.updatedAt,
      responsible: responsibleMember?.technician ?? null,
      assistants: assistantMembers.map((member) => member.technician),
    };
  };

  listAllPlannings = async () => {
    const plannings = await prisma.callPlanning.findMany({
      orderBy: {
        updatedAt: "desc",
      },
      select: {
        id: true,
        status: true,
        plannedStartAt: true,
        plannedEndAt: true,
        instructions: true,
        observations: true,
        requiresShutdown: true,
        requiresPermit: true,
        requiresParts: true,
        requiresTools: true,
        confirmedAt: true,
        createdAt: true,
        updatedAt: true,

        call: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            serviceType: true,
          },
        },

        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },

        confirmedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },

        teamMembers: {
          select: {
            id: true,
            role: true,

            technician: {
              select: {
                id: true,
                name: true,
                email: true,

                userAreas: {
                  select: {
                    area: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    return plannings.map((planning) => {
      const responsibleMember = planning.teamMembers.find(
        (member) => member.role === "RESPONSIBLE",
      );

      const assistantMembers = planning.teamMembers.filter(
        (member) => member.role === "ASSISTANT",
      );

      return {
        id: planning.id,
        status: planning.status,

        plannedStartAt: planning.plannedStartAt,
        plannedEndAt: planning.plannedEndAt,

        instructions: planning.instructions,
        observations: planning.observations,

        requirements: {
          requiresShutdown: planning.requiresShutdown,
          requiresPermit: planning.requiresPermit,
          requiresParts: planning.requiresParts,
          requiresTools: planning.requiresTools,
        },

        call: planning.call,

        createdBy: planning.createdBy,
        confirmedBy: planning.confirmedBy,
        confirmedAt: planning.confirmedAt,

        responsible: responsibleMember?.technician ?? null,

        assistants: assistantMembers.map((member) => member.technician),

        createdAt: planning.createdAt,
        updatedAt: planning.updatedAt,
      };
    });
  };
}
