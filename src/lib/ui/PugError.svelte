<script>
	// Shows an error returned by renderJSON (summarised by parsePugError() in utils.js)
	import { parsePugError } from "../utils.js";

	let { error } = $props();

	let { message, location } = $derived(parsePugError(error));
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
