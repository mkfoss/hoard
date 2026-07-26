import { expect, test } from '@playwright/test';

// Choosing a theme, persisting it, and applying it across navigation are covered by
// settings.e2e.ts, where the control now lives. What remains here is the one thing
// only a real browser can confirm: that every theme in the canonical list is
// actually offered, in order.

test('the theme selector offers every enabled DaisyUI theme', async ({ page }) => {
	await page.goto('./settings');
	await expect(page.getByRole('heading', { level: 1, name: 'Settings' })).toBeVisible();

	const { THEMES } = await import('../src/lib/theme/themes');
	const options = await page.getByLabel('Theme').locator('option').allTextContents();

	expect(options.map((option) => option.trim())).toEqual([...THEMES]);
});
