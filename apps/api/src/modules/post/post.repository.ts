import { Op } from "sequelize";
import Post from "./post.model";
import type { AnonymityMode } from "./post.model";

export interface CreatePostPayload {
	userId: number;
	content: string;
	mediaUrl?: string | null;
	anonymityMode: AnonymityMode;
	pseudonym?: string | null;
	obfuscatedLat: number;
	obfuscatedLng: number;
	isStory: boolean;
	expiresAt?: Date | null;
}

function timeFilterToDate(filter: "now" | "today" | "week"): Date {
	const now = new Date();
	if (filter === "now") {
		now.setHours(now.getHours() - 1);
	} else if (filter === "today") {
		now.setHours(0, 0, 0, 0);
	} else {
		now.setDate(now.getDate() - 7);
	}
	return now;
}

export const PostRepository = {
	async create(payload: CreatePostPayload): Promise<Post> {
		return Post.create(payload as unknown as Record<string, unknown>);
	},

	async findById(id: number): Promise<Post | null> {
		return Post.findOne({ where: { id, isActive: true } });
	},

	async findByIdForOwner(id: number, userId: number): Promise<Post | null> {
		return Post.findOne({ where: { id, userId } });
	},

	async findByLocation(params: {
		minLat: number;
		maxLat: number;
		minLng: number;
		maxLng: number;
		since: Date;
		limit: number;
		offset: number;
	}): Promise<Post[]> {
		return Post.findAll({
			where: {
				isActive: true,
				obfuscatedLat: { [Op.between]: [params.minLat, params.maxLat] },
				obfuscatedLng: { [Op.between]: [params.minLng, params.maxLng] },
				createdAt: { [Op.gte]: params.since }
			},
			order: [
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
