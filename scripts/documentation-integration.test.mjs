import {exportTokens,prepareTokens,dtcgPath,nativeValue} from '../src/data/preset-contract/exports.mjs';
import {codeName,category} from '../src/data/preset-contract/token-metadata.mjs';
import { build } from 'esbuild';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
const output=await build({entryPoints:['src/plugin/code.ts'],bundle:true,write:false,format:'iife'});
const read=path=>JSON.parse(readFileSync(`src/data/presets/${path}`,'utf8'));
for(const preset of read('catalog.json').presets)test(`generation and documentation agree for every ${preset.name} Variable`,async()=>{
 const nodes=[],variables=[],messages=[],errors=[];const metadata=read(preset.path);const modules=metadata.modules.map(m=>read(`${preset.id}/${m.path}`));const tokens=modules.flatMap(m=>m.submodules.flatMap(s=>s.variables));
 if(preset.id==='starttoken'){
   const typography=modules.find(m=>m.module==='typography');
   assert.deepEqual(Object.keys(typography.configuration.fontRoles),['primary','secondary']);
   for(const [role,value] of [['primary','Custom Primary'],['secondary','Custom Secondary']]){const token=tokens.find(t=>t.id===typography.configuration.fontRoles[role].token);token.value=token.displayValue=value;}
   variables.push({id:'legacy-id',name:'Typography/Family/font-family-sans',variableCollectionId:'collection',type:'STRING',setValueForMode(mode,value){this.value=value;},setVariableCodeSyntax(p,v){(this.codeSyntax??={})[p]=v;},setPluginData(k,v){(this.data??={})[k]=v;},remove(){variables.splice(variables.indexOf(this),1);}});
 }
 const node=type=>{const data=new Map();const n={id:String(nodes.length),type,children:[],width:100,height:24,appendChild(c){this.children.push(c);c.parent=this;},resize(w,h){this.width=w;this.height=h;},setPluginData(k,v){data.set(k,v);},getPluginData(k){return data.get(k)||'';},setBoundVariable(){},remove(){this.parent?.children.splice(this.parent.children.indexOf(this),1);}};nodes.push(n);return n;};
 const figma={root:node('DOCUMENT'),showUI(){},notify(){},ui:{postMessage:m=>messages.push(m)},clientStorage:{getAsync:async k=>k==='dt_boilerplate_premium_status',setAsync:async()=>{}},loadFontAsync:async()=>{},loadAllPagesAsync:async()=>{},setCurrentPageAsync:async p=>{figma.currentPage=p;},viewport:{scrollAndZoomIntoView(){}},createFrame:()=>node('FRAME'),createText:()=>node('TEXT'),createNodeFromSvg:()=>node('FRAME'),createRectangle:()=>node('RECTANGLE'),createPage:()=>{const p=node('PAGE');figma.root.appendChild(p);return p;},variables:{getLocalVariablesAsync:async()=>variables,getLocalVariableCollectionsAsync:async()=>[{name:'StartToken / Theme: '+preset.name,id:'collection',modes:[{modeId:'default'}]}],createVariableCollection:name=>({name,id:'collection',modes:[{modeId:'default'}]}),createVariable(name,c,type){const variable={id:name,name,type,variableCollectionId:c.id,setValueForMode(mode,value){this.value=value;},setVariableCodeSyntax(p,v){(this.codeSyntax??={})[p]=v;},setPluginData(k,v){(this.data??={})[k]=v;}};variables.push(variable);return variable;},setBoundVariableForPaint(p,k,v){return {...p,boundVariables:{[k]:v}};}}};
 vm.runInNewContext(output.outputFiles[0].text,{figma,__html__:'',console:{log(){},error:(...e)=>errors.push(e)}});
 await figma.ui.onmessage({type:'generate-variables',tokens,modules,presetName:preset.name});
 assert.deepEqual(errors,[]);assert.equal(messages.at(-1).documentationGenerated,true);assert.equal(variables.length,tokens.length);
 assert.equal(nodes.filter(n=>n.getPluginData('starttokens-variable-path')).length,tokens.length);
 if(preset.id==='starttoken'){
   assert.equal(variables.find(v=>v.name==='Typography/Family/font-family-primary').id,'legacy-id');
   for(const family of ['Custom Primary','Custom Secondary'])assert.ok(nodes.some(n=>n.type==='TEXT'&&n.fontName?.family===family),family+' specimen uses selected font');
   assert.ok(!variables.some(v=>v.name==='Typography/Family/font-family-sans'));
   variables.push({name:'Typography/Family/font-family-sans',variableCollectionId:'collection',remove(){variables.splice(variables.indexOf(this),1);}});
   await figma.ui.onmessage({type:'generate-variables',tokens,modules,presetName:preset.name});
   assert.equal(variables.length,tokens.length);assert.ok(!variables.some(v=>v.name==='Typography/Family/font-family-sans'));
 }
 const prepared=prepareTokens(tokens),exports=exportTokens(prepared),dtcg=JSON.parse(exports.dtcg);
 const tailwind=await import('data:text/javascript;base64,'+Buffer.from(exports.tailwind).toString('base64'));
 const expectedScopes={fontFamily:['FONT_FAMILY'],fontSize:['FONT_SIZE'],fontWeight:['FONT_WEIGHT'],lineHeight:['LINE_HEIGHT'],letterSpacing:['LETTER_SPACING'],borderRadius:['CORNER_RADIUS'],borderWidth:['STROKE_FLOAT'],opacity:['OPACITY'],spacing:['GAP','WIDTH_HEIGHT'],screens:['WIDTH_HEIGHT'],sizing:['WIDTH_HEIGHT']};
 for(const t of prepared){
   const v=variables.find(v=>v.name===t.figmaName),c=category(t),name=codeName(t.figmaName);
   const expected=t.type==='COLOR'?['ALL_SCOPES']:t.type==='STRING'?(c==='fontFamily'?['FONT_FAMILY']:['ALL_SCOPES']):expectedScopes[c]||['ALL_SCOPES'];
   assert.deepEqual(Array.from(v.scopes),expected,t.figmaName);
   assert.equal(v.codeSyntax.WEB,'var(--'+name+')');
   assert.equal(JSON.parse(v.data['starttokens-metadata']).path,t.figmaName);
   const exported=dtcgPath(t).reduce((g,k)=>g[k],dtcg);assert.deepEqual(exported.$extensions['org.starttokens'].value,t.value);
   assert.equal(tailwind.tokens[name],nativeValue(t));
   for(const format of ['css','scss','sass'])assert.ok(exports[format].includes((format==='css'?'--':'$')+name+': '));
   if(t.reference)assert.equal(v.value.id,variables.find(v=>v.name===prepared.find(p=>p.id===t.reference).figmaName).id);
 }
 const resolveValue=v=>v.value?.type==='VARIABLE_ALIAS'?resolveValue(variables.find(t=>t.id===v.value.id)):v.value;
 for(const token of tokens){const v=variables.find(v=>v.name===token.figmaName);assert.ok(v);if(token.type==='COLOR'){const swatch=nodes.find(n=>n.name===`${token.name} Swatch`);assert.equal(swatch.fills[0].boundVariables.color,v);assert.ok(Math.abs(swatch.fills[0].color.r-resolveValue(v).r)<1e-8);assert.ok(Math.abs(swatch.fills[0].color.g-resolveValue(v).g)<1e-8);assert.ok(Math.abs(swatch.fills[0].color.b-resolveValue(v).b)<1e-8);}else assert.equal(resolveValue(v),token.value);}
});
