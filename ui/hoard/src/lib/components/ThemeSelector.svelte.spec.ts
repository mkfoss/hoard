import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import ThemeSelector from './ThemeSelector.svelte';
import { THEMES } from '$lib/theme/themes';
import { THEME_STORAGE_KEY } from '$lib/theme/theme';

afterEach(() => {
	localStorage.removeItem(THEME_STORAGE_KEY);
	delete document.documentElement.dataset.theme;
});

describe('ThemeSelector', () => {
	it('is labelled so it can be found by its accessible name', async () => {
		render(ThemeSelector);

		await expect.element(page.getByLabelText('Theme')).toBeInTheDocument();
	});

	it('renders one option per canonical theme and nothing else', async () => {
		const { container } = render(ThemeSelector);

		const values = [...container.querySelectorAll('option')].map((option) => option.value);

		expect(values).toEqual([...THEMES]);
	});

	it('reflects the restored selection in the control', async () => {
		localStorage.setItem(THEME_STORAGE_KEY, 'valentine');

		render(ThemeSelector);

		await expect.element(page.getByLabelText('Theme')).toHaveValue('valentine');
	});

	it('applies the chosen theme to the root element', async () => {
		render(ThemeSelector);

		await page.getByLabelText('Theme').selectOptions('retro');

		await expect.poll(() => document.documentElement.dataset.theme).toBe('retro');
	});

	it('persists the chosen theme', async () => {
		render(ThemeSelector);

		await page.getByLabelText('Theme').selectOptions('coffee');

		await expect.poll(() => localStorage.getItem(THEME_STORAGE_KEY)).toBe('coffee');
	});

	it('keeps the control value in step with the chosen theme', async () => {
		render(ThemeSelector);

		await page.getByLabelText('Theme').selectOptions('nord');

		await expect.element(page.getByLabelText('Theme')).toHaveValue('nord');
	});
});
