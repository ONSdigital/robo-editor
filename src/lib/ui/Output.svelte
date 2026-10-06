<script>
	import Section from "./Section.svelte";
	import PugError from "./PugError.svelte";

	let { output, plaintext = false } = $props();
</script>

{#if output?.error && !plaintext}
	<PugError error={output.error} />
{/if}
{#if output}
	{#each output.sections as section, i}
		{#if !(section.type === "Chart" && plaintext)}
			<Section {section} {plaintext} single={i === 0} />
		{/if}
	{/each}
{/if}
