import { get as _get, set as _set, update as _update, del as _del, createStore } from "idb-keyval";

const store = createStore("robo-editor-db", "store");

export const get = (key) => _get(key, store);
export const set = (key, val) => _set(key, val, store);
export const update = (key, val) => _update(key, val, store);
export const del = (key) => _del(key, store);
