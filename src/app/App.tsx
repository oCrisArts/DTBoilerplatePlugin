import { useState, useRef, useEffect } from "react";
import svgPaths from "@/imports/PluginMockup-9/svg-hj2e820y6j";
import { loadPreset, catalog } from "@/data/preset-loader";
import type { Module, Submodule, Variable as DSVar, VariableType as FigmaVarType, Preset } from "@/data/preset-contract/types";

// ── SVG icons from design ─────────────────────────────────────────────────────

function LogoIcon() {
  return (
    <div className="relative shrink-0 size-[9px]">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 9 9">
        <g clipPath="url(#logo-clip)">
          <path d={svgPaths.p3542e280} stroke="#FAFAFA" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.75" />
          <path d={svgPaths.p15348c00} stroke="#FAFAFA" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.75" />
          <path d={svgPaths.p3defb690} stroke="#FAFAFA" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.75" />
        </g>
        <defs><clipPath id="logo-clip"><rect fill="white" height="9" width="9" /></clipPath></defs>
      </svg>
    </div>
  );
}

function SearchSvgIcon() {
  return (
    <div className="relative shrink-0 size-[10px]">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10 10">
        <g clipPath="url(#search-clip)">
          <path d={svgPaths.p1e4f3d00} stroke="#6E6E80" strokeWidth="0.9375" />
          <path d="M6.5625 6.5625L8.75 8.75" stroke="#6E6E80" strokeLinecap="round" strokeWidth="0.9375" />
        </g>
        <defs><clipPath id="search-clip"><rect fill="white" height="10" width="10" /></clipPath></defs>
      </svg>
    </div>
  );
}

function GenerateSvgIcon() {
  return (
    <div className="relative shrink-0 size-[11px]">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 11 11">
        <g clipPath="url(#gen-clip)">
          <path d={svgPaths.p1a7a3080} stroke="#FAFAFA" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.916667" />
        </g>
        <defs><clipPath id="gen-clip"><rect fill="white" height="11" width="11" /></clipPath></defs>
      </svg>
    </div>
  );
}

// ── Responsive font scale ─────────────────────────────────────────────────────

const F = {
  xxs:  "clamp(0.8125rem, 1.1vw, 1rem)",
  xs:   "clamp(0.875rem,  1.3vw, 1.125rem)",
  sm:   "clamp(1rem,      1.5vw, 1.25rem)",
  ico_xs: "clamp(1.125rem, 1.8vw, 1.5rem)",
  ico:    "clamp(1.375rem, 2.2vw, 1.875rem)",
} as const;

const H = {
  row:    "clamp(2.75rem, 4.5vw, 3.75rem)",
  section:"clamp(3rem,    4.8vw, 4rem)",
  tab:    "clamp(3.25rem, 5vw,   4.25rem)",
  search: "clamp(2.75rem, 4.5vw, 3.75rem)",
  btn:    "clamp(2.75rem, 4.5vw, 3.75rem)",
  swatch: "clamp(1.5rem,  2.5vw, 2rem)",
} as const;

// ── Material Symbol helper ────────────────────────────────────────────────────

function MSym({ name, clampSize = F.ico, color = "#6e6e80" }: { name: string; clampSize?: string; color?: string }) {
  return (
    <span
      style={{
        fontFamily: "'Material Symbols Outlined'",
        fontSize: clampSize,
        color,
        fontVariationSettings: '"FILL" 0, "GRAD" 0, "opsz" 24',
        lineHeight: 1,
        display: "inline-flex",
        alignItems: "center",
        userSelect: "none",
        flexShrink: 0,
      }}
    >
      {name}
    </span>
  );
}

// ── Data model ────────────────────────────────────────────────────────────────

interface VariablePayload {
  id: string;
  module: string;
  submodule: string;
  name: string;
  figmaName: string;
  value: string | number | { r: number; g: number; b: number; a: number };
  type: FigmaVarType;
  displayValue: string;
  unit?: string;
  preview?: string;
  icon?: string;
}

type Screen = 'preset-selector' | 'colors' | 'typography' | 'layout';

interface PresetState {
  preset: Preset;
  modules: Module[];
}

// ── Components ────────────────────────────────────────────────────────────────

