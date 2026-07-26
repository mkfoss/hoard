import { afterEach, describe, expect, it, vi } from 'vitest';
import {
	THEME_STORAGE_KEY,
	applyTheme,
	readStoredTheme,
	resolveInitialTheme,
	setDocumentTheme,
	storeTheme
} from './theme';

afterEach(() => {
	vi.restoreAllMocks();
	localStorage.removeItem(THEME_STORAGE_KEY);
	delete document.documentElement.dataset.theme;
});

/** Replaces a Storage method with one that throws, as a blocked/full store would. */
function breakStorage(method: 'getItem' | 'setItem') {
	vi.spyOn(Storage.prototype, method).mockImplementation(() => {
		throw new DOMException('blocked', 'SecurityError');
	});
}

/** Forces `prefers-color-scheme: dark` to the given value. */
function stubPrefersDark(prefersDark: boolean) {
	vi.spyOn(window, 'matchMedia').mockImplementation(
		(query: string) => ({ matches: prefersDark, media: query }) as MediaQueryList
	);
}

describe('storeTheme / readStoredTheme', () => {
	it('round-trips a valid theme through local storage', () => {
		storeTheme('dracula');

		expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dracula');
		expect(readStoredTheme()).toBe('dracula');
	});

	it('ignores a stored value that is not a canonical theme', () => {
		localStorage.setItem(THEME_STORAGE_KEY, 'not-a-theme');

		expect(readStoredTheme()).toBe(null);
	});

	it('returns null instead of throwing when reading storage is blocked', () => {
		breakStorage('getItem');

		expect(readStoredTheme()).toBe(null);
	});

	it('does not throw when writing to storage is blocked', () => {
		breakStorage('setItem');

		expect(() => storeTheme('nord')).not.toThrow();
	});
});

describe('resolveInitialTheme', () => {
	it('restores a valid saved selection', () => {
		localStorage.setItem(THEME_STORAGE_KEY, 'cupcake');
		stubPrefersDark(true);

		expect(resolveInitialTheme()).toBe('cupcake');
	});

	it('falls back to dark when the system prefers dark', () => {
		stubPrefersDark(true);

		expect(resolveInitialTheme()).toBe('dark');
	});

	it('falls back to light otherwise', () => {
		stubPrefersDark(false);

		expect(resolveInitialTheme()).toBe('light');
	});

	it('still resolves a theme when storage is unavailable', () => {
		breakStorage('getItem');
		stubPrefersDark(false);

		expect(resolveInitialTheme()).toBe('light');
	});
});

describe('setDocumentTheme', () => {
	it('points the document at the theme without persisting it', () => {
		setDocumentTheme('halloween');

		expect(document.documentElement.dataset.theme).toBe('halloween');
		expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe(null);
	});
});

describe('applyTheme', () => {
	it('applies the theme to the root element and persists it', () => {
		applyTheme('forest');

		expect(document.documentElement.dataset.theme).toBe('forest');
		expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('forest');
	});

	it('still applies the theme when persistence fails', () => {
		breakStorage('setItem');

		expect(() => applyTheme('aqua')).not.toThrow();
		expect(document.documentElement.dataset.theme).toBe('aqua');
	});
});
