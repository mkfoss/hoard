/**
 * Every built-in theme shipped by DaisyUI, enabled via `themes: all` in `src/app.css`.
 *
 * This is the single canonical list — components and the theme service must import
 * it rather than restating theme names. Keep it in sync with the installed DaisyUI
 * version; `themes.spec.ts` fails if it drifts from `node_modules/daisyui/theme`.
 */
export const THEMES = [
	'light',
	'dark',
	'cupcake',
	'bumblebee',
	'emerald',
	'corporate',
	'synthwave',
	'retro',
	'cyberpunk',
	'valentine',
	'halloween',
	'garden',
	'forest',
	'aqua',
	'lofi',
	'pastel',
	'fantasy',
	'wireframe',
	'black',
	'luxury',
	'dracula',
	'cmyk',
	'autumn',
	'business',
	'acid',
	'lemonade',
	'night',
	'coffee',
	'winter',
	'dim',
	'nord',
	'sunset',
	'caramellatte',
	'abyss',
	'silk'
] as const;

export type Theme = (typeof THEMES)[number];

/** Narrows an untrusted value (stored string, URL parameter, …) to a canonical theme. */
export function isTheme(value: unknown): value is Theme {
	return typeof value === 'string' && (THEMES as readonly string[]).includes(value);
}
