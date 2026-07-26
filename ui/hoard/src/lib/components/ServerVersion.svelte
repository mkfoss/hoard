<script lang="ts">
	import { GraphQLRequestError, UnauthorizedError, VersionDocument, request } from '$lib/api';

	// The first real call to the Go server. It doubles as a connectivity check:
	// if this fails, nothing else in the app will work either.
	const version = $state<{
		status: 'loading' | 'ready' | 'unauthenticated' | 'failed';
		text: string;
	}>({ status: 'loading', text: '' });

	/**
	 * A server built without release flags reports empty strings — not null — for
	 * every version field, so blank has to count as absent.
	 */
	function versionLabel(v: { version: string | null; hash: string }): string {
		return v.version?.trim() || v.hash.trim() || 'connected';
	}

	$effect(() => {
		let cancelled = false;

		request(VersionDocument)
			.then((data) => {
				if (cancelled) return;
				version.status = 'ready';
				version.text = versionLabel(data.version);
			})
			.catch((error: unknown) => {
				if (cancelled) return;
				version.status = error instanceof UnauthorizedError ? 'unauthenticated' : 'failed';
				version.text = error instanceof GraphQLRequestError ? error.message : 'Unexpected error';
			});

		return () => {
			cancelled = true;
		};
	});
</script>

{#if version.status === 'loading'}
	<span class="text-sm opacity-60">Connecting to server…</span>
{:else if version.status === 'ready'}
	<span class="text-sm opacity-60">Server {version.text}</span>
{:else if version.status === 'unauthenticated'}
	<!--
		Deliberately not resolve()d: /login is served by the Go server at the site
		root, outside this SPA's base path. resolve('/login') would produce
		/hoard/login, which does not exist.
	-->
	<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
	<a class="link text-sm" href="/login">Sign in</a>
{:else}
	<span class="badge badge-sm badge-error" title={version.text}>Server unreachable</span>
{/if}
