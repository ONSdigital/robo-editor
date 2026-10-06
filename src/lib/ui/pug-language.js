import { StreamLanguage } from "@codemirror/language";
import { pug } from "@codemirror/legacy-modes/mode/pug";
import { javascript } from "@codemirror/legacy-modes/mode/javascript";
import { tags } from "@lezer/highlight";

// The legacy Pug mode returns all text after a tag (eg. `h1 Total #{place.total}`) as a single
// "string" token. This wrapper re-tokenises that text as plain text, highlighting interpolations:
//   #{js} and !{js}               → delimiters, with the JavaScript inside highlighted
//   #[tag.class(attrs) text]      → tag, classes and attributes, with interpolations in the text
// Everything else is passed through from the legacy Pug mode.

const INTERPOLATION_START = /^[#!]\{|^#\[/;
const NEXT_INTERPOLATION = /[#!]\{|#\[/;

function startState(indentUnit) {
	// frames: a stack of open interpolations (they can nest, eg. #[mark #{place.name}])
	return { pug: pug.startState(indentUnit), inText: false, frames: [], indentUnit };
}

function copyState(state) {
	return {
		pug: pug.copyState(state.pug),
		inText: state.inText,
		indentUnit: state.indentUnit,
		frames: state.frames.map((frame) => ({
			...frame,
			js: frame.js && javascript.copyState(frame.js)
		}))
	};
}

// Start an interpolation at the stream position, if there is one
function openInterpolation(stream, state) {
	const match = stream.match(INTERPOLATION_START);
	if (!match) return null;
	if (match[0] === "#[") state.frames.push({ type: "tag", phase: "name", depth: 0 });
	else state.frames.push({ type: "js", depth: 0, js: javascript.startState(state.indentUnit) });
	return "interpolation";
}

// Plain text, up to the next interpolation, the end of an inline tag or the end of the line
function textToken(stream, state, closing) {
	const opened = openInterpolation(stream, state);
	if (opened) return opened;
	const rest = stream.string.slice(stream.pos);
	const ends = [rest.search(NEXT_INTERPOLATION), closing ? rest.indexOf(closing) : -1]
		.filter((index) => index > 0)
		.sort((a, b) => a - b);
	if (ends.length) stream.pos += ends[0];
	else stream.skipToEnd();
	return "text";
}

// Bracketed JavaScript (#{...} or #[tag(attrs)]), ending at the matching closing bracket
function bracketedJs(stream, frame, open, close, onClose) {
	if (stream.eatSpace()) return null;
	const char = stream.peek();
	if (char === close && frame.depth === 0) {
		stream.next();
		return onClose();
	}
	if (char === open || char === close) {
		frame.depth += char === open ? 1 : -1;
		stream.next();
		return null;
	}
	return javascript.token(stream, frame.js) ?? null;
}

function frameToken(stream, state) {
	const frame = state.frames[state.frames.length - 1];
	if (frame.type === "js") {
		return bracketedJs(stream, frame, "{", "}", () => {
			state.frames.pop();
			return "interpolation";
		});
	}
	// Inline tag: #[name.class#id(attrs) text]
	if (frame.phase === "name") {
		if (stream.match(/^[\w-]+/)) return "tag";
		if (stream.match(/^\.[\w-]+/)) return "className";
		if (stream.match(/^#[\w-]+/)) return "builtin";
		if (stream.eat("(")) {
			Object.assign(frame, {
				phase: "attrs",
				depth: 0,
				js: javascript.startState(state.indentUnit)
			});
			return null;
		}
		frame.phase = "text";
	}
	if (frame.phase === "attrs") {
		return bracketedJs(stream, frame, "(", ")", () => {
			frame.phase = "text";
			return null;
		});
	}
	if (stream.eat("]")) {
		state.frames.pop();
		return "interpolation";
	}
	return textToken(stream, state, "]");
}

function token(stream, state) {
	if (stream.sol()) {
		state.inText = false;
		state.frames = [];
	}
	if (state.frames.length) return frameToken(stream, state);
	if (state.inText) return textToken(stream, state);

	const start = stream.pos;
	const style = pug.token(stream, state.pug);
	const text = stream.string.slice(start, stream.pos);
	// Text that runs to the end of the line (and isn't a quoted JS string): re-tokenise it
	if (style === "string" && stream.eol() && !/^["'`]/.test(text)) {
		stream.pos = start;
		state.inText = true;
		const pipe = stream.match(/^\| ?/);
		return pipe ? "operator" : textToken(stream, state);
	}
	return style;
}

export const pugLanguage = StreamLanguage.define({
	name: "pug",
	startState,
	copyState,
	token,
	indent: (state, textAfter, context) => pug.indent?.(state.pug, textAfter, context) ?? null,
	languageData: pug.languageData,
	tokenTable: { interpolation: tags.special(tags.brace), text: tags.content }
});
