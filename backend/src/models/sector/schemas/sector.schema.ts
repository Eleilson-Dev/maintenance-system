import { z } from "zod";

export const sectorSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
});
