import { z } from "zod";

const uuidSchema = z
  .string({
    error: (issue) =>
      issue.input === undefined
        ? "O ID é obrigatório."
        : "O ID deve ser uma string.",
  })
  .uuid({
    error: "ID inválido.",
  });

export const planningParamsSchema = z.object({
  callId: uuidSchema,
});

export const updatePlanningTeamSchema = z
  .object({
    responsibleId: uuidSchema,

    assistantIds: z
      .array(uuidSchema, {
        error: "A lista de auxiliares deve ser um array.",
      })
      .default([]),
  })
  .superRefine((data, context) => {
    const uniqueAssistantIds = new Set(data.assistantIds);

    if (uniqueAssistantIds.size !== data.assistantIds.length) {
      context.addIssue({
        code: "custom",
        path: ["assistantIds"],
        message: "Não é permitido repetir auxiliares.",
      });
    }

    if (data.assistantIds.includes(data.responsibleId)) {
      context.addIssue({
        code: "custom",
        path: ["assistantIds"],
        message:
          "O técnico responsável não pode também ser informado como auxiliar.",
      });
    }
  });

export type PlanningParamsDTO = z.infer<typeof planningParamsSchema>;

export type UpdatePlanningTeamDTO = z.infer<typeof updatePlanningTeamSchema>;
