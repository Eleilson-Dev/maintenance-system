import type { NextFunction, Request, Response } from "express";
import { prisma } from "../../../config/db/database.js";
import { AppError } from "../../../shared/errors/AppError.js";
import { normalizeText } from "../../../shared/utils/normalizeText.js";

export class AreaAlreadyExists {
  static async execute(req: Request, res: Response, next: NextFunction) {
    const area = await prisma.area.findFirst({
      where: { normalizedName: normalizeText(req.body.name) },
    });

    if (area) {
      throw new AppError(409, "Area already exists");
    }

    next();
  }
}
