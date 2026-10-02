import type { IconLibrary, LoadedPreset, Module, Variable } from '@/data/preset-contract/types';
import { round, variablesOf } from './token-values';
export function iconScaleEdits(original:Extract<Module,{module:'iconography'}>,base:number) {
  if(!Number.isFinite(base)||base<=0)throw Error('Icon base size must be positive.');
  const config=original.configuration;
  return Object.fromEntries(variablesOf(original).filter(v=>config.scale.steps.includes(v.id)).map(v=>[v.id,`${round(Number(v.value)*base/config.scale.baseValue)}${v.unit||''}`]));
}
export function configureIconography(loaded:LoadedPreset,libraries:IconLibrary[],edits:Record<string,string>):LoadedPreset {
  return {...loaded,modules:loaded.modules.map(module=>{
    if(module.module!=='iconography')return module;
    const config=module.configuration,vars=variablesOf(module);
    const selected=vars.find(v=>v.id===config.library)!.displayValue;
    const library=libraries.find(l=>l.id===selected)!;
    if(!library)return module;
    const properties:Variable[]=[];
    const add=(name:string,value:string|number)=>{
      const id=`iconography.library.${name}`,final=edits[id]??value;
      properties.push({id,module:'iconography',submodule:'library',name,figmaName:`Iconography/Library/${name}`,type:typeof value==='number'?'FLOAT':'STRING',value:typeof value==='number'?Number(final):String(final),displayValue:String(final)});
    };
    const variant=edits['iconography.library.variant'];
    add('variant',library.variants.includes(variant)?variant:library.variants[0]);
    for(const [name,property] of Object.entries(library.properties||{}))add(name,property.values.some(v=>String(v)===edits[`iconography.library.${name}`])?edits[`iconography.library.${name}`]:property.default);
    return {...module,submodules:[...module.submodules.filter(s=>s.id!=='library').map(s=>({...s,variables:s.variables.map(v=>{
      if(v.id===config.nativeSize)return {...v,value:library.nativeSize,displayValue:library.nativeSize};
      if(v.id===config.delivery&&!library.delivery.includes(v.displayValue))return {...v,value:library.delivery[0],displayValue:library.delivery[0]};
      return v;
    })})),{id:'library',label:'Library properties',icon:'tune',variables:properties}]};
  })};
}
export function iconSvg(svg:string,library:IconLibrary,properties:Record<string,string>) {
  let result=svg.replace(/fill="(?:#000(?:000)?|black)"/gi,'fill="currentColor"');
  if(library.id==='lucide')result=result.replace(/stroke-width="[^"]+"/,`stroke-width="${Number(properties.strokeWidth)||2}"`);
  return result;
}
