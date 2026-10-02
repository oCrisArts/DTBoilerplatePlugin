import { useId } from 'react';
import { FontPicker } from './font-picker';
import type { Module, Variable } from '@/data/preset-contract/types';
import { ColorField, Icon, Section, TextValue, fieldClass } from './token-controls';
import { Select, SelectContent, SelectItem, SelectTrigger } from './ui/select';
import { colorFamilies, colorValue, pixels, recolorFamily, spacingEdits, variablesOf } from '../token-values';

type PanelProps = { module: Module; original: Module; query: string; onEdit: (edits:Record<string,string>)=>void };
const matches = (v:Variable,query:string) => `${v.name} ${v.id} ${v.figmaName}`.toLowerCase().includes(query.toLowerCase());
export function ColorsPanel({module,original,query,onEdit}:PanelProps) {
  return <>{module.submodules.map(sub=>{
    const groupMatch=sub.label.toLowerCase().includes(query.toLowerCase());
    const families=colorFamilies(sub.variables).filter(f=>groupMatch||f.tokens.some(v=>matches(v,query)));
    if(!families.length)return null;
    const originals=original.submodules.find(s=>s.id===sub.id)!;
    return <Section key={sub.id} title={sub.label} icon={sub.icon}>{families.map(({tokens,base})=>{
      const familyOriginals=originals.variables.filter(v=>tokens.some(t=>t.id===v.id));
      const originalBase=familyOriginals.find(v=>v.id===base.id)!;
      const steps=tokens.map(v=>v.figmaName.match(/-(\d+)$/)?.[1]).filter(Boolean).map(Number).sort((a,b)=>a-b);
      return <div key={base.id} className="space-y-4"><ColorField label={base.name} value={base.displayValue} onChange={c=>onEdit(tokens.length>1?recolorFamily(familyOriginals,originalBase,c):{[base.id]:colorValue(c,base)})}/>{tokens.length>1&&<div className="space-y-1"><p className="text-sm font-medium text-muted-foreground">Scale {steps[0]}–{steps.at(-1)}</p><div className="flex w-full overflow-hidden rounded-md [&>div]:min-w-0 [&>div]:flex-1">{tokens.map(v=><ColorField compact key={v.id} label={v.name} value={v.displayValue} onChange={c=>onEdit({[v.id]:colorValue(c,v)})}/>)}</div><p className="text-[11px] text-muted-foreground">Select a step to edit its value.</p></div>}{query&&!matches(base,query)&&<p className="break-words text-xs text-muted-foreground">{tokens.filter(v=>matches(v,query)).map(v=>v.name).join(', ')}</p>}</div>;
    })}</Section>;
  })}{!module.submodules.some(s=>s.label.toLowerCase().includes(query.toLowerCase())||s.variables.some(v=>matches(v,query)))&&<Empty/>}</>;
}
export const TYPE_SCALES=[
  {name:'Minor Second',ratio:1.067,description:'Subtle, nearly linear'},
  {name:'Major Second',ratio:1.125,description:'Smooth, long-form reading'},
  {name:'Minor Third',ratio:1.2,description:'Compact, apps and dashboards',frameworks:'Material Design'},
  {name:'Major Third',ratio:1.25,description:'Balanced, general purpose',frameworks:'Bootstrap · Tailwind · Bulma'},
  {name:'Perfect Fourth',ratio:1.333,description:'Clear contrast between levels'},
  {name:'Augmented Fourth',ratio:1.414,description:'Dramatic, editorial'},
  {name:'Perfect Fifth',ratio:1.5,description:'Strong hierarchy contrast'},
  {name:'Golden Ratio',ratio:1.618,description:'Classic golden proportion'},
];
// Preview specimen text is separate from the exact token name shown in its badge.
function specimen(v: Variable) {
  const text=v.name.match(/^--text-(.+)$/); if(text)return `Text ${text[1]}`;
  const heading=v.name.match(/^h([1-6])(?:-font-size)?$/); if(heading)return `Heading ${heading[1]}`;
  const display=v.name.match(/^display-(\d)$/); if(display)return `Display ${display[1]}`;
  if(['font-size-base','body-size','p'].includes(v.name))return 'Body text default';
  return 'The quick brown fox';
}
export function TypographyPanel({module,query,onEdit,ratio,onRatio,onGenerate,fonts,fontError,fontsLoading,onRetryFonts}:{module:Extract<Module,{module:'typography'}>;query:string;onEdit:PanelProps['onEdit'];ratio:number;onRatio:(n:number)=>void;onGenerate:()=>void;fonts:{family:string;style:string}[];fontError:string;fontsLoading:boolean;onRetryFonts:()=>void}) {
  const id=useId(), vars=variablesOf(module), config=module.configuration;
  const family=vars.find(v=>v.id===config.fontFamily.default)!,base=vars.find(v=>v.id===config.baseSize.default)!,line=vars.find(v=>v.id===config.lineHeight.default)!;
  const selected=TYPE_SCALES.find(s=>s.ratio===ratio)!;
  const steps=vars.filter(v=>config.typeScale.steps.includes(v.id)).sort((a,b)=>pixels(b)-pixels(a));
  const filtered=steps.filter(v=>matches(v,query));
  const roleToken=(v:Variable,suffix:string)=>vars.find(token=>token.id===v.id.replace(/-size$/,suffix));
  const specimenFamily=(v:Variable)=>roleToken(v,'-font')?.displayValue||family.displayValue;
  const specimenLine=(v:Variable)=>{const token=roleToken(v,'-line-height')||line;return token.unit?`${pixels(token)}px`:Number.parseFloat(token.displayValue);};
  return <><Section title="Font Families" icon="format_shapes">{Object.entries(config.fontRoles).map(([role,control])=>{const token=vars.find(v=>v.id===control.token)!;return <FontPicker key={role} label={control.label} value={token.displayValue} disabled={!control.customizable} fonts={fonts} fontError={fontError} fontsLoading={fontsLoading} onRetryFonts={onRetryFonts} onChange={value=>onEdit({[token.id]:value})}/>;})}<p className="text-[11px] text-muted-foreground">All fonts available in Figma. Choose a family to update its token immediately.</p></Section><div className="space-y-4 pb-4">
    <TextValue label="Base Size (px)" value={String(pixels(base))} numeric min={1} onChange={s=>onEdit({[base.id]:`${Number(s)/(base.unit==='rem'||base.unit==='em'?16:1)}${base.unit||''}`})}/>
    <div><label htmlFor={`${id}-ratio`} className="mb-1 block text-sm text-muted-foreground">Type Scale</label><Select value={String(ratio)} onValueChange={v=>onRatio(+v)}><SelectTrigger id={`${id}-ratio`} className={fieldClass}><Icon name="linear_scale" className="text-accent"/><span className="min-w-0 flex-1 truncate text-left">{selected.name} — {ratio.toFixed(3)}</span></SelectTrigger><SelectContent className="w-[320px] max-w-[calc(100vw-16px)] rounded-xl" collisionPadding={8}>{TYPE_SCALES.map(s=><SelectItem key={s.name} value={String(s.ratio)} textValue={s.name} className="min-h-[60px] border-b border-border px-4 py-3 data-[state=checked]:bg-accent data-[state=checked]:text-white"><span className="flex flex-col gap-1"><span>{s.name}<span className="ml-2 opacity-75">{s.ratio.toFixed(3)}</span></span><span className="text-[11px] opacity-80">{s.description}{s.frameworks&&` · ${s.frameworks}`}</span></span></SelectItem>)}</SelectContent></Select></div>
    <TextValue label="Line Height" value={line.displayValue} numeric min={0.1} unit={line.unit} onChange={s=>onEdit({[line.id]:s})}/>
    <button onClick={onGenerate} className="flex min-h-[60px] w-full items-center justify-center gap-2 rounded-lg border border-border bg-card text-sm shadow-[0_5px_12px_#0000001a] hover:bg-secondary active:translate-y-px">Generate scale<Icon name="play_arrow"/></button>
    </div><Section title="Generated scale" icon="article"><div className="divide-y divide-border">{filtered.map(v=><div key={v.id} className="flex min-w-0 items-center gap-3 py-4"><span className="min-w-0 flex-1 truncate leading-[1.2]" style={{fontFamily:specimenFamily(v),fontWeight:Number(roleToken(v,'-weight')?.value)||(/^--text-[2-9]xl$/.test(v.name)?700:/^h[1-6]/.test(v.name)?500:400),fontSize:`${pixels(v)}px`,lineHeight:specimenLine(v)}} title={v.name}>{specimen(v)}</span><div className="flex max-w-[45%] shrink-0 flex-col items-end gap-1 text-right"><span className="text-xs text-muted-foreground">{v.displayValue}</span><span className="max-w-full break-words rounded-sm bg-secondary px-1 text-xs text-accent">{v.name}</span></div></div>)}{!filtered.length&&<Empty/>}</div></Section>
    {module.submodules.filter(s=>s.id!=='sizes').map(sub=>{const list=sub.variables.filter(v=>matches(v,query)&&!Object.values(config.fontRoles).some(r=>r.token===v.id)&&!config.typeScale.steps.includes(v.id)&&![config.baseSize.default,config.lineHeight.default].includes(v.id));return list.length?<Section key={sub.id} title={sub.label} icon={sub.icon} defaultOpen={false}>{list.map(v=><TextValue key={v.id} label={v.name} value={v.displayValue} numeric={v.type==='FLOAT'} unit={v.unit} onChange={s=>onEdit({[v.id]:s})}/>)}</Section>:null;})}</>;
}
export function LayoutPanel({module,original,query,onEdit}:PanelProps) {
  return <>{module.submodules.map(sub=>{
    const list=sub.variables.filter(v=>sub.label.toLowerCase().includes(query.toLowerCase())||matches(v,query));if(!list.length)return null;
    const spacing=['space','spacing'].includes(sub.id), radius=sub.id==='radius', grid=sub.id==='grid';
    const compact=['radius','breakpoints','tokens'].includes(sub.id);
    const originalSub=original.submodules.find(s=>s.id===sub.id)!;
    const max=Math.max(...originalSub.variables.map(v=>pixels(v)),128);
    const spacingBase=spacing ? originalSub.variables.find(v=>pixels(v)===16) || originalSub.variables.find(v=>pixels(v)>0) : undefined;
    const gutter=grid?sub.variables.find(v=>/gutter|gap/i.test(v.name)):undefined;
    return <Section key={sub.id} title={sub.label} icon={sub.icon}>
      {!spacing&&<div className={compact?'grid grid-cols-[repeat(auto-fit,minmax(min(100%,170px),1fr))] gap-3':'space-y-4'}>{list.map(v=><div key={v.id} className="min-w-0"><TextValue compact={compact} label={v.name} value={v.displayValue} numeric={v.type==='FLOAT'} unit={v.unit} onChange={s=>onEdit({[v.id]:s})}/>{radius&&<div className="mt-2 h-8 w-full border border-accent bg-secondary" style={{borderRadius:`${Math.min(pixels(v),9999)}px`}} aria-label={`${v.name} radius preview`}/>}</div>)}</div>}
      {spacing&&<>{spacingBase&&!query&&<TextValue label={`Base Spacing · ${spacingBase.name}`} value={sub.variables.find(v=>v.id===spacingBase.id)!.displayValue} numeric unit={spacingBase.unit} min={0.01} onChange={s=>onEdit(spacingEdits(originalSub.variables,spacingBase,s))}/>}<div className="space-y-2" aria-label="Spacing preview">{list.map(v=><div key={v.id} className="grid grid-cols-[minmax(0,1fr)_minmax(120px,1fr)] items-center gap-2 text-[11px] text-muted-foreground"><span className="block h-2 rounded-sm bg-ring/40" style={{width:`${Math.min(100,Math.max(0,pixels(v)/max*100))}%`}}/><TextValue compact label={v.name} value={v.displayValue} numeric unit={v.unit} onChange={s=>onEdit({[v.id]:s})}/></div>)}</div></>}
      {grid&&list.filter(v=>/col(umn)?s?/i.test(v.name)&&v.unit===undefined).map(v=><div key={v.id} className="grid h-10 gap-1" style={{gridTemplateColumns:`repeat(${Math.max(1,Math.min(24,Math.round(Number(v.value))))},minmax(0,1fr))`,gap:gutter?`${Math.min(12,pixels(gutter)/4)}px`:undefined}} aria-label={`${v.name}: ${v.displayValue} columns preview`}>{Array.from({length:Math.max(1,Math.min(24,Math.round(Number(v.value))))},(_,i)=><span key={i} className="rounded-sm bg-ring/25"/>)}</div>)}
    </Section>;
  })}{!module.submodules.some(s=>s.label.toLowerCase().includes(query.toLowerCase())||s.variables.some(v=>matches(v,query)))&&<Empty/>}</>;
}
function Empty(){return <p role="status" className="py-6 text-center text-sm text-muted-foreground">No tokens found.</p>;}



