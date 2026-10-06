<script>
	import { onDestroy, onMount } from "svelte";
	import { basicSetup } from "codemirror";
	import { EditorView, keymap } from "@codemirror/view";
	import { EditorState } from "@codemirror/state";
	import { indentUnit } from "@codemirror/language";
	import { indentWithTab } from "@codemirror/commands";
	import { pugLanguage } from "./pug-language.js";
	import { monokai } from "./monokai.js";

	let { content = $bindable("") } = $props();

	let element = $state();
	let view;

	// Replace the whole document (eg. when a template is loaded), with the cursor at the start
	export function setContent(text) {
		view?.dispatch({
			changes: { from: 0, to: view.state.doc.length, insert: text ?? "" },
			selection: { anchor: 0 },
			effects: EditorView.scrollIntoView(0)
		});
	}

	onMount(() => {
		view = new EditorView({
			parent: element,
			state: EditorState.create({
				doc: content,
				extensions: [
					basicSetup,
					// Tab indents, like Ace (press Escape then Tab to move focus out of the editor)
					keymap.of([indentWithTab]),
					pugLanguage,
					EditorState.tabSize.of(4),
					indentUnit.of("    "),
					EditorView.lineWrapping,
					monokai,
					EditorView.updateListener.of((update) => {
						if (!update.docChanged) return;
						content = update.state.doc.toString();
					})
				]
			})
		});
	});

	onDestroy(() => view?.destroy());
</script>

<div class="editor" bind:this={element}></div>

<style>
	.editor {
		position: relative;
		width: 100%;
		height: 100%;
	}
</style>
