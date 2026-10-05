import type { IconLibrary } from './preset-contract/types';
import { validateIconLibrary } from './preset-contract/validate.mjs';
const baseUrl = 'https://dt-boilerplate-lp.vercel.app/data/icons/';
export interface IconCatalogEntry { id: string; name: string; path: string; version: string }
let catalogRequest: Promise<IconCatalogEntry[]> | undefined;
const libraries = new Map<string, Promise<IconLibrary>>();

async function fetchJson(path: string) {
  const response = await fetch(baseUrl + path, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`Unable to load icons (HTTP ${response.status}).`);
  return response.json();
}

export function loadIconCatalog(): Promise<IconCatalogEntry[]> {
  return catalogRequest ??= fetchJson('catalog.json').then(catalog => {
    if (catalog?.schemaVersion !== 1 || !Array.isArray(catalog.libraries) || !catalog.libraries.length ||
      catalog.libraries.some(entry => !entry.id || !entry.name || !entry.version || !/^[a-z-]+\.json$/.test(entry.path)) ||
      new Set(catalog.libraries.map(entry => entry.id)).size !== catalog.libraries.length) {
      throw new Error('Invalid icon catalog.');
    }
    return catalog.libraries;
  }).catch(error => { catalogRequest = undefined; throw error; });
}

export function loadIconLibrary(id: string): Promise<IconLibrary> {
  let request = libraries.get(id);
  if (!request) {
    request = loadIconCatalog().then(async catalog => {
      const entry = catalog.find(item => item.id === id);
      if (!entry) throw new Error(`Unknown icon library: ${id}`);
      const library = validateIconLibrary(await fetchJson(entry.path)) as IconLibrary;
      if (library.id !== entry.id || library.version !== entry.version) throw new Error('Icon library identity mismatch.');
      return library;
    }).catch(error => { libraries.delete(id); throw error; });
    libraries.set(id, request);
  }
  return request;
}
