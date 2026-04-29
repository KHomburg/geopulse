import { CommentRepository } from "./comment.repository";
import PostRepository from "../post/post.repository";
import NotificationService from "../notification/notification.service";
import { ActivityService } from "../../shared/activity/activity.service";
import type { AccountStatus } from "../../shared/auth/auth.types";

const CommentService = {
	async createComment(params: {
		postId: number;
		userId: number;
		content: string;
		parentId?: number | null;
		accountStatus?: AccountStatus;
	}) {
		const post = await PostRepository.findByIdForViewer(
			params.postId,
			params.userId
		);
		if (!post) {
			throw Object.assign(new Error("Post not found"), { status: 404 });
		}
		const comment = await CommentRepository.create({
			...params,
			moderationStatus:
				params.accountStatus === "shadow_banned"
					? "shadow_hidden"
					: "published"
		});
		ActivityService.recordActivity({
			userId: params.userId,
			lat: post.obfuscatedLat,
			lng: post.obfuscatedLng,
			weight: 2,
			kind: "comment"
		});

		// Notify post owner (if not the commenter)
		if (post.userId !== params.userId) {
			await NotificationService.createNotification({
				userId: post.userId,
				type: "post_comment",
				message: "Someone commented on your post",
				referenceId: params.postId,
				referenceType: "post",
				actorId: params.userId
			}).catch(() => {});
		}

		// Notify parent comment author for replies
		if (params.parentId) {
			const parent = await CommentRepository.findById(params.parentId);
			if (parent && parent.userId !== params.userId) {
				await NotificationService.createNotification({
					userId: parent.userId,
					type: "post_comment",
					message: "Someone replied to your comment",
					referenceId: params.postId,
					referenceType: "post",
					actorId: params.userId
				}).catch(() => {});
			}
		}

		return comment;
	},

	async getComments(postId: number, requesterId?: number) {
		return CommentRepository.findByPost(postId, requesterId);
	},

	async deleteComment(id: number, userId: number) {
		const deleted = await CommentRepository.softDeleteByIdAndUser(
			id,
			userId
		);
		if (!deleted) {
			throw Object.assign(
				new Error("Comment not found or not owned by user"),
				{ status: 404 }
			);
		}
	}
};

export default CommentService;
