import type { Request, Response } from "express";
import { inject, injectable } from "tsyringe";
import { CallService } from "../services/Call.service.js";
import { io } from "../../../server.js";

@injectable()
export class CallController {
  constructor(@inject("CallService") private callService: CallService) {}

  previewCall = async (req: Request, res: Response) => {
    const preview = await this.callService.previewCall(req.body);

    return res.status(200).json(preview);
  };

  createAdminCall = async (req: Request, res: Response) => {
    console.log(req.body);
    const userId = res.locals.user.id;
    const newCall = await this.callService.createAdminCall(userId, req.body);
    // io.emit("call_created", newCall);
    return res.status(201).json(newCall);
  };

  getCalls = async (req: Request, res: Response) => {
    const allCalls = await this.callService.getCalls();

    return res.status(200).json(allCalls);
  };

  getCallById = async (req: Request, res: Response) => {};
  assignTechnician = async (req: Request, res: Response) => {};
  updateCallStatus = async (req: Request, res: Response) => {};
  completeCall = async (req: Request, res: Response) => {};
}
