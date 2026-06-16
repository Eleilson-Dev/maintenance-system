import { injectable } from "tsyringe";
import { prisma } from "../../../config/db/database.js";
import { AppError } from "../../../shared/errors/AppError.js";
import { normalizeText } from "../../../shared/utils/normalizeText.js";
import { CreateCallDTO } from "../schemas/Call.schema.js";

@injectable()
export class CallService {
  createCall = async (userId: string, callData: CreateCallDTO) => {
    try {
      const newCall = await prisma.call.create({
        data: {
          title: callData.title,
          description: callData.description,
          priority: callData.priority,
          serviceType: callData.serviceType,
          sectorId: callData.sectorId,
          openedById: userId,
        },
      });

      return newCall;
    } catch (error) {
      console.log(error);

      throw new AppError(400, "Error creating new call.");
    }
  };

  getCalls = async () => {
    try {
      const allCalls = await prisma.call.findMany();

      return allCalls;
    } catch (error) {
      console.log(error);

      throw new AppError(400, "Error searching all sectors.");
    }
  };

  getCallById = async () => {};
  assignTechnician = async () => {};
  updateCallStatus = async () => {};
  completeCall = async () => {};
}
