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
  var DOC_PAGE_NAME = "\u{1F4D8} DT Boilerplate \u2014 Visual Foundations";
  var ROOT_PLUGIN_KEY = "dt-boilerplate-doc-root";
  var SAMPLE_TEXT = "The quick brown fox jumps over the lazy dog";
  var UI = {
    boardWidth: 1920,
    boardPaddingX: 80,
    boardPaddingY: 64,
    boardGap: 64,
    compactBoardGap: 48,
    rootGap: 40,
    tableWidth: 1760,
    paletteHeaderHeight: 43,
    headerHeight: 40,
    rowHeight: 64,
    compactRowHeight: 56,
    radius: 8,
    tableRadius: 12,
    fonts: {
      regular: { family: "Inter", style: "Regular" },
      medium: { family: "Inter", style: "Medium" },
      semiBold: { family: "Inter", style: "Semi Bold" },
      bold: { family: "Inter", style: "Bold" },
      extraBold: { family: "Inter", style: "Extra Bold" },
      mono: { family: "JetBrains Mono", style: "Regular" }
    },
    colors: {
      page: { r: 0.97, g: 0.97, b: 0.98 },
      board: { r: 1, g: 1, b: 1 },
      text: { r: 0.047, g: 0.047, b: 0.051 },
      muted: { r: 0.431, g: 0.431, b: 0.502 },
      border: { r: 0.91, g: 0.91, b: 0.93 },
      header: { r: 0.949, g: 0.949, b: 0.957 },
      surface: { r: 0.98, g: 0.98, b: 0.98 },
      accent: { r: 0.369, g: 0.416, b: 0.824 }
    }
  };
  async function generateVisualDocumentation(tokens, variablesByName) {
    await loadFonts();
    await figma.loadAllPagesAsync();
    let page = figma.root.children.find((child) => child.type === "PAGE" && child.name === DOC_PAGE_NAME);
    if (!page) {
      page = figma.createPage();
      page.name = DOC_PAGE_NAME;
    }
    await figma.setCurrentPageAsync(page);
    const existingRoot = page.children.find(
      (child) => child.type === "FRAME" && child.getPluginData(ROOT_PLUGIN_KEY) === "true"
    );
    existingRoot == null ? void 0 : existingRoot.remove();
    const root = createFrame(DOC_PAGE_NAME, "HORIZONTAL", {
      fills: [solid(UI.colors.page)],
      itemSpacing: UI.rootGap,
      padding: 0
    });
    root.setPluginData(ROOT_PLUGIN_KEY, "true");
    root.x = 0;
    root.y = 0;
    page.appendChild(root);
    const isMaterial = tokens.length > 0 && tokens.every((token) => token.name.startsWith("--md-"));
    if (isMaterial) {
      for (const board of await createMaterialBoards(tokens, variablesByName)) root.appendChild(board);
    } else {
      root.appendChild(await createColorPaletteBoard(tokens, variablesByName));
      root.appendChild(await createSemanticColorsBoard(tokens, variablesByName));
      root.appendChild(await createColorTokensBoard(tokens, variablesByName));
      root.appendChild(await createTypographyBoard(tokens, variablesByName));
      root.appendChild(await createLayoutBoard(tokens, variablesByName));
    }
    const firstBoard = root.children[0];
    if (firstBoard) {
      figma.currentPage.selection = [firstBoard];
      figma.viewport.scrollAndZoomIntoView([firstBoard]);
    }
    return { pageName: DOC_PAGE_NAME, frameId: root.id };
  }
  async function createMaterialBoards(tokens, variablesByName) {
    const definitions = [
      { module: "colors", title: "Colors", description: "Material Design 3 system colors. Official namespaces with the current customized values.", groups: ["primary", "secondary", "tertiary", "error", "surface", "inverse", "outline", "utility"] },
      { module: "typography", title: "Typography", description: "Material Design 3 typeface references and the Display, Headline, Title, Body and Label roles.", groups: ["family", "display", "headline", "title", "body", "label"] },
      { module: "layout", title: "Layout", description: "Material Design 3 system shapes.", groups: ["radius"] }
    ];
    const boards = [];
    for (const definition of definitions) {
      const board = createBoard(definition.title, definition.description);
      for (const group of definition.groups) {
        const members = tokens.filter((token) => token.module === definition.module && token.submodule === group);
        if (!members.length) continue;
        const label = group === "family" ? "Typeface" : group === "radius" ? "Shape" : group[0].toUpperCase() + group.slice(1);
        board.appendChild(await createSectionTitle(label));
        board.appendChild(await createTokenTable(
          ["Preview", "Variable Name", "Value", "Variable Path"],
          [240, 480, 200, 808],
          members,
          async (token) => [
            definition.module === "colors" ? await createColorSwatchCell(token, variablesByName) : definition.module === "layout" ? await createLayoutPreviewCell(token, variablesByName) : await createMaterialTypePreview(token, tokens),
            await createTextCell(token.name, "text", 480, 112, 14, "medium"),
            await createTextCell(getDisplayValue(token), "text", 200, 112, 14, "mono"),
            await createTextCell(token.figmaName, "muted", 808, 112, 14, "mono")
          ],
          112
        ));
      }
      boards.push(board);
    }
    return boards;
  }
  async function createMaterialTypePreview(token, tokens) {
    var _a, _b;
    const cell = createCellFrame(240, 112);
    cell.clipsContent = true;
    const role = token.name.replace(/-(font|size|line-height|weight(?:-prominent)?)$/, "");
    const lookup = (suffix) => tokens.find((item) => item.name === `${role}-${suffix}`);
    const font = lookup("font");
    const size = lookup("size");
    const line = lookup("line-height");
    const weight = token.name.endsWith("-weight-prominent") ? token : lookup("weight");
    const toPx = (item) => {
      var _a2;
      return ((_a2 = getNumericValue(item)) != null ? _a2 : 16) * (item.unit === "rem" ? 16 : 1);
    };
    const family = font ? getDisplayValue(font) : token.type === "STRING" ? getDisplayValue(token) : "Roboto";
    const numericWeight = weight ? (_a = getNumericValue(weight)) != null ? _a : 400 : token.type === "FLOAT" ? (_b = getNumericValue(token)) != null ? _b : 400 : 400;
    const style = numericWeight >= 700 ? "Bold" : numericWeight >= 500 ? "Medium" : "Regular";
    const text = createText("Aa", 16, 24, "regular");
    text.fontName = await loadFontSafely(family, style);
    text.fontSize = size ? toPx(size) : 20;
    text.lineHeight = line ? { unit: "PIXELS", value: toPx(line) } : { unit: "AUTO" };
    text.textAutoResize = "TRUNCATE";
    text.resize(224, 96);
    cell.appendChild(text);
    return cell;
  }
  async function createColorPaletteBoard(tokens, variablesByName) {
    const board = createBoard(
      "DT Boilerplate \u2014 Color Palette",
      "The palette defines the foundational colors of the design system. Each scale goes from 950 (darkest) to 100 (lightest)."
    );
    const palette = tokens.filter((token) => token.module === "colors" && token.submodule === "palette");
    for (const group of ["Primary", "Secondary", "Grayscale"]) {
      const groupTokens = palette.filter((token) => getColorFamily(token) === group);
      if (groupTokens.length === 0) continue;
      board.appendChild(await createSectionTitle(group));
      board.appendChild(
        await createTokenTable(
          ["Swatch", "Variable Name", "Hex Value", "Variable Path"],
          [100, 280, 180, 1168],
          groupTokens,
          async (token) => [
            await createColorSwatchCell(token, variablesByName),
            await createTextCell(token.name),
            await createTextCell(getDisplayValue(token)),
            await createTextCell(token.figmaName, "muted")
          ],
          UI.rowHeight,
          UI.paletteHeaderHeight,
          UI.tableRadius
        )
      );
    }
    return board;
  }
  async function createSemanticColorsBoard(tokens, variablesByName) {
    const board = createBoard(
      "DT Boilerplate \u2014 Semantic Colors",
      "Semantic colors communicate meaning and status \u2014 danger (errors), warning (caution), info (informational), and success (positive outcomes)."
    );
    const semantic = tokens.filter((token) => token.module === "colors" && token.submodule === "semantic");
    for (const group of ["Danger", "Warning", "Info", "Success"]) {
      const groupTokens = semantic.filter((token) => token.name.toLowerCase().startsWith(group.toLowerCase()));
      if (groupTokens.length === 0) continue;
      board.appendChild(await createSectionTitle(group));
      board.appendChild(
        await createTokenTable(
          ["Swatch", "Variable Name", "Hex Value", "Variable Path"],
          [100, 280, 180, 1168],
          groupTokens,
          async (token) => [
            await createColorSwatchCell(token, variablesByName),
            await createTextCell(token.name),
            await createTextCell(getDisplayValue(token)),
            await createTextCell(token.figmaName, "muted")
          ],
          UI.rowHeight,
          UI.paletteHeaderHeight,
          UI.tableRadius
        )
      );
    }
    return board;
  }
  async function createColorTokensBoard(tokens, variablesByName) {
    const board = createBoard(
      "Color Tokens",
      "Component-level color tokens map design decisions to specific UI roles \u2014 buttons, inputs, content text, and surface backgrounds.",
      { titleSize: 40, titleLineHeight: 48, titleWeight: "extraBold", descriptionSize: 18, descriptionWidth: 1e3 }
    );
    const colorTokens = tokens.filter((token) => token.module === "colors" && token.submodule === "tokens");
    for (const group of ["Button", "Input", "Content", "Surface"]) {
      const groupTokens = colorTokens.filter((token) => getPathPart(token, 2) === group);
      if (groupTokens.length === 0) continue;
      board.appendChild(await createSectionTitle(group));
      board.appendChild(
        await createTokenTable(
          ["Swatch", "Token", "Value", "Variable Path"],
          [100, 300, 160, 1168],
          groupTokens,
          async (token) => [
            await createColorSwatchCell(token, variablesByName),
            await createTextCell(getPathPart(token, 4) || token.name),
            await createTextCell(getDisplayValue(token)),
            await createTextCell(token.figmaName, "muted")
          ]
        )
      );
    }
    return board;
  }
  async function createTypographyBoard(tokens, variablesByName) {
    const board = createBoard(
      "Typography",
      "Typography variables define the font families, sizes, weights, and line heights used across the design system.",
      {
        sectionLabel: "Documentation",
        titleSize: 48,
        titleLineHeight: 62,
        titleWeight: "bold",
        descriptionSize: 18,
        descriptionWidth: 800,
        headerGap: 8,
        boardGap: UI.compactBoardGap
      }
    );
    const groups = [
      ["Font Families", tokens.filter((token) => token.module === "typography" && token.submodule === "family")],
      ["Font Sizes", tokens.filter((token) => token.module === "typography" && token.submodule === "sizes")],
      ["Font Weights", tokens.filter((token) => token.module === "typography" && token.submodule === "weight")],
      ["Line Heights", tokens.filter((token) => token.module === "typography" && token.submodule === "lineheight")],
      ["Typography Tokens", tokens.filter((token) => token.module === "typography" && token.submodule === "tokens")]
    ];
    for (const [label, groupTokens] of groups) {
      if (groupTokens.length === 0) continue;
      board.appendChild(await createTypographySection(label, groupTokens, variablesByName));
    }
    return board;
  }
  async function createLayoutBoard(tokens, variablesByName) {
    const board = createBoard(
      "Layout",
      "Layout variables define spacing, grid configuration, border radius, and component sizing tokens.",
      {
        sectionLabel: "Documentation",
        titleSize: 48,
        titleLineHeight: 62,
        titleWeight: "bold",
        descriptionSize: 18,
        descriptionWidth: 800,
        headerGap: 8,
        boardGap: UI.compactBoardGap
      }
    );
    const groups = [
      ["Grid", tokens.filter((token) => token.module === "layout" && token.submodule === "grid")],
      ["Border Radius", tokens.filter((token) => token.module === "layout" && token.submodule === "radius")],
      ["Spacing Scale", tokens.filter((token) => token.module === "layout" && token.submodule === "space")]
    ];
    for (const [label, groupTokens] of groups) {
      if (groupTokens.length === 0) continue;
      board.appendChild(await createSectionTitle(label));
      if (label === "Grid") {
        board.appendChild(
          await createTokenTable(
            ["Variable Name", "Value", "Variable Path"],
            [240, 120, 1304],
            groupTokens,
            async (token) => [
              await createTextCell(token.name),
              await createTextCell(getDisplayValue(token), "text", 120, UI.compactRowHeight, 14, "mono"),
              await createTextCell(token.figmaName, "muted", 1304, UI.compactRowHeight, 14, "mono")
            ],
            UI.compactRowHeight
          )
        );
        continue;
      }
      board.appendChild(
        await createTokenTable(
          label === "Border Radius" ? ["Visual preview", "Variable Name", "Value", "Variable Path"] : ["Visual bar", "Variable Name", "Value", "Variable Path"],
          label === "Border Radius" ? [670, 200, 100, 670] : [400, 160, 80, 1e3],
          groupTokens,
          async (token) => [
            await createLayoutPreviewCell(token, variablesByName),
            await createTextCell(token.name),
            await createTextCell(getDisplayValue(token), "text", label === "Border Radius" ? 100 : 80, UI.compactRowHeight, 14, "mono"),
            await createTextCell(token.figmaName, "muted", label === "Border Radius" ? 670 : 1e3, UI.compactRowHeight, 14, "mono")
          ],
          label === "Border Radius" ? 72 : UI.compactRowHeight
        )
      );
    }
    const layoutTokens = tokens.filter((token) => token.module === "layout" && token.submodule === "tokens");
    if (layoutTokens.length > 0) {
      const label = "Component Layout Tokens";
      board.appendChild(await createSectionTitle(label));
      board.appendChild(
        await createTokenTable(
          ["Component", "Token", "Value", "Variable Path"],
          [160, 160, 120, 1200],
          layoutTokens,
          async (token) => [
            await createTextCell(`${getPathPart(token, 2)} ${getPathPart(token, 3)}`.trim()),
            await createTextCell(getPathPart(token, 4) || token.name),
            await createTextCell(getDisplayValue(token), "text", 120, UI.compactRowHeight, 14, "mono"),
            await createTextCell(token.figmaName, "muted", 1200, UI.compactRowHeight, 14, "mono")
          ],
          UI.compactRowHeight
        )
      );
    }
    return board;
  }
  function createBoard(title, description, options = {}) {
    var _a, _b, _c, _d, _e, _f, _g;
    const board = createFrame(title, "VERTICAL", {
      width: UI.boardWidth,
      fills: [solid(UI.colors.board)],
      itemSpacing: (_a = options.boardGap) != null ? _a : UI.boardGap,
      padding: { top: UI.boardPaddingY, right: UI.boardPaddingX, bottom: UI.boardPaddingY, left: UI.boardPaddingX }
    });
    const header = createFrame(`${title} Header`, "VERTICAL", {
      width: UI.tableWidth,
      itemSpacing: (_b = options.headerGap) != null ? _b : 12,
      padding: 0
    });
    if (options.sectionLabel) {
      header.appendChild(createText(options.sectionLabel, 14, 18, "semiBold", "muted"));
    }
    const titleNode = createText(
      title,
      (_c = options.titleSize) != null ? _c : 48,
      (_d = options.titleLineHeight) != null ? _d : 58,
      (_e = options.titleWeight) != null ? _e : "bold",
      title.startsWith("DT Boilerplate") ? "accent" : "text"
    );
    if (!title.startsWith("DT Boilerplate")) titleNode.textAutoResize = "WIDTH_AND_HEIGHT";
    header.appendChild(titleNode);
    const descriptionNode = createText(description, (_f = options.descriptionSize) != null ? _f : 16, 24, "regular", "muted");
    descriptionNode.resize((_g = options.descriptionWidth) != null ? _g : UI.tableWidth, descriptionNode.height);
    descriptionNode.textAutoResize = "HEIGHT";
    header.appendChild(descriptionNode);
    board.appendChild(header);
    return board;
  }
  async function createSectionTitle(title) {
    return createText(title, 32, 39, "bold", "accent");
  }
  async function createTypographySection(title, tokens, variablesByName) {
    const section = createFrame(title, "VERTICAL", {
      width: UI.tableWidth,
      itemSpacing: 16,
      padding: 0
    });
    section.appendChild(await createTypographySectionTitle(title));
    if (title === "Line Heights") {
      section.appendChild(
        await createTypographyTable(
          ["Variable Name", "Value (multiplier)", "Variable Path"],
          [320, 160, 1184],
          tokens,
          async (token) => [
            await createTextCell(token.name, "text", 320, UI.compactRowHeight, 14, "medium"),
            await createTextCell(getDisplayValue(token), "text", 160, UI.compactRowHeight, 14, "mono"),
            await createTextCell(token.figmaName, "muted", 1184, UI.compactRowHeight, 14, "mono")
          ],
          () => UI.compactRowHeight
        )
      );
      return section;
    }
    const columns = getTypographyColumns(title);
    section.appendChild(
      await createTypographyTable(
        columns.headers,
        columns.widths,
        tokens,
        async (token, rowHeight) => [
          await createTypographyPreviewCell(token, variablesByName, columns.widths[0], rowHeight),
          await createTextCell(token.name, "text", columns.widths[1], rowHeight, 14, "medium"),
          await createTextCell(getDisplayValue(token), "text", columns.widths[2], rowHeight, 14, "mono"),
          await createTextCell(token.figmaName, "muted", columns.widths[3], rowHeight, 14, "mono")
        ],
        (token) => getTypographyRowHeight(token)
      )
    );
    return section;
  }
  async function createTypographySectionTitle(title) {
    return createText(title, 24, 31, "bold", "accent");
  }
  function getTypographyColumns(title) {
    if (title === "Font Families") {
      return {
        headers: ["Example text", "Variable Name", "Value", "Variable Path"],
        widths: [240, 240, 240, 920]
      };
    }
    if (title === "Font Sizes") {
      return {
        headers: ["Size preview", "Variable Name", "Value (px)", "Variable Path"],
        widths: [1024, 200, 100, 316]
      };
    }
    return {
      headers: ["Weight preview", "Variable Name", "Value", "Variable Path"],
      widths: [320, 240, 100, 980]
    };
  }
  async function createTypographyTable(headers, columns, tokens, createCells, getRowHeight) {
    const table = createFrame("Typography Table", "VERTICAL", {
      width: UI.tableWidth,
      fills: [],
      strokes: [solid(UI.colors.border)],
      cornerRadius: UI.radius,
      itemSpacing: 0,
      padding: 0
    });
    const header = createFrame("Header", "HORIZONTAL", {
      width: UI.tableWidth,
      height: UI.headerHeight,
      fills: [solid(UI.colors.header)],
      itemSpacing: 24,
      padding: { top: 0, right: 24, bottom: 0, left: 24 },
      alignItems: "CENTER"
    });
    headers.forEach((label, index) => {
      header.appendChild(createTextCell(label, "text", columns[index], UI.headerHeight, 12, "bold"));
    });
    table.appendChild(header);
    for (const token of tokens) {
      const rowHeight = getRowHeight(token);
      const row = createFrame(token.figmaName, "HORIZONTAL", {
        width: UI.tableWidth,
        height: rowHeight,
        fills: [solid(UI.colors.board)],
        itemSpacing: 24,
        padding: { top: 0, right: 24, bottom: 0, left: 24 },
        alignItems: "CENTER"
      });
      const cells = await createCells(token, rowHeight);
      cells.forEach((cell, index) => {
        resizeCell(cell, columns[index], rowHeight);
        row.appendChild(cell);
      });
      table.appendChild(row);
    }
    return table;
  }
  async function createTokenTable(headers, columns, tokens, createCells, rowHeight = UI.rowHeight, headerHeight = UI.headerHeight, cornerRadius = UI.radius) {
    const table = createFrame("Token Table", "VERTICAL", {
      width: UI.tableWidth,
      fills: [solid(UI.colors.board)],
      strokes: [solid(UI.colors.border)],
      cornerRadius,
      itemSpacing: 0,
      padding: 0
    });
    const header = createFrame("Header", "HORIZONTAL", {
      width: UI.tableWidth,
      height: headerHeight,
      fills: [solid(UI.colors.header)],
      itemSpacing: 0,
      padding: { top: 0, right: 16, bottom: 0, left: 16 }
    });
    headers.forEach((label, index) => {
      header.appendChild(createTextCell(label, "text", columns[index], headerHeight, 16, "bold"));
    });
    table.appendChild(header);
    for (const token of tokens) {
      const row = createFrame(token.figmaName, "HORIZONTAL", {
        width: UI.tableWidth,
        height: rowHeight,
        fills: [solid(UI.colors.board)],
        itemSpacing: 0,
        padding: { top: 0, right: 16, bottom: 0, left: 16 }
      });
      const cells = await createCells(token);
      cells.forEach((cell, index) => {
        resizeCell(cell, columns[index], rowHeight);
        row.appendChild(cell);
      });
      table.appendChild(row);
    }
    return table;
  }
  async function createColorSwatchCell(token, variablesByName) {
    const cell = createCellFrame(100, UI.rowHeight);
    const swatch = figma.createRectangle();
    swatch.name = `${token.name} Swatch`;
    swatch.resize(48, 48);
    swatch.cornerRadius = 4;
    setColorPaint(swatch, token, variablesByName);
    cell.appendChild(swatch);
    return cell;
  }
  async function createTypographyPreviewCell(token, variablesByName, width = 520, rowHeight = UI.compactRowHeight) {
    const cell = createCellFrame(width, rowHeight);
    cell.clipsContent = true;
    const value = getNumericValue(token);
    const text = createText(SAMPLE_TEXT, 16, 22, "regular");
    const sampleWidth = Math.max(1, width);
    const sampleLineHeight = getTypographySampleLineHeight(token);
    if (token.submodule === "family") {
      const family = getDisplayValue(token);
      text.characters = family.toLowerCase().includes("material") ? "home" : "Aa";
      text.fontName = await loadFontSafely(family, "Regular");
      text.fontSize = family.toLowerCase().includes("material") ? 24 : 20;
    } else if (token.submodule === "sizes" && value !== null) {
      text.fontSize = Math.max(1, value);
    } else if (token.submodule === "weight" && value !== null) {
      text.characters = "DT Boilerplate Typography";
      text.fontSize = 18;
      text.fontName = await fontForWeight(value);
    } else if (token.submodule === "lineheight" && value !== null) {
      text.lineHeight = value <= 4 ? { unit: "PERCENT", value: value * 100 } : { unit: "PIXELS", value };
    }
    text.textAutoResize = "TRUNCATE";
    text.resize(sampleWidth, Math.max(1, rowHeight - 32));
    text.lineHeight = sampleLineHeight;
    cell.clipsContent = true;
    if (token.submodule === "sizes") bindFloat(text, token, variablesByName, "fontSize");
    cell.appendChild(text);
    return cell;
  }
  function getTypographyRowHeight(token) {
    var _a;
    const value = (_a = getNumericValue(token)) != null ? _a : 16;
    if (token.submodule === "family") {
      return valueLabel(token).toLowerCase().includes("material") ? 61 : 58;
    }
    if (token.submodule === "sizes") {
      return Math.max(UI.compactRowHeight, Math.ceil(value * 1.3) + 32);
    }
    return UI.compactRowHeight;
  }
  function getTypographySampleLineHeight(token) {
    const value = getNumericValue(token);
    if (token.submodule === "lineheight" && value !== null) {
      return value <= 4 ? { unit: "PERCENT", value: value * 100 } : { unit: "PIXELS", value };
    }
    return { unit: "AUTO" };
  }
  function valueLabel(token) {
    return getDisplayValue(token);
  }
  async function createLayoutPreviewCell(token, variablesByName) {
    var _a;
    const cell = createCellFrame(400, UI.compactRowHeight);
    const value = (_a = getNumericValue(token)) != null ? _a : 0;
    if (token.submodule === "grid") {
      const lowerName = token.name.toLowerCase();
      const preview = createFrame("Grid Preview", "HORIZONTAL", {
        width: 180,
        height: 32,
        fills: [solid(UI.colors.surface)],
        itemSpacing: lowerName.includes("gutter") ? Math.max(0, Math.min(16, value)) : 4,
        padding: lowerName.includes("padding") ? Math.max(0, Math.min(16, value)) : 4,
        cornerRadius: 4
      });
      if (lowerName.includes("gutter")) bindFloat(preview, token, variablesByName, "itemSpacing");
      if (lowerName.includes("padding")) bindPadding(preview, token, variablesByName);
      const columns = Math.max(1, Math.min(12, value || 4));
      for (let index = 0; index < columns; index += 1) {
        const column = figma.createRectangle();
        column.name = "Column";
        column.resize(Math.max(4, (160 - (columns - 1) * 4) / columns), 24);
        column.fills = [solid(UI.colors.accent, 0.28)];
        preview.appendChild(column);
      }
      cell.appendChild(preview);
      return cell;
    }
    if (token.submodule === "radius") {
      const rect = figma.createRectangle();
      rect.name = "Radius Preview";
      rect.resize(72, 32);
      rect.cornerRadius = value;
      rect.fills = [solid(UI.colors.accent, 0.18)];
      rect.strokes = [solid(UI.colors.accent, 0.45)];
      bindFloat(rect, token, variablesByName, "cornerRadius");
      cell.appendChild(rect);
      return cell;
    }
    if (token.submodule === "tokens") {
      const preview = createFrame("Layout Token Preview", "HORIZONTAL", {
        width: 160,
        height: token.name.includes("height") ? Math.max(24, Math.min(48, value)) : 40,
        fills: [solid(UI.colors.accent, 0.1)],
        strokes: [solid(UI.colors.accent, 0.35)],
        itemSpacing: token.name.includes("gap") ? Math.max(0, Math.min(24, value)) : 8,
        padding: 8,
        cornerRadius: token.name.includes("radius") ? value : 8,
        alignItems: "CENTER"
      });
      const dotA = createDot();
      const dotB = createDot();
      preview.appendChild(dotA);
      preview.appendChild(dotB);
      if (token.name.includes("height")) bindFloat(preview, token, variablesByName, "height");
      if (token.name.includes("padding-inline")) bindInlinePadding(preview, token, variablesByName);
      if (token.name.includes("padding-block")) bindBlockPadding(preview, token, variablesByName);
      if (token.name.endsWith(".padding")) bindPadding(preview, token, variablesByName);
      if (token.name.includes("gap")) bindFloat(preview, token, variablesByName, "itemSpacing");
      if (token.name.includes("radius")) bindFloat(preview, token, variablesByName, "cornerRadius");
      cell.appendChild(preview);
      return cell;
    }
    const bar = figma.createRectangle();
    bar.name = "Space Preview";
    bar.resize(Math.max(4, Math.min(240, value * 4 || 4)), 12);
    bar.cornerRadius = 6;
    bar.fills = [solid(UI.colors.accent, 0.55)];
    bindFloat(bar, token, variablesByName, "width");
    cell.appendChild(bar);
    return cell;
  }
  function createDot() {
    const dot = figma.createEllipse();
    dot.name = "Layout Dot";
    dot.resize(10, 10);
    dot.fills = [solid(UI.colors.accent, 0.45)];
    return dot;
  }
  function createTextCell(value, color = "text", width = 240, height = UI.rowHeight, size = 15, weight = "regular") {
    const cell = createCellFrame(width, height);
    cell.clipsContent = true;
    const text = createText(value, size, 20, weight, color);
    text.textAutoResize = "TRUNCATE";
    text.resize(width - 16, 24);
    cell.appendChild(text);
    return cell;
  }
  function createCellFrame(width, height) {
    return createFrame("Cell", "HORIZONTAL", {
      width,
      height,
      fills: [],
      itemSpacing: 0,
      padding: 0,
      alignItems: "CENTER"
    });
  }
  function resizeCell(cell, width, height) {
    if ("resize" in cell) cell.resize(width, height);
  }
  function createFrame(name, layoutMode, options) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const frame = figma.createFrame();
    frame.name = name;
    if (options.width !== void 0 || options.height !== void 0) {
      frame.resize((_a = options.width) != null ? _a : 1, (_b = options.height) != null ? _b : 1);
    }
    frame.fills = (_c = options.fills) != null ? _c : [];
    frame.strokes = (_d = options.strokes) != null ? _d : [];
    frame.cornerRadius = (_e = options.cornerRadius) != null ? _e : 0;
    frame.layoutMode = layoutMode;
    frame.primaryAxisSizingMode = layoutMode === "HORIZONTAL" ? options.width === void 0 ? "AUTO" : "FIXED" : options.height === void 0 ? "AUTO" : "FIXED";
    frame.counterAxisSizingMode = layoutMode === "HORIZONTAL" ? options.height === void 0 ? "AUTO" : "FIXED" : options.width === void 0 ? "AUTO" : "FIXED";
    frame.primaryAxisAlignItems = "MIN";
    frame.counterAxisAlignItems = (_f = options.alignItems) != null ? _f : "MIN";
    frame.itemSpacing = (_g = options.itemSpacing) != null ? _g : 0;
    setPadding(frame, (_h = options.padding) != null ? _h : 0);
    frame.clipsContent = false;
    return frame;
  }
  function createText(value, size, lineHeight, weight, color = "text") {
    const text = figma.createText();
    text.name = value.length > 48 ? `${value.substring(0, 45)}...` : value;
    text.fontName = UI.fonts[weight];
    text.characters = value;
    text.fontSize = size;
    text.lineHeight = { unit: "PIXELS", value: lineHeight };
    text.fills = [solid(UI.colors[color])];
    return text;
  }
  function setPadding(frame, padding) {
    const value = typeof padding === "number" ? { top: padding, right: padding, bottom: padding, left: padding } : padding;
    frame.paddingTop = value.top;
    frame.paddingRight = value.right;
    frame.paddingBottom = value.bottom;
    frame.paddingLeft = value.left;
  }
  function setColorPaint(node, token, variablesByName) {
    const paint = solid(parseTokenColor(token));
    const variable = getVariable(token, variablesByName);
    node.fills = [bindPaint(paint, variable)];
  }
  function bindPaint(paint, variable) {
    if (!variable) return paint;
    try {
      return figma.variables.setBoundVariableForPaint(paint, "color", variable);
    } catch (error) {
      return paint;
    }
  }
  function bindFloat(node, token, variablesByName, field) {
    const variable = getVariable(token, variablesByName);
    if (!variable || token.type !== "FLOAT" || !("setBoundVariable" in node)) return;
    try {
      node.setBoundVariable(field, variable);
    } catch (error) {
    }
  }
  function bindPadding(node, token, variablesByName) {
    bindFloat(node, token, variablesByName, "paddingTop");
    bindFloat(node, token, variablesByName, "paddingRight");
    bindFloat(node, token, variablesByName, "paddingBottom");
    bindFloat(node, token, variablesByName, "paddingLeft");
  }
  function bindInlinePadding(node, token, variablesByName) {
    bindFloat(node, token, variablesByName, "paddingRight");
    bindFloat(node, token, variablesByName, "paddingLeft");
  }
  function bindBlockPadding(node, token, variablesByName) {
    bindFloat(node, token, variablesByName, "paddingTop");
    bindFloat(node, token, variablesByName, "paddingBottom");
  }
  function getVariable(token, variablesByName) {
    return variablesByName.get(token.figmaName);
  }
  async function loadFonts() {
    UI.fonts.regular = await loadFontSafely(UI.fonts.regular.family, UI.fonts.regular.style);
    UI.fonts.medium = await loadFontSafely(UI.fonts.medium.family, UI.fonts.medium.style);
    UI.fonts.semiBold = await loadFontSafely(UI.fonts.semiBold.family, UI.fonts.semiBold.style);
    UI.fonts.bold = await loadFontSafely(UI.fonts.bold.family, UI.fonts.bold.style);
    UI.fonts.extraBold = await loadFontSafely(UI.fonts.extraBold.family, UI.fonts.extraBold.style);
    UI.fonts.mono = await loadFontSafely(UI.fonts.mono.family, UI.fonts.mono.style);
    await Promise.all([
      loadFontSafely("DM Sans", "Regular"),
      loadFontSafely("DM Sans", "Bold"),
      loadFontSafely("DM Sans", "SemiBold"),
      loadFontSafely("DM Sans", "Light")
    ]);
  }
  async function loadFontSafely(family, style) {
    const requested = { family, style };
    try {
      await figma.loadFontAsync(requested);
      return requested;
    } catch (error) {
      await figma.loadFontAsync(UI.fonts.regular);
      return UI.fonts.regular;
    }
  }
  async function fontForWeight(value) {
    if (value >= 700) return loadFontSafely("Inter", "Bold");
    if (value >= 600) return loadFontSafely("Inter", "Semi Bold");
    if (value >= 500) return loadFontSafely("Inter", "Medium");
    return UI.fonts.regular;
  }
  function solid(color, opacity) {
    const alpha = "a" in color ? color.a : opacity != null ? opacity : 1;
    return { type: "SOLID", color: { r: color.r, g: color.g, b: color.b }, opacity: alpha };
  }
  function parseTokenColor(token) {
    var _a, _b;
    if (typeof token.value === "object") return token.value;
    return parseColor((_b = (_a = token.preview) != null ? _a : token.displayValue) != null ? _b : String(token.value));
  }
  function parseColor(value) {
    const raw = value.trim();
    const hex = raw.match(/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i);
    if (hex) {
      const expanded = hex[1].length === 3 ? hex[1].split("").map((part) => `${part}${part}`).join("") : hex[1];
      return {
        r: parseInt(expanded.substring(0, 2), 16) / 255,
        g: parseInt(expanded.substring(2, 4), 16) / 255,
        b: parseInt(expanded.substring(4, 6), 16) / 255,
        a: expanded.length === 8 ? parseInt(expanded.substring(6, 8), 16) / 255 : 1
      };
    }
    return { r: 0, g: 0, b: 0, a: 1 };
  }
  function getDisplayValue(token) {
    var _a;
    return (_a = token.displayValue) != null ? _a : String(token.value);
  }
  function getNumericValue(token) {
    if (typeof token.value === "number") return token.value;
    const raw = getDisplayValue(token);
    const match = raw.match(/^-?\d+(\.\d+)?/);
    return match ? Number(match[0]) : null;
  }
  function getPathPart(token, index) {
    var _a;
    return (_a = token.figmaName.split("/")[index]) != null ? _a : "";
  }
  function getColorFamily(token) {
    const lower = token.name.toLowerCase();
    if (lower.startsWith("secondary")) return "Secondary";
    if (lower.startsWith("grayscale") || lower.startsWith("gray") || lower.startsWith("neutral")) return "Grayscale";
    return "Primary";
  }

  // src/plugin/code.ts
  figma.showUI(__html__, {
    width: 420,
    height: 747,
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
      const result = await generateVariables(message.tokens, message.presetName);
      if (result.count === 0) {
        figma.notify("No variables were created or updated.", { error: true, timeout: 6e3 });
        figma.ui.postMessage({ type: "variables-generation-failed", error: "No variables were created or updated." });
        return;
      }
      let documentationGenerated = false;
      try {
        await generateVisualDocumentation(message.tokens, result.variablesByName);
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
        const existingVar = variablesInCollection.find((v) => v.name === name);
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
