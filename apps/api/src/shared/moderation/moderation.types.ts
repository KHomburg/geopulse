export const MODERATION_STATUSES = [
	"published",
	"hidden_pending_review",
	"removed",
	"rejected",
	"shadow_hidden"
] as const;

export type ModerationStatus = (typeof MODERATION_STATUSES)[number];

export const PUBLISHED_MODERATION_STATUS: ModerationStatus = "published";

export const REPORT_CONTENT_TYPES = ["post", "comment", "profile"] as const;

export type ReportContentType = (typeof REPORT_CONTENT_TYPES)[number];

export const REPORT_CATEGORIES = [
	"spam",
	"harassment",
	"hate_speech",
	"illegal_content",
	"sexual_content",
	"violence",
	"impersonation",
	"misinformation",
	"other"
] as const;

export type ReportCategory = (typeof REPORT_CATEGORIES)[number];

export const REPORT_STATUSES = [
	"open",
	"auto_actioned",
	"resolved",
	"dismissed"
] as const;

export type ReportStatus = (typeof REPORT_STATUSES)[number];

export const ACTIVE_REPORT_STATUSES: ReportStatus[] = ["open", "auto_actioned"];

export const ADMIN_REVIEW_ACTIONS = ["approve", "remove"] as const;

export type AdminReviewAction = (typeof ADMIN_REVIEW_ACTIONS)[number];
