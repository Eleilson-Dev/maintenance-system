import type { Request, Response } from "express";
import { inject, injectable } from "tsyringe";
import type { GenericService } from "../services/generic.Service.js";

@injectable()
export class GenericController {
  constructor(
    @inject("GenericService") private genericService: GenericService,
  ) {}
}
