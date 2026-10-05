<script>
	import hljs from "highlight.js";

	export let code = "";
</script>

<div class="code-example">
	<pre>{@html hljs.highlight(code, { language: "js" }).value}</pre>
</div>

<style>
	.code-example {
		border-left: 3px solid #ccc;
		background-color: #f9f9f9;
		padding: 10px;
		margin-bottom: 24px;
	}
	.code-example > pre {
		margin: 0;
	}
</style>
