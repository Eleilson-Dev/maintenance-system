import { Router } from "express";
import { container } from "tsyringe";
import { ReportService } from "../services/Report.service.js";
import { ReportController } from "../controllers/Report.controller.js";
import { VerifyToken } from "../../../shared/middlewares/VerifyToken.middleware.js";
import { ValidateBody } from "../../../shared/middlewares/ValidateBody.middleware.js";
import { completeCallSchema } from "../schemas/Report.schema.js";

container.registerSingleton("ReportService", ReportService);
const reportController = container.resolve(ReportController);

export const reportRouter = Router();

reportRouter.post(
  "/call/:callId/complete",
  VerifyToken.execute,
  ValidateBody.execute(completeCallSchema),
  (req, res) => reportController.completeCall(req, res),
);
