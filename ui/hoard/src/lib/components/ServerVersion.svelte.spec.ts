import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import ServerVersion from './ServerVersion.svelte';

afterEach(() => {
	vi.unstubAllGlobals();
});

function stubFetch(body: unknown, init: ResponseInit = {}) {
	vi.stubGlobal(
		'fetch',
		vi.fn(
			async () =>
				new Response(typeof body === 'string' ? body : JSON.stringify(body), {
					status: 200,
					headers: { 'Content-Type': 'application/json' },
					...init
				})
		)
	);
}

describe('ServerVersion', () => {
	it('shows the version reported by the server', async () => {
		stubFetch({ data: { version: { version: 'v0.31.1', hash: 'abc123', build_time: 'now' } } });

		render(ServerVersion);

		await expect.element(page.getByText('Server v0.31.1')).toBeInTheDocument();
	});

	it('falls back to the build hash when no version is tagged', async () => {
		stubFetch({ data: { version: { version: null, hash: 'abc123', build_time: 'now' } } });

		render(ServerVersion);

		await expect.element(page.getByText('Server abc123')).toBeInTheDocument();
	});

	// A locally built server reports empty strings rather than null for every
	// version field, so an unstamped build must not render "Server " with nothing
	// after it.
	it('treats a blank version as absent and falls back to the hash', async () => {
		stubFetch({ data: { version: { version: '', hash: 'abc123', build_time: '' } } });

		render(ServerVersion);

		await expect.element(page.getByText('Server abc123')).toBeInTheDocument();
	});

	it('still confirms connectivity when the build carries no version at all', async () => {
		stubFetch({ data: { version: { version: '', hash: '', build_time: '' } } });

		render(ServerVersion);

		await expect.element(page.getByText('Server connected')).toBeInTheDocument();
	});

	it('offers a way to sign in when the session is missing', async () => {
		stubFetch('', { status: 401 });

		render(ServerVersion);

		await expect
			.element(page.getByRole('link', { name: 'Sign in' }))
			.toHaveAttribute('href', '/login');
	});

	it('reports a failure rather than silently showing nothing', async () => {
		stubFetch({ errors: [{ message: 'boom' }] });

		render(ServerVersion);

		await expect.element(page.getByText('Server unreachable')).toBeInTheDocument();
	});
});
