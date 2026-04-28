import { test, expect } from '@playwright/test';
import { DEMO_USER, loginAs, grantBerlinLocation } from './helpers';

test.describe('Create Post', () => {
  test.beforeEach(async ({ page }) => {
    await grantBerlinLocation(page);
    await loginAs(page, DEMO_USER.email, DEMO_USER.password);
    await page.goto('/post/new');
  });

  test('shows all three anonymity mode options', async ({ page }) => {
    await expect(page.getByText(/public/i)).toBeVisible();
    await expect(page.getByText(/alias/i)).toBeVisible();
    await expect(page.getByText(/anon/i)).toBeVisible();
  });

  test('post button is disabled when content is empty', async ({ page }) => {
    const postBtn = page.getByRole('button', { name: /^post$/i });
    await expect(postBtn).toBeDisabled();
  });

  test('alias mode shows pseudonym input', async ({ page }) => {
    // Pseudonym input should NOT be visible initially (public mode)
    await expect(page.getByLabel(/your alias/i)).not.toBeVisible();

    // Switch to local_legend mode
    await page.getByText(/alias/i).click();
    await expect(page.getByLabel(/your alias/i)).toBeVisible();
  });

  test('post button disabled when alias mode and pseudonym empty', async ({ page }) => {
    await page.getByText(/alias/i).click();
    await page.getByLabel(/what's happening here/i).fill('Test content');
    // No pseudonym filled → button stays disabled
    const postBtn = page.getByRole('button', { name: /^post$/i });
    await expect(postBtn).toBeDisabled();
  });

  test('successfully creates a public post and lands on feed', async ({ page }) => {
    const unique = `E2E public post ${Date.now()}`;
    await page.getByLabel(/what's happening here/i).fill(unique);
    await page.getByRole('button', { name: /^post$/i }).click();
    await expect(page).toHaveURL('/feed', { timeout: 10_000 });
    // The post should appear in the feed
    await expect(page.getByText(unique)).toBeVisible({ timeout: 8_000 });
  });

  test('successfully creates an anonymous post', async ({ page }) => {
    await page.getByText(/anon/i).click();
    const unique = `E2E anon post ${Date.now()}`;
    await page.getByLabel(/what's happening here/i).fill(unique);
    await page.getByRole('button', { name: /^post$/i }).click();
    await expect(page).toHaveURL('/feed', { timeout: 10_000 });
    await expect(page.getByText(unique)).toBeVisible({ timeout: 8_000 });
  });

  test('successfully creates an alias post', async ({ page }) => {
    await page.getByText(/alias/i).click();
    await page.getByLabel(/your alias/i).fill('TestAlias');
    const unique = `E2E alias post ${Date.now()}`;
    await page.getByLabel(/what's happening here/i).fill(unique);
    await page.getByRole('button', { name: /^post$/i }).click();
    await expect(page).toHaveURL('/feed', { timeout: 10_000 });
    await expect(page.getByText(unique)).toBeVisible({ timeout: 8_000 });
  });

  test('story toggle changes visual state', async ({ page }) => {
    // The toggle background changes color when clicked
    const toggleWrapper = page.locator('div[style*="border-radius: 12"]').first();
    const initialStyle = await toggleWrapper.getAttribute('style');
    await toggleWrapper.click();
    const afterStyle = await toggleWrapper.getAttribute('style');
    expect(initialStyle).not.toBe(afterStyle);
  });

  test('cancel button navigates back', async ({ page }) => {
    await page.getByRole('button', { name: /cancel/i }).click();
    // Should go back (to map or feed)
    await expect(page).not.toHaveURL('/post/new');
  });

  test('location status shows Berlin coordinates', async ({ page }) => {
    await expect(page.getByText(/located at 52\.\d+/i)).toBeVisible({ timeout: 8_000 });
  });
});
