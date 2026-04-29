// Remove sensitive fields from user instances before returning to clients
export function sanitizeUser(user: any) {
	const plain = typeof user.toJSON === "function" ? user.toJSON() : user;
	const { password, role, accountStatus, ...rest } = plain;
	return rest;
}
