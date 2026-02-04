import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "../../shared/config/env.config";
import crypto from "crypto";

export async function hashPassword(password: string) {
	return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string) {
	return bcrypt.compare(password, hash);
}

export function signAccessToken(payload: { id: number; email: string }) {
	return jwt.sign(payload, config.TOKEN_KEY, { expiresIn: "15m" });
}

export function generateRefreshTokenValue() {
	return crypto.randomBytes(32).toString("hex");
}
