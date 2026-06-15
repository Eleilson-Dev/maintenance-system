import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/AppError.js";
import jwt from "jsonwebtoken";
import { prisma } from "../../config/db/database.js";

export class VerifyToken {
  static async execute(req: Request, res: Response, next: NextFunction) {
    const authorization = req.headers.authorization;
    const token = authorization?.replace("Bearer", "").trim();

    if (!token) {
      throw new AppError(401, "Token is required");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;

    const { userId } = decoded;

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new AppError(401, "Invalid session");
    }

    try {
      res.locals.user = user;

      next();
    } catch (error: any) {
      const errorMap: Record<string, { status: number; message: string }> = {
        TokenExpiredError: { status: 401, message: "Token expired" },
        JsonWebTokenError: { status: 400, message: "Token is not valid" },
      };

      const { status, message } = errorMap[error.name] || {
        status: 500,
        message: "Internal Server Error",
      };

      throw new AppError(status, message);
    }
  }
}
