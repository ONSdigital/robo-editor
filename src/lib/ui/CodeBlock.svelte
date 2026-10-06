<script>
	import { highlightPug } from "./highlight-pug.js";

	let { code = "" } = $props();

	let html = $derived(highlightPug(code));
</script>

<pre class="code-block">{@html html}</pre>

<style>
	.code-block {
		margin: 0;
		padding: 8px 10px;
		/* Wrap long lines, so examples can be read without scrolling */
		white-space: pre-wrap;
		overflow-wrap: anywhere;
		font-family: Monaco, Menlo, "Ubuntu Mono", Consolas, monospace;
		font-size: 12px;
		line-height: 1.5;
		color: #f8f8f2;
		background-color: #272822;
		border-radius: 4px;
	}
</style>
