<script>
	export let data;

	$: cols = data ? Object.keys(data[0]) : [];
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
	.right {
		text-align: right;
	}
	td + td,
	th + th {
		padding-left: 8px;
	}
</style>
