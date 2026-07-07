import { injectable } from "tsyringe";
import { prisma } from "../../../config/db/database.js";
import bcrypt from "bcrypt";
import { AppError } from "../../../shared/errors/AppError.js";

@injectable()
export class GenericService {}
