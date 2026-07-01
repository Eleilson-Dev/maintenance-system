import { injectable } from "tsyringe";
import { prisma } from "../../../config/db/database.js";
import bcrypt from "bcrypt";
import { AppError } from "../../../shared/errors/AppError.js";
import { TUserData, TUserLoginResult } from "../schemas/User.schema.js";
import { TechnicianLevel } from "../../../../generated/prisma/enums.js";

@injectable()
export class UserService {
  userRegister = async (userData: TUserData) => {
    try {
      return await prisma.$transaction(async (tx) => {
        const hashedPassword = await bcrypt.hash(userData.password, 10);

        const newUser = await tx.user.create({
          data: {
            name: userData.name,
            email: userData.email.toLowerCase(),
            password: hashedPassword,
            role: userData.role,
            level: userData.level,
          },
          omit: { password: true },
        });

        if (userData.areaIds?.length) {
          const areas = await tx.area.findMany({
            where: {
              id: {
                in: userData.areaIds,
              },
            },
          });

          if (areas.length !== userData.areaIds.length) {
            throw new AppError(404, "Uma ou mais áreas não foram encontradas.");
          }

          await tx.userArea.createMany({
            data: userData.areaIds.map((areaId) => ({
              userId: newUser.id,
              areaId,
            })),
          });
        }

        return newUser;
      });
    } catch (error) {
      console.error(error);
      throw new AppError(400, "Error creating new user.");
    }
  };

  userLogin = async (userLoginResult: TUserLoginResult) => {
    return userLoginResult;
  };

  findUser = async (userId: string) => {
    try {
      return await prisma.user.findUnique({ where: { id: userId } });
    } catch (error) {
      console.error(error);
      throw new AppError(400, "Error while trying to find the user.");
    }
  };

  listAllUsers = async () => {
    return await prisma.user.findMany({
      include: { userAreas: true },
      omit: { password: true },
    });
  };

  addAreaToUser = async (userId: string, areaId: string) => {
    try {
      const area = await prisma.area.findUnique({
        where: { id: areaId },
      });

      if (!area) {
        throw new AppError(404, "Area not found.");
      }

      const alreadyAssigned = await prisma.userArea.findUnique({
        where: {
          userId_areaId: {
            userId,
            areaId,
          },
        },
      });

      if (alreadyAssigned) {
        throw new AppError(409, "This area is already assigned to the user.");
      }

      return await prisma.userArea.create({
        data: {
          userId,
          areaId,
        },
        include: {
          area: true,
        },
      });
    } catch (error) {
      console.error(error);

      if (error instanceof AppError) throw error;

      throw new AppError(400, "Error assigning area to user.");
    }
  };

  updateTechnicalLevel = async (
    userId: string,
    technicalLevel: TechnicianLevel,
  ) => {
    try {
      const userUpdated = await prisma.user.update({
        where: { id: userId },
        data: {
          level: technicalLevel,
        },
      });

      const { password, ...userWithoutPassword } = userUpdated;

      return userWithoutPassword;
    } catch (error) {
      console.error(error);
      throw new AppError(400, "Error updating technical level.");
    }
  };
}
