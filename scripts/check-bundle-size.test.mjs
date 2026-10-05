import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, copyFileSync, writeFileSync, truncateSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

test('bundle guard accepts 10 MB and fails above it or when HTML is missing',()=>{
  const root=mkdtempSync(join(tmpdir(),'dt-bundle-test-'));
  try {
    mkdirSync(join(root,'scripts'));mkdirSync(join(root,'dist'));
    const script=join(root,'scripts/check-bundle-size.mjs');
    copyFileSync(new URL('./check-bundle-size.mjs',import.meta.url),script);
    const run=()=>spawnSync(process.execPath,[script],{encoding:'utf8'});
    assert.notEqual(run().status,0);
    const html=join(root,'dist/index.html');writeFileSync(html,'');
    truncateSync(html,10_000_000);assert.equal(run().status,0);
    truncateSync(html,10_000_001);const result=run();assert.notEqual(result.status,0);assert.match(result.stderr,/exceeds the 10 MB/);
  } finally { rmSync(root,{recursive:true,force:true}); }
});
