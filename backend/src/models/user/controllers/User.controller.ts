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
}
