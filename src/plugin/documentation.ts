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
    regular: { family: "Inter", style: "Regular" } as FontName,
    medium: { family: "Inter", style: "Medium" } as FontName,
    semiBold: { family: "Inter", style: "Semi Bold" } as FontName,
    bold: { family: "Inter", style: "Bold" } as FontName,
    extraBold: { family: "Inter", style: "Extra Bold" } as FontName,
    mono: { family: "JetBrains Mono", style: "Regular" } as FontName,
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
  const firstBoard = root.children[0] as FrameNode | undefined;
  root.appendChild(await createSemanticColorsBoard(tokens, variablesByName));
  root.appendChild(await createColorTokensBoard(tokens, variablesByName));
  root.appendChild(await createTypographyBoard(tokens, variablesByName));
  root.appendChild(await createLayoutBoard(tokens, variablesByName));

  if (firstBoard) {
    figma.currentPage.selection = [firstBoard];
    figma.viewport.scrollAndZoomIntoView([firstBoard]);
  }

  return { pageName: DOC_PAGE_NAME, frameId: root.id };
}

async function createColorPaletteBoard(tokens: DocumentationTokenPayload[], variablesByName: DocumentationVariableMap) {
  const board = createBoard(
    "DT Boilerplate — Color Palette",
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
          await createTextCell(token.figmaName, "muted"),
        ],
        UI.rowHeight,
        UI.paletteHeaderHeight,
        UI.tableRadius
      )
    );
  }

  return board;
}

async function createSemanticColorsBoard(tokens: DocumentationTokenPayload[], variablesByName: DocumentationVariableMap) {
  const board = createBoard(
    "DT Boilerplate — Semantic Colors",
    "Semantic colors communicate meaning and status — danger (errors), warning (caution), info (informational), and success (positive outcomes)."
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
          await createTextCell(token.figmaName, "muted"),
        ],
        UI.rowHeight,
        UI.paletteHeaderHeight,
        UI.tableRadius
      )
    );
  }

  return board;
}

async function createColorTokensBoard(tokens: DocumentationTokenPayload[], variablesByName: DocumentationVariableMap) {
  const board = createBoard(
    "Color Tokens",
    "Component-level color tokens map design decisions to specific UI roles — buttons, inputs, content text, and surface backgrounds.",
    { titleSize: 40, titleLineHeight: 48, titleWeight: "extraBold", descriptionSize: 18, descriptionWidth: 1000 }
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
          await createTextCell(token.figmaName, "muted"),
        ]
      )
    );
  }

  return board;
}

async function createTypographyBoard(tokens: DocumentationTokenPayload[], variablesByName: DocumentationVariableMap) {
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
      boardGap: UI.compactBoardGap,
    }
  );

  const groups = [
    ["Font Families", tokens.filter((token) => token.module === "typography" && token.submodule === "family")],
    ["Font Sizes", tokens.filter((token) => token.module === "typography" && token.submodule === "sizes")],
    ["Font Weights", tokens.filter((token) => token.module === "typography" && token.submodule === "weight")],
    ["Line Heights", tokens.filter((token) => token.module === "typography" && token.submodule === "lineheight")],
    ["Typography Tokens", tokens.filter((token) => token.module === "typography" && token.submodule === "tokens")],
  ] as const;

  for (const [label, groupTokens] of groups) {
    if (groupTokens.length === 0) continue;

    board.appendChild(await createTypographySection(label, groupTokens, variablesByName));
  }

  return board;
}

