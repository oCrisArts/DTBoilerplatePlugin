import { useState, useRef, useEffect } from "react";
import svgPaths from "@/imports/PluginMockup-9/svg-hj2e820y6j";

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
// All text targets ≥ 16 px, fluid between viewport breakpoints.

const F = {
  // general text
  xxs:  "clamp(0.8125rem, 1.1vw, 1rem)",      // ~13 → 16 px  (was 9 px)
  xs:   "clamp(0.875rem,  1.3vw, 1.125rem)",  // ~14 → 18 px  (was 10 px)
  sm:   "clamp(1rem,      1.5vw, 1.25rem)",   // ~16 → 20 px  (was 11 px)
  // icon sizes (Material Symbols)
  ico_xs: "clamp(1.125rem, 1.8vw, 1.5rem)",   // ~18 → 24 px  (was 10–13 px)
  ico:    "clamp(1.375rem, 2.2vw, 1.875rem)", // ~22 → 30 px  (was 14–16 px)
} as const;

// Row and structural heights that must grow with font
const H = {
  row:    "clamp(2.75rem, 4.5vw, 3.75rem)",   // token rows   (was 40 px)
  section:"clamp(3rem,    4.8vw, 4rem)",       // accordion header (was 40 px)
  tab:    "clamp(3.25rem, 5vw,   4.25rem)",    // tab bar (was 51 px)
  search: "clamp(2.75rem, 4.5vw, 3.75rem)",   // search (was 40 px)
  btn:    "clamp(2.75rem, 4.5vw, 3.75rem)",   // generate btn (was 40 px)
  swatch: "clamp(1.5rem,  2.5vw, 2rem)",      // color swatch (was 24 px)
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

type VarType = "color" | "text" | "number";

interface DSVar {
  name: string;
  value: string;
  type: VarType;
  preview?: string;
  icon?: string;
}

interface Submodule {
  id: string;
  label: string;
  icon: string;
  vars: DSVar[];
}

interface Module {
  id: string;
  label: string;
  tabIcon: string;
  submodules: Submodule[];
}

interface VariablePayload {
  module: string;
  submodule: string;
  name: string;
  value: string;
  type: VarType;
}

const DATA: Module[] = [
  {
    id: "colors",
    label: "Colors",
    tabIcon: "palette",
    submodules: [
      {
        id: "palette",
        label: "Palette",
        icon: "palette",
        vars: [
          { name: "MidnightDepth",     value: "#05061a", type: "color", preview: "#05061a" },
          { name: "MidnightDepth-900", value: "#090c2e", type: "color", preview: "#090c2e" },
          { name: "MidnightDepth-800", value: "#141852", type: "color", preview: "#141852" },
          { name: "MidnightDepth-700", value: "#1e2270", type: "color", preview: "#1e2270" },
          { name: "MidnightDepth-600", value: "#2d328e", type: "color", preview: "#2d328e" },
          { name: "MidnightDepth-500", value: "#5e6ad2", type: "color", preview: "#5e6ad2" },
          { name: "MidnightDepth-400", value: "#8b94e0", type: "color", preview: "#8b94e0" },
          { name: "MidnightDepth-300", value: "#b3bcea", type: "color", preview: "#b3bcea" },
          { name: "MidnightDepth-200", value: "#d5d9f3", type: "color", preview: "#d5d9f3" },
          { name: "MidnightDepth-100", value: "#eceef9", type: "color", preview: "#eceef9" },
        ],
      },
      {
        id: "semantic",
        label: "Semantic",
        icon: "gradient",
        vars: [
          { name: "Danger",  value: "#ef4444", type: "color", preview: "#ef4444" },
          { name: "Warning", value: "#f59e0b", type: "color", preview: "#f59e0b" },
          { name: "Info",    value: "#3b82f6", type: "color", preview: "#3b82f6" },
          { name: "Sucess",  value: "#22c55e", type: "color", preview: "#22c55e" },
        ],
      },
      {
        id: "color-tokens",
        label: "Tokens",
        icon: "diamond",
        vars: [
          { name: "surface-primary", value: "#ffffff",          type: "color", preview: "#ffffff" },
          { name: "bg-primary-dark", value: "#05061a",          type: "color", preview: "#05061a" },
          { name: "text-primary",    value: "#0c0c0d",          type: "color", preview: "#0c0c0d" },
          { name: "border-primary",  value: "#00000014",        type: "color", preview: "rgba(0,0,0,0.08)" },
        ],
      },
    ],
  },
  {
    id: "typography",
    label: "Typography",
    tabIcon: "font_download",
    submodules: [
      {
        id: "family",
        label: "Family",
        icon: "font_download",
        vars: [
          { name: "font-family-sans",  value: "DM Sans",                   type: "text", icon: "format_shapes" },
          { name: "font-family-icon",  value: "Material Symbols Outlined", type: "text", icon: "shapes" },
        ],
      },
      {
        id: "sizes",
        label: "Sizes",
        icon: "format_size",
        vars: [
          { name: "caption",   value: "10px", type: "text", icon: "text_fields" },
          { name: "small",     value: "12px", type: "text", icon: "text_fields" },
          { name: "p",         value: "14px", type: "text", icon: "text_fields" },
          { name: "h6",        value: "16px", type: "text", icon: "text_fields" },
          { name: "h5",        value: "18px", type: "text", icon: "text_fields" },
          { name: "h4",        value: "20px", type: "text", icon: "text_fields" },
          { name: "h3",        value: "24px", type: "text", icon: "text_fields" },
          { name: "h2",        value: "30px", type: "text", icon: "text_fields" },
          { name: "h1",        value: "36px", type: "text", icon: "text_fields" },
          { name: "display-4", value: "48px", type: "text", icon: "text_fields" },
          { name: "display-3", value: "60px", type: "text", icon: "text_fields" },
          { name: "display-2", value: "72px", type: "text", icon: "text_fields" },
          { name: "display-1", value: "96px", type: "text", icon: "text_fields" },
        ],
      },
      {
        id: "weight",
        label: "Weight",
        icon: "format_bold",
        vars: [
          { name: "font-weight-light",   value: "300", type: "number", icon: "format_bold" },
          { name: "font-weight-regular", value: "400", type: "number", icon: "format_bold" },
          { name: "font-weight-medium",  value: "500", type: "number", icon: "format_bold" },
          { name: "font-weight-bold",    value: "700", type: "number", icon: "format_bold" },
        ],
      },
      {
        id: "lineheight",
        label: "Line Height",
        icon: "format_line_spacing",
        vars: [
          { name: "LineHeight-tight", value: "1.2", type: "number", icon: "format_line_spacing" },
        ],
      },
      {
        id: "typo-tokens",
        label: "Tokens",
        icon: "diamond",
        vars: [
          { name: "text-primary",   value: "#0c0c0d",           type: "color", preview: "#0c0c0d" },
          { name: "text-secundary", value: "rgba(12,12,13,0.5)", type: "color", preview: "rgba(12,12,13,0.5)" },
        ],
      },
    ],
  },
  {
    id: "layout",
    label: "Layout",
    tabIcon: "grid_4x4",
    submodules: [
      {
        id: "grid",
        label: "Grid",
        icon: "grid_4x4",
        vars: [
          { name: "columns-mobile",  value: "4",    type: "number", icon: "smartphone" },
          { name: "columns-tablet",  value: "8",    type: "number", icon: "tablet" },
          { name: "columns-desktop", value: "12",   type: "number", icon: "desktop_windows" },
          { name: "gutters",         value: "16px", type: "text",   icon: "space_bar" },
          { name: "padding",         value: "16px", type: "text",   icon: "padding" },
          { name: "margin",          value: "24px", type: "text",   icon: "margin" },
        ],
      },
      {
        id: "radius",
        label: "Radius",
        icon: "rounded_corner",
        vars: [
          { name: "radius-sm", value: "4px",  type: "text", icon: "rounded_corner" },
          { name: "radius-lg", value: "16px", type: "text", icon: "rounded_corner" },
        ],
      },
      {
        id: "space",
        label: "Space",
        icon: "space_bar",
        vars: [
          { name: "spacing-4",  value: "4px",  type: "text", icon: "space_bar" },
          { name: "spacing-8",  value: "8px",  type: "text", icon: "space_bar" },
          { name: "spacing-12", value: "12px", type: "text", icon: "space_bar" },
          { name: "spacing-16", value: "16px", type: "text", icon: "space_bar" },
          { name: "spacing-24", value: "24px", type: "text", icon: "space_bar" },
        ],
      },
    ],
  },
];

// ── Color token row (with native color picker on click) ───────────────────────

function ColorTokenRow({
  v,
  onValueChange,
}: {
  v: DSVar;
  onValueChange: (name: string, val: string) => void;
}) {
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
    if (m) {
      return "#" + [m[1], m[2], m[3]].map((n) => parseInt(n).toString(16).padStart(2, "0")).join("");
    }
    return "#000000";
  };

  const displayColor = v.preview ?? v.value;

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
      {/* Color swatch — scales with H.swatch */}
      <div
        className="relative rounded-[4px] shrink-0"
        style={{ width: H.swatch, height: H.swatch, background: displayColor }}
      >
        <div aria-hidden className="absolute border border-[rgba(0,0,0,0.05)] border-solid inset-0 pointer-events-none rounded-[4px]" />
        <input
          ref={colorInputRef}
          type="color"
          value={toHex(v.value)}
          onChange={(e) => onValueChange(v.name, e.target.value)}
          onClick={(e) => e.stopPropagation()}
          className="absolute opacity-0 inset-0 w-full h-full cursor-pointer"
          style={{ padding: 0, border: 0 }}
          title={`Set value for ${v.name}`}
        />
      </div>

      {/* Token name */}
      <span
        className="flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-[#0c0c0d] not-italic"
        style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: F.xs }}
      >
        {v.name}
      </span>

      {/* Value chip on hover */}
      {hovered && (
        <span
          className="shrink-0 rounded-[4px] bg-white border border-[rgba(0,0,0,0.08)] text-[#6e6e80] whitespace-nowrap"
          style={{
            fontFamily: "'Source Sans 3', sans-serif",
            fontSize: F.xxs,
            lineHeight: 1.4,
            padding: "0.15em 0.45em",
          }}
        >
          {v.value}
        </span>
      )}
    </div>
  );
}

