import { z } from "zod";
import {
	REPORT_CATEGORIES,
	REPORT_CONTENT_TYPES
} from "../../shared/moderation/moderation.types";

export const CreateReportSchema = z.object({
	contentType: z.enum(REPORT_CONTENT_TYPES),
	targetId: z.coerce.number().int().positive(),
	category: z.enum(REPORT_CATEGORIES),
	reason: z.string().trim().max(1000).optional().nullable()
});
