import { Router } from "express";
import { container } from "tsyringe";
import { LocationService } from "../services/Location.service.js";
import { LocationController } from "../controllers/Location.controller.js";
import { VerifyToken } from "../../../shared/middlewares/VerifyToken.middleware.js";
import { VerifyAdmin } from "../../../shared/middlewares/VerifyAdmin.middleware.js";
import { ValidateBody } from "../../../shared/middlewares/ValidateBody.middleware.js";
import { LocationSchema } from "../schemas/Location.schema.js";
import { LocationAlreadyExists } from "../middlewares/LocationAlreadyExists.middleware.js";

container.registerSingleton("LocationService", LocationService);
const locationController = container.resolve(LocationController);

export const locationRouter = Router();

locationRouter.post(
  "/location/create",
  VerifyToken.execute,
  VerifyAdmin.execute,
  ValidateBody.execute(LocationSchema),
  LocationAlreadyExists.execute,
  (req, res) => locationController.createLocation(req, res),
);

locationRouter.get(
  "/location/list",
  VerifyToken.execute,
  VerifyAdmin.execute,
  (req, res) => locationController.listLocations(req, res),
);
