import { expect, test } from '@playwright/test';

test('settings is reachable from the primary navigation', async ({ page }) => {
	await page.goto('./');

	await page
		.getByRole('navigation', { name: 'Primary' })
		.getByRole('link', { name: 'Settings' })
		.click();

	await expect(page).toHaveURL(/\/hoard\/settings\/?$/);
	await expect(page.getByRole('heading', { level: 1, name: 'Settings' })).toBeVisible();
});

test('settings survives a direct hard load through the SPA fallback', async ({ page }) => {
	const response = await page.goto('./settings');

	expect(response?.ok()).toBe(true);
	await expect(page.getByRole('heading', { level: 1, name: 'Settings' })).toBeVisible();
});

test('the theme can be changed from settings and persists across a reload', async ({ page }) => {
	await page.goto('./settings');
	// The SPA fallback serves a document for any path, so confirm we are really on
	// the settings page before trusting anything found on it.
	await expect(page.getByRole('heading', { level: 1, name: 'Settings' })).toBeVisible();

	await page.getByLabel('Theme').selectOption('dracula');
	await expect(page.locator('html')).toHaveAttribute('data-theme', 'dracula');

	await page.reload();

	await expect(page.locator('html')).toHaveAttribute('data-theme', 'dracula');
	await expect(page.getByLabel('Theme')).toHaveValue('dracula');
});

// The theme applies to the whole app, not just the page that changed it.
test('a theme chosen in settings still applies after navigating away', async ({ page }) => {
	await page.goto('./settings');
	await expect(page.getByRole('heading', { level: 1, name: 'Settings' })).toBeVisible();
	await page.getByLabel('Theme').selectOption('forest');

	await page
		.getByRole('navigation', { name: 'Primary' })
		.getByRole('link', { name: 'Home' })
		.click();

	await expect(page).toHaveURL(/\/hoard\/?$/);
	await expect(page.locator('html')).toHaveAttribute('data-theme', 'forest');
});
