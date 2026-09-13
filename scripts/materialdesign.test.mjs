import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createServer } from 'vite';
import { build } from 'esbuild';
import { runInNewContext } from 'node:vm';
import { validatePreset, validateModules } from '../src/data/preset-contract/validate.mjs';
import { supportedTokens, buildMaterialDesignPreset } from '../../DTBoilerplate LP/scripts/materialdesign-data.mjs';

const server = await createServer({ server:{middlewareMode:true}, appType:'custom' });
let loader, values;
try {
  loader = await server.ssrLoadModule('/src/data/preset-loader.ts');
  values = await server.ssrLoadModule('/src/app/token-values.ts');
} finally { await server.close(); }
const { variablesOf, customize, typeScaleEdits, parseColor } = values;
const source = loader.loadPreset('materialdesign');
const all = source.modules.flatMap(variablesOf);
const find = name => all.find(token => token.name === name);
const identity = tokens => tokens.map(({id,name,figmaName}) => ({id,name,figmaName}));

test('catalog, real loader, contract, canonical values and unique identities', () => {
  assert.deepEqual(loader.catalog.presets.map(p=>p.id), ['bootstrap','tailwindcss','materialdesign','bulma','starttoken']);
  assert.equal(source.preset.metadata.name, 'Material Design');
  assert.deepEqual(source.modules.map(m=>m.module), ['colors','typography','layout']);
  validatePreset(source.preset, 'materialdesign');
  validateModules(source.preset, source.modules);
  assert.deepEqual(JSON.parse(JSON.stringify(source)), buildMaterialDesignPreset());
  assert.equal(all.length, 123);
  for (const key of ['id','name','figmaName']) assert.equal(new Set(all.map(v=>v[key])).size, all.length);
  for (const token of all) {
    assert.ok(token.figmaName.endsWith(token.name));
    if (token.type === 'COLOR') assert.ok(parseColor(token.value), token.name);
    if (token.type === 'FLOAT') assert.ok(Number.isFinite(token.value), token.name);
  }
});

test('complete official supported lists, fifteen roles, native units and shape-only layout', () => {
  for (const namespace of ['md-sys-color','md-ref-typeface','md-sys-typescale','md-sys-shape']) {
    const actual = all.filter(v=>v.name.startsWith(`--${namespace}-`)).map(v=>v.name).sort();
    assert.deepEqual(actual, supportedTokens(namespace).map(n=>`--${namespace}-${n}`).sort());
  }
  for (const role of ['display','headline','title','body','label']) for (const size of ['large','medium','small']) {
    for (const property of ['font','size','line-height','weight']) assert.ok(find(`--md-sys-typescale-${role}-${size}-${property}`));
    for (const property of ['size','line-height']) assert.equal(find(`--md-sys-typescale-${role}-${size}-${property}`).unit,'rem');
  }
  assert.equal(find('--md-sys-color-primary').value,'#6750a4');
  assert.equal(find('--md-sys-typescale-display-large-size').value,3.5625);
  assert.deepEqual(source.modules[2].submodules.map(s=>s.label),['Shape']);
  assert.deepEqual(source.modules[2].submodules[0].variables.map(v=>v.value),[0,4,8,12,16,28,9999]);
  assert.ok(source.modules[2].submodules[0].variables.every(v=>v.unit==='px'));
  assert.deepEqual(source.preset.capabilities.layout,{grid:false,breakpoints:false,spacing:false,radius:true,tokens:false});
});

test('customization preserves source and identity, propagates fonts, respects explicit values and fifteen sizes', () => {
  const before = JSON.stringify(source);
  const brand = find('--md-ref-typeface-brand');
  const plain = find('--md-ref-typeface-plain');
  const roleFont = find('--md-sys-typescale-body-large-font');
  const sizes = typeScaleEdits(source.modules[1],20,1.5);
  assert.equal(Object.keys(sizes).length,15);
  assert.ok(Object.keys(sizes).every(id=>id.endsWith('-size')));
  const updated = customize(source,{...sizes,[brand.id]:'Inter',[all[0].id]:'#112233',[find('--md-sys-shape-corner-small').id]:'10px'});
  const tokens = updated.modules.flatMap(variablesOf);
  assert.equal(JSON.stringify(source),before);
  assert.deepEqual(identity(tokens),identity(all));
  assert.ok(tokens.filter(v=>v.name.endsWith('-font') || [brand.id,plain.id].includes(v.id)).every(v=>v.value==='Inter'));
  const explicit = customize(source,{[brand.id]:'Inter',[plain.id]:'Arial',[roleFont.id]:'Lato'}).modules.flatMap(variablesOf);
  assert.equal(explicit.find(v=>v.id===plain.id).value,'Arial');
  assert.equal(explicit.find(v=>v.id===roleFont.id).value,'Lato');
  validateModules(updated.preset,updated.modules);
});

