// vite.config.js
import { sveltekit } from "@sveltejs/kit/vite";
import { fileURLToPath } from "url";

const stub = (name) => fileURLToPath(new URL(`./src/lib/pug/stubs/${name}.cjs`, import.meta.url));

/** @type {import('vite').UserConfig} */
const config = {
	plugins: [sveltekit()],
	// Browser replacements for the Node modules that Pug uses (see src/lib/pug/)
	resolve: {
		alias: {
			path: "path-browserify",
			assert: "assert/", // the trailing slash selects the npm package, not Node's built-in
			fs: stub("fs"),
			resolve: stub("resolve")
		}
	},
	//removes console.logs in production
	esbuild: {
		drop: ["console", "debugger"]
	},
	ssr: {
		noExternal: ["layercake"]
	}
};

export default config;
