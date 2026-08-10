import { injectable } from "tsyringe";
import { prisma } from "../../../config/db/database.js";
import { AppError } from "../../../shared/errors/AppError.js";
import { CreateCallDTO, PreviewCallDTO } from "../schemas/Call.schema.js";
import {
  CoverageValidationResult,
  GetCallsDTO,
} from "../types/CallValidation.types.js";
import { generateProtocol } from "../../../shared/utils/generateProtocol.js";
import { Prisma, ProtocolType } from "../../../../generated/prisma/client.js";

const DEFAULT_TECHNICIAN_LEVEL = "SENIOR" as const;

type CoverageInput = {
  areaIds: string[];
};

@injectable()
export class CallService {
  previewCall = async (callData: PreviewCallDTO) => {
    const coverage = await this.validateCoverage(callData);

    if (!coverage.success) {
      const missingAreas = await prisma.area.findMany({
        where: {
          id: {
            in: coverage.missingAreas,
          },
        },

        select: {
          id: true,
          name: true,
        },
      });

      return {
        success: false,
        step: "coverage",
        message:
          missingAreas.length === 1
            ? `A área ${missingAreas[0].name} não possui técnico disponível.`
            : `As áreas ${missingAreas
                .map((area) => area.name)
                .join(", ")} não possuem técnicos disponíveis.`,
        missingAreas,
      };
    }

    const rules = this.validateAssignmentRules(callData);

    return {
      success: true,
      coverage: {
        technicians: coverage.eligibleTechnicians,
        coveredAreas: coverage.coveredAreas,
      },
      rules,
    };
  };

