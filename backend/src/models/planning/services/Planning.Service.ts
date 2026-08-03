import { injectable } from "tsyringe";

import { prisma } from "../../../config/db/database.js";

import { AppError } from "../../../shared/errors/AppError.js";

import {
  ListPlanningsParamsDTO,
  PlanningParamsDTO,
  UpdatePlanningTeamDTO,
} from "../schemas/Planning.schema.js";

@injectable()
export class PlanningService {
  updatePlanningTeam = async (
    { callId }: PlanningParamsDTO,
    data: UpdatePlanningTeamDTO,
    updatedById: string,
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

      await tx.callHistory.create({
        data: {
          callId,
          userId: updatedById,
          action: "PLANNING_UPDATED",
          observation: `Equipe do planejamento atualizada. Responsável: ${responsible.name}. Auxiliares: ${
            uniqueAssistantIds.length > 0
              ? technicians
                  .filter((technician) =>
                    uniqueAssistantIds.includes(technician.id),
                  )
                  .map((technician) => technician.name)
                  .join(", ")
              : "Nenhum"
          }.`,
        },
      });
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

  confirmPlanning = async (
    { callId }: PlanningParamsDTO,
    confirmedById: string,
  ) => {
    return prisma.$transaction(async (tx) => {
      const call = await tx.call.findUnique({
        where: {
          id: callId,
        },
        select: {
          id: true,
          title: true,
          protocol: true,
          status: true,
          openedById: true,

          callAreas: {
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

      if (!call) {
        throw new AppError(404, "Chamado não encontrado.");
      }

      if (call.status !== "PLANNING") {
        throw new AppError(
          400,
          "Somente chamados em planejamento podem ser confirmados.",
        );
      }

      const planning = await tx.callPlanning.findUnique({
        where: {
          callId,
        },
        select: {
          id: true,
          status: true,

          teamMembers: {
            select: {
              id: true,
              role: true,
              technicianId: true,

              technician: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
                  isTechnician: true,

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
              },
            },
          },
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
          "Somente planejamentos em rascunho podem ser confirmados.",
        );
      }

      const responsibleMember = planning.teamMembers.find(
        (member) => member.role === "RESPONSIBLE",
      );

      if (!responsibleMember) {
        throw new AppError(
          400,
          "Defina um responsável antes de confirmar o planejamento.",
        );
      }

      const assistantMembers = planning.teamMembers.filter(
        (member) => member.role === "ASSISTANT",
      );

      const teamMembers = [responsibleMember, ...assistantMembers];

      const technicianIds = teamMembers.map((member) => member.technicianId);

      const uniqueTechnicianIds = [...new Set(technicianIds)];

      if (uniqueTechnicianIds.length !== technicianIds.length) {
        throw new AppError(
          400,
          "Existem técnicos repetidos na equipe do planejamento.",
        );
      }

      if (technicianIds.includes(call.openedById)) {
        throw new AppError(
          400,
          "Quem criou o chamado não pode participar da equipe.",
        );
      }

      const invalidTechnician = teamMembers.find(
        (member) =>
          member.technician.role !== "TECHNICIAN" ||
          !member.technician.isTechnician,
      );

      if (invalidTechnician) {
        throw new AppError(
          400,
          `${invalidTechnician.technician.name} não é um técnico válido.`,
        );
      }

      if (call.callAreas.length === 0) {
        throw new AppError(400, "O chamado não possui áreas vinculadas.");
      }

      const coveredAreaIds = new Set<string>();

      teamMembers.forEach((member) => {
        member.technician.userAreas.forEach((userArea) => {
          coveredAreaIds.add(userArea.areaId);
        });
      });

      const uncoveredAreas = call.callAreas.filter(
        (callArea) => !coveredAreaIds.has(callArea.areaId),
      );

      if (uncoveredAreas.length > 0) {
        const uncoveredAreaNames = uncoveredAreas.map(
          (callArea) => callArea.area.name,
        );

        throw new AppError(
          400,
          uncoveredAreaNames.length === 1
            ? `A equipe não cobre mais a área ${uncoveredAreaNames[0]}.`
            : `A equipe não cobre mais as áreas ${uncoveredAreaNames.join(", ")}.`,
        );
      }

      const activeStatuses = [
        "OPEN",
        "READY",
        "IN_PROGRESS",
        "WAITING_PARTS",
        "HELP_REQUESTED",
      ] as const;

      const callsAsResponsible = await tx.call.findMany({
        where: {
          id: {
            not: callId,
          },

          assignedToId: {
            in: technicianIds,
          },

          status: {
            in: [...activeStatuses],
          },
        },
        select: {
          id: true,
          title: true,
          assignedToId: true,
        },
      });

      const assistantAssignments = await tx.callAssistant.findMany({
        where: {
          technicianId: {
            in: technicianIds,
          },

          callId: {
            not: callId,
          },
        },
        select: {
          callId: true,
          technicianId: true,
        },
      });

      const assistantCallIds = [
        ...new Set(assistantAssignments.map((assignment) => assignment.callId)),
      ];

      const activeAssistantCalls =
        assistantCallIds.length > 0
          ? await tx.call.findMany({
              where: {
                id: {
                  in: assistantCallIds,
                },

                status: {
                  in: [...activeStatuses],
                },
              },
              select: {
                id: true,
                title: true,
              },
            })
          : [];

      const activeAssistantCallIds = new Set(
        activeAssistantCalls.map((activeCall) => activeCall.id),
      );

      const unavailableTechnicianIds = new Set<string>();

      callsAsResponsible.forEach((activeCall) => {
        if (activeCall.assignedToId) {
          unavailableTechnicianIds.add(activeCall.assignedToId);
        }
      });

      assistantAssignments.forEach((assignment) => {
        if (activeAssistantCallIds.has(assignment.callId)) {
          unavailableTechnicianIds.add(assignment.technicianId);
        }
      });

      if (unavailableTechnicianIds.size > 0) {
        const unavailableNames = teamMembers
          .filter((member) => unavailableTechnicianIds.has(member.technicianId))
          .map((member) => member.technician.name);

        throw new AppError(
          409,
          unavailableNames.length === 1
            ? `${unavailableNames[0]} não está mais disponível. Atualize a equipe antes de confirmar.`
            : `Os técnicos ${unavailableNames.join(", ")} não estão mais disponíveis. Atualize a equipe antes de confirmar.`,
        );
      }

      await tx.callAssistant.deleteMany({
        where: {
          callId,
        },
      });

      if (assistantMembers.length > 0) {
        await tx.callAssistant.createMany({
          data: assistantMembers.map((member) => ({
            callId,
            technicianId: member.technicianId,
            addedById: confirmedById,
          })),
        });
      }

      const updatedCall = await tx.call.update({
        where: {
          id: callId,
        },
        data: {
          assignedToId: responsibleMember.technicianId,
          status: "READY",
        },
        select: {
          id: true,
          title: true,
          protocol: true,
          status: true,

          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      const updatedPlanning = await tx.callPlanning.update({
        where: {
          id: planning.id,
        },
        data: {
          status: "CONFIRMED",
          confirmedById,
          confirmedAt: new Date(),
        },
        select: {
          id: true,
          status: true,
          confirmedAt: true,
          updatedAt: true,

          confirmedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      const assistantNames = assistantMembers.map(
        (member) => member.technician.name,
      );

      await tx.callHistory.create({
        data: {
          callId,
          userId: confirmedById,
          action: "PLANNING_CONFIRMED",
          observation: `Planejamento confirmado. Responsável: ${
            responsibleMember.technician.name
          }. Auxiliares: ${
            assistantNames.length > 0 ? assistantNames.join(", ") : "Nenhum"
          }.`,
        },
      });

      await tx.callHistory.create({
        data: {
          callId,
          userId: confirmedById,
          action: "ASSIGNED",
          observation: `Responsável definido: ${responsibleMember.technician.name}.`,
        },
      });

      await tx.callHistory.create({
        data: {
          callId,
          userId: confirmedById,
          action: "READY_FOR_EXECUTION",
          observation:
            "Chamado liberado para execução e aguardando início do responsável.",
        },
      });

      return {
        call: {
          ...updatedCall,
          assistants: assistantMembers.map((member) => member.technician),
        },

        planning: updatedPlanning,
      };
    });
  };

  listAllPlannings = async ({
    page,
    limit,
    search,
  }: ListPlanningsParamsDTO) => {
    const normalizedSearch = search?.trim() || undefined;

    const where = {
      status: "DRAFT" as const,

      call: {
        is: {
          status: "PLANNING" as const,

          ...(normalizedSearch
            ? {
                OR: [
                  {
                    title: {
                      contains: normalizedSearch,
                      mode: "insensitive" as const,
                    },
                  },

                  {
                    openedBy: {
                      is: {
                        name: {
                          contains: normalizedSearch,
                          mode: "insensitive" as const,
                        },
                      },
                    },
                  },
                ],
              }
            : {}),
        },
      },

      ...(normalizedSearch
        ? {
            OR: [
              {
                call: {
                  is: {
                    title: {
                      contains: normalizedSearch,
                      mode: "insensitive" as const,
                    },
                  },
                },
              },

              {
                createdBy: {
                  is: {
                    name: {
                      contains: normalizedSearch,
                      mode: "insensitive" as const,
                    },
                  },
                },
              },

              {
                teamMembers: {
                  some: {
                    technician: {
                      is: {
                        name: {
                          contains: normalizedSearch,
                          mode: "insensitive" as const,
                        },
                      },
                    },
                  },
                },
              },
            ],
          }
        : {}),
    };

    const skip = (page - 1) * limit;

    const total = await prisma.callPlanning.count({
      where,
    });

    const plannings = await prisma.callPlanning.findMany({
      where,

      skip,
      take: limit,

      orderBy: [
        {
          updatedAt: "desc",
        },
        {
          id: "desc",
        },
      ],

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

            callAreas: {
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

    const formattedPlannings = plannings.map((planning) => {
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

        call: {
          id: planning.call.id,
          title: planning.call.title,
          status: planning.call.status,
          priority: planning.call.priority,
          serviceType: planning.call.serviceType,

          areas: planning.call.callAreas.map((callArea) => callArea.area),
        },

        createdBy: planning.createdBy,
        confirmedBy: planning.confirmedBy,
        confirmedAt: planning.confirmedAt,

        responsible: responsibleMember?.technician ?? null,

        assistants: assistantMembers.map((member) => member.technician),

        createdAt: planning.createdAt,
        updatedAt: planning.updatedAt,
      };
    });

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      plannings: formattedPlannings,
    };
  };

  findPlanningDetails = async ({ callId }: PlanningParamsDTO) => {
    const planning = await prisma.callPlanning.findUnique({
      where: {
        callId,
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

        call: {
          select: {
            id: true,
            protocol: true,
            title: true,
            description: true,

            status: true,
            priority: true,
            serviceType: true,

            openedById: true,
            createdAt: true,
            updatedAt: true,

            location: {
              select: {
                id: true,
                name: true,

                parent: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },

            callAreas: {
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
        },

        teamMembers: {
          select: {
            id: true,
            role: true,
            technicianId: true,

            technician: {
              select: {
                id: true,
                name: true,
                email: true,

                role: true,
                isTechnician: true,

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
            },
          },
        },
      },
    });

    if (!planning) {
      throw new AppError(
        404,
        "O planejamento deste chamado não foi encontrado.",
      );
    }

    if (planning.call.status !== "PLANNING") {
      throw new AppError(400, "Este chamado não está mais em planejamento.");
    }

    if (planning.status !== "DRAFT") {
      throw new AppError(
        400,
        "Somente planejamentos em andamento podem ser editados.",
      );
    }

    if (planning.call.callAreas.length === 0) {
      throw new AppError(400, "O chamado não possui áreas vinculadas.");
    }

    const technicians = await prisma.user.findMany({
      where: {
        role: "TECHNICIAN",
        isTechnician: true,

        id: {
          not: planning.call.openedById,
        },
      },

      orderBy: {
        name: "asc",
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

    const technicianIds = technicians.map((technician) => technician.id);

    const activeStatuses = [
      "OPEN",
      "READY",
      "IN_PROGRESS",
      "WAITING_PARTS",
      "HELP_REQUESTED",
    ] as const;

    const callsAsResponsible =
      technicianIds.length > 0
        ? await prisma.call.findMany({
            where: {
              id: {
                not: callId,
              },

              assignedToId: {
                in: technicianIds,
              },

              status: {
                in: [...activeStatuses],
              },
            },

            select: {
              id: true,
              protocol: true,
              title: true,
              status: true,
              assignedToId: true,
            },
          })
        : [];

    const assistantAssignments =
      technicianIds.length > 0
        ? await prisma.callAssistant.findMany({
            where: {
              technicianId: {
                in: technicianIds,
              },

              callId: {
                not: callId,
              },
            },

            select: {
              callId: true,
              technicianId: true,
            },
          })
        : [];

    const assistantCallIds = [
      ...new Set(assistantAssignments.map((assignment) => assignment.callId)),
    ];

    const activeAssistantCalls =
      assistantCallIds.length > 0
        ? await prisma.call.findMany({
            where: {
              id: {
                in: assistantCallIds,
              },

              status: {
                in: [...activeStatuses],
              },
            },

            select: {
              id: true,
              protocol: true,
              title: true,
              status: true,
            },
          })
        : [];

    const activeAssistantCallMap = new Map(
      activeAssistantCalls.map((activeCall) => [activeCall.id, activeCall]),
    );

    const responsibleCallByTechnician = new Map(
      callsAsResponsible
        .filter(
          (
            activeCall,
          ): activeCall is typeof activeCall & {
            assignedToId: string;
          } => Boolean(activeCall.assignedToId),
        )
        .map((activeCall) => [activeCall.assignedToId, activeCall]),
    );

    const assistantCallByTechnician = new Map<
      string,
      (typeof activeAssistantCalls)[number]
    >();

    assistantAssignments.forEach((assignment) => {
      const activeCall = activeAssistantCallMap.get(assignment.callId);

      if (activeCall) {
        assistantCallByTechnician.set(assignment.technicianId, activeCall);
      }
    });

    const selectedMemberByTechnicianId = new Map(
      planning.teamMembers.map((member) => [member.technicianId, member]),
    );

    const availableTechnicians = technicians.map((technician) => {
      const responsibleCall = responsibleCallByTechnician.get(technician.id);

      const assistantCall = assistantCallByTechnician.get(technician.id);

      const activeCall = responsibleCall ?? assistantCall ?? null;

      const selectedMember = selectedMemberByTechnicianId.get(technician.id);

      return {
        id: technician.id,
        name: technician.name,
        email: technician.email,

        userAreas: technician.userAreas,

        isAvailable: activeCall === null,

        unavailableReason: activeCall
          ? responsibleCall
            ? "RESPONSIBLE_IN_ANOTHER_CALL"
            : "ASSISTANT_IN_ANOTHER_CALL"
          : null,

        activeCall: activeCall
          ? {
              id: activeCall.id,
              protocol: activeCall.protocol,
              title: activeCall.title,
              status: activeCall.status,
            }
          : null,

        planningRole: selectedMember?.role ?? null,
      };
    });

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

      call: {
        id: planning.call.id,
        protocol: planning.call.protocol,
        title: planning.call.title,
        description: planning.call.description,

        status: planning.call.status,
        priority: planning.call.priority,
        serviceType: planning.call.serviceType,

        location: planning.call.location,

        areas: planning.call.callAreas.map((callArea) => callArea.area),

        createdAt: planning.call.createdAt,
        updatedAt: planning.call.updatedAt,
      },

      createdBy: planning.createdBy,
      confirmedBy: planning.confirmedBy,
      confirmedAt: planning.confirmedAt,

      responsible: responsibleMember?.technician ?? null,

      assistants: assistantMembers.map((member) => member.technician),

      technicians: availableTechnicians,

      createdAt: planning.createdAt,
      updatedAt: planning.updatedAt,
    };
  };
}