// ── Generic token row (text/number, with inline edit on click) ────────────────

function GenericTokenRow({
  v,
  onValueChange,
}: {
  v: DSVar;
  onValueChange: (name: string, val: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(v.value);
  const [hovered, setHovered] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  const commit = () => { onValueChange(v.name, draft); setEditing(false); };

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
      {/* Icon preview — swatch-sized box */}
      <div
        className="relative rounded-[4px] shrink-0 flex items-center justify-center"
        style={{ width: H.swatch, height: H.swatch }}
      >
        <div aria-hidden className="absolute border border-[rgba(0,0,0,0.05)] border-solid inset-0 pointer-events-none rounded-[4px]" />
        {v.icon && <MSym name={v.icon} clampSize={F.ico_xs} color="#0c0c0d" />}
      </div>

      {/* Token name */}
      <span
        className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-[#0c0c0d]"
        style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: F.xs }}
      >
        {v.name}
      </span>

      {/* Right: edit input or value chip on hover */}
      {editing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") { setDraft(v.value); setEditing(false); }
          }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white border border-[#5e6ad2] rounded-[4px] text-[#0c0c0d] outline-none shrink-0"
          style={{
            fontFamily: "'Source Sans 3', sans-serif",
            fontSize: F.xs,
            width: "clamp(5rem, 10vw, 8rem)",
            padding: "0.2em 0.5em",
          }}
        />
      ) : hovered ? (
        <span
          className="shrink-0 rounded-[4px] bg-white border border-[rgba(0,0,0,0.08)] text-[#6e6e80] whitespace-nowrap"
          style={{
            fontFamily: "'Source Sans 3', sans-serif",
            fontSize: F.xxs,
            lineHeight: 1.4,
            padding: "0.15em 0.45em",
          }}
        >
          {v.value}
        </span>
      ) : null}
    </div>
  );
}

