import { get, set } from "./db.js";
import { appVersion } from "../../config.js";

export async function getStoredAppVersion() {
	const version = await get("appVersion");
	return version || null;
}

export async function setStoredAppVersion() {
	await set("appVersion", appVersion);
}
