<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import ServerVersion from '$lib/components/ServerVersion.svelte';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';

	let { children } = $props();

	const links = [
		{ href: resolve('/'), label: 'Home' },
		{ href: resolve('/scenes'), label: 'Scenes' },
		{ href: resolve('/settings'), label: 'Settings' },
		{ href: resolve('/about'), label: 'About' }
	];
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="flex min-h-screen flex-col bg-base-200">
	<header class="navbar gap-2 bg-base-100 shadow-sm">
		<div class="flex-1">
			<a class="btn btn-ghost text-xl" href={resolve('/')}>Hoard</a>
		</div>
		<nav aria-label="Primary">
			<ul class="menu menu-horizontal px-1">
				{#each links as link (link.href)}
					<li>
						<a href={link.href} aria-current={page.url.pathname === link.href ? 'page' : undefined}>
							{link.label}
						</a>
					</li>
				{/each}
			</ul>
		</nav>
	</header>

	<main class="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
		{@render children()}
	</main>

	<footer class="footer items-center gap-4 bg-base-100 p-4 text-base-content sm:footer-horizontal">
		<p class="text-sm">Hoard — an independent, AGPL-3.0 fork of Stash.</p>
		<div class="sm:ms-auto">
			<ServerVersion />
		</div>
	</footer>
</div>
