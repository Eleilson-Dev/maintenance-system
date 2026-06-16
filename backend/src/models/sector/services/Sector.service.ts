import { injectable } from "tsyringe";
import { prisma } from "../../../config/db/database.js";
import { AppError } from "../../../shared/errors/AppError.js";
import { normalizeText } from "../../../shared/utils/normalizeText.js";

@injectable()
export class SectorService {
  sectorRegister = async (sectorName: string) => {
    try {
      const newSector = await prisma.sector.create({
        data: { name: sectorName, normalizedName: normalizeText(sectorName) },
      });

      return newSector;
    } catch (error) {
      console.log(error);

      throw new AppError(400, "Error creating new sector.");
    }
  };

  getSectors = async () => {
    try {
      const allSectors = await prisma.sector.findMany();

      return allSectors;
    } catch (error) {
      console.log(error);

      throw new AppError(400, "Error searching all sectors.");
    }
  };
}
