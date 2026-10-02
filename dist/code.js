"use strict";
(() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __objRest = (source, exclude) => {
    var target = {};
    for (var prop in source)
      if (__hasOwnProp.call(source, prop) && exclude.indexOf(prop) < 0)
        target[prop] = source[prop];
    if (source != null && __getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(source)) {
        if (exclude.indexOf(prop) < 0 && __propIsEnum.call(source, prop))
          target[prop] = source[prop];
      }
    return target;
  };

  // src/app/token-values.ts
  var clamp = (n, max = 1) => Math.max(0, Math.min(max, n));
  function hsvToRgb({ h, s, v, a }) {
    const f = (n) => {
      const k = (n + h / 60) % 6;
      return v - v * s * Math.max(0, Math.min(k, 4 - k, 1));
    };
    return { r: f(5), g: f(3), b: f(1), a };
  }
  function hslToRgb(h, s, l, a = 1) {
    const v = l + s * Math.min(l, 1 - l);
    return hsvToRgb({ h, s: v ? 2 * (1 - l / v) : 0, v, a });
  }
  function fromOklch(l, c, h, a = 1) {
    const A = c * Math.cos(h * Math.PI / 180), B = c * Math.sin(h * Math.PI / 180);
    const L = (l + 0.3963377774 * A + 0.2158037573 * B) ** 3, M = (l - 0.1055613458 * A - 0.0638541728 * B) ** 3, S = (l - 0.0894841775 * A - 1.291485548 * B) ** 3;
    const gamma = (v) => clamp(v <= 31308e-7 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055);
    return { r: gamma(4.0767416621 * L - 3.3077115913 * M + 0.2309699292 * S), g: gamma(-1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S), b: gamma(-0.0041960863 * L - 0.7034186147 * M + 1.707614701 * S), a };
  }
  function parseColor(raw) {
    const s = raw.trim();
    if (/^#[\da-f]{3,4}$|^#[\da-f]{6}([\da-f]{2})?$/i.test(s)) {
      let v = s.slice(1);
      if (v.length < 5) v = [...v].map((c) => c + c).join("");
      return { r: parseInt(v.slice(0, 2), 16) / 255, g: parseInt(v.slice(2, 4), 16) / 255, b: parseInt(v.slice(4, 6), 16) / 255, a: v.length === 8 ? parseInt(v.slice(6, 8), 16) / 255 : 1 };
    }
    const match = s.match(/^(rgba?|hsla?|oklch)\(([^)]+)\)$/i);
    if (!match) return null;
    const parts = match[2].trim().split(/[\s,/]+/);
    if (parts.length < 3 || parts.length > 4 || parts.some((p) => !/^[-+]?(?:\d*\.)?\d+(?:%|deg)?$/.test(p))) return null;
    const [x, y, z] = parts.map(parseFloat), alpha = parts[3] ? parseFloat(parts[3]) / (parts[3].includes("%") ? 100 : 1) : 1;
    if (alpha < 0 || alpha > 1) return null;
    const h = (x % 360 + 360) % 360;
    if (/^rgb/i.test(match[1])) {
      const channels = parts.slice(0, 3).map((p) => parseFloat(p) / (p.includes("%") ? 100 : 255));
      if (channels.some((c) => c < 0 || c > 1)) return null;
      return { r: channels[0], g: channels[1], b: channels[2], a: alpha };
    }
    if (/^hsl/i.test(match[1])) return y < 0 || y > 100 || z < 0 || z > 100 ? null : hslToRgb(h, y / 100, z / 100, alpha);
    return fromOklch(x / (parts[0].includes("%") ? 100 : 1), y, z, alpha);
  }

  // src/plugin/licensing.ts
  var FREE_GENERATION_USED_KEY = "dt_boilerplate_free_generation_used";
  var USER_EMAIL_KEY = "dt_boilerplate_user_email";
  var PREMIUM_STATUS_KEY = "dt_boilerplate_premium_status";
  var EDGE_FUNCTION_URL = "https://lyexuguaeuwdtjeqwmst.supabase.co/functions/v1/verify-license";
  async function verificarAssinaturaSupabase(userId, email) {
    try {
      if (!email) return false;
      const response = await fetch(EDGE_FUNCTION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email })
      });
      if (!response.ok) return false;
      const data = await response.json();
      return data.premium === true;
    } catch (error) {
      return false;
    }
  }
  async function obterEstadoLicenca(clientStorage, userId, emailForcado) {
    const geracaoGratuitaUtilizada = await clientStorage.getAsync(FREE_GENERATION_USED_KEY);
    const storedPremium = await clientStorage.getAsync(PREMIUM_STATUS_KEY);
    const storedEmail = await clientStorage.getAsync(USER_EMAIL_KEY);
    const emailToCheck = emailForcado || storedEmail;
    let premium = storedPremium === true;
    if (!premium && emailToCheck) {
      premium = await verificarAssinaturaSupabase(userId, emailToCheck);
      if (premium) {
        await clientStorage.setAsync(PREMIUM_STATUS_KEY, true);
      }
    }
    return {
      geracaoGratuitaUtilizada: geracaoGratuitaUtilizada === true,
      premium
    };
  }
  function podeGerarDesignTokens(licenca) {
    return licenca.premium || !licenca.geracaoGratuitaUtilizada;
  }
  async function marcarGeracaoGratuitaUtilizada(clientStorage) {
    await clientStorage.setAsync(FREE_GENERATION_USED_KEY, true);
  }

  // src/plugin/documentation.ts
  var ROOT_KEY = "dt-boilerplate-doc-root";
  var PRESET_KEY = "starttokens-documentation-preset";
  var WIDTH = 1920;
  var CONTENT = 1760;
  var BRAND_MARK = '<svg preserveAspectRatio="none" overflow="visible" style="display: block;" width="18.2024" height="30" viewBox="0 0 18.2024 30" fill="none" xmlns="http://www.w3.org/2000/svg">\n<g id="Vector">\n<path d="M0.960205 19.2263L8.64904 29.7675C8.87452 30.0775 9.33675 30.0775 9.56223 29.7675L17.2511 19.2263C17.5837 18.7697 17.1158 18.1609 16.5915 18.3695L9.72571 21.064C9.32548 21.2218 8.8858 21.2218 8.49121 21.064L1.62537 18.3695C1.10113 18.1609 0.63326 18.7697 0.965842 19.2263H0.960205Z" fill="#2D328E"/>\n<path d="M8.79556 19.542L0.255543 14.5589C0.00751597 14.4123 -0.0714017 14.1249 0.0695227 13.8937L8.60954 0.257892C8.82375 -0.0859639 9.37617 -0.0859639 9.59602 0.257892L18.1304 13.8937C18.277 14.1249 18.1924 14.418 17.9444 14.5589L9.41 19.542C9.22398 19.6491 8.98158 19.6491 8.79556 19.542Z" fill="#2D328E"/>\n</g>\n</svg>\n';
  var valueLabel = (token) => {
    var _a;
    return (_a = token.displayValue) != null ? _a : String(token.value);
  };
  var number = (token) => token ? typeof token.value === "number" ? token.value : Number.parseFloat(valueLabel(token)) : NaN;
  var unit = (token) => {
    var _a, _b;
    return (_b = token == null ? void 0 : token.unit) != null ? _b : token ? (_a = valueLabel(token).match(/(?:rem|em|px|pt|%)$/)) == null ? void 0 : _a[0] : void 0;
  };
  var paint = (color) => ({ type: "SOLID", color: { r: color.r, g: color.g, b: color.b }, opacity: "a" in color ? color.a : 1 });
  var gray = (n) => paint({ r: n, g: n, b: n });
  function property(token) {
    const name = `${token.submodule}/${token.name}`.toLowerCase();
    if (/line[-_ .]?height|leading/.test(name)) return "lineHeight";
    if (/letter[-_ .]?spacing|tracking/.test(name)) return "letterSpacing";
    if (/paragraph[-_ .]?spacing/.test(name)) return "paragraphSpacing";
    if (/paragraph[-_ .]?indent/.test(name)) return "paragraphIndent";
    if (/weight/.test(name)) return "weight";
    if (/font[-_ .]?style/.test(name)) return "style";
    if (/text[-_ .]?(transform|case)/.test(name)) return "case";
    if (/decoration/.test(name)) return "decoration";
    if (token.type === "STRING" && /family|typeface|(?:^|[/. -])font(?:$|[/. -])/.test(name)) return "family";
    if (token.type === "FLOAT" && /size|text-/.test(name)) return "size";
    return void 0;
  }
  function role(token) {
    return token.name.toLowerCase().replace(/(?:[.\s-]+)(font-family|font-size|font-weight|line-height|lineheight|letter-spacing|paragraph-spacing|paragraph-indent|weight-prominent|weight|size|font|family|style)$/, "");
  }
  function frame(name, horizontal = false, width) {
    const node = figma.createFrame();
    node.name = name;
    node.fills = [];
    node.clipsContent = false;
    node.layoutMode = horizontal ? "HORIZONTAL" : "VERTICAL";
    node.primaryAxisSizingMode = horizontal && width !== void 0 ? "FIXED" : "AUTO";
    node.counterAxisSizingMode = !horizontal && width !== void 0 ? "FIXED" : "AUTO";
    node.itemSpacing = 0;
    if (width !== void 0) node.resize(width, 1);
    return node;
  }
  var pendingRender = Promise.resolve();
  function generateVisualDocumentation(payload, variablesByName, presetName = "StartTokens", modules = [], iconPreview) {
    const next = pendingRender.then(() => renderDocumentation(payload, variablesByName, presetName, modules, iconPreview));
    pendingRender = next.catch(() => void 0);
    return next;
  }
  async function renderDocumentation(payload, variablesByName, presetName = "StartTokens", modules = [], iconPreview) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o;
    const seen = /* @__PURE__ */ new Set();
    const tokens = payload.filter((token) => {
      if (!variablesByName.has(token.figmaName) || seen.has(token.figmaName)) return false;
      seen.add(token.figmaName);
      return true;
    });
    const pageName = `\u{1F4D8} StartTokens \u2014 ${presetName} \u2014 Visual Foundations`;
    if (!tokens.length) return { pageName, frameId: null, count: 0 };
    const typography = tokens.filter((t) => t.module === "typography");
    const config = (_a = modules.find((m) => m.module === "typography")) == null ? void 0 : _a.configuration;
    const reference = (id) => typography.find((t) => t.id === id);
    const defaultFamily = (_b = reference(config == null ? void 0 : config.fontFamily.default)) != null ? _b : typography.find((t) => property(t) === "family");
    const defaultSize = (_c = reference(config == null ? void 0 : config.baseSize.default)) != null ? _c : typography.find((t) => property(t) === "size");
    const defaultLine = (_d = reference(config == null ? void 0 : config.lineHeight.default)) != null ? _d : typography.find((t) => property(t) === "lineHeight");
    const defaultWeight = (_e = typography.find((t) => property(t) === "weight" && /normal|regular|body/i.test(t.name))) != null ? _e : typography.find((t) => property(t) === "weight");
    const rootPx = 16;
    const px = (token, em = rootPx) => {
      const u = unit(token);
      if (u && !["px", "rem", "em", "pt"].includes(u)) return NaN;
      return number(token) * (u === "rem" ? rootPx : u === "em" ? em : u === "pt" ? 96 / 72 : 1);
    };
    const available = typeof figma.listAvailableFontsAsync === "function" ? await figma.listAvailableFontsAsync() : [];
    const loaded = /* @__PURE__ */ new Map();
    const weightStyle = (weight) => weight >= 900 ? "Black" : weight >= 800 ? "Extra Bold" : weight >= 700 ? "Bold" : weight >= 600 ? "Semi Bold" : weight >= 500 ? "Medium" : weight >= 400 ? "Regular" : weight >= 300 ? "Light" : weight >= 200 ? "Extra Light" : "Thin";
    async function font(stack, weight = 400, italic = false) {
      const key = `${stack}/${weight}/${italic}`;
      if (!loaded.has(key)) loaded.set(key, (async () => {
        var _a2, _b2;
        const families = stack.split(",").map((s) => s.trim().replace(/^['"]|['"]$/g, ""));
        const fallback = (_b2 = (_a2 = available.find((f) => f.fontName.style === "Regular")) == null ? void 0 : _a2.fontName) != null ? _b2 : { family: "Inter", style: "Regular" };
        for (const family of [...families, fallback.family]) {
          const requestedStyle = weightStyle(weight) + (italic ? " Italic" : "");
          const styles = available.filter((f) => f.fontName.family.toLowerCase() === family.toLowerCase()).map((f) => f.fontName);
          const exact = styles.find((f) => f.style.replace(/\s/g, "").toLowerCase() === requestedStyle.replace(/\s/g, "").toLowerCase());
          const candidates = [exact != null ? exact : { family, style: requestedStyle }, ...styles.filter((f) => f.style === "Regular"), { family, style: "Regular" }];
          for (const candidate of candidates) try {
            await figma.loadFontAsync(candidate);
            return candidate;
          } catch (e) {
          }
        }
        throw new Error("No available font for documentation previews");
      })());
      return loaded.get(key);
    }
    const normal = await font(defaultFamily ? String(defaultFamily.value) : "");
    const bold = await font(normal.family, 700);
    function text(value, width, size = 16, strong = false) {
      const node = figma.createText();
      node.name = value;
      node.fontName = strong ? bold : normal;
      node.characters = value;
      node.fontSize = size;
      node.lineHeight = { unit: "AUTO" };
      node.fills = [gray(0.05)];
      node.resize(width, 1);
      node.textAutoResize = "HEIGHT";
      return node;
    }
    function bind(node, field, token) {
      if (!token || !("setBoundVariable" in node)) return;
      const variable = variablesByName.get(token.figmaName);
      if (variable) try {
        node.setBoundVariable(field, variable);
      } catch (e) {
      }
    }
    function bindLength(node, field, token) {
      if ((token == null ? void 0 : token.type) === "FLOAT" && (!unit(token) || unit(token) === "px")) bind(node, field, token);
    }
    const colorOf = (token) => typeof token.value === "object" ? token.value : parseColor(String(token.value));
    const accentToken = (_f = tokens.find((t) => t.type === "COLOR" && /primary|accent/i.test(t.name))) != null ? _f : tokens.find((t) => t.type === "COLOR");
    const accent = accentToken ? colorOf(accentToken) : null;
    function fill(node, token) {
      const color = token ? colorOf(token) : accent;
      let solid = color ? paint(color) : gray(0.35);
      const variable = token && variablesByName.get(token.figmaName);
      if (variable) try {
        solid = figma.variables.setBoundVariableForPaint(solid, "color", variable);
      } catch (e) {
      }
      node.fills = [solid];
    }
    function cell(width) {
      const n = frame("Cell", false, width);
      n.paddingTop = 8;
      n.paddingBottom = 8;
      return n;
    }
    async function typePreview(token, width) {
      var _a2, _b2, _c2, _d2, _e2, _f2;
      const container = cell(width);
      const kind = property(token);
      const key = role(token);
      const sibling = (p) => typography.find((t) => role(t) === key && property(t) === p);
      const family = kind === "family" ? token : (_a2 = sibling("family")) != null ? _a2 : defaultFamily;
      const size = kind === "size" ? token : (_b2 = sibling("size")) != null ? _b2 : defaultSize;
      const weight = kind === "weight" ? token : (_c2 = sibling("weight")) != null ? _c2 : defaultWeight;
      const line = kind === "lineHeight" ? token : (_d2 = sibling("lineHeight")) != null ? _d2 : defaultLine;
      const style = kind === "style" ? token : sibling("style");
      const familyValue = family ? String(family.value) : normal.family;
      const face = await font(familyValue, Number.isFinite(number(weight)) ? number(weight) : 400, !!style && /italic/i.test(String(style.value)));
      const sample = text("Aa \u2014 The quick brown fox\njumps over the lazy dog", width);
      sample.name = `${token.figmaName} Preview`;
      sample.fontName = face;
      const sizePx = px(size);
      sample.fontSize = Number.isFinite(sizePx) && sizePx > 0 ? sizePx : 16;
      const lineValue = number(line);
      if (Number.isFinite(lineValue) && lineValue >= 0) sample.lineHeight = unit(line) === "%" ? { unit: "PERCENT", value: lineValue } : !unit(line) ? { unit: "PERCENT", value: lineValue * 100 } : { unit: "PIXELS", value: px(line, sample.fontSize) };
      if (family && familyValue === face.family) bind(sample, "fontFamily", family);
      bindLength(sample, "fontSize", size);
      if ((weight == null ? void 0 : weight.type) === "FLOAT") bind(sample, "fontWeight", weight);
      if (line && unit(line) === "px") bindLength(sample, "lineHeight", line);
      for (const p of ["letterSpacing", "paragraphSpacing", "paragraphIndent"]) {
        const target = kind === p ? token : sibling(p);
        if (!target || !Number.isFinite(number(target))) continue;
        if (p === "letterSpacing") sample.letterSpacing = unit(target) === "%" ? { unit: "PERCENT", value: number(target) } : { unit: "PIXELS", value: px(target, sample.fontSize) };
        else sample[p] = px(target, sample.fontSize);
        bindLength(sample, p, target);
      }
      if (kind === "case") {
        const cases = { uppercase: "UPPER", lowercase: "LOWER", capitalize: "TITLE", none: "ORIGINAL" };
        sample.textCase = (_e2 = cases[String(token.value)]) != null ? _e2 : "ORIGINAL";
      }
      if (kind === "decoration") {
        const decorations = { underline: "UNDERLINE", "line-through": "STRIKETHROUGH", none: "NONE" };
        sample.textDecoration = (_f2 = decorations[String(token.value)]) != null ? _f2 : "NONE";
      }
      container.appendChild(sample);
      return container;
    }
    function layoutPreview(token, width) {
      const container = cell(width);
      const n = px(token);
      const label = `${token.submodule}/${token.name}`.toLowerCase();
      if (!Number.isFinite(n) || n < 0) return container;
      if (/grid|column|gutter/.test(label)) {
        const preview = frame("Grid Preview", true);
        preview.itemSpacing = /gap|gutter/.test(label) ? n : 8;
        const columns = /columns?$/.test(token.name) ? Math.max(1, Math.min(24, Math.round(n))) : 3;
        for (let i = 0; i < columns; i++) {
          const rect = figma.createRectangle();
          rect.resize(16, 32);
          fill(rect);
          preview.appendChild(rect);
        }
        if (/gap|gutter/.test(label)) bindLength(preview, "itemSpacing", token);
        container.appendChild(preview);
      } else if (/radius|shape/.test(label)) {
        const rect = figma.createRectangle();
        rect.name = "Radius Preview";
        rect.resize(96, 64);
        rect.cornerRadius = n;
        fill(rect);
        bindLength(rect, "cornerRadius", token);
        container.appendChild(rect);
      } else if (/spacing|space|gap|padding|margin|siz|width|height|container|breakpoint/.test(label)) {
        const rect = figma.createRectangle();
        rect.name = "Length Preview";
        const scale = n > width ? width / n : 1;
        rect.resize(Math.max(0.01, n * scale), /siz|width|height|container|breakpoint/.test(label) ? 48 : 12);
        fill(rect);
        if (scale === 1 && n > 0) bindLength(rect, "width", token);
        container.appendChild(rect);
        if (scale < 1) container.appendChild(text(`Preview scaled 1:${Math.round(1 / scale * 100) / 100}`, width, 12));
      }
      return container;
    }
    async function table(members, moduleId) {
      const table2 = frame("Token Table", false, CONTENT);
      table2.fills = [gray(1)];
      table2.strokes = [gray(0.91)];
      table2.cornerRadius = 12;
      const widths = moduleId === "colors" ? [100, 400, 440, 788] : [400, 340, 400, 588];
      const header = frame("Header", true, CONTENT);
      header.fills = [gray(0.95)];
      header.paddingLeft = 16;
      header.paddingRight = 16;
      for (const [i, label] of [moduleId === "colors" ? "Swatch" : "Preview", "Variable Name", "Value", "Variable Path"].entries()) {
        const c = cell(widths[i]);
        c.appendChild(text(label, widths[i] - 16, 16, true));
        header.appendChild(c);
      }
      table2.appendChild(header);
      for (const token of members) {
        const row = frame(token.figmaName, true, CONTENT);
        row.minHeight = 64;
        row.paddingLeft = 16;
        row.paddingRight = 16;
        row.setPluginData("starttokens-variable-path", token.figmaName);
        let preview;
        if (token.type === "COLOR") {
          preview = cell(widths[0]);
          const swatch = figma.createRectangle();
          swatch.name = `${token.name} Swatch`;
          swatch.resize(48, 48);
          swatch.cornerRadius = 4;
          fill(swatch, token);
          preview.appendChild(swatch);
        } else if (moduleId === "typography") preview = await typePreview(token, widths[0] - 16);
        else if (moduleId === "iconography" && iconPreview && token.submodule === "sizes") {
          if (iconPreview.svg.length > 1e5 || /<(?:script|foreignObject|iframe|image|use)\b|\bon\w+\s*=|(?:href|src)\s*=|javascript:|<!ENTITY/i.test(iconPreview.svg)) throw Error("Unsafe icon preview SVG");
          preview = cell(widths[0]);
          const node = figma.createNodeFromSvg(iconPreview.svg);
          node.name = `${iconPreview.library} / ${iconPreview.name} / ${token.displayValue}`;
          const size = px(token);
          node.resize(size, size);
          bindLength(node, "width", token);
          bindLength(node, "height", token);
          preview.appendChild(node);
        } else if (moduleId === "layout") preview = layoutPreview(token, widths[0] - 16);
        else preview = cell(widths[0]);
        preview.resize(widths[0], preview.height);
        row.appendChild(preview);
        for (const [i, value] of [token.name, valueLabel(token), token.figmaName].entries()) {
          const c = cell(widths[i + 1]);
          const label = text(value, widths[i + 1] - 16, 15);
          label.name = ["Variable Name", "Value", "Variable Path"][i];
          c.appendChild(label);
          row.appendChild(c);
        }
        table2.appendChild(row);
      }
      return table2;
    }
    await figma.loadAllPagesAsync();
    let page = figma.root.children.find((p) => p.type === "PAGE" && (p.getPluginData(PRESET_KEY) === presetName || p.name === pageName));
    const createdPage = !page;
    if (!page) {
      page = figma.createPage();
      page.name = pageName;
    }
    await figma.setCurrentPageAsync(page);
    const previous = page.children.filter((n) => n.type === "FRAME" && n.getPluginData(ROOT_KEY) === "true" && n.getPluginData(PRESET_KEY) === presetName);
    const root = frame(`StartTokens \u2014 ${presetName} \u2014 Visual Foundations`, true);
    root.itemSpacing = 40;
    root.visible = false;
    root.setPluginData(ROOT_KEY, "true");
    root.setPluginData(PRESET_KEY, presetName);
    page.appendChild(root);
    try {
      const grouped = /* @__PURE__ */ new Map();
      for (const token of tokens) {
        if (!grouped.has(token.module)) grouped.set(token.module, /* @__PURE__ */ new Map());
        const groups = grouped.get(token.module);
        if (!groups.has(token.submodule)) groups.set(token.submodule, []);
        groups.get(token.submodule).push(token);
      }
      for (const [moduleId, groups] of grouped) {
        const metadata = modules.find((m) => m.module === moduleId);
        const first = groups.values().next().value[0];
        const title = (_h = (_g = metadata == null ? void 0 : metadata.label) != null ? _g : first.figmaName.split("/")[0]) != null ? _h : moduleId;
        const board = frame(title, false, WIDTH);
        board.paddingTop = 64;
        board.paddingBottom = 64;
        board.paddingLeft = 80;
        board.paddingRight = 80;
        board.itemSpacing = 48;
        board.fills = [gray(1)];
        const brand = frame("StartTokens / Preset", true, CONTENT);
        const identity = frame("StartTokens", true, CONTENT / 2);
        identity.itemSpacing = 12;
        identity.counterAxisAlignItems = "CENTER";
        const mark = figma.createNodeFromSvg(BRAND_MARK);
        mark.name = "StartTokens mark";
        mark.resize(27.3, 45);
        identity.appendChild(mark);
        identity.appendChild(text("StartTokens", CONTENT / 2 - 40, 24, true));
        brand.appendChild(identity);
        const preset = text(presetName, CONTENT / 2, 24);
        preset.textAlignHorizontal = "RIGHT";
        brand.appendChild(preset);
        board.appendChild(brand);
        board.appendChild(text(title, CONTENT, 48, true));
        if (moduleId === "typography" && (config == null ? void 0 : config.fontRoles)) {
          const families = frame("Font Families", false, CONTENT);
          families.itemSpacing = 16;
          for (const control of Object.values(config.fontRoles)) {
            const token = reference(control.token);
            if (!token) continue;
            families.appendChild(text(`${control.label} \u2014 ${valueLabel(token)}`, CONTENT, 24, true));
            families.appendChild(await typePreview(token, CONTENT));
          }
          board.appendChild(families);
        }
        if (moduleId === "iconography" && iconPreview) board.appendChild(text(`Library: ${iconPreview.library} \xB7 Preview: ${iconPreview.name}`, CONTENT, 24));
        for (const [groupId, members] of groups) {
          const label = (_k = (_j = (_i = metadata == null ? void 0 : metadata.submodules.find((s) => s.id === groupId)) == null ? void 0 : _i.label) != null ? _j : members[0].figmaName.split("/")[1]) != null ? _k : groupId;
          const section = frame(groupId, false, CONTENT);
          section.itemSpacing = 16;
          section.appendChild(text(label, CONTENT, 32, true));
          const paths = /* @__PURE__ */ new Map();
          for (const token of members) {
            const path = token.figmaName.split("/").slice(2, -1).join("/");
            if (!paths.has(path)) paths.set(path, []);
            paths.get(path).push(token);
          }
          for (const [path, items] of paths) {
            if (path) section.appendChild(text(path, CONTENT, 24, true));
            section.appendChild(await table(items, moduleId));
          }
          board.appendChild(section);
        }
        root.appendChild(board);
      }
      root.x = (_m = (_l = previous[0]) == null ? void 0 : _l.x) != null ? _m : 0;
      root.y = (_o = (_n = previous[0]) == null ? void 0 : _n.y) != null ? _o : 0;
      root.visible = true;
      page.name = pageName;
      page.setPluginData(PRESET_KEY, presetName);
      previous.forEach((n) => n.remove());
      figma.currentPage.selection = [root.children[0]];
      figma.viewport.scrollAndZoomIntoView([root.children[0]]);
      return { pageName, frameId: root.id, count: tokens.length };
    } catch (error) {
      root.remove();
      if (createdPage && page.children.length === 0) page.remove();
      throw error;
    }
  }

  // src/plugin/code.ts
  figma.showUI(__html__, {
    width: 420,
    height: 747,
    themeColors: true
  });
  figma.ui.onmessage = async (message) => {
    if (message.type === "insert-icon") {
      try {
        if (!Number.isFinite(message.size) || message.size <= 0 || message.size > 4096 || message.svg.length > 1e5 || !/<svg\b/.test(message.svg) || /<(?:script|foreignObject|iframe|image|use)\b|\bon\w+\s*=|(?:href|src)\s*=|javascript:|<!ENTITY/i.test(message.svg)) throw Error("Invalid icon SVG or size.");
        const node = figma.createNodeFromSvg(message.svg);
        node.name = message.name;
        node.resize(message.size, message.size);
        node.x = figma.viewport.center.x - message.size / 2;
        node.y = figma.viewport.center.y - message.size / 2;
        figma.currentPage.appendChild(node);
        figma.currentPage.selection = [node];
        figma.viewport.scrollAndZoomIntoView([node]);
        figma.ui.postMessage({ type: "icon-inserted", name: message.name });
      } catch (error) {
        figma.ui.postMessage({ type: "icon-insertion-failed", error: String(error) });
      }
      return;
    }
    if (message.type === "list-fonts") {
      try {
        const fonts = await figma.listAvailableFontsAsync();
        figma.ui.postMessage({ type: "available-fonts", fonts: fonts.map((f) => f.fontName) });
      } catch (error) {
        figma.ui.postMessage({ type: "available-fonts", fonts: [], error: String(error) });
      }
      return;
    }
    if (message.type === "validate-font") {
      try {
        const fonts = await figma.listAvailableFontsAsync();
        if (!fonts.some((f) => f.fontName.family === message.font.family && f.fontName.style === message.font.style)) throw Error("Font is not available in Figma.");
        await figma.loadFontAsync(message.font);
        figma.ui.postMessage({ type: "font-validation-result", requestId: message.requestId, ok: true });
      } catch (error) {
        figma.ui.postMessage({ type: "font-validation-result", requestId: message.requestId, ok: false, error: String(error) });
      }
      return;
    }
    if (message.type === "process-unlock") {
      const licenca = await obterEstadoLicenca(figma.clientStorage, void 0, message.email);
      if (licenca.premium) {
        await figma.clientStorage.setAsync("dt_boilerplate_user_email", message.email);
        figma.ui.postMessage({ type: "purchase-restored" });
        figma.notify("License activated successfully!");
      } else {
        figma.openExternal(`https://dt-boilerplate-lp.vercel.app/?email=${encodeURIComponent(message.email)}#pricing`);
        figma.ui.postMessage({ type: "redirected-to-checkout" });
      }
      return;
    }
    if (message.type !== "generate-variables") return;
    try {
      const licenca = await obterEstadoLicenca(figma.clientStorage);
      if (!podeGerarDesignTokens(licenca)) {
        figma.ui.postMessage({ type: "unlock-required" });
        return;
      }
      const result = await generateVariables(message.tokens, message.presetName);
      if (result.count === 0) {
        figma.notify("No variables were created or updated.", { error: true, timeout: 6e3 });
        figma.ui.postMessage({ type: "variables-generation-failed", error: "No variables were created or updated." });
        return;
      }
      let documentationGenerated = false;
      try {
        await generateVisualDocumentation(message.tokens, result.variablesByName, message.presetName, message.modules, message.iconPreview);
        documentationGenerated = true;
      } catch (error) {
        const detail = error instanceof Error ? error.message : "Unknown error";
        console.error("[DT Boilerplate] Error generating documentation:", error);
        figma.notify(`Variables generated, but documentation failed: ${detail}`, { error: true, timeout: 6e3 });
      }
      if (!licenca.premium) {
        await marcarGeracaoGratuitaUtilizada(figma.clientStorage);
      }
      figma.notify(
        documentationGenerated ? `DT Boilerplate ${result.action} ${result.count} variables and updated documentation.` : `DT Boilerplate ${result.action} ${result.count} variables.`
      );
      const _a = result, { variablesByName } = _a, uiResult = __objRest(_a, ["variablesByName"]);
      figma.ui.postMessage(__spreadProps(__spreadValues({ type: "variables-generated" }, uiResult), { documentationGenerated }));
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Unknown error";
      console.error("Error generating variables:", error);
      figma.notify(`Unable to create variables: ${detail}`, { error: true, timeout: 6e3 });
      figma.ui.postMessage({ type: "variables-generation-failed", error: detail });
    }
  };
  async function generateVariables(tokens, presetName = "DT Boilerplate") {
    try {
      const collectionName = presetName ? `StartToken / Theme: ${presetName}` : "DT Boilerplate";
      const collection = await findOrCreateCollection(collectionName);
      console.log("[DT Boilerplate] Collection:", collection.name, "ID:", collection.id);
      const modeId = collection.modes[0].modeId;
      const existingVariables = await figma.variables.getLocalVariablesAsync();
      const variablesInCollection = existingVariables.filter(
        (v) => v.variableCollectionId === collection.id
      );
      console.log("[DT Boilerplate] Existing variables in collection:", variablesInCollection.length);
      let created = 0;
      let updated = 0;
      const usedNames = /* @__PURE__ */ new Set();
      const variablesByName = /* @__PURE__ */ new Map();
      for (const token of tokens) {
        const variableType = getVariableType(token);
        const name = getHierarchicalName(token);
        if (usedNames.has(name)) continue;
        usedNames.add(name);
        const existingVar = variablesInCollection.find((v) => v.name === name || presetName === "StartToken" && token.module === "colors" && v.name.replace(/\/Grayscale-/g, "/Black-") === name);
        if (existingVar && existingVar.name !== name) existingVar.name = name;
        if (existingVar) {
          try {
            existingVar.setValueForMode(modeId, getVariableValue(token, variableType));
            updated += 1;
            variablesByName.set(name, existingVar);
            console.log(`[DT Boilerplate] Updated variable: ${name}`);
          } catch (error) {
            console.error(`[DT Boilerplate] Failed to update variable ${name}:`, error);
            figma.notify(`Failed to update variable ${name}`, { error: true });
          }
        } else {
          try {
            const variable = figma.variables.createVariable(name, collection, variableType);
            variable.setValueForMode(modeId, getVariableValue(token, variableType));
            created += 1;
            variablesByName.set(name, variable);
            console.log(`[DT Boilerplate] Created variable: ${name}`);
          } catch (error) {
            console.error(`[DT Boilerplate] Failed to create variable ${name}:`, error);
            figma.notify(`Failed to create variable ${name}`, { error: true });
          }
        }
      }
      return {
        action: created > 0 && updated > 0 ? "created and updated" : created > 0 ? "created" : "updated",
        count: created + updated,
        created,
        updated,
        variablesByName
      };
    } catch (error) {
      console.error("[DT Boilerplate] Error in generateVariables:", error);
      throw error;
    }
  }
  async function findOrCreateCollection(collectionName) {
    try {
      const collections = await figma.variables.getLocalVariableCollectionsAsync();
      console.log("[DT Boilerplate] Existing collections:", collections.map((c) => c.name));
      const existing = collections.find((c) => c.name === collectionName);
      if (existing) {
        console.log(`[DT Boilerplate] Reusing existing collection: ${collectionName}`);
        return existing;
      }
      console.log(`[DT Boilerplate] Creating new collection: ${collectionName}`);
      return figma.variables.createVariableCollection(collectionName);
    } catch (error) {
      console.error("[DT Boilerplate] Error in findOrCreateCollection:", error);
      throw new Error(`Failed to find or create collection: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  function getVariableType(token) {
    if (token.type) return token.type;
    if (typeof token.value === "number") return "FLOAT";
    if (typeof token.value === "object") return "COLOR";
    const numeric = parseCssNumber(token.value);
    return numeric === null ? "STRING" : "FLOAT";
  }
  function getVariableValue(token, variableType) {
    var _a;
    if (variableType === "COLOR") return typeof token.value === "string" ? parseColor2(token.value) : token.value;
    if (variableType === "FLOAT") return typeof token.value === "number" ? token.value : (_a = parseCssNumber(token.value)) != null ? _a : 0;
    return token.value;
  }
  function getHierarchicalName(token) {
    if (token.figmaName) return token.figmaName;
    const moduleName = toTitle(token.module);
    const submoduleName = toTitle(token.submodule);
    const tokenName = getTokenName(token);
    return `${moduleName}/${submoduleName}/${tokenName}`;
  }
  function getTokenName(token) {
    var _a, _b;
    if (token.module === "colors" && token.submodule === "palette") {
      const scale = (_a = token.name.match(/-(\d+)$/)) == null ? void 0 : _a[1];
      return scale ? `Primary-${scale}` : "Primary-950";
    }
    if (token.module === "layout" && token.submodule === "space") {
      return String((_b = parseCssNumber(token.value)) != null ? _b : token.name);
    }
    return sanitizeName(token.name);
  }
  function toTitle(value) {
    return value.split(/[-_\s]+/).filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
  }
  function sanitizeName(value) {
    return value.trim().replace(/\s+/g, "-").replace(/\//g, "-");
  }
  function parseCssNumber(value) {
    if (typeof value === "number") return value;
    if (typeof value !== "string") return null;
    const match = value.trim().match(/^-?\d+(\.\d+)?/);
    return match ? Number(match[0]) : null;
  }
  function parseColor2(value) {
    const parsed = parseColor(value);
    if (!parsed) throw new Error(`Unsupported color value: ${value}`);
    return parsed;
  }
})();
