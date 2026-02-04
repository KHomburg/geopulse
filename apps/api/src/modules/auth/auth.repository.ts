import User from "../user/user.model";
import RefreshToken from "./refreshToken.model";

export const AuthRepository = {
	async findByEmail(email: string) {
		return User.findOne({ where: { email } });
	},

	async findUserById(id: number) {
		return User.findByPk(id);
	},

	async createUser(payload: { email: string; password: string }) {
		return User.create(payload as any);
	},

	async deleteUserById(id: string | number) {
		const deleted = await User.destroy({ where: { id } });
		return deleted > 0;
	},

	async createRefreshToken(payload: {
		userId: number;
		token: string;
		expiresAt: Date;
	}) {
		return RefreshToken.create(payload as any);
	},

	async revokeRefreshToken(token: string) {
		const rt = await RefreshToken.findOne({ where: { token } });
		if (!rt) return false;
		await rt.update({ revoked: true });
		return true;
	},

	async revokeAllRefreshTokensForUser(userId: number) {
		await RefreshToken.update({ revoked: true }, { where: { userId } });
		return true;
	},

	async findValidRefreshToken(token: string) {
		const rt = await RefreshToken.findOne({
			where: { token, revoked: false }
		});
		if (!rt) return null;
		if (new Date(rt.expiresAt).getTime() <= Date.now()) return null;
		return rt;
	}
};

export default AuthRepository;
