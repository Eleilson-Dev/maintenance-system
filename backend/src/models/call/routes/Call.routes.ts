import { Router } from "express";
import { container } from "tsyringe";
import { CallService } from "../services/Call.service.js";
import { CallController } from "../controllers/Call.controller.js";
import { VerifyToken } from "../../../shared/middlewares/VerifyToken.middleware.js";
import { VerifyAdmin } from "../../../shared/middlewares/VerifyAdmin.middleware.js";
import { ValidateBody } from "../../../shared/middlewares/ValidateBody.middleware.js";
import {
  createAdminCallSchema,
  previewCallSchema,
} from "../schemas/Call.schema.js";

container.registerSingleton("CallService", CallService);
const callController = container.resolve(CallController);

export const callRouter = Router();

callRouter.post(
  "/call/admin/preview",
  VerifyToken.execute,
  VerifyAdmin.execute,
  ValidateBody.execute(previewCallSchema),
  (req, res) => callController.previewCall(req, res),
);

callRouter.post(
  "/call/admin/create",
  VerifyToken.execute,
  VerifyAdmin.execute,
  ValidateBody.execute(createAdminCallSchema),
  (req, res) => callController.createAdminCall(req, res),
);

callRouter.get("/call/list", VerifyToken.execute, (req, res) =>
  callController.getCalls(req, res),
);

callRouter.get("/:id", callController.getCallById);

callRouter.patch("/:id/assign", callController.assignTechnician);

callRouter.patch("/:id/status", callController.updateCallStatus);

callRouter.patch("/:id/complete", callController.completeCall);
