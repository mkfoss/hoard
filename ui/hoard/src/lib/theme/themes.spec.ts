import { describe, expect, it } from 'vitest';
import { THEMES, isTheme } from './themes';

describe('THEMES', () => {
	it('contains no duplicate values', () => {
		expect(new Set(THEMES).size).toBe(THEMES.length);
	});

	it('offers both light and dark', () => {
		expect(THEMES).toContain('light');
		expect(THEMES).toContain('dark');
	});

	it('matches the built-in themes shipped by the installed DaisyUI version', async () => {
		const { readdir } = await import('node:fs/promises');
		const entries = await readdir('node_modules/daisyui/theme');
		const shipped = entries
			.filter((entry) => entry.endsWith('.css'))
			.map((entry) => entry.replace(/\.css$/, ''));

		expect([...THEMES].sort()).toEqual(shipped.sort());
	});
});

describe('isTheme', () => {
	it('accepts every canonical theme', () => {
		for (const theme of THEMES) {
			expect(isTheme(theme)).toBe(true);
		}
	});

	it('rejects unknown and non-string values', () => {
		expect(isTheme('not-a-theme')).toBe(false);
		expect(isTheme('')).toBe(false);
		expect(isTheme('DARK')).toBe(false);
		expect(isTheme(null)).toBe(false);
		expect(isTheme(undefined)).toBe(false);
		expect(isTheme(42)).toBe(false);
	});
});
