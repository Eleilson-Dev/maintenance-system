import type { NextFunction, Request, Response } from "express";
import { AppError } from "./AppError.js";
import jwt from "jsonwebtoken";
import { ZodError } from "zod";

export class HandleErrors {
  static execute(
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    // Erros de domínio
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        message: error.message,
      });
    }

    // JWT inválido
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        message: "Token inválido",
      });
    }

    // JWT expirado
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        message: "Token expirado",
      });
    }

    // Erro de validação (Zod)
    if (error instanceof ZodError) {
      const issues = error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));

      return res.status(400).json({
        message: "Erro de validação",
        issues,
      });
    }

    // Erro inesperado
    console.error(error);

    return res.status(500).json({
      message: "Erro interno do servidor",
    });
  }
}
