import { Op, Sequelize, type FindAttributeOptions } from "sequelize";
import Post from "./post.model";
import Comment from "../comment/comment.model";
import type { AnonymityMode } from "./post.model";
import User from "../user/user.model";
import { TRUSTED_LOCALS_MIN_KARMA } from "../user/user.perks";
import {
	PUBLISHED_MODERATION_STATUS,
	type ModerationStatus
} from "../../shared/moderation/moderation.types";

export interface CreatePostPayload {
	userId: number;
	content: string;
	mediaUrl?: string | null;
	anonymityMode: AnonymityMode;
	pseudonym?: string | null;
	obfuscatedLat: number;
	obfuscatedLng: number;
	postType?: "standard" | "drop";
	tags?: string | null;
	dropHint?: string | null;
	dropUnlockRadiusMeters?: number | null;
	boostedUntil?: Date | null;
	moderationStatus?: ModerationStatus;
	isStory: boolean;
	expiresAt?: Date | null;
}

const AUTHOR_ATTRS = [
	"id",
	"username",
	"displayName",
	"avatarUrl",
	"karmaScore",
	"isTrusted",
	"pinAvatar",
	"usernameColor"
];

const POST_VISIBILITY_WINDOW_MS = 24 * 60 * 60 * 1000;

function activeVisibilityWindowWhere(now = new Date()) {
	const visibilityFloor = new Date(now.getTime() - POST_VISIBILITY_WINDOW_MS);

	return {
		[Op.or]: [
			{ expiresAt: { [Op.gt]: now } },
			{
				expiresAt: null,
				createdAt: { [Op.gte]: visibilityFloor }
			}
		]
	};
}

function commentCountAttributes() {
	return {
		include: [
			[
				Sequelize.literal(
					`(SELECT COUNT(*) FROM \`comment\` WHERE \`comment\`.\`postId\` = \`Post\`.\`id\` AND \`comment\`.\`deletedAt\` IS NULL AND \`comment\`.\`moderationStatus\` = '${PUBLISHED_MODERATION_STATUS}')`
				),
				"commentCount"
			]
		]
	} as FindAttributeOptions;
}

