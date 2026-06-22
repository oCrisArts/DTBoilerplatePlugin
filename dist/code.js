(() => {
  // src/plugin/licensing.ts
  var FREE_GENERATION_USED_KEY = "dt_boilerplate_free_generation_used";
  var SUPABASE_URL = "https://lyexuguaeuwdtjeqwmst.supabase.co";
  var SUPABASE_API_KEY = "sb_publishable_BJYVAnl9Arx7gEcHOXzHfA_Bj4iJXGO";
  async function verificarAssinaturaSupabase(userId) {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/customers?user_id=eq.${userId}&select=subscription_status`,
        {
          headers: {
            "apikey": SUPABASE_API_KEY,
            "Authorization": `Bearer ${SUPABASE_API_KEY}`,
            "Content-Type": "application/json"
          }
        }
      );
      if (!response.ok) {
        console.error("Supabase API error:", response.statusText);
        return false;
      }
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        const subscriptionStatus = data[0].subscription_status;
        return subscriptionStatus === "active" || subscriptionStatus === "trialing" || subscriptionStatus === "past_due";
      }
      return false;
    } catch (error) {
      console.error("Error checking subscription:", error);
      return false;
    }
  }
  async function obterEstadoLicenca(clientStorage, userId) {
    const geracaoGratuitaUtilizada = await clientStorage.getAsync(FREE_GENERATION_USED_KEY);
    let premium = false;
    if (userId) {
      premium = await verificarAssinaturaSupabase(userId);
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
    var _a, _b;
    if (message.type === "unlock-now") {
      const userId = (_a = figma.currentUser) == null ? void 0 : _a.id;
      figma.openExternal(`https://dt-boilerplate-lp.vercel.app/?user_id=${userId}`);
      return;
    }
    if (message.type !== "generate-variables") return;
    try {
      const userId = (_b = figma.currentUser) == null ? void 0 : _b.id;
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
      figma.notify(`Unable to create variables: ${detail}`, { error: true, timeout: 6e3 });
      figma.ui.postMessage({ type: "variables-generation-failed", error: detail });
    }
  };
  function createVariables(collection, modeId, tokens) {
    let created = 0;
    const usedNames = /* @__PURE__ */ new Set();
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
