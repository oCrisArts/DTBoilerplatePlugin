import type { Catalog, LoadedPreset, Module, Preset } from './preset-contract/types';
import { validateCatalog, validatePreset, validateModules } from './preset-contract/validate.mjs';

// Bundle the synchronized catalog for offline use inside Figma.
const files = import.meta.glob('./presets/**/*.json', { eager: true, import: 'default' });
function read<T>(path: string): T {
  const value = files[`./presets/${path}`];
  if (!value) throw new Error(`Missing bundled preset file: ${path}`);
  return value as T;
}
export const catalog: Catalog = validateCatalog(read<Catalog>('catalog.json'));
export function loadPreset(id = catalog.defaultPreset): LoadedPreset {
  const entry = catalog.presets.find(p => p.id === id);
  if (!entry) throw new Error(`Unknown preset: ${id}`);
  const preset: Preset = validatePreset(read<Preset>(entry.path), id);
  const directory = entry.path.slice(0, entry.path.lastIndexOf('/') + 1);
  const modules = preset.modules.map(m => read<Module>(directory + m.path));
  return { preset, modules: validateModules(preset, modules) };
}
