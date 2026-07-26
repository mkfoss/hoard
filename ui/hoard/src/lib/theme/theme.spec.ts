import { describe, expect, it } from 'vitest';
import { THEME_STORAGE_KEY, chooseTheme } from './theme';

describe('THEME_STORAGE_KEY', () => {
	it('is the documented local-storage key', () => {
		expect(THEME_STORAGE_KEY).toBe('hoard.theme');
	});
});

describe('chooseTheme', () => {
	it('honours a valid stored theme over the system preference', () => {
		expect(chooseTheme('synthwave', true)).toBe('synthwave');
		expect(chooseTheme('synthwave', false)).toBe('synthwave');
		expect(chooseTheme('light', true)).toBe('light');
	});

	it('rejects an invalid stored theme and falls back to the system preference', () => {
		expect(chooseTheme('not-a-theme', true)).toBe('dark');
		expect(chooseTheme('not-a-theme', false)).toBe('light');
		expect(chooseTheme('', true)).toBe('dark');
	});

	it('falls back to dark when the system prefers dark and nothing is stored', () => {
		expect(chooseTheme(null, true)).toBe('dark');
	});

	it('falls back to light when the system does not prefer dark and nothing is stored', () => {
		expect(chooseTheme(null, false)).toBe('light');
	});
});
