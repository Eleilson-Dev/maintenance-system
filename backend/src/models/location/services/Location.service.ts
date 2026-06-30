import { injectable } from "tsyringe";
import { prisma } from "../../../config/db/database.js";
import { AppError } from "../../../shared/errors/AppError.js";
import { normalizeText } from "../../../shared/utils/normalizeText.js";
import { generateLocationCode } from "../utils/generateLocationCode.js";

@injectable()
export class LocationService {
  createLocation = async (locationName: string, parentId?: string) => {
    try {
      const locationCode = await generateLocationCode();

      const newLocation = await prisma.location.create({
        data: {
          name: locationName,
          normalizedName: normalizeText(locationName),
          parentId,
          locationCode,
        },
      });

      return newLocation;
    } catch (error) {
      console.log(error);

      throw new AppError(400, "Error creating new sector.");
    }
  };

  listLocations = async () => {
    try {
      const list = await prisma.location.findMany({
        where: {
          parentId: null,
        },
        include: {
          children: true,
        },
      });

      return list;
    } catch (error) {
      console.log(error);

      throw new AppError(400, "Error searching all locations.");
    }
  };
}

// tranformar sector em location
