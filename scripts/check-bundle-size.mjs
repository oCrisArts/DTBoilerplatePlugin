import { statSync } from 'node:fs';

// Decimal MB keeps the publication safety margin conservative.
const limit = 10_000_000;
const file = new URL('../dist/index.html', import.meta.url);
const size = statSync(file).size;
console.log(`Inlined UI: ${size.toLocaleString('en-US')} bytes (${(size / 1_000_000).toFixed(3)} MB)`);
if (size > limit) {
  throw new Error(`dist/index.html exceeds the 10 MB bundle limit (${size} > ${limit} bytes).`);
}
