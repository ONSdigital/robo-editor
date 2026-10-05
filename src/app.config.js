// APP CONFIG

// Base paths
// Each is either a path (eg. "/robo-editor") or null.
// - A path builds the app for that directory only, with absolute URLs (paths.relative = false).
// - null builds the app with no base path and relative URLs (paths.relative = true), so it can be
//   deployed to any path or sub-path. Relative URLs only work for prerendered pages, which the
//   production build always is.
// base_preview should be a path, because the preview build is not prerendered: it relies on a
// 404.html fallback page, and SvelteKit always gives fallback pages absolute URLs.
export const base_prod = null; // Any path, eg. https://onsvisual.github.io/robo-editor/
export const base_preview = "/robo-editor"; // Directory on datavisweb preview server or Github Pages
