import User from "./user.model";

export const UserRepository = {
	async findAll() {
		return User.findAll();
	},

	async findById(id: string | number) {
		return User.findOne({ where: { id } });
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

	async deleteById(id: string | number) {
		const deleted = await User.destroy({ where: { id } });
		return deleted > 0;
	}
};

export default UserRepository;