function ColorTokenRow({ v, onValueChange }: { v: DSVar; onValueChange: (name: string, val: string) => void; }) {
  const [hovered, setHovered] = useState(false);
  const colorInputRef = useRef<HTMLInputElement>(null);

  const toHex = (raw: string): string => {
    const s = raw.trim();
    if (/^#[0-9a-fA-F]{6}$/.test(s)) return s;
    if (/^#[0-9a-fA-F]{3}$/.test(s)) {
      const [, r, g, b] = s.match(/^#(.)(.)(.)$/)!;
      return `#${r}${r}${g}${g}${b}${b}`;
    }
    const m = s.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (m) return "#" + [m[1], m[2], m[3]].map((n) => parseInt(n).toString(16).padStart(2, "0")).join("");
    return "#000000";
  };

  const displayColor = v.preview ?? v.displayValue;

  return (
    <div
      className="relative rounded-[6px] shrink-0 w-full cursor-pointer flex items-center"
      style={{
        minHeight: H.row,
        background: hovered ? "#f2f2f4" : "transparent",
        transition: "background 0.1s",
        gap: "clamp(0.5rem, 1vw, 0.75rem)",
        paddingLeft: "clamp(0.5rem, 1.2vw, 0.75rem)",
        paddingRight: "clamp(0.5rem, 1.2vw, 0.75rem)",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => colorInputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          colorInputRef.current?.click();
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`Edit color ${v.name}`}
    >
      <div className="relative rounded-[4px] shrink-0" style={{ width: H.swatch, height: H.swatch, background: displayColor }}>
        <div aria-hidden className="absolute border border-[rgba(0,0,0,0.05)] border-solid inset-0 pointer-events-none rounded-[4px]" />
        <input
          ref={colorInputRef}
          type="color"
          value={toHex(v.displayValue)}
          onChange={(e) => onValueChange(v.id, e.target.value)}
          onClick={(e) => e.stopPropagation()}
          className="absolute opacity-0 inset-0 w-full h-full cursor-pointer"
          style={{ padding: 0, border: 0 }}
          title={`Set value for ${v.name}`}
          aria-label={`Color picker for ${v.name}`}
        />
      </div>
      <span className="flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-[#0c0c0d] not-italic" style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: F.xs }}>
        {v.name}
      </span>
      {hovered && (
        <span className="shrink-0 rounded-[4px] bg-white border border-[rgba(0,0,0,0.08)] text-[#6e6e80] whitespace-nowrap" style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: F.xxs, lineHeight: 1.4, padding: "0.15em 0.45em" }}>
          {v.displayValue}
        </span>
      )}
    </div>
  );
}

function GenericTokenRow({ v, onValueChange }: { v: DSVar; onValueChange: (name: string, val: string) => void; }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(v.displayValue);
  const [hovered, setHovered] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  const commit = () => { onValueChange(v.id, draft); setEditing(false); };

  return (
    <div
      className="relative flex items-center rounded-[6px] cursor-pointer"
      style={{
        minHeight: H.row,
        gap: "clamp(0.5rem, 1vw, 0.75rem)",
        paddingLeft: "clamp(0.5rem, 1.2vw, 0.75rem)",
        paddingRight: "clamp(0.5rem, 1.2vw, 0.75rem)",
        background: hovered ? "#f2f2f4" : "transparent",
        transition: "background 0.1s",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => !editing && setEditing(true)}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !editing) {
          e.preventDefault();
          setEditing(true);
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`Edit ${v.name}`}
    >
      <div className="relative rounded-[4px] shrink-0 flex items-center justify-center" style={{ width: H.swatch, height: H.swatch }}>
        <div aria-hidden className="absolute border border-[rgba(0,0,0,0.05)] border-solid inset-0 pointer-events-none rounded-[4px]" />
        {v.icon && <MSym name={v.icon} clampSize={F.ico_xs} color="#0c0c0d" />}
      </div>
      <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-[#0c0c0d]" style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: F.xs }}>
        {v.name}
      </span>
      {editing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") { setDraft(v.displayValue); setEditing(false); }
          }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white border border-[#5e6ad2] rounded-[4px] text-[#0c0c0d] outline-none shrink-0"
          style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: F.xs, width: "clamp(5rem, 10vw, 8rem)", padding: "0.2em 0.5em" }}
          aria-label={`Edit value for ${v.name}`}
        />
      ) : hovered ? (
        <span className="shrink-0 rounded-[4px] bg-white border border-[rgba(0,0,0,0.08)] text-[#6e6e80] whitespace-nowrap" style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: F.xxs, lineHeight: 1.4, padding: "0.15em 0.45em" }}>
          {v.displayValue}
        </span>
      ) : null}
    </div>
  );
}

