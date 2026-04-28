import { z } from "zod";

export const CreatePostSchema = z.object({
	content: z.string().min(1).max(2000),
	mediaUrl: z.string().url().optional(),
	anonymityMode: z
		.enum(["public", "local_legend", "anonymous"])
		.default("public"),
	pseudonym: z.string().min(1).max(50).optional(),
	lat: z.number().min(-90).max(90),
	lng: z.number().min(-180).max(180),
	isStory: z.boolean().default(false)
});

export const GetPostsQuerySchema = z.object({
	lat: z.coerce.number().min(-90).max(90),
	lng: z.coerce.number().min(-180).max(180),
	radiusKm: z.coerce.number().min(0.1).max(50).default(10),
	filter: z.enum(["now", "today", "week"]).default("today"),
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