// ── Submodule accordion section ───────────────────────────────────────────────

function SubmoduleSection({
  moduleId,
  sub,
  isOpen,
  onToggle,
  query,
  values,
  onValueChange,
  isColorModule,
}: {
  moduleId: string;
  sub: Submodule;
  isOpen: boolean;
  onToggle: () => void;
  query: string;
  values: Record<string, string>;
  onValueChange: (name: string, val: string) => void;
  isColorModule: boolean;
}) {
  const filtered = sub.vars.filter((v) =>
    !query || v.name.toLowerCase().includes(query.toLowerCase())
  );

  const tokenKey = (name: string) => `${moduleId}/${sub.id}/${name}`;

  return (
    <div className="bg-[#fafafa] shrink-0 w-full">
      {/* Section header row */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-[8px] px-[12px] relative cursor-pointer bg-transparent border-0 text-left"
        style={{ minHeight: H.section }}
      >
        <div aria-hidden className="absolute border-[#eee6e6] border-solid border-t inset-0 pointer-events-none" />
        <MSym name={sub.icon} clampSize={F.ico_xs} color={isOpen ? "#5e6ad2" : "#6e6e80"} />
        <span
          className="flex-1 font-medium whitespace-nowrap"
          style={{
            fontFamily: "'Source Sans 3', sans-serif",
            fontSize: F.xs,
            color: isOpen ? "#5e6ad2" : "#6e6e80",
          }}
        >
          {sub.label}
        </span>
        <MSym name={isOpen ? "expand_less" : "expand_more"} clampSize={F.ico} color={isOpen ? "#5e6ad2" : "#6e6e80"} />
      </button>

      {/* Expanded token list */}
      {isOpen && (
        <div className="overflow-y-auto px-[12px] pb-[8px] flex flex-col" style={{ maxHeight: "clamp(14rem, 35vh, 26rem)" }}>
          {filtered.length === 0 ? (
            <p className="text-center text-[#6e6e80] py-[10px]" style={{ fontSize: F.xs }}>
              No tokens found
            </p>
          ) : (
            filtered.map((v) => {
              const currentValue = values[tokenKey(v.name)] ?? v.value;
              const current = { ...v, value: currentValue, preview: v.type === "color" ? currentValue : v.preview };
              return (v.type === "color" && isColorModule) ? (
                <ColorTokenRow key={v.name} v={current} onValueChange={(name, val) => onValueChange(tokenKey(name), val)} />
              ) : (
                <GenericTokenRow key={v.name} v={current} onValueChange={(name, val) => onValueChange(tokenKey(name), val)} />
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

// ── Module panel (all submodules for one tab) ─────────────────────────────────

function ModulePanel({
  module,
  query,
  values,
  onValueChange,
}: {
  module: Module;
  query: string;
  values: Record<string, string>;
  onValueChange: (key: string, val: string) => void;
}) {
  const [openId, setOpenId] = useState<string>(module.submodules[0]?.id ?? "");

  const toggle = (id: string) => setOpenId((prev) => (prev === id ? "" : id));
  const isColorModule = module.id === "colors";

  return (
    <div className="flex flex-col w-full">
      {module.submodules.map((sub) => (
        <SubmoduleSection
          moduleId={module.id}
          key={sub.id}
          sub={sub}
          isOpen={openId === sub.id}
          onToggle={() => toggle(sub.id)}
          query={query}
          values={values}
          onValueChange={onValueChange}
          isColorModule={isColorModule}
        />
      ))}
    </div>
  );
}

// ── Header ────────────────────────────────────────────────────────────────────

function PluginHeader() {
  return (
    <div className="bg-[#f7f7f8] relative shrink-0 w-full rounded-tl-[16px] rounded-tr-[16px]">
      <div aria-hidden className="absolute border-[rgba(0,0,0,0.08)] border-b border-solid inset-0 pointer-events-none rounded-tl-[16px] rounded-tr-[16px]" />
      <div className="flex items-center gap-[8px] px-[16px] py-[clamp(0.6rem,1.2vw,1rem)]">
        <div className="flex items-center gap-[6px] flex-1 min-w-0">
          <div
            className="bg-[#0c0c0d] rounded-[4px] shrink-0 flex items-center justify-center"
            style={{ width: "clamp(1rem, 2vw, 1.5rem)", height: "clamp(1rem, 2vw, 1.5rem)" }}
          >
            <LogoIcon />
          </div>
          <span
            className="font-semibold text-[rgba(12,12,13,0.7)] whitespace-nowrap"
            style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: F.sm }}
          >
            DT Boilerplate
          </span>
        </div>
        <span
          className="text-[#6e6e80] whitespace-nowrap shrink-0"
          style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: F.xxs }}
        >
          v0.1
        </span>
      </div>
    </div>
  );
}

// ── Tab bar ───────────────────────────────────────────────────────────────────

function TabBar({ active, onChange }: { active: string; onChange: (id: string) => void }) {
  return (
    <div className="relative shrink-0 w-full">
      <div aria-hidden className="absolute border-[rgba(0,0,0,0.08)] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex items-start w-full">
        {DATA.map((mod) => {
          const isActive = active === mod.id;
          return (
            <button
              key={mod.id}
              onClick={() => onChange(mod.id)}
              className="flex-1 flex flex-col items-center justify-center gap-[0.25em] relative bg-transparent border-0 cursor-pointer py-[clamp(0.5rem,1vw,0.75rem)]"
              style={{ minHeight: H.tab }}
            >
              <div
                aria-hidden
                className="absolute border-b-2 border-solid inset-0 pointer-events-none"
                style={{ borderColor: isActive ? "#5e6ad2" : "transparent" }}
              />
              <MSym name={mod.tabIcon} clampSize={F.ico} color={isActive ? "#5e6ad2" : "#6e6e80"} />
              <span
                className="font-medium text-center whitespace-nowrap"
                style={{
                  fontFamily: "'Source Sans 3', sans-serif",
                  fontSize: F.xs,
                  color: isActive ? "#5e6ad2" : "#6e6e80",
                }}
              >
                {mod.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Single global search bar ──────────────────────────────────────────────────

function GlobalSearch({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="shrink-0 p-[12px] w-full">
      <div
        className="bg-[#f2f2f4] rounded-[6px] flex items-center gap-[8px] px-[10px] w-full"
        style={{ minHeight: H.search }}
      >
        <SearchSvgIcon />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search tokens…"
          className="bg-transparent border-0 outline-none flex-1 min-w-0 text-[#0c0c0d] placeholder:text-[rgba(110,110,128,0.5)]"
          style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: F.xs }}
        />
        {value && (
          <button
            onClick={() => onChange("")}
            className="text-[#6e6e80] bg-transparent border-0 cursor-pointer p-0 leading-none"
            style={{ fontSize: F.sm }}
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────

function PluginFooter({ count, onGenerate }: { count: number; onGenerate: () => void }) {
  return (
    <div className="relative shrink-0 w-full">
      <div aria-hidden className="absolute border-[rgba(0,0,0,0.08)] border-solid border-t inset-0 pointer-events-none" />
      <div className="flex flex-col items-start pb-[12px] pt-[5px] px-[12px]">
        <span
          className="text-[#6e6e80]"
          style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: F.xs }}
        >
          {count} variables
        </span>
        <div className="pt-[10px] w-full">
          <button
            onClick={onGenerate}
            className="bg-[#0c0c0d] rounded-[8px] w-full flex items-center justify-center gap-[6px] cursor-pointer border-0 hover:bg-[#1a1a1b] transition-colors"
            style={{ minHeight: H.btn }}
          >
            <GenerateSvgIcon />
            <span
              className="font-semibold text-[#fafafa] whitespace-nowrap"
              style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: F.sm }}
            >
              Generate Variables
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

function UnlockModal({
  onUnlock,
  onCancel,
}: {
  onUnlock: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-[rgba(12,12,13,0.45)] px-[24px]">
      <div
        className="bg-white rounded-[8px] shadow-[0_16px_40px_rgba(0,0,0,0.2)] border border-[rgba(0,0,0,0.08)] w-full max-w-[340px] overflow-hidden"
        style={{ fontFamily: "'Source Sans 3', sans-serif" }}
      >
        <div className="px-[20px] pt-[20px] pb-[12px]">
          <h2 className="m-0 text-[#0c0c0d] font-semibold" style={{ fontSize: F.sm }}>
            Unlock DT Boilerplate
          </h2>
          <p className="mt-[10px] mb-0 text-[#6e6e80]" style={{ fontSize: F.xs, lineHeight: 1.45 }}>
            Your free token generation has been used.
          </p>
          <p className="mt-[8px] mb-0 text-[#6e6e80]" style={{ fontSize: F.xs, lineHeight: 1.45 }}>
            Unlock unlimited token generation and future updates.
          </p>

          <div className="mt-[16px] flex flex-col gap-[8px]">
            <div className="rounded-[6px] bg-[#f7f7f8] border border-[rgba(0,0,0,0.08)] px-[14px] py-[12px]">
              <div className="text-[#0c0c0d] font-semibold" style={{ fontSize: F.sm }}>
                US$ 5,99
              </div>
              <div className="text-[#6e6e80]" style={{ fontSize: F.xs }}>
                Mensal
              </div>
            </div>
            <div className="rounded-[6px] bg-[#f7f7f8] border border-[rgba(0,0,0,0.08)] px-[14px] py-[12px]">
              <div className="text-[#0c0c0d] font-semibold" style={{ fontSize: F.sm }}>
                US$ 49,90
              </div>
              <div className="text-[#6e6e80]" style={{ fontSize: F.xs }}>
                Lifetime
              </div>
            </div>
          </div>

          <div className="mt-[16px] flex flex-col gap-[6px] text-[#0c0c0d]" style={{ fontSize: F.xs }}>
            <span>✓ Unlimited Token Generation</span>
            <span>✓ Future Updates</span>
            <span>✓ New Features</span>
            <span>✓ Priority Support</span>
          </div>
        </div>

        <div className="border-t border-[rgba(0,0,0,0.08)] p-[12px] flex flex-col gap-[8px]">
          <button
            onClick={onUnlock}
            className="bg-[#0c0c0d] rounded-[8px] w-full flex items-center justify-center cursor-pointer border-0 hover:bg-[#1a1a1b] transition-colors text-[#fafafa] font-semibold"
            style={{ minHeight: H.btn, fontSize: F.sm, fontFamily: "'Source Sans 3', sans-serif" }}
          >
            Unlock Now
          </button>
          <button
            onClick={onCancel}
            className="bg-transparent rounded-[8px] w-full flex items-center justify-center cursor-pointer border border-[rgba(0,0,0,0.08)] text-[#0c0c0d]"
            style={{ minHeight: H.btn, fontSize: F.sm, fontFamily: "'Source Sans 3', sans-serif" }}
          >
            Cancel
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

  const activeModule = DATA.find((m) => m.id === activeTab)!;
  const totalVars = DATA.reduce((acc, module) => acc + module.submodules.reduce((subAcc, s) => subAcc + s.vars.length, 0), 0);

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
        submodule.vars.map((v) => ({
          module: module.id,
          submodule: submodule.id,
          name: v.name,
          value: values[`${module.id}/${submodule.id}/${v.name}`] ?? v.value,
          type: v.type,
        }))
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

  const handleUnlockNow = () => {
    parent.postMessage(
      {
        pluginMessage: {
          type: "unlock-now",
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
    };

    window.addEventListener("message", handlePluginMessage);
    return () => window.removeEventListener("message", handlePluginMessage);
  }, []);

  return (
    <div className="w-screen h-screen flex flex-col overflow-hidden bg-white">
      <div aria-hidden className="absolute border border-[rgba(0,0,0,0.08)] border-solid inset-0 pointer-events-none z-10" />
      <PluginHeader />
      <TabBar active={activeTab} onChange={handleTabChange} />

      {/* Single global search bar */}
      <GlobalSearch value={query} onChange={setQuery} />

      {/* Scrollable accordion content */}
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
          onUnlock={handleUnlockNow}
          onCancel={() => setShowUnlockModal(false)}
        />
      )}
    </div>
  );
}
