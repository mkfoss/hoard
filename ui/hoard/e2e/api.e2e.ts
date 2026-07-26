import { expect, test } from '@playwright/test';

// The preview server has no Go server behind it, so the success path is exercised
// by fulfilling /graphql from the browser. This covers the whole chain in the real
// built app — generated document, request(), rendered result — which the component
// tests cannot, since they mount the component outside the built bundle.

test('renders data returned by the GraphQL endpoint', async ({ page }) => {
	await page.route('**/graphql', async (route) => {
		await route.fulfill({
			contentType: 'application/json',
			body: JSON.stringify({
				data: { version: { version: 'v9.9.9', hash: 'deadbeef', build_time: 'now' } }
			})
		});
	});

	await page.goto('./');

	await expect(page.getByText('Server v9.9.9')).toBeVisible();
});

test('posts the operation to the server root, outside the app base path', async ({ page }) => {
	const posted: { url: string; body: unknown }[] = [];

	await page.route('**/graphql', async (route) => {
		const request = route.request();
		posted.push({ url: new URL(request.url()).pathname, body: request.postDataJSON() });
		await route.fulfill({
			contentType: 'application/json',
			body: JSON.stringify({
				data: { version: { version: 'v1', hash: 'h', build_time: 't' } }
			})
		});
	});

	await page.goto('./');
	await expect(page.getByText('Server v1')).toBeVisible();

	expect(posted).toHaveLength(1);
	expect(posted[0].url).toBe('/graphql');
	expect(posted[0].body).toMatchObject({ query: expect.stringContaining('query Version') });
});

test('invites the visitor to sign in when the server reports no session', async ({ page }) => {
	await page.route('**/graphql', (route) => route.fulfill({ status: 401, body: '' }));

	await page.goto('./');

	const signIn = page.getByRole('link', { name: 'Sign in' });
	await expect(signIn).toBeVisible();
	await expect(signIn).toHaveAttribute('href', '/login');
});
