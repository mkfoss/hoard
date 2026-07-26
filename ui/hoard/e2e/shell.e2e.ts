import { expect, test } from '@playwright/test';

test('the shell loads at the configured base path', async ({ page }) => {
	const response = await page.goto('./');

	expect(response?.ok()).toBe(true);
	await expect(page).toHaveURL(/\/hoard\/?$/);
});

test('the Hoard name and tagline are visible', async ({ page }) => {
	await page.goto('./');

	await expect(page.getByRole('heading', { level: 1, name: 'Hoard' })).toBeVisible();
	await expect(page.getByText('Your media. Your server. Your rules.')).toBeVisible();
});

test('the classic-interface link targets the site root', async ({ page }) => {
	await page.goto('./');

	const link = page.getByRole('link', { name: 'Open the classic interface' });

	await expect(link).toBeVisible();
	await expect(link).toHaveAttribute('href', '/');
});

// The app must still render and say so when the backend is down, rather than
// showing a blank page or an unhandled rejection.
//
// The failure is forced rather than relying on no server being reachable: a
// developer running stash locally would otherwise see this pass in CI and fail on
// their machine, for reasons that have nothing to do with the change under test.
test('degrades gracefully when the server cannot be reached', async ({ page }) => {
	const crashes: string[] = [];
	page.on('pageerror', (error) => crashes.push(error.message));
	await page.route('**/graphql', (route) => route.abort('connectionrefused'));

	await page.goto('./');

	await expect(page.getByRole('heading', { level: 1, name: 'Hoard' })).toBeVisible();
	await expect(page.getByText('Server unreachable')).toBeVisible();
	expect(crashes).toEqual([]);
});

test('assets are requested from below the base path', async ({ page }) => {
	const scripts: string[] = [];
	page.on('request', (request) => {
		if (request.resourceType() === 'script') scripts.push(new URL(request.url()).pathname);
	});

	await page.goto('./');
	await expect(page.getByRole('heading', { level: 1, name: 'Hoard' })).toBeVisible();

	expect(scripts.length).toBeGreaterThan(0);
	expect(scripts.every((pathname) => pathname.startsWith('/hoard/'))).toBe(true);
});
