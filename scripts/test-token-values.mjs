import { build } from 'esbuild';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const output = await build({entryPoints:['src/app/token-values.ts'],bundle:true,platform:'node',format:'esm',write:false});
const {customize,typeScaleEdits,variablesOf,parseColor,hex,rgbToHsv,hsvToRgb,colorFamilies,recolorFamily,pixels} = await import(`data:text/javascript;base64,${Buffer.from(output.outputFiles[0].text).toString('base64')}`);
const read = path=>JSON.parse(readFileSync(`src/data/presets/${path}`,'utf8'));
const catalog=read('catalog.json');
const identity = ({value,displayValue,preview,...rest})=>rest;
for(const entry of catalog.presets){
  const preset=read(entry.path),modules=preset.modules.map(m=>read(`${entry.id}/${m.path}`));
  const source={preset,modules},snapshot=JSON.stringify(source),all=modules.flatMap(variablesOf);
  const typography=modules.find(m=>m.module==='typography');
  const base=variablesOf(typography).find(v=>v.id===typography.configuration.baseSize.default);
  const initial=typeScaleEdits(typography,pixels(base),1.25);
  for(const [id,value] of Object.entries(initial))assert.ok(Math.abs(parseFloat(value)-parseFloat(all.find(v=>v.id===id).displayValue))<.001,`Default typography profile: ${id}`);
  const color=all.find(v=>v.type==='COLOR'),layout=all.find(v=>v.module==='layout'&&v.type==='FLOAT');
  const generated=typeScaleEdits(typography,20,1.5);
  const edits={...generated,[color.id]:'#1e22aa80',[layout.id]:`24${layout.unit||''}`,[typography.configuration.fontFamily.default]:'Inter'};
  const updated=customize(source,edits),tokens=updated.modules.flatMap(variablesOf);
  assert.equal(tokens.length,all.length);
  assert.deepEqual(tokens.map(identity),all.map(identity));
  assert.equal(JSON.stringify(source),snapshot,'Preset is immutable');
  assert.equal(tokens.find(v=>v.id===color.id).value.a,128/255);
  assert.equal(tokens.find(v=>v.id===layout.id).value,24);
  assert.equal(tokens.find(v=>v.id===typography.configuration.fontFamily.default).value,'Inter');
  assert.ok(Math.abs(pixels(base,generated[base.id])-20)<.001,'Base size respects rem/px');
  for(const v of tokens)if(v.type==='FLOAT')assert.ok(Number.isFinite(v.value),v.id);
  const sizes=typography.configuration.typeScale.steps.map(id=>all.find(v=>v.id===id)).sort((a,b)=>pixels(a)-pixels(b));
  for(let i=1;i<sizes.length;i++)assert.ok(pixels(sizes[i],generated[sizes[i].id])>=pixels(sizes[i-1],generated[sizes[i-1].id]),'Native hierarchy preserved');
  let families=0;
  for(const sub of modules.find(m=>m.module==='colors').submodules){
    for(const v of sub.variables)assert.ok(parseColor(v.displayValue),`Parse ${v.id}`);
    for(const family of colorFamilies(sub.variables).filter(f=>f.tokens.length>1)){
      const before=JSON.stringify(family.tokens),changed=recolorFamily(family.tokens,family.base,parseColor('#1e22aa'));
      assert.deepEqual(Object.keys(changed),family.tokens.map(v=>v.id));
      for(const value of Object.values(changed))assert.ok(parseColor(value));
      assert.equal(JSON.stringify(family.tokens),before);
      families++;
    }
  }
  console.log(`PASS ${entry.name}: ${tokens.length} tokens, identity/units/defaults/combined payload/type scale, ${families} native color families`);
}
for(const input of ['#abc','#1e22aa80','rgba(12, 30, 255, 0.4)','hsl(221, 14%, 96%)','oklch(62.3% 0.214 259.815)']){
  const rgb=parseColor(input),roundtrip=hsvToRgb(rgbToHsv(rgb));
  assert.equal(hex(rgb),hex(roundtrip));
}
for(const input of ['#oops','rgb(999, 0, 0)','rgba(0, 0, 0, 4)','hsl(20, 101%, 50%)',''])assert.equal(parseColor(input),null);
console.log('PASS color conversions, alpha, invalid input');
