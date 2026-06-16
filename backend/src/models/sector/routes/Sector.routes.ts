import { Router } from "express";
import { container } from "tsyringe";
import { SectorService } from "../services/Sector.service.js";
import { SectorController } from "../controllers/Sector.controller.js";
import { VerifyToken } from "../../../shared/middlewares/VerifyToken.middleware.js";
import { VerifyAdmin } from "../../../shared/middlewares/VerifyAdmin.middleware.js";
import { ValidateBody } from "../../../shared/middlewares/ValidateBody.middleware.js";
import { sectorSchema } from "../schemas/sector.schema.js";
import { SectorAlreadyExists } from "../middlewares/SectorAlreadyExists.middleware.js";

container.registerSingleton("SectorService", SectorService);
const sectorController = container.resolve(SectorController);

export const sectorRouter = Router();

sectorRouter.post(
  "/sector/register",
  VerifyToken.execute,
  VerifyAdmin.execute,
  ValidateBody.execute(sectorSchema),
  SectorAlreadyExists.execute,
  (req, res) => sectorController.sectorRegister(req, res),
);

sectorRouter.get(
  "/sector/list",
  VerifyToken.execute,
  VerifyAdmin.execute,
  (req, res) => sectorController.getSectors(req, res),
);
