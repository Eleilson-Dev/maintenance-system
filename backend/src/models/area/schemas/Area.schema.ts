import { z } from "zod";

export const createAreaSchema = z.object({
  name: z
    .string()
    .min(2, "Nome da área muito curto")
    .max(50, "Nome da área muito grande")
    .trim(),
});
