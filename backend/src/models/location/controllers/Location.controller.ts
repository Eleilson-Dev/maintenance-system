import type { Request, Response } from "express";
import { inject, injectable } from "tsyringe";
import { LocationService } from "../services/Location.service.js";

@injectable()
export class LocationController {
  constructor(
    @inject("LocationService") private locationService: LocationService,
  ) {}

  createLocation = async (req: Request, res: Response) => {
    const response = await this.locationService.createLocation(
      req.body.name,
      req.body.parentId,
    );

    return res.status(201).json(response);
  };

  listLocations = async (req: Request, res: Response) => {
    const response = await this.locationService.listLocations();

    return res.status(200).json(response);
  };
}
