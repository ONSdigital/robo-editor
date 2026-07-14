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

export class MagicArray extends Array {
	sortBy(key) {
		return this[0][key] && typeof this[0][key] === "number"
			? new MagicArray(...this).sort((a, b) => b[key] - a[key])
			: this[0][key] && typeof this[0][key] === "string"
				? new MagicArray(...this).sort((a, b) => a[key].localeCompare(b[key]))
				: this;
	}
	filterBy(key, val) {
		return !this[0][key] ? this : this.filter((d) => d[key] === val);
	}
	trim(int) {
		return typeof int !== "number"
			? this
			: int >= 0
				? this.slice(0, Math.floor(int))
				: this.slice(Math.floor(int));
	}
	flip() {
		return new MagicArray(...this).reverse();
	}
}

export function sleep(ms = 1000) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getColKeys(keys) {
	const lc = keys.map((key) => key.toLowerCase());

	let id;
	for (let key of ["areacd", "code", "id"]) {
		let i = lc.indexOf(key);
		if (i > -1 && !id) id = keys[i];
	}
	if (!id) id = lc.find((key) => key.toLowerCase().slice(-4) === "code");
	if (!id) id = lc.find((key) => key.toLowerCase().slice(-2) === "cd");
	if (!id) id = keys[0];

	let label;
	for (let key of ["areanm", "name", "label"]) {
		let i = lc.indexOf(key);
		if (i > -1 && !label) label = keys[i];
	}
	if (!label) label = lc.find((key) => key.toLowerCase().slice(-4) === "name");
	if (!label) label = lc.find((key) => key.toLowerCase().slice(-2) === "nm");
	if (!label) label = keys[0];

	return { id, label };
}

export function setStorage(name, value) {
	let val = JSON.stringify(value);
	localStorage.setItem(name, val);
}

export function getStorage(name) {
	if (localStorage.getItem(name)) {
		return JSON.parse(localStorage.getItem(name));
	}
	return null;
}

export function deleteStorage(name) {
	localStorage.removeItem(name);
}