async function createLayoutBoard(tokens: DocumentationTokenPayload[], variablesByName: DocumentationVariableMap) {
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
      boardGap: UI.compactBoardGap,
    }
  );

  const groups = [
    ["Grid", tokens.filter((token) => token.module === "layout" && token.submodule === "grid")],
    ["Border Radius", tokens.filter((token) => token.module === "layout" && token.submodule === "radius")],
    ["Spacing Scale", tokens.filter((token) => token.module === "layout" && token.submodule === "space")],
  ] as const;

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
            await createTextCell(token.figmaName, "muted", 1304, UI.compactRowHeight, 14, "mono"),
          ],
          UI.compactRowHeight
        )
      );
      continue;
    }

    board.appendChild(
      await createTokenTable(
        label === "Border Radius"
          ? ["Visual preview", "Variable Name", "Value", "Variable Path"]
          : ["Visual bar", "Variable Name", "Value", "Variable Path"],
        label === "Border Radius" ? [670, 200, 100, 670] : [400, 160, 80, 1000],
        groupTokens,
        async (token) => [
          await createLayoutPreviewCell(token, variablesByName),
          await createTextCell(token.name),
          await createTextCell(getDisplayValue(token), "text", label === "Border Radius" ? 100 : 80, UI.compactRowHeight, 14, "mono"),
          await createTextCell(token.figmaName, "muted", label === "Border Radius" ? 670 : 1000, UI.compactRowHeight, 14, "mono"),
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
          await createTextCell(token.figmaName, "muted", 1200, UI.compactRowHeight, 14, "mono"),
        ],
        UI.compactRowHeight
      )
    );
  }

  return board;
}

function createBoard(
  title: string,
  description: string,
  options: {
    sectionLabel?: string;
    titleSize?: number;
    titleLineHeight?: number;
    titleWeight?: TextStyleName;
    descriptionSize?: number;
    descriptionWidth?: number;
    headerGap?: number;
    boardGap?: number;
  } = {}
) {
  const board = createFrame(title, "VERTICAL", {
    width: UI.boardWidth,
    fills: [solid(UI.colors.board)],
    itemSpacing: options.boardGap ?? UI.boardGap,
    padding: { top: UI.boardPaddingY, right: UI.boardPaddingX, bottom: UI.boardPaddingY, left: UI.boardPaddingX },
  });

  const header = createFrame(`${title} Header`, "VERTICAL", {
    width: UI.tableWidth,
    itemSpacing: options.headerGap ?? 12,
    padding: 0,
  });

  if (options.sectionLabel) {
    header.appendChild(createText(options.sectionLabel, 14, 18, "semiBold", "muted"));
  }

  const titleNode = createText(
    title,
    options.titleSize ?? 48,
    options.titleLineHeight ?? 58,
    options.titleWeight ?? "bold",
    title.startsWith("DT Boilerplate") ? "accent" : "text"
  );
  if (!title.startsWith("DT Boilerplate")) titleNode.textAutoResize = "WIDTH_AND_HEIGHT";
  header.appendChild(titleNode);

  const descriptionNode = createText(description, options.descriptionSize ?? 16, 24, "regular", "muted");
  descriptionNode.resize(options.descriptionWidth ?? UI.tableWidth, descriptionNode.height);
  descriptionNode.textAutoResize = "HEIGHT";
  header.appendChild(descriptionNode);
  board.appendChild(header);

  return board;
}

async function createSectionTitle(title: string) {
  return createText(title, 32, 39, "bold", "accent");
}

async function createTypographySection(
  title: string,
  tokens: DocumentationTokenPayload[],
  variablesByName: DocumentationVariableMap
) {
  const section = createFrame(title, "VERTICAL", {
    width: UI.tableWidth,
    itemSpacing: 16,
    padding: 0,
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
          await createTextCell(token.figmaName, "muted", 1184, UI.compactRowHeight, 14, "mono"),
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
        await createTextCell(token.figmaName, "muted", columns.widths[3], rowHeight, 14, "mono"),
      ],
      (token) => getTypographyRowHeight(token)
    )
  );

  return section;
}

async function createTypographySectionTitle(title: string) {
  return createText(title, 24, 31, "bold", "accent");
}

function getTypographyColumns(title: string) {
  if (title === "Font Families") {
    return {
      headers: ["Example text", "Variable Name", "Value", "Variable Path"],
      widths: [240, 240, 240, 920],
    };
  }

  if (title === "Font Sizes") {
    return {
      headers: ["Size preview", "Variable Name", "Value (px)", "Variable Path"],
      widths: [1024, 200, 100, 316],
    };
  }

  return {
    headers: ["Weight preview", "Variable Name", "Value", "Variable Path"],
    widths: [320, 240, 100, 980],
  };
}

