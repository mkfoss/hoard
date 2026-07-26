import { expect, test } from '@playwright/test';

// The Go server will serve 200.html for any unmatched path below the base. These
// tests prove the build works that way: a deep client route entered directly in the
// address bar must be answered by the fallback document and routed on the client.

test('a client route reached by direct navigation is served through the fallback', async ({
	page
}) => {
	const response = await page.goto('./about');

	expect(response?.ok()).toBe(true);
	await expect(page.getByRole('heading', { level: 1, name: 'About Hoard' })).toBeVisible();
	await expect(page.getByRole('link', { name: 'The Stash project' })).toHaveAttribute(
		'href',
		'https://github.com/stashapp/stash'
	);
});

test('the same route is reachable by client-side navigation', async ({ page }) => {
	await page.goto('./');

	await page
		.getByRole('navigation', { name: 'Primary' })
		.getByRole('link', { name: 'About' })
		.click();

	await expect(page.getByRole('heading', { level: 1, name: 'About Hoard' })).toBeVisible();
	await expect(page).toHaveURL(/\/hoard\/about\/?$/);
});
