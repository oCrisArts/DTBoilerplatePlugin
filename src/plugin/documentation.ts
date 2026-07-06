export type DocumentationTokenPayload = {
  id: string;
  module: string;
  submodule: string;
  name: string;
  figmaName: string;
  value: string | number | { r: number; g: number; b: number; a: number };
  type: "COLOR" | "FLOAT" | "STRING";
  displayValue: string;
  unit?: string;
  preview?: string;
  icon?: string;
};

export type DocumentationVariableMap = Map<string, unknown>;

const DOC_PAGE_NAME = "📘 DT Boilerplate — Visual Foundations";
const ROOT_PLUGIN_KEY = "dt-boilerplate-doc-root";
const SAMPLE_TEXT = "The quick brown fox jumps over the lazy dog";

const UI = {
  boardWidth: 1920,
  boardPaddingX: 80,
  boardPaddingY: 64,
  boardGap: 64,
  rootGap: 40,
  tableWidth: 1760,
  headerHeight: 40,
  rowHeight: 64,
  compactRowHeight: 56,
  radius: 8,
  fonts: {
    regular: { family: "Inter", style: "Regular" } as FontName,
    medium: { family: "Inter", style: "Medium" } as FontName,
    semiBold: { family: "Inter", style: "Semi Bold" } as FontName,
    bold: { family: "Inter", style: "Bold" } as FontName,
  },
  colors: {
    page: { r: 0.97, g: 0.97, b: 0.98 },
    board: { r: 1, g: 1, b: 1 },
    text: { r: 0.047, g: 0.047, b: 0.051 },
    muted: { r: 0.431, g: 0.431, b: 0.502 },
    border: { r: 0.91, g: 0.91, b: 0.93 },
    header: { r: 0.949, g: 0.949, b: 0.957 },
    surface: { r: 0.98, g: 0.98, b: 0.98 },
    accent: { r: 0.369, g: 0.416, b: 0.824 },
  },
};

type TextStyleName = keyof typeof UI.fonts;

export async function generateVisualDocumentation(
  tokens: DocumentationTokenPayload[],
  variablesByName: DocumentationVariableMap
) {
  await loadFonts();
  await figma.loadAllPagesAsync();

  let page = figma.root.children.find((child) => child.type === "PAGE" && child.name === DOC_PAGE_NAME) as PageNode | undefined;

  if (!page) {
    page = figma.createPage();
    page.name = DOC_PAGE_NAME;
  }

  await figma.setCurrentPageAsync(page);

  const existingRoot = page.children.find(
    (child) => child.type === "FRAME" && child.getPluginData(ROOT_PLUGIN_KEY) === "true"
  );
  existingRoot?.remove();

  const root = createFrame(DOC_PAGE_NAME, "HORIZONTAL", {
    fills: [solid(UI.colors.page)],
    itemSpacing: UI.rootGap,
    padding: 0,
  });
  root.setPluginData(ROOT_PLUGIN_KEY, "true");
  root.x = 0;
  root.y = 0;
  page.appendChild(root);

  root.appendChild(await createColorPaletteBoard(tokens, variablesByName));
  root.appendChild(await createSemanticColorsBoard(tokens, variablesByName));
  root.appendChild(await createColorTokensBoard(tokens, variablesByName));
  root.appendChild(await createTypographyBoard(tokens, variablesByName));
  root.appendChild(await createLayoutBoard(tokens, variablesByName));

  figma.currentPage.selection = [root];
  figma.viewport.scrollAndZoomIntoView([root]);

  return { pageName: DOC_PAGE_NAME, frameId: root.id };
}

async function createColorPaletteBoard(tokens: DocumentationTokenPayload[], variablesByName: DocumentationVariableMap) {
  const board = createBoard("DT Boilerplate — Color Palette", "Core brand scales grouped by family.");
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
          await createTextCell(token.figmaName, "muted"),
        ]
      )
    );
  }

  return board;
}

async function createSemanticColorsBoard(tokens: DocumentationTokenPayload[], variablesByName: DocumentationVariableMap) {
  const board = createBoard("DT Boilerplate — Semantic Colors", "State colors organized by semantic intent.");
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
          await createTextCell(token.figmaName, "muted"),
        ]
      )
    );
  }

  return board;
}

