import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";
import { ZodError } from "zod";

export class ValidateBody {
  static execute<T>(schema: ZodType<T>) {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        req.body = schema.parse(req.body) as T;
        next();
      } catch (error) {
        if (error instanceof ZodError) {
          return res.status(400).json({
            message: "Erro de validação",
            issues: error.issues,
          });
        }
        next(error);
      }
    };
  }
}
