import type { NextFunction, Request, Response } from "express";

import { AppError } from "../errors/AppError.js";

export class VerifyAdmin {
  static execute(req: Request, res: Response, next: NextFunction) {
    const user = res.locals.user;

    if (!user) {
      throw new AppError(401, "No users logged in");
    }

    if (user.role !== "ADMIN") {
      throw new AppError(403, "Forbidden: user must be ADMIN");
    }

    return next();
  }
}
