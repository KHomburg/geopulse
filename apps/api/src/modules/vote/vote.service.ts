import VoteRepository from "./vote.repository";
import PostRepository from "../post/post.repository";
import type { VoteValue } from "./vote.model";
import UserRepository from "../user/user.repository";
import { ActivityService } from "../../shared/activity/activity.service";

export interface CastVoteResult {
	status: "created" | "updated" | "unchanged";
	karmaScore: number;
}

export const VoteService = {
	async castVote(
		userId: number,
		postId: number,
		value: VoteValue
	): Promise<CastVoteResult | null> {
		// Confirm the post exists
		const post = await PostRepository.findById(postId);
		if (!post) return null;

		const existing = await VoteRepository.findByUserAndPost(userId, postId);

		let delta = 0;
		let status: CastVoteResult["status"];

		if (!existing) {
			await VoteRepository.create(userId, postId, value);
			delta = value;
			status = "created";
		} else if (existing.value !== value) {
			// Switching vote: old vote removed, new vote applied (net delta = 2 * value)
			await VoteRepository.update(existing.id, value);
			delta = value - existing.value; // e.g. +1 to -1 gives delta = -2
			status = "updated";
		} else {
			status = "unchanged";
		}

		if (delta !== 0) {
			await PostRepository.incrementKarma(postId, delta);
			await UserRepository.incrementKarma(post.userId, delta);
			await UserRepository.syncTrustedStatus(post.userId);
			ActivityService.recordActivity({
				userId,
				lat: post.obfuscatedLat,
				lng: post.obfuscatedLng,
				weight: 3,
				kind: "vote"
			});
		}

		// Refresh karma from DB
		const refreshed = await PostRepository.findById(postId);
		return { status, karmaScore: refreshed?.karmaScore ?? post.karmaScore };
	},

	async removeVote(userId: number, postId: number): Promise<boolean> {
		const existing = await VoteRepository.findByUserAndPost(userId, postId);
		if (!existing) return false;

		await VoteRepository.deleteByUserAndPost(userId, postId);
		await PostRepository.incrementKarma(postId, -existing.value);
		const post = await PostRepository.findById(postId);
		if (post) {
			await UserRepository.incrementKarma(post.userId, -existing.value);
			await UserRepository.syncTrustedStatus(post.userId);
		}
		return true;
	},

	async getUserVote(
		userId: number,
		postId: number
	): Promise<VoteValue | null> {
		const vote = await VoteRepository.findByUserAndPost(userId, postId);
		return vote ? vote.value : null;
	}
};

export default VoteService;
