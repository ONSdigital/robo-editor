<script>
	import { onMount } from "svelte";
	import { MagicArray, csvParse, renderJSON, ascending } from "@onsvisual/robo-utils";
	import debounce from "debounce";
	import JSZip from "jszip";
	import { NodeHtmlMarkdown } from "node-html-markdown";
	import computedStyleToInlineStyle from "computed-style-to-inline-style";
	import { download, sleep, getColKeys, setStorage, getStorage, deleteStorage } from "./utils";
	import { HSplitPane } from "svelte-split-pane";
	import Editor from "./ui/Editor.svelte";
	import Icon from "./ui/Icon.svelte";
	import Output from "./ui/Output.svelte";
	import Modal from "./ui/Modal.svelte";
	import Table from "./ui/Table.svelte";
	import Help from "./Help.svelte";

	// CONSTANTS
	const filter_default = ["E06", "E07", "E08", "E09", "W06", "S12", "N09"];
	const process = { env: {} };
	window.process = process;

	// DOM BINDINGS ETC
	let pug, htmlToRtf, editor, pug_upload, csv_upload;

	// STATE/DATA
	let template = "";
	let output, data_raw, data, lookup, places, place, cols, keys, ids, filter;
	let plaintext = false;
	let modal_data = false;
	let modal_help = false;
	let modal_filter = false;
	let progress = 0;

	// BINDINGS
	let w, offScreen;

	const render = debounce(() => {
		output = renderJSON(template, place, places, lookup, pug);
		setStorage("robo-store", { data_raw, template, filter, keys });
	}, 500);
	$: if (pug && template) render(template, place, places, lookup);
	$: console.log(output);

	function clickPUG() {
		pug_upload.click();
	}
	function loadPUG() {
		let file = pug_upload.files[0] ? pug_upload.files[0] : null;

		if (file) {
			const reader = new FileReader();
			reader.onload = (e) => editor.setContent(e.target.result);
			reader.readAsText(file);
		}
	}

	async function validatePUG() {
		progress = 0;
		const invalid = [];

		const plcs = places ? [null, ...places] : [null];

		let i = 0;
		while (i < plcs.length && invalid.length < 5) {
			progress = i === plcs.length - 1 ? 0 : (i + 1) / plcs.length;
			await sleep(0);
			let output = renderJSON(template, plcs[i], places, lookup, pug);
			if (output.error) invalid.push(plcs[i] ? plcs[i][keys.label] : "No area selected");
			i++;
		}

		if (invalid[0]) {
			alert(`Validation failed for areas including ${invalid.join(", ")}`);
		} else {
			alert("Validation passed for all areas.");
		}
	}

	function makeData(str, _keys = null, _filter = null) {
		try {
			data_raw = str;
			let newdata = csvParse(str);
			cols = newdata.columns;
			keys = _keys ? _keys : getColKeys(cols);
			ids = Array.from(new Set(newdata.map((d) => `${d[keys.id]}`.slice(0, 3)))).sort(
				ascending
			);
			console.log(keys, ids);
			filter = _filter
				? _filter
				: filter_default.some((f) => ids.includes(f))
					? filter_default.filter((f) => ids.includes(f))
					: [];

			data = MagicArray.from(newdata);

			let newlookup = {};
			data.forEach((d) => {
				newlookup[d[keys.id]] = d;
				newlookup[d[keys.label]] = d;
			});

			places = filterData(data, keys, filter);
			place = places[0];
			lookup = newlookup;
		} catch (err) {
			const msg = "Failed to load data. Please refresh page.";
			deleteStorage("robo-store");
			console.error(msg, err);
			alert(msg);
		}
	}
	function clickCSV() {
		csv_upload.click();
	}
	function loadCSV() {
		let file = csv_upload.files[0] ? csv_upload.files[0] : null;

		if (file) {
			const reader = new FileReader();
			reader.onload = (e) => makeData(e.target.result);
			reader.readAsText(file);
		}
	}

	function filterData(data, keys, filter) {
		let filtered =
			filter.length > 0
				? data.filter((d) => filter.includes(d[keys.id].slice(0, 3)))
				: new MagicArray(...data);
		return filtered.sort((a, b) => a[keys.label].localeCompare(b[keys.label]));
	}

	function savePUG() {
		let blob = new Blob([template], { type: "text/pug;charset=utf-8" });
		download(blob, "template.pug");
	}

	async function saveOutput(mode = "json") {
		const zip = new JSZip();
		const out = zip.folder("output");
		zip.file("data.csv", data_raw);
		zip.file("template.pug", template);

		const nhm = new NodeHtmlMarkdown();
		const plcs = places ? [null, ...places] : [null];

		let i = 0;
		progress = 0;
		while (i < plcs.length) {
			progress = i === plcs.length - 1 ? 0 : (i + 1) / plcs.length;
			await sleep(0);
			const output = renderJSON(template, plcs[i], places, lookup, pug);
			if (!output.error) {
				const filename = `${plcs[i] ? `${plcs[i][keys.id]}_${plcs[i][keys.label]}` : "Default"}.${mode}`;
				if (mode === "md" || mode === "rtf") {
					new Output({ target: offScreen, props: { plaintext: true, output } });
					let renderedOutput;
					if (mode === "md") {
						renderedOutput = nhm.translate(offScreen.innerHTML);
					} else {
						computedStyleToInlineStyle(offScreen, {
							recursive: true,
							properties: ["font-size", "color"]
						});
						const html = offScreen.innerHTML
							.replace(/\n/g, "")
							.replace(/\d+(?:.\d+)?(?=px)/g, (val) => +val * 2);
						renderedOutput = htmlToRtf(html);
					}
					out.file(filename, renderedOutput);
					offScreen.innerHTML = "";
				} else {
					out.file(filename, JSON.stringify(output));
				}
			}
			i++;
		}

		const blob = await zip.generateAsync({ type: "blob" });
		download(blob, `${mode}.zip`);
	}

	async function loadIntro() {
		template = "";
		places = null;
		lookup = null;
		place = null;
		getPUG("./data/intro.pug");
	}

	async function embedDemo() {
		getCSV("./data/data_v2.csv");
		getPUG("./data/template_embed.pug");
	}

	async function scrollyDemo() {
		getCSV("./data/data.csv");
		getPUG("./data/template.pug");
	}

	async function nlgDemo() {
		getCSV("./data/data.csv");
		getPUG("./data/template_nlg.pug");
	}

	async function getCSV(url) {
		console.log("loading csv");
		let csv_res = await fetch(url);
		let csv_str = await csv_res.text();
		makeData(csv_str);
	}

	async function getPUG(url) {
		console.log("loading pug");
		let pug_res = await fetch(url);
		let pug = await pug_res.text();
		await sleep(50);
		template = pug;
		editor.setContent(template);
	}

	onMount(() => {
		window.embedDemo = embedDemo;
		window.scrollyDemo = scrollyDemo;
		window.nlgDemo = nlgDemo;

		let params = new URL(document.location).searchParams;
		let pug;
		for (const [key, url] of params) {
			console.log(key, url);
			if (key == "csv") {
				getCSV(url);
			} else if (key == "pug") {
				pug = true;
				getPUG(url);
			}
		}
		let store = getStorage("robo-store");
		if (!pug && store) {
			data_raw = store.data_raw;
			makeData(data_raw, store.keys, store.filter);
			template = store.template;
			editor.setContent(template);
		} else if (!pug) {
			loadIntro();
		}
	});
