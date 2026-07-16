import type { Request, Response } from "express";
import { inject, injectable } from "tsyringe";
import { CallService } from "../services/Call.service.js";
import { io } from "../../../server.js";
import {
  CallPriority,
  CallStatus,
  TechnicianLevel,
} from "../../../../generated/prisma/enums.js";

@injectable()
export class CallController {
  constructor(@inject("CallService") private callService: CallService) {}

  previewCall = async (req: Request, res: Response) => {
    const preview = await this.callService.previewCall(req.body);

    return res.status(200).json(preview);
  };

  createAdminCall = async (req: Request, res: Response) => {
    const userId = res.locals.user.id;
    const newCall = await this.callService.createAdminCall(userId, req.body);

    io.emit("call_created", newCall);

    return res.status(201).json(newCall);
  };

  getCalls = async (req: Request, res: Response) => {
    const { page, limit, status, search, priority, level, areaId } = req.query;

    const calls = await this.callService.getCalls({
      page: Number(page ?? 1),
      limit: Number(limit ?? 20),

      status:
        typeof status === "string" && status.trim()
          ? (status as CallStatus)
          : undefined,
      search:
        typeof search === "string" && search.trim() ? search.trim() : undefined,
      priority:
        typeof priority === "string" && priority !== "ALL"
          ? (priority as CallPriority)
          : undefined,
      level:
        typeof level === "string" && level !== "ALL"
          ? (level as TechnicianLevel)
          : undefined,
      areaId: typeof areaId === "string" && areaId.trim() ? areaId : undefined,
    });

    return res.status(200).json(calls);
  };

  getCallById = async (req: Request, res: Response) => {};
  assignTechnician = async (req: Request, res: Response) => {};
  updateCallStatus = async (req: Request, res: Response) => {};
  completeCall = async (req: Request, res: Response) => {};
}
