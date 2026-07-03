import { z } from "zod";

import {
  CallPriority,
  ServiceType,
  TechnicianLevel,
} from "../../../../generated/prisma/enums.js";

export const createAdminCallSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(5, "Título muito curto.")
      .max(120, "Título muito longo."),
    description: z
      .string()
      .trim()
      .min(10, "Descrição muito curta.")
      .max(2000, "Descrição muito longa.")
      .optional(),

    priority: z.nativeEnum(CallPriority, {
      error: "Prioridade inválida.",
    }),
    serviceType: z.nativeEnum(ServiceType, {
      error: "Tipo de serviço inválido.",
    }),
    requiredLevel: z.nativeEnum(TechnicianLevel, {
      error: "Nível técnico inválido.",
    }),
    locationId: z.uuid("Localização inválida."),
    areaIds: z
      .array(z.uuid("Área inválida."))
      .min(1, "Informe pelo menos uma área.")
      .refine((areas) => new Set(areas).size === areas.length, {
        message: "Não é permitido repetir áreas.",
      }),
    assignedToId: z.uuid("Técnico responsável inválido.").optional(),
    assistantIds: z
      .array(z.uuid("Auxiliar inválido."))
      .refine((ids) => new Set(ids).size === ids.length, {
        message: "Não é permitido repetir auxiliares.",
      })
      .default([]),
  })
  .superRefine((data, ctx) => {
    if (data.assignedToId && data.assistantIds.includes(data.assignedToId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["assistantIds"],
        message: "O técnico responsável não pode ser informado como auxiliar.",
      });
    }
  });

export type CreateCallDTO = z.infer<typeof createAdminCallSchema>;
