<script>
	import { onMount, mount, unmount, flushSync } from "svelte";
	import { asset } from "$app/paths";
	import pug from "$lib/pug/index.js";
	import { renderJSON } from "@onsvisual/robo-utils";
	import debounce from "debounce";
	import JSZip from "jszip";
	import { NodeHtmlMarkdown } from "node-html-markdown";
	import { markdownToRtf } from "./rtf.js";
	import { get } from "svelte/store";
	import { download, sleep, parsePugError } from "./utils";
	import { checkCSV, buildData, filterData, rowLabel } from "./data.js";
	import { appVersion } from "./config.js";
	import { getAppState, getStoredAppVersion, setStoredAppVersion } from "./util/state";
	import { HSplitPane } from "svelte-split-pane";
	import Editor from "./ui/Editor.svelte";
	import Icon from "./ui/Icon.svelte";
	import Output from "./ui/Output.svelte";
	import Modal from "./ui/Modal.svelte";
	import Table from "./ui/Table.svelte";
	import CsvReport from "./ui/CsvReport.svelte";
	import Help from "./Help.svelte";

	// CONSTANTS
	const filter_default = ["E06", "E07", "E08", "E09", "W06", "S12", "N09"];
	const process = { env: {} };
	window.process = process;

	// DOM BINDINGS ETC
	let editor = $state(),
		pug_upload = $state(),
		csv_upload = $state();

	// STATE/DATA
	let template = $state("");
	// Large or non-plain data is kept as raw (not deeply reactive) state
	let output = $state.raw(),
		data_raw = $state.raw(),
		data = $state.raw(),
		lookup = $state.raw();
	let places = $state.raw(),
		place = $state.raw(),
		cols = $state.raw(),
		ids = $state.raw();
	// keys and filter are bound to form fields in the filter modal, so they're deeply reactive
	let keys = $state(),
		filter = $state();
	let plaintext = $state(false);
	let modal_data = $state(false);
	let modal_help = $state(false);
	let modal_filter = $state(false);
	// The result of the last attempt to load a CSV (shown in the CSV check modal), and of the CSV
	// that is loaded now (for the warnings button)
	let csv_report = $state.raw(null),
		csv_status = $state.raw(null);
	let modal_csv = $state(false);
	// The result of Validate: { checked, total, failed: [{ place, label, message }], stopped }
	let validation = $state.raw(null);
	let modal_validate = $state(false);
	// A message for the user, eg. when a file can't be fetched ({ title, text, detail })
	let notice = $state.raw(null);
	let progress = $state(0);

	// BINDINGS
	let offScreen = $state();

	// Synced stores for state kept across sessions (see src/lib/util/state/)
	let appState;

	const render = debounce(() => {
		try {
			output = renderJSON(template, place, places, lookup, pug);
		} catch (err) {
			// renderJSON returns Pug errors, but can still throw (eg. for a row with no name)
			console.error(err);
			output = { sections: [], error: String(err) };
		}
		if (appState && template !== get(appState.template)) appState.template.set(template);
	}, 500);
	$effect(() => {
		if (pug && template) render(template, place, places, lookup);
	});
	$inspect(output);

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
		pug_upload.value = "";
	}

	// Render the template for every area (and no area), stopping after 5 errors
	async function validatePUG() {
		progress = 0;
		const failed = [];
		const plcs = places ? [null, ...places] : [null];

		let i = 0;
		while (i < plcs.length && failed.length < 5) {
			progress = i === plcs.length - 1 ? 0 : (i + 1) / plcs.length;
			await sleep(0);
			let error;
			try {
				error = renderJSON(template, plcs[i], places, lookup, pug).error;
			} catch (err) {
				error = String(err);
			}
			if (error) {
				const label = plcs[i] ? rowLabel(plcs[i], keys) : "No area selected";
				const { message, location } = parsePugError(error);
				failed.push({ place: plcs[i], label, message: `${message}${location}` });
			}
			i++;
		}
		progress = 0;
		validation = { checked: i, total: plcs.length, failed, stopped: i < plcs.length };
		modal_validate = true;
	}
	// Show an area from the Validate results in the preview
	function selectPlace(p) {
		place = p;
		modal_validate = false;
	}

	// Load a CSV string. If it has problems that stop it loading (see checkCSV() in data.js), the
	// current data is kept and the CSV check modal says what to fix. With quiet = true (when
	// restoring the saved CSV), the modal only opens if the CSV can't be loaded.
	function makeData(
		str,
		_keys = null,
		_filter = null,
		{ quiet = false, source = null, columns = false } = {}
	) {
		const check = checkCSV(str, _keys);
		let result = null,
			error = null;
		if (!check.errors.length) {
			try {
				result = buildData(str, _keys, _filter, filter_default);
			} catch (err) {
				console.error("Failed to load data", err);
				error = err.message;
			}
		}
		csv_report = { ...check, source, columns, loaded: !!result, error, hadData: !!data };
		if (result) {
			data_raw = str;
			({ data, cols, keys, ids, filter, lookup, places } = result);
			place = places[0] ?? null;
			csv_status = csv_report;
			saveData();
		}
		if (!result || (check.warnings.length && !quiet)) modal_csv = true;
		return !!result;
	}
	// Choose the id or label column in the filter modal (keeping the current ones if they don't work)
	function changeKeys(e, key) {
		const newKeys = { ...$state.snapshot(keys), [key]: e.target.value };
		if (!makeData(data_raw, newKeys, null, { columns: true, source: csv_status?.source })) {
			e.target.value = keys[key];
		}
	}
	function clickCSV() {
		csv_upload.click();
	}
	function loadCSV() {
		let file = csv_upload.files[0] ? csv_upload.files[0] : null;

		if (file) {
			const reader = new FileReader();
			reader.onload = (e) => makeData(e.target.result, null, null, { source: file.name });
			reader.readAsText(file);
		}
		// So that choosing the same file again (eg. after fixing it) loads it again
		csv_upload.value = "";
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
				const filename = `${plcs[i] ? `${plcs[i][keys.id]}_${rowLabel(plcs[i], keys)}` : "Default"}.${mode}`;
				if (mode === "md" || mode === "rtf") {
					const component = mount(Output, {
						target: offScreen,
						props: { plaintext: true, output }
					});
					flushSync();
					// RTF is generated from the same markdown as the MD export (see src/lib/rtf.js)
					const markdown = nhm.translate(offScreen.innerHTML);
					out.file(filename, mode === "md" ? markdown : markdownToRtf(markdown));
					unmount(component);
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
		// Close the CSV too, so it isn't restored with the intro next time
		data_raw = null;
		data = null;
		csv_status = null;
		for (const key of ["dataRaw", "keys", "filter"]) appState?.[key].set(null);
		getPUG(asset("/data/intro.pug"));
	}

	async function embedDemo() {
		getCSV(asset("/data/data_v2.csv"));
		getPUG(asset("/data/template_embed.pug"));
	}

	async function scrollyDemo() {
		getCSV(asset("/data/data.csv"));
		getPUG(asset("/data/template.pug"));
	}

	// Fetch a file's text, throwing an error for a failed request (eg. a 404)
	async function fetchText(url) {
		const res = await fetch(url);
		if (!res.ok) throw new Error(`${res.status} ${res.statusText}`.trim());
		return res.text();
	}

	async function getCSV(url) {
		let csv_str;
		try {
			csv_str = await fetchText(url);
		} catch (err) {
			notice = {
				title: "Couldn't load the CSV",
				text: `Couldn't load ${url}`,
				detail: err.message
			};
			return;
		}
		makeData(csv_str, null, null, { source: url });
	}

	async function getPUG(url) {
		let pug;
		try {
			pug = await fetchText(url);
		} catch (err) {
			notice = {
				title: "Couldn't load the PUG",
				text: `Couldn't load ${url}`,
				detail: err.message
			};
			return;
		}
		await sleep(50);
		template = pug;
		editor.setContent(template);
	}

	// Save the CSV, column keys and filter (whenever any of them change)
	function saveData() {
		if (!appState) return;
		if (data_raw !== get(appState.dataRaw)) appState.dataRaw.set(data_raw);
		appState.keys.set(keys);
		appState.filter.set(filter);
	}

	onMount(async () => {
		window.embedDemo = embedDemo;
		window.scrollyDemo = scrollyDemo;
		window.showHelp = () => (modal_help = true);

		const storedAppVersion = await getStoredAppVersion();
		appState = await getAppState(storedAppVersion);
		if (appVersion !== storedAppVersion) await setStoredAppVersion();

		let params = new URL(document.location).searchParams;
		let pugParam = false;
		for (const [key, url] of params) {
			console.log(key, url);
			if (key == "csv") {
				getCSV(url);
			} else if (key == "pug") {
				pugParam = true;
				getPUG(url);
			}
		}
		const savedTemplate = get(appState.template);
		if (!pugParam && savedTemplate) {
			// A template without a CSV (eg. the intro page) is saved without data
			const savedData = get(appState.dataRaw);
			if (savedData) {
				const loaded = makeData(savedData, get(appState.keys), get(appState.filter), {
					quiet: true,
					source: "the CSV saved from your last session"
				});
				// Forget saved data that can't be loaded (the template is kept)
				if (!loaded)
					for (const key of ["dataRaw", "keys", "filter"]) appState[key].set(null);
			}
			template = savedTemplate;
			editor.setContent(template);
		} else if (!pugParam) {
			loadIntro();
		}
	});
</script>

<svelte:head>
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
				<div class="progress-bar" style:width="{(progress * 100).toFixed(0)}%"></div>
			</div>
		{/if}
		<div>
			<button title="Close PUG and CSV (return to intro)" onclick={loadIntro}
				><Icon type="trash" /></button
			>
			<div class="v-divider"></div>
			<span>PUG</span>
			<button title="Load PUG" onclick={clickPUG}
				><Icon type="load" margin /><span>Load</span></button
			>
			<button title="Validate PUG" onclick={validatePUG}
				><Icon type="validate" margin /><span>Validate</span></button
			>
			<button title="Save PUG" onclick={savePUG}
				><Icon type="save" margin /><span>Save</span></button
			>
			<input
				type="file"
				accept=".pug"
				style="display:none"
				bind:this={pug_upload}
				onchange={loadPUG}
			/>
			<input
				type="file"
				accept=".csv"
				style="display:none"
				bind:this={csv_upload}
				onchange={loadCSV}
			/>
			<div class="v-divider"></div>
			<span>CSV</span>
			<button title="Load CSV" onclick={clickCSV}
				><Icon type="load" margin /><span>Load</span></button
			>
			<select bind:value={place} disabled={!places}>
				{#if places}
					<option value={null}>No area selected</option>
					{#each places as option}
						<option value={option}>{rowLabel(option, keys)}</option>
					{/each}
				{:else}
					<option value={null}>Load a CSV data file</option>
				{/if}
			</select>
			<button
				style:margin-right="0"
				disabled={!places}
				title="Show CSV as table"
				onclick={() => (modal_data = true)}><Icon type="table" /></button
			>
			<button
				disabled={!places}
				title="Filter CSV by ID"
				onclick={() => (modal_filter = true)}><Icon type="filter" /></button
			>
			{#if csv_status?.warnings.length}
				<button
					class="warnings"
					title="Show CSV warnings"
					onclick={() => {
						csv_report = csv_status;
						modal_csv = true;
					}}
					><Icon type="warning" margin /><span>{csv_status.warnings.length}</span></button
				>
			{/if}
			<div class="v-divider"></div>
			<span>Output</span>
			<button title="Save as RTF" onclick={() => saveOutput("rtf")}
				><Icon type="save" margin /><span>RTF</span></button
			>
			<button title="Save as Markdown" onclick={() => saveOutput("md")}
				><Icon type="save" margin /><span>MD</span></button
			>
			<button title="Save as JSON" onclick={() => saveOutput("json")}
				><Icon type="save" margin /><span>JSON</span></button
			>
			<label>
				<input type="checkbox" bind:checked={plaintext} />
				Text only
			</label>
		</div>
		<div>
			<button class="right" title="Show help" onclick={() => (modal_help = true)}
				><Icon type="info" /></button
			>
		</div>
	</nav>
	<div class="content">
		<HSplitPane>
			{#snippet left()}
				<left>
					<Editor bind:content={template} bind:this={editor} />
				</left>
			{/snippet}
			{#snippet right()}
				<right>
					<div class="preview">
						<Output {output} {plaintext} />
					</div>
				</right>
			{/snippet}
		</HSplitPane>
	</div>
</main>

<Modal title="Loaded CSV" bind:open={modal_data}>
	<Table data={places} />
</Modal>

<Modal title="CSV columns and filters" compact bind:open={modal_filter}>
	<p>Select <strong>id</strong> and <strong>label</strong> columns in dataset.</p>
	<label class="checkbox-label">
		id:<br />
		<select value={keys.id} onchange={(e) => changeKeys(e, "id")}>
			{#each cols as col}
				<option value={col}>{col}</option>
			{/each}
		</select>
	</label>
	<label class="checkbox-label">
		label:<br />
		<select value={keys.label} onchange={(e) => changeKeys(e, "label")}>
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
				onchange={() => {
					places = filterData(data, keys, filter);
					place = places[0];
					saveData();
				}}
			/>
			{id}
		</label>
	{/each}
</Modal>

<Modal title="How to use this editor" bind:open={modal_help}>
	<Help />
</Modal>

<Modal
	title={csv_report?.loaded !== false
		? "CSV check"
		: csv_report.columns
			? "These columns can't be used"
			: "This CSV can't be loaded"}
	compact
	bind:open={modal_csv}
>
	<CsvReport report={csv_report} />
</Modal>

<Modal title={notice?.title} compact bind:open={() => !!notice, (open) => !open && (notice = null)}>
	<p>{notice?.text}</p>
	{#if notice?.detail}<p class="notice-detail">{notice.detail}</p>{/if}
</Modal>

<Modal title="Validate" compact bind:open={modal_validate}>
	{#if validation?.failed.length === 0}
		<p class="status ok">
			<strong>No errors.</strong>
			{validation.total > 1
				? `The template rendered for all ${validation.total - 1} areas, and with no area selected.`
				: "The template rendered with no area selected. Load a CSV to check it for every area."}
		</p>
	{:else if validation}
		<p class="status error">
			<strong
				>The template gave errors for {validation.stopped ? "at least " : ""}{validation
					.failed.length}
				{validation.failed.length === 1 ? "area" : "areas"}.</strong
			>
			{validation.stopped
				? `Validate stops after ${validation.failed.length} errors, so it checked ${validation.checked} of ${validation.total}.`
				: ""}
		</p>
		<ul class="validate-list">
			{#each validation.failed as item}
				<li>
					<button class="link" onclick={() => selectPlace(item.place)}
						>{item.label}</button
					>:
					{item.message}
				</li>
			{/each}
		</ul>
		<p>Select an area to show its error in the preview.</p>
	{/if}
</Modal>

<div style:display="none" bind:this={offScreen}></div>

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
		margin-bottom: 20px;
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
	:global(.status) {
		padding: 10px;
		border-left: 6px solid;
	}
	:global(.status.error) {
		border-color: #d0021b;
		background-color: #fbe5e8;
	}
	:global(.status.warning) {
		border-color: #e6a700;
		background-color: #fff3cd;
	}
	:global(.status.ok) {
		border-color: #0f8243;
		background-color: #e3f2e9;
	}
	.validate-list li {
		margin-bottom: 6px;
	}
	button.link {
		display: inline;
		height: auto;
		margin: 0;
		padding: 0;
		border: none;
		background: none;
		color: #206095;
		text-decoration: underline;
		font: inherit;
		cursor: pointer;
	}
	button.warnings {
		background-color: #fff3cd;
	}
	.notice-detail {
		font-family: monospace;
	}
	.progress-bar {
		height: 100%;
		left: 0;
		background: orange;
	}
</style>
