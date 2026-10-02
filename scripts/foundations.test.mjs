import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createServer } from 'vite';
import { build } from 'esbuild';
import vm from 'node:vm';
const server=await createServer({server:{middlewareMode:true,hmr:false},appType:'custom'});
let loader,values,iconography,libraries;
try{
  loader=await server.ssrLoadModule('/src/data/preset-loader.ts');values=await server.ssrLoadModule('/src/app/token-values.ts');iconography=await server.ssrLoadModule('/src/app/iconography.ts');libraries=(await server.ssrLoadModule('/src/data/icon-loader.ts')).iconLibraries;
}finally{await server.close();}
test('project scale edits retain each preset identity and proportions; library properties produce only configuration Variables',()=>{
  for(const entry of loader.catalog.presets){
    const source=loader.loadPreset(entry.id),module=source.modules.find(m=>m.module==='iconography');
    const edits=iconography.iconScaleEdits(module,module.configuration.scale.baseValue*1.5);
    for(const token of values.variablesOf(module).filter(v=>module.configuration.scale.steps.includes(v.id)))assert.equal(parseFloat(edits[token.id]),token.value*1.5);
    for(const library of libraries){
      const customized=iconography.configureIconography(values.customize(source,{[module.configuration.library]:library.id}),libraries,{});
      const icon=customized.modules.find(m=>m.module==='iconography'),vars=values.variablesOf(icon);
      assert.equal(vars.find(v=>v.id===icon.configuration.nativeSize).value,library.nativeSize);
      assert.equal(new Set(vars.map(v=>v.figmaName)).size,vars.length);assert.ok(!vars.some(v=>String(v.value).includes('<svg')));
      for(const name of Object.keys(library.properties||{}))assert.ok(vars.some(v=>v.name===name));
    }
  }
});
test('Material brand and plain are independent and role aliases follow their native reference',()=>{
  const source=loader.loadPreset('materialdesign'),type=source.modules.find(m=>m.module==='typography'),roles=type.configuration.fontRoles;
  const vars=values.customize(source,{[roles.primary.token]:'Inter',[roles.secondary.token]:'Sora'}).modules.flatMap(values.variablesOf);
  for(const v of vars.filter(v=>v.reference))assert.equal(v.value,vars.find(t=>t.id===v.reference).value);
});
test('canonical icon data and contracts match the offline plugin byte for byte',()=>{
  for(const directory of ['icons','preset-contract']){
    const canonical=directory==='icons'?'../../DTBoilerplate LP/public/data/icons/':'../../DTBoilerplate LP/src/data/preset-contract/';
    const target=new URL('../src/data/'+directory+'/',import.meta.url);
    for(const file of readdirSync(target))assert.deepEqual(readFileSync(new URL(file,target)),readFileSync(new URL(canonical+file,import.meta.url)),file);
  }
});
test('font protocol lists every face without loading and reports listing errors for retry',async()=>{
  const messages=[],loaded=[];const fonts=[{fontName:{family:'Custom Team Font',style:'Regular'}},{fontName:{family:'Roboto',style:'Bold'}}];
  const figma={showUI(){},ui:{postMessage:m=>messages.push(m)},listAvailableFontsAsync:async()=>fonts,loadFontAsync:async font=>loaded.push(font)};
  const bundle=await build({entryPoints:['src/plugin/code.ts'],bundle:true,write:false,format:'iife'});vm.runInNewContext(bundle.outputFiles[0].text,{figma,__html__:'',console});
  await figma.ui.onmessage({type:'list-fonts'});assert.deepEqual(JSON.parse(JSON.stringify(messages.at(-1).fonts)),fonts.map(f=>f.fontName));
  assert.equal(loaded.length,0);
  figma.listAvailableFontsAsync=async()=>{throw Error('Font list failed')};
  await figma.ui.onmessage({type:'list-fonts'});assert.match(messages.at(-1).error,/Font list failed/);
  figma.listAvailableFontsAsync=async()=>fonts;
  await figma.ui.onmessage({type:'list-fonts'});assert.equal(messages.at(-1).fonts.length,2);assert.equal(loaded.length,0);
});
test('icon insertion uses the configured size and rejects unsafe SVG or invalid dimensions',async()=>{
  const messages=[],nodes=[];
  const figma={showUI(){},ui:{postMessage:m=>messages.push(m)},viewport:{center:{x:100,y:100},scrollAndZoomIntoView(){}},currentPage:{appendChild(){}},createNodeFromSvg(svg){const node={svg,resize(width,height){this.width=width;this.height=height;}};nodes.push(node);return node;}};
  const bundle=await build({entryPoints:['src/plugin/code.ts'],bundle:true,write:false,format:'iife'});vm.runInNewContext(bundle.outputFiles[0].text,{figma,__html__:'',console});
  await figma.ui.onmessage({type:'insert-icon',name:'Lucide / heart',svg:'<svg viewBox="0 0 24 24"><path d="M0 0"/></svg>',size:40});
  assert.equal(nodes[0].width,40);assert.equal(nodes[0].height,40);assert.equal(nodes[0].x,80);assert.equal(figma.currentPage.selection[0],nodes[0]);assert.equal(messages.at(-1).type,'icon-inserted');
  for(const change of [{size:-1},{size:Infinity},{svg:'<svg onload="evil()"></svg>'}]){
    await figma.ui.onmessage({type:'insert-icon',name:'invalid',svg:'<svg></svg>',size:24,...change});assert.equal(messages.at(-1).type,'icon-insertion-failed');
  }
  assert.equal(nodes.length,1);
});