export const PostRepository = {
	async create(payload: CreatePostPayload): Promise<Post> {
		return Post.create({
			postType: "standard",
			...payload
		} as unknown as Record<string, unknown>);
	},

	async findById(id: number): Promise<Post | null> {
		return PostRepository.findByIdForViewer(id);
	},

	async findByIdForViewer(
		id: number,
		requesterId?: number
	): Promise<Post | null> {
		const moderationWhere =
			requesterId == null
				? { moderationStatus: PUBLISHED_MODERATION_STATUS }
				: {
						[Op.or]: [
							{
								moderationStatus: PUBLISHED_MODERATION_STATUS
							},
							{
								userId: requesterId,
								moderationStatus: "shadow_hidden"
							}
						]
				  };

		return Post.findOne({
			where: {
				id,
				isActive: true,
				[Op.and]: [moderationWhere, activeVisibilityWindowWhere()]
			},
			attributes: commentCountAttributes(),
			include: [
				{
					model: User,
					as: "author",
					attributes: AUTHOR_ATTRS,
					required: false
				}
			]
		});
	},

	async findByIdForOwner(id: number, userId: number): Promise<Post | null> {
		return Post.findOne({
			where: { id, userId },
			attributes: commentCountAttributes(),
			include: [
				{
					model: User,
					as: "author",
					attributes: AUTHOR_ATTRS,
					required: false
				}
			]
		});
	},

	async findByIdForModeration(id: number): Promise<Post | null> {
		return Post.findOne({
			where: { id },
			attributes: commentCountAttributes(),
			include: [
				{
					model: User,
					as: "author",
					attributes: AUTHOR_ATTRS,
					required: false
				}
			]
		});
	},

	async findByIdsForModeration(ids: number[]): Promise<Post[]> {
		if (!ids.length) return [];
		return Post.findAll({
			where: { id: { [Op.in]: ids } },
			attributes: commentCountAttributes(),
			include: [
				{
					model: User,
					as: "author",
					attributes: AUTHOR_ATTRS,
					required: false
				}
			]
		});
	},

	async findByLocation(params: {
		minLat: number;
		maxLat: number;
		minLng: number;
		maxLng: number;
		since: Date;
		limit: number;
		offset: number;
		trustedOnly?: boolean;
		requesterId?: number;
	}): Promise<Post[]> {
		const visibilityWhere =
			params.requesterId == null
				? { moderationStatus: PUBLISHED_MODERATION_STATUS }
				: {
						[Op.or]: [
							{
								moderationStatus: PUBLISHED_MODERATION_STATUS
							},
							{
								userId: params.requesterId,
								moderationStatus: "shadow_hidden"
							}
						]
				  };

		return Post.findAll({
			where: {
				isActive: true,
				[Op.and]: [
					visibilityWhere,
					activeVisibilityWindowWhere(),
					{
						obfuscatedLat: {
							[Op.between]: [params.minLat, params.maxLat]
						}
					},
					{
						obfuscatedLng: {
							[Op.between]: [params.minLng, params.maxLng]
						}
					},
					{ createdAt: { [Op.gte]: params.since } }
				]
			},
			attributes: commentCountAttributes(),
			include: [
				{
					model: User,
					as: "author",
					attributes: AUTHOR_ATTRS,
					required: params.trustedOnly ?? false,
					where:
						params.trustedOnly === true
							? {
									[Op.or]: [
										{ isTrusted: true },
										{
											karmaScore: {
												[Op.gte]:
													TRUSTED_LOCALS_MIN_KARMA
											}
										}
									]
							  }
							: undefined
				}
			],
			order: [
				[
					Sequelize.literal(
						"CASE WHEN `Post`.`boostedUntil` IS NOT NULL AND `Post`.`boostedUntil` > CURRENT_TIMESTAMP THEN 0 ELSE 1 END"
					),
					"ASC"
				],
				["boostedUntil", "DESC"],
				["karmaScore", "DESC"],
				["createdAt", "DESC"]
			],
			limit: params.limit,
			offset: params.offset
		});
	},

	async findForHotspots(params: {
		minLat: number;
		maxLat: number;
		minLng: number;
		maxLng: number;
		since: Date;
	}): Promise<Post[]> {
		return Post.findAll({
			where: {
				isActive: true,
				moderationStatus: PUBLISHED_MODERATION_STATUS,
				[Op.and]: [activeVisibilityWindowWhere()],
				obfuscatedLat: { [Op.between]: [params.minLat, params.maxLat] },
				obfuscatedLng: { [Op.between]: [params.minLng, params.maxLng] },
				createdAt: { [Op.gte]: params.since }
			},
			attributes: ["id", "obfuscatedLat", "obfuscatedLng", "karmaScore"]
		});
	},

	async incrementKarma(id: number, delta: number): Promise<void> {
		await Post.increment("karmaScore", { by: delta, where: { id } });
	},

	async softDeleteByIdAndUser(id: number, userId: number): Promise<boolean> {
		const deleted = await Post.destroy({ where: { id, userId } });
		return deleted > 0;
	},

	async updateModerationStatus(
		id: number,
		moderationStatus: ModerationStatus
	): Promise<boolean> {
		const [affected] = await Post.update(
			{ moderationStatus },
			{ where: { id } }
		);
		return affected > 0;
	},

	async deactivateExpiredStories(): Promise<number> {
		const [affected] = await Post.update(
			{ isActive: false },
			{
				where: {
					isStory: true,
					isActive: true,
					expiresAt: { [Op.lt]: new Date() }
				}
			}
		);
		return affected;
	}
};

export default PostRepository;
