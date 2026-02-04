import AuthRepository from "./auth.repository";
import {
	hashPassword,
	comparePassword,
	signAccessToken,
	generateRefreshTokenValue
} from "./auth.utils";

export const AuthService = {
	async register(payload: { email: string; password: string }) {
		const existing = await AuthRepository.findByEmail(payload.email);
		if (existing) {
			return { conflict: true } as const;
		}
		const hashed = await hashPassword(payload.password);
		const user = await AuthRepository.createUser({
			email: payload.email,
			password: hashed
		});
		return { id: user.id, email: user.email };
	},

	async login(payload: { email: string; password: string }) {
		const user = await AuthRepository.findByEmail(payload.email);
		if (!user) return null;
		const valid = await comparePassword(payload.password, user.password);
		if (!valid) return null;
		const accessToken = signAccessToken({
			id: user.id as number,
			email: user.email
		});
		const refreshValue = generateRefreshTokenValue();
		const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
		await AuthRepository.createRefreshToken({
			userId: user.id as number,
			token: refreshValue,
			expiresAt
		});
		return { token: accessToken, refreshToken: refreshValue };
	},

	async deleteAccount(id: string | number) {
		return AuthRepository.deleteUserById(id);
	},

	async refresh(token: string) {
		const rt = await AuthRepository.findValidRefreshToken(token);
		if (!rt) return null;
		const user = await AuthRepository.findUserById(rt.userId);
		if (!user) return null;
		// rotate token: revoke old, create new
		await AuthRepository.revokeRefreshToken(token);
		const newValue = generateRefreshTokenValue();
		const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
		await AuthRepository.createRefreshToken({
			userId: rt.userId,
			token: newValue,
			expiresAt
		});
		const accessToken = signAccessToken({
			id: rt.userId,
			email: user.email
		});
		return { token: accessToken, refreshToken: newValue };
	},

	async logoutAll(userId: number) {
		await AuthRepository.revokeAllRefreshTokensForUser(userId);
		return true;
	}
};

export default AuthService;
