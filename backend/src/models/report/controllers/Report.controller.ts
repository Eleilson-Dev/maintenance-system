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
        attachments: [],
      },
    );

    /**
     * Atualização global.
     *
     * Serve para atualizar listas, atendimento atual,
     * disponibilidade dos técnicos etc.
     */
    io.emit("call_updated", completedCall);

    /**
     * Notificação somente para quem criou o chamado.
     */
    io.to(`user:${completedCall.openedById}`).emit("user_notification", {
      type: "CALL_COMPLETED",

      callId: completedCall.id,
      protocol: completedCall.protocol,
      title: completedCall.title,

      message: "O chamado solicitado foi finalizado",

      location: completedCall.location?.parent?.name
        ? `${completedCall.location.parent.name} / ${completedCall.location.name}`
        : completedCall.location?.name,
    });

    return res.status(200).json(completedCall);
  };
}
