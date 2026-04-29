import AdminActionLogRepository from "./adminActionLog.repository";
import AuthRepository from "../auth/auth.repository";
import { CommentRepository } from "../comment/comment.repository";
import PostRepository from "../post/post.repository";
import ReportRepository from "../report/report.repository";
import UserRepository from "../user/user.repository";
import type { AccountStatus, UserRole } from "../../shared/auth/auth.types";
import type {
	AdminReviewAction,
	ReportContentType
} from "../../shared/moderation/moderation.types";

function serializeAdminUser(user: any) {
	const plain = typeof user.toJSON === "function" ? user.toJSON() : user;
	const { password, ...rest } = plain;
	return rest;
}

function serializeAuditEntry(entry: any) {
	const plain = typeof entry.toJSON === "function" ? entry.toJSON() : entry;
	return plain;
}

async function resolveModerationTarget(
	contentType: ReportContentType,
	targetId: number
) {
	if (contentType === "post") {
		const post = await PostRepository.findByIdForModeration(targetId);
		if (!post) return null;
		return {
			targetType: contentType,
			targetId,
			targetUserId: post.userId,
			state: post.moderationStatus,
			preview: {
				id: post.id,
				content: post.content,
				moderationStatus: post.moderationStatus,
				createdAt: post.createdAt,
				authorId: post.userId,
				commentCount: Number((post as any).get?.("commentCount") ?? 0)
			}
		};
	}

	if (contentType === "comment") {
		const comment = await CommentRepository.findByIdForModeration(targetId);
		if (!comment) return null;
		return {
			targetType: contentType,
			targetId,
			targetUserId: comment.userId,
			state: comment.moderationStatus,
			preview: {
				id: comment.id,
				content: comment.content,
				moderationStatus: comment.moderationStatus,
				createdAt: comment.createdAt,
				authorId: comment.userId,
				postId: comment.postId,
				parentId: comment.parentId
			}
		};
	}

	const user = await UserRepository.findById(targetId);
	if (!user) return null;
	return {
		targetType: contentType,
		targetId,
		targetUserId: user.id,
		state: user.accountStatus,
		preview: serializeAdminUser(user)
	};
}

export const AdminService = {
	async getUserById(id: string | number) {
		const user = await UserRepository.findById(id);
		return user ? serializeAdminUser(user) : null;
	},

	async updateUserModeration(
		actorId: number,
		id: string | number,
		updates: { role?: UserRole; accountStatus?: AccountStatus }
	) {
		const existing = await UserRepository.findById(id);
		if (!existing) return null;
		const updated = await UserRepository.updateById(id, updates);
		if (!updated) return null;
		if (
			updates.accountStatus === "banned" &&
			existing.accountStatus !== "banned"
		) {
			await AuthRepository.revokeAllRefreshTokensForUser(Number(id));
		}
		await AdminActionLogRepository.create({
			actorId,
			action: "user.moderation.updated",
			targetType: "user",
			targetId: Number(id),
			targetUserId: Number(id),
			reason: null,
			details: {
				before: {
					role: existing.role,
					accountStatus: existing.accountStatus
				},
				after: {
					role: updated.role,
					accountStatus: updated.accountStatus
				}
			}
		});
		return serializeAdminUser(updated);
	},

	async getModerationQueue(limit = 25) {
		const reports = await ReportRepository.findQueueReports(limit * 5);
		const grouped = new Map<
			string,
			{
				reportId: number;
				contentType: ReportContentType;
				targetId: number;
				targetUserId: number | null;
				reportCount: number;
				categories: Set<string>;
				latestReportAt: Date;
				autoHidden: boolean;
			}
		>();

		for (const report of reports) {
			const key = `${report.contentType}:${report.targetId}`;
			const current = grouped.get(key);
			if (!current) {
				grouped.set(key, {
					reportId: report.id,
					contentType: report.contentType,
					targetId: report.targetId,
					targetUserId: report.targetUserId,
					reportCount: 1,
					categories: new Set([report.category]),
					latestReportAt: report.createdAt,
					autoHidden: report.status === "auto_actioned"
				});
				continue;
			}

			current.reportCount += 1;
			current.categories.add(report.category);
			if (report.createdAt > current.latestReportAt) {
				current.latestReportAt = report.createdAt;
				current.reportId = report.id;
			}
			if (report.status === "auto_actioned") {
				current.autoHidden = true;
			}
		}

		const queue = await Promise.all(
			[...grouped.values()]
				.sort(
					(a, b) =>
						b.latestReportAt.getTime() - a.latestReportAt.getTime()
				)
				.slice(0, limit)
				.map(async (item) => ({
					...item,
					categories: [...item.categories],
					target: await resolveModerationTarget(
						item.contentType,
						item.targetId
					)
				}))
		);

		return queue.filter((item) => item.target != null);
	},

	async getModerationReport(reportId: number) {
		const report = await ReportRepository.findById(reportId);
		if (!report) return null;

		return {
			...(typeof report.toJSON === "function" ? report.toJSON() : report),
			target: await resolveModerationTarget(
				report.contentType,
				report.targetId
			)
		};
	},

	async reviewModerationReport(params: {
		reportId: number;
		actorId: number;
		action: AdminReviewAction;
		reason?: string | null;
	}) {
		const report = await ReportRepository.findById(params.reportId);
		if (!report) return null;

		const target = await resolveModerationTarget(
			report.contentType,
			report.targetId
		);
		if (!target) return null;

		const beforeState = target.state;
		if (params.action === "approve") {
			if (report.contentType === "post") {
				await PostRepository.updateModerationStatus(
					report.targetId,
					"published"
				);
			} else if (report.contentType === "comment") {
				await CommentRepository.updateModerationStatus(
					report.targetId,
					"published"
				);
			}
			await ReportRepository.updateStatusesForTarget(
				report.contentType,
				report.targetId,
				"dismissed"
			);
		} else {
			if (report.contentType === "post") {
				await PostRepository.updateModerationStatus(
					report.targetId,
					"removed"
				);
			} else if (report.contentType === "comment") {
				await CommentRepository.updateModerationStatus(
					report.targetId,
					"removed"
				);
			} else {
				await UserRepository.updateById(report.targetId, {
					accountStatus: "read_only_timeout"
				});
			}
			await ReportRepository.updateStatusesForTarget(
				report.contentType,
				report.targetId,
				"resolved"
			);
		}

		const afterTarget = await resolveModerationTarget(
			report.contentType,
			report.targetId
		);

		await AdminActionLogRepository.create({
			actorId: params.actorId,
			action: `report.${params.action}`,
			targetType: report.contentType,
			targetId: report.targetId,
			targetUserId: report.targetUserId,
			reason: params.reason ?? null,
			details: {
				reportId: report.id,
				beforeState,
				afterState: afterTarget?.state ?? null
			}
		});

		return {
			reportId: report.id,
			action: params.action,
			target: afterTarget
		};
	},

	async getAuditLog(limit = 25) {
		const entries = await AdminActionLogRepository.findRecent(limit);
		return entries.map(serializeAuditEntry);
	}
};

export default AdminService;
