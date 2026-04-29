import { apiClient } from "./client";

export interface CurrentUser {
	id: number;
	email: string;
	username: string | null;
	displayName: string | null;
	avatarUrl: string | null;
	karmaScore: number;
	isTrusted: boolean;
	pinAvatar: string | null;
	usernameColor: string | null;
	superPostCredits: number;
}

export interface KarmaPerk {
	key:
		| "pin_avatar_radar"
		| "username_color_sunburst"
		| "super_local_legend_credit";
	label: string;
	description: string;
	cost: number;
	previewValue: string | number;
	affordable: boolean;
	owned: boolean;
	currentKarma: number;
	superPostCredits: number;
}

export const userApi = {
	getMe: () => apiClient.get<CurrentUser>("/user/me"),
	getPerks: () => apiClient.get<{ data: KarmaPerk[] }>("/user/me/perks"),
	purchasePerk: (key: KarmaPerk["key"]) =>
		apiClient.post<CurrentUser>("/user/me/perks/purchase", { key })
};
