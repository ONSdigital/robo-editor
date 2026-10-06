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
