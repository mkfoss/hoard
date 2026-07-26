import { afterEach, describe, expect, it, vi } from 'vitest';
import { GRAPHQL_ENDPOINT, GraphQLRequestError, UnauthorizedError, request } from './client';
import { VersionDocument } from './generated/graphql';

afterEach(() => {
	vi.unstubAllGlobals();
});

/** Stubs global fetch with a single canned response and returns the spy. */
function stubFetch(body: unknown, init: ResponseInit = {}) {
	// Typed as fetch so recorded calls keep their argument types.
	const fetchMock = vi.fn<typeof fetch>(
		async () =>
			new Response(typeof body === 'string' ? body : JSON.stringify(body), {
				status: 200,
				headers: { 'Content-Type': 'application/json' },
				...init
			})
	);
	vi.stubGlobal('fetch', fetchMock);

	return fetchMock;
}

describe('request', () => {
	it('posts the operation to the server root, not below the app base path', async () => {
		const fetchMock = stubFetch({
			data: { version: { version: 'v0.1', hash: 'a', build_time: 'b' } }
		});

		await request(VersionDocument);

		expect(GRAPHQL_ENDPOINT).toBe('/graphql');
		const [url, init] = fetchMock.mock.calls[0];
		expect(url).toBe('/graphql');
		expect(init?.method).toBe('POST');
	});

	it('sends the query and variables as JSON', async () => {
		const fetchMock = stubFetch({
			data: { version: { version: null, hash: 'a', build_time: 'b' } }
		});

		await request(VersionDocument);

		const [, init] = fetchMock.mock.calls[0];
		expect(new Headers(init?.headers).get('Content-Type')).toBe('application/json');
		expect(JSON.parse(init?.body as string)).toEqual({
			query: VersionDocument.toString(),
			variables: {}
		});
	});

	// The session cookie is what authenticates every call. Same-origin in dev is
	// what the Vite proxy exists to guarantee; in production it is inherent.
	it('sends credentials so the session cookie is included', async () => {
		const fetchMock = stubFetch({
			data: { version: { version: null, hash: 'a', build_time: 'b' } }
		});

		await request(VersionDocument);

		expect(fetchMock.mock.calls[0][1]?.credentials).toBe('same-origin');
	});

	it('returns the data payload on success', async () => {
		stubFetch({ data: { version: { version: 'v0.31.1', hash: 'abc', build_time: 'now' } } });

		const result = await request(VersionDocument);

		expect(result.version.version).toBe('v0.31.1');
	});

	it('throws with the server message when the response carries GraphQL errors', async () => {
		stubFetch({ errors: [{ message: 'unknown field' }, { message: 'and another' }] });

		await expect(request(VersionDocument)).rejects.toThrow(GraphQLRequestError);
		await expect(request(VersionDocument)).rejects.toThrow(/unknown field/);
	});

	// A 401 is an ordinary state for a cookie-authenticated app, not a bug: the
	// caller needs to tell it apart so it can send the visitor to log in.
	it('throws a distinguishable error when unauthenticated', async () => {
		stubFetch('', { status: 401 });

		await expect(request(VersionDocument)).rejects.toBeInstanceOf(UnauthorizedError);
	});

	it('throws when the transport fails', async () => {
		stubFetch('', { status: 500, statusText: 'Internal Server Error' });

		await expect(request(VersionDocument)).rejects.toThrow(GraphQLRequestError);
	});

	it('throws rather than returning undefined when the body has neither data nor errors', async () => {
		stubFetch({});

		await expect(request(VersionDocument)).rejects.toThrow(GraphQLRequestError);
	});
});