function SubmoduleSection({ moduleId, sub, isOpen, onToggle, query, values, onValueChange, isColorModule }: { moduleId: string; sub: Submodule; isOpen: boolean; onToggle: () => void; query: string; values: Record<string, string>; onValueChange: (name: string, val: string) => void; isColorModule: boolean; }) {
  const filtered = sub.variables.filter((v) => !query || v.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="bg-[#fafafa] shrink-0 w-full">
      <button 
        onClick={onToggle} 
        className="w-full flex items-center gap-[8px] px-[12px] relative cursor-pointer bg-transparent border-0 text-left" 
        style={{ minHeight: H.section }}
        aria-expanded={isOpen}
      >
        <div aria-hidden className="absolute border-[#eee6e6] border-solid border-t inset-0 pointer-events-none" />
        <MSym name={sub.icon} clampSize={F.ico_xs} color={isOpen ? "#5e6ad2" : "#6e6e80"} />
        <span className="flex-1 font-medium whitespace-nowrap" style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: F.xs, color: isOpen ? "#5e6ad2" : "#6e6e80" }}>{sub.label}</span>
        <MSym name={isOpen ? "expand_less" : "expand_more"} clampSize={F.ico} color={isOpen ? "#5e6ad2" : "#6e6e80"} />
      </button>

      {isOpen && (
        <div className="overflow-y-auto px-[12px] pb-[8px] flex flex-col" style={{ maxHeight: "clamp(14rem, 35vh, 26rem)" }}>
          {filtered.length === 0 ? (
            <p className="text-center text-[#6e6e80] py-[10px]" style={{ fontSize: F.xs }}>No tokens found</p>
          ) : (
            filtered.map((v) => {
              const currentDisplayValue = values[v.id] ?? v.displayValue;
              const current = { ...v, displayValue: currentDisplayValue, preview: v.type === "COLOR" ? currentDisplayValue : v.preview };
              return (v.type === "COLOR" && isColorModule) ? (
                <ColorTokenRow key={v.id} v={current} onValueChange={onValueChange} />
              ) : (
                <GenericTokenRow key={v.id} v={current} onValueChange={onValueChange} />
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

function ModulePanel({ module, query, values, onValueChange }: { module: Module; query: string; values: Record<string, string>; onValueChange: (key: string, val: string) => void; }) {
  const [openId, setOpenId] = useState<string>(module.submodules[0]?.id ?? "");
  const toggle = (id: string) => setOpenId((prev) => (prev === id ? "" : id));
  const isColorModule = module.module === "colors";

  return (
    <div className="flex flex-col w-full">
      {module.submodules.map((sub) => (
        <SubmoduleSection key={sub.id} moduleId={module.module} sub={sub} isOpen={openId === sub.id} onToggle={() => toggle(sub.id)} query={query} values={values} onValueChange={onValueChange} isColorModule={isColorModule} />
      ))}
    </div>
  );
}

function TypographyConfigPanel({ 
  configuration, 
  variables, 
  values, 
  onValueChange, 
  onGenerateScale 
}: { 
  configuration: any; 
  variables: DSVar[]; 
  values: Record<string, string>; 
  onValueChange: (key: string, val: string) => void; 
  onGenerateScale: () => void;
}) {
  const getVariableById = (id: string) => variables.find(v => v.id === id);
  
  const renderSelectField = (label: string, configKey: string) => {
    const config = configuration[configKey];
    if (!config || !config.default) return null;
    
    const defaultVar = getVariableById(config.default);
    const currentValue = values[config.default] ?? defaultVar?.displayValue;
    const options = config.options || [config.default];
    
    return (
      <div className="mb-4">
        <label className="block text-[#0c0c0d] font-medium mb-2" style={{ fontSize: F.xs }}>
          {label}
        </label>
        <select
          value={config.default}
          onChange={(e) => onValueChange(config.default, e.target.value)}
          className="w-full bg-white border border-[rgba(0,0,0,0.08)] rounded-[6px] px-3 py-2 outline-none text-[#0c0c0d] focus:border-[#5e6ad2] transition-colors"
          style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: F.xs }}
          aria-label={label}
        >
          {options.map((optId: string) => {
            const optVar = getVariableById(optId);
            return (
              <option key={optId} value={optId}>
                {optVar?.name || optId}
              </option>
            );
          })}
        </select>
      </div>
    );
  };

  const renderInputField = (label: string, configKey: string) => {
    const config = configuration[configKey];
    if (!config || !config.default) return null;
    
    const defaultVar = getVariableById(config.default);
    const currentValue = values[config.default] ?? defaultVar?.displayValue;
    
    return (
      <div className="mb-4">
        <label className="block text-[#0c0c0d] font-medium mb-2" style={{ fontSize: F.xs }}>
          {label}
        </label>
        <input
          type="text"
          value={currentValue}
          onChange={(e) => onValueChange(config.default, e.target.value)}
          className="w-full bg-white border border-[rgba(0,0,0,0.08)] rounded-[6px] px-3 py-2 outline-none text-[#0c0c0d] focus:border-[#5e6ad2] transition-colors"
          style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: F.xs }}
          aria-label={label}
        />
      </div>
    );
  };

  return (
    <div className="px-[16px] py-[12px]">
      <h3 className="text-[#0c0c0d] font-semibold mb-4" style={{ fontSize: F.sm }}>
        Typography Configuration
      </h3>
      
      {renderSelectField("Font Family", "fontFamily")}
      {renderInputField("Base Size", "baseSize")}
      
      {configuration.typeScale && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-[#0c0c0d] font-medium" style={{ fontSize: F.xs }}>
              Type Scale
            </label>
            <button
              onClick={onGenerateScale}
              className="bg-[#5e6ad2] text-white px-3 py-1 rounded-[4px] text-xs font-medium hover:bg-[#4a5bc7] transition-colors"
              style={{ fontFamily: "'Source Sans 3', sans-serif" }}
              aria-label="Generate type scale"
            >
              Generate scale
            </button>
          </div>
          <div className="bg-[#f7f7f8] rounded-[6px] p-3">
            <p className="text-[#6e6e80]" style={{ fontSize: F.xs }}>
              {configuration.typeScale.steps.length} scale steps defined
            </p>
          </div>
        </div>
      )}
      
      {renderSelectField("Line Height", "lineHeight")}
    </div>
  );
}

function LayoutConfigPanel({ 
  capabilities, 
  module, 
  values, 
  onValueChange 
}: { 
  capabilities: any; 
  module: Module; 
  values: Record<string, string>; 
  onValueChange: (key: string, val: string) => void; 
}) {
  const capabilityMap: Record<string, string> = {
    grid: 'grid',
    breakpoints: 'breakpoints', 
    spacing: 'space',
    radius: 'radius',
    tokens: 'tokens'
  };

  const enabledSubmodules = module.submodules.filter(sub => {
    const capabilityKey = Object.keys(capabilityMap).find(key => capabilityMap[key] === sub.id);
    return capabilityKey && capabilities[capabilityKey];
  });

  return (
    <div className="flex flex-col w-full">
      {enabledSubmodules.length === 0 ? (
        <div className="px-[16px] py-[12px]">
          <p className="text-[#6e6e80] text-center" style={{ fontSize: F.xs }}>
            No layout capabilities available for this preset.
          </p>
        </div>
      ) : (
        enabledSubmodules.map((sub) => (
          <SubmoduleSection 
            key={sub.id} 
            moduleId={module.module} 
            sub={sub} 
            isOpen={true} 
            onToggle={() => {}} 
            query="" 
            values={values} 
            onValueChange={onValueChange} 
            isColorModule={false} 
          />
        ))
      )}
    </div>
  );
}

function PluginHeader({ title, onBack }: { title?: string; onBack?: () => void }) {
  return (
    <div className="bg-[#f7f7f8] relative shrink-0 w-full rounded-tl-[16px] rounded-tr-[16px]">
      <div aria-hidden className="absolute border-[rgba(0,0,0,0.08)] border-b border-solid inset-0 pointer-events-none rounded-tl-[16px] rounded-tr-[16px]" />
      <div className="flex items-center gap-[8px] px-[16px] py-[clamp(0.6rem,1.2vw,1rem)]">
        <div className="flex items-center gap-[6px] flex-1 min-w-0">
          {onBack && (
            <button onClick={onBack} className="bg-transparent border-0 cursor-pointer p-0 mr-2 flex items-center justify-center" style={{ width: "clamp(1rem, 2vw, 1.5rem)", height: "clamp(1rem, 2vw, 1.5rem)" }}>
              <MSym name="arrow_back" clampSize={F.ico_xs} color="#6e6e80" />
            </button>
          )}
          <div className="bg-[#0c0c0d] rounded-[4px] shrink-0 flex items-center justify-center" style={{ width: "clamp(1rem, 2vw, 1.5rem)", height: "clamp(1rem, 2vw, 1.5rem)" }}>
            <LogoIcon />
          </div>
          <span className="font-semibold text-[rgba(12,12,13,0.7)] whitespace-nowrap" style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: F.sm }}>
            {title || "DT Boilerplate"}
          </span>
        </div>
        <span className="text-[#6e6e80] whitespace-nowrap shrink-0" style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: F.xxs }}>v0.1</span>
      </div>
    </div>
  );
}

