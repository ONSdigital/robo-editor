import { highlightCode } from "@lezer/highlight";
import { StyleModule } from "style-mod";
import { pugLanguage } from "./pug-language.js";
import { highlightStyle } from "./monokai.js";

const escape = (text) =>
	text.replace(/[&<>]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[char]);

// Highlight Pug code as HTML, with the same tokens and colours as the editor
export function highlightPug(code) {
	// The editor normally adds these styles; mount them in case it hasn't yet
	if (highlightStyle.module) StyleModule.mount(document, highlightStyle.module);
	let html = "";
	highlightCode(
		code,
		pugLanguage.parser.parse(code),
		highlightStyle,
		(text, classes) =>
			(html += classes ? `<span class="${classes}">${escape(text)}</span>` : escape(text)),
		() => (html += "\n")
	);
	return html;
}
