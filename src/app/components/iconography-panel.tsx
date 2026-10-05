import { useState } from 'react';
import house24 from '@/assets/figma/eb76a.svg?inline';
import search24 from '@/assets/figma/fdad7.svg?inline';
import gear24 from '@/assets/figma/86505.svg?inline';
import heart24 from '@/assets/figma/744b1.svg?inline';
import person24 from '@/assets/figma/dee71.svg?inline';
import house12 from '@/assets/figma/1a114.svg?inline';
import house16 from '@/assets/figma/15e15.svg?inline';
import house20 from '@/assets/figma/643ea.svg?inline';
import house32 from '@/assets/figma/4c8b1.svg?inline';
import house40 from '@/assets/figma/68dab.svg?inline';
const houseAssets:Record<number,string>={12:house12,16:house16,20:house20,24:house24,32:house32,40:house40};
const previewAssets:Record<string,string>={house:house24,search:search24,'gear-fill':gear24,heart:heart24,person:person24};
import type { IconLibrary, Module } from '@/data/preset-contract/types';
import type { IconCatalogEntry } from '@/data/icon-loader';
import { variablesOf, pixels } from '../token-values';
import { iconScaleEdits, iconSvg } from '../iconography';
import { Icon, Section, TextValue, fieldClass } from './token-controls';
type Props={onLibraryChange:(id:string)=>void;libraries:IconCatalogEntry[];library?:IconLibrary;error:string;onRetry:()=>void;module:Extract<Module,{module:'iconography'}>;original:Extract<Module,{module:'iconography'}>;query:string;onEdit:(edits:Record<string,string>)=>void;selected:string;onSelect:(name:string)=>void};
export function IconPreview({svg,size,label}:{svg:string;size:number;label:string}){
  return <span role="img" aria-label={label} className="inline-flex shrink-0 items-center justify-center [&>svg]:h-full [&>svg]:w-full" style={{width:size,height:size}} dangerouslySetInnerHTML={{__html:svg}}/>;
}
export function IconographyPanel({module,original,query,onEdit,selected,onSelect,libraries,library,error,onRetry,onLibraryChange}:Props) {
  const [search,setSearch]=useState('');
  const [insertStep,setInsertStep]=useState(module.configuration.scale.steps[0]);
  const vars=variablesOf(module),config=module.configuration;
  const token=(id:string)=>vars.find(v=>v.id===id)!;
  const librarySelect=<div><label className="mb-1 block text-sm text-muted-foreground">Icon Library</label><div className={fieldClass}><Icon name="wallpaper" className="text-accent"/><select aria-label="Icon Library" className="min-w-0 flex-1 bg-transparent py-3" value={token(config.library).displayValue} onChange={e=>{
    onLibraryChange(e.target.value);setSearch('');
  }}>{libraries.map(l=><option key={l.id} value={l.id}>{l.name}</option>)}</select></div></div>;
  if(!library)return <Section title="Library" icon="format_shapes">{librarySelect}<p role={error?'alert':'status'}>{error||'Loading icon library…'}</p>{error&&<button onClick={onRetry}>Retry icons</button>}</Section>;
  const properties=Object.fromEntries(vars.filter(v=>v.submodule==='library').map(v=>[v.name,v.displayValue]));
  const variant=properties.variant||library.variants[0];
  const available=library.icons.filter(i=>i.variant===variant);
  const icon=available.find(i=>i.name===selected)||available.find(i=>['home','house','house-door'].includes(i.name))||available[0];
  const filtered=available.filter(i=>`${i.name} ${i.tags.join(' ')}`.toLowerCase().includes(search.toLowerCase()));
  const scale=vars.filter(v=>config.scale.steps.includes(v.id));
  const svg=(entry:typeof icon)=>iconSvg(entry.svg,library,properties);
  const previewNames=[['house','home'],['search'],['gear-fill','settings','gear'],['heart','favorite'],['person','user']];
  const previewIcons=previewNames.map(names=>names.map(name=>available.find(i=>i.name===name)).find(Boolean)).filter(Boolean) as typeof available;
  const renderIcon=(entry:typeof icon,size:number,staticPreview=false)=>{
    const asset=library.id==='bootstrap-icons'?(staticPreview?previewAssets[entry.name]:entry.name==='house'?houseAssets[size]:undefined):undefined;
    return asset?<img src={asset} alt={entry.name} width={size} height={size}/>:<IconPreview svg={svg(entry)} size={size} label={entry.name}/>;
  };
  const select=(label:string,id:string,options:string[])=> <div><label className="mb-1 block text-sm text-muted-foreground">{label}</label><div className={fieldClass}><Icon name="settings" className="text-accent"/><select aria-label={label} className="min-w-0 flex-1 bg-transparent py-3 outline-none" value={token(id).displayValue} onChange={e=>{const next=e.target.value;const edits:Record<string,string>={[id]:next};if(library.id==='material-symbols'){if(id==='iconography.library.FILL')edits['iconography.library.variant']=variant.replace(/-fill$/,'')+(next==='1'?'-fill':'');if(id==='iconography.library.variant')edits['iconography.library.FILL']=next.endsWith('-fill')?'1':'0';}onEdit(edits);}}>{options.map(value=><option key={value} value={value}>{value}</option>)}</select></div></div>;
  const sectionVisible=(name:string)=>!query||`${name} ${vars.map(v=>v.name).join(' ')}`.toLowerCase().includes(query.toLowerCase());
  return <>{sectionVisible('Library')&&<Section title="Library" icon="format_shapes">{librarySelect}{select('Delivery',config.delivery,library.delivery)}</Section>}
  <Section title="Sizing" icon="straighten"><div><label className="mb-1 block text-sm text-muted-foreground">Native Size</label><output className={fieldClass}>{library.nativeSize}</output></div><TextValue label="Base Size (px)" numeric min={1} value={String(pixels(token(config.baseSize)))} onChange={v=>onEdit({[config.baseSize]:`${v}px`})}/><div><label className="mb-1 block text-sm text-muted-foreground">Project Size Scale</label><div className={fieldClass}><Icon name="linear_scale" className="text-accent"/><select aria-label="Project Size Scale" className="min-w-0 flex-1 bg-transparent py-3" value="configured" onChange={e=>{const base=original.configuration.scale.baseValue*Number(e.target.value);onEdit({...iconScaleEdits(original,base),[config.baseSize]:`${base}px`});}}><option value="configured">{scale.map(v=>pixels(v)).join(' / ')}</option>{[.75,1,1.5,2].map(factor=><option key={factor} value={factor}>{variablesOf(original).filter(v=>config.scale.steps.includes(v.id)).map(v=>Number(v.value)*factor).join(' / ')}</option>)}</select></div></div><p className="text-[11px] text-muted-foreground">{config.description}</p><button className="flex min-h-[60px] w-full items-center justify-center gap-2 rounded-lg border border-border bg-card text-sm shadow-[0_5px_12px_#0000001a]" onClick={()=>onEdit(iconScaleEdits(original,pixels(token(config.baseSize))))}>Generate icon scale<Icon name="play_arrow"/></button></Section>
  <Section title="Behavior" icon="palette">{select('Color Behavior',config.colorBehavior,['currentColor','inherit'])}{config.verticalAlign&&<TextValue label="Vertical Align" numeric min={-1} unit="em" value={token(config.verticalAlign).displayValue} onChange={v=>onEdit({[config.verticalAlign!]:v})}/>}{library.variants.length>1&&select('Variant','iconography.library.variant',library.variants)}{Object.entries(library.properties||{}).map(([name,property])=><div key={name}>{select(name,`iconography.library.${name}`,property.values.map(String))}</div>)}{library.source.scope&&<p className="text-[11px] text-muted-foreground">{library.source.scope}</p>}</Section>
  <Section title="Preview" icon="wallpaper"><div className="flex justify-between rounded-md bg-card px-4 py-3">{previewIcons.map(i=><button key={i.name} title={i.name} onClick={()=>onSelect(i.name)} className="flex flex-col items-center gap-2 text-foreground">{renderIcon(i,24,true)}<span className="text-[9px] text-muted-foreground">{i.name==='gear-fill'?'gear':i.name}</span></button>)}</div><details className="rounded-md border border-border p-3"><summary className="cursor-pointer text-sm text-accent">Browse icons</summary><div className="mt-3 space-y-4"><input aria-label="Search icons" placeholder="Search icons by name or tag…" value={search} onChange={e=>setSearch(e.target.value)} className={`${fieldClass} py-3`}/><div className="grid max-h-[240px] grid-cols-5 gap-1 overflow-y-auto rounded-md bg-card p-2">{filtered.slice(0,150).map(i=><button key={i.name} aria-label={`Preview ${i.name}`} aria-pressed={icon.name===i.name} title={i.name} onClick={()=>onSelect(i.name)} className={`flex min-h-[60px] min-w-0 flex-col items-center justify-center gap-1 rounded p-1 text-foreground ${icon.name===i.name?'bg-secondary':'hover:bg-secondary'}`}><IconPreview svg={svg(i)} size={24} label={i.name}/><span className="w-full truncate text-[9px]">{i.name}</span></button>)}</div><div className="flex gap-2"><select aria-label="Insert icon size" className={fieldClass} value={insertStep} onChange={e=>setInsertStep(e.target.value)}>{scale.map(v=><option key={v.id} value={v.id}>{v.name} · {v.displayValue}</option>)}</select><button className="shrink-0 rounded-md bg-primary px-4 text-sm text-primary-foreground" onClick={()=>parent.postMessage({pluginMessage:{type:'insert-icon',name:`${library.name} / ${icon.name}`,svg:svg(icon),size:pixels(token(insertStep))}},'*')}>Insert icon</button></div><p role="status" className="text-[11px] text-muted-foreground">{filtered.length} icons · {library.name} {library.version.slice(0,10)}{filtered.length>150?' · Refine search to find more.':''}</p></div></details></Section>
  <Section title="Generated scale" icon="linear_scale"><div className="divide-y divide-border">{scale.map(v=><div key={v.id} className="flex items-center gap-3 py-4">{renderIcon(icon,pixels(v))}<span className="min-w-0 flex-1 text-xs">{library.name}</span><span className="flex flex-col items-end gap-1 text-xs"><span className="text-muted-foreground">{v.displayValue}</span><code className="rounded bg-secondary px-1 text-accent">{v.name}</code></span></div>)}</div></Section></>;
}
