import type { NextFunction, Request, Response } from "express";
import { prisma } from "../../../config/db/database.js";
import { AppError } from "../../../shared/errors/AppError.js";
import { normalizeText } from "../../../shared/utils/normalizeText.js";

export class LocationAlreadyExists {
  static async execute(req: Request, res: Response, next: NextFunction) {
    const location = await prisma.location.findFirst({
      where: { normalizedName: normalizeText(req.body.name) },
    });

    if (location) {
      throw new AppError(409, "Location already exists");
    }

    next();
  }
}
