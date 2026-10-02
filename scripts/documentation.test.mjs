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
 resize(w,h){assert.ok(Number.isFinite(w)&&w>0);assert.ok(Number.isFinite(h)&&h>0);this.width=w;this.height=h;if(this.layoutMode){this.primaryAxisSizingMode='FIXED';this.counterAxisSizingMode='FIXED';}if(this.type==='TEXT')this.textAutoResize='NONE';},
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

for(const [base,ratio] of [[20,1.25],[28,1.5]])test('final typography values drive previews at base '+base+' and ratio '+ratio,async()=>{
 const h=setup(),source=loader.loadPreset('starttoken');
 const type=source.modules.find(m=>m.module==='typography'),config=type.configuration;
 const edits={...values.typeScaleEdits(type,base,ratio),[config.fontRoles.primary.token]:'Inter',[config.fontRoles.secondary.token]:'Sora',[config.lineHeight.default]:'1.85'};
 const changed=values.customize(source,edits),tokens=changed.modules.flatMap(values.variablesOf),before=JSON.stringify(tokens);
 await h.generate(tokens,maps(tokens),'StartToken',changed.modules);
 const root=h.figma.currentPage.children[0],all=walk(root),actual=rows(root);
 assert.equal(actual.length,tokens.length);
 const preview=t=>walk(actual.find(row=>row.name===t.figmaName)).find(n=>n.name===t.figmaName+' Preview');
 for(const [role,family] of [['primary','Inter'],['secondary','Sora']]){
  const token=tokens.find(t=>t.id===config.fontRoles[role].token);
  const specimens=all.filter(n=>n.name===token.figmaName+' Preview');
  assert.equal(specimens.length,2); // dedicated family specimen and the Variable row
  for(const specimen of specimens){assert.equal(specimen.fontName.family,family);assert.equal(specimen.fontSize,base);assert.equal(specimen.lineHeight.value,185);}
 }
 for(const id of config.typeScale.steps){
  const token=tokens.find(t=>t.id===id),sample=preview(token);
  assert.equal(sample.fontSize,values.pixels(token),id);
  assert.equal(sample.characters,'Aa');assert.equal(sample.maxLines,1);
  assert.equal(sample.textAutoResize,'HEIGHT');assert.equal(sample.textTruncation,'ENDING');
  assert.ok(sample.width<=sample.parent.width);assert.equal(sample.parent.clipsContent,true);
 }
 for(const n of all.filter(n=>n.type==='FRAME'&&n.layoutMode)){
  assert.equal(n.minHeight,undefined,n.name);assert.equal(n.maxHeight,undefined,n.name);
  assert.equal(n.layoutMode==='VERTICAL'?n.primaryAxisSizingMode:n.counterAxisSizingMode,'AUTO',n.name+' hugs vertically');
  if(n.layoutMode==='HORIZONTAL'&&n!==root)assert.equal(n.counterAxisAlignItems,'CENTER',n.name);
  if(n.name==='Cell'){assert.equal(n.layoutMode,'VERTICAL');assert.equal(n.primaryAxisAlignItems,'CENTER');}
 }
 for(const row of actual){assert.equal(row.layoutMode,'HORIZONTAL');assert.equal(row.children.length,4);}
 for(const t of all.filter(n=>n.type==='TEXT'))assert.equal(t.textAutoResize,'HEIGHT',t.name);
 for(const board of root.children){assert.equal(board.width,1920);assert.equal(board.paddingLeft+board.paddingRight,160);}
 assert.equal(JSON.stringify(tokens),before);
});