async function createColorTokensBoard(tokens: DocumentationTokenPayload[], variablesByName: DocumentationVariableMap) {
  const board = createBoard("Color Tokens", "Component color tokens preserving the component scope path.");
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
          await createTextCell(token.figmaName, "muted"),
        ]
      )
    );
  }

  return board;
}

async function createTypographyBoard(tokens: DocumentationTokenPayload[], variablesByName: DocumentationVariableMap) {
  const board = createBoard("Typography", "Font families, type scale, weights, line heights and typography tokens.");

  const groups = [
    ["Family", tokens.filter((token) => token.module === "typography" && token.submodule === "family")],
    ["Sizes", tokens.filter((token) => token.module === "typography" && token.submodule === "sizes")],
    ["Weight", tokens.filter((token) => token.module === "typography" && token.submodule === "weight")],
    ["Line Height", tokens.filter((token) => token.module === "typography" && token.submodule === "line-height")],
    ["Typography Tokens", tokens.filter((token) => token.module === "typography" && token.submodule === "tokens")],
  ] as const;

  for (const [label, groupTokens] of groups) {
    if (groupTokens.length === 0) continue;

    board.appendChild(await createSectionTitle(label));
    board.appendChild(
      await createTokenTable(
        ["Preview", "Variable Name", "Value", "Variable Path"],
        [520, 260, 180, 768],
        groupTokens,
        async (token) => [
          await createTypographyPreviewCell(token, variablesByName),
          await createTextCell(token.name),
          await createTextCell(getDisplayValue(token)),
          await createTextCell(token.figmaName, "muted"),
        ],
        UI.compactRowHeight
      )
    );
  }

  return board;
}

async function createLayoutBoard(tokens: DocumentationTokenPayload[], variablesByName: DocumentationVariableMap) {
  const board = createBoard("Layout", "Grid, radius, spacing and component layout tokens.");

  const groups = [
    ["Grid", tokens.filter((token) => token.module === "layout" && token.submodule === "grid")],
    ["Radius", tokens.filter((token) => token.module === "layout" && token.submodule === "radius")],
    ["Space", tokens.filter((token) => token.module === "layout" && token.submodule === "space")],
  ] as const;

  for (const [label, groupTokens] of groups) {
    if (groupTokens.length === 0) continue;

    board.appendChild(await createSectionTitle(label));
    board.appendChild(
      await createTokenTable(
        ["Preview", "Variable Name", "Value", "Variable Path"],
        [400, 160, 80, 1000],
        groupTokens,
        async (token) => [
          await createLayoutPreviewCell(token, variablesByName),
          await createTextCell(token.name),
          await createTextCell(getDisplayValue(token)),
          await createTextCell(token.figmaName, "muted"),
        ],
        UI.compactRowHeight
      )
    );
  }

  const layoutTokens = tokens.filter((token) => token.module === "layout" && token.submodule === "tokens");
  const tokenGroups = [
    ["Button Primary", layoutTokens.filter((token) => getPathPart(token, 2) === "Button" && getPathPart(token, 3) === "Primary")],
    ["Button Secondary", layoutTokens.filter((token) => getPathPart(token, 2) === "Button" && getPathPart(token, 3) === "Secondary")],
    ["Input Primary", layoutTokens.filter((token) => getPathPart(token, 2) === "Input" && getPathPart(token, 3) === "Primary")],
    ["Surface Primary", layoutTokens.filter((token) => getPathPart(token, 2) === "Surface" && getPathPart(token, 3) === "Primary")],
  ] as const;

  for (const [label, groupTokens] of tokenGroups) {
    if (groupTokens.length === 0) continue;

    board.appendChild(await createSectionTitle(label));
    board.appendChild(
      await createTokenTable(
        ["Preview", "Variable Name", "Value", "Variable Path"],
        [400, 160, 80, 1000],
        groupTokens,
        async (token) => [
          await createLayoutPreviewCell(token, variablesByName),
          await createTextCell(token.name),
          await createTextCell(getDisplayValue(token)),
          await createTextCell(token.figmaName, "muted"),
        ],
        UI.compactRowHeight
      )
    );
  }

  return board;
}

