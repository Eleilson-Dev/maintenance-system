import type { Request, Response } from "express";
import { inject, injectable } from "tsyringe";
import { ReportService } from "../services/Report.service.js";
import { io } from "../../../server.js";

@injectable()
export class ReportController {
  constructor(
    @inject("ReportService")
    private reportService: ReportService,
  ) {}

  completeCall = async (req: Request, res: Response) => {
    const technicianId = res.locals.user.id as string;

    const callId = req.params.callId as string;

    const completedCall = await this.reportService.completeCall(
      callId,
      technicianId,
      {
        ...req.body,

        /*
         * Quando implementarmos upload,
         * os arquivos serão convertidos aqui.
         *
         * Por enquanto nenhuma imagem é enviada.
         */
        attachments: [],
      },
    );

    io.emit("call_updated", completedCall);

    return res.status(200).json(completedCall);
  };
}
