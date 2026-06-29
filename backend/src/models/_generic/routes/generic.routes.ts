import { Router } from "express";
import { container } from "tsyringe";

import { GenericController } from "../controllers/generic.controller.js";
import { GenericService } from "../services/generic.Service.js";

container.registerSingleton("GenericService", GenericService);
const genericController = container.resolve(GenericController);

export const genericRouter = Router();
