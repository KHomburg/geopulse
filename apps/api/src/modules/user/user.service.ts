import UserRepository from "./user.repository";
import { sanitizePrivateUser, sanitizePublicUser } from "./user.utils";
import {
	KARMA_PERK_CATALOG,
	type PerkKey,
	TRUSTED_LOCALS_MIN_KARMA
} from "./user.perks";
import { resolveTrustRole } from "../../shared/auth/auth.types";

export const UserService = {
	async getUsers() {
		const users = await UserRepository.findAll();
		return users.map(sanitizePublicUser);
	},

	async getUserById(id: string | number) {
		const user = await UserRepository.findById(id);
		return user ? sanitizePublicUser(user) : null;
	},

	async getMe(userId: number) {
		const user = await UserRepository.findById(userId);
		return user ? sanitizePrivateUser(user) : null;
	},

	async updateUser(id: string | number, updates: Record<string, any>) {
		const updated = await UserRepository.updateById(id, updates);
		return updated ? sanitizePrivateUser(updated) : null;
	},

	async updateUserEmail(id: string | number, email: string) {
		const updated = await UserRepository.updateEmailById(id, email);
		return updated ? sanitizePrivateUser(updated) : null;
	},

	async getPerkCatalog(userId: number) {
		const user = await UserRepository.findById(userId);
		if (!user) {
			throw Object.assign(new Error("User not found"), { status: 404 });
		}

		return KARMA_PERK_CATALOG.map((perk) => ({
			...perk,
			affordable: user.karmaScore >= perk.cost,
			owned:
				(perk.key === "pin_avatar_radar" && user.pinAvatar === "📡") ||
				(perk.key === "username_color_sunburst" &&
					user.usernameColor === "#ff9f43") ||
				(perk.key === "super_local_legend_credit" &&
					user.superPostCredits > 0),
			currentKarma: user.karmaScore,
			superPostCredits: user.superPostCredits
		}));
	},

	async purchasePerk(userId: number, key: PerkKey) {
		const user = await UserRepository.findById(userId);
		if (!user) {
			throw Object.assign(new Error("User not found"), { status: 404 });
		}

		const perk = KARMA_PERK_CATALOG.find((entry) => entry.key === key);
		if (!perk) {
			throw Object.assign(new Error("Unknown perk"), { status: 400 });
		}

		if (user.karmaScore < perk.cost) {
			throw Object.assign(new Error("Not enough karma"), { status: 400 });
		}

		const nextKarma = user.karmaScore - perk.cost;
		const nextIsTrusted = nextKarma >= TRUSTED_LOCALS_MIN_KARMA;
		const updates: Record<string, unknown> = {
			karmaScore: nextKarma,
			isTrusted: nextIsTrusted,
			role: resolveTrustRole(user.role, nextIsTrusted)
		};

		if (key === "pin_avatar_radar") {
			updates.pinAvatar = "📡";
		}
		if (key === "username_color_sunburst") {
			updates.usernameColor = "#ff9f43";
		}
		if (key === "super_local_legend_credit") {
			updates.superPostCredits = user.superPostCredits + 1;
		}

		const updated = await UserRepository.updateById(userId, updates);
		return updated ? sanitizePrivateUser(updated) : null;
	},

	async deleteUser(id: string | number) {
		return UserRepository.deleteById(id);
	},

	async searchUsers(query: string) {
		const users = await UserRepository.search(query);
		return users.map(sanitizePublicUser);
	}
};

export default UserService;
