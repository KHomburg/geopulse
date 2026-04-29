export const USER_ROLES = [
	"user",
	"trusted_user",
	"community_mod",
	"admin"
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const ACCOUNT_STATUSES = [
	"active",
	"read_only_timeout",
	"shadow_banned",
	"banned"
] as const;

export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

export interface AccessTokenPayload {
	id: number;
	email: string;
	role: UserRole;
	accountStatus: AccountStatus;
}

export function isUserRole(value: unknown): value is UserRole {
	return typeof value === "string" && USER_ROLES.includes(value as UserRole);
}

export function isAccountStatus(value: unknown): value is AccountStatus {
	return (
		typeof value === "string" &&
		ACCOUNT_STATUSES.includes(value as AccountStatus)
	);
}

export function resolveTrustRole(
	role: UserRole | null | undefined,
	isTrusted: boolean
): UserRole {
	if (role === "admin" || role === "community_mod") {
		return role;
	}

	return isTrusted ? "trusted_user" : "user";
}

export function isAdminRole(role: UserRole | null | undefined): boolean {
	return role === "admin";
}
