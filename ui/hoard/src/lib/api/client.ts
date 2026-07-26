import type { TypedDocumentString } from './generated/graphql';

/**
 * The Go server's GraphQL endpoint.
 *
 * Deliberately absolute and *not* prefixed with the app's base path: Hoard is
 * mounted at /hoard, but the API belongs to the server root. In development the
 * Vite proxy forwards this to the Go server so it stays same-origin — see
 * `src/lib/dev-proxy.ts`.
 */
export const GRAPHQL_ENDPOINT = '/graphql';

/** A GraphQL call that did not produce data. */
export class GraphQLRequestError extends Error {
	readonly status: number | undefined;

	constructor(message: string, options?: { status?: number; cause?: unknown }) {
		super(message, { cause: options?.cause });
		this.name = 'GraphQLRequestError';
		this.status = options?.status;
	}
}

/**
 * The server rejected the call because there is no valid session.
 *
 * Separate from the general error so callers can send the visitor to log in
 * instead of showing a failure — an ordinary state for a cookie-authenticated
 * app, not a malfunction.
 */
export class UnauthorizedError extends GraphQLRequestError {
	constructor() {
		super('Not authenticated', { status: 401 });
		this.name = 'UnauthorizedError';
	}
}

/** The shape the GraphQL spec requires of a response body. */
interface GraphQLResponse<TResult> {
	data?: TResult;
	errors?: { message: string }[];
}

/**
 * Executes a generated GraphQL operation against the Go server.
 *
 * Documents come from `./generated`, which is produced from the authoritative
 * schema, so the result type follows from the document and is never hand-written.
 *
 * @throws {UnauthorizedError} when the session is missing or expired.
 * @throws {GraphQLRequestError} on transport failure, a GraphQL `errors` payload,
 * or a response carrying no data.
 */
export async function request<TResult, TVariables>(
	document: TypedDocumentString<TResult, TVariables>,
	...[variables]: TVariables extends Record<string, never> ? [] : [TVariables]
): Promise<TResult> {
	// Serialised outside the try below so a programming error here surfaces as
	// itself rather than being reported as an unreachable server.
	const body = JSON.stringify({ query: document.toString(), variables: variables ?? {} });

	let response: Response;

	try {
		response = await fetch(GRAPHQL_ENDPOINT, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			// Carries the session cookie. Same-origin by construction: the Go server
			// serves the app in production, and the Vite proxy does in development.
			credentials: 'same-origin',
			body
		});
	} catch (cause) {
		throw new GraphQLRequestError('Could not reach the server', { cause });
	}

	if (response.status === 401) {
		throw new UnauthorizedError();
	}

	if (!response.ok) {
		throw new GraphQLRequestError(`Server returned ${response.status}`, {
			status: response.status
		});
	}

	let payload: GraphQLResponse<TResult>;
	try {
		payload = (await response.json()) as GraphQLResponse<TResult>;
	} catch (cause) {
		throw new GraphQLRequestError('Server returned a malformed response', {
			status: response.status,
			cause
		});
	}

	if (payload.errors?.length) {
		throw new GraphQLRequestError(payload.errors.map((error) => error.message).join('; '), {
			status: response.status
		});
	}

	if (payload.data === undefined || payload.data === null) {
		throw new GraphQLRequestError('Server returned no data', { status: response.status });
	}

	return payload.data;
}
