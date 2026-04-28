import { apiClient } from "./client";

export interface AuthUser {
	id: number;
	email: string;
	username: string | null;
	displayName: string | null;
	karmaScore: number;
}

export interface LoginResponse {
	token: string;
	refreshToken: string;
}

export interface RegisterResponse {
	id: number;
	email: string;
}

export const authApi = {
	register(email: string, password: string) {
		return apiClient.post<RegisterResponse>("/auth/register", {
			email,
			password
		});
	},

	login(email: string, password: string) {
		return apiClient.post<LoginResponse>("/auth/login", {
			email,
			password
		});
	},

	logout() {
		return apiClient.post("/auth/logout");
	}
};
