import { injectable } from "tsyringe";
import { prisma } from "../../../config/db/database.js";
import bcrypt from "bcrypt";
import { AppError } from "../../../shared/errors/AppError.js";
import { TUserData } from "../schemas/user.schema.js";

@injectable()
export class UserService {
  listAllUsers = async () => {
    const response = await prisma.user.findMany({});

    return response;
  };

  loginUser = async () => {
    return;
  };

  userRegister = async (userData: TUserData, encodedToken: any) => {
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
      throw new AppError(400, "Erro ao criar novo user");
    }
  };
}
