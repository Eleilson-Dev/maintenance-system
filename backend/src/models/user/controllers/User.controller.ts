import type { Request, Response } from "express";
import { inject, injectable } from "tsyringe";
import type { UserService } from "../services/User.Service.js";

@injectable()
export class UserController {
  constructor(@inject("UserService") private userService: UserService) {}

  userRegister = async (req: Request, res: Response) => {
    const response = await this.userService.userRegister(req.body);

    return res.status(201).json(response);
  };

  userLogin = async (req: Request, res: Response) => {
    const response = await this.userService.userLogin(
      res.locals.userLoginResult,
    );

    return res.status(200).json(response);
  };

  findUser = async (req: Request, res: Response) => {
    const response = await this.userService.findUser(res.locals.user.id);

    return res.status(200).json(response);
  };

  listAllUsers = async (req: Request, res: Response) => {
    const response = await this.userService.listAllUsers();

    return res.status(200).json(response);
  };

  addAreaToUser = async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { areaId } = req.body;

    const response = await this.userService.addAreaToUser(
      userId as string,
      areaId,
    );

    return res.status(201).json(response);
  };

  updateTechnicalLevel = async (req: Request, res: Response) => {
    const { userId } = req.params;

    const response = await this.userService.updateTechnicalLevel(
      userId as string,
      req.body.technicalLevel,
    );

    return res.status(200).json(response);
  };
}
