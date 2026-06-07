import { Router } from "express";
import { container } from "tsyringe";

import { UserController } from "../controllers/User.controller.js";
import { UserService } from "../services/User.Service.js";
import { ValidateBody } from "../../../shared/middlewares/ValidateBody.middleware.js";
import { userSchema } from "../schemas/user.schema.js";
import { VerifyEmailExists } from "../middlewares/ VerifyEmailExists.middleware.js";

container.registerSingleton("UserService", UserService);
const userController = container.resolve(UserController);

export const userRouter = Router();

userRouter.post(
  "/user/register",
  ValidateBody.execute(userSchema),
  VerifyEmailExists.execute,
  (req, res) => userController.userRegister(req, res),
);

// userRouter.get(
//   "/users/list",
//   VerifyToken.execute,
//   AttachMonthlyClosureStatus.execute,
//   (req, res) => userController.listAllUsers(req, res),
// );

// userRouter.post(
//   "/user/login",
//   ValidateBody.execute(userLoginSchema),
//   VerifyLoginUser.execute,
//   (req, res) => userController.loginUser(req, res),
// );
