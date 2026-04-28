import { test, expect } from "@playwright/test";
import { DEMO_USER, ALICE_USER, loginAs, logout } from "./helpers";

test.describe("Authentication", () => {
	test("login page renders brand and form", async ({ page }) => {
		await page.goto("/login");
		await expect(page.getByText("GeoPulse")).toBeVisible();
		await expect(page.getByLabel("Email")).toBeVisible();
		await expect(
			page.locator('input[type="password"]').first()
		).toBeVisible();
		await expect(
			page.getByRole("button", { name: /sign in/i })
		).toBeVisible();
	});

	test("shows sign up link that navigates to /register", async ({ page }) => {
		await page.goto("/login");
		await page.getByRole("button", { name: /sign up/i }).click();
		await expect(page).toHaveURL("/register");
		await expect(page.getByText("GeoPulse")).toBeVisible();
		await expect(page.getByLabel("Confirm Password")).toBeVisible();
	});

	test("shows error on invalid credentials", async ({ page }) => {
		await page.goto("/login");
		await page.getByLabel("Email").fill("wrong@example.com");
		await page.locator('input[type="password"]').fill("wrongpassword");
		await page.getByRole("button", { name: /sign in/i }).click();
		// Should stay on /login and show an error
		await expect(page).toHaveURL("/login");
		await expect(page.getByRole("alert")).toBeVisible({ timeout: 8_000 });
	});

	test("successful login with demo account navigates to /map", async ({
		page
	}) => {
		await loginAs(page, DEMO_USER.email, DEMO_USER.password);
		await expect(page).toHaveURL("/map");
	});

	test("register page validates password strength", async ({ page }) => {
		await page.goto("/register");
		// A strong password triggers the strength indicator
		await page.locator('input[type="password"]').first().fill("TestPass1!");
		// Strength label "Strong" should appear below the password field
		await expect(page.getByText("Strong")).toBeVisible();
	});

	test("register page shows mismatch error", async ({ page }) => {
		await page.goto("/register");
		await page.getByLabel("Email").fill("newuser@test.com");
		await page
			.locator('input[type="password"]')
			.nth(0)
			.fill("Password123!");
		await page
			.locator('input[type="password"]')
			.nth(1)
			.fill("Different123!");
		await expect(page.getByText(/do not match/i)).toBeVisible();
	});

	test("register new account and land on /map", async ({ page }) => {
		const unique = `e2e_${Date.now()}@geopulse.dev`;
		await page.goto("/register");
		await page.getByLabel("Email").fill(unique);
		await page
			.locator('input[type="password"]')
			.nth(0)
			.fill("TestPass123!");
		await page
			.locator('input[type="password"]')
			.nth(1)
			.fill("TestPass123!");
		await page.getByRole("button", { name: /create account/i }).click();
		await expect(page).toHaveURL(/\/(map|feed)/, { timeout: 10_000 });
	});

	test("profile page shows sign-in prompt when logged out", async ({
		page
	}) => {
		await logout(page);
		await page.goto("/profile");
		await expect(page.getByText(/sign in to geopulse/i)).toBeVisible();
	});

	test("profile page shows email when logged in", async ({ page }) => {
		await loginAs(page, ALICE_USER.email, ALICE_USER.password);
		await page.goto("/profile");
		await expect(page.getByText(ALICE_USER.email)).toBeVisible();
	});

	test("sign out clears session and shows prompt", async ({ page }) => {
		await loginAs(page, DEMO_USER.email, DEMO_USER.password);
		await page.goto("/profile");
		await page.getByRole("button", { name: /sign out/i }).click();
		// App navigates to /map after logout; go back to /profile to confirm session cleared
		await expect(page).toHaveURL("/map", { timeout: 5_000 });
		await page.goto("/profile");
		await expect(page.getByText(/sign in to geopulse/i)).toBeVisible({
			timeout: 5_000
		});
	});
});
