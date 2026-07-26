/**
 * Vite dev-server proxy for the Go server's API and media routes.
 *
 * In development the app is served by Vite while the API lives on the Go server,
 * which would otherwise be a second origin. Stash authenticates with a session
 * cookie, and browsers will not send that cookie cross-origin — the constraint
 * `ui/v2.5` lives with, where logged-in development does not work at all.
 *
 * Proxying keeps the browser talking to exactly one origin, so the cookie is
 * same-origin and needs no CORS or SameSite workaround. It also makes development
 * match production, where the Go binary serves both the app and the API.
 *
 * This is dev-only. `server.proxy` does not exist in the production build, and
 * nothing here ships to the browser.
 */

/** Where the Go server listens by default (`portDefault` in the manager config). */
export const DEFAULT_API_URL = 'http://localhost:9999';

/**
 * Route prefixes owned by the Go server, taken from the route registrations in
 * `internal/api/server.go`. `dev-proxy.spec.ts` fails if the two drift apart.
 */
export const API_PREFIXES = [
	'/graphql',
	'/login',
	'/logout',
	'/performer',
	'/scene',
	'/gallery',
	'/image',
	'/studio',
	'/group',
	'/tag',
	'/downloads',
	'/plugin',
	'/css',
	'/javascript',
	'/customlocales',
	'/custom'
] as const;

/** A single Vite proxy entry. Mirrors the subset of Vite's options we set. */
export interface DevProxyEntry {
	target: string;
	changeOrigin: boolean;
	ws?: boolean;
}

/**
 * Resolves the Go server's URL from the `HOARD_API_URL` environment variable.
 *
 * @throws if the override is not an absolute http(s) URL — a relative value would
 * silently produce a proxy that forwards to nowhere.
 */
export function resolveApiUrl(override: string | undefined): string {
	if (override === undefined) {
		return DEFAULT_API_URL;
	}

	let url: URL;
	try {
		url = new URL(override);
	} catch {
		throw new Error(
			`HOARD_API_URL must be an absolute http(s) URL, received ${JSON.stringify(override)}`
		);
	}

	if (url.protocol !== 'http:' && url.protocol !== 'https:') {
		throw new Error(`HOARD_API_URL must use http or https, received ${JSON.stringify(override)}`);
	}

	return override.replace(/\/+$/, '');
}

/** Builds the `server.proxy` map forwarding every API prefix to the Go server. */
export function createDevProxy(target: string): Record<string, DevProxyEntry> {
	return Object.fromEntries(
		API_PREFIXES.map((prefix) => [
			prefix,
			{
				target,
				changeOrigin: true,
				// GraphQL subscriptions upgrade to a WebSocket on the same endpoint.
				...(prefix === '/graphql' ? { ws: true } : {})
			}
		])
	);
}
