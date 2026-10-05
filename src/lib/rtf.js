import { readMarkdown } from "markdown-codec";
import { writeRtf } from "rtf-codec";
import { rgbHexToColor } from "document-schema.js";

// RTF export styling. rtf-codec ignores style definitions and always uses Times New Roman as the
// document's default font, so these properties are set directly on each paragraph and text run.
// Colours must use rgbHexToColor(): document-schema.js colours are { r, g, b } from 0 to 1.
export const theme = {
	body: { fontFamily: "Arial", sizePt: 11, spacingAfterPt: 6 },
	headings: {
		1: {
			sizePt: 20,
			bold: true,
			color: rgbHexToColor("206095"),
			spacingBeforePt: 12,
			spacingAfterPt: 8
		},
		2: {
			sizePt: 15,
			bold: true,
			color: rgbHexToColor("206095"),
			spacingBeforePt: 12,
			spacingAfterPt: 6
		},
		3: { sizePt: 12, bold: true, spacingBeforePt: 10, spacingAfterPt: 4 }
	}
};

const RUN_KEYS = ["fontFamily", "sizePt", "bold", "italic", "color"];
const PARAGRAPH_KEYS = ["spacingBeforePt", "spacingAfterPt", "lineSpacing", "alignment"];

const pick = (obj, keys) =>
	Object.fromEntries(
		keys.filter((key) => obj?.[key] !== undefined).map((key) => [key, obj[key]])
	);

// Apply the theme to every paragraph in a document tree (including list items and table cells).
// Formatting already in the text (eg. bold from **markdown**) takes precedence over the theme.
function applyTheme(value, theme) {
	if (Array.isArray(value)) return value.forEach((item) => applyTheme(item, theme));
	if (!value || typeof value !== "object") return;
	if (value.kind === "paragraph") {
		const heading = theme.headings[value.headingLevel] ?? {};
		Object.assign(
			value,
			{ ...pick(theme.body, PARAGRAPH_KEYS), ...pick(heading, PARAGRAPH_KEYS) },
			pick(value, PARAGRAPH_KEYS)
		);
		for (const run of value.runs ?? []) {
			Object.assign(
				run,
				{ ...pick(theme.body, RUN_KEYS), ...pick(heading, RUN_KEYS) },
				pick(run, RUN_KEYS)
			);
		}
	}
	for (const child of Object.values(value)) applyTheme(child, theme);
}

// Convert a markdown string to RTF, returned as bytes (Uint8Array)
export function markdownToRtf(markdown) {
	const { documentPackage } = readMarkdown(markdown);
	applyTheme(documentPackage, theme);
	return writeRtf(documentPackage);
}
