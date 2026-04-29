import { Op } from "sequelize";
import User from "./user.model";
import { TRUSTED_LOCALS_MIN_KARMA } from "./user.perks";
import { resolveTrustRole } from "../../shared/auth/auth.types";

export const UserRepository = {
	async findAll() {
		return User.findAll();
	},

	async findById(id: string | number) {
		return User.findOne({ where: { id } });
	},

	async findByIds(ids: number[]) {
		if (!ids.length) return [];
		return User.findAll({ where: { id: { [Op.in]: ids } } });
	},

	async search(query: string, limit = 20): Promise<User[]> {
		return User.findAll({
			where: {
				[Op.or]: [
					{ username: { [Op.like]: `%${query}%` } },
					{ displayName: { [Op.like]: `%${query}%` } }
				]
			},
			attributes: ["id", "username", "displayName", "avatarUrl"],
			limit
		});
	},

	async create(payload: Record<string, any>) {
		return User.create(payload as any);
	},

	async updateById(id: string | number, updates: Record<string, any>) {
		const user = await User.findByPk(id);
		if (!user) return null;
		return user.update(updates);
	},

	async updateEmailById(id: string | number, email: string) {
		const user = await User.findByPk(id);
		if (!user) return null;
		return user.update({ email });
	},

	async incrementKarma(id: string | number, delta: number) {
		const user = await User.findByPk(id);
		if (!user) return null;
		await user.increment("karmaScore", { by: delta });
		await user.reload();
		return user;
	},

	async syncTrustedStatus(id: string | number) {
		const user = await User.findByPk(id);
		if (!user) return null;
		const shouldBeTrusted = user.karmaScore >= TRUSTED_LOCALS_MIN_KARMA;
		const nextRole = resolveTrustRole(user.role, shouldBeTrusted);
		if (user.isTrusted !== shouldBeTrusted || user.role !== nextRole) {
			await user.update({
				isTrusted: shouldBeTrusted,
				role: nextRole
			});
		}
		return user;
	},

	async findTrustedUserIds(minKarma = TRUSTED_LOCALS_MIN_KARMA) {
		const users = await User.findAll({
			where: {
				[Op.or]: [
					{ isTrusted: true },
					{ karmaScore: { [Op.gte]: minKarma } }
				]
			},
			attributes: ["id"]
		});
		return users.map((user) => user.id);
	},

	async deleteById(id: string | number) {
		const deleted = await User.destroy({ where: { id } });
		return deleted > 0;
	}
};

export default UserRepository;
