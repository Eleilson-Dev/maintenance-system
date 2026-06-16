import type { Request, Response } from "express";
import { inject, injectable } from "tsyringe";
import { SectorService } from "../services/Sector.service.js";

@injectable()
export class SectorController {
  constructor(@inject("SectorService") private sectorService: SectorService) {}

  sectorRegister = async (req: Request, res: Response) => {
    const response = await this.sectorService.sectorRegister(req.body.name);

    return res.status(201).json(response);
  };

  getSectors = async (req: Request, res: Response) => {
    const response = await this.sectorService.getSectors();

    return res.status(200).json(response);
  };
}