function PresetSelector({ onSelectPreset }: { onSelectPreset: (presetId: string) => void }) {
  return (
    <div className="flex flex-col w-full h-full">
      <div className="flex-1 overflow-y-auto px-[16px] py-[12px]">
        <h2 className="text-[#0c0c0d] font-semibold mb-3" style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: F.sm }}>
          Choose a preset
        </h2>
        <p className="text-[#6e6e80] mb-6" style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: F.xs, lineHeight: 1.45 }}>
          Select a framework preset to start configuring your design system variables.
        </p>
        
        <div className="flex flex-col gap-3">
          {catalog.presets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => onSelectPreset(preset.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectPreset(preset.id);
                }
              }}
              className="relative bg-white border border-[rgba(0,0,0,0.08)] rounded-[8px] p-4 cursor-pointer hover:border-[#5e6ad2] transition-colors text-left"
              tabIndex={0}
              aria-label={`Select ${preset.name} preset`}
            >
              <div className="flex items-center gap-3">
                <div className="bg-[#f7f7f8] rounded-[6px] flex items-center justify-center shrink-0" style={{ width: "clamp(2rem, 4vw, 2.5rem)", height: "clamp(2rem, 4vw, 2.5rem)" }}>
                  <MSym name="grid_view" clampSize={F.ico} color="#6e6e80" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[#0c0c0d] font-semibold mb-1" style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: F.sm }}>
                    {preset.name}
                  </h3>
                  <p className="text-[#6e6e80] truncate" style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: F.xs }}>
                    Official framework defaults
                  </p>
                </div>
                <MSym name="chevron_right" clampSize={F.ico_xs} color="#6e6e80" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function GlobalSearch({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="shrink-0 p-[12px] w-full">
      <div className="bg-[#f2f2f4] rounded-[6px] flex items-center gap-[8px] px-[10px] w-full" style={{ minHeight: H.search }}>
        <SearchSvgIcon />
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder="Search tokens…" className="bg-transparent border-0 outline-none flex-1 min-w-0 text-[#0c0c0d] placeholder:text-[rgba(110,110,128,0.5)]" style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: F.xs }} />
        {value && <button onClick={() => onChange("")} className="text-[#6e6e80] bg-transparent border-0 cursor-pointer p-0 leading-none" style={{ fontSize: F.sm }}>×</button>}
      </div>
    </div>
  );
}

