import { z } from "zod";
import { ACCOUNT_STATUSES, USER_ROLES } from "../../shared/auth/auth.types";
import { ADMIN_REVIEW_ACTIONS } from "../../shared/moderation/moderation.types";

export const AdminUserParamsSchema = z.object({
	id: z.string().regex(/^\d+$/)
});

export const UpdateAdminUserModerationSchema = z
	.object({
		role: z.enum(USER_ROLES).optional(),
		accountStatus: z.enum(ACCOUNT_STATUSES).optional()
	})
	.refine((value) => Object.keys(value).length > 0, {
		message: "At least one moderation field is required"
	});

export const AdminReportParamsSchema = z.object({
	id: z.string().regex(/^\d+$/)
});

export const ModerationQueueQuerySchema = z.object({
	limit: z.coerce.number().int().positive().max(100).optional().default(25)
});

export const ReviewModerationReportSchema = z.object({
	action: z.enum(ADMIN_REVIEW_ACTIONS),
	reason: z.string().trim().max(1000).optional().nullable()
});

export const AdminAuditLogQuerySchema = z.object({
	limit: z.coerce.number().int().positive().max(100).optional().default(25)
});
