import type { Request, Response } from "express";
import { inject, injectable } from "tsyringe";

import { AppError } from "../../../shared/errors/AppError.js";

import type { PlanningService } from "../services/Planning.Service.js";

import { listPlanningsQuerySchema } from "../schemas/Planning.schema.js";

import { io } from "../../../server.js";

@injectable()
export class PlanningController {
  constructor(
    @inject("PlanningService")
    private readonly planningService: PlanningService,
  ) {}

  updatePlanningTeam = async (req: Request, res: Response) => {
    const { callId } = req.params;

    const updatedById = res.locals.user.id;

    if (typeof callId !== "string") {
      throw new AppError(400, "O ID do chamado é inválido.");
    }

    const planning = await this.planningService.updatePlanningTeam(
      {
        callId,
      },
      req.body,
      updatedById,
    );

    return res.status(200).json({
      message: "Equipe do planejamento atualizada com sucesso.",

      planning,
    });
  };

  confirmPlanning = async (req: Request, res: Response) => {
    const { callId } = req.params;

    if (typeof callId !== "string") {
      throw new AppError(400, "O ID do chamado é inválido.");
    }

    const confirmedById = res.locals.user.id;

    if (typeof confirmedById !== "string") {
      throw new AppError(401, "Usuário não autenticado.");
    }

    const result = await this.planningService.confirmPlanning(
      {
        callId,
      },
      confirmedById,
    );

    /*
     * Atualiza em tempo real as telas
     * que acompanham os chamados.
     */
    io.emit("call_updated", result.call);

    /*
     * Atualiza disponibilidade dos técnicos.
     */
    const technicianIds = [
      result.call.assignedTo?.id,

      ...result.call.assistants.map((assistant) => assistant.id),
    ].filter((id): id is string => Boolean(id));

    io.emit("technician_availability_changed", {
      technicianIds,
    });

    /*
     * Evento global de confirmação.
     */
    io.emit("planning_confirmed", {
      callId: result.call.id,
      planningId: result.planning.id,

      call: result.call,
      planning: result.planning,
    });

    /*
     * =====================================================
     * LOCALIZAÇÃO
     * =====================================================
     */
    const location = result.call.location?.parent?.name
      ? `${result.call.location.parent.name} / ${result.call.location.name}`
      : result.call.location?.name;

    /*
     * =====================================================
     * NOTIFICAÇÕES INDIVIDUAIS
     * =====================================================
     */

    const responsibleId = result.call.assignedTo?.id;

    if (responsibleId) {
      io.to(`user:${responsibleId}`).emit("user_notification", {
        type: "ASSIGNED_RESPONSIBLE",

        callId: result.call.id,
        protocol: result.call.protocol,
        title: result.call.title,

        message: "Você foi atribuído como responsável em um chamado.",

        location,
      });
    }

    for (const assistant of result.call.assistants) {
      io.to(`user:${assistant.id}`).emit("user_notification", {
        type: "ASSIGNED_ASSISTANT",

        callId: result.call.id,
        protocol: result.call.protocol,
        title: result.call.title,

        message: "Você foi atribuído como auxiliar em um chamado.",

        location,
      });
    }

    return res.status(200).json({
      message: "Planejamento confirmado com sucesso.",

      ...result,
    });
  };
  listAllPlannings = async (req: Request, res: Response) => {
    const query = listPlanningsQuerySchema.parse(req.query);

    const result = await this.planningService.listAllPlannings(query);

    return res.status(200).json(result);
  };

  findPlanningDetails = async (req: Request, res: Response) => {
    const { callId } = req.params;

    if (typeof callId !== "string") {
      throw new AppError(400, "O ID do chamado é inválido.");
    }

    const planning = await this.planningService.findPlanningDetails({
      callId,
    });

    return res.status(200).json({
      planning,
    });
  };
}
