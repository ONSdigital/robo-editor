<script>
	let { data } = $props();

	// The CSV's columns, in order (data is a MagicArray, and may be empty if the filter leaves no rows)
	let cols = $derived(data?.length ? data.columns : []);
</script>

{#if data}
	<table>
		<thead>
			<tr>
				{#each cols as col}
					<th>{col}</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each data as d}
				<tr>
					{#each cols as col}
						<td>{d[col]}</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
{/if}

<style>
	table {
		border-collapse: collapse;
		width: 100%;
	}
	tr {
		border-bottom: 1px solid lightgrey;
	}
	thead > tr {
		border-bottom: 1px solid black;
	}
	th {
		text-align: left;
	}
	td + td,
	th + th {
		padding-left: 8px;
	}
</style>
