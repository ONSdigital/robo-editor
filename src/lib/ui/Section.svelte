<script>
	import { Chart } from "@onsvisual/svelte-charts";
	import Section from "./Section.svelte";

	let { section, plaintext = false, single = false } = $props();
</script>

<section id={section?.id} style:border-top={single ? "none" : null}>
	{#if section.type && !plaintext}<span class="class-label">{section.type}</span>{/if}
	{#if section.id && !plaintext}<span class="id-label">id: {section.id}</span>{/if}
	{#if section.type === "Chart" && section.chartType && !plaintext}
		{#if Array.isArray(section.data) && section.data[0] && Object.keys(section.data[0]).length > 0}
			<Chart {section} />
		{:else}
			<p><mark class="warn">Cannot render chart. Empty/null data array.</mark></p>
		{/if}
	{:else}
		{#if !plaintext}
			{#each Object.keys(section).filter((key) => !["content", "id", "type", "sections"].includes(key)) as key}
				<prop class={key}
					>{key}: {@html key === "data"
						? JSON.stringify(section[key])
						: section[key]}</prop
				>
			{/each}
		{/if}
		{@html section.content ? section.content : ""}
		{#if section.sections}
			{#each section.sections as subsec}
				<Section section={subsec} {plaintext} />
			{/each}
		{/if}
	{/if}
</section>

<style>
	mark.warn {
		background-color: orange;
	}
</style>
