import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { build } from 'esbuild';
const bundled=await build({entryPoints:['src/data/icon-loader.ts'],bundle:true,write:false,format:'esm',platform:'node'});
let instance=0;
const fresh=()=>import('data:text/javascript;base64,'+Buffer.from(bundled.outputFiles[0].text+'\n// '+instance++).toString('base64'));
const canonical=new URL('../../DTBoilerplate LP/public/data/icons/',import.meta.url);
const read=path=>JSON.parse(readFileSync(new URL(path,canonical),'utf8'));

test('loads only catalog initially, then only selected libraries; deduplicates and caches session requests',async t=>{
  const calls=[];
  t.mock.method(globalThis,'fetch',async url=>{calls.push(url);return {ok:true,json:async()=>read(url.split('/').at(-1))};});
  const loader=await fresh();
  assert.equal(calls.length,0);
  const catalog=await loader.loadIconCatalog();
  await loader.loadIconCatalog();
  assert.deepEqual(calls,['https://dt-boilerplate-lp.vercel.app/data/icons/catalog.json']);
  const [first,second]=await Promise.all([loader.loadIconLibrary(catalog[0].id),loader.loadIconLibrary(catalog[0].id)]);
  assert.equal(first,second);
  assert.ok(first.icons.length>0);
  assert.equal(await loader.loadIconLibrary(catalog[0].id),first);
  assert.equal(calls.length,2);
  await loader.loadIconLibrary(catalog[1].id);
  assert.equal(calls.length,3);
});

test('network failures can be retried for catalog and libraries',async t=>{
  let failing=true;
  t.mock.method(globalThis,'fetch',async url=>failing?{ok:false,status:503}:{ok:true,json:async()=>read(url.split('/').at(-1))});
  const loader=await fresh();
  await assert.rejects(loader.loadIconCatalog(),/503/);
  failing=false;const catalog=await loader.loadIconCatalog();
  failing=true;await assert.rejects(loader.loadIconLibrary(catalog[0].id),/503/);
  failing=false;assert.ok((await loader.loadIconLibrary(catalog[0].id)).icons.length);
});

test('rejects unsafe catalog paths, unknown libraries, mismatched identities and unsafe SVG',async t=>{
  let catalog=read('catalog.json');
  let library=read(catalog.libraries[0].path);
  t.mock.method(globalThis,'fetch',async url=>({ok:true,json:async()=>url.endsWith('catalog.json')?catalog:library}));
  const loader=await fresh();
  catalog={...catalog,libraries:[{...catalog.libraries[0],path:'../outside.json'}]};
  await assert.rejects(loader.loadIconCatalog(),/Invalid icon catalog/);
  catalog=read('catalog.json');
  await assert.rejects(loader.loadIconLibrary('unknown'),/Unknown icon library/);
  library={...library,version:'wrong'};
  await assert.rejects(loader.loadIconLibrary(catalog.libraries[0].id),/identity mismatch/);
  library=read(catalog.libraries[0].path);
  library.icons[0].svg='<svg onload="bad()"></svg>';
  await assert.rejects(loader.loadIconLibrary(catalog.libraries[0].id),/unsafe icon SVG/);
});
