import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const bundle=await build({entryPoints:['src/plugin/code.ts'],bundle:true,write:false,format:'iife'});
for(const premium of [false,true]) test(`unlock delegates pricing to LP; premium=${premium}`,async()=>{
 const urls=[],writes=[],messages=[];
 const figma={showUI(){},ui:{postMessage:x=>messages.push(x)},notify(){},openExternal:url=>urls.push(url),clientStorage:{getAsync:async()=>undefined,setAsync:async(k,v)=>writes.push([k,v])}};
 vm.runInNewContext(bundle.outputFiles[0].text,{figma,__html__:'',console,fetch:async()=>({ok:true,json:async()=>({premium})})});
 const email='qa+plans&test@example.com';
 await figma.ui.onmessage({type:'process-unlock',email});
 assert.deepEqual(urls,premium?[]:[`https://dt-boilerplate-lp.vercel.app/?email=${encodeURIComponent(email)}#pricing`]);
 assert.ok(writes.every(([key])=>['dt_boilerplate_user_email','dt_boilerplate_premium_status'].includes(key)));
 if(premium) assert.ok(messages.some(x=>x.type==='purchase-restored'));
});
test('UnlockModal contains no price table or plan selection',()=>{
 const source=readFileSync('src/app/components/UnlockModal.tsx','utf8');
 assert.doesNotMatch(source,/\$5\.99|\$49\.99|selectedPlan|planPrice|monthly|lifetime/);
 assert.match(source,/onUnlock\(email.trim\(\)\)/);
});
