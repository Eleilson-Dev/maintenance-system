import { Router } from "express";
import { container } from "tsyringe";

import { AreaController } from "../controllers/Area.controller.js";
import { AreaService } from "../services/Area.Service.js";
import { ValidateBody } from "../../../shared/middlewares/ValidateBody.middleware.js";
import { createAreaSchema } from "../schemas/Area.schema.js";
import { VerifyAdmin } from "../../../shared/middlewares/VerifyAdmin.middleware.js";
import { VerifyToken } from "../../../shared/middlewares/VerifyToken.middleware.js";
import { AreaAlreadyExists } from "../middlewares/AreaAlreadyExists.middleware.js";

container.registerSingleton("AreaService", AreaService);
const areaController = container.resolve(AreaController);

export const AreaRouter = Router();

AreaRouter.post(
  "/area/create",
  VerifyToken.execute,
  VerifyAdmin.execute,
  ValidateBody.execute(createAreaSchema),
  AreaAlreadyExists.execute,
  (req, res) => areaController.createArea(req, res),
);

AreaRouter.get(
  "/area/list",
  VerifyToken.execute,
  VerifyAdmin.execute,
  (req, res) => areaController.listArea(req, res),
);