test('real plugin generation creates and updates all variables and grouped documentation', async () => {
  const nodes=[], variables=[], collections=[], messages=[], errors=[];
  function node(type) {
    const data=new Map();
    const n={id:String(nodes.length+1),type,children:[],width:100,height:24,
      appendChild(child){child.parent?.children.splice(child.parent.children.indexOf(child),1); this.children.push(child); child.parent=this;},
      resize(width,height){this.width=width;this.height=height;},
      setPluginData(k,v){data.set(k,v);},getPluginData(k){return data.get(k)||'';},
      setBoundVariable(){},remove(){this.parent?.children.splice(this.parent.children.indexOf(this),1);}};
    nodes.push(n);return n;
  }
  const figma={root:node('DOCUMENT'),ui:{postMessage:m=>messages.push(m)},showUI(){},notify(){},
    clientStorage:{getAsync:async k=>k==='dt_boilerplate_premium_status',setAsync:async()=>{}},
    loadFontAsync:async()=>{},loadAllPagesAsync:async()=>{},setCurrentPageAsync:async p=>{figma.currentPage=p;},
    viewport:{scrollAndZoomIntoView(){}},createFrame:()=>node('FRAME'),createText:()=>node('TEXT'),
    createRectangle:()=>node('RECTANGLE'),createEllipse:()=>node('ELLIPSE'),
    createPage:()=>{const p=node('PAGE');figma.root.appendChild(p);return p;},
    variables:{getLocalVariablesAsync:async()=>variables,getLocalVariableCollectionsAsync:async()=>collections,
      createVariableCollection(name){const c={id:'collection',name,modes:[{modeId:'light',name:'Mode 1'}]};collections.push(c);return c;},
      createVariable(name,c,type){const v={id:name,name,variableCollectionId:c.id,type,setValueForMode(mode,value){this.value=value;}};variables.push(v);return v;},
      setBoundVariableForPaint:paint=>paint}};
  const output=await build({entryPoints:['src/plugin/code.ts'],bundle:true,format:'iife',write:false});
  runInNewContext(output.outputFiles[0].text,{figma,__html__:'',console:{log(){},error:(...args)=>errors.push(args)}});
  const tokens=customize(source,{[find('--md-ref-typeface-brand').id]:'Inter'}).modules.flatMap(variablesOf);
  for (let pass=0;pass<2;pass++) {
    await figma.ui.onmessage({type:'generate-variables',tokens,presetName:'Material Design'});
    const result=messages.at(-1);
    assert.equal(result.type,'variables-generated',JSON.stringify(errors));
    assert.equal(result.documentationGenerated,true,JSON.stringify(errors));
    assert.equal(result.count,123);
    assert.equal(pass===0?result.created:result.updated,123);
    assert.equal(variables.length,123);
    const root=figma.currentPage.children[0];
    assert.deepEqual(Array.from(root.children,n=>n.name),['Colors','Typography','Layout']);
    const text=nodes.filter(n=>n.type==='TEXT').map(n=>n.characters);
    for (const token of tokens) {assert.ok(text.includes(token.name));assert.ok(text.includes(token.figmaName));}
    for (const group of ['Primary','Secondary','Tertiary','Error','Surface','Inverse','Outline','Utility','Display','Headline','Title','Body','Label','Shape']) assert.ok(text.includes(group));
  }
  for (const token of tokens) {
    const variable=variables.find(v=>v.name===token.figmaName);
    assert.equal(variable.type,token.type);
    if(token.type!=='COLOR') assert.equal(variable.value,token.value);
  }
  assert.equal(collections.length,1);
  assert.deepEqual(errors,[]);
});
