import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
	testDir: "./e2e",
	globalSetup: "./e2e/global-setup.ts",
	fullyParallel: false,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: 1,
	reporter: "list",
	timeout: 30_000,

	use: {
		baseURL: "http://localhost:5173",
		trace: "on-first-retry",
		screenshot: "only-on-failure",
		headless: true
	},

	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] }
		}
	],

	// Start both API and frontend before running tests
	webServer: [
		{
			command: "npm run dev --workspace=apps/api",
			url: "http://localhost:8080/api/v1/health",
			reuseExistingServer: !process.env.CI,
			timeout: 30_000,
			stdout: "ignore",
			stderr: "pipe"
		},
		{
			command:
				"npm run dev --workspace=apps/home -- --port 5173 --strictPort",
			url: "http://localhost:5173",
			reuseExistingServer: !process.env.CI,
			timeout: 30_000,
			stdout: "ignore",
			stderr: "pipe"
		}
	]
});
