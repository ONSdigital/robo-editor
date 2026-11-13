<script>
	// A modal dialog. Escape, the close button or a click on the backdrop close it. Focus moves into
	// the dialog when it opens, and back to where it was when it closes. compact dialogs are only as
	// tall as their content (for messages); others fill the window (eg. the CSV table).
	import Icon from "./Icon.svelte";

	let { title = " ", open = $bindable(true), compact = false, children } = $props();

	const id = $props.id();
	let dialog = $state();

	$effect(() => {
		if (!open) return;
		const opener = document.activeElement;
		dialog?.focus();
		return () => opener?.focus?.();
	});

	function onkeydown(e) {
		if (e.key === "Escape") {
			e.stopPropagation();
			open = false;
		}
	}
</script>

{#if open}
	<div
		class="modal"
		role="presentation"
		onclick={(e) => e.target === e.currentTarget && (open = false)}
	>
		<div
			class="modal-dialog"
			class:compact
			role="dialog"
			aria-modal="true"
			aria-labelledby="{id}-title"
			tabindex="-1"
			bind:this={dialog}
			{onkeydown}
		>
			<button class="close" title="Close" onclick={() => (open = false)}
				><Icon type="close" /></button
			>
			<h2 id="{id}-title">{title}</h2>
			<div class="modal-content">
				{@render children?.()}
			</div>
		</div>
	</div>
{/if}

<style>
	.modal {
		position: fixed;
		background-color: rgba(0, 0, 0, 0.5);
		z-index: 100;
		top: 0;
		bottom: 0;
		left: 0;
		right: 0;
	}
	.modal-dialog {
		position: relative;
		display: flex;
		flex-direction: column;
		background-color: white;
		margin: 40px auto;
		padding: 20px;
		max-width: 980px;
		height: calc(100vh - 80px);
	}
	.modal-dialog.compact {
		max-width: 760px;
		height: auto;
		max-height: calc(100vh - 80px);
	}
	.modal-dialog:focus {
		outline: none;
	}
	h2 {
		margin: 0 48px 10px 0;
	}
	button.close {
		position: absolute;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		top: 0;
		right: 0;
		width: 48px;
		height: 48px;
		border: none;
		background: none;
		font-size: 1.3em;
		cursor: pointer;
	}
	.modal-content {
		flex: 1;
		min-height: 0;
		overflow: auto;
	}
</style>
