import type { NextFunction, Request, Response } from "express";
import { prisma } from "../../config/db/database.js";
import { AppError } from "../errors/AppError.js";

export class VerifyAdmin {
  static async execute(req: Request, res: Response, next: NextFunction) {
    const { id } = res.locals.user;
    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new AppError(401, "No users logged in");
    }

    if (user.role !== "ADMIN") {
      throw new AppError(403, "Forbidden: user must be ADMIN");
    }

    next();
  }
}
