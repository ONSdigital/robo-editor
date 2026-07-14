<script>
	import Icon from "./Icon.svelte";

	export let title = " ";
	export let open = true;
</script>

{#if open}
	<div class="modal" role="dialog" tabindex="-1">
		<div class="modal-dialog" role="document">
			<button class="close" on:click={() => (open = false)}><Icon type="close" /></button>
			<h2>{title}</h2>
			<div class="modal-content">
				<slot />
			</div>
		</div>
	</div>
{/if}

<style>
	.modal {
		position: absolute;
		background-color: rgba(0, 0, 0, 0.5);
		z-index: 100;
		top: 0;
		bottom: 0;
		left: 0;
		right: 0;
	}
	.modal-dialog {
		position: relative;
		background-color: white;
		margin: 40px auto;
		padding: 20px;
		max-width: 980px;
		height: calc(100vh - 80px);
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
		position: absolute;
		padding: 0 20px;
		left: 0;
		right: 0;
		top: 60px;
		bottom: 0;
		display: block;
		overflow: auto;
	}
</style>
