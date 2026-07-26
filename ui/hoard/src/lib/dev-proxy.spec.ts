import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import { API_PREFIXES, DEFAULT_API_URL, createDevProxy, resolveApiUrl } from './dev-proxy';
import { DEFAULT_BASE_PATH } from './base-path';

/** Route prefixes the Go server registers but the dev proxy deliberately leaves alone. */
const NOT_PROXIED = new Set([
	'/hoard', // this app; served by Vite in dev
	'/favicon.ico', // comes from the legacy UI bundle
	'/healthz', // liveness probe, no use to the client
	'/playground' // GraphQL playground, reachable directly on the server
]);

describe('API_PREFIXES', () => {
	it('contains no duplicates', () => {
		expect(new Set(API_PREFIXES).size).toBe(API_PREFIXES.length);
	});

	it('is entirely root-relative', () => {
		for (const prefix of API_PREFIXES) {
			expect(prefix.startsWith('/')).toBe(true);
		}
	});

	it('never shadows the app itself', () => {
		// A prefix equal to or below the base path would make Vite proxy the SPA
		// away to the Go server, which serves the *built* copy, not the dev one.
		for (const prefix of API_PREFIXES) {
			expect(prefix.startsWith(DEFAULT_BASE_PATH)).toBe(false);
		}
	});

	// Drift detector: if the Go server grows a route, the dev proxy should either
	// forward it or explicitly opt out, rather than silently 404 in dev only.
	it('covers every route prefix the Go server registers', async () => {
		const source = await readFile('../../internal/api/server.go', 'utf8');
		const registered = new Set<string>();

		for (const m of source.matchAll(/r\.(?:Mount|HandleFunc|Handle|Get|Post)\("(\/[a-z.]*)/g)) {
			registered.add(m[1]);
		}
		// Endpoint constants are referenced by name rather than literal.
		for (const m of source.matchAll(/(\w+Endpoint)\s*=\s*"(\/[a-z]+)"/g)) {
			registered.add(m[2]);
		}

		registered.delete('/'); // the catch-all, not an API route
		const missing = [...registered].filter(
			(p) => !NOT_PROXIED.has(p) && !(API_PREFIXES as readonly string[]).includes(p)
		);

		expect(missing).toEqual([]);
	});

	it('proxies nothing the Go server does not serve', async () => {
		const source = await readFile('../../internal/api/server.go', 'utf8');

		for (const prefix of API_PREFIXES) {
			expect(source).toContain(`"${prefix}"`);
		}
	});
});

describe('resolveApiUrl', () => {
	it('defaults to the stash server on its default port', () => {
		expect(resolveApiUrl(undefined)).toBe(DEFAULT_API_URL);
		expect(DEFAULT_API_URL).toBe('http://localhost:9999');
	});

	it('accepts an absolute http override', () => {
		expect(resolveApiUrl('http://127.0.0.1:8080')).toBe('http://127.0.0.1:8080');
		expect(resolveApiUrl('https://stash.example.com')).toBe('https://stash.example.com');
	});

	it('strips a trailing slash so proxied paths do not double up', () => {
		expect(resolveApiUrl('http://localhost:9999/')).toBe('http://localhost:9999');
	});

	it('rejects a value that is not an absolute http(s) URL', () => {
		expect(() => resolveApiUrl('localhost:9999')).toThrow(/HOARD_API_URL/);
		expect(() => resolveApiUrl('/graphql')).toThrow(/HOARD_API_URL/);
		expect(() => resolveApiUrl('')).toThrow(/HOARD_API_URL/);
	});
});

describe('createDevProxy', () => {
	it('points every API prefix at the target', () => {
		const proxy = createDevProxy('http://localhost:9999');

		expect(Object.keys(proxy).sort()).toEqual([...API_PREFIXES].sort());
		for (const entry of Object.values(proxy)) {
			expect(entry.target).toBe('http://localhost:9999');
		}
	});

	it('enables websocket forwarding for GraphQL subscriptions', () => {
		const proxy = createDevProxy(DEFAULT_API_URL);

		expect(proxy['/graphql'].ws).toBe(true);
	});

	it('does not enable websockets on plain media routes', () => {
		const proxy = createDevProxy(DEFAULT_API_URL);

		expect(proxy['/scene'].ws).toBeFalsy();
	});
});