  createAdminCall = async (userId: string, callData: CreateCallDTO) => {
    try {
      const coverage = await this.validateCoverage(callData);

      if (!coverage.success) {
        throw new AppError(400, coverage.message);
      }

      const requiresPlanning =
        callData.areaIds.length > 1 || callData.isPlanning;

      const createdCall = await prisma.$transaction(async (tx) => {
        const year = new Date().getFullYear();

        const counter = await tx.protocolCounter.upsert({
          where: {
            id: `CALL-${year}`,
          },
          update: {
            value: {
              increment: 1,
            },
          },
          create: {
            id: `CALL-${year}`,
            type: ProtocolType.CALL,
            year,
            value: 1,
          },
        });

        const protocol = generateProtocol(counter.value, "OS");

        const call = await tx.call.create({
          data: {
            protocol,
            title: callData.title,
            description: callData.description,
            priority: callData.priority,
            serviceType: callData.serviceType,
            requiredLevel: DEFAULT_TECHNICIAN_LEVEL,
            locationId: callData.locationId,
            openedById: userId,
            assignedToId: null,
            status: requiresPlanning ? "PLANNING" : "OPEN",
          },
          select: {
            id: true,
          },
        });
        await tx.callArea.createMany({
          data: callData.areaIds.map((areaId) => ({
            callId: call.id,
            areaId,
          })),
        });

        const planning = requiresPlanning
          ? await tx.callPlanning.create({
              data: {
                callId: call.id,
                createdById: userId,
                status: "DRAFT",
              },
              select: {
                id: true,
                status: true,
                createdAt: true,
              },
            })
          : null;

        await tx.callHistory.create({
          data: {
            callId: call.id,
            userId,
            action: "CREATED",
            observation: "Chamado criado.",
          },
        });

        if (requiresPlanning) {
          await tx.callHistory.create({
            data: {
              callId: call.id,
              userId,
              action: "PLANNING_STARTED",
              observation: "Planejamento do chamado iniciado.",
            },
          });
        }

        return {
          id: call.id,
          planning,
        };
      });

      const call = await prisma.call.findUnique({
        where: {
          id: createdCall.id,
        },
        select: {
          id: true,
          protocol: true,
          title: true,
          description: true,
          status: true,
          priority: true,
          serviceType: true,
          requiredLevel: true,
          createdAt: true,

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
      });

      if (!call) {
        throw new AppError(
          500,
          "Chamado criado, mas não foi possível carregar os dados.",
        );
      }

      return {
        ...call,
        planning: createdCall.planning,
      };
    } catch (error) {
      console.log("💥 Error:", error);

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(500, "Internal server error.");
    }
  };

  private validateCoverage = async (
    callData: CoverageInput,
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
        createdAt: true,

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

    const LEVEL_ORDER = {
      JUNIOR: 1,
      MID: 2,
      SENIOR: 3,
      SPECIALIST: 4,
    } as const;

    const eligibleTechnicians = candidateTechnicians.filter(
      (technician) =>
        LEVEL_ORDER[technician.level] >= LEVEL_ORDER[DEFAULT_TECHNICIAN_LEVEL],
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

  private validateAssignmentRules = (
    callData: Pick<PreviewCallDTO, "areaIds">,
  ) => {
    const isMultiAreaCall = callData.areaIds.length > 1;

    return {
      requiresResponsible: isMultiAreaCall,
      requiresTeam: isMultiAreaCall,
    };
  };

  getCalls = async ({
    page = 1,
    limit = 20,
    status,
    search,
    priority,
    level,
    areaId,
  }: GetCallsDTO) => {
    const skip = (page - 1) * limit;

    const normalizedSearch = search?.trim();

    const where: Prisma.CallWhereInput = {
      ...(priority && { priority }),

      ...(level && {
        requiredLevel: level,
      }),

      ...(areaId && {
        callAreas: {
          some: {
            areaId,
          },
        },
      }),

      ...(normalizedSearch && {
        OR: [
          {
            title: {
              contains: normalizedSearch,
              mode: Prisma.QueryMode.insensitive,
            },
          },
          {
            protocol: {
              contains: normalizedSearch,
              mode: Prisma.QueryMode.insensitive,
            },
          },
          {
            location: {
              name: {
                contains: normalizedSearch,
                mode: Prisma.QueryMode.insensitive,
              },
            },
          },
          {
            location: {
              parent: {
                name: {
                  contains: normalizedSearch,
                  mode: Prisma.QueryMode.insensitive,
                },
              },
            },
          },
          {
            callAreas: {
              some: {
                area: {
                  name: {
                    contains: normalizedSearch,
                    mode: Prisma.QueryMode.insensitive,
                  },
                },
              },
            },
          },
        ],
      }),
    };

    if (status === "ACTIVE") {
      where.status = {
        in: [
          "OPEN",
          "IN_PROGRESS",
          "READY",
          "WAITING_PARTS",
          "WAITING_APPROVAL",
          "HELP_REQUESTED",
        ],
      };
    } else if (status) {
      where.status = status;
    }

    const [calls, total] = await Promise.all([
      prisma.call.findMany({
        where,

        select: {
          id: true,
          protocol: true,
          title: true,
          status: true,
          priority: true,
          createdAt: true,
          serviceType: true,
          requiredLevel: true,
          description: true,

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
              email: true,
              level: true,
            },
          },

          assistants: {
            select: {
              technician: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  level: true,
                },
              },
            },
          },
        },

        orderBy: {
          createdAt: "desc",
        },

        skip,
        take: limit,
      }),

      prisma.call.count({
        where,
      }),
    ]);

    const formattedCalls = calls.map((call) => ({
      ...call,

      assistants: call.assistants.map((assistant) => assistant.technician),
    }));

    return {
      calls: formattedCalls,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  };

  listTechnicianServices = async (technicianId: string) => {
    const participationWhere: Prisma.CallWhereInput = {
      OR: [
        {
          assignedToId: technicianId,
        },

        {
          assistants: {
            some: {
              technicianId,
            },
          },
        },
      ],
    };

    const callSelect = {
      id: true,
      protocol: true,
      title: true,
      description: true,

      status: true,
      priority: true,
      serviceType: true,
      requiredLevel: true,

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
          area: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },

      assignedTo: {
        select: {
          id: true,
          name: true,
          email: true,
          level: true,
        },
      },

      assistants: {
        select: {
          technician: {
            select: {
              id: true,
              name: true,
              email: true,
              level: true,
            },
          },
        },
      },
    } satisfies Prisma.CallSelect;

