// Pug's dependencies use Node's `process` as soon as they load, so it must be set before Pug is imported
import process from "process/browser.js";

globalThis.process ??= process;
