import { z } from "zod";

export const completeCallSchema = z
  .object({
    serviceDone: z.string().trim().min(1, "Informe o serviço realizado."),

    partChanged: z.boolean().default(false),

    partName: z.string().trim().optional().nullable(),

    observations: z.string().trim().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.partChanged && !data.partName?.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["partName"],
        message: "Informe a peça substituída.",
      });
    }
  });

export type CompleteCallDTO = z.infer<typeof completeCallSchema>;
