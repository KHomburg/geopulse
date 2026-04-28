import Vote from "./vote.model";
import type { VoteValue } from "./vote.model";

export const VoteRepository = {
	async findByUserAndPost(
		userId: number,
		postId: number
	): Promise<Vote | null> {
		return Vote.findOne({ where: { userId, postId } });
	},

	async create(
		userId: number,
		postId: number,
		value: VoteValue
	): Promise<Vote> {
		return Vote.create({ userId, postId, value } as Record<
			string,
			unknown
		>);
	},

	async update(id: number, value: VoteValue): Promise<Vote | null> {
		const vote = await Vote.findByPk(id);
		if (!vote) return null;
		return vote.update({ value });
	},

	async deleteByUserAndPost(
		userId: number,
		postId: number
	): Promise<boolean> {
		const deleted = await Vote.destroy({ where: { userId, postId } });
		return deleted > 0;
	},

	async countForPost(
		postId: number
	): Promise<{ upvotes: number; downvotes: number }> {
		const all = await Vote.findAll({ where: { postId } });
		const upvotes = all.filter((v) => v.value === 1).length;
		const downvotes = all.filter((v) => v.value === -1).length;
		return { upvotes, downvotes };
	}
};

export default VoteRepository;
