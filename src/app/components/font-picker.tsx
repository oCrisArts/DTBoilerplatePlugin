import { useEffect, useRef, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Icon, fieldClass } from './token-controls';
type FontName = { family: string; style: string };
type Props = { label: string; value: string; disabled?: boolean; fonts: FontName[]; onChange: (family: string) => void };
export function FontPicker({label,value,disabled,fonts,onChange}: Props) {
  const [open,setOpen]=useState(false), [query,setQuery]=useState(''), [error,setError]=useState(''), [busy,setBusy]=useState(false);
  const request=useRef<string|null>(null);
  const selection=useRef('');
  useEffect(()=>{
    const listener=(event:MessageEvent)=>{
      const msg=event.data?.pluginMessage;
      if(msg?.type!=='font-validation-result'||msg.requestId!==request.current)return;
      request.current=null;setBusy(false);
      if(msg.ok){onChange(selection.current);setOpen(false);setError('');}else setError(msg.error||'Unable to load this font.');
    };
    window.addEventListener('message',listener);return()=>window.removeEventListener('message',listener);
  },[onChange]);
  const families=[...new Set(fonts.map(f=>f.family))].sort((a,b)=>a.localeCompare(b)).filter(f=>f.toLowerCase().includes(query.toLowerCase()));
  const select=(family:string)=>{
    if(busy)return;
    const faces=fonts.filter(f=>f.family===family),face=faces.find(f=>f.style==='Regular')||faces[0];
    if(!face)return;
    selection.current=family;request.current=crypto.randomUUID();setBusy(true);setError('');
    parent.postMessage({pluginMessage:{type:'validate-font',font:face,requestId:request.current}},'*');
  };
  return <div><label className="mb-1 block text-sm font-medium text-muted-foreground">{label}</label><Popover open={open} onOpenChange={setOpen}><PopoverTrigger asChild><button disabled={disabled||busy} aria-label={label} className={`${fieldClass} justify-between`}><Icon name="text_fields" className="text-accent"/><span className="min-w-0 flex-1 truncate text-left" title={value}>{busy?'Loading font…':value}</span><Icon name="expand_more"/></button></PopoverTrigger><PopoverContent align="start" className="w-[320px] max-w-[calc(100vw-16px)] p-0" collisionPadding={8}><input autoFocus aria-label={`Search ${label}`} placeholder="Search fonts by name…" value={query} onChange={e=>setQuery(e.target.value)} className="h-[50px] w-full border-b border-border bg-card px-4 outline-none"/><div className="max-h-[300px] overflow-y-auto">{families.map(name=><button key={name} disabled={busy} onClick={()=>select(name)} className={`flex min-h-[60px] w-full flex-col items-start gap-1 border-b border-border px-4 py-3 text-left ${name===value?'bg-accent text-white':'hover:bg-secondary'}`}><span className="text-sm">{name}</span><span className="text-xs" style={{fontFamily:name}}>The quick brown fox jumps</span></button>)}{!families.length&&<p role="status" className="p-4 text-sm">{fonts.length?'No fonts found.':'Waiting for Figma fonts…'}</p>}</div>{error&&<p role="alert" className="p-3 text-sm text-destructive">{error}</p>}</PopoverContent></Popover>{error&&!open&&<p role="alert" className="text-sm text-destructive">{error}</p>}</div>;
}
