import { z } from "zod";

export const CastVoteSchema = z.object({
	value: z.union([z.literal(1), z.literal(-1)])
});

export const VotePostIdParamSchema = z.object({
	postId: z.coerce.number().int().positive()
});
