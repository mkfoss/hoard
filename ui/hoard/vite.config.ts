import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { resolveBasePath } from './src/lib/base-path';

// Vitest's browser harness is served from `/__vitest__/`, which SvelteKit's `base`
// would rewrite out from under it. Component tests mount components directly and
// never exercise routing, so the base path is only applied outside Vitest; the
// Playwright suite covers the real `/hoard` mount against a real build.
const base = process.env.VITEST ? '' : resolveBasePath(process.env.HOARD_BASE_PATH);

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			// Static SPA: every unknown request is served the fallback document and
			// routed on the client, so no Node.js runtime is needed in production.
			adapter: adapter({ fallback: '200.html' }),
			paths: { base }
		})
	],
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'client',
					browser: {
						enabled: true,
						provider: playwright(),
						instances: [{ browser: 'chromium', headless: true }]
					},
					// `*.svelte.*` covers components and runes; `*.browser.*` covers plain
					// modules that need real DOM and Web Storage APIs.
					include: ['src/**/*.svelte.{test,spec}.{js,ts}', 'src/**/*.browser.{test,spec}.{js,ts}']
				}
			},

			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}', 'src/**/*.browser.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