function createBoard(title: string, description: string) {
  const board = createFrame(title, "VERTICAL", {
    width: UI.boardWidth,
    fills: [solid(UI.colors.board)],
    itemSpacing: UI.boardGap,
    padding: { top: UI.boardPaddingY, right: UI.boardPaddingX, bottom: UI.boardPaddingY, left: UI.boardPaddingX },
  });

  const header = createFrame(`${title} Header`, "VERTICAL", {
    width: UI.tableWidth,
    itemSpacing: 12,
    padding: 0,
  });

  header.appendChild(createText(title, 44, 58, "semiBold"));
  header.appendChild(createText(description, 18, 24, "regular", "muted"));
  board.appendChild(header);

  return board;
}

async function createSectionTitle(title: string) {
  return createText(title, 30, 36, "semiBold");
}

async function createTokenTable(
  headers: string[],
  columns: number[],
  tokens: DocumentationTokenPayload[],
  createCells: (token: DocumentationTokenPayload) => Promise<SceneNode[]>,
  rowHeight = UI.rowHeight
) {
  const table = createFrame("Token Table", "VERTICAL", {
    width: UI.tableWidth,
    fills: [solid(UI.colors.board)],
    strokes: [solid(UI.colors.border)],
    cornerRadius: UI.radius,
    itemSpacing: 0,
    padding: 0,
  });

  const header = createFrame("Header", "HORIZONTAL", {
    width: UI.tableWidth,
    height: UI.headerHeight,
    fills: [solid(UI.colors.header)],
    itemSpacing: 0,
    padding: { top: 0, right: 16, bottom: 0, left: 16 },
  });

  headers.forEach((label, index) => {
    header.appendChild(createTextCell(label, "muted", columns[index], UI.headerHeight, 13, "medium"));
  });
  table.appendChild(header);

  for (const token of tokens) {
    const row = createFrame(token.figmaName, "HORIZONTAL", {
      width: UI.tableWidth,
      height: rowHeight,
      fills: [solid(UI.colors.board)],
      itemSpacing: 0,
      padding: { top: 0, right: 16, bottom: 0, left: 16 },
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

async function createColorSwatchCell(token: DocumentationTokenPayload, variablesByName: DocumentationVariableMap) {
  const cell = createCellFrame(100, UI.rowHeight);
  const swatch = figma.createRectangle();
  swatch.name = `${token.name} Swatch`;
  swatch.resize(48, 48);
  swatch.cornerRadius = 4;
  setColorPaint(swatch, token, variablesByName);
  cell.appendChild(swatch);
  return cell;
}

async function createTypographyPreviewCell(token: DocumentationTokenPayload, variablesByName: DocumentationVariableMap) {
  const cell = createCellFrame(520, UI.compactRowHeight);
  const value = getNumericValue(token);
  const text = createText(SAMPLE_TEXT, 16, 22, "regular");

  if (token.submodule === "family") {
    text.fontName = await loadFontSafely(getDisplayValue(token), "Regular");
  } else if (token.submodule === "sizes" && value !== null) {
    text.fontSize = Math.max(8, Math.min(32, value));
  } else if (token.submodule === "weight" && value !== null) {
    text.fontName = await fontForWeight(value);
  } else if (token.submodule === "line-height" && value !== null) {
    text.lineHeight = value <= 4 ? { unit: "PERCENT", value: value * 100 } : { unit: "PIXELS", value };
  }

  bindFloat(text, token, variablesByName, "fontSize");
  cell.appendChild(text);
  return cell;
}

async function createLayoutPreviewCell(token: DocumentationTokenPayload, variablesByName: DocumentationVariableMap) {
  const cell = createCellFrame(400, UI.compactRowHeight);
  const value = getNumericValue(token) ?? 0;

  if (token.submodule === "grid") {
    const lowerName = token.name.toLowerCase();
    const preview = createFrame("Grid Preview", "HORIZONTAL", {
      width: 180,
      height: 32,
      fills: [solid(UI.colors.surface)],
      itemSpacing: lowerName.includes("gutter") ? Math.max(0, Math.min(16, value)) : 4,
      padding: lowerName.includes("padding") ? Math.max(0, Math.min(16, value)) : 4,
      cornerRadius: 4,
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
      alignItems: "CENTER",
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

function createTextCell(
  value: string,
  color: "text" | "muted" = "text",
  width = 240,
  height = UI.rowHeight,
  size = 15,
  weight: TextStyleName = "regular"
) {
  const cell = createCellFrame(width, height);
  const text = createText(value, size, 20, weight, color);
  text.textAutoResize = "TRUNCATE";
  text.resize(width - 16, 24);
  cell.appendChild(text);
  return cell;
}

function createCellFrame(width: number, height: number) {
  return createFrame("Cell", "HORIZONTAL", {
    width,
    height,
    fills: [],
    itemSpacing: 0,
    padding: 0,
    alignItems: "CENTER",
  });
}

function resizeCell(cell: SceneNode, width: number, height: number) {
  if ("resize" in cell) cell.resize(width, height);
}

function createFrame(
  name: string,
  layoutMode: "HORIZONTAL" | "VERTICAL",
  options: {
    width?: number;
    height?: number;
    fills?: Paint[];
    strokes?: Paint[];
    cornerRadius?: number;
    itemSpacing?: number;
    padding?: number | { top: number; right: number; bottom: number; left: number };
    alignItems?: "MIN" | "CENTER" | "MAX";
  }
) {
  const frame = figma.createFrame();
  frame.name = name;
  frame.fills = options.fills ?? [];
  frame.strokes = options.strokes ?? [];
  frame.cornerRadius = options.cornerRadius ?? 0;
  frame.layoutMode = layoutMode;
  frame.primaryAxisSizingMode = options.height === undefined ? "AUTO" : "FIXED";
  frame.counterAxisSizingMode = options.width === undefined ? "AUTO" : "FIXED";
  frame.primaryAxisAlignItems = "MIN";
  frame.counterAxisAlignItems = options.alignItems ?? "MIN";
  frame.itemSpacing = options.itemSpacing ?? 0;
  setPadding(frame, options.padding ?? 0);
  frame.clipsContent = false;

  if (options.width !== undefined || options.height !== undefined) {
    frame.resize(options.width ?? 1, options.height ?? 1);
  }

  return frame;
}

function createText(value: string, size: number, lineHeight: number, weight: TextStyleName, color: "text" | "muted" = "text") {
  const text = figma.createText();
  text.name = value.length > 48 ? `${value.substring(0, 45)}...` : value;
  text.fontName = UI.fonts[weight];
  text.characters = value;
  text.fontSize = size;
  text.lineHeight = { unit: "PIXELS", value: lineHeight };
  text.fills = [solid(UI.colors[color])];
  return text;
}

function setPadding(frame: FrameNode, padding: number | { top: number; right: number; bottom: number; left: number }) {
  const value = typeof padding === "number" ? { top: padding, right: padding, bottom: padding, left: padding } : padding;
  frame.paddingTop = value.top;
  frame.paddingRight = value.right;
  frame.paddingBottom = value.bottom;
  frame.paddingLeft = value.left;
}

function setColorPaint(node: GeometryMixin, token: DocumentationTokenPayload, variablesByName: DocumentationVariableMap) {
  const paint = solid(parseTokenColor(token));
  const variable = getVariable(token, variablesByName);
  node.fills = [bindPaint(paint, variable)];
}

function bindPaint(paint: SolidPaint, variable: Variable | undefined) {
  if (!variable) return paint;

  try {
    return figma.variables.setBoundVariableForPaint(paint, "color", variable);
  } catch (error) {
    return paint;
  }
}

function bindFloat(node: SceneNode, token: DocumentationTokenPayload, variablesByName: DocumentationVariableMap, field: VariableBindableNodeField) {
  const variable = getVariable(token, variablesByName);
  if (!variable || token.type !== "FLOAT" || !("setBoundVariable" in node)) return;

  try {
    node.setBoundVariable(field, variable);
  } catch (error) {
    // Figma exposes binding support per node/property; unsupported pairs keep the resolved fallback.
  }
}

function bindPadding(node: SceneNode, token: DocumentationTokenPayload, variablesByName: DocumentationVariableMap) {
  bindFloat(node, token, variablesByName, "paddingTop");
  bindFloat(node, token, variablesByName, "paddingRight");
  bindFloat(node, token, variablesByName, "paddingBottom");
  bindFloat(node, token, variablesByName, "paddingLeft");
}

function bindInlinePadding(node: SceneNode, token: DocumentationTokenPayload, variablesByName: DocumentationVariableMap) {
  bindFloat(node, token, variablesByName, "paddingRight");
  bindFloat(node, token, variablesByName, "paddingLeft");
}

function bindBlockPadding(node: SceneNode, token: DocumentationTokenPayload, variablesByName: DocumentationVariableMap) {
  bindFloat(node, token, variablesByName, "paddingTop");
  bindFloat(node, token, variablesByName, "paddingBottom");
}

function getVariable(token: DocumentationTokenPayload, variablesByName: DocumentationVariableMap) {
  return variablesByName.get(token.figmaName) as Variable | undefined;
}

async function loadFonts() {
  await Promise.all([
    loadFontSafely(UI.fonts.regular.family, UI.fonts.regular.style),
    loadFontSafely(UI.fonts.medium.family, UI.fonts.medium.style),
    loadFontSafely(UI.fonts.semiBold.family, UI.fonts.semiBold.style),
    loadFontSafely(UI.fonts.bold.family, UI.fonts.bold.style),
  ]);
}

async function loadFontSafely(family: string, style: string): Promise<FontName> {
  const requested = { family, style };
  try {
    await figma.loadFontAsync(requested);
    return requested;
  } catch (error) {
    await figma.loadFontAsync(UI.fonts.regular);
    return UI.fonts.regular;
  }
}

async function fontForWeight(value: number): Promise<FontName> {
  if (value >= 700) return loadFontSafely("Inter", "Bold");
  if (value >= 600) return loadFontSafely("Inter", "Semi Bold");
  if (value >= 500) return loadFontSafely("Inter", "Medium");
  return UI.fonts.regular;
}

function solid(color: RGB | RGBA, opacity?: number): SolidPaint {
  const alpha = "a" in color ? color.a : opacity ?? 1;
  return { type: "SOLID", color: { r: color.r, g: color.g, b: color.b }, opacity: alpha };
}

function parseTokenColor(token: DocumentationTokenPayload): RGBA {
  if (typeof token.value === "object") return token.value;
  return parseColor(token.preview ?? token.displayValue ?? String(token.value));
}

function parseColor(value: string): RGBA {
  const raw = value.trim();
  const hex = raw.match(/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i);

  if (hex) {
    const expanded = hex[1].length === 3
      ? hex[1].split("").map((part) => `${part}${part}`).join("")
      : hex[1];

    return {
      r: parseInt(expanded.substring(0, 2), 16) / 255,
      g: parseInt(expanded.substring(2, 4), 16) / 255,
      b: parseInt(expanded.substring(4, 6), 16) / 255,
      a: expanded.length === 8 ? parseInt(expanded.substring(6, 8), 16) / 255 : 1,
    };
  }

  return { r: 0, g: 0, b: 0, a: 1 };
}

function getDisplayValue(token: DocumentationTokenPayload) {
  return token.displayValue ?? String(token.value);
}

function getNumericValue(token: DocumentationTokenPayload) {
  if (typeof token.value === "number") return token.value;
  const raw = getDisplayValue(token);
  const match = raw.match(/^-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function getPathPart(token: DocumentationTokenPayload, index: number) {
  return token.figmaName.split("/")[index] ?? "";
}

function getColorFamily(token: DocumentationTokenPayload) {
  const lower = token.name.toLowerCase();
  if (lower.startsWith("secondary")) return "Secondary";
  if (lower.startsWith("grayscale") || lower.startsWith("gray") || lower.startsWith("neutral")) return "Grayscale";
  return "Primary";
}
