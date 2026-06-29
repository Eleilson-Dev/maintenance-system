import { injectable } from "tsyringe";
import { prisma } from "../../../config/db/database.js";
import { AppError } from "../../../shared/errors/AppError.js";
import { normalizeText } from "../../../shared/utils/normalizeText.js";

@injectable()
export class AreaService {
  createArea = async (areaName: string) => {
    try {
      const newArea = await prisma.area.create({
        data: {
          name: areaName,
          normalizedName: normalizeText(areaName),
        },
      });

      return newArea;
    } catch (error) {
      console.log(error);

      throw new AppError(400, "Error creating new area.");
    }
  };

  listArea = async () => {
    try {
      const list = await prisma.area.findMany();

      return list;
    } catch (error) {
      console.log(error);

      throw new AppError(400, "Error trying to fetch the list.");
    }
  };
}
