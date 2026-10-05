import * as env from "$env/static/public";

// The editor runs entirely in the browser (Ace, Pug, localStorage), so it isn't rendered on the
// server. The page is still prerendered as an empty shell, so the build works with relative paths.
export const ssr = false;
export const prerender = env?.PUBLIC_APP_ENV !== "preview";
export const trailingSlash = "always";
