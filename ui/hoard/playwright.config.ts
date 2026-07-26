import { defineConfig } from '@playwright/test';
import { resolveBasePath } from './src/lib/base-path';

const port = 4173;
const base = resolveBasePath(process.env.HOARD_BASE_PATH);

export default defineConfig({
	testDir: 'e2e',
	testMatch: '**/*.e2e.{ts,js}',
	// Exercise the real static build behind `vite preview`, mounted at the base path
	// the app actually ships on. Tests must not assume the app is served from `/`.
	webServer: {
		command: 'pnpm run build && pnpm run preview',
		port,
		reuseExistingServer: !process.env.CI
	},
	use: { baseURL: `http://localhost:${port}${base}/` }
});
