import { injectable } from "tsyringe";
import { prisma } from "../../../config/db/database.js";
import { AppError } from "../../../shared/errors/AppError.js";
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
        include: {
          sector: true,
          openedBy: true,
          assignedTo: true,
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
      const allCalls = await prisma.call.findMany({
        include: { sector: true, openedBy: true, assignedTo: true },
        orderBy: { createdAt: "desc" },
      });

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