    const [
      inProgressService,
      readyService,
      pausedServices,
      completedServices,
      pausedCount,
      completedCount,
    ] = await Promise.all([
      /*
       * Atendimento já iniciado.
       *
       * Tem prioridade sobre qualquer chamado READY.
       */
      prisma.call.findFirst({
        where: {
          ...participationWhere,

          status: "IN_PROGRESS",
        },

        select: callSelect,

        orderBy: {
          updatedAt: "desc",
        },
      }),

      /*
       * Chamado confirmado e pronto para iniciar.
       *
       * Só será usado se não houver nenhum IN_PROGRESS.
       */
      prisma.call.findFirst({
        where: {
          ...participationWhere,

          status: "READY",
        },

        select: callSelect,

        orderBy: {
          updatedAt: "desc",
        },
      }),

      /*
       * Prévia dos chamados pausados.
       */
      prisma.call.findMany({
        where: {
          ...participationWhere,

          status: "WAITING_PARTS",
        },

        select: callSelect,

        orderBy: {
          updatedAt: "desc",
        },

        take: 2,
      }),

      /*
       * Prévia dos últimos chamados concluídos.
       */
      prisma.call.findMany({
        where: {
          ...participationWhere,

          status: "COMPLETED",
        },

        select: callSelect,

        orderBy: {
          updatedAt: "desc",
        },

        take: 3,
      }),

      /*
       * Total real de chamados pausados.
       */
      prisma.call.count({
        where: {
          ...participationWhere,

          status: "WAITING_PARTS",
        },
      }),

      /*
       * Total real de chamados concluídos.
       */
      prisma.call.count({
        where: {
          ...participationWhere,

          status: "COMPLETED",
        },
      }),
    ]);

    /*
     * Se existir IN_PROGRESS, ele sempre será o atendimento atual.
     *
     * O READY só aparece quando ainda não existe atendimento iniciado.
     */
    const currentService = inProgressService ?? readyService;

    const formatCall = (
      call:
        | typeof currentService
        | (typeof pausedServices)[number]
        | (typeof completedServices)[number]
        | null,
    ) => {
      if (!call) {
        return null;
      }

      const participation =
        call.assignedTo?.id === technicianId
          ? ("RESPONSIBLE" as const)
          : ("ASSISTANT" as const);

      return {
        id: call.id,
        protocol: call.protocol,
        title: call.title,
        description: call.description,

        status: call.status,
        priority: call.priority,
        serviceType: call.serviceType,
        requiredLevel: call.requiredLevel,

        participation,

        location: call.location,

        areas: call.callAreas.map((callArea) => callArea.area),

        responsible: call.assignedTo,

        assistants: call.assistants.map((assistant) => assistant.technician),

        createdAt: call.createdAt,
        updatedAt: call.updatedAt,
      };
    };

    return {
      currentService: formatCall(currentService),

      pausedServices: pausedServices
        .map((call) => formatCall(call))
        .filter((call) => call !== null),

      completedServices: completedServices
        .map((call) => formatCall(call))
        .filter((call) => call !== null),

      counts: {
        current: currentService ? 1 : 0,
        paused: pausedCount,
        completed: completedCount,
      },
    };
  };

  startCall = async (callId: string, technicianId: string) => {
    const call = await prisma.call.findUnique({
      where: {
        id: callId,
      },

      select: {
        id: true,
        status: true,
        assignedToId: true,

        assistants: {
          select: {
            technicianId: true,
          },
        },
      },
    });

    if (!call) {
      throw new AppError(404, "Chamado não encontrado.");
    }

    const isParticipant =
      call.assignedToId === technicianId ||
      call.assistants.some(
        (assistant) => assistant.technicianId === technicianId,
      );

    if (!isParticipant) {
      throw new AppError(403, "Você não participa deste atendimento.");
    }

    // Se já não estiver READY, não precisa alterar nada.
    if (call.status !== "READY") {
      return {
        id: call.id,
        status: call.status,
        started: false,
      };
    }

    const updatedCall = await prisma.$transaction(async (tx) => {
      const updated = await tx.call.update({
        where: {
          id: call.id,
        },

        data: {
          status: "IN_PROGRESS",
        },

        select: {
          id: true,
          status: true,
          updatedAt: true,
        },
      });

      await tx.callHistory.create({
        data: {
          callId: call.id,
          userId: technicianId,
          action: "STARTED",
          observation: "Atendimento iniciado.",
        },
      });

      return updated;
    });

    return {
      ...updatedCall,
      started: true,
    };
  };
}
