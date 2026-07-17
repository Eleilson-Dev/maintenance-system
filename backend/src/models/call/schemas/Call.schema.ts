import { z } from "zod";

import {
  CallPriority,
  ServiceType,
  TechnicianLevel,
} from "../../../../generated/prisma/enums.js";

const callBaseSchema = z.object({
  title: z.string().trim().min(5).max(120),

  description: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || undefined),

  priority: z.nativeEnum(CallPriority),

  serviceType: z.nativeEnum(ServiceType),

  requiredLevel: z.nativeEnum(TechnicianLevel),

  locationId: z.uuid(),

  areaIds: z.array(z.uuid()).min(1),
});

export const previewCallSchema = callBaseSchema;

export const createAdminCallSchema = callBaseSchema.extend({
  assignedToId: z.uuid().optional(),

  assistantIds: z.array(z.uuid()).default([]),
});

/**
 * Dados recebidos antes do Zod validar.
 */
export type PreviewCallInput = z.input<typeof previewCallSchema>;
export type CreateCallInput = z.input<typeof createAdminCallSchema>;

/**
 * Dados depois que o Zod validou e aplicou os valores padrão.
 */
export type PreviewCallDTO = z.output<typeof previewCallSchema>;
export type CreateCallDTO = z.output<typeof createAdminCallSchema>;
