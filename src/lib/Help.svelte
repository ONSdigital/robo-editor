<script module>
	// The last selected tab, remembered while the editor is open
	let lastTab = 0;
</script>

<script>
	import { onMount } from "svelte";
	import { asset } from "$app/paths";
	import { MagicArray, csvParse, renderJSON } from "@onsvisual/robo-utils";
	import pug from "$lib/pug/index.js";
	import CodeBlock from "./ui/CodeBlock.svelte";
	import { sections, docs, examplePlace } from "./help.js";

	let active = $state(lastTab);
	let tabs = $state([]);

	function selectTab(i) {
		active = lastTab = i;
	}

	// Arrow keys, Home and End move between tabs (the ARIA tabs pattern)
	function onTabKey(event, i) {
		const last = sections.length - 1;
		const next = {
			ArrowRight: i === last ? 0 : i + 1,
			ArrowLeft: i === 0 ? last : i - 1,
			Home: 0,
			End: last
		}[event.key];
		if (next === undefined) return;
		event.preventDefault();
		selectTab(next);
		tabs[next]?.focus();
	}

	// Rendered output for each example, by section and example index
	let outputs = $state.raw(null);
	let loadError = $state(null);

	function renderExample(example, place, places, lookup) {
		const out = renderJSON(example.code, place, places, lookup, pug);
		if (out.error) return { error: out.error };
		if (example.json) {
			const json = { sections: out.sections, ...(out.notes ? { notes: out.notes } : {}) };
			return { json: JSON.stringify(json, null, 2) };
		}
		return { html: out.sections.map((section) => section.content ?? "").join("") };
	}

	// Render the examples with the demo data, so their output always matches robo-utils and Pug
	onMount(async () => {
		try {
			const csv = await (await fetch(asset("/data/data_v2.csv"))).text();
			const data = MagicArray.from(csvParse(csv));
			const lookup = {};
			for (const row of data) {
				lookup[row.areacd] = row;
				lookup[row.areanm] = row;
			}
			const prefixes = ["E06", "E07", "E08", "E09", "W06", "S12", "N09"];
			const places = MagicArray.from(
				data.filter((row) => prefixes.includes(row.areacd.slice(0, 3)))
			).sortBy("areanm");
			const place = places.get(examplePlace);
			outputs = sections.map((section) =>
				section.examples.map((example) => renderExample(example, place, places, lookup))
			);
		} catch (err) {
			loadError = err.message;
		}
	});
</script>

<div class="help">
	<p class="intro">
		Templates are written in <a href={docs.pug} target="_blank" rel="noopener">Pug</a>, with
		<a href={docs.robo} target="_blank" rel="noopener">robo-utils</a> functions for working with
		the CSV data and writing text. Each example shows its output for
		<strong>{examplePlace}</strong> from the demo data, and links to the full documentation.
	</p>

	<div class="tabs" role="tablist" aria-label="Cheat sheet sections">
		{#each sections as section, i}
			<button
				role="tab"
				id="help-tab-{section.id}"
				aria-selected={active === i}
				aria-controls="help-panel-{section.id}"
				tabindex={active === i ? 0 : -1}
				bind:this={tabs[i]}
				onclick={() => selectTab(i)}
				onkeydown={(event) => onTabKey(event, i)}>{section.title}</button
			>
		{/each}
	</div>

	{#if loadError}
		<p class="error">Couldn't load the demo data for the examples: {loadError}</p>
	{/if}

	{#each sections as section, i}
		<div
			class="help-section"
			role="tabpanel"
			id="help-panel-{section.id}"
			aria-labelledby="help-tab-{section.id}"
			hidden={active !== i}
		>
			{#if section.intro}<p>{section.intro}</p>{/if}
			<div class="examples">
				{#each section.examples as example, j}
					{@const output = outputs?.[i]?.[j]}
					<div class="example">
						<div class="example-header">
							<h4>{example.title}</h4>
							{#if example.link}
								<a href={example.link} target="_blank" rel="noopener">Docs ↗</a>
							{/if}
						</div>
						{#if example.note}<p class="note">{example.note}</p>{/if}
						<CodeBlock code={example.code} />
						<div class="output" aria-label="Output">
							{#if !output}
								<span class="muted">Loading…</span>
							{:else if output.error}
								<span class="error">{output.error}</span>
							{:else if output.json}
								<pre>{output.json}</pre>
							{:else}
								{@html output.html}
							{/if}
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/each}
</div>

<style>
	.help {
		padding-bottom: 20px;
	}
	.intro {
		margin-top: 6px;
	}
	.tabs {
		display: flex;
		flex-wrap: wrap;
		gap: 2px 4px;
		margin: 12px 0 0;
		border-bottom: 1px solid #ddd;
	}
	.tabs button {
		margin: 0 0 -1px;
		padding: 8px 10px;
		font-size: 0.95em;
		color: #444;
		background: none;
		border: none;
		border-bottom: 3px solid transparent;
		cursor: pointer;
	}
	.tabs button:hover {
		color: #000;
		background-color: #f4f4f4;
	}
	.tabs button[aria-selected="true"] {
		color: #000;
		font-weight: bold;
		border-bottom-color: #206095;
	}
	.tabs button:focus-visible {
		outline: 2px solid #206095;
		outline-offset: -2px;
	}
	.help-section {
		margin-top: 12px;
	}
	.examples {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
		gap: 12px;
		margin-top: 10px;
	}
	.example {
		display: flex;
		flex-direction: column;
		gap: 6px;
		padding: 10px;
		border: 1px solid #ddd;
		border-radius: 4px;
		min-width: 0;
	}
	.example-header {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 8px;
	}
	h4 {
		margin: 0;
		font-size: 1em;
	}
	.example-header a {
		font-size: 0.85em;
		white-space: nowrap;
	}
	.note {
		margin: 0;
		font-size: 0.9em;
		color: #555;
	}
	.output {
		padding: 8px 10px;
		font-size: 0.95em;
		background-color: #f5f5f5;
		border-left: 3px solid #ccc;
		overflow-x: auto;
	}
	.output :global(h2) {
		margin: 0 0 4px;
		font-size: 1.2em;
	}
	.output :global(p),
	.output :global(ul) {
		margin: 0 0 4px;
	}
	.output pre {
		margin: 0;
		font-size: 12px;
		white-space: pre;
	}
	.muted {
		color: #777;
	}
	.error {
		color: #d0021b;
	}
</style>
