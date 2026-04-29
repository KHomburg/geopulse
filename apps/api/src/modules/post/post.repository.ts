import { Op, Sequelize, type FindAttributeOptions } from "sequelize";
import Post from "./post.model";
import Comment from "../comment/comment.model";
import type { AnonymityMode } from "./post.model";
import User from "../user/user.model";
import { TRUSTED_LOCALS_MIN_KARMA } from "../user/user.perks";

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

function commentCountAttributes() {
	return {
		include: [
			[
				Sequelize.literal(
					`(SELECT COUNT(*) FROM \`comment\` WHERE \`comment\`.\`postId\` = \`Post\`.\`id\` AND \`comment\`.\`deletedAt\` IS NULL)`
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
		return Post.findOne({
			where: { id, isActive: true },
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

	async findByLocation(params: {
		minLat: number;
		maxLat: number;
		minLng: number;
		maxLng: number;
		since: Date;
		limit: number;
		offset: number;
		trustedOnly?: boolean;
	}): Promise<Post[]> {
		return Post.findAll({
			where: {
				isActive: true,
				obfuscatedLat: { [Op.between]: [params.minLat, params.maxLat] },
				obfuscatedLng: { [Op.between]: [params.minLng, params.maxLng] },
				createdAt: { [Op.gte]: params.since }
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
