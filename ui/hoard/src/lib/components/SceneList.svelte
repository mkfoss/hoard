<script lang="ts">
	import {
		GraphQLRequestError,
		ScenesDocument,
		UnauthorizedError,
		request,
		type ScenesQuery
	} from '$lib/api';
	import { SCENE_PAGE_SIZE, formatDuration, sceneTitle } from '$lib/scenes/display';

	type Scenes = ScenesQuery['findScenes'];

	let state = $state<
		| { status: 'loading' }
		| { status: 'ready'; data: Scenes }
		| { status: 'unauthenticated' }
		| { status: 'failed'; message: string }
	>({ status: 'loading' });

	$effect(() => {
		let cancelled = false;

		request(ScenesDocument, { perPage: SCENE_PAGE_SIZE })
			.then((data) => {
				if (cancelled) return;
				state = { status: 'ready', data: data.findScenes };
			})
			.catch((error: unknown) => {
				if (cancelled) return;
				if (error instanceof UnauthorizedError) {
					state = { status: 'unauthenticated' };
					return;
				}
				state = {
					status: 'failed',
					message: error instanceof GraphQLRequestError ? error.message : 'Unexpected error'
				};
			});

		return () => {
			cancelled = true;
		};
	});
</script>

{#if state.status === 'loading'}
	<p role="status" class="opacity-70">Loading scenes…</p>
{:else if state.status === 'unauthenticated'}
	<div role="status" class="alert">
		<span>Your session has expired.</span>
		<!--
			Deliberately not resolve()d: /login is served by the Go server at the site
			root, outside this SPA's base path.
		-->
		<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
		<a class="link" href="/login">Sign in</a>
	</div>
{:else if state.status === 'failed'}
	<div role="alert" class="alert alert-error">
		<span>Scenes could not be loaded. {state.message}</span>
	</div>
{:else if state.data.scenes.length === 0}
	<div role="status" class="alert">
		<span>No scenes yet. Scan a library in the classic interface to get started.</span>
	</div>
{:else}
	<p class="mb-4 text-sm opacity-70">
		{#if state.data.count > state.data.scenes.length}
			Showing {state.data.scenes.length} of {state.data.count} scenes.
		{:else}
			{state.data.count}
			{state.data.count === 1 ? 'scene' : 'scenes'}.
		{/if}
	</p>

	<ul class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
		{#each state.data.scenes as scene (scene.id)}
			{@const duration = formatDuration(scene.files[0]?.duration)}
			<li class="card bg-base-100 shadow-sm">
				{#if scene.paths.screenshot}
					<figure class="aspect-video overflow-hidden">
						<!-- Served by the Go server; same-origin, so the session cookie applies. -->
						<img
							src={scene.paths.screenshot}
							alt=""
							loading="lazy"
							class="h-full w-full object-cover"
						/>
					</figure>
				{/if}
				<div class="card-body gap-2 p-4">
					<h2 class="card-title text-base leading-snug">{sceneTitle(scene)}</h2>
					<div class="flex flex-wrap items-center gap-2 text-sm opacity-70">
						{#if scene.studio}<span>{scene.studio.name}</span>{/if}
						{#if scene.date}<span>{scene.date}</span>{/if}
						{#if duration}<span class="badge badge-ghost badge-sm">{duration}</span>{/if}
					</div>
				</div>
			</li>
		{/each}
	</ul>
{/if}
