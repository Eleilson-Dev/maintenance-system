import type { Request, Response } from "express";
import { inject, injectable } from "tsyringe";

import { AppError } from "../../../shared/errors/AppError.js";

import type { PlanningService } from "../services/Planning.Service.js";
import { listPlanningsQuerySchema } from "../schemas/Planning.schema.js";

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
}
