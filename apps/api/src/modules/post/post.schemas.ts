import { z } from "zod";

export const PostTagSchema = z.enum(["food", "alert", "party", "news", "deal"]);

export const CreatePostSchema = z.object({
	content: z.string().min(1).max(2000),
	mediaUrl: z.string().url().optional(),
	anonymityMode: z
		.enum(["public", "local_legend", "anonymous"])
		.default("public"),
	pseudonym: z.string().min(1).max(50).optional(),
	postType: z.enum(["standard", "drop"]).default("standard"),
	tags: z.array(PostTagSchema).max(3).optional().default([]),
	dropHint: z.string().max(140).optional(),
	dropUnlockRadiusMeters: z.number().min(10).max(100).optional(),
	isSuperLocalLegend: z.boolean().default(false),
	lat: z.number().min(-90).max(90),
	lng: z.number().min(-180).max(180),
	isStory: z.boolean().default(false)
});

export const GetPostsQuerySchema = z.object({
	lat: z.coerce.number().min(-90).max(90),
	lng: z.coerce.number().min(-180).max(180),
	radiusKm: z.coerce.number().min(0.1).max(50).default(10),
	filter: z.enum(["now", "today", "week"]).default("today"),
	tags: z.string().optional(),
	limit: z.coerce.number().min(1).max(100).default(30),
	offset: z.coerce.number().min(0).default(0)
});

export const PostIdParamSchema = z.object({
	id: z.coerce.number().int().positive()
});

export const GetHotspotsQuerySchema = z.object({
	lat: z.coerce.number().min(-90).max(90),
	lng: z.coerce.number().min(-180).max(180),
	radiusKm: z.coerce.number().min(0.1).max(100).default(20),
	filter: z.enum(["now", "today", "week"]).default("today")
});
