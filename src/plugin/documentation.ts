import type { Module, TypographyConfiguration } from '../data/preset-contract/types';
import { parseColor } from '../app/token-values';

export type DocumentationTokenPayload = {
  id: string; module: string; submodule: string; name: string; figmaName: string;
  value: string | number | { r: number; g: number; b: number; a: number };
  type: 'COLOR' | 'FLOAT' | 'STRING'; displayValue: string; unit?: string; preview?: string;
};
export type DocumentationVariableMap = Map<string, unknown>;
type Token = DocumentationTokenPayload;
type IconPreview = {name:string;library:string;svg:string};
type Property = 'family' | 'size' | 'weight' | 'lineHeight' | 'letterSpacing' | 'paragraphSpacing' | 'paragraphIndent' | 'style' | 'case' | 'decoration';
const ROOT_KEY = 'dt-boilerplate-doc-root';
const PRESET_KEY = 'starttokens-documentation-preset';
const WIDTH = 1920, CONTENT = 1760;
// Exact existing StartTokens brand asset.
const BRAND_MARK = "<svg preserveAspectRatio=\"none\" overflow=\"visible\" style=\"display: block;\" width=\"18.2024\" height=\"30\" viewBox=\"0 0 18.2024 30\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<g id=\"Vector\">\n<path d=\"M0.960205 19.2263L8.64904 29.7675C8.87452 30.0775 9.33675 30.0775 9.56223 29.7675L17.2511 19.2263C17.5837 18.7697 17.1158 18.1609 16.5915 18.3695L9.72571 21.064C9.32548 21.2218 8.8858 21.2218 8.49121 21.064L1.62537 18.3695C1.10113 18.1609 0.63326 18.7697 0.965842 19.2263H0.960205Z\" fill=\"#2D328E\"/>\n<path d=\"M8.79556 19.542L0.255543 14.5589C0.00751597 14.4123 -0.0714017 14.1249 0.0695227 13.8937L8.60954 0.257892C8.82375 -0.0859639 9.37617 -0.0859639 9.59602 0.257892L18.1304 13.8937C18.277 14.1249 18.1924 14.418 17.9444 14.5589L9.41 19.542C9.22398 19.6491 8.98158 19.6491 8.79556 19.542Z\" fill=\"#2D328E\"/>\n</g>\n</svg>\n";
const valueLabel = (token: Token) => token.displayValue ?? String(token.value);
const number = (token?: Token): number => {
  if (!token) return NaN;
  if (typeof token.value === 'number') return token.value;
  // Resolve the native ratio expressions used by Tailwind without evaluating code.
  const ratio = valueLabel(token).match(/^calc\(\s*([\d.]+)\s*\/\s*([\d.]+)\s*\)$/);
  return ratio ? Number(ratio[1]) / Number(ratio[2]) : Number.parseFloat(valueLabel(token));
};
const unit = (token?: Token) => token?.unit ?? (token ? valueLabel(token).match(/(?:rem|em|px|pt|%)$/)?.[0] : undefined);
const paint = (color: RGB | RGBA): SolidPaint => ({type:'SOLID',color:{r:color.r,g:color.g,b:color.b},opacity:'a' in color ? color.a : 1});
const gray = (n: number) => paint({r:n,g:n,b:n});

