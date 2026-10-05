# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

robo-editor is a browser-based live editor for robo-journalism templates: you write a [Pug](https://pugjs.org) template on the left, load a CSV, pick an area, and see the rendered output on the right. It is deployed to GitHub Pages at https://onsvisual.github.io/robo-editor/.

It is a Svelte 4 app bundled with Rollup (not SvelteKit: the `.svelte-kit` folder and empty `src/lib` and `src/routes` folders are untracked leftovers). There are no tests.

## Commands

```bash
npm run dev      # rollup in watch mode, serving public/ with live reload
npm run build    # production bundle to public/build/
npm run start    # serve public/ (sirv)
npm run deploy   # publish public/ to the gh-pages branch
npm run lint     # prettier --check (with prettier-plugin-svelte)
npm run format   # prettier --write
```

Formatting (`.prettierrc`) matches robo-utils: tabs (width 4), print width 100, no trailing commas, plus `prettier-plugin-svelte` for `.svelte` files. VS Code formats on save (`.vscode/settings.json`).

## Architecture

**All state lives in `src/App.svelte`.** The `src/ui/` components only display it.

- **Loading data:** `makeData()` parses the CSV with robo-utils' `csvParse`. It finds the code and name columns with `getColKeys()` in `src/utils.js`, which wraps robo-utils' `getCodeKey`/`getNameKey` so the editor's `lookup` matches `MagicArray.get()` and `getName()` in templates. It then builds:
    - `data`: a robo-utils `MagicArray` of every row;
    - `lookup`: rows keyed by both code and name;
    - `places`: rows whose code starts with one of the `filter` prefixes (default E06, E07, E08, E09, W06, S12, N09), sorted by name.
- **Rendering:** a debounced (500ms) `render()` calls robo-utils' `renderJSON(template, place, places, lookup, pug)` whenever the template or selected place changes. `Output.svelte` → `Section.svelte` display each section, its props and content. Sections with `type` "Chart" and a `chartType` prop are drawn with `@onsvisual/svelte-charts`. `notes` in the output are not displayed.
- **Validate** renders the template for every place (and no place), stopping after 5 failures. **Save output** renders every place into a zip of JSON, Markdown (`node-html-markdown`) or RTF files.
- **Persistence:** the CSV text, template, filter and column keys are saved to `localStorage` under `robo-store` on every render. URL parameters `?csv=<url>&pug=<url>` load files on startup.

**Libraries loaded at runtime from CDNs, not npm:** Pug (`https://pugjs.org/js/pug.js`, via `window.require("pug")`), the Ace editor (cdnjs, `src/ui/Editor.svelte`), and html-to-rtf (unpkg). So the Pug version used is whatever pugjs.org serves.

**Demo templates** are in `public/data/`:

| Template             | CSV           | Notes                                                                                                                                                                                             |
| -------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `intro.pug`          | none          | Shown on first load and after "close". Renders with `place`, `places` and `lookup` all `null`. Its buttons call `window.embedDemo()` and `window.scrollyDemo()`, set in `App.svelte`'s `onMount`. |
| `template_embed.pug` | `data_v2.csv` | Used by [robo-embed](https://github.com/ONSvisual/robo-embed).                                                                                                                                    |
| `template.pug`       | `data.csv`    | Scrollytelling demo, used by [robo-scrolly](https://github.com/ONSvisual/robo-scrolly).                                                                                                           |
| `template_nlg.pug`   | `data.csv`    | Fails on every render: it relies on RosaeNLG mixins (`pug_mixins.value`) that are no longer available.                                                                                            |

**`src/Help.svelte`** is the in-app help for template authors, with examples of robo-utils functions. Keep it consistent with the robo-utils API.

## robo-utils

Templates, parsing and rendering all come from [`@onsvisual/robo-utils`](https://github.com/ONSvisual/robo-utils) (a devDependency, currently `^0.4.0`). If robo-utils is checked out alongside this repo (`../robo-utils`), its `docs/api.md` is the API reference, and its changelog lists changes that affect templates and the editor:

@../robo-utils/CHANGELOG.md
