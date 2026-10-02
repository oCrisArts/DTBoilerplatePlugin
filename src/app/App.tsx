import { useEffect, useRef, useState } from 'react';
import { IconographyPanel } from './components/iconography-panel';
import { configureIconography, iconSvg } from './iconography';
import { iconLibraries } from '@/data/icon-loader';
import { loadPreset, catalog } from '@/data/preset-loader';
import type { ModuleId } from '@/data/preset-contract/types';
import { customize, pixels, typeScaleEdits, variablesOf } from './token-values';
import { ColorsPanel, LayoutPanel, TypographyPanel } from './components/token-panels';
import { Icon, fieldClass } from './components/token-controls';
import { UnlockModal } from './components/UnlockModal';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './components/ui/alert-dialog';
import brand from '@/assets/figma/8ad4d.svg?inline';
import searchIcon from '@/assets/figma/48252.svg?inline';
import bootstrap from '@/assets/figma/ac174.svg?inline';
import tailwindcss from '@/assets/tailwindcss.svg?inline';
import bulma from '@/assets/bulma.svg?inline';
import materialdesign from '@/assets/materialdesign.svg?inline';

const logos: Record<string,string> = { bootstrap, tailwindcss, materialdesign, bulma, starttoken: brand };
const subtitles = {
  colors: 'Customize color values and preview each framework scale.',
  typography: 'Choose primary, secondary and monospace fonts, then generate the type scale.',
  iconography: 'Configure the icon library, delivery and project size scale.',
  layout: 'Adjust layout values while preserving framework token names.',
};
export default function App() {
  const [source,setSource]=useState(()=>loadPreset(catalog.defaultPreset));
  const [selected,setSelected]=useState(false);
  const [activeTab,setActiveTab]=useState<ModuleId>('colors');
  const [edits,setEdits]=useState<Record<string,string>>({});
  const [query,setQuery]=useState('');
  const [ratio,setRatio]=useState(1.25);
  const [fonts,setFonts]=useState<{family:string;style:string}[]>([]);
  const [fontError,setFontError]=useState('');
  const [fontsLoading,setFontsLoading]=useState(true);
  const fontTimer=useRef<ReturnType<typeof setTimeout>>();
  const requestFonts=()=>{
    clearTimeout(fontTimer.current);setFontError('');setFontsLoading(true);
    fontTimer.current=setTimeout(()=>{setFontsLoading(false);setFontError('Unable to load Figma fonts. Please retry.');},15000);
    parent.postMessage({pluginMessage:{type:'list-fonts'}},'*');
  };
  const [selectedIcon,setSelectedIcon]=useState('');
  const [pending,setPending]=useState<string|null>(null);
  const [showUnlockModal,setShowUnlockModal]=useState(false);
  const [status,setStatus]=useState('');
  const main=useRef<HTMLElement>(null);
  const customized=configureIconography(customize(source,edits),iconLibraries,edits);
  const module=customized.modules.find(m=>m.module===activeTab)!;
  const original=source.modules.find(m=>m.module===activeTab)!;
  const apply=(values:Record<string,string>)=>{setEdits(prev=>({...prev,...values}));setStatus('');};
  const selectPreset=(id:string)=>{
    if(id===source.preset.id&&Object.keys(edits).length){setSelected(true);setActiveTab('colors');setQuery('');return;}
    if(Object.keys(edits).length&&id!==source.preset.id){setPending(id);return;}
    load(id);
  };
  const load=(id:string)=>{setSource(loadPreset(id));setEdits({});setRatio((loadPreset(id).modules.find(m=>m.module==='typography')!.configuration as any).typeScale.referenceRatio);setSelectedIcon('');setQuery('');setActiveTab('colors');setSelected(true);setPending(null);setStatus('');};
  const changeTab=(id:ModuleId)=>{setActiveTab(id);setQuery('');setStatus('');};
  useEffect(()=>{if(main.current)main.current.scrollTop=0;},[activeTab,selected]);
  useEffect(()=>{
    const handlePluginMessage=(event:MessageEvent)=>{
      const message=event.data?.pluginMessage;
      if(message?.type==='icon-inserted')setStatus(`${message.name} inserted.`);
      if(message?.type==='icon-insertion-failed')setStatus(message.error);
      if(message?.type==='available-fonts'){clearTimeout(fontTimer.current);setFonts(message.fonts||[]);setFontsLoading(false);setFontError(message.error||'');}
      if(message?.type==='variables-generated')setStatus(message.documentationGenerated?'Variables and visual documentation updated.':'Variables updated.');
      if(message?.type==='variables-generation-failed')setStatus(message.error);
      if(message?.type==='unlock-required')setShowUnlockModal(true);
      if(message?.type==='purchase-restored'||message?.type==='redirected-to-checkout')setShowUnlockModal(false);
    };
    window.addEventListener('message',handlePluginMessage);
    requestFonts();
    return ()=>{clearTimeout(fontTimer.current);window.removeEventListener('message',handlePluginMessage);};
  },[]);
  const generate=()=>{
    const icons=customized.modules.find(m=>m.module==='iconography')!;
    const iconVars=variablesOf(icons), config=icons.configuration as any;
    const library=iconLibraries.find(l=>l.id===iconVars.find(v=>v.id===config.library)!.displayValue)!;
    const properties=Object.fromEntries(iconVars.filter(v=>v.submodule==='library').map(v=>[v.name,v.displayValue]));
    const available=library.icons.filter(i=>i.variant===properties.variant);
    const icon=available.find(i=>i.name===selectedIcon)||available.find(i=>['home','house','house-door'].includes(i.name))||available[0];
    parent.postMessage({pluginMessage:{iconPreview:{name:icon.name,library:library.name,svg:iconSvg(icon.svg,library,properties)},type:'generate-variables',tokens:customized.modules.flatMap(variablesOf),modules:customized.modules,presetName:source.preset.metadata.name}},'*');
  };
  return <div className="relative flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden bg-background font-sans text-foreground">
    {selected && source.preset.id === 'materialdesign' && <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap"/>}
    <header className="flex h-[60px] shrink-0 items-center justify-between gap-3 bg-card px-4"><div className="flex min-w-0 items-center gap-2"><img src={brand} alt="" className="h-[30px] w-[18.2024px] shrink-0"/><span className="text-xl font-normal">StartTokens</span></div><span className="text-[13px] text-muted-foreground">v0.1</span></header>
    {selected&&<><div className="z-10 flex min-h-[60px] shrink-0 items-center gap-2 bg-card px-4 py-2 shadow-[0_5px_12px_#0000001a]"><button className="-ml-2 flex size-9 shrink-0 items-center justify-center rounded hover:bg-secondary" aria-label="Back to presets" onClick={()=>setSelected(false)}><Icon name="arrow_back" className="text-muted-foreground"/></button><img src={logos[source.preset.id]} alt="" className="size-10 shrink-0 object-contain"/><span className="min-w-0 break-words text-base">{source.preset.metadata.name}</span></div>
    <div role="tablist" aria-label="Token categories" className="flex shrink-0 border-b border-border">{source.modules.map((m,index)=><button key={m.module} id={`tab-${m.module}`} role="tab" aria-selected={activeTab===m.module} aria-controls={`panel-${m.module}`} tabIndex={activeTab===m.module?0:-1} onClick={()=>changeTab(m.module)} onKeyDown={e=>{
      if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();
      const next=e.key==='Home'?0:e.key==='End'?source.modules.length-1:(index+(e.key==='ArrowRight'?1:-1)+source.modules.length)%source.modules.length;
      changeTab(source.modules[next].module);document.getElementById(`tab-${source.modules[next].module}`)?.focus();
    }} className={`flex min-h-[70px] min-w-0 flex-1 flex-col items-center justify-center gap-1 border-b-2 px-1 text-sm ${activeTab===m.module?'border-accent bg-secondary text-accent':'border-transparent text-muted-foreground hover:bg-secondary/50'}`}><Icon name={m.tabIcon} className="text-[16px]"/>{m.label}</button>)}</div></>}
    <main ref={main} className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain p-4">
    {!selected?<div className="space-y-4"><h1 className="text-2xl font-medium leading-[1.6]">Welcome</h1><p className="text-lg leading-[1.4]">Choose a preset to customize your design token package.</p><div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,150px),1fr))] gap-4">{catalog.presets.map(p=><button key={p.id} onClick={()=>selectPreset(p.id)} className="flex min-h-[100px] min-w-0 flex-col items-center justify-center gap-2 rounded-lg border border-border bg-card p-2 shadow-[0_5px_12px_#0000001a] transition hover:border-accent hover:bg-secondary active:translate-y-px active:shadow-none"><img src={logos[p.id]} alt="" className="size-10 object-contain"/><span className="text-base font-medium text-muted-foreground">{p.name}</span></button>)}</div></div>:
    <div role="tabpanel" id={`panel-${activeTab}`} aria-labelledby={`tab-${activeTab}`} tabIndex={0} className="min-w-0 outline-none"><p className="text-lg leading-[1.4]">{subtitles[activeTab]}</p><div className={`${fieldClass} my-4`}><img src={searchIcon} width={10} height={10} alt=""/><input aria-label="Search tokens" placeholder="Search tokens..." value={query} onChange={e=>setQuery(e.target.value)} className="w-full min-w-0 bg-transparent py-2 text-[13px] outline-none placeholder:text-muted-foreground"/>{query&&<button aria-label="Clear search" className="flex size-8 shrink-0 items-center justify-center" onClick={()=>setQuery('')}><Icon name="close"/></button>}</div>
    {activeTab==='colors'&&<ColorsPanel key={`${source.preset.id}-colors`} module={module} original={original} query={query} onEdit={apply}/>}
    {module.module==='typography'&&<TypographyPanel key={`${source.preset.id}-typography`} module={module} query={query} onEdit={apply} fonts={fonts} fontError={fontError} fontsLoading={fontsLoading} onRetryFonts={requestFonts} ratio={ratio} onRatio={setRatio} onGenerate={()=>{const base=variablesOf(module).find(v=>v.id===module.configuration.baseSize.default)!;apply(typeScaleEdits(original as typeof module,pixels(base),ratio));setStatus('Typography scale updated.');}}/>}
    {module.module==='iconography'&&<IconographyPanel key={`${source.preset.id}-icons`} module={module} original={original as typeof module} query={query} onEdit={apply} selected={selectedIcon} onSelect={setSelectedIcon}/>}
    {activeTab==='layout'&&<LayoutPanel key={`${source.preset.id}-layout`} module={module} original={original} query={query} onEdit={apply}/>}
    <p role="status" className="text-sm text-accent">{status}</p></div>}
    </main>
    {selected&&<footer className="shrink-0 bg-card px-3 py-4"><button onClick={generate} className="flex min-h-[60px] w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-base font-medium text-primary-foreground hover:opacity-90 active:translate-y-px">Generate tokens<Icon name="play_arrow" className="text-2xl"/></button></footer>}
    <AlertDialog open={!!pending} onOpenChange={open=>{if(!open)setPending(null);}}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Switch preset?</AlertDialogTitle><AlertDialogDescription>Your customized values will be discarded when you load {catalog.presets.find(p=>p.id===pending)?.name}.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={()=>pending&&load(pending)}>Switch preset</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    {showUnlockModal&&<UnlockModal onUnlock={(email)=>parent.postMessage({pluginMessage:{type:'process-unlock',email}},'*')} onCancel={()=>setShowUnlockModal(false)}/>}
  </div>;
}
