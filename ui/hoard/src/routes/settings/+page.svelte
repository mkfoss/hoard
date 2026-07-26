<script lang="ts">
	import ThemeSelector from '$lib/components/ThemeSelector.svelte';
</script>

<svelte:head><title>Settings — Hoard</title></svelte:head>

<section class="space-y-6">
	<div class="space-y-2">
		<h1 class="text-3xl font-bold">Settings</h1>
		<p class="opacity-70">
			Preferences for this browser. They are stored locally and do not affect the server or other
			people using it.
		</p>
	</div>

	<div class="card bg-base-100 shadow-sm">
		<div class="card-body gap-4">
			<h2 class="card-title text-xl">Appearance</h2>
			<ThemeSelector id="settings-theme" />
			<p class="text-sm opacity-70">
				Applies immediately and is remembered on this device. Without a saved choice, Hoard follows
				your system's light or dark preference.
			</p>
		</div>
	</div>

	<div role="status" class="alert">
		<span>Server settings still live in the classic interface.</span>
	</div>
</section>