async function createTypographyTable(
  headers: string[],
  columns: number[],
  tokens: DocumentationTokenPayload[],
  createCells: (token: DocumentationTokenPayload, rowHeight: number) => Promise<SceneNode[]>,
  getRowHeight: (token: DocumentationTokenPayload) => number
) {
  const table = createFrame("Typography Table", "VERTICAL", {
    width: UI.tableWidth,
    fills: [],
    strokes: [solid(UI.colors.border)],
    cornerRadius: UI.radius,
    itemSpacing: 0,
    padding: 0,
  });

  const header = createFrame("Header", "HORIZONTAL", {
    width: UI.tableWidth,
    height: UI.headerHeight,
    fills: [solid(UI.colors.header)],
    itemSpacing: 24,
    padding: { top: 0, right: 24, bottom: 0, left: 24 },
    alignItems: "CENTER",
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
      alignItems: "CENTER",
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

async function createTokenTable(
  headers: string[],
  columns: number[],
  tokens: DocumentationTokenPayload[],
  createCells: (token: DocumentationTokenPayload) => Promise<SceneNode[]>,
  rowHeight = UI.rowHeight,
  headerHeight = UI.headerHeight,
  cornerRadius = UI.radius
) {
  const table = createFrame("Token Table", "VERTICAL", {
    width: UI.tableWidth,
    fills: [solid(UI.colors.board)],
    strokes: [solid(UI.colors.border)],
    cornerRadius,
    itemSpacing: 0,
    padding: 0,
  });

  const header = createFrame("Header", "HORIZONTAL", {
    width: UI.tableWidth,
    height: headerHeight,
    fills: [solid(UI.colors.header)],
    itemSpacing: 0,
    padding: { top: 0, right: 16, bottom: 0, left: 16 },
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

async function createTypographyPreviewCell(
  token: DocumentationTokenPayload,
  variablesByName: DocumentationVariableMap,
  width = 520,
  rowHeight = UI.compactRowHeight
) {
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

function getTypographyRowHeight(token: DocumentationTokenPayload) {
  const value = getNumericValue(token) ?? 16;

  if (token.submodule === "family") {
    return valueLabel(token).toLowerCase().includes("material") ? 61 : 58;
  }

  if (token.submodule === "sizes") {
    return Math.max(UI.compactRowHeight, Math.ceil(value * 1.3) + 32);
  }

  return UI.compactRowHeight;
}

function getTypographySampleLineHeight(token: DocumentationTokenPayload): LineHeight {
  const value = getNumericValue(token);

  if (token.submodule === "lineheight" && value !== null) {
    return value <= 4 ? { unit: "PERCENT", value: value * 100 } : { unit: "PIXELS", value };
  }

  return { unit: "AUTO" };
}

function valueLabel(token: DocumentationTokenPayload) {
  return getDisplayValue(token);
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
  color: "text" | "muted" | "accent" = "text",
  width = 240,
  height = UI.rowHeight,
  size = 15,
  weight: TextStyleName = "regular"
) {
  const cell = createCellFrame(width, height);
  cell.clipsContent = true;
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

  if (options.width !== undefined || options.height !== undefined) {
    frame.resize(options.width ?? 1, options.height ?? 1);
  }

  frame.fills = options.fills ?? [];
  frame.strokes = options.strokes ?? [];
  frame.cornerRadius = options.cornerRadius ?? 0;
  frame.layoutMode = layoutMode;
  frame.primaryAxisSizingMode =
    layoutMode === "HORIZONTAL"
      ? options.width === undefined
        ? "AUTO"
        : "FIXED"
      : options.height === undefined
        ? "AUTO"
        : "FIXED";
  frame.counterAxisSizingMode =
    layoutMode === "HORIZONTAL"
      ? options.height === undefined
        ? "AUTO"
        : "FIXED"
      : options.width === undefined
        ? "AUTO"
        : "FIXED";
  frame.primaryAxisAlignItems = "MIN";
  frame.counterAxisAlignItems = options.alignItems ?? "MIN";
  frame.itemSpacing = options.itemSpacing ?? 0;
  setPadding(frame, options.padding ?? 0);
  frame.clipsContent = false;

  return frame;
}

function createText(value: string, size: number, lineHeight: number, weight: TextStyleName, color: "text" | "muted" | "accent" = "text") {
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
    loadFontSafely("DM Sans", "Light"),
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
