/** The shape SvelteKit accepts for `paths.base`: empty, or rooted and not trailing. */
export type BasePath = '' | `/${string}`;

/**
 * Where the Hoard SPA is mounted. The Go server serves the classic interface at
 * `/`, so Hoard lives under `/hoard` unless a build explicitly overrides it.
 */
export const DEFAULT_BASE_PATH: BasePath = '/hoard';

/**
 * Resolves the SvelteKit `paths.base` value from the `HOARD_BASE_PATH` build-time
 * environment variable.
 *
 * - unset          -> `/hoard`
 * - `""` or `"/"`  -> `""` (served from the site root)
 * - `"/foo/"`      -> `"/foo"` (SvelteKit rejects a trailing slash)
 *
 * @throws if the override is a non-empty value that is not root-relative.
 */
export function resolveBasePath(override: string | undefined): BasePath {
	if (override === undefined) {
		return DEFAULT_BASE_PATH;
	}

	if (override === '') {
		return '';
	}

	if (!override.startsWith('/')) {
		throw new Error(
			`HOARD_BASE_PATH must be empty or start with "/", received ${JSON.stringify(override)}`
		);
	}

	// Safe to assert: the guard above proved the value is rooted, and stripping
	// trailing slashes either keeps it rooted or reduces it to the empty string.
	const trimmed = override.replace(/\/+$/, '');

	return trimmed === '' ? '' : (trimmed as `/${string}`);
}
