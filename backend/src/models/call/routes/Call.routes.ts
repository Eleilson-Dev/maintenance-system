import { Router } from "express";

import { container } from "tsyringe";

import { CallService } from "../services/Call.service.js";

import { CallController } from "../controllers/Call.controller.js";

import { VerifyToken } from "../../../shared/middlewares/VerifyToken.middleware.js";

import { VerifyAdmin } from "../../../shared/middlewares/VerifyAdmin.middleware.js";

import { ValidateBody } from "../../../shared/middlewares/ValidateBody.middleware.js";

import {
  confirmCallAttachmentsSchema,
  createAdminCallSchema,
  prepareCallAttachmentsSchema,
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

callRouter.post(
  "/call/:callId/attachments/presign",
  VerifyToken.execute,
  ValidateBody.execute(prepareCallAttachmentsSchema),
  (req, res) => callController.prepareAttachments(req, res),
);

callRouter.post(
  "/call/:callId/attachments/confirm",
  VerifyToken.execute,
  ValidateBody.execute(confirmCallAttachmentsSchema),
  (req, res) => callController.confirmAttachments(req, res),
);

callRouter.get("/calls/list", VerifyToken.execute, (req, res) =>
  callController.getCalls(req, res),
);

callRouter.get("/call/technician/services", VerifyToken.execute, (req, res) =>
  callController.listTechnicianServices(req, res),
);

callRouter.patch("/call/:callId/start", VerifyToken.execute, (req, res) =>
  callController.startCall(req, res),
);

callRouter.patch("/call/:callId/take", VerifyToken.execute, (req, res) =>
  callController.takeCall(req, res),
);
