/**
 * The frontend's boundary to the Go server.
 *
 * Components import from `$lib/api` and nothing else — not `./generated`, and not
 * raw `fetch`. That keeps the generated code replaceable and the set of operations
 * the app performs visible in one place.
 *
 * Operations are defined in `documents/*.graphql` and their types are generated
 * from the authoritative schema by `pnpm run codegen`. Never hand-write them.
 */
export { GRAPHQL_ENDPOINT, GraphQLRequestError, UnauthorizedError, request } from './client';

export { ScenesDocument, VersionDocument } from './generated/graphql';
export type {
	ScenesQuery,
	ScenesQueryVariables,
	VersionQuery,
	VersionQueryVariables
} from './generated/graphql';
