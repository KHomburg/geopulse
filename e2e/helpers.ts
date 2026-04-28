import { Page, expect } from "@playwright/test";

/** Credentials for the seeded demo user */
export const DEMO_USER = {
	email: "demo@geopulse.dev",
	password: "Demo1234!"
};

export const ALICE_USER = {
	email: "alice@geopulse.dev",
	password: "Alice1234!"
};

/**
 * Log in via the UI login form.
 * Assumes the page is already at /login (or navigates there).
 */
export async function loginAs(page: Page, email: string, password: string) {
	await page.goto("/login");
	await page.getByLabel("Email").fill(email);
	// Mantine PasswordInput's label matches both the input AND the visibility button;
	// use the inner input directly to avoid the strict-mode ambiguity
	await page.locator('input[type="password"]').fill(password);
	await page.getByRole("button", { name: /sign in/i }).click();
	// Wait for navigation away from /login
	await expect(page).toHaveURL(/\/(map|feed|profile)/, { timeout: 10_000 });
}

/**
 * Clear auth state (localStorage) and reload.
 * Must navigate to the app first to avoid SecurityError on about:blank.
 */
export async function logout(page: Page) {
	const url = page.url();
	if (!url.includes("localhost")) {
		await page.goto("/");
	}
	await page.evaluate(() => {
		// Clear both the current key names and any legacy names
		[
			"gp_access_token",
			"gp_refresh_token",
			"geopulse_token",
			"geopulse_refresh",
			"geopulse_userId",
			"geopulse_email"
		].forEach((k) => localStorage.removeItem(k));
	});
}

/**
 * Grant geolocation permission and set Berlin coords before loading the page.
 */
export async function grantBerlinLocation(page: Page) {
	await page.context().grantPermissions(["geolocation"]);
	await page.context().setGeolocation({ latitude: 52.52, longitude: 13.405 });
}
