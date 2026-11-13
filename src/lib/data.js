// Checking and parsing CSV data for the editor (used by makeData() in App.svelte). These functions
// don't touch the app's state, so a CSV that can't be loaded leaves the current data as it is.
import { MagicArray, csvParse, validateCSV, ascending } from "@onsvisual/robo-utils";
import { getColKeys } from "./utils.js";

// What each problem means for the user. Errors stop the CSV loading, as rows without a code
// can't be selected or looked up. Warnings don't break the editor, but should be fixed.
const errorChecks = {
	blankRows: "Delete these rows. Blank rows at the end of the file are fine (they're ignored).",
	noCode: "Every row needs a value in the id column, so that it can be selected and looked up.",
	oneColumn:
		"The file needs separate id and label columns. Check that it's a CSV file, with its values separated by commas."
};
const warningChecks = {
	noName: "These rows are listed by their code in the area menu, and templates will have no name for them.",
	duplicateCodes:
		"Only the last row with each code can be looked up (eg. by places.get() or lookup in templates), and the areas would overwrite each other's files when published.",
	mixedTypes:
		'Templates may show these values (eg. "NA") or give an error for these areas. Use Validate to check the template for every area.'
};

// Validate a CSV string with robo-utils' validateCSV (using the chosen id and label columns, if
// any), and sort its problems into errors and warnings
export function checkCSV(str, keys = null) {
	const report = validateCSV(str, { codeKey: keys?.id ?? null, nameKey: keys?.label ?? null });
	const errors = [];
	const warnings = [];
	if (report.error) {
		errors.push({
			id: "error",
			title: report.error,
			impact: errorImpact(report),
			problems: []
		});
	} else if (report.columns.length < 2) {
		errors.push({
			id: "oneColumn",
			title: "Only one column found",
			impact: errorChecks.oneColumn,
			problems: [{ message: `The column is called "${report.columns[0]}"` }]
		});
	}
	for (const check of report.checks) {
		if (check.passed) continue;
		const item = { id: check.id, title: check.title, problems: check.problems };
		if (errorChecks[check.id]) errors.push({ ...item, impact: errorChecks[check.id] });
		else if (warningChecks[check.id])
			warnings.push({ ...item, impact: warningChecks[check.id] });
	}
	return { report, errors, warnings };
}

function errorImpact(report) {
	if (report.rows === 0) return "The file needs a header row and at least one row of data.";
	return "Choose another column in CSV columns and filters, or load a different file.";
}

// A row's 3-letter id prefix, used by the filter. Ids can be numbers (MagicNumbers), so they're
// converted to text, but the rows themselves aren't changed.
export const idPrefix = (row, keys) => String(row[keys.id] ?? "").slice(0, 3);

// A row's label, as shown in the area menu: its name, or its code if it has no name
export const rowLabel = (row, keys) => String(row[keys.label] ?? row[keys.id] ?? "");

// Rows whose id starts with one of the filter prefixes (or every row if there's no filter),
// sorted by label
export function filterData(data, keys, filter) {
	const filtered =
		filter.length > 0
			? data.filter((row) => filter.includes(idPrefix(row, keys)))
			: MagicArray.from(data);
	return filtered.sort((a, b) => rowLabel(a, keys).localeCompare(rowLabel(b, keys)));
}

// Parse a CSV string into everything the editor needs. keys and filter default to the detected
// id and label columns, and the default filter prefixes that are in the data.
export function buildData(str, _keys, _filter, filterDefault) {
	const rows = csvParse(str);
	const cols = rows.columns;
	const keys = _keys ?? getColKeys(cols);
	const ids = Array.from(new Set(rows.map((row) => idPrefix(row, keys)))).sort(ascending);
	const filter =
		_filter ??
		(filterDefault.some((f) => ids.includes(f))
			? filterDefault.filter((f) => ids.includes(f))
			: []);
	const data = MagicArray.from(rows);
	const lookup = {};
	for (const row of data) {
		lookup[row[keys.id]] = row;
		if (row[keys.label] != null) lookup[row[keys.label]] = row;
	}
	const places = filterData(data, keys, filter);
	return { data, cols, keys, ids, filter, lookup, places };
}
