import { z } from "zod";

import {
  CallPriority,
  ServiceType,
} from "../../../../generated/prisma/enums.js";

export const createCallSchema = z.object({
  title: z.string().trim().min(5, "Título muito curto").max(120),
  description: z.string().trim().min(10, "Descrição muito curta").max(2000),
  priority: z.nativeEnum(CallPriority),
  serviceType: z.nativeEnum(ServiceType),
  sectorId: z.string().uuid(),
});

export type CreateCallDTO = z.infer<typeof createCallSchema>;
