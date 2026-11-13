import { getCodeKey, getNameKey } from "@onsvisual/robo-utils";

export function download(blob, filename) {
	let url = window.URL || window.webkitURL || window;
	let link = url.createObjectURL(blob);

	let a = document.createElement("a");
	a.download = filename;
	a.href = link;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
}

export function sleep(ms = 1000) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

// Detect the code (id) and name (label) columns the same way robo-utils does
export function getColKeys(columns) {
	const row = Object.fromEntries(columns.map((col) => [col, null]));
	return { id: getCodeKey(row), label: getNameKey(row) };
}

// Summarise an error returned by renderJSON. Pug's errors come in two forms:
// - compile errors: "Error: Pug:2:7\n<code frame>\n\nSyntax Error: Unexpected token"
// - runtime errors: "TypeError: Cannot read properties of undefined (reading 'x') on line 3"
export function parsePugError(error) {
	const compile = error.match(/^\w*Error: Pug:(\d+):(\d+)\n[\s\S]*?\n\n([\s\S]+)$/);
	const runtime = error.match(/^\w*Error: ([\s\S]+?)(?: on line (\d+))?$/);
	const [message, line, column] = compile
		? [compile[3], compile[1], compile[2]]
		: [runtime?.[1] ?? error, runtime?.[2]];
	const location = line ? ` (line ${line}${column ? `, column ${column}` : ""})` : "";
	return { message, line, column, location };
}
