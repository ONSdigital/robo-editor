# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

robo-editor is a browser-based live editor for robo-journalism templates: you write a [Pug](https://pugjs.org) template on the left, load a CSV, pick an area, and see the rendered output on the right. It is deployed to GitHub Pages at https://onsvisual.github.io/robo-editor/.

It is a SvelteKit 2 app (Svelte 5, still using legacy, non-runes syntax), built as a static site with `@sveltejs/adapter-static`, following the setup of [sveltekit-starter](https://github.com/ONSvisual/sveltekit-starter). There are no tests, so check changes by running the app in a browser.

## Commands

```bash
npm run dev            # dev server at localhost:5173
npm run build          # static build to build/ (relative URLs), then scripts/js-fix.js
npm run build:preview  # build with base path /robo-editor and a 404.html fallback (not prerendered)
npm run preview        # serve the built app
npm run deploy         # publish build/ to the gh-pages branch (run npm run build first)
npm run lint           # prettier --check (with prettier-plugin-svelte)
npm run format         # prettier --write
```

You need Node 20.19 or later (for Vite 7).

**Dependencies and `npm audit`:**

- `gh-pages` is pinned to exactly `6.1.1`. Versions 6.2.0 and later depend on `braces` (through globby, fast-glob and micromatch), which has a high-severity advisory with no fixed version. Don't change the pin to `^6.1.1`, which would install 6.3.0.
- The 3 low-severity `cookie` advisories come from SvelteKit 2 and are accepted, as in sveltekit-starter. They are only fixed in SvelteKit 3.
- Don't add npm `overrides` to silence advisories. Formatting (`.prettierrc`) matches robo-utils: tabs (width 4), print width 100, no trailing commas, plus `prettier-plugin-svelte` for `.svelte` files. VS Code formats on save (`.vscode/settings.json`).

## Architecture

**Build setup** (copied from sveltekit-starter):

- `src/routes/+layout.js` turns off server-side rendering (`ssr = false`), because the editor only works in the browser (Ace, Pug from a CDN, `localStorage`). The page is still prerendered as an empty shell, which is what lets the production build use relative URLs and work at any path, including https://onsvisual.github.io/robo-editor/.
- Base paths are set in `src/app.config.js` and used by `svelte.config.js`. Use `asset()` from `$app/paths` for files in `static/` (eg. `asset("/data/intro.pug")`), never root-absolute URLs.
- `vite.config.js` removes `console` calls from builds, so `console.log` only appears in `npm run dev`.
- `static/.nojekyll` stops GitHub Pages ignoring the `_app/` folder.

**All state lives in `src/lib/App.svelte`.** The `src/lib/ui/` components only display it. `src/routes/+page.svelte` just renders `App`.

- **Loading data:** `makeData()` parses the CSV with robo-utils' `csvParse`. It finds the code and name columns with `getColKeys()` in `src/lib/utils.js`, which wraps robo-utils' `getCodeKey`/`getNameKey` so the editor's `lookup` matches `MagicArray.get()` and `getName()` in templates. It then builds:
    - `data`: a robo-utils `MagicArray` of every row;
    - `lookup`: rows keyed by both code and name;
    - `places`: rows whose code starts with one of the `filter` prefixes (default E06, E07, E08, E09, W06, S12, N09), sorted by name.
- **Rendering:** a debounced (500ms) `render()` calls robo-utils' `renderJSON(template, place, places, lookup, pug)` whenever the template or selected place changes. `Output.svelte` → `Section.svelte` display each section, its props and content. Sections with `type` "Chart" and a `chartType` prop are drawn with `@onsvisual/svelte-charts`. `notes` in the output are not displayed.
- **Validate** renders the template for every place (and no place), stopping after 5 failures. **Save output** renders every place into a zip of JSON, Markdown (`node-html-markdown`) or RTF files. For Markdown and RTF, each place's output is rendered off-screen with Svelte's `mount()`, read back as HTML, then `unmount()`ed. Chrome slows timers in background tabs, so a large save is much slower if the tab isn't visible.
- **Persistence:** the CSV text, template, filter and column keys are saved to `localStorage` under `robo-store` on every render. URL parameters `?csv=<url>&pug=<url>` load files on startup.

**Libraries loaded at runtime from CDNs, not npm:** Pug (`https://pugjs.org/js/pug.js`, via `window.require("pug")`), the Ace editor (cdnjs, `src/ui/Editor.svelte`), and html-to-rtf (unpkg). So the Pug version used is whatever pugjs.org serves.

**Demo templates** are in `static/data/`:

| Template             | CSV           | Notes                                                                                                                                                                                             |
| -------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `intro.pug`          | none          | Shown on first load and after "close". Renders with `place`, `places` and `lookup` all `null`. Its buttons call `window.embedDemo()` and `window.scrollyDemo()`, set in `App.svelte`'s `onMount`. |
| `template_embed.pug` | `data_v2.csv` | Used by [robo-embed](https://github.com/ONSvisual/robo-embed).                                                                                                                                    |
| `template.pug`       | `data.csv`    | Scrollytelling demo, used by [robo-scrolly](https://github.com/ONSvisual/robo-scrolly).                                                                                                           |
| `template_nlg.pug`   | `data.csv`    | Fails on every render: it relies on RosaeNLG mixins (`pug_mixins.value`) that are no longer available.                                                                                            |

**`src/lib/Help.svelte`** is the in-app help for template authors, with examples of robo-utils functions. Keep it consistent with the robo-utils API.

## robo-utils

Templates, parsing and rendering all come from [`@onsvisual/robo-utils`](https://github.com/ONSvisual/robo-utils) (a devDependency, currently `^0.6.1`). If robo-utils is checked out alongside this repo (`../robo-utils`), its `docs/api.md` is the API reference, and its changelog lists changes that affect templates and the editor:

@../robo-utils/CHANGELOG.md
