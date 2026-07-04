import { z } from "zod";

import {
  CallPriority,
  ServiceType,
  TechnicianLevel,
} from "../../../../generated/prisma/enums.js";

export const createAdminCallSchema = z.object({
  title: z.string().min(5).max(120),
  description: z.string().optional(),
  priority: z.nativeEnum(CallPriority),
  serviceType: z.nativeEnum(ServiceType),
  requiredLevel: z.nativeEnum(TechnicianLevel),
  locationId: z.uuid(),
  areaIds: z.array(z.uuid()).min(1),
  assignedToId: z.uuid().optional(),
  assistantIds: z.array(z.uuid()).default([]),
});

export const previewCallSchema = z.object({
  title: z.string().min(5).max(120),
  description: z.string().optional(),
  priority: z.nativeEnum(CallPriority),
  serviceType: z.nativeEnum(ServiceType),
  requiredLevel: z.nativeEnum(TechnicianLevel),
  locationId: z.uuid(),
  areaIds: z.array(z.uuid()).min(1),
});

export type CreateCallDTO = z.infer<typeof createAdminCallSchema>;
