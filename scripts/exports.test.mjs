import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {prepareTokens,exportTokens,dtcgPath,nativeValue} from '../src/data/preset-contract/exports.mjs';
import {codeName} from '../src/data/preset-contract/token-metadata.mjs';
const server=await createServer({server:{middlewareMode:true,hmr:false},appType:'custom'});
let loader,values;
try{loader=await server.ssrLoadModule('/src/data/preset-loader.ts');values=await server.ssrLoadModule('/src/app/token-values.ts');}finally{await server.close();}
test('custom fonts, generated scale, primitive edits and explicit alias overrides are the export/generation payload',()=>{
 const source=loader.loadPreset('starttoken'),type=source.modules.find(m=>m.module==='typography'),all=source.modules.flatMap(values.variablesOf);
 const derived=all.find(t=>t.id==='colors.content.primary.text'),primitive=all.find(t=>t.id===derived.reference);
 const edits={...values.typeScaleEdits(type,28,1.5),[type.configuration.fontRoles.primary.token]:'Team Primary',[type.configuration.fontRoles.secondary.token]:'Team Secondary',[type.configuration.lineHeight.default]:'1.9',[primitive.id]:'#123456',[derived.id]:'#abcdef'};
 const final=prepareTokens(values.customize(source,edits).modules.flatMap(values.variablesOf));
 const direct=final.find(t=>t.id===derived.id);assert.equal(direct.reference,undefined);assert.equal(direct.displayValue,'#abcdef');
 const follower=final.find(t=>t.reference===primitive.id);assert.ok(follower);assert.equal(follower.displayValue,'#123456');
 const files=exportTokens(final),dtcg=JSON.parse(files.dtcg);
 for(const t of final){const leaf=dtcgPath(t).reduce((g,k)=>g[k],dtcg);assert.deepEqual(leaf.$extensions['org.starttokens'].value,t.value);assert.equal(leaf.$extensions['org.starttokens'].unit,t.unit||null);}
 assert.ok(files.css.includes('--'+codeName(direct.figmaName)+': '+nativeValue(direct)+';'));
 for(const id of type.configuration.typeScale.steps){const t=final.find(t=>t.id===id);assert.equal(t.displayValue,edits[id]);}
 assert.equal(source.modules.flatMap(values.variablesOf).find(t=>t.id===derived.id).reference,primitive.id);
});
