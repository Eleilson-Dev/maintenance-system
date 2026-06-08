import type { Request, Response } from "express";
import { inject, injectable } from "tsyringe";
import type { UserService } from "../services/User.Service.js";

@injectable()
export class UserController {
  constructor(@inject("UserService") private userService: UserService) {}

  userRegister = async (req: Request, res: Response) => {
    const response = await this.userService.userRegister(
      req.body,
      res.locals.encodedToken,
    );

    return res.status(201).json(response);
  };

  userLogin = async (req: Request, res: Response) => {
    const response = await this.userService.userLogin(
      res.locals.userLoginResult,
    );

    return res.status(200).json(response);
  };

  listAllUsers = async (req: Request, res: Response) => {
    const response = await this.userService.listAllUsers();

    return res.status(200).json(response);
  };
}
