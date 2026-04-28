import { create } from "zustand";
import { authApi } from "../api/auth.api";

interface AuthState {
	userId: number | null;
	email: string | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	error: string | null;
	login: (email: string, password: string) => Promise<void>;
	register: (email: string, password: string) => Promise<void>;
	logout: () => Promise<void>;
	clearError: () => void;
}

function parseJwt(
	token: string
): { id: number; email: string; exp?: number } | null {
	try {
		const payload = JSON.parse(atob(token.split(".")[1]));
		return payload as { id: number; email: string; exp?: number };
	} catch {
		return null;
	}
}

function isTokenFresh(payload: { exp?: number } | null): boolean {
	if (!payload?.exp) return false;
	// Consider valid if it has more than 30 seconds of life left
	return payload.exp * 1000 > Date.now() + 30_000;
}

// Rehydrate from localStorage on startup — only trust unexpired tokens
const storedToken = localStorage.getItem("gp_access_token");
const storedPayload = storedToken ? parseJwt(storedToken) : null;
// If the access token is already expired, clear it so the interceptor won't
// attempt auth'd requests before the first /refresh round-trip completes.
if (storedPayload && !isTokenFresh(storedPayload)) {
	// Keep refresh token; the interceptor will exchange it on the first 401
	localStorage.removeItem("gp_access_token");
}

export const useAuthStore = create<AuthState>((set) => ({
	userId: storedPayload?.id ?? null,
	email: storedPayload?.email ?? null,
	isAuthenticated: storedPayload !== null && isTokenFresh(storedPayload),
	isLoading: false,
	error: null,

	login: async (email, password) => {
		set({ isLoading: true, error: null });
		try {
			const { data } = await authApi.login(email, password);
			localStorage.setItem("gp_access_token", data.token);
			localStorage.setItem("gp_refresh_token", data.refreshToken);
			const payload = parseJwt(data.token);
			set({
				isAuthenticated: true,
				userId: payload?.id ?? null,
				email: payload?.email ?? null,
				isLoading: false
			});
		} catch (err: unknown) {
			const message =
				(err as { response?: { data?: { message?: string } } })
					?.response?.data?.message ?? "Login failed";
			set({ error: message, isLoading: false });
		}
	},

	register: async (email, password) => {
		set({ isLoading: true, error: null });
		try {
			await authApi.register(email, password);
			// Auto-login after registration
			const { data } = await authApi.login(email, password);
			localStorage.setItem("gp_access_token", data.token);
			localStorage.setItem("gp_refresh_token", data.refreshToken);
			const payload = parseJwt(data.token);
			set({
				isAuthenticated: true,
				userId: payload?.id ?? null,
				email: payload?.email ?? null,
				isLoading: false
			});
		} catch (err: unknown) {
			const message =
				(err as { response?: { data?: { message?: string } } })
					?.response?.data?.message ?? "Registration failed";
			set({ error: message, isLoading: false });
		}
	},

	logout: async () => {
		try {
			await authApi.logout();
		} finally {
			localStorage.removeItem("gp_access_token");
			localStorage.removeItem("gp_refresh_token");
			set({ isAuthenticated: false, userId: null, email: null });
		}
	},

	clearError: () => set({ error: null })
}));

// When the axios interceptor clears tokens after a failed refresh, bring the
// Zustand store back in sync so the UI correctly shows the logged-out state.
window.addEventListener("auth:expired", () => {
	useAuthStore.setState({
		isAuthenticated: false,
		userId: null,
		email: null
	});
});
