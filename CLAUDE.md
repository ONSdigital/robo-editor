# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

robo-editor is a browser-based live editor for robo-journalism templates: you write a [Pug](https://pugjs.org) template on the left, load a CSV, pick an area, and see the rendered output on the right. It is deployed to GitHub Pages at https://onsdigital.github.io/robo-editor/.

It is a SvelteKit 2 app (Svelte 5, using runes), built as a static site with `@sveltejs/adapter-static`, following the setup of [sveltekit-starter](https://github.com/ONSdigital/sveltekit-starter). There are no tests, so check changes by running the app in a browser.

## Commands

```bash
npm run dev            # dev server at localhost:5173
npm run build          # static build to build/ (relative URLs)
npm run build:preview  # build with base path /robo-editor and a 404.html fallback (not prerendered)
npm run preview        # serve the built app
npm run lint           # prettier --check (with prettier-plugin-svelte)
npm run format         # prettier --write
```

You need Node 20.19+ or 22.12+ (for Vite 7).

Deployment is by GitHub Action (`.github/workflows/deploy.yml`, based on robo-embed's, without its data step and using `npm run build` rather than `build:preview`, because this is a single-path app). Every push to `main` runs `npm run build` and publishes `build/` to the `gh-pages` branch, which GitHub Pages serves. Pull requests to `main` only run the build.

Formatting (`.prettierrc`) matches robo-utils: tabs (width 4), print width 100, no trailing commas, plus `prettier-plugin-svelte` for `.svelte` files. VS Code formats on save (`.vscode/settings.json`).

**Dependencies and `npm audit`:**

- The RTF export's packages are pinned to exactly `rtf-codec` `4.0.5`, `markdown-codec` `6.4.2`, `document-schema.js` `7.3.0` and `archive-codec` `1.7.0` (a direct dependency only so that this version is used). Later versions, including the latest at the time of pinning, require exactly `zod` 4.4.3, which has a high-severity advisory (fixed in 4.6.6). Compared with the newer versions on sample documents, the only change in the RTF output was that table header rows aren't flagged with `\trhdr`. To unpin, first check with `npm view rtf-codec dependencies.zod` that a newer version allows a fixed `zod`, and test **Save output** as RTF.
- The remaining 6 low-severity advisories (`cookie`, `deepmerge`, and the `@sveltejs/*` packages that depend on them or on SvelteKit's own advisories) are accepted, as in sveltekit-starter. Fixing them needs SvelteKit 3 and Vite 8.
- Don't add npm `overrides` to silence advisories.

## Architecture

**Build setup** (copied from sveltekit-starter):

- `src/routes/+layout.js` turns off server-side rendering (`ssr = false`), because the editor only works in the browser (CodeMirror, Pug's Node shims, IndexedDB). In `npm run build` the page is still prerendered as an empty shell, which is what lets that build use relative URLs and work at any path, including the deployed site at https://onsdigital.github.io/robo-editor/. `npm run build:preview` has no `index.html`, only a `404.html` fallback, so its home page would return HTTP status 404.
- Base paths are set in `src/app.config.js` and used by `svelte.config.js`. Use `asset()` from `$app/paths` for files in `static/` (eg. `asset("/data/intro.pug")`), never root-absolute URLs.
- `static/.nojekyll` stops GitHub Pages ignoring the `_app/` folder.

**All state lives in `src/lib/App.svelte`.** The `src/lib/ui/` components only display it. `src/routes/+page.svelte` just renders `App`. Large or non-plain data (`data`, `lookup`, `places`, `output`, the CSV text) is `$state.raw`, so Svelte doesn't wrap it in deep reactive proxies before it's passed to Pug and robo-utils. `keys` and `filter` are deep `$state`, because the filter modal binds to them. Use `$state.snapshot()` before logging or storing them (the synced stores already do this). The third-party `svelte-split-pane` and `@onsvisual/svelte-charts` components still use the old syntax; `HSplitPane`'s named slots are filled with `{#snippet left()}` and `{#snippet right()}`.

- **Loading data:** `makeData()` parses the CSV with robo-utils' `csvParse`. It finds the code and name columns with `getColKeys()` in `src/lib/utils.js`, which wraps robo-utils' `getCodeKey`/`getNameKey` so the editor's `lookup` matches `MagicArray.get()` and `getName()` in templates. It then builds:
    - `data`: a robo-utils `MagicArray` of every row;
    - `lookup`: rows keyed by both code and name;
    - `places`: rows whose code starts with one of the `filter` prefixes (default E06, E07, E08, E09, W06, S12, N09), sorted by name.
- **Rendering:** a debounced (500ms) `render()` calls robo-utils' `renderJSON(template, place, places, lookup, pug)` whenever the template or selected place changes. `Output.svelte` → `Section.svelte` display each section, its props and content. Sections with `type` "Chart" and a `chartType` prop are drawn with `@onsvisual/svelte-charts`. `notes` in the output are not displayed. If the render returns an `error`, `Output.svelte` shows `PugError.svelte`: a "PUG error" heading, a one-line summary (the message, plus the line and column parsed from Pug's error), and a `<details>` expander with the full error, including Pug's code frame, in a non-wrapping monospace block.
- **Validate** renders the template for every place (and no place), stopping after 5 failures. **Save output** renders every place into a zip of JSON, Markdown (`node-html-markdown`) or RTF files. For Markdown and RTF, each place's output is rendered off-screen with Svelte's `mount()`, read back as HTML, converted to markdown with `node-html-markdown`, then `unmount()`ed. RTF is made from that same markdown by `src/lib/rtf.js` (`markdown-codec` reads it into a document tree, `rtf-codec` writes RTF). So RTF keeps headings, bold, italic, links, lists and tables, but not the preview's colours or `<mark>` highlights. Its fonts, sizes, colours and spacing come from the `theme` object in `src/lib/rtf.js`, which is applied to every paragraph and text run, because rtf-codec ignores style definitions and always uses Times New Roman as the document default. Colours there must use `rgbHexToColor()` (channels from 0 to 1). Chrome slows timers in background tabs, so a large save is much slower if the tab isn't visible.
- **Persistence:** state is kept across sessions in IndexedDB, using [idb-keyval](https://github.com/jakearchibald/idb-keyval) with a database called `robo-editor-db` and an object store called `store` (`src/lib/util/state/db.js`). This follows the pattern used in BaCAP: `getAppState()` (`src/lib/util/state/get-app-state.js`) returns a synced Svelte store for each key in `initialState` (`src/lib/config.js`: `template`, `dataRaw`, `filter`, `keys`), and calling `.set()` on one also writes it to the database. `App.svelte` awaits `getAppState()` in `onMount`, then saves the template after each render if it changed, and the CSV, column keys and filter (`saveData()`) when they change. Closing (the intro page) clears the saved CSV. `appVersion` in `src/lib/config.js` is stored too: increase it if stored state changes structure, and add a migration in `getAppState()`. The first time a browser runs this version, `getAppState()` moves the old `localStorage` `robo-store` value into IndexedDB. URL parameters `?csv=<url>&pug=<url>` load files on startup. Only `pug` skips the saved state: with `csv` alone, the saved template and CSV are still restored.

**Pug is bundled from npm** (`pug`, pinned to `3.0.4`, imported via `src/lib/pug/index.js`). Pug is written for Node, so `vite.config.js` aliases the Node modules it uses: `path` → `path-browserify`, `assert` → the `assert` npm package (the trailing slash in `"assert/"` picks the package rather than Node's built-in), and `fs` and `resolve` → stubs in `src/lib/pug/stubs/` (they're only used for `include`/`extends` from disk and for npm filter packages, neither of which works in the browser). `src/lib/pug/process.js` sets a global `process` from the `process` package, and must be imported before Pug because Pug's dependencies use it as they load. Don't use `vite-plugin-node-polyfills` instead: it pulls in `crypto-browserify` and `elliptic`, whose advisories have no fix. The app loads nothing from CDNs.

**The code editor is [CodeMirror 6](https://codemirror.net)** (`src/lib/ui/Editor.svelte`), with Pug highlighting from `src/lib/ui/pug-language.js` and a monokai-style theme in `src/lib/ui/monokai.js`. `pug-language.js` wraps the legacy Pug mode from `@codemirror/legacy-modes`, which returns all text after a tag as one plain string. It re-tokenises that text so that `#{…}`/`!{…}` interpolations get coloured delimiters and highlighted JavaScript, and `#[tag(attrs) text]` gets its tag and attributes highlighted (these can nest). `monokai.js` also styles the find/replace panel to look like the Svelte playground's; its selectors start with `.cm-panel.cm-search` so they override CodeMirror's own panel styles. The component has a bindable `content` and a `setContent()` method (which replaces the document, eg. when a template is loaded). Setting `content` from outside doesn't update the editor, so use `setContent()`. Tab indents (Escape then Tab moves focus out), with 4-space indentation. CodeMirror breaks if two copies of `@codemirror/state` or `@codemirror/view` are installed, so keep the `@codemirror/*` packages on compatible versions (`npm ls @codemirror/state` should show one copy).

**Demo templates** are in `static/data/`:

| Template             | CSV           | Notes                                                                                                                                                                                                                  |
| -------------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `intro.pug`          | none          | Shown on first load and after "close". Renders with `place`, `places` and `lookup` all `null`. Its buttons call `window.embedDemo()`, `window.scrollyDemo()` and `window.showHelp()`, set in `App.svelte`'s `onMount`. |
| `template_embed.pug` | `data_v2.csv` | Used by [robo-embed](https://github.com/ONSdigital/robo-embed).                                                                                                                                                        |
| `template.pug`       | `data.csv`    | Scrollytelling demo, used by [robo-scrolly](https://github.com/ONSdigital/robo-scrolly).                                                                                                                               |

**The help panel (`src/lib/Help.svelte`) is a cheat sheet** for Pug and robo-utils, with links to their documentation. Each section of `src/lib/help.js` is a tab (accessible ARIA tabs: arrow keys, Home and End move between them; the last tab is remembered while the editor is open). Its examples are data in `src/lib/help.js`. When the panel opens, each example is rendered with `renderJSON` against the demo data (`static/data/data_v2.csv`, using Hartlepool), so the outputs always match the current Pug and robo-utils; an example with `json: true` shows the JSON output rather than the HTML. Code is highlighted by `CodeBlock.svelte` using `highlightPug()` (`src/lib/ui/highlight-pug.js`), which reuses the editor's Pug tokenizer and theme. When adding an example, check it renders without an error (the panel shows any error in red).

## robo-utils

Templates, parsing and rendering all come from [`@onsvisual/robo-utils`](https://github.com/ONSdigital/robo-utils) (a devDependency, currently `^0.6.1`). If robo-utils is checked out alongside this repo (`../robo-utils`), its `docs/api.md` is the API reference, and its changelog lists changes that affect templates and the editor:

@../robo-utils/CHANGELOG.md
