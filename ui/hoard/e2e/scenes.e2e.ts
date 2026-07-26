import { expect, test } from '@playwright/test';

const scene = (id: string, title: string | null, basename: string, duration: number) => ({
	id,
	title,
	date: '2026-01-02',
	studio: { name: `Studio ${id}` },
	files: [{ basename, duration }],
	paths: { screenshot: null }
});

/** Fulfils the Scenes query, and returns the variables it was called with. */
async function stubScenes(
	page: import('@playwright/test').Page,
	scenes: ReturnType<typeof scene>[],
	count = scenes.length
) {
	const seen: Record<string, unknown>[] = [];

	await page.route('**/graphql', async (route) => {
		const body = route.request().postDataJSON();
		if (!String(body?.query).includes('query Scenes')) {
			// Let the layout's Version query resolve without pretending to be scenes.
			return route.fulfill({
				contentType: 'application/json',
				body: JSON.stringify({
					data: { version: { version: 'test', hash: 'h', build_time: 't' } }
				})
			});
		}

		seen.push(body.variables);
		await route.fulfill({
			contentType: 'application/json',
			body: JSON.stringify({ data: { findScenes: { count, scenes } } })
		});
	});

	return seen;
}

test('scenes is reachable from the primary navigation', async ({ page }) => {
	await stubScenes(page, []);
	await page.goto('./');

	await page
		.getByRole('navigation', { name: 'Primary' })
		.getByRole('link', { name: 'Scenes' })
		.click();

	await expect(page).toHaveURL(/\/hoard\/scenes\/?$/);
	await expect(page.getByRole('heading', { level: 1, name: 'Scenes' })).toBeVisible();
});

test('lists scenes returned by the server', async ({ page }) => {
	await stubScenes(page, [
		scene('1', 'First Scene', 'first.mp4', 75),
		scene('2', null, 'second-clip.mp4', 3725)
	]);

	await page.goto('./scenes');

	await expect(page.getByRole('heading', { level: 1, name: 'Scenes' })).toBeVisible();
	await expect(page.getByText('First Scene')).toBeVisible();
	// Untitled scenes fall back to their filename.
	await expect(page.getByText('second-clip.mp4')).toBeVisible();
	await expect(page.getByText('1:15')).toBeVisible();
	await expect(page.getByText('1:02:05')).toBeVisible();
});

test('requests at most 100 scenes', async ({ page }) => {
	const seen = await stubScenes(page, [scene('1', 'Only', 'a.mp4', 10)]);

	await page.goto('./scenes');
	await expect(page.getByText('Only')).toBeVisible();

	expect(seen).toEqual([{ perPage: 100 }]);
});

test('says the list is capped when the library is larger', async ({ page }) => {
	await stubScenes(page, [scene('1', 'Only', 'a.mp4', 10)], 4000);

	await page.goto('./scenes');

	await expect(page.getByText(/Showing 1 of 4000 scenes/)).toBeVisible();
});

test('explains an empty library rather than showing a blank page', async ({ page }) => {
	await stubScenes(page, []);

	await page.goto('./scenes');

	await expect(page.getByText(/No scenes yet/)).toBeVisible();
});

test('reports a failure rather than an empty library', async ({ page }) => {
	await page.route('**/graphql', (route) =>
		route.fulfill({
			contentType: 'application/json',
			body: JSON.stringify({ errors: [{ message: 'database is locked' }] })
		})
	);

	await page.goto('./scenes');

	await expect(page.getByText(/Scenes could not be loaded/)).toBeVisible();
	await expect(page.getByText(/database is locked/)).toBeVisible();
});
