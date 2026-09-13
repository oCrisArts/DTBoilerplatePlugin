import { useEffect, useRef, useState } from 'react';
import { loadPreset, catalog } from '@/data/preset-loader';
import type { ModuleId } from '@/data/preset-contract/types';
import { customize, pixels, typeScaleEdits, variablesOf } from './token-values';
import { ColorsPanel, LayoutPanel, TypographyPanel } from './components/token-panels';
import { Icon, fieldClass } from './components/token-controls';
import { UnlockModal } from './components/UnlockModal';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './components/ui/alert-dialog';
import brand from '@/assets/starttokens.svg?inline';
import bootstrap from '@/assets/bootstrap.svg?inline';
import tailwindcss from '@/assets/tailwindcss.svg?inline';
import bulma from '@/assets/bulma.svg?inline';
import materialdesign from '@/assets/materialdesign.svg?inline';

const logos: Record<string,string> = { bootstrap, tailwindcss, materialdesign, bulma, starttoken: brand };
const subtitles = {
  colors: 'Customize color values and preview each framework scale.',
  typography: 'Set type values and regenerate the framework scale.',
  layout: 'Adjust layout values while preserving framework token names.',
};
export default function App() {
  const [source,setSource]=useState(()=>loadPreset(catalog.defaultPreset));
  const [selected,setSelected]=useState(false);
  const [activeTab,setActiveTab]=useState<ModuleId>('colors');
  const [edits,setEdits]=useState<Record<string,string>>({});
  const [query,setQuery]=useState('');
  const [ratio,setRatio]=useState(1.25);
  const [pending,setPending]=useState<string|null>(null);
  const [showUnlockModal,setShowUnlockModal]=useState(false);
  const [status,setStatus]=useState('');
  const main=useRef<HTMLElement>(null);
  const customized=customize(source,edits);
  const module=customized.modules.find(m=>m.module===activeTab)!;
  const original=source.modules.find(m=>m.module===activeTab)!;
  const apply=(values:Record<string,string>)=>{setEdits(prev=>({...prev,...values}));setStatus('');};
  const selectPreset=(id:string)=>{
    if(id===source.preset.id&&Object.keys(edits).length){setSelected(true);setActiveTab('colors');setQuery('');return;}
    if(Object.keys(edits).length&&id!==source.preset.id){setPending(id);return;}
    load(id);
  };
  const load=(id:string)=>{setSource(loadPreset(id));setEdits({});setRatio(1.25);setQuery('');setActiveTab('colors');setSelected(true);setPending(null);setStatus('');};
  const changeTab=(id:ModuleId)=>{setActiveTab(id);setQuery('');setStatus('');};
  useEffect(()=>{if(main.current)main.current.scrollTop=0;},[activeTab,selected]);
  useEffect(()=>{
    const handlePluginMessage=(event:MessageEvent)=>{
      const message=event.data?.pluginMessage;
      if(message?.type==='unlock-required')setShowUnlockModal(true);
      if(message?.type==='purchase-restored'||message?.type==='redirected-to-checkout')setShowUnlockModal(false);
    };
    window.addEventListener('message',handlePluginMessage);
    return ()=>window.removeEventListener('message',handlePluginMessage);
  },[]);
  const generate=()=>{
    parent.postMessage({pluginMessage:{type:'generate-variables',tokens:customized.modules.flatMap(variablesOf),presetName:source.preset.metadata.name}},'*');
  };
  return <div className="relative flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden bg-background font-sans text-foreground">
    {selected && source.preset.id === 'materialdesign' && <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap"/>}
    <header className="flex h-[60px] shrink-0 items-center justify-between gap-3 bg-card px-4"><div className="flex min-w-0 items-center gap-2"><img src={brand} alt="" className="h-[30px] w-[19px] shrink-0"/><span className="text-xl font-normal">StartTokens</span></div><span className="text-[13px] text-muted-foreground">v0.1</span></header>
    {selected&&<><div className="z-10 flex min-h-[60px] shrink-0 items-center gap-2 bg-card px-4 py-2 shadow-[0_5px_12px_#0000001a]"><button className="-ml-2 flex size-9 shrink-0 items-center justify-center rounded hover:bg-secondary" aria-label="Back to presets" onClick={()=>setSelected(false)}><Icon name="arrow_back" className="text-muted-foreground"/></button><img src={logos[source.preset.id]} alt="" className="size-10 shrink-0 object-contain"/><span className="min-w-0 break-words text-base">{source.preset.metadata.name}</span></div>
    <div role="tablist" aria-label="Token categories" className="flex shrink-0 border-b border-border">{source.modules.map((m,index)=><button key={m.module} id={`tab-${m.module}`} role="tab" aria-selected={activeTab===m.module} aria-controls={`panel-${m.module}`} tabIndex={activeTab===m.module?0:-1} onClick={()=>changeTab(m.module)} onKeyDown={e=>{
      if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();
      const next=e.key==='Home'?0:e.key==='End'?source.modules.length-1:(index+(e.key==='ArrowRight'?1:-1)+source.modules.length)%source.modules.length;
      changeTab(source.modules[next].module);document.getElementById(`tab-${source.modules[next].module}`)?.focus();
    }} className={`flex min-h-[70px] min-w-0 flex-1 flex-col items-center justify-center gap-1 border-b-2 px-1 text-sm ${activeTab===m.module?'border-accent bg-secondary text-accent':'border-transparent text-muted-foreground hover:bg-secondary/50'}`}><Icon name={m.tabIcon} className="text-[16px]"/>{m.label}</button>)}</div></>}
    <main ref={main} className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain p-4">
    {!selected?<div className="space-y-4"><h1 className="text-2xl font-medium leading-[1.6]">Welcome</h1><p className="text-lg leading-[1.4]">Choose a preset to customize your design token package.</p><div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,150px),1fr))] gap-4">{catalog.presets.map(p=><button key={p.id} onClick={()=>selectPreset(p.id)} className="flex min-h-[100px] min-w-0 flex-col items-center justify-center gap-2 rounded-lg border border-border bg-card p-2 shadow-[0_5px_12px_#0000001a] transition hover:border-accent hover:bg-secondary active:translate-y-px active:shadow-none"><img src={logos[p.id]} alt="" className="size-10 object-contain"/><span className="text-base font-medium text-muted-foreground">{p.name}</span></button>)}</div></div>:
    <div role="tabpanel" id={`panel-${activeTab}`} aria-labelledby={`tab-${activeTab}`} tabIndex={0} className="min-w-0 outline-none"><p className="text-lg leading-[1.4]">{subtitles[activeTab]}</p><p className="mt-2 text-[13px] leading-[1.4] text-muted-foreground">Token names stay unchanged — only values are customized.</p><div className={`${fieldClass} my-4`}><Icon name="search" className="text-[16px] text-muted-foreground"/><input aria-label="Search tokens" placeholder="Search tokens..." value={query} onChange={e=>setQuery(e.target.value)} className="w-full min-w-0 bg-transparent py-2 text-[13px] outline-none placeholder:text-muted-foreground"/>{query&&<button aria-label="Clear search" className="flex size-8 shrink-0 items-center justify-center" onClick={()=>setQuery('')}><Icon name="close"/></button>}</div>
    {activeTab==='colors'&&<ColorsPanel key={`${source.preset.id}-colors`} module={module} original={original} query={query} onEdit={apply}/>}
    {module.module==='typography'&&<TypographyPanel key={`${source.preset.id}-typography`} module={module} query={query} onEdit={apply} ratio={ratio} onRatio={setRatio} onGenerate={()=>{const base=variablesOf(module).find(v=>v.id===module.configuration.baseSize.default)!;apply(typeScaleEdits(original as typeof module,pixels(base),ratio));setStatus('Typography scale updated.');}}/>}
    {activeTab==='layout'&&<LayoutPanel key={`${source.preset.id}-layout`} module={module} original={original} query={query} onEdit={apply}/>}
    <p role="status" className="text-sm text-accent">{status}</p></div>}
    </main>
    {selected&&<footer className="shrink-0 bg-card px-3 py-4"><button onClick={generate} className="flex min-h-[60px] w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-base font-medium text-primary-foreground hover:opacity-90 active:translate-y-px">Generate tokens<Icon name="play_arrow" className="text-2xl"/></button></footer>}
    <AlertDialog open={!!pending} onOpenChange={open=>{if(!open)setPending(null);}}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Switch preset?</AlertDialogTitle><AlertDialogDescription>Your customized values will be discarded when you load {catalog.presets.find(p=>p.id===pending)?.name}.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={()=>pending&&load(pending)}>Switch preset</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    {showUnlockModal&&<UnlockModal onUnlock={(email,plan)=>parent.postMessage({pluginMessage:{type:'process-unlock',email,plan}},'*')} onCancel={()=>setShowUnlockModal(false)}/>}
  </div>;
}
