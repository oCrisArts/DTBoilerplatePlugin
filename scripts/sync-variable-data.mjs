import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourceDir = resolve(root, "..", "DTBoilerplate LP", "public", "data");
const targetDir = resolve(root, "src", "data");
const files = ["colors.json", "typography.json", "layout.json"];

if (!existsSync(targetDir)) {
  mkdirSync(targetDir, { recursive: true });
}

for (const file of files) {
  copyFileSync(resolve(sourceDir, file), resolve(targetDir, file));
}

console.log(`Synced ${files.length} variable data files.`);
