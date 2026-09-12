import { copyFileSync, mkdirSync, readdirSync, readFileSync, unlinkSync, rmdirSync } from 'node:fs';
import { dirname, resolve, relative, join, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// Override when the canonical LP checkout lives outside the sibling directory.
const sourceDir = resolve(process.env.PRESET_SOURCE_DIR || resolve(root, '..', 'DTBoilerplate LP', 'public', 'data', 'presets'));
const targetDir = resolve(root, 'src', 'data', 'presets');
if (sourceDir === targetDir || sourceDir.startsWith(targetDir + sep) || targetDir.startsWith(sourceDir + sep)) throw new Error('Source and target must be separate directories.');
const contractDir = resolve(sourceDir, '..', '..', '..', 'src', 'data', 'preset-contract');
const { validateCatalog, validatePreset, validateModules } = await import(pathToFileURL(join(contractDir, 'validate.mjs')).href);
const read = file => JSON.parse(readFileSync(join(sourceDir, file), 'utf8'));
const catalog = validateCatalog(read('catalog.json'));
// Validate everything before changing the checked-in offline copy.
for (const entry of catalog.presets) {
  const preset = validatePreset(read(entry.path), entry.id);
  validateModules(preset, preset.modules.map(m => read(join(dirname(entry.path), m.path))));
}
function files(directory, prefix = '') {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    if (entry.isSymbolicLink()) throw new Error(`Symlinks are not supported: ${entry.name}`);
    const name = join(prefix, entry.name);
    return entry.isDirectory() ? files(join(directory, entry.name), name) : [name];
  });
}
const sourceFiles = files(sourceDir);
const contractFiles = files(contractDir);
for (const file of contractFiles) {
  const destination = resolve(root, 'src', 'data', 'preset-contract', file);
  mkdirSync(dirname(destination), { recursive: true });
  copyFileSync(join(contractDir, file), destination);
}
for (const file of sourceFiles) {
  const destination = join(targetDir, file);
  mkdirSync(dirname(destination), { recursive: true });
  copyFileSync(join(sourceDir, file), destination);
}
// Only remove stale generated files inside the verified target directory.
for (const file of files(targetDir)) {
  if (sourceFiles.includes(file)) continue;
  const destination = resolve(targetDir, file);
  if (relative(targetDir, destination).startsWith('..') || !destination.startsWith(targetDir + sep)) throw new Error('Unsafe sync target.');
  unlinkSync(destination);
}
function pruneEmpty(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const child = join(directory, entry.name);
    pruneEmpty(child);
    if (readdirSync(child).length === 0) rmdirSync(child);
  }
}
pruneEmpty(targetDir);
console.log(`Synced ${catalog.presets.length} presets (${sourceFiles.length} files) from the canonical LP dataset.`);
