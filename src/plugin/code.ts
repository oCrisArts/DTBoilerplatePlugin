import {
  marcarGeracaoGratuitaUtilizada,
  obterEstadoLicenca,
  podeGerarDesignTokens,
} from "./licensing";

type FigmaVariableType = "COLOR" | "FLOAT" | "STRING";

type TokenPayload = {
  module: string;
  submodule: string;
  name: string;
  value: string;
  type: "color" | "text" | "number";
};

type GenerateVariablesMessage = {
  type: "generate-variables";
  tokens: TokenPayload[];
};

type UnlockMessage = {
  type: "unlock-now";
};

type PluginMessage = GenerateVariablesMessage | UnlockMessage;

type VariableCollection = {
  id: string;
  name: string;
  modes: Array<{ modeId: string; name: string }>;
};

declare const figma: {
  showUI: (html: string, options?: { width?: number; height?: number; themeColors?: boolean }) => void;
  ui: {
    onmessage: (message: PluginMessage) => void;
    postMessage: (message: unknown) => void;
  };
  clientStorage: {
    getAsync: (key: string) => Promise<unknown>;
    setAsync: (key: string, value: unknown) => Promise<void>;
  };
  variables: {
    createVariableCollection: (name: string) => VariableCollection;
    createVariable: (name: string, collection: VariableCollection, variableType: FigmaVariableType) => {
      setValueForMode: (modeId: string, value: unknown) => void;
    };
  };
  openExternal: (url: string) => void;
  notify: (message: string, options?: { error?: boolean; timeout?: number }) => void;
  currentUser?: {
    id: string;
  };
};

declare const __html__: string;

figma.showUI(__html__, {
  width: 420,
  height: 640,
  themeColors: true,
});

figma.ui.onmessage = async (message) => {
  if (message.type === "unlock-now") {
    const userId = figma.currentUser?.id;
    figma.openExternal(`https://dt-boilerplate.figma.site/?user_id=${userId}`);
    return;
  }

  if (message.type !== "generate-variables") return;

  try {
    const userId = figma.currentUser?.id;
    const licenca = await obterEstadoLicenca(figma.clientStorage, userId);

    if (!podeGerarDesignTokens(licenca)) {
      figma.ui.postMessage({ type: "unlock-required" });
      return;
    }

    const collection = figma.variables.createVariableCollection("DT Boilerplate");
    const modeId = collection.modes[0].modeId;
    const created = createVariables(collection, modeId, message.tokens);

    if (!licenca.premium) {
      await marcarGeracaoGratuitaUtilizada(figma.clientStorage);
    }

    figma.notify(`DT Boilerplate created ${created} variables.`);
    figma.ui.postMessage({ type: "variables-generated", created });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown error";
    figma.notify(`Unable to create variables: ${detail}`, { error: true, timeout: 6000 });
    figma.ui.postMessage({ type: "variables-generation-failed", error: detail });
  }
};

function createVariables(collection: VariableCollection, modeId: string, tokens: TokenPayload[]) {
  let created = 0;
  const usedNames = new Set<string>();

  for (const token of tokens) {
    const variableType = getVariableType(token);
    const name = getHierarchicalName(token);

    if (usedNames.has(name)) continue;
    usedNames.add(name);

    const variable = figma.variables.createVariable(name, collection, variableType);
    variable.setValueForMode(modeId, getVariableValue(token, variableType));
    created += 1;
  }

  return created;
}

function getVariableType(token: TokenPayload): FigmaVariableType {
  if (token.type === "color") return "COLOR";
  if (token.type === "number") return "FLOAT";

  const numeric = parseCssNumber(token.value);
  return numeric === null ? "STRING" : "FLOAT";
}

function getVariableValue(token: TokenPayload, variableType: FigmaVariableType) {
  if (variableType === "COLOR") return parseColor(token.value);
  if (variableType === "FLOAT") return parseCssNumber(token.value) ?? 0;
  return token.value;
}

function getHierarchicalName(token: TokenPayload) {
  const moduleName = toTitle(token.module);
  const submoduleName = toTitle(token.submodule);
  const tokenName = getTokenName(token);

  return `${moduleName}/${submoduleName}/${tokenName}`;
}

function getTokenName(token: TokenPayload) {
  if (token.module === "colors" && token.submodule === "palette") {
    const scale = token.name.match(/-(\d+)$/)?.[1];
    return scale ? `Primary-${scale}` : "Primary-950";
  }

  if (token.module === "layout" && token.submodule === "space") {
    return String(parseCssNumber(token.value) ?? token.name);
  }

  return sanitizeName(token.name);
}

function toTitle(value: string) {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function sanitizeName(value: string) {
  return value.trim().replace(/\s+/g, "-").replace(/\//g, "-");
}

function parseCssNumber(value: string) {
  const match = value.trim().match(/^-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function parseColor(value: string) {
  const raw = value.trim();
  const hex = raw.match(/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i);

  if (hex) {
    const expanded = expandHex(hex[1]);
    return {
      r: parseInt(expanded.slice(0, 2), 16) / 255,
      g: parseInt(expanded.slice(2, 4), 16) / 255,
      b: parseInt(expanded.slice(4, 6), 16) / 255,
      a: expanded.length === 8 ? parseInt(expanded.slice(6, 8), 16) / 255 : 1,
    };
  }

  const rgba = raw.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([.\d]+))?\)$/i);

  if (rgba) {
    return {
      r: clamp255(Number(rgba[1])) / 255,
      g: clamp255(Number(rgba[2])) / 255,
      b: clamp255(Number(rgba[3])) / 255,
      a: rgba[4] === undefined ? 1 : clamp01(Number(rgba[4])),
    };
  }

  return { r: 0, g: 0, b: 0, a: 1 };
}

function expandHex(value: string) {
  if (value.length === 3) {
    return value
      .split("")
      .map((part) => `${part}${part}`)
      .join("");
  }

  return value;
}

function clamp255(value: number) {
  return Math.max(0, Math.min(255, value));
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}
