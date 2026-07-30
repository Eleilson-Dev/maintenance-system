import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { prisma } from "../../config/db/database.js";
import { AppError } from "../errors/AppError.js";

type TokenPayload = {
  userId: string;
};

export class VerifyToken {
  static async execute(req: Request, res: Response, next: NextFunction) {
    try {
      const authorization = req.headers.authorization;

      if (!authorization) {
        throw new AppError(401, "Token is required");
      }

      const [type, token] = authorization.split(" ");

      if (type !== "Bearer" || !token) {
        throw new AppError(401, "Token format is invalid");
      }

      const secret = process.env.JWT_SECRET;

      if (!secret) {
        throw new AppError(500, "JWT secret is not configured");
      }

      const decoded = jwt.verify(token, secret) as TokenPayload;

      const user = await prisma.user.findUnique({
        where: {
          id: decoded.userId,
        },
      });

      if (!user) {
        throw new AppError(401, "Invalid session");
      }

      res.locals.user = user;

      return next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return next(new AppError(401, "Token expired"));
      }

      if (error instanceof jwt.JsonWebTokenError) {
        return next(new AppError(401, "Token is not valid"));
      }

      return next(error);
    }
  }
}
