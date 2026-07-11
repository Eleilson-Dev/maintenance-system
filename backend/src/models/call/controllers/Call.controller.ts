import type { Request, Response } from "express";
import { inject, injectable } from "tsyringe";
import { CallService } from "../services/Call.service.js";
import { io } from "../../../server.js";
import { CallStatus } from "../../../../generated/prisma/enums.js";

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
    const { page, limit, status } = req.query;
    const calls = await this.callService.getCalls(
      Number(page ?? 1),
      Number(limit ?? 20),
      status as CallStatus,
    );

    return res.status(200).json(calls);
  };

  getCallById = async (req: Request, res: Response) => {};
  assignTechnician = async (req: Request, res: Response) => {};
  updateCallStatus = async (req: Request, res: Response) => {};
  completeCall = async (req: Request, res: Response) => {};
}
