<script>
	// Shows an error returned by renderJSON. Pug's errors come in two forms:
	// - compile errors: "Error: Pug:2:7\n<code frame>\n\nSyntax Error: Unexpected token"
	// - runtime errors: "TypeError: Cannot read properties of undefined (reading 'x') on line 3"
	let { error } = $props();

	function parseError(error) {
		const compile = error.match(/^\w*Error: Pug:(\d+):(\d+)\n[\s\S]*?\n\n([\s\S]+)$/);
		if (compile) return { message: compile[3], line: compile[1], column: compile[2] };
		const runtime = error.match(/^\w*Error: ([\s\S]+?)(?: on line (\d+))?$/);
		return { message: runtime?.[1] ?? error, line: runtime?.[2] };
	}

	let { message, line, column } = $derived(parseError(error));
	let location = $derived(line ? ` (line ${line}${column ? `, column ${column}` : ""})` : "");
</script>

<div class="pug-error" role="alert">
	<h2>PUG error</h2>
	<p>{message}{location}</p>
	<details>
		<summary>Show details</summary>
		<pre>{error}</pre>
	</details>
</div>

<style>
	.pug-error {
		margin: 10px 0;
		padding: 12px 16px;
		border-left: 4px solid #d0021b;
		background-color: #fdf2f3;
		color: #222;
	}
	h2 {
		margin: 0 0 4px;
		font-size: 1.1em;
		color: #d0021b;
	}
	p {
		margin: 0 0 8px;
	}
	summary {
		cursor: pointer;
		font-size: 0.9em;
	}
	pre {
		margin: 8px 0 0;
		padding: 10px;
		overflow-x: auto;
		/* Keep Pug's code frame (line numbers and ^ pointer) aligned */
		white-space: pre;
		font-family: Monaco, Menlo, "Ubuntu Mono", Consolas, monospace;
		font-size: 12px;
		line-height: 1.4;
		background-color: #fff;
		border: 1px solid #e5c5c9;
	}
</style>
