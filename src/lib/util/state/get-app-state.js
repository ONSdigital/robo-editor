import { writable } from "svelte/store";
import { get, set } from "./db.js";
import snapshot from "./snapshot.svelte.js";
import { initialState } from "../../config.js";

function syncState(key, val) {
	console.debug(`Syncing state: ${key}`, val);
	set(key, val);
}

function syncedStore(key, initialValue = null) {
	const { set, update, subscribe } = writable(initialValue);

	return {
		subscribe,
		set: (val) => {
			set(val);
			syncState(key, snapshot(val));
		},
		update
	};
}

async function initSyncedStore(key, fallbackValue = null) {
	let value = await get(key);
	if (!value) {
		value = fallbackValue;
		set(key, value);
	}
	return syncedStore(key, value);
}

// Before v1, the editor saved its state to localStorage as "robo-store": { data_raw, template, filter, keys }
async function migrateLocalStorage() {
	try {
		const old = JSON.parse(localStorage.getItem("robo-store"));
		if (old) {
			const values = {
				template: old.template,
				dataRaw: old.data_raw,
				filter: old.filter,
				keys: old.keys
			};
			await Promise.all(Object.entries(values).map(([key, val]) => set(key, val ?? null)));
		}
		localStorage.removeItem("robo-store");
	} catch (err) {
		console.warn("Could not migrate state from localStorage", err);
	}
}

export default async function getAppState(storedAppVersion = null) {
	// Stored state is kept across app versions. If a release changes the structure of stored state
	// in a way that would break or corrupt it, add a migration for that specific version here, eg.
	// if (storedAppVersion && storedAppVersion < 2) { /* amend or clear affected keys */ }
	if (!storedAppVersion) await migrateLocalStorage();
	const keys = Object.keys(initialState);
	const stores = await Promise.all(keys.map((key) => initSyncedStore(key, initialState[key])));
	const appState = Object.fromEntries(keys.map((key, i) => [key, stores[i]]));

	return appState;
}
