import { EditorView } from "@codemirror/view";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";

// A monokai-style theme for CodeMirror, to match the colours of the Ace editor this replaced
const colors = {
	background: "#272822",
	foreground: "#f8f8f2",
	gutter: "#2f3129",
	gutterText: "#8f908a",
	border: "rgba(255, 255, 255, 0.14)",
	selection: "#49483e",
	activeLine: "#3e3d32",
	cursor: "#f8f8f0",
	comment: "#75715e",
	pink: "#f92672",
	green: "#a6e22e",
	yellow: "#e6db74",
	purple: "#ae81ff",
	orange: "#fd971f",
	blue: "#66d9ef"
};

const editorTheme = EditorView.theme(
	{
		"&": {
			color: colors.foreground,
			backgroundColor: colors.background,
			height: "100%",
			fontSize: "12px"
		},
		".cm-scroller": {
			fontFamily: "Monaco, Menlo, 'Ubuntu Mono', Consolas, 'Source Code Pro', monospace",
			lineHeight: "1.4"
		},
		".cm-content": { caretColor: colors.cursor },
		".cm-cursor, .cm-dropCursor": { borderLeftColor: colors.cursor },
		"&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection":
			{ backgroundColor: colors.selection },
		".cm-activeLine": { backgroundColor: colors.activeLine },
		".cm-gutters": {
			backgroundColor: colors.gutter,
			color: colors.gutterText,
			border: "none"
		},
		".cm-activeLineGutter": { backgroundColor: colors.activeLine },
		".cm-matchingBracket": { outline: `1px solid ${colors.gutterText}` },

		// Find/replace panel, styled like the Svelte playground's (in dark colours)
		".cm-panels": {
			backgroundColor: colors.gutter,
			color: colors.foreground,
			fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
			fontSize: "13px"
		},
		".cm-panels.cm-panels-bottom": { borderTop: `1px solid ${colors.border}` },
		".cm-panels.cm-panels-top": { borderBottom: `1px solid ${colors.border}` },
		".cm-panel.cm-search": {
			display: "flex",
			flexWrap: "wrap",
			alignItems: "center",
			gap: "5px",
			padding: "5px 42px 5px 5px",
			position: "relative"
		},
		// Like the playground, let the controls wrap instead of forcing replace onto a new line
		".cm-panel.cm-search br": { display: "none" },
		".cm-panel.cm-search .cm-textfield": {
			height: "32px",
			margin: 0,
			padding: "0 8px",
			fontSize: "13px",
			color: colors.foreground,
			backgroundColor: colors.background,
			border: `1px solid ${colors.border}`,
			borderRadius: "4px"
		},
		".cm-panel.cm-search .cm-textfield:focus": {
			outline: `2px solid ${colors.orange}`,
			outlineOffset: "-1px"
		},
		".cm-panel.cm-search .cm-textfield::placeholder": { color: colors.gutterText },
		".cm-panel.cm-search .cm-button": {
			height: "32px",
			margin: 0,
			padding: "0 8px",
			fontSize: "13px",
			color: colors.foreground,
			backgroundColor: "transparent",
			backgroundImage: "none",
			border: `1px solid ${colors.border}`,
			borderBottomWidth: "2px",
			borderRadius: "4px",
			cursor: "pointer"
		},
		".cm-panel.cm-search .cm-button:hover": { backgroundColor: colors.activeLine },
		".cm-panel.cm-search .cm-button:active": {
			backgroundImage: "none",
			borderBottomWidth: "1px"
		},
		".cm-panel.cm-search label": {
			display: "inline-flex",
			alignItems: "center",
			gap: "5px",
			margin: "0 0 0 5px",
			fontSize: "13px",
			color: colors.foreground
		},
		".cm-panel.cm-search input[type=checkbox]": { margin: 0, accentColor: colors.orange },
		".cm-panel.cm-search button[name=close]": {
			position: "absolute",
			top: "5px",
			right: "5px",
			width: "32px",
			height: "32px",
			padding: 0,
			fontSize: "18px",
			lineHeight: 1,
			color: colors.gutterText,
			backgroundColor: "transparent",
			border: `1px solid ${colors.border}`,
			borderBottomWidth: "2px",
			borderRadius: "4px",
			cursor: "pointer"
		},
		".cm-panel.cm-search button[name=close]:hover": {
			color: colors.foreground,
			backgroundColor: colors.activeLine
		},
		".cm-searchMatch": { backgroundColor: "rgba(230, 219, 116, 0.25)", outline: "none" },
		".cm-searchMatch.cm-searchMatch-selected": { backgroundColor: "rgba(253, 151, 31, 0.5)" },
		".cm-selectionMatch": { backgroundColor: "rgba(255, 255, 255, 0.1)" }
	},
	{ dark: true }
);

// Also used to highlight code in the help panel (see highlight-pug.js)
export const highlightStyle = HighlightStyle.define([
	{ tag: t.comment, color: colors.comment },
	{ tag: [t.keyword, t.tagName, t.operator], color: colors.pink },
	{
		tag: [t.attributeName, t.definition(t.variableName), t.function(t.variableName)],
		color: colors.green
	},
	{ tag: [t.string, t.special(t.string)], color: colors.yellow },
	{ tag: [t.number, t.bool, t.atom], color: colors.purple },
	{ tag: [t.variableName, t.propertyName], color: colors.foreground },
	{ tag: [t.typeName, t.className, t.meta, t.standard(t.variableName)], color: colors.blue },
	{ tag: t.special(t.variableName), color: colors.orange },
	// Pug interpolation delimiters: #{ } !{ } #[ ]
	{ tag: t.special(t.brace), color: colors.orange, whiteSpace: "nowrap" }
]);

export const monokai = [editorTheme, syntaxHighlighting(highlightStyle)];
