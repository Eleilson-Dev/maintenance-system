import { z } from "zod";

export const LocationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Nome deve ter pelo menos 3 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres"),

  parentId: z.string().uuid("ParentId inválido").optional().nullable(),
});