test('large font specimens keep their exact size, zero/none line-height stays safe and all values remain documented',async()=>{
 const h=setup(),source=loader.loadPreset('starttoken'),type=source.modules.find(m=>m.module==='typography');
 const changed=values.customize(source,{[type.configuration.baseSize.default]:'640px',[type.configuration.lineHeight.default]:'0'});
 const tokens=changed.modules.flatMap(values.variablesOf);
 const line=tokens.find(t=>t.id===type.configuration.lineHeight.default);
 const extra={...line,id:'none',name:'line-height-none-string',figmaName:'Typography/Lineheight/line-height-none-string',type:'STRING',value:'none',displayValue:'none'};
 tokens.push(extra);const before=JSON.stringify(tokens);
 await h.generate(tokens,maps(tokens),'StartToken',changed.modules);
 const actual=rows(h.figma.currentPage.children[0]);assert.equal(actual.length,tokens.length);
 for(const token of [line,extra]){
  const row=actual.find(n=>n.name===token.figmaName),sample=walk(row).find(n=>n.name===token.figmaName+' Preview');
  assert.equal(sample.characters,'Aa\nAa');assert.equal(sample.fontSize,640);
  assert.equal(sample.lineHeight.unit,'AUTO');assert.equal(sample.bindings.lineHeight,undefined);
  assert.equal(sample.maxLines,2);assert.ok(sample.width<=sample.parent.width);
  assert.ok(walk(row).some(n=>n.name==='Value'&&n.characters===token.displayValue));
 }
 assert.equal(JSON.stringify(tokens),before);
});

test('composed Material role previews use final family, size, weight and line-height together',async()=>{
 const h=setup(),source=loader.loadPreset('materialdesign'),type=source.modules.find(m=>m.module==='typography');
 const vars=values.variablesOf(type),size=vars.find(t=>/-size$/.test(t.name)),prefix=size.name.replace(/-size$/,'');
 const family=vars.find(t=>t.name===prefix+'-font'),weight=vars.find(t=>t.name===prefix+'-weight'),line=vars.find(t=>t.name===prefix+'-line-height');
 assert.ok(family&&weight&&line);
 const changed=values.customize(source,{[family.id]:'Sora',[size.id]:size.unit==='rem'?'5.25rem':'84px',[weight.id]:'700',[line.id]:line.unit==='rem'?'7rem':'112px'});
 const tokens=changed.modules.flatMap(values.variablesOf);await h.generate(tokens,maps(tokens),'Material Design',changed.modules);
 const row=rows(h.figma.currentPage.children[0]).find(n=>n.name===size.figmaName),sample=walk(row).find(n=>n.name===size.figmaName+' Preview');
 assert.equal(sample.fontName.family,'Sora');assert.equal(sample.fontName.style,'Bold');assert.equal(sample.fontSize,84);assert.equal(sample.lineHeight.value,112);
});

test('new foundations all have value-driven previews including true zero space and tracking',async()=>{
 const h=setup(),source=loader.loadPreset('starttoken'),tokens=source.modules.flatMap(values.variablesOf);
 await h.generate(tokens,maps(tokens),'StartToken',source.modules);
 const actual=rows(h.figma.currentPage.children[0]);
 assert.equal(actual.length,tokens.length);
 const row=name=>walk(actual.find(n=>n.name===tokens.find(t=>t.name===name).figmaName));
 assert.ok(row('spacing-0').some(n=>n.characters==='0 · No space'));
 assert.equal(row('spacing-0').filter(n=>n.type==='RECTANGLE').length,0);
 assert.equal(row('radius-full').find(n=>n.name==='Radius Preview').cornerRadius,9999);
 assert.equal(row('opacity-25').find(n=>n.name==='Opacity Preview').opacity,.25);
 assert.equal(row('border-width-4').find(n=>n.name==='Border Width Preview').strokeWeight,4);
 assert.deepEqual(row('border-style-dashed').find(n=>n.name==='Border Style Preview').dashPattern.join(','),'8,4');
 assert.equal(row('border-style-none').find(n=>n.name==='Border Style Preview').strokeWeight,0);
 assert.equal(row('letter-spacing-tight').find(n=>n.name.endsWith(' Preview')).letterSpacing.value,-.4);
 assert.ok(row('breakpoint-wide').some(n=>n.name==='Length Preview'));
});
