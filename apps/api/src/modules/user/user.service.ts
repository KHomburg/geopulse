import UserRepository from "./user.repository";
import { sanitizeUser } from "./user.utils";

export const UserService = {
	async getUsers() {
		const users = await UserRepository.findAll();
		return users.map(sanitizeUser);
	},

	async getUserById(id: string | number) {
		const user = await UserRepository.findById(id);
		return user ? sanitizeUser(user) : null;
	},

	async createUser(payload: Record<string, any>) {
		const created = await UserRepository.create(payload);
		return sanitizeUser(created);
	},

	async updateUser(id: string | number, updates: Record<string, any>) {
		const updated = await UserRepository.updateById(id, updates);
		return updated ? sanitizeUser(updated) : null;
	},

	async updateUserEmail(id: string | number, email: string) {
		const updated = await UserRepository.updateEmailById(id, email);
		return updated ? sanitizeUser(updated) : null;
	},

	async deleteUser(id: string | number) {
		return UserRepository.deleteById(id);
	},

	async searchUsers(query: string) {
		const users = await UserRepository.search(query);
		return users.map(sanitizeUser);
	}
};

export default UserService;
