import { CommentRepository } from "../comment/comment.repository";
import PostRepository from "../post/post.repository";
import UserRepository from "../user/user.repository";
import ReportRepository from "./report.repository";
import type { UserRole } from "../../shared/auth/auth.types";
import type {
	ReportContentType,
	ReportCategory,
	ModerationStatus
} from "../../shared/moderation/moderation.types";

interface TargetLookup {
	targetUserId: number | null;
	moderationStatus: ModerationStatus | null;
}

async function lookupTarget(
	contentType: ReportContentType,
	targetId: number
): Promise<TargetLookup | null> {
	if (contentType === "post") {
		const post = await PostRepository.findByIdForModeration(targetId);
		return post
			? {
					targetUserId: post.userId,
					moderationStatus: post.moderationStatus
			  }
			: null;
	}

	if (contentType === "comment") {
		const comment = await CommentRepository.findByIdForModeration(targetId);
		return comment
			? {
					targetUserId: comment.userId,
					moderationStatus: comment.moderationStatus
			  }
			: null;
	}

	const user = await UserRepository.findById(targetId);
	return user
		? {
				targetUserId: user.id,
				moderationStatus: null
		  }
		: null;
}

function reporterWeight(input: {
	role: UserRole;
	isTrusted: boolean;
	karmaScore: number;
}) {
	if (input.role === "admin" || input.role === "community_mod") return 3;
	if (input.isTrusted || input.karmaScore >= 500) return 2;
	return 1;
}

async function maybeAutoHideTarget(
	contentType: ReportContentType,
	targetId: number,
	currentModerationStatus: ModerationStatus | null
) {
	if (contentType === "profile" || currentModerationStatus !== "published") {
		return { autoHidden: false, moderationStatus: currentModerationStatus };
	}

	const reports = await ReportRepository.findActiveByTarget(
		contentType,
		targetId
	);
	const distinctReporters = new Set(
		reports.map((report) => report.reporterId)
	);
	const totalWeight = reports.reduce(
		(sum, report) =>
			sum +
			(report.reporterTrustedSnapshot ||
			report.reporterKarmaSnapshot >= 500
				? 2
				: 1),
		0
	);

	if (distinctReporters.size < 3 && totalWeight < 4) {
		return { autoHidden: false, moderationStatus: currentModerationStatus };
	}

	if (contentType === "post") {
		await PostRepository.updateModerationStatus(
			targetId,
			"hidden_pending_review"
		);
	} else {
		await CommentRepository.updateModerationStatus(
			targetId,
			"hidden_pending_review"
		);
	}

	await ReportRepository.updateStatusesForTarget(
		contentType,
		targetId,
		"auto_actioned"
	);

	return {
		autoHidden: true,
		moderationStatus: "hidden_pending_review" as const
	};
}

export const ReportService = {
	async createReport(params: {
		reporterId: number;
		contentType: ReportContentType;
		targetId: number;
		category: ReportCategory;
		reason?: string | null;
	}) {
		const reporter = await UserRepository.findById(params.reporterId);
		if (!reporter) {
			throw Object.assign(new Error("Reporter not found"), {
				status: 404
			});
		}

		const existing = await ReportRepository.findExistingActiveReport(
			params.reporterId,
			params.contentType,
			params.targetId
		);
		if (existing) {
			throw Object.assign(new Error("You already reported this item"), {
				status: 409
			});
		}

		const target = await lookupTarget(params.contentType, params.targetId);
		if (!target) {
			throw Object.assign(new Error("Reported item not found"), {
				status: 404
			});
		}

		if (target.targetUserId === params.reporterId) {
			throw Object.assign(
				new Error("You cannot report your own content"),
				{
					status: 400
				}
			);
		}

		const report = await ReportRepository.create({
			contentType: params.contentType,
			targetId: params.targetId,
			targetUserId: target.targetUserId,
			reporterId: params.reporterId,
			category: params.category,
			reason: params.reason ?? null,
			reporterKarmaSnapshot: reporter.karmaScore,
			reporterTrustedSnapshot:
				reporter.isTrusted || reporterWeight(reporter) > 1,
			status: "open"
		});

		const autoHideResult = await maybeAutoHideTarget(
			params.contentType,
			params.targetId,
			target.moderationStatus
		);

		return {
			reportId: report.id,
			status: autoHideResult.autoHidden ? "auto_actioned" : report.status,
			autoHidden: autoHideResult.autoHidden,
			moderationStatus: autoHideResult.moderationStatus
		};
	}
};

export default ReportService;
