<script>
	import { createEventDispatcher, onMount } from "svelte";
	// The "noconflict" build keeps Ace's module loader under window.ace (not a global require/define)
	import ace from "ace-builds/src-noconflict/ace";
	import "ace-builds/src-noconflict/mode-jade";
	import "ace-builds/src-noconflict/theme-monokai";
	const dispatch = createEventDispatcher();

	export let editor = null;
	export let content = "";
	// Other themes and modes must also be imported above
	export let theme = "monokai";
	export let mode = "jade";
	export function setContent(content) {
		editor ? editor.session.setValue(content, -1) : null;
	}
	export let width;

	function initEditor() {
		editor = ace.edit("editor");
		editor.setTheme(`ace/theme/${theme}`);
		editor.setShowPrintMargin(false);
		editor.getSession().setUseWrapMode(true);
		editor.session.setOptions({
			mode: `ace/mode/${mode}`,
			tabSize: 4,
			useSoftTabs: true
		});

		setContent(content);

		editor.session.on("change", function (delta) {
			content = editor.getValue();
			dispatch("change", {
				content
			});
		});
	}

	onMount(initEditor);

	let w;
	function resize(w) {
		if (editor) editor.resize();
	}
	$: resize(width);
</script>

<div id="editor"></div>

<style>
	#editor {
		position: relative;
		padding: 0;
		margin: 0;
		width: 100%;
		height: 100%;
	}
</style>
