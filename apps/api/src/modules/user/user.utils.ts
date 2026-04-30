function toPlainUser(user: any) {
	return typeof user.toJSON === "function" ? user.toJSON() : user;
}

export function sanitizePublicUser(user: any) {
	const plain = toPlainUser(user);
	const { password, email, role, accountStatus, ...rest } = plain;
	return rest;
}

export function sanitizePrivateUser(user: any) {
	const plain = toPlainUser(user);
	const { password, ...rest } = plain;
	return rest;
}
