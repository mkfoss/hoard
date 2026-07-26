import { expect, test } from '@playwright/test';

test('a theme can be selected and reaches the root document', async ({ page }) => {
	await page.goto('./');

	await page.getByLabel('Theme').selectOption('synthwave');

	await expect(page.locator('html')).toHaveAttribute('data-theme', 'synthwave');
});

test('the selected theme survives a reload', async ({ page }) => {
	await page.goto('./');
	await page.getByLabel('Theme').selectOption('dracula');
	await expect(page.locator('html')).toHaveAttribute('data-theme', 'dracula');

	await page.reload();

	await expect(page.locator('html')).toHaveAttribute('data-theme', 'dracula');
	await expect(page.getByLabel('Theme')).toHaveValue('dracula');
});

test('the theme selector offers every enabled DaisyUI theme', async ({ page }) => {
	await page.goto('./');

	const { THEMES } = await import('../src/lib/theme/themes');
	const options = await page.getByLabel('Theme').locator('option').allTextContents();

	expect(options.map((option) => option.trim())).toEqual([...THEMES]);
});
