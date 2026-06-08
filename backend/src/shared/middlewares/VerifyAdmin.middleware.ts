import type { NextFunction, Request, Response } from "express";
import { prisma } from "../../config/db/database.js";
import { AppError } from "../errors/AppError.js";

export class VerifyAdmin {
  static async execute(req: Request, res: Response, next: NextFunction) {
    const { userId } = res.locals.encodedToken;
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new AppError(401, "No users logged in");
    }

    if (user.role !== "ADMIN") {
      throw new AppError(403, "Forbidden: user must be ADMIN");
    }

    next();
  }
}