function property(token: Token): Property | undefined {
  const name = `${token.submodule}/${token.name}`.toLowerCase();
  if (/line[-_ .]?height|leading/.test(name)) return 'lineHeight';
  if (/letter[-_ .]?spacing|tracking/.test(name)) return 'letterSpacing';
  if (/paragraph[-_ .]?spacing/.test(name)) return 'paragraphSpacing';
  if (/paragraph[-_ .]?indent/.test(name)) return 'paragraphIndent';
  if (/weight/.test(name)) return 'weight';
  if (/font[-_ .]?style/.test(name)) return 'style';
  if (/text[-_ .]?(transform|case)/.test(name)) return 'case';
  if (/decoration/.test(name)) return 'decoration';
  if (token.type === 'STRING' && /family|typeface|(?:^|[/. -])font(?:$|[/. -])/.test(name)) return 'family';
  if (token.type === 'FLOAT' && /size|text-/.test(name)) return 'size';
  return undefined;
}
// Role matching uses naming relationships only; it never creates groups or changes paths.
function role(token: Token) {
  return token.name.toLowerCase().replace(/(?:[.\s-]+)(font-family|font-size|font-weight|line-height|lineheight|letter-spacing|paragraph-spacing|paragraph-indent|weight-prominent|weight|size|font|family|style)$/, '');
}
function frame(name: string, horizontal = false, width?: number): FrameNode {
  const node = figma.createFrame(); node.name = name; node.fills = []; node.clipsContent = false;
  node.layoutMode = horizontal ? 'HORIZONTAL' : 'VERTICAL';
  if (width !== undefined) node.resize(width,node.height);
  node.primaryAxisSizingMode = horizontal && width !== undefined ? 'FIXED' : 'AUTO';
  node.counterAxisSizingMode = !horizontal && width !== undefined ? 'FIXED' : 'AUTO';
  node.itemSpacing = 0;
  node.counterAxisAlignItems = horizontal ? 'CENTER' : 'MIN';
  node.primaryAxisAlignItems = horizontal ? 'MIN' : 'CENTER';
  return node;
}

// Serialize renders so repeated clicks cannot race page replacement or selection.
let pendingRender: Promise<unknown> = Promise.resolve();
export function generateVisualDocumentation(
  payload: Token[], variablesByName: DocumentationVariableMap, presetName = 'StartTokens', modules: Module[] = [], iconPreview?:IconPreview
) {
  const next = pendingRender.then(() => renderDocumentation(payload, variablesByName, presetName, modules, iconPreview));
  pendingRender = next.catch(() => undefined);
  return next;
}

