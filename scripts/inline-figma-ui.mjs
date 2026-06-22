import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const htmlPath = join(dist, "index.html");

let html = readFileSync(htmlPath, "utf8");

html = html.replace(
  /<link rel="stylesheet" crossorigin href="\.\/([^"]+)">/,
  (_, href) => {
    const css = readFileSync(join(dist, href), "utf8");
    return `<style>${css}</style>`;
  }
);

html = html.replace(
  /<script type="module" crossorigin src="\.\/([^"]+)"><\/script>/,
  (_, src) => {
    const js = readFileSync(join(dist, src), "utf8");
    return `<script type="module">${js}</script>`;
  }
);

writeFileSync(htmlPath, html);
