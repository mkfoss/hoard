import { isTheme, type Theme } from './themes';

/**
 * Local-storage key holding the visitor's theme selection.
 *
 * Also read by the inline bootstrap script in `src/app.html`; change both together.
 */
export const THEME_STORAGE_KEY = 'hoard.theme';

/** Used when the system prefers a dark colour scheme. */
export const DARK_FALLBACK_THEME: Theme = 'dark';

/** Used otherwise. */
export const LIGHT_FALLBACK_THEME: Theme = 'light';

/**
 * Pure selection rule: a valid saved theme wins, otherwise the system preference
 * decides. Kept separate from the browser APIs so it is directly testable.
 */
export function chooseTheme(stored: string | null, prefersDark: boolean): Theme {
	if (isTheme(stored)) {
		return stored;
	}

	return prefersDark ? DARK_FALLBACK_THEME : LIGHT_FALLBACK_THEME;
}

/**
 * Reads the saved theme, or `null` when nothing valid is saved.
 *
 * Local storage throws in private/partitioned browsing contexts and when a user
 * blocks site data, so failures degrade to "nothing saved" rather than propagating.
 */
export function readStoredTheme(): Theme | null {
	let stored: string | null;

	try {
		stored = localStorage.getItem(THEME_STORAGE_KEY);
	} catch {
		return null;
	}

	return isTheme(stored) ? stored : null;
}

/** Persists the selection, ignoring a blocked or full store. */
export function storeTheme(theme: Theme): void {
	try {
		localStorage.setItem(THEME_STORAGE_KEY, theme);
	} catch {
		// A visitor who blocks site data simply does not get a persisted theme.
	}
}

/** Whether the browser reports a dark colour-scheme preference. */
export function prefersDarkColorScheme(): boolean {
	return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/** The theme to show on startup. Must only be called in the browser. */
export function resolveInitialTheme(): Theme {
	return chooseTheme(readStoredTheme(), prefersDarkColorScheme());
}

/**
 * Points the document at a theme. Idempotent and non-persisting, so it is safe to
 * call whenever the rendered theme changes for any reason.
 */
export function setDocumentTheme(theme: Theme): void {
	document.documentElement.dataset.theme = theme;
}

/**
 * Records a deliberate choice: shows it and remembers it.
 *
 * Only call this for an actual user selection. Persisting a theme that was merely
 * derived from `prefers-color-scheme` would freeze it, so later changes to the
 * system preference would stop being followed.
 */
export function applyTheme(theme: Theme): void {
	setDocumentTheme(theme);
	storeTheme(theme);
}