async function renderDocumentation(
  payload: Token[], variablesByName: DocumentationVariableMap, presetName = 'StartTokens', modules: Module[] = [], iconPreview?:IconPreview
) {
  // Match the successful Variable writes, including their first-write deduplication.
  const seen = new Set<string>();
  const tokens = payload.filter(token => {
    if (!variablesByName.has(token.figmaName) || seen.has(token.figmaName)) return false;
    seen.add(token.figmaName); return true;
  });
  const pageName = `📘 StartTokens — ${presetName} — Visual Foundations`;
  if (!tokens.length) return {pageName,frameId:null,count:0};
  const typography = tokens.filter(t => t.module === 'typography');
  const config = modules.find(m => m.module === 'typography')?.configuration as TypographyConfiguration | undefined;
  const reference = (id?: string) => typography.find(t => t.id === id);
  const defaultFamily = reference(config?.fontFamily.default) ?? typography.find(t => property(t) === 'family');
  const defaultSize = reference(config?.baseSize.default) ?? typography.find(t => property(t) === 'size');
  const defaultLine = reference(config?.lineHeight.default) ?? typography.find(t => property(t) === 'lineHeight');
  const defaultWeight = typography.find(t => property(t) === 'weight' && /normal|regular|body/i.test(t.name)) ?? typography.find(t => property(t) === 'weight');
  const rootPx = 16; // CSS initial root size, used only to render relative lengths, never to rewrite Variables.
  const px = (token?: Token, em = rootPx) => {
    const u = unit(token);
    if (u && !['px','rem','em','pt'].includes(u)) return NaN;
    return number(token) * (u === 'rem' ? rootPx : u === 'em' ? em : u === 'pt' ? 96/72 : 1);
  };
  const available = typeof figma.listAvailableFontsAsync === 'function' ? await figma.listAvailableFontsAsync() : [];
  const loaded = new Map<string,Promise<FontName>>();
  const weightStyle = (weight: number) => weight >= 900 ? 'Black' : weight >= 800 ? 'Extra Bold' : weight >= 700 ? 'Bold' : weight >= 600 ? 'Semi Bold' : weight >= 500 ? 'Medium' : weight >= 400 ? 'Regular' : weight >= 300 ? 'Light' : weight >= 200 ? 'Extra Light' : 'Thin';
  async function font(stack: string, weight = 400, italic = false): Promise<FontName> {
    const key = `${stack}/${weight}/${italic}`;
    if (!loaded.has(key)) loaded.set(key,(async()=>{
      const families = stack.split(',').map(s=>s.trim().replace(/^['"]|['"]$/g,''));
      // Fallback affects drawing only. No token, value label, or Variable is changed.
      const fallback = available.find(f=>f.fontName.style==='Regular')?.fontName ?? {family:'Inter',style:'Regular'};
      for (const family of [...families,fallback.family]) {
        const requestedStyle = weightStyle(weight) + (italic ? ' Italic' : '');
        const styles = available.filter(f=>f.fontName.family.toLowerCase()===family.toLowerCase()).map(f=>f.fontName);
        const exact = styles.find(f=>f.style.replace(/\s/g,'').toLowerCase()===requestedStyle.replace(/\s/g,'').toLowerCase());
        const candidates = [exact ?? {family,style:requestedStyle},...styles.filter(f=>f.style==='Regular'),{family,style:'Regular'}];
        for (const candidate of candidates) try { await figma.loadFontAsync(candidate); return candidate; } catch { /* try next available face */ }
      }
      throw new Error('No available font for documentation previews');
    })());
    return loaded.get(key)!;
  }
  const normal = await font(defaultFamily ? String(defaultFamily.value) : '');
  const bold = await font(normal.family,700);
  function text(value: string, width: number, size?: number, strong = false) {
    const node = figma.createText(); node.name = value; node.fontName = strong ? bold : normal;
    node.characters = value; if(size !== undefined) node.fontSize = size; node.lineHeight = {unit:'AUTO'};
    node.fills = [gray(.05)]; node.resize(width,node.height); node.textAutoResize = 'HEIGHT'; return node;
  }
  function bind(node: SceneNode, field: VariableBindableNodeField | VariableBindableTextField, token?: Token) {
    if (!token || !('setBoundVariable' in node)) return;
    const variable = variablesByName.get(token.figmaName) as Variable | undefined;
    if (variable) try { node.setBoundVariable(field,variable); } catch { /* retain resolved preview */ }
  }
  // Figma numeric Variables have no CSS unit conversion. Never bind 1rem as 1px.
  function bindLength(node: SceneNode, field: VariableBindableNodeField | VariableBindableTextField, token?: Token) {
    if (token?.type === 'FLOAT' && (!unit(token) || unit(token)==='px')) bind(node,field,token);
  }
  const colorOf = (token: Token) => typeof token.value === 'object' ? token.value : parseColor(String(token.value));
  const accentToken = tokens.find(t=>t.type==='COLOR' && /primary|accent/i.test(t.name)) ?? tokens.find(t=>t.type==='COLOR');
  const accent = accentToken ? colorOf(accentToken) : null;
  function fill(node: GeometryMixin, token?: Token) {
    const color = token ? colorOf(token) : accent;
    let solid = color ? paint(color) : gray(.35);
    const variable = token && variablesByName.get(token.figmaName) as Variable | undefined;
    if (variable) try { solid = figma.variables.setBoundVariableForPaint(solid,'color',variable); } catch { /* resolved color */ }
    node.fills = [solid];
  }
  function cell(width: number) { const n=frame('Cell',false,width); n.paddingTop=8;n.paddingBottom=8; return n; }
  async function typePreview(token: Token, width: number) {
    const container = cell(width); const kind=property(token); const key=role(token);
    const sibling = (p:Property) => typography.find(t=>role(t)===key && property(t)===p);
    const family = kind==='family'?token:sibling('family')??defaultFamily;
    const size = kind==='size'?token:sibling('size')??defaultSize;
    const weight = kind==='weight'?token:sibling('weight')??defaultWeight;
    const line = kind==='lineHeight'?token:sibling('lineHeight')??defaultLine;
    const style = kind==='style'?token:sibling('style');
    const familyValue = family ? String(family.value) : normal.family;
    const face = await font(familyValue,Number.isFinite(number(weight))?number(weight):400,!!style && /italic/i.test(String(style.value)));
    const multiline=kind==='lineHeight'||kind==='paragraphSpacing';
    const sample=text(multiline?'Aa\nAa':kind==='weight'?'Abc':kind==='letterSpacing'?'ABC':'Aa',width);
    sample.name = `${token.figmaName} Preview`; sample.fontName=face;
    const sizePx=px(size);
    if(Number.isFinite(sizePx)&&sizePx>0)sample.fontSize=sizePx;
    // Keep the actual size, but prevent an oversized specimen from wrapping into
    // dozens of lines. The cell bounds its paint; no scaling or size cap is used.
    sample.textTruncation='ENDING';sample.maxLines=multiline?2:1;
    sample.textAutoResize='HEIGHT';container.clipsContent=true;
    const lineValue=number(line);
    const lineUnit=unit(line);
    const linePixels=px(line,sample.fontSize as number);
    const safeLine=Number.isFinite(lineValue)&&lineValue>0 && (!lineUnit || lineUnit==='%' || Number.isFinite(linePixels));
    if(safeLine)sample.lineHeight=lineUnit==='%'?{unit:'PERCENT',value:lineValue}:!lineUnit?{unit:'PERCENT',value:lineValue*100}:{unit:'PIXELS',value:linePixels};
    else sample.lineHeight={unit:'AUTO'}; // Zero/none cannot safely stack glyphs; retain the original value in its column.
    if (family && familyValue===face.family) bind(sample,'fontFamily',family);
    bindLength(sample,'fontSize',size);
    if(weight?.type==='FLOAT') bind(sample,'fontWeight',weight);
    if(safeLine && line && unit(line)==='px') bindLength(sample,'lineHeight',line);
    for(const p of ['letterSpacing','paragraphSpacing','paragraphIndent'] as const) {
      const target=kind===p?token:sibling(p);
      if(!target || !Number.isFinite(number(target))) continue;
      if(p==='letterSpacing') sample.letterSpacing=unit(target)==='%'?{unit:'PERCENT',value:number(target)}:{unit:'PIXELS',value:px(target,sample.fontSize as number)};
      else sample[p]=px(target,sample.fontSize as number);
      bindLength(sample,p,target);
    }
    if(kind==='case') { const cases:Record<string,TextCase>={uppercase:'UPPER',lowercase:'LOWER',capitalize:'TITLE',none:'ORIGINAL'};sample.textCase=cases[String(token.value)]??'ORIGINAL'; }
    if(kind==='decoration') { const decorations:Record<string,TextDecoration>={underline:'UNDERLINE','line-through':'STRIKETHROUGH',none:'NONE'};sample.textDecoration=decorations[String(token.value)]??'NONE'; }
    container.appendChild(sample);return container;
  }
  function layoutPreview(token:Token,width:number) {
    const container=cell(width);const n=px(token);const label=`${token.submodule}/${token.name}`.toLowerCase();
    if(/border.?style/.test(label)) {
      const style=String(token.value),rect=figma.createRectangle();rect.name='Border Style Preview';rect.resize(96,48);rect.fills=[];rect.strokes=[gray(.2)];rect.strokeWeight=style==='none'?0:2;rect.strokeAlign='INSIDE';
      if(style==='dashed')rect.dashPattern=[8,4];if(style==='dotted')rect.dashPattern=[2,3];
      container.appendChild(rect);
      if(style==='double'){const inner=figma.createRectangle();inner.name='Double Border Inner';inner.resize(88,40);inner.fills=[];inner.strokes=[gray(.2)];inner.strokeWeight=1;container.appendChild(inner);inner.layoutPositioning='ABSOLUTE';inner.x=4;inner.y=12;}
      return container;
    }
    if(!Number.isFinite(n)||n<0) return container;
    if(/opacity/.test(label)){const rect=figma.createRectangle();rect.name='Opacity Preview';rect.resize(96,48);fill(rect);rect.opacity=Math.max(0,Math.min(1,n));if(n<=1)bind(rect,'opacity',token);container.appendChild(rect);return container;}
    if(/border.?width/.test(label)){const rect=figma.createRectangle();rect.name='Border Width Preview';rect.resize(96,48);rect.fills=[];rect.strokes=[gray(.2)];rect.strokeWeight=n;rect.strokeAlign='INSIDE';bindLength(rect,'strokeWeight',token);container.appendChild(rect);return container;}
    if(n===0&&/spacing|space/.test(label)){container.appendChild(text('0 · No space',width,12));return container;}
    if(/grid|column|gutter/.test(label)) {
      const preview=frame('Grid Preview',true);preview.itemSpacing=/gap|gutter/.test(label)?n:8;
      const columns=/columns?$/.test(token.name)?Math.max(1,Math.min(24,Math.round(n))):3;
      for(let i=0;i<columns;i++){const rect=figma.createRectangle();rect.resize(16,32);fill(rect);preview.appendChild(rect);}
      if(/gap|gutter/.test(label))bindLength(preview,'itemSpacing',token);
      container.appendChild(preview);
    } else if(/radius|shape/.test(label)) {
      const rect=figma.createRectangle();rect.name='Radius Preview';rect.resize(96,64);rect.cornerRadius=n;fill(rect);bindLength(rect,'cornerRadius',token);container.appendChild(rect);
    } else if(/spacing|space|gap|padding|margin|siz|width|height|container|breakpoint/.test(label)) {
      const rect=figma.createRectangle();rect.name='Length Preview';
      const scale=n>width?width/n:1;rect.resize(Math.max(.01,n*scale),/siz|width|height|container|breakpoint/.test(label)?48:12);fill(rect);
      if(scale===1 && n>0)bindLength(rect,'width',token);
      container.appendChild(rect);
      if(scale<1) container.appendChild(text(`Preview scaled 1:${Math.round(1/scale*100)/100}`,width,12));
    }
    return container;
  }
  async function table(members:Token[], moduleId:string) {
    const table=frame('Token Table',false,CONTENT);table.fills=[gray(1)];table.strokes=[gray(.91)];table.cornerRadius=12;
    const widths=moduleId==='colors'?[100,400,440,788]:[400,340,400,588];
    const header=frame('Header',true,CONTENT);header.fills=[gray(.95)];header.paddingLeft=16;header.paddingRight=16;
    for(const [i,label] of [moduleId==='colors'?'Swatch':'Preview','Variable Name','Value','Variable Path'].entries()){
      const c=cell(widths[i]);c.appendChild(text(label,widths[i]-16,16,true));header.appendChild(c);
    }
    table.appendChild(header);
    for(const token of members){
      const row=frame(token.figmaName,true,CONTENT);row.paddingLeft=16;row.paddingRight=16;
      row.setPluginData('starttokens-variable-path',token.figmaName);
      let preview:FrameNode;
      if(token.type==='COLOR'){preview=cell(widths[0]);const swatch=figma.createRectangle();swatch.name=`${token.name} Swatch`;swatch.resize(48,48);swatch.cornerRadius=4;fill(swatch,token);preview.appendChild(swatch);}
      else if(moduleId==='typography')preview=await typePreview(token,widths[0]-16);
      else if(moduleId==='iconography' && iconPreview && token.submodule==='sizes') {
        if(iconPreview.svg.length>100000 || /<(?:script|foreignObject|iframe|image|use)\b|\bon\w+\s*=|(?:href|src)\s*=|javascript:|<!ENTITY/i.test(iconPreview.svg))throw Error('Unsafe icon preview SVG');
        preview=cell(widths[0]);
        const node=figma.createNodeFromSvg(iconPreview.svg);node.name=`${iconPreview.library} / ${iconPreview.name} / ${token.displayValue}`;
        const size=px(token);node.resize(size,size);bindLength(node,'width',token);bindLength(node,'height',token);preview.appendChild(node);
      }
      else if(moduleId==='layout')preview=layoutPreview(token,widths[0]-16);
      else preview=cell(widths[0]);
      preview.resize(widths[0],preview.height);preview.primaryAxisSizingMode='AUTO';row.appendChild(preview);
      for(const [i,value] of [token.name,valueLabel(token),token.figmaName].entries()){
        const c=cell(widths[i+1]);const label=text(value,widths[i+1]-16,15);label.name=['Variable Name','Value','Variable Path'][i];c.appendChild(label);row.appendChild(c);
      }
      table.appendChild(row);
    }
    return table;
  }
  await figma.loadAllPagesAsync();
  let page=figma.root.children.find(p=>p.type==='PAGE' && (p.getPluginData(PRESET_KEY)===presetName || p.name===pageName)) as PageNode|undefined;
  const createdPage=!page;
  if(!page){page=figma.createPage();page.name=pageName;}
  await figma.setCurrentPageAsync(page);
  const previous=page.children.filter(n=>n.type==='FRAME' && n.getPluginData(ROOT_KEY)==='true' && n.getPluginData(PRESET_KEY)===presetName);
  const root=frame(`StartTokens — ${presetName} — Visual Foundations`,true);root.itemSpacing=40;root.counterAxisAlignItems='MIN';root.visible=false;
  root.setPluginData(ROOT_KEY,'true');root.setPluginData(PRESET_KEY,presetName);page.appendChild(root);
  try {
    const grouped=new Map<string,Map<string,Token[]>>();
    for(const token of tokens){if(!grouped.has(token.module))grouped.set(token.module,new Map());const groups=grouped.get(token.module)!;if(!groups.has(token.submodule))groups.set(token.submodule,[]);groups.get(token.submodule)!.push(token);}
    for(const [moduleId,groups] of grouped){
      const metadata=modules.find(m=>m.module===moduleId);
      const first=groups.values().next().value![0];
      const title=metadata?.label??first.figmaName.split('/')[0]??moduleId;
      const board=frame(title,false,WIDTH);board.paddingTop=64;board.paddingBottom=64;board.paddingLeft=80;board.paddingRight=80;board.itemSpacing=48;board.fills=[gray(1)];
      const brand=frame('StartTokens / Preset',true,CONTENT);
      const identity=frame('StartTokens',true,CONTENT/2);identity.itemSpacing=12;identity.counterAxisAlignItems='CENTER';
      const mark=figma.createNodeFromSvg(BRAND_MARK);mark.name='StartTokens mark';mark.resize(27.3,45);identity.appendChild(mark);identity.appendChild(text('StartTokens',CONTENT/2-40,24,true));brand.appendChild(identity);
      const preset=text(presetName,CONTENT/2,24);preset.textAlignHorizontal='RIGHT';brand.appendChild(preset);board.appendChild(brand);
      board.appendChild(text(title,CONTENT,48,true));
      if(moduleId==='typography' && config?.fontRoles) {
        const families=frame('Font Families',false,CONTENT);families.itemSpacing=16;
        for(const control of Object.values(config.fontRoles)) {
          const token=reference(control.token);if(!token)continue;
          families.appendChild(text(`${control.label} — ${valueLabel(token)}`,CONTENT,24,true));
          families.appendChild(await typePreview(token,CONTENT));
        }
        board.appendChild(families);
      }
      if(moduleId==='iconography' && iconPreview)board.appendChild(text(`Library: ${iconPreview.library} · Preview: ${iconPreview.name}`,CONTENT,24));
      for(const [groupId,members] of groups){
        const label=metadata?.submodules.find(s=>s.id===groupId)?.label??members[0].figmaName.split('/')[1]??groupId;
        const section=frame(groupId,false,CONTENT);section.itemSpacing=16;section.appendChild(text(label,CONTENT,32,true));
        // Preserve any existing hierarchy beneath the submodule (e.g. component/role).
        const paths=new Map<string,Token[]>();
        for(const token of members){const path=token.figmaName.split('/').slice(2,-1).join('/');if(!paths.has(path))paths.set(path,[]);paths.get(path)!.push(token);}
        for(const [path,items] of paths){if(path)section.appendChild(text(path,CONTENT,24,true));section.appendChild(await table(items,moduleId));}
        board.appendChild(section);
      }
      root.appendChild(board);
    }
    root.x=previous[0]?.x??0;root.y=previous[0]?.y??0;root.visible=true;
    page.name=pageName;page.setPluginData(PRESET_KEY,presetName);
    previous.forEach(n=>n.remove());
    figma.currentPage.selection=[root.children[0]];figma.viewport.scrollAndZoomIntoView([root.children[0]]);
    return {pageName,frameId:root.id,count:tokens.length};
  } catch(error){root.remove();if(createdPage && page.children.length===0)page.remove();throw error;}
}
