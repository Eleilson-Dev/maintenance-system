import { z } from "zod";
import {
  UserRole,
  TechnicianLevel,
} from "../../../../generated/prisma/enums.js";

export const userSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido"),
  password: z
    .string()
    .min(6, "Senha deve ter pelo menos 6 caracteres")
    .max(100)
    .refine((val) => !val.includes(" "), {
      message: "Senha não pode conter espaços",
    }),
  role: z.enum([UserRole.ADMIN, UserRole.TECHNICIAN]).optional(),
  level: z
    .enum([
      TechnicianLevel.JUNIOR,
      TechnicianLevel.MID,
      TechnicianLevel.SENIOR,
      TechnicianLevel.SPECIALIST,
    ])
    .optional(),
  areaIds: z.array(z.string().uuid("ID da área inválido")).optional(),
});

export const updateTechnicalLevelSchema = z.object({
  technicalLevel: z.nativeEnum(TechnicianLevel),
});

export const AddUserAreaSchema = z.object({
  areaId: z.string().uuid("Área inválida."),
});

export type TAddUserArea = z.infer<typeof AddUserAreaSchema>;

export const userLoginSchema = userSchema.pick({
  email: true,
  password: true,
});

export const userLoginResult = userSchema.omit({
  password: true,
});

export type TUserLoginResult = z.infer<typeof userLoginResult>;

export type TUserData = z.infer<typeof userSchema>;
