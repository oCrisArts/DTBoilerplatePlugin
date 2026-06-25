import {
  marcarGeracaoGratuitaUtilizada,
  obterEstadoLicenca,
  podeGerarDesignTokens,
} from "./licensing";

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

type ProcessUnlockMessage = {
  type: "process-unlock";
  email: string;
  plan: string;
};

type PluginMessage = GenerateVariablesMessage | ProcessUnlockMessage;

type VariableType = "COLOR" | "FLOAT" | "STRING";

type VariableCollection = {
  id: string;
  name: string;
  modes: Array<{ modeId: string; name: string }>;
};

type Variable = {
  name: string;
  variableCollectionId: string;
  setValueForMode: (modeId: string, value: unknown) => void;
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
    createVariable: (name: string, collection: VariableCollection, variableType: VariableType) => Variable;
    getLocalVariablesAsync: () => Promise<Variable[]>;
    getLocalVariableCollectionsAsync: () => Promise<VariableCollection[]>;
  };
  openExternal: (url: string) => void;
  notify: (message: string, options?: { error?: boolean; timeout?: number }) => void;
};

declare const __html__: string;

figma.showUI(__html__, {
  width: 420,
  height: 640,
  themeColors: true,
});

figma.ui.onmessage = async (message: PluginMessage) => {
  if (message.type === "process-unlock") {
    const licenca = await obterEstadoLicenca(figma.clientStorage, undefined, message.email);
    
    if (licenca.premium) {
      await figma.clientStorage.setAsync("dt_boilerplate_user_email", message.email);
      figma.ui.postMessage({ type: "purchase-restored" });
      figma.notify("License activated successfully!");
    } else {
      //figma.openExternal('https://dt-boilerplate-lp.vercel.app/?email=' + encodeURIComponent(message.email));
      figma.openExternal(`https://dt-boilerplate-lp.vercel.app/?email=${encodeURIComponent(message.email)}&plan=${encodeURIComponent(message.plan)}`);
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

    const result = await generateVariables(message.tokens);

    if (!licenca.premium) {
      await marcarGeracaoGratuitaUtilizada(figma.clientStorage);
    }

    figma.notify(`DT Boilerplate ${result.action} ${result.count} variables.`);
    figma.ui.postMessage({ type: "variables-generated", ...result });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown error";
    console.error("Error generating variables:", error);
    figma.notify(`Unable to create variables: ${detail}`, { error: true, timeout: 6000 });
    figma.ui.postMessage({ type: "variables-generation-failed", error: detail });
  }
};

async function generateVariables(tokens: TokenPayload[]) {
  try {
    // Step 1: Find or create the collection
    const collection = await findOrCreateCollection("DT Boilerplate");
    console.log("[DT Boilerplate] Collection:", collection.name, "ID:", collection.id);

    const modeId = collection.modes[0].modeId;
    
    // Step 2: Get existing variables to avoid duplicates
    const existingVariables = await figma.variables.getLocalVariablesAsync();
    const variablesInCollection = existingVariables.filter(
      (v: Variable) => v.variableCollectionId === collection.id
    );
    console.log("[DT Boilerplate] Existing variables in collection:", variablesInCollection.length);

    let created = 0;
    let updated = 0;
    const usedNames = new Set<string>();

    for (const token of tokens) {
      const variableType = getVariableType(token);
      const name = getHierarchicalName(token);

      if (usedNames.has(name)) continue;
      usedNames.add(name);

      // Check if variable already exists
      const existingVar = variablesInCollection.find((v: Variable) => v.name === name);

      if (existingVar) {
        // Update existing variable
        try {
          existingVar.setValueForMode(modeId, getVariableValue(token, variableType));
          updated += 1;
          console.log(`[DT Boilerplate] Updated variable: ${name}`);
        } catch (error) {
          console.error(`[DT Boilerplate] Failed to update variable ${name}:`, error);
          figma.notify(`Failed to update variable ${name}`, { error: true });
        }
      } else {
        // Create new variable
        try {
          const variable = figma.variables.createVariable(name, collection, variableType);
          variable.setValueForMode(modeId, getVariableValue(token, variableType));
          created += 1;
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
      updated
    };
  } catch (error) {
    console.error("[DT Boilerplate] Error in generateVariables:", error);
    throw error;
  }
}

async function findOrCreateCollection(collectionName: string): Promise<VariableCollection> {
  try {
    const collections = await figma.variables.getLocalVariableCollectionsAsync();
    console.log("[DT Boilerplate] Existing collections:", collections.map((c: VariableCollection) => c.name));
    
    const existing = collections.find((c: VariableCollection) => c.name === collectionName);
    
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

function getVariableType(token: TokenPayload): VariableType {
  if (token.type === "color") return "COLOR";
  if (token.type === "number") return "FLOAT";

  const numeric = parseCssNumber(token.value);
  return numeric === null ? "STRING" : "FLOAT";
}

function getVariableValue(token: TokenPayload, variableType: VariableType) {
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