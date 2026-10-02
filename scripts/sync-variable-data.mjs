import { copyFileSync, mkdirSync, readdirSync, readFileSync, unlinkSync, rmdirSync } from 'node:fs';
import { dirname, resolve, relative, join, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// Override when the canonical LP checkout lives outside the sibling directory.
const sourceDir = resolve(process.env.PRESET_SOURCE_DIR || resolve(root, '..', 'DTBoilerplate LP', 'public', 'data', 'presets'));
const targetDir = resolve(root, 'src', 'data', 'presets');
if (sourceDir === targetDir || sourceDir.startsWith(targetDir + sep) || targetDir.startsWith(sourceDir + sep)) throw new Error('Source and target must be separate directories.');
const contractDir = resolve(sourceDir, '..', '..', '..', 'src', 'data', 'preset-contract');
const { validateCatalog, validatePreset, validateModules, validateIconLibrary } = await import(pathToFileURL(join(contractDir, 'validate.mjs')).href);
const iconSource=resolve(sourceDir,'..','icons');
const iconTarget=resolve(root,'src/data/icons');
const iconCatalog=JSON.parse(readFileSync(join(iconSource,'catalog.json'),'utf8'));
if(iconCatalog.schemaVersion!==1||!iconCatalog.version||new Set(iconCatalog.libraries.map(l=>l.id)).size!==iconCatalog.libraries.length)throw Error('Invalid icon catalog');
for(const entry of iconCatalog.libraries){
  if(!/^[a-z-]+\.json$/.test(entry.path))throw Error('Unsafe icon path');
  const bytes=readFileSync(join(iconSource,entry.path));
  if(createHash('sha256').update(bytes).digest('hex')!==entry.sha256)throw Error(`Icon integrity mismatch: ${entry.id}`);
  const library=validateIconLibrary(JSON.parse(bytes));
  if(library.id!==entry.id||library.version!==entry.version)throw Error('Icon catalog identity mismatch');
}
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
for(const file of files(iconSource)){
  const destination=resolve(iconTarget,file);mkdirSync(dirname(destination),{recursive:true});copyFileSync(join(iconSource,file),destination);
}
for(const file of files(iconTarget)){
  if(files(iconSource).includes(file))continue;
  const destination=resolve(iconTarget,file);
  if(!destination.startsWith(iconTarget+sep))throw Error('Unsafe icon sync target');
  unlinkSync(destination);
}
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
console.log(`Synced ${catalog.presets.length} presets (${sourceFiles.length} files) and ${iconCatalog.libraries.length} icon libraries from the canonical LP dataset.`);
