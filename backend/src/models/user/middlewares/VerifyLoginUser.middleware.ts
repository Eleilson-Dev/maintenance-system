import type { NextFunction, Request, Response } from "express";
import { prisma } from "../../../config/db/database.js";
import { AppError } from "../../../shared/errors/AppError.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export class VerifyLoginUser {
  static async execute(req: Request, res: Response, next: NextFunction) {
    const email = req.body.email.toLowerCase();

    const user = await prisma.user.findFirst({ where: { email } });

    if (!user) {
      throw new AppError(401, "Email or password does not match");
    }

    if (req.body.password) {
      const compare = await bcrypt.compare(req.body.password, user.password);

      if (!compare) {
        throw new AppError(401, "Email or password does not match");
      }
    }

    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
      },
      process.env.JWT_SECRET!,
      { expiresIn: "30d" },
    );

    res.locals.userLoginResult = {
      userId: user.id,
      userName: user.name,
      role: user.role,
      token,
    };

    next();
  }
}