</script>

<svelte:head>
	<script
		src="https://pugjs.org/js/pug.js"
		on:load={() => (pug = window.require("pug"))}
	></script>
	<script
		src="https://www.unpkg.com/html-to-rtf@2.1.0/app/browser/bundle.js"
		on:load={() => (htmlToRtf = window.htmlToRtf)}
	></script>
	/node_modules/html-to-rtf/app/browser/bundle.js
	{#if plaintext}
		<style>
			mark {
				background-color: rgba(255, 255, 255, 0);
			}
			section > section {
				margin-left: none;
			}
		</style>
	{:else}
		<style>
			mark {
				font-weight: bold;
				padding: 0 4px;
				background-color: lightgrey;
			}
			prop {
				background-color: lightgrey;
				margin-right: 4px;
			}
			section {
				border-top: 1px solid black;
			}
			section > section {
				margin-left: 20px;
			}
		</style>
	{/if}
</svelte:head>

<main>
	<nav>
		{#if progress}
			<div class="progress-container">
				<div class="progress-bar" style:width="{(progress * 100).toFixed(0)}%" />
			</div>
		{/if}
		<div>
			<button title="Close PUG and CSV (return to intro)" on:click={loadIntro}
				><Icon type="trash" /></button
			>
			<div class="v-divider" />
			<span>PUG</span>
			<button title="Load PUG" on:click={clickPUG}
				><Icon type="load" margin /><span>Load</span></button
			>
			<button title="Validate PUG" on:click={validatePUG}
				><Icon type="validate" margin /><span>Validate</span></button
			>
			<button title="Save PUG" on:click={savePUG}
				><Icon type="save" margin /><span>Save</span></button
			>
			<input
				type="file"
				accept=".pug"
				style="display:none"
				bind:this={pug_upload}
				on:change={loadPUG}
			/>
			<input
				type="file"
				accept=".csv"
				style="display:none"
				bind:this={csv_upload}
				on:change={loadCSV}
			/>
			<div class="v-divider" />
			<span>CSV</span>
			<button title="Load CSV" on:click={clickCSV}
				><Icon type="load" margin /><span>Load</span></button
			>
			<select bind:value={place} disabled={!places}>
				{#if places}
					<option value={null}>No area selected</option>
					{#each places as option}
						<option value={option}>{option[keys.label]}</option>
					{/each}
				{:else}
					<option value={null}>Load a CSV data file</option>
				{/if}
			</select>
			<button
				style:margin-right="0"
				disabled={!places}
				title="Show CSV as table"
				on:click={() => (modal_data = true)}><Icon type="table" /></button
			>
			<button
				disabled={!places}
				title="Filter CSV by ID"
				on:click={() => (modal_filter = true)}><Icon type="filter" /></button
			>
			<div class="v-divider" />
			<span>Output</span>
			<button title="Save as RTF" on:click={() => saveOutput("rtf")}
				><Icon type="save" margin /><span>RTF</span></button
			>
			<button title="Save as Markdown" on:click={() => saveOutput("md")}
				><Icon type="save" margin /><span>MD</span></button
			>
			<button title="Save as JSON" on:click={() => saveOutput("json")}
				><Icon type="save" margin /><span>JSON</span></button
			>
			<label>
				<input type="checkbox" bind:checked={plaintext} />
				Text only
			</label>
		</div>
		<div>
			<button class="right" title="Show help" on:click={() => (modal_help = true)}
				><Icon type="info" /></button
			>
		</div>
	</nav>
	<div class="content">
		<HSplitPane>
			<left slot="left">
				<div bind:clientWidth={w} />
				<Editor bind:content={template} bind:this={editor} width={w} />
			</left>
			<right slot="right">
				<div class="preview">
					<Output {output} {plaintext} />
				</div>
			</right>
		</HSplitPane>
	</div>
</main>

<Modal title="Loaded CSV" bind:open={modal_data}>
	<Table data={places} />
</Modal>

<Modal title="CSV columns and filters" bind:open={modal_filter}>
	<p>Select <strong>id</strong> and <strong>label</strong> columns in dataset.</p>
	<label class="checkbox-label">
		id:<br />
		<select bind:value={keys.id} on:change={() => makeData(data_raw, keys)}>
			{#each cols as col}
				<option value={col}>{col}</option>
			{/each}
		</select>
	</label>
	<label class="checkbox-label">
		label:<br />
		<select bind:value={keys.label} on:change={() => makeData(data_raw, keys)}>
			{#each cols as col}
				<option value={col}>{col}</option>
			{/each}
		</select>
	</label>
	<p style:margin-top="16px">
		To filter the rows in the CSV, select from these 3-letter prefixes in the <strong>id</strong
		>
		({keys.id}) column.
	</p>
	{#each ids as id}
		<label class="checkbox-label">
			<input
				type="checkbox"
				name="filter"
				bind:group={filter}
				value={id}
				on:change={() => {
					places = filterData(data, keys, filter);
					place = place = places[0];
				}}
			/>
			{id}
		</label>
	{/each}
</Modal>

<Modal title="Help" bind:open={modal_help}>
	<Help />
</Modal>

<div style:display="none" bind:this={offScreen} />

<style>
	:global(*) {
		box-sizing: border-box;
	}
	:global(body) {
		padding: 0;
		margin: 0;
	}
	:global(.class-label) {
		background-color: lightgreen;
	}
	:global(.id-label) {
		background-color: yellow;
	}
	:global(prop.highlighted) {
		display: inline-block;
		vertical-align: top;
		white-space: nowrap;
		max-width: 300px;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	:global(prop.highlighted:hover) {
		overflow: visible;
	}
	:global(.text-big) {
		font-size: 1.3em;
	}
	:global(h1) {
		font-size: 2em;
	}
	:global(h1, h2, p) {
		margin: 0 0 10px 0;
	}
	:global(section) {
		margin-top: 20px;
	}
	:global(.visually-hidden) {
		color: grey;
		font-style: italic;
	}
	:global(.btn-inline) {
		margin: 0 4px;
		padding: 0 4px;
	}
	:global(div.separator) {
		width: 6px !important;
		background: lightgrey !important;
	}
	label.checkbox-label {
		display: inline-block;
	}
	label.checkbox-label + label.checkbox-label {
		border-left: 1px solid grey;
		margin-left: 8px;
		padding-left: 10px;
	}
	main {
		display: flex;
		flex-direction: column;
		height: 100vh;
		max-height: 100vh;
	}
	nav {
		position: relative;
		width: 100%;
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		background-color: #bbb;
		padding: 6px;
	}
	nav > div {
		display: flex;
		flex-direction: row;
		align-items: center;
	}
	nav > div > span {
		padding-right: 6px;
	}
	button {
		display: inline-flex;
		flex-direction: row;
		align-items: center;
		height: 38px;
		margin: 0 6px 0 0;
		cursor: pointer;
	}
	button:disabled {
		cursor: auto;
	}
	button.right {
		margin: 0;
	}
	button > span {
		margin-left: 2px;
	}
	select {
		margin: 0;
		max-width: 200px;
	}
	.content {
		display: flex;
		flex-direction: row;
		flex-grow: 1;
		overflow: hidden;
	}
	left,
	right {
		position: relative;
	}
	left > div {
		position: absolute;
		width: 100%;
	}
	.preview {
		padding: 10px;
		overflow-y: auto;
		height: 100%;
	}
	nav label {
		margin-left: 1px;
	}
	nav input[type="checkbox"] {
		transform: scale(1.5);
		filter: saturate(0) contrast(2.5);
		margin-right: 2.5px;
	}
	.v-divider {
		width: 2px;
		height: 100%;
		background-color: grey;
		margin-right: 8px;
	}
	.progress-container {
		position: absolute;
		display: block;
		z-index: 100;
		top: 100%;
		left: 0;
		right: 0;
		height: 5px;
	}
	.progress-bar {
		height: 100%;
		left: 0;
		background: orange;
	}
</style>
