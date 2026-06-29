import { injectable } from "tsyringe";
import { prisma } from "../../../config/db/database.js";
import bcrypt from "bcrypt";
import { AppError } from "../../../shared/errors/AppError.js";
import { TUserData, TUserLoginResult } from "../schemas/User.schema.js";

@injectable()
export class UserService {
  userRegister = async (userData: TUserData) => {
    try {
      const userCount = await prisma.user.count();

      const hashedPassword = await bcrypt.hash(userData.password, 10);

      const roleToUse =
        userCount === 0 ? "ADMIN" : (userData.role ?? "TECHNICIAN");

      const newUser = await prisma.user.create({
        data: {
          name: userData.name,
          password: hashedPassword,
          email: userData.email.toLowerCase(),
          role: roleToUse,
        },
      });

      const { password, ...userWithoutPassword } = newUser;

      return userWithoutPassword;
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
      const user = await prisma.user.findUnique({ where: { id: userId } });

      return user;
    } catch (error) {
      console.error(error);
      throw new AppError(400, "Error while trying to find the user.");
    }
  };

  listAllUsers = async () => {
    const response = await prisma.user.findMany({});

    return response;
  };
}
