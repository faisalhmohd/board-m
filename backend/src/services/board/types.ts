import { z } from "zod";

export const baseBoardSchema = z.object({
  name: z.string(),
  description: z.string(),
  parentBoardId: z.string().uuid().optional(),
});

export const boardSchema = baseBoardSchema.extend({
  id: z.string().uuid(),
});

export type Board = z.infer<typeof boardSchema>;
export type BoardPayload = z.infer<typeof baseBoardSchema>;