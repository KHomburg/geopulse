import axios from "axios";

export const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

export const apiClient = axios.create({
	baseURL: `${API_BASE}/api/v1`,
	timeout: 10_000,
	headers: { "Content-Type": "application/json" }
});

// Attach JWT on every request when available
apiClient.interceptors.request.use((config) => {
	const token = localStorage.getItem("gp_access_token");
	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}
	return config;
});

// Auto-refresh on 401 (single retry)
apiClient.interceptors.response.use(
	(response) => response,
	async (error) => {
		const original = error.config as typeof error.config & {
			_retry?: boolean;
		};
		if (error.response?.status === 401 && !original._retry) {
			original._retry = true;
			const refreshToken = localStorage.getItem("gp_refresh_token");
			if (refreshToken) {
				try {
					const { data } = await axios.post(
						`${API_BASE}/api/v1/auth/refresh`,
						{
							refreshToken
						}
					);
					localStorage.setItem(
						"gp_access_token",
						data.token as string
					);
					localStorage.setItem(
						"gp_refresh_token",
						data.refreshToken as string
					);
					original.headers.Authorization = `Bearer ${
						data.token as string
					}`;
					return apiClient(original);
				} catch {
					// Refresh failed — clear tokens and signal the auth store
					localStorage.removeItem("gp_access_token");
					localStorage.removeItem("gp_refresh_token");
					window.dispatchEvent(new CustomEvent("auth:expired"));
				}
			}
		}
		return Promise.reject(error);
	}
);

export default apiClient;
