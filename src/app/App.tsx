import { useState, useRef, useEffect } from "react";
import svgPaths from "@/imports/PluginMockup-9/svg-hj2e820y6j";
import colorsData from "@/data/colors.json";
import typographyData from "@/data/typography.json";
import layoutData from "@/data/layout.json";

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

type FigmaVarType = "COLOR" | "FLOAT" | "STRING";

interface DSVar {
  id: string;
  module: string;
  submodule: string;
  name: string;
  figmaName: string;
  type: FigmaVarType;
  value: string | number | { r: number; g: number; b: number; a: number };
  unit?: string;
  displayValue: string;
  preview?: string;
  icon?: string;
}

interface Submodule {
  id: string;
  label: string;
  icon: string;
  variables: DSVar[];
}

interface Module {
  module: string;
  label: string;
  tabIcon: string;
  submodules: Submodule[];
}

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

const DATA = [colorsData, typographyData, layoutData] as Module[];

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
      <button onClick={onToggle} className="w-full flex items-center gap-[8px] px-[12px] relative cursor-pointer bg-transparent border-0 text-left" style={{ minHeight: H.section }}>
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

function PluginHeader() {
  return (
    <div className="bg-[#f7f7f8] relative shrink-0 w-full rounded-tl-[16px] rounded-tr-[16px]">
      <div aria-hidden className="absolute border-[rgba(0,0,0,0.08)] border-b border-solid inset-0 pointer-events-none rounded-tl-[16px] rounded-tr-[16px]" />
      <div className="flex items-center gap-[8px] px-[16px] py-[clamp(0.6rem,1.2vw,1rem)]">
        <div className="flex items-center gap-[6px] flex-1 min-w-0">
          <div className="bg-[#0c0c0d] rounded-[4px] shrink-0 flex items-center justify-center" style={{ width: "clamp(1rem, 2vw, 1.5rem)", height: "clamp(1rem, 2vw, 1.5rem)" }}>
            <LogoIcon />
          </div>
          <span className="font-semibold text-[rgba(12,12,13,0.7)] whitespace-nowrap" style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: F.sm }}>DT Boilerplate</span>
        </div>
        <span className="text-[#6e6e80] whitespace-nowrap shrink-0" style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: F.xxs }}>v0.1</span>
      </div>
    </div>
  );
}

function TabBar({ active, onChange }: { active: string; onChange: (id: string) => void }) {
  return (
    <div className="relative shrink-0 w-full">
      <div aria-hidden className="absolute border-[rgba(0,0,0,0.08)] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex items-start w-full">
        {DATA.map((mod) => {
          const isActive = active === mod.module;
          return (
            <button key={mod.module} onClick={() => onChange(mod.module)} className="flex-1 flex flex-col items-center justify-center gap-[0.25em] relative bg-transparent border-0 cursor-pointer py-[clamp(0.5rem,1vw,0.75rem)]" style={{ minHeight: H.tab }}>
              <div aria-hidden className="absolute border-b-2 border-solid inset-0 pointer-events-none" style={{ borderColor: isActive ? "#5e6ad2" : "transparent" }} />
              <MSym name={mod.tabIcon} clampSize={F.ico} color={isActive ? "#5e6ad2" : "#6e6e80"} />
              <span className="font-medium text-center whitespace-nowrap" style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: F.xs, color: isActive ? "#5e6ad2" : "#6e6e80" }}>{mod.label}</span>
            </button>
          );
        })}
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

function PluginFooter({ count, onGenerate }: { count: number; onGenerate: () => void }) {
  return (
    <div className="relative shrink-0 w-full">
      <div aria-hidden className="absolute border-[rgba(0,0,0,0.08)] border-solid border-t inset-0 pointer-events-none" />
      <div className="flex flex-col items-start pb-[12px] pt-[5px] px-[12px]">
        <span className="text-[#6e6e80]" style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: F.xs }}>{count} variables</span>
        <div className="pt-[10px] w-full">
          <button onClick={onGenerate} className="bg-[#0c0c0d] rounded-[8px] w-full flex items-center justify-center gap-[6px] cursor-pointer border-0 hover:bg-[#1a1a1b] transition-colors" style={{ minHeight: H.btn }}>
            <GenerateSvgIcon />
            <span className="font-semibold text-[#fafafa] whitespace-nowrap" style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: F.sm }}>Generate Variables</span>
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
  const [activeTab, setActiveTab] = useState("colors");
  const [query, setQuery] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});
  const [showUnlockModal, setShowUnlockModal] = useState(false);

  const activeModule = DATA.find((m) => m.module === activeTab)!;
  const totalVars = DATA.reduce((acc, module) => acc + module.submodules.reduce((subAcc, s) => subAcc + s.variables.length, 0), 0);

  const handleTabChange = (id: string) => {
    setActiveTab(id);
    setQuery("");
  };

  const handleValueChange = (key: string, val: string) => {
    setValues((prev) => ({ ...prev, [key]: val }));
  };

  const getVariablePayload = (): VariablePayload[] => {
    return DATA.flatMap((module) =>
      module.submodules.flatMap((submodule) =>
        submodule.variables.map((v) => {
          const editedValue = values[v.id];
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

  return (
    <div className="w-screen h-screen flex flex-col overflow-hidden bg-white">
      <div aria-hidden className="absolute border border-[rgba(0,0,0,0.08)] border-solid inset-0 pointer-events-none z-10" />
      <PluginHeader />
      <TabBar active={activeTab} onChange={handleTabChange} />

      <GlobalSearch value={query} onChange={setQuery} />

      <div className="flex-1 overflow-y-auto min-h-0 bg-white flex flex-col">
        <ModulePanel
          key={activeTab}
          module={activeModule}
          query={query}
          values={values}
          onValueChange={handleValueChange}
        />
      </div>

      <PluginFooter count={totalVars} onGenerate={handleGenerateVariables} />
      
      {showUnlockModal && (
        <UnlockModal
          onUnlock={handleUnlock}
          onCancel={() => setShowUnlockModal(false)}
        />
      )}
    </div>
  );
}
