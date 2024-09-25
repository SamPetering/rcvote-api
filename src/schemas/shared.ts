import { z } from 'zod';

export const idResponseSchema = z.object({
  success: z.boolean(),
  id: z.union([z.string(), z.number()]),
});

export const boolResponseSchema = z.object({
  success: z.boolean(),
  value: z.boolean(),
});

export const messageResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
