import { Router } from "express";
import { container } from "tsyringe";
import { PlanningController } from "../controllers/Planning.controller.js";
import { PlanningService } from "../services/Planning.Service.js";
import { ValidateBody } from "../../../shared/middlewares/ValidateBody.middleware.js";

import { updatePlanningTeamSchema } from "../schemas/Planning.schema.js";
import { VerifyToken } from "../../../shared/middlewares/VerifyToken.middleware.js";
import { VerifyAdmin } from "../../../shared/middlewares/VerifyAdmin.middleware.js";

container.registerSingleton("PlanningService", PlanningService);

const planningController = container.resolve(PlanningController);

export const planningRouter = Router();

planningRouter.put(
  "/call/:callId/planning/team",
  ValidateBody.execute(updatePlanningTeamSchema),
  VerifyToken.execute,
  VerifyAdmin.execute,
  (req, res) => planningController.updatePlanningTeam(req, res),
);

planningRouter.patch(
  "/call/:callId/planning/confirm",
  VerifyToken.execute,
  VerifyAdmin.execute,
  (req, res) => planningController.confirmPlanning(req, res),
);

planningRouter.get(
  "/planning/list",
  VerifyToken.execute,
  VerifyAdmin.execute,
  (req, res) => planningController.listAllPlannings(req, res),
);
