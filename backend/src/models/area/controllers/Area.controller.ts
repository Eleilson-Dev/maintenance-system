import type { Request, Response } from "express";
import { inject, injectable } from "tsyringe";
import type { AreaService } from "../services/Area.Service.js";

@injectable()
export class AreaController {
  constructor(@inject("AreaService") private areaService: AreaService) {}

  createArea = async (req: Request, res: Response) => {
    const response = await this.areaService.createArea(req.body.name);

    return res.status(200).json(response);
  };

  listArea = async (req: Request, res: Response) => {
    const response = await this.areaService.listArea();

    return res.status(200).json(response);
  };
}
