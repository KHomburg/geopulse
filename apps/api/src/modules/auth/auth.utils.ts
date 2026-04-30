import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "../../shared/config/env.config";
import crypto from "crypto";
import type { AccessTokenPayload } from "../../shared/auth/auth.types";

export async function hashPassword(password: string) {
	return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string) {
	return bcrypt.compare(password, hash);
}

export function signAccessToken(payload: AccessTokenPayload) {
	return jwt.sign(payload, config.TOKEN_KEY, { expiresIn: "15m" });
}

export function generateRefreshTokenValue() {
	return crypto.randomBytes(32).toString("hex");
}

export function hashRefreshTokenValue(token: string) {
	return crypto.createHash("sha256").update(token).digest("hex");
}
