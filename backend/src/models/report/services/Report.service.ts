import { injectable } from "tsyringe";

import { prisma } from "../../../config/db/database.js";

import { AppError } from "../../../shared/errors/AppError.js";

import type { CompleteCallDTO } from "../schemas/Report.schema.js";

@injectable()
export class ReportService {
  completeCall = async (
    callId: string,
    technicianId: string,
    data: CompleteCallDTO,
  ) => {
    const call = await prisma.call.findUnique({
      where: {
        id: callId,
      },

      select: {
        id: true,
        protocol: true,
        title: true,
        status: true,
        assignedToId: true,
        openedById: true,

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

        report: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!call) {
      throw new AppError(404, "Chamado não encontrado.");
    }

    if (!call.assignedToId) {
      throw new AppError(400, "Este chamado não possui técnico responsável.");
    }

    if (call.assignedToId !== technicianId) {
      throw new AppError(
        403,
        "Somente o técnico responsável pode finalizar este atendimento.",
      );
    }

    if (call.status === "COMPLETED") {
      throw new AppError(409, "Este atendimento já foi finalizado.");
    }

    if (call.status !== "IN_PROGRESS") {
      throw new AppError(
        400,
        "Somente atendimentos em andamento podem ser finalizados.",
      );
    }

    if (call.report) {
      throw new AppError(
        409,
        "Este atendimento já possui relatório de finalização.",
      );
    }

    if (data.partChanged && !data.partName?.trim()) {
      throw new AppError(400, "Informe a peça substituída.");
    }

    const finishedAt = new Date();

    const completedCall = await prisma.$transaction(async (tx) => {
      const report = await tx.report.create({
        data: {
          callId: call.id,

          serviceDone: data.serviceDone.trim(),

          partChanged: data.partChanged,

          partName: data.partChanged ? data.partName?.trim() || null : null,

          observations: data.observations?.trim() || null,

          createdById: technicianId,
        },

        select: {
          id: true,

          serviceDone: true,

          partChanged: true,

          partName: true,

          observations: true,

          createdAt: true,

          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      await tx.workLog.updateMany({
        where: {
          callId: call.id,
          endTime: null,
        },

        data: {
          endTime: finishedAt,
        },
      });

      const updatedCall = await tx.call.update({
        where: {
          id: call.id,
        },

        data: {
          status: "COMPLETED",
          finishedAt,
        },

        select: {
          id: true,
          protocol: true,
          status: true,
          finishedAt: true,
          updatedAt: true,
        },
      });

      await tx.callHistory.create({
        data: {
          callId: call.id,

          userId: technicianId,

          action: "COMPLETED",

          observation: "Atendimento finalizado.",

          metadata: {
            reportId: report.id,
            attachmentsCount: 0,
            partChanged: data.partChanged,
          },
        },
      });

      return {
        ...updatedCall,
        report,
      };
    });

    return {
      ...completedCall,

      title: call.title,
      openedById: call.openedById,
      location: call.location,
    };
  };
}
