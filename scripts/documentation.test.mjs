import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createServer } from 'vite';
import { build } from 'esbuild';
import vm from 'node:vm';
const server=await createServer({server:{middlewareMode:true,hmr:false},appType:'custom'});
let loader,values;
try {loader=await server.ssrLoadModule('/src/data/preset-loader.ts');values=await server.ssrLoadModule('/src/app/token-values.ts');}finally{await server.close();}
const bundle=await build({entryPoints:['src/plugin/documentation.ts'],bundle:true,write:false,format:'cjs'});
function setup(){
 const nodes=[],fonts=[];let fail=false;
 function node(type){const data=new Map();const n={id:String(nodes.length),type,children:[],width:1,height:1,bindings:{},
 appendChild(c){if(c.parent)c.parent.children.splice(c.parent.children.indexOf(c),1);this.children.push(c);c.parent=this;},
 resize(w,h){assert.ok(Number.isFinite(w)&&w>0);assert.ok(Number.isFinite(h)&&h>0);this.width=w;this.height=h;},
 setPluginData(k,v){data.set(k,v);},getPluginData(k){return data.get(k)||'';},setBoundVariable(k,v){this.bindings[k]=v;},remove(){this.parent?.children.splice(this.parent.children.indexOf(this),1);}};nodes.push(n);return n;}
 const figma={root:node('DOCUMENT'),currentPage:null,loadAllPagesAsync:async()=>{},setCurrentPageAsync:async p=>{figma.currentPage=p;},viewport:{scrollAndZoomIntoView(){}},
 listAvailableFontsAsync:async()=>['Inter','Sora','Roboto'].flatMap(family=>['Regular','Bold','Medium','Semi Bold','Light','Thin','Extra Bold','Black','Extra Light'].map(style=>({fontName:{family,style}}))),
 loadFontAsync:async f=>{fonts.push(f);if(!['Inter','Sora','Roboto'].includes(f.family))throw Error('Unavailable font');},
 createFrame:()=>{if(fail && --fail===0)throw Error('Rendering failed');return node('FRAME');},createText:()=>node('TEXT'),createNodeFromSvg:()=>node('FRAME'),createRectangle:()=>node('RECTANGLE'),
 createPage:()=>{const p=node('PAGE');figma.root.appendChild(p);return p;},variables:{setBoundVariableForPaint:(p,k,v)=>({...p,boundVariables:{[k]:v}})}};
 const module={exports:{}};vm.runInNewContext(bundle.outputFiles[0].text,{module,exports:module.exports,figma,console});
 return {figma,nodes,fonts,generate:module.exports.generateVisualDocumentation,node,setFailure:value=>{fail=value;}};
}
const walk=n=>[n,...n.children.flatMap(walk)];
const rows=root=>walk(root).filter(n=>n.getPluginData('starttokens-variable-path'));
const maps=tokens=>new Map(tokens.map(t=>[t.figmaName,{id:t.id,name:t.figmaName}]));
test('icon documentation renders the selected official SVG at every final project size without SVG Variables',async()=>{
 const h=setup(),source=loader.loadPreset('bootstrap');
 const module=source.modules.find(m=>m.module==='iconography');
 const edits={[module.configuration.baseSize]:'32px'};
 for(const token of values.variablesOf(module).filter(v=>module.configuration.scale.steps.includes(v.id)))edits[token.id]=`${token.value*2}px`;
 const changed=values.customize(source,edits),tokens=changed.modules.flatMap(values.variablesOf);
 const library=JSON.parse((await import('node:fs')).readFileSync(new URL('../src/data/icons/bootstrap-icons.json',import.meta.url),'utf8'));
 const icon=library.icons.find(i=>i.name==='house');
 await h.generate(tokens,maps(tokens),'Bootstrap',changed.modules,{name:icon.name,library:library.name,svg:icon.svg});
 const root=h.figma.currentPage.children[0],nodes=walk(root);
 for(const token of tokens.filter(t=>t.module==='iconography'&&t.submodule==='sizes')){
   const preview=nodes.find(n=>n.name===`${library.name} / ${icon.name} / ${token.displayValue}`);assert.ok(preview);assert.equal(preview.width,token.value);assert.equal(preview.height,token.value);assert.equal(preview.bindings.width.id,token.id);
 }
 assert.ok(nodes.some(n=>n.type==='TEXT'&&n.characters==='Library: Bootstrap Icons · Preview: house'));
 assert.ok(!tokens.some(t=>String(t.value).includes('<svg')));
});
for(const preset of loader.catalog.presets)test(`${preset.name}: all customized variables, groups, previews, and idempotent preset pages`,async()=>{
 const h=setup();const source=loader.loadPreset(preset.id);const original=JSON.stringify(source);
 const typography=source.modules.find(m=>m.module==='typography');const edits={};
 edits[typography.configuration.fontFamily.default]='Sora';
 const size=source.modules.flatMap(values.variablesOf).find(t=>t.id===typography.configuration.baseSize.default);
 edits[size.id]=size.unit==='rem'?'2rem':size.unit==='em'?'2em':'32px';
 const line=source.modules.flatMap(values.variablesOf).find(t=>t.id===typography.configuration.lineHeight.default);
 edits[line.id]=line.unit==='rem'?'3rem':line.unit==='px'?'48px':'1.75';
 const color=source.modules.flatMap(values.variablesOf).find(t=>t.type==='COLOR');edits[color.id]=values.colorValue({r:.8,g:.2,b:.4,a:.6},color);
 const weight=source.modules.flatMap(values.variablesOf).find(t=>t.module==='typography'&&/weight/i.test(t.name)&&t.type==='FLOAT');
 if(weight)edits[weight.id]='700';
 const changed=values.customize(source,edits);const tokens=changed.modules.flatMap(values.variablesOf);const vars=maps(tokens);
 await h.generate(tokens,vars,preset.name,changed.modules);
 const page=h.figma.currentPage;let root=page.children[0];
 assert.equal(page.name,`📘 StartTokens — ${preset.name} — Visual Foundations`);
 assert.equal(root.layoutMode,'HORIZONTAL');assert.equal(root.children.length,source.modules.length);assert.ok(root.children.every(b=>b.width===1920));
 const actual=rows(root);assert.equal(actual.length,tokens.length);
 for(const t of tokens){const row=actual.find(n=>n.name===t.figmaName);assert.ok(row,t.figmaName);const strings=walk(row).filter(n=>n.type==='TEXT').map(n=>n.characters);for(const value of [t.name,t.displayValue,t.figmaName])assert.ok(strings.includes(value),value);}
 for(const module of changed.modules){const board=root.children.find(b=>b.name===module.label);for(const group of module.submodules.filter(s=>s.variables.length))assert.ok(board.children.some(n=>n.name===group.id));}
 const swatch=walk(actual.find(n=>n.name===color.figmaName)).find(n=>n.type==='RECTANGLE');
 assert.ok(Math.abs(swatch.fills[0].color.r-.8)<.02);assert.equal(swatch.fills[0].boundVariables.color.id,color.id);
 const preview=walk(actual.find(n=>n.name===size.figmaName)).find(n=>n.name===`${size.figmaName} Preview`);
 assert.equal(preview.fontName.family,preset.id==='materialdesign'?'Roboto':'Sora');assert.equal(preview.fontSize,32);
 if(['rem','em'].includes(size.unit))assert.equal(preview.bindings.fontSize,undefined);else assert.equal(preview.bindings.fontSize.id,size.id);
 const linePreview=walk(actual.find(n=>n.name===line.figmaName)).find(n=>n.name===`${line.figmaName} Preview`);
 assert.equal(linePreview.lineHeight.value,line.unit==='rem'||line.unit==='px'?48:175);
 if(weight){const wp=walk(actual.find(n=>n.name===weight.figmaName)).find(n=>n.name===`${weight.figmaName} Preview`);assert.equal(wp.fontName.style,'Bold');assert.equal(wp.bindings.fontWeight.id,weight.id);}
 assert.equal(JSON.stringify(source),original);
 const other={...tokens[0],module:'custom',submodule:'new-group',figmaName:'Custom/New Group/value',name:'value'};
 await h.generate([other],maps([other]),'Other preset');const otherPage=h.figma.currentPage,otherRoot=otherPage.children[0];
 const note=h.node('TEXT');page.appendChild(note);
 await h.generate(tokens,vars,preset.name,changed.modules);root=page.children.find(n=>n.type==='FRAME');
 assert.equal(h.figma.root.children.length,2);assert.equal(page.children.filter(n=>n.type==='FRAME').length,1);assert.ok(page.children.includes(note));assert.equal(otherPage.children[0],otherRoot);assert.equal(rows(root).length,tokens.length);
});
test('unknown groups and native formats are retained; unavailable fonts affect previews only',async()=>{
 const h=setup();const tokens=[
 {id:'f',module:'typography',submodule:'family',name:'font-family',figmaName:'Typography/Family/font-family',type:'STRING',value:'Unavailable Font',displayValue:'Unavailable Font'},
 {id:'x',module:'layout',submodule:'future',name:'future-value',figmaName:'Layout/Future/Nested/future-value',type:'STRING',value:'auto',displayValue:'auto'},
 {id:'c',module:'colors',submodule:'brand-new',name:'brand',figmaName:'Colors/Brand New/brand',type:'COLOR',value:'oklch(60% 0.15 240)',displayValue:'oklch(60% 0.15 240)'},
 ];
 await h.generate(tokens,maps(tokens),'Custom');const root=h.figma.currentPage.children[0];assert.equal(rows(root).length,3);
 const preview=walk(root).find(n=>n.name==='Typography/Family/font-family Preview');assert.equal(preview.fontName.family,'Inter');assert.equal(preview.bindings.fontFamily,undefined);
 assert.ok(walk(root).some(n=>n.characters==='Unavailable Font'));assert.ok(walk(root).some(n=>n.characters==='Nested'));
 const swatch=walk(root).find(n=>n.name==='brand Swatch');assert.ok(swatch.fills[0].color.b>0);
});
test('only successful unique Variable writes are documented; no empty boards',async()=>{
 const h=setup();const t={id:'x',module:'unseen',submodule:'a',name:'x',figmaName:'Unseen/A/x',value:1,type:'FLOAT',displayValue:'1'};
 await h.generate([],new Map(),'Empty');assert.equal(h.figma.root.children.length,0);
 await h.generate([t,t,{...t,figmaName:'Failed/write'}],maps([t]),'Partial');const root=h.figma.currentPage.children[0];assert.equal(rows(root).length,1);assert.equal(root.children.length,1);
 h.setFailure(6);await assert.rejects(()=>h.generate([t],maps([t]),'Partial'));assert.equal(h.figma.currentPage.children[0],root);
});

test('concurrent regeneration does not duplicate preset documentation',async()=>{
 const h=setup();const source=loader.loadPreset('bootstrap');const tokens=source.modules.flatMap(values.variablesOf);
 await Promise.all([h.generate(tokens,maps(tokens),'Bootstrap',source.modules),h.generate(tokens,maps(tokens),'Bootstrap',source.modules)]);
 assert.equal(h.figma.root.children.length,1);assert.equal(h.figma.currentPage.children.length,1);
 assert.equal(rows(h.figma.currentPage.children[0]).length,tokens.length);
});
