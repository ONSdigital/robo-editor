// APP STATE CONFIG + DEFAULTS
// Increase appVersion when a release changes the structure of stored state (see getAppState)
export const appVersion = 1;

// State kept across sessions (in IndexedDB, see src/lib/util/state/)
export const initialState = {
	template: null, // Pug template text
	dataRaw: null, // CSV text
	filter: null, // Code prefixes of the rows shown as places, eg. ["E06", "E07"]
	keys: null // Code and name columns, eg. { id: "areacd", label: "areanm" }
};
