import { test, expect } from "@playwright/test";
import { DEMO_USER, loginAs, grantBerlinLocation } from "./helpers";

test.describe("Map page", () => {
	test.beforeEach(async ({ page }) => {
		await grantBerlinLocation(page);
	});

	test("renders GeoPulse brand label", async ({ page }) => {
		await page.goto("/map");
		await expect(page.getByText("GeoPulse")).toBeVisible();
	});

	test("shows the MapLibre map canvas", async ({ page }) => {
		await page.goto("/map");
		// MapLibre renders a canvas element; wait up to 10s for map tiles to load
		const canvas = page.locator(".maplibregl-canvas");
		await expect(canvas).toBeVisible({ timeout: 10_000 });
	});

	test("time filter selector is visible on map", async ({ page }) => {
		await page.goto("/map");
		await expect(page.getByRole("combobox")).toBeVisible();
	});

	test("bottom navigation has all 4 tabs", async ({ page }) => {
		await page.goto("/map");
		await expect(page.getByRole("button", { name: /map/i })).toBeVisible();
		await expect(page.getByRole("button", { name: /feed/i })).toBeVisible();
		await expect(page.getByRole("button", { name: /post/i })).toBeVisible();
		await expect(
			page.getByRole("button", { name: /profile/i })
		).toBeVisible();
	});

	test("default route / redirects to /map", async ({ page }) => {
		await page.goto("/");
		await expect(page).toHaveURL("/map");
	});

	test("unknown route redirects to /map", async ({ page }) => {
		await page.goto("/does-not-exist");
		await expect(page).toHaveURL("/map");
	});
});
