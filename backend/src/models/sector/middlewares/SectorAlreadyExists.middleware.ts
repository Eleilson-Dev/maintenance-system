import type { NextFunction, Request, Response } from "express";
import { prisma } from "../../../config/db/database.js";
import { AppError } from "../../../shared/errors/AppError.js";
import { normalizeText } from "../../../shared/utils/normalizeText.js";

export class SectorAlreadyExists {
  static async execute(req: Request, res: Response, next: NextFunction) {
    const sector = await prisma.sector.findUnique({
      where: { normalizedName: normalizeText(req.body.name) },
    });

    if (sector) {
      throw new AppError(409, "Sector already exists");
    }

    next();
  }
}
