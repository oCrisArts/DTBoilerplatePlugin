import { useEffect, useId, useState, type PointerEvent, type ReactNode } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { cn } from './ui/utils';
import { clamp, hex, hslToRgb, hsvToRgb, parseColor, rgbToHsl, rgbToHsv, type HSV, type RGBA } from '../token-values';

export const fieldClass = 'flex min-h-[50px] w-full min-w-0 items-center gap-2 rounded-md border border-border bg-card px-2.5 text-sm text-foreground focus-within:ring-2 focus-within:ring-ring';
export function Icon({name,className=''}:{name:string;className?:string}) {
  return <span aria-hidden="true" className={cn('material-symbols-outlined shrink-0 text-[18px] leading-none',className)}>{name}</span>;
}
export function Section({title,icon,children}:{title:string;icon:string;children:ReactNode}) {
  const [open,setOpen]=useState(true), id=useId();
  return <section className="min-w-0"><button className="flex min-h-[50px] w-full items-center gap-2 py-4 text-left text-sm text-accent" aria-expanded={open} aria-controls={id} onClick={()=>setOpen(!open)}><Icon name={icon}/><span className="min-w-0 flex-1 break-words font-medium">{title}</span><Icon name={open?'expand_less':'expand_more'} className="text-[14px]"/></button><div id={id} hidden={!open} className="min-w-0 space-y-4 pb-4">{children}</div></section>;
}
export function TextValue({label,value,onChange,numeric=false,unit='',min=0,compact=false}:{label:string;value:string;onChange:(v:string)=>void;numeric?:boolean;unit?:string;min?:number;compact?:boolean}) {
  const [draft,setDraft]=useState(value), [error,setError]=useState(''),id=useId();
  useEffect(()=>{setDraft(value);setError('');},[value]);
  const edit=(text:string)=>{
    setDraft(text);
    if(numeric) {
      const match=text.trim().match(/^(-?(?:\d+(?:\.\d*)?|\.\d+))\s*([a-z%]*)$/i);
      if(!match || !Number.isFinite(Number(match[1])) || Number(match[1])<min || (match[2] && match[2]!==unit)) {setError(`Enter a number ≥ ${min}${unit ? ` in ${unit}`:''}.`);return;}
      setError(''); onChange(`${Number(match[1])}${unit}`);
    } else {if(!text.trim()){setError('Enter a value.');return;}setError('');onChange(text);}
  };
  const input=<input id={id} className={compact?'w-16 min-w-0 shrink-0 bg-transparent py-2 text-xs outline-none':'w-full min-w-0 bg-transparent py-2 text-sm outline-none'} value={draft} inputMode={numeric?'decimal':undefined} onChange={e=>edit(e.target.value)} onBlur={()=>{if(!error)setDraft(value);}} aria-invalid={!!error} aria-describedby={error?`${id}-error`:undefined}/>;
  return <div className="min-w-0">{compact?<div className={fieldClass}><label htmlFor={id} className="min-w-0 flex-1 break-words text-[10px] text-accent">{label}</label>{input}</div>:<><label htmlFor={id} className="mb-1 block break-words text-sm font-medium text-muted-foreground">{label}</label><div className={fieldClass}>{input}</div></>}{error&&<p id={`${id}-error`} role="alert" className="mt-1 text-xs text-destructive">{error}</p>}</div>;
}
function Channel({label,value,max,onChange}:{label:string;value:number;max:number;onChange:(v:number)=>void}) {
  const id=useId();
  return <label htmlFor={id} className="flex min-w-0 flex-col gap-1 text-[10px] font-medium text-muted-foreground">{label}<input id={id} aria-label={label} type="number" min={0} max={max} step="any" className="h-8 w-full min-w-0 rounded border border-border px-2 text-xs text-foreground" value={Math.round(value*100)/100} onChange={e=>{if(e.target.value!==''&&Number.isFinite(e.target.valueAsNumber))onChange(clamp(e.target.valueAsNumber,max));}}/></label>;
}
function ColorEditor({value,onChange}:{value:string;onChange:(c:RGBA)=>void}) {
  const rgb=parseColor(value) || {r:0,g:0,b:0,a:1};
  const [hsv,setHsv]=useState(()=>rgbToHsv(rgb));
  const [draft,setDraft]=useState(hex(rgb)),[error,setError]=useState('');
  const hsl=rgbToHsl(hsvToRgb(hsv));
  useEffect(()=>{const color=parseColor(value);if(color){setHsv(prev=>{const next=rgbToHsv(color);return {...next,h:next.s?next.h:prev.h};});setDraft(hex(color));}},[value]);
  const update=(next:HSV)=>{setError('');setHsv(next);const c=hsvToRgb(next);setDraft(hex(c));onChange(c);};
  const fromRgb=(next:RGBA)=>update(rgbToHsv(next));
  const point=(e:PointerEvent<HTMLDivElement>)=>{const rect=e.currentTarget.getBoundingClientRect();update({...hsv,s:clamp((e.clientX-rect.left)/rect.width),v:clamp((e.clientY-rect.top)/rect.height)});};
  return <><div className="relative h-[200px] w-full touch-none bg-[linear-gradient(to_bottom,#000,transparent),linear-gradient(to_right,#fff,transparent)]" style={{backgroundColor:`hsl(${hsv.h} 100% 50%)`}} onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);point(e);}} onPointerMove={e=>{if(e.currentTarget.hasPointerCapture(e.pointerId))point(e);}} aria-label="Saturation and brightness area"><span className="pointer-events-none absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow" style={{left:`${hsv.s*100}%`,top:`${hsv.v*100}%`}}/></div>
    <div className="space-y-3 p-4"><div className="flex items-center gap-3"><span className="size-7 shrink-0 rounded-full border border-border" style={{background:hex(hsvToRgb(hsv))}}/><div className="flex min-w-0 flex-1 flex-col gap-2"><input className="color-slider hue-slider" aria-label="Hue" type="range" min="0" max="360" value={hsv.h} onChange={e=>update({...hsv,h:+e.target.value})}/><input className="color-slider" style={{background:`linear-gradient(to right,transparent,${hex(hsvToRgb({...hsv,a:1}))})`}} aria-label="Alpha" type="range" min="0" max="1" step="0.01" value={hsv.a} onChange={e=>update({...hsv,a:+e.target.value})}/></div></div>
    <div className="grid grid-cols-2 gap-2"><label className="flex min-w-0 flex-col gap-1 text-[10px] text-muted-foreground">HEX<input aria-label="HEX" aria-invalid={!!error} className="h-8 min-w-0 rounded border border-border px-2 text-xs text-foreground" value={draft} onChange={e=>{setDraft(e.target.value);const c=parseColor(e.target.value);if(c){setError('');setHsv(rgbToHsv(c));onChange(c);}else setError('Enter a valid HEX color.');}}/></label><Channel label="Alpha %" value={hsv.a*100} max={100} onChange={a=>update({...hsv,a:a/100})}/></div>{error&&<p role="alert" className="text-xs text-destructive">{error}</p>}
    <div className="grid grid-cols-3 gap-2">{(['r','g','b'] as const).map(c=><Channel key={c} label={c.toUpperCase()} value={hsvToRgb(hsv)[c]*255} max={255} onChange={n=>fromRgb({...hsvToRgb(hsv),[c]:n/255})}/>)}</div>
    <div className="grid grid-cols-3 gap-2"><Channel label="H (HSL)" value={hsl.h} max={360} onChange={h=>fromRgb(hslToRgb(h,hsl.s,hsl.l,hsv.a))}/><Channel label="S (HSL) %" value={hsl.s*100} max={100} onChange={s=>fromRgb(hslToRgb(hsl.h,s/100,hsl.l,hsv.a))}/><Channel label="L %" value={hsl.l*100} max={100} onChange={l=>fromRgb(hslToRgb(hsl.h,hsl.s,l/100,hsv.a))}/></div>
    <div className="grid grid-cols-3 gap-2"><Channel label="H (HSB)" value={hsv.h} max={360} onChange={h=>update({...hsv,h})}/><Channel label="S (HSB) %" value={hsv.s*100} max={100} onChange={s=>update({...hsv,s:s/100})}/><Channel label="B %" value={hsv.v*100} max={100} onChange={v=>update({...hsv,v:v/100})}/></div></div></>;
}
export function ColorField({label,value,onChange,compact=false}:{label:string;value:string;onChange:(c:RGBA)=>void;compact?:boolean}) {
  return <Popover><div className="min-w-0">{!compact&&<p className="mb-1 break-words text-sm font-medium text-muted-foreground">{label}</p>}<PopoverTrigger asChild><button aria-label={`Edit color ${label}`} className={compact?'block h-[50px] w-full min-w-0 flex-1 border border-black/5 focus-visible:z-10':`${fieldClass} text-left hover:border-accent`} style={compact?{background:value}:undefined} title={`${label}: ${value}`}>{compact?<span className="sr-only">{label}: {value}</span>:<><span className="size-[18px] shrink-0 rounded-full border border-black/5" style={{background:value}}/><span className="min-w-0 truncate">{value}</span></>}</button></PopoverTrigger></div><PopoverContent aria-label={`Color picker for ${label}`} align="start" collisionPadding={8} className="w-[320px] max-w-[calc(100vw-16px)] max-h-[calc(100dvh-16px)] overflow-y-auto rounded-xl border-0 p-0 shadow-[0_1px_4px_#0000000a,0_4px_16px_#00000014]"><ColorEditor value={value} onChange={onChange}/></PopoverContent></Popover>;
}

