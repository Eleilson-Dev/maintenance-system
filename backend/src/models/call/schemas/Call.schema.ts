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
  requiredLevel: z.nativeEnum(TechnicianLevel).optional(),

  locationId: z.uuid(),

  areaIds: z.array(z.uuid()).min(1),

  isPlanning: z.boolean().default(false),
});

export const previewCallSchema = callBaseSchema;

export const createAdminCallSchema = callBaseSchema.extend({
  assignedToId: z.uuid().optional(),

  assistantIds: z.array(z.uuid()).default([]),
});

const imageContentTypeSchema = z.enum([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export const prepareCallAttachmentsSchema = z.object({
  files: z
    .array(
      z.object({
        fileName: z.string().trim().min(1).max(255),

        contentType: imageContentTypeSchema,
      }),
    )
    .min(1)
    .max(3),
});

export const confirmCallAttachmentsSchema = z.object({
  files: z
    .array(
      z.object({
        fileName: z.string().trim().min(1).max(255),

        storageKey: z.string().trim().min(1),

        contentType: imageContentTypeSchema,
      }),
    )
    .min(1)
    .max(3),
});

export type PreviewCallInput = z.input<typeof previewCallSchema>;

export type CreateCallInput = z.input<typeof createAdminCallSchema>;

export type PrepareCallAttachmentsInput = z.input<
  typeof prepareCallAttachmentsSchema
>;

export type ConfirmCallAttachmentsInput = z.input<
  typeof confirmCallAttachmentsSchema
>;

export type PreviewCallDTO = z.output<typeof previewCallSchema>;

export type CreateCallDTO = z.output<typeof createAdminCallSchema>;

export type PrepareCallAttachmentsDTO = z.output<
  typeof prepareCallAttachmentsSchema
>;

export type ConfirmCallAttachmentsDTO = z.output<
  typeof confirmCallAttachmentsSchema
>;
