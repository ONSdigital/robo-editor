<script>
	import Section from "./Section.svelte";

	let { output, plaintext = false } = $props();
</script>

{#if output}
	{#each output.sections as section, i}
		{#if !(section.type === "Chart" && plaintext)}
			<Section {section} {plaintext} single={i === 0} />
		{/if}
	{/each}
{/if}
