"use strict";
(() => {
  var __defProp = Object.defineProperty;
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

  // src/plugin/code.ts
  figma.showUI(__html__, {
    width: 420,
    height: 640,
    themeColors: true
  });
  figma.ui.onmessage = async (message) => {
    if (message.type === "process-unlock") {
      const licenca = await obterEstadoLicenca(figma.clientStorage, void 0, message.email);
      if (licenca.premium) {
        await figma.clientStorage.setAsync("dt_boilerplate_user_email", message.email);
        figma.ui.postMessage({ type: "purchase-restored" });
        figma.notify("License activated successfully!");
      } else {
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
      figma.ui.postMessage(__spreadValues({ type: "variables-generated" }, result));
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Unknown error";
      console.error("Error generating variables:", error);
      figma.notify(`Unable to create variables: ${detail}`, { error: true, timeout: 6e3 });
      figma.ui.postMessage({ type: "variables-generation-failed", error: detail });
    }
  };
  async function generateVariables(tokens) {
    try {
      const collection = await findOrCreateCollection("DT Boilerplate");
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
      for (const token of tokens) {
        const variableType = getVariableType(token);
        const name = getHierarchicalName(token);
        if (usedNames.has(name)) continue;
        usedNames.add(name);
        const existingVar = variablesInCollection.find((v) => v.name === name);
        if (existingVar) {
          try {
            existingVar.setValueForMode(modeId, getVariableValue(token, variableType));
            updated += 1;
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
    if (token.type === "color") return "COLOR";
    if (token.type === "number") return "FLOAT";
    const numeric = parseCssNumber(token.value);
    return numeric === null ? "STRING" : "FLOAT";
  }
  function getVariableValue(token, variableType) {
    var _a;
    if (variableType === "COLOR") return parseColor(token.value);
    if (variableType === "FLOAT") return (_a = parseCssNumber(token.value)) != null ? _a : 0;
    return token.value;
  }
  function getHierarchicalName(token) {
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
    const match = value.trim().match(/^-?\d+(\.\d+)?/);
    return match ? Number(match[0]) : null;
  }
  function parseColor(value) {
    const raw = value.trim();
    const hex = raw.match(/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i);
    if (hex) {
      const expanded = expandHex(hex[1]);
      return {
        r: parseInt(expanded.slice(0, 2), 16) / 255,
        g: parseInt(expanded.slice(2, 4), 16) / 255,
        b: parseInt(expanded.slice(4, 6), 16) / 255,
        a: expanded.length === 8 ? parseInt(expanded.slice(6, 8), 16) / 255 : 1
      };
    }
    const rgba = raw.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([.\d]+))?\)$/i);
    if (rgba) {
      return {
        r: clamp255(Number(rgba[1])) / 255,
        g: clamp255(Number(rgba[2])) / 255,
        b: clamp255(Number(rgba[3])) / 255,
        a: rgba[4] === void 0 ? 1 : clamp01(Number(rgba[4]))
      };
    }
    return { r: 0, g: 0, b: 0, a: 1 };
  }
  function expandHex(value) {
    if (value.length === 3) {
      return value.split("").map((part) => `${part}${part}`).join("");
    }
    return value;
  }
  function clamp255(value) {
    return Math.max(0, Math.min(255, value));
  }
  function clamp01(value) {
    return Math.max(0, Math.min(1, value));
  }
})();