function ProgressStepper({ currentStep, totalSteps, onStepClick }: { currentStep: number; totalSteps: number; onStepClick: (step: number) => void }) {
  const steps = ['Colors', 'Typography', 'Layout'];
  
  return (
    <div className="relative shrink-0 w-full">
      <div aria-hidden className="absolute border-[rgba(0,0,0,0.08)] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex items-start w-full">
        {steps.map((step, index) => {
          const isActive = currentStep === index;
          const isCompleted = currentStep > index;
          const canNavigate = isCompleted || currentStep === index;
          return (
            <button 
              key={step} 
              onClick={() => canNavigate && onStepClick(index)}
              disabled={!canNavigate}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  if (canNavigate) onStepClick(index);
                }
              }}
              className="flex-1 flex flex-col items-center justify-center gap-[0.25em] relative bg-transparent border-0 cursor-pointer py-[clamp(0.5rem,1vw,0.75rem)] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#5e6ad2] focus:ring-inset"
              style={{ minHeight: H.tab }}
              aria-label={`Go to ${step} step`}
              aria-current={isActive ? 'step' : undefined}
            >
              <div aria-hidden className="absolute border-b-2 border-solid inset-0 pointer-events-none" style={{ borderColor: isActive ? "#5e6ad2" : "transparent" }} />
              <div className="flex items-center justify-center rounded-full" style={{ 
                width: "clamp(1.2rem, 2vw, 1.5rem)", 
                height: "clamp(1.2rem, 2vw, 1.5rem)",
                background: isActive ? "#5e6ad2" : isCompleted ? "#0c0c0d" : "transparent",
                border: "1px solid #6e6e80"
              }}>
                {isCompleted ? (
                  <MSym name="check" clampSize={F.ico_xs} color="white" />
                ) : (
                  <span style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: F.xxs, color: isActive ? "white" : "#6e6e80" }}>
                    {index + 1}
                  </span>
                )}
              </div>
              <span className="font-medium text-center whitespace-nowrap" style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: F.xs, color: isActive ? "#5e6ad2" : isCompleted ? "#0c0c0d" : "#6e6e80" }}>{step}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PluginFooter({ count, onGenerate }: { count: number; onGenerate: () => void }) {
  return (
    <div className="relative shrink-0 w-full">
      <div aria-hidden className="absolute border-[rgba(0,0,0,0.08)] border-solid border-t inset-0 pointer-events-none" />
      <div className="flex flex-col items-start pb-[12px] pt-[5px] px-[12px]">
        <span className="text-[#6e6e80]" style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: F.xs }}>{count} variables</span>
        <div className="pt-[10px] w-full">
          <button onClick={onGenerate} className="bg-[#0c0c0d] rounded-[8px] w-full flex items-center justify-center gap-[6px] cursor-pointer border-0 hover:bg-[#1a1a1b] transition-colors" style={{ minHeight: H.btn }}>
            <GenerateSvgIcon />
            <span className="font-semibold text-[#fafafa] whitespace-nowrap" style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: F.sm }}>Generate {count} variables</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmSwitchModal({ 
  currentPreset, 
  newPreset, 
  onConfirm, 
  onCancel 
}: { 
  currentPreset: string; 
  newPreset: string; 
  onConfirm: () => void; 
  onCancel: () => void;
}) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 backdrop-blur-sm px-[24px]">
      <div className="bg-white rounded-[16px] shadow-lg border border-gray-200 w-full max-w-md p-6" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="m-0 text-[#0c0c0d] font-semibold" style={{ fontSize: F.sm }}>Switch Preset?</h2>
          <button 
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700 transition-colors bg-transparent border-0 cursor-pointer"
          >
            <MSym name="close" clampSize={F.ico} color="#6e6e80" />
          </button>
        </div>

        <p className="text-[#6e6e80] mb-6" style={{ fontSize: F.xs, lineHeight: 1.45 }}>
          You have unsaved changes in <strong>{currentPreset}</strong>. Switching to <strong>{newPreset}</strong> will discard these changes. Do you want to continue?
        </p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 bg-[#f7f7f8] border border-gray-200 rounded-lg py-3 text-[#0c0c0d] font-semibold hover:bg-[#e5e5e7] transition-colors"
            style={{ fontSize: F.sm }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-[#0c0c0d] rounded-lg py-3 text-[#fafafa] font-semibold hover:bg-[#1a1a1b] transition-colors"
            style={{ fontSize: F.sm }}
          >
            Switch Preset
          </button>
        </div>
      </div>
    </div>
  );
}

function UnlockModal({
  onUnlock,
  onCancel
}: {
  onUnlock: (email: string, plan: string) => void;
  onCancel: () => void;
}) {
  const [email, setEmail] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "lifetime">("monthly");

  const handleSubmit = () => {
    if (!email.trim()) return;
    onUnlock(email.trim(), selectedPlan);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  const planPrice = selectedPlan === "monthly" ? "$5.99" : "$49.99";

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 backdrop-blur-sm px-[24px]">
      <div className="bg-white rounded-[16px] shadow-lg border border-gray-200 w-full max-w-md p-6" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <h2 className="m-0 text-[#0c0c0d] font-semibold text-center flex-1" style={{ fontSize: F.sm }}>Unlock DT Boilerplate</h2>
          <div className="w-6"></div>
        </div>

        {/* Copy */}
        <p className="text-[#6e6e80] text-center mb-6" style={{ fontSize: F.xs, lineHeight: 1.45 }}>
          You have already used the free token generation. Unlock unlimited token generation and future updates.
        </p>

        {/* Pricing Cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {/* Monthly Plan */}
          <button
            onClick={() => setSelectedPlan("monthly")}
            className={`border rounded-lg p-4 text-left transition-all ${
              selectedPlan === "monthly" 
                ? "border-[#5e6ad2] bg-[#f0f2ff]" 
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <span className="text-[#0c0c0d] font-semibold" style={{ fontSize: F.sm }}>$5.99</span>
              <span className="bg-[#5e6ad2] text-white text-xs px-2 py-0.5 rounded-full font-medium">Save 20%</span>
            </div>
            <div className="text-[#6e6e80]" style={{ fontSize: F.xs }}>/ month</div>
          </button>

          {/* Lifetime Plan */}
          <button
            onClick={() => setSelectedPlan("lifetime")}
            className={`border rounded-lg p-4 text-left transition-all ${
              selectedPlan === "lifetime" 
                ? "border-[#5e6ad2] bg-[#f0f2ff]" 
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="text-[#0c0c0d] font-semibold mb-1" style={{ fontSize: F.sm }}>$49.99</div>
            <div className="text-[#6e6e80]" style={{ fontSize: F.xs }}>/ Lifetime</div>
          </button>
        </div>

        {/* Benefits List */}
        <div className="space-y-2 mb-6">
          {[
            "Unlimited Generations",
            "Future Updates",
            "New Updates",
            "Priority Support"
          ].map((benefit) => (
            <div key={benefit} className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span className="text-[#0c0c0d]" style={{ fontSize: F.xs }}>{benefit}</span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="space-y-3">
          <div className="space-y-3">
            <label className="block text-[#0c0c0d] font-medium mb-2" style={{ fontSize: F.xs }}>Email</label>
            <input
              type="email"
              placeholder="Insert your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-[#f7f7f8] border border-gray-200 rounded-lg px-4 py-3 outline-none text-[#0c0c0d] placeholder:text-gray-400 focus:border-[#5e6ad2] transition-colors"
              style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: F.xs }}
            />
          </div>
          <button 
            onClick={handleSubmit} 
            disabled={!email.trim()}
            className="w-full bg-[#0c0c0d] rounded-lg py-3 text-[#fafafa] font-semibold hover:bg-[#1a1a1b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ fontSize: F.sm }}
          >
            Unlock Now {planPrice}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('preset-selector');
  const [currentStep, setCurrentStep] = useState(0);
  const [query, setQuery] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [showConfirmSwitch, setShowConfirmSwitch] = useState(false);
  const [pendingPresetId, setPendingPresetId] = useState<string | null>(null);
  const [generatedScale, setGeneratedScale] = useState<Record<string, string>>({});
  
  const [presetState, setPresetState] = useState<PresetState>(() => {
    const loaded = loadPreset(catalog.defaultPreset);
    return {
      preset: loaded.preset,
      modules: loaded.modules
    };
  });

  const activeModule = presetState.modules.find((m) => m.module === ['colors', 'typography', 'layout'][currentStep]);
  const totalVars = presetState.modules.reduce((acc, module) => acc + module.submodules.reduce((subAcc, s) => subAcc + s.variables.length, 0), 0);
  const hasUnsavedChanges = Object.keys(values).length > 0 || Object.keys(generatedScale).length > 0;

  const handlePresetSelect = (presetId: string) => {
    if (hasUnsavedChanges && presetState.preset.id !== presetId) {
      setPendingPresetId(presetId);
      setShowConfirmSwitch(true);
    } else {
      loadPresetData(presetId);
    }
  };

  const loadPresetData = (presetId: string) => {
    const loaded = loadPreset(presetId);
    setPresetState({
      preset: loaded.preset,
      modules: loaded.modules
    });
    setValues({});
    setGeneratedScale({});
    setCurrentScreen('colors');
    setCurrentStep(0);
    setQuery("");
  };

  const handleStepChange = (step: number) => {
    if (step <= currentStep) {
      setCurrentStep(step);
      setQuery("");
    }
  };

  const handleNextStep = () => {
    if (currentStep < 2) {
      setCurrentStep(prev => prev + 1);
      setQuery("");
    }
  };

  const handleBackToSelector = () => {
    if (hasUnsavedChanges) {
      setPendingPresetId(null);
      setShowConfirmSwitch(true);
    } else {
      setCurrentScreen('preset-selector');
    }
  };

  const handleConfirmSwitch = () => {
    setShowConfirmSwitch(false);
    if (pendingPresetId) {
      loadPresetData(pendingPresetId);
      setPendingPresetId(null);
    } else {
      setCurrentScreen('preset-selector');
    }
  };

  const handleValueChange = (key: string, val: string) => {
    setValues((prev) => ({ ...prev, [key]: val }));
  };

  const handleGenerateScale = () => {
    const typographyModule = presetState.modules.find(m => m.module === 'typography');
    if (!typographyModule) return;
    
    const config = typographyModule.configuration;
    if (!config?.typeScale?.steps) return;
    
    // Calculate scale based on base size and type scale steps
    const baseSizeConfig = config.baseSize;
    const baseSizeVar = typographyModule.submodules
      .flatMap(s => s.variables)
      .find(v => v.id === baseSizeConfig?.default);
    
    if (!baseSizeVar) return;
    
    const baseSize = parseFloat(baseSizeVar.displayValue) || 16;
    const scale = [1, 1.2, 1.44, 1.728, 2.074, 2.488, 2.986, 3.583, 4.3, 5.16, 6.19]; // Common major third scale
    
    const newScaleValues: Record<string, string> = {};
    config.typeScale.steps.forEach((stepId: string, index: number) => {
      const size = (baseSize * scale[index % scale.length]).toFixed(1);
      newScaleValues[stepId] = `${size}px`;
    });
    
    setGeneratedScale(newScaleValues);
    setValues(prev => ({ ...prev, ...newScaleValues }));
  };

  const getVariablePayload = (): VariablePayload[] => {
    return presetState.modules.flatMap((module) =>
      module.submodules.flatMap((submodule) =>
        submodule.variables.map((v) => {
          const editedValue = values[v.id] || generatedScale[v.id];
          const value = editedValue ?? v.value;
          const displayValue = editedValue ?? v.displayValue;

          return {
            id: v.id,
            module: module.module,
            submodule: submodule.id,
            name: v.name,
            figmaName: v.figmaName,
            value,
            type: v.type,
            displayValue,
            unit: v.unit,
            preview: editedValue && v.type === "COLOR" ? editedValue : v.preview,
            icon: v.icon,
          };
        })
      )
    );
  };

  const handleGenerateVariables = () => {
    parent.postMessage(
      {
        pluginMessage: {
          type: "generate-variables",
          tokens: getVariablePayload(),
          presetName: presetState.preset.metadata.name,
        },
      },
      "*"
    );
  };

  const handleUnlock = (email: string, plan: string) => {
    parent.postMessage(
      {
        pluginMessage: {
          type: "process-unlock",
          email,
          plan
        },
      },
      "*"
    );
  };

  useEffect(() => {
    const handlePluginMessage = (event: MessageEvent) => {
      const message = event.data?.pluginMessage;

      if (message?.type === "unlock-required") {
        setShowUnlockModal(true);
      }
      if (message?.type === "purchase-restored") {
        setShowUnlockModal(false);
      }
      if (message?.type === "redirected-to-checkout") {
        setShowUnlockModal(false);
      }
    };

    window.addEventListener("message", handlePluginMessage);
    return () => window.removeEventListener("message", handlePluginMessage);
  }, []);

  const getHeaderTitle = () => {
    if (currentScreen === 'preset-selector') return "DT Boilerplate";
    return presetState.preset.metadata.name;
  };

  return (
    <div className="w-[420px] h-[747px] flex flex-col overflow-hidden bg-white">
      <div aria-hidden className="absolute border border-[rgba(0,0,0,0.08)] border-solid inset-0 pointer-events-none z-10" />
      <PluginHeader 
        title={getHeaderTitle()} 
        onBack={currentScreen !== 'preset-selector' ? handleBackToSelector : undefined} 
      />

      {currentScreen === 'preset-selector' ? (
        <PresetSelector onSelectPreset={handlePresetSelect} />
      ) : (
        <>
          <ProgressStepper currentStep={currentStep} totalSteps={3} onStepClick={handleStepChange} />
          <GlobalSearch value={query} onChange={setQuery} />

          <div className="flex-1 overflow-y-auto min-h-0 bg-white flex flex-col">
            {activeModule && currentStep === 1 && activeModule.module === 'typography' ? (
              <TypographyConfigPanel
                configuration={activeModule.configuration}
                variables={activeModule.submodules.flatMap(s => s.variables)}
                values={values}
                onValueChange={handleValueChange}
                onGenerateScale={handleGenerateScale}
              />
            ) : currentStep === 2 && activeModule.module === 'layout' ? (
              <LayoutConfigPanel
                capabilities={presetState.preset.capabilities.layout}
                module={activeModule}
                values={values}
                onValueChange={handleValueChange}
              />
            ) : (
              <ModulePanel
                key={currentStep}
                module={activeModule}
                query={query}
                values={values}
                onValueChange={handleValueChange}
              />
            )}
          </div>

          <PluginFooter count={totalVars} onGenerate={handleGenerateVariables} />
        </>
      )}
      
      {showConfirmSwitch && (
        <ConfirmSwitchModal
          currentPreset={presetState.preset.metadata.name}
          newPreset={pendingPresetId ? catalog.presets.find(p => p.id === pendingPresetId)?.name || 'new preset' : 'preset selector'}
          onConfirm={handleConfirmSwitch}
          onCancel={() => setShowConfirmSwitch(false)}
        />
      )}
      
      {showUnlockModal && (
        <UnlockModal
          onUnlock={handleUnlock}
          onCancel={() => setShowUnlockModal(false)}
        />
      )}
    </div>
  );
}
