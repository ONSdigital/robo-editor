<script>
	// The result of loading a CSV: checkCSV() in src/lib/data.js, plus { source, loaded, error,
	// hadData, columns }. columns is true when the id or label column was changed.
	import Icon from "./Icon.svelte";

	let { report } = $props();

	const shown = 10; // Problems listed for each check

	let summary = $derived(report?.report);
	let warnings = $derived(report?.warnings ?? []);
	let checks = $derived([
		...(report?.errors ?? []).map((check) => ({ ...check, type: "error" })),
		...warnings.map((check) => ({ ...check, type: "warning" }))
	]);
	const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;
</script>

{#if report}
	{#if !report.loaded && report.columns}
		<p class="status error">
			<strong>These id and label columns can't be used.</strong> The columns haven't been changed.
		</p>
	{:else if !report.loaded}
		<p class="status error">
			<strong
				>{report.source
					? `${report.source} can't be loaded.`
					: "This CSV can't be loaded."}</strong
			>
			{report.hadData ? "The CSV you had loaded before is still loaded." : ""}
		</p>
	{:else if warnings.length}
		<p class="status warning">
			<strong
				>Loaded{report.source ? ` ${report.source}` : ""}, with {plural(
					warnings.length,
					"warning"
				)}.</strong
			>
			The editor works with this file, but check these problems before you publish.
		</p>
	{:else}
		<p class="status ok">
			<strong>Loaded{report.source ? ` ${report.source}` : ""}.</strong> No problems found.
		</p>
	{/if}

	{#if summary && !summary.error}
		<p class="summary">
			{plural(summary.rows, "row")} and {plural(summary.columns.length, "column")}. Id column:
			<code>{summary.codeKey}</code>, label column:
			{#if summary.nameKey}<code>{summary.nameKey}</code>{:else}none{/if}.
			{#if summary.removedBlankRows}
				Ignored {plural(summary.removedBlankRows, "blank row")} at the end of the file.
			{/if}
		</p>
	{/if}

	{#each checks as check}
		<section class="check {check.type}">
			<h3>
				<Icon type={check.type === "error" ? "close" : "warning"} margin />
				{check.title}{check.problems.length && check.id !== "oneColumn"
					? `: ${check.problems.length}`
					: ""}
			</h3>
			<p>{check.impact}</p>
			{#if check.problems.length}
				<ul>
					{#each check.problems.slice(0, shown) as problem}
						<li>{problem.message}</li>
					{/each}
				</ul>
				{#if check.problems.length > shown}
					<p class="more">and {check.problems.length - shown} more</p>
				{/if}
			{/if}
		</section>
	{/each}

	{#if report.error}
		<section class="check error">
			<h3><Icon type="close" margin /> Unexpected error</h3>
			<p>The file passed these checks, but the editor couldn't load it:</p>
			<p class="detail">{report.error}</p>
		</section>
	{/if}

	{#if !report.loaded}
		<p>
			<strong
				>{report.columns
					? "Choose other columns, or fix the file and load it again."
					: "Fix the file and load it again."}</strong
			>
		</p>
	{/if}
{/if}

<style>
	.check {
		border-top: 1px solid lightgrey;
		padding-top: 10px;
	}
	.check h3 {
		display: flex;
		align-items: center;
		margin: 0 0 10px 0;
		font-size: 1.1em;
	}
	.check.error h3 {
		color: #d0021b;
	}
	.check.error :global(svg) {
		fill: #d0021b;
	}
	.check.warning :global(svg) {
		fill: #b38100;
	}
	ul {
		margin: 0 0 10px 0;
	}
	.more {
		font-style: italic;
	}
	.detail {
		font-family: monospace;
		white-space: pre-wrap;
	}
</style>
