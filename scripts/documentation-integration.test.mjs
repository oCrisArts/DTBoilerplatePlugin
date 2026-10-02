import { build } from 'esbuild';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
const output=await build({entryPoints:['src/plugin/code.ts'],bundle:true,write:false,format:'iife'});
const read=path=>JSON.parse(readFileSync(`src/data/presets/${path}`,'utf8'));
for(const preset of read('catalog.json').presets)test(`generation and documentation agree for every ${preset.name} Variable`,async()=>{
 const nodes=[],variables=[],messages=[],errors=[];const metadata=read(preset.path);const modules=metadata.modules.map(m=>read(`${preset.id}/${m.path}`));const tokens=modules.flatMap(m=>m.submodules.flatMap(s=>s.variables));
 const node=type=>{const data=new Map();const n={id:String(nodes.length),type,children:[],width:100,height:24,appendChild(c){this.children.push(c);c.parent=this;},resize(w,h){this.width=w;this.height=h;},setPluginData(k,v){data.set(k,v);},getPluginData(k){return data.get(k)||'';},setBoundVariable(){},remove(){this.parent?.children.splice(this.parent.children.indexOf(this),1);}};nodes.push(n);return n;};
 const figma={root:node('DOCUMENT'),showUI(){},notify(){},ui:{postMessage:m=>messages.push(m)},clientStorage:{getAsync:async k=>k==='dt_boilerplate_premium_status',setAsync:async()=>{}},loadFontAsync:async()=>{},loadAllPagesAsync:async()=>{},setCurrentPageAsync:async p=>{figma.currentPage=p;},viewport:{scrollAndZoomIntoView(){}},createFrame:()=>node('FRAME'),createText:()=>node('TEXT'),createNodeFromSvg:()=>node('FRAME'),createRectangle:()=>node('RECTANGLE'),createPage:()=>{const p=node('PAGE');figma.root.appendChild(p);return p;},variables:{getLocalVariablesAsync:async()=>[],getLocalVariableCollectionsAsync:async()=>[],createVariableCollection:name=>({name,id:'collection',modes:[{modeId:'default'}]}),createVariable(name,c,type){const variable={id:name,name,type,variableCollectionId:c.id,setValueForMode(mode,value){this.value=value;}};variables.push(variable);return variable;},setBoundVariableForPaint(p,k,v){return {...p,boundVariables:{[k]:v}};}}};
 vm.runInNewContext(output.outputFiles[0].text,{figma,__html__:'',console:{log(){},error:(...e)=>errors.push(e)}});
 await figma.ui.onmessage({type:'generate-variables',tokens,modules,presetName:preset.name});
 assert.deepEqual(errors,[]);assert.equal(messages.at(-1).documentationGenerated,true);assert.equal(variables.length,tokens.length);
 assert.equal(nodes.filter(n=>n.getPluginData('starttokens-variable-path')).length,tokens.length);
 for(const token of tokens){const v=variables.find(v=>v.name===token.figmaName);assert.ok(v);if(token.type==='COLOR'){const swatch=nodes.find(n=>n.name===`${token.name} Swatch`);assert.equal(swatch.fills[0].boundVariables.color,v);assert.ok(Math.abs(swatch.fills[0].color.r-v.value.r)<1e-8);assert.ok(Math.abs(swatch.fills[0].color.g-v.value.g)<1e-8);assert.ok(Math.abs(swatch.fills[0].color.b-v.value.b)<1e-8);}else assert.equal(v.value,token.value);}
});
