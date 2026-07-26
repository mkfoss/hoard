<script lang="ts">
	import { applyTheme, resolveInitialTheme, setDocumentTheme } from '$lib/theme/theme';
	import { THEMES, isTheme, type Theme } from '$lib/theme/themes';

	let { id = 'theme-selector' }: { id?: string } = $props();

	// Resolved in an initialiser rather than at module scope, so importing this
	// component never touches browser globals.
	let theme = $state<Theme>(resolveInitialTheme());

	// Keeps the document in step with the rendered value without persisting it;
	// only an explicit selection is remembered.
	$effect(() => setDocumentTheme(theme));

	function selectTheme(value: string) {
		if (!isTheme(value)) return;

		theme = value;
		applyTheme(value);
	}
</script>

<div class="flex items-center gap-2">
	<label class="label" for={id}>Theme</label>
	<select
		{id}
		class="select select-sm"
		value={theme}
		onchange={(event) => selectTheme(event.currentTarget.value)}
	>
		{#each THEMES as name (name)}
			<option value={name}>{name}</option>
		{/each}
	</select>
</div>
