import { Router } from "express";
import { container } from "tsyringe";

import { UserController } from "../controllers/User.controller.js";
import { UserService } from "../services/User.Service.js";
import { ValidateBody } from "../../../shared/middlewares/ValidateBody.middleware.js";
import { userLoginSchema, userSchema } from "../schemas/User.schema.js";
import { VerifyEmailExists } from "../middlewares/VerifyEmailExists.middleware.js";
import { VerifyLoginUser } from "../middlewares/VerifyLoginUser.middleware.js";
import { VerifyToken } from "../../../shared/middlewares/VerifyToken.middleware.js";
import { VerifyAdmin } from "../../../shared/middlewares/VerifyAdmin.middleware.js";

container.registerSingleton("UserService", UserService);
const userController = container.resolve(UserController);

export const userRouter = Router();

userRouter.post(
  "/user/register",
  ValidateBody.execute(userSchema),
  VerifyEmailExists.execute,
  (req, res) => userController.userRegister(req, res),
);

userRouter.post(
  "/user/login",
  ValidateBody.execute(userLoginSchema),
  VerifyLoginUser.execute,
  (req, res) => userController.userLogin(req, res),
);

userRouter.get(
  "/users/list",
  VerifyToken.execute,
  VerifyAdmin.execute,
  (req, res) => userController.listAllUsers(req, res),
);
