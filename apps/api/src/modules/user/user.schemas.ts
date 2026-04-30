import { z } from "zod";

export const UpdateUserSchema = z.object({
	email: z.string().email().optional()
});

export const UpdateUserEmailSchema = z.object({
	email: z.string().email()
});

export const UserParamsSchema = z.object({
	id: z.string().regex(/^\d+$/)
});
