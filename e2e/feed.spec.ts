import { test, expect } from "@playwright/test";
import { DEMO_USER, loginAs, grantBerlinLocation } from "./helpers";

test.describe("Feed", () => {
	test.beforeEach(async ({ page }) => {
		await grantBerlinLocation(page);
	});

	test("feed page renders header and filter", async ({ page }) => {
		await page.goto("/feed");
		await expect(page.getByText("Pulse Feed")).toBeVisible();
		// Time filter selector
		await expect(page.getByRole("combobox")).toBeVisible();
	});

	test("feed shows posts from seeded data", async ({ page }) => {
		await page.goto("/feed");
		// Wait for at least one post card to appear (seeded data covers Berlin bbox)
		await expect(
			page.locator('[data-testid="post-card"]').first()
		).toBeVisible({
			timeout: 10_000
		});
	});

	test("feed loads posts via Berlin fallback when location denied", async ({
		page
	}) => {
		// Clear permission BEFORE beforeEach would grant it — use context override
		await page.context().clearPermissions();
		await page.goto("/feed");
		// Location hook falls back to Berlin almost instantly; posts should still load
		await expect(page.getByText("Pulse Feed")).toBeVisible();
		await expect(
			page.locator('[data-testid="post-card"]').first()
		).toBeVisible({
			timeout: 10_000
		});
	});

	test("bottom navigation tab switches between map and feed", async ({
		page
	}) => {
		await page.goto("/map");
		await page.getByRole("button", { name: /feed/i }).click();
		await expect(page).toHaveURL("/feed");
		await page.getByRole("button", { name: /map/i }).click();
		await expect(page).toHaveURL("/map");
	});

	test("post tab redirects unauthenticated user to /login", async ({
		page
	}) => {
		await page.goto("/map");
		await page.getByRole("button", { name: /post/i }).click();
		await expect(page).toHaveURL("/login");
	});

	test("logged-in user can open create post page", async ({ page }) => {
		await loginAs(page, DEMO_USER.email, DEMO_USER.password);
		await page.getByRole("button", { name: /post/i }).click();
		await expect(page).toHaveURL("/post/new");
		await expect(page.getByText(/new pulse/i)).toBeVisible();
	});

	test("voting buttons visible and disabled when logged out", async ({
		page
	}) => {
		await grantBerlinLocation(page);
		await page.goto("/feed");
		const upvote = page.locator('button:has-text("▲")').first();
		await expect(upvote).toBeVisible({ timeout: 10_000 });
		await expect(upvote).toBeDisabled();
	});

	test("logged-in user sees enabled voting buttons", async ({ page }) => {
		await loginAs(page, DEMO_USER.email, DEMO_USER.password);
		await page.goto("/feed");
		const upvote = page.locator('button:has-text("▲")').first();
		await expect(upvote).toBeVisible({ timeout: 10_000 });
		await expect(upvote).toBeEnabled();
	});
});
