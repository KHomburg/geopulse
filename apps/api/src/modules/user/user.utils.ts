import type { User } from "./user.model";

// Remove sensitive fields from user instances before returning to clients
export function sanitizeUser(user: any) {
	const plain = typeof user.toJSON === "function" ? user.toJSON() : user;
	const { password, ...rest } = plain;
	return rest;
}
