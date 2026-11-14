// NU / Brutal Kit — accessibility + legibility sync (tokens v1.1.0, PR #2).
// Run once in the NUBRUT library file: Plugins > Development > Import plugin from manifest…
// Safe to re-run: everything is looked up by name before it is created.
// What it does:
//   1. Variables: palette/red-text, color/danger-text, color/meter, type/role/* (aliases of type/size/*)
//   2. Text styles: raises small styles to the new floors (12 / 13 / 14px)
//   3. Component masters: raises unstyled small text (controls 14px, support 13px, floor 12px),
//      rebinds error/sale text to color/danger-text and progress fills to color/meter
//   4. Builds "Toolbar / Item" (variants) and "Toolbar" components
//   5. Adds a "Legibility rules (v1.1)" frame on the Foundations page with a change log

const log = { variables: [], textStyles: [], textNodes: 0, rebinds: [], created: [], warnings: [] };
const hex = h => { h = h.replace('#', ''); return { r: parseInt(h.slice(0, 2), 16) / 255, g: parseInt(h.slice(2, 4), 16) / 255, b: parseInt(h.slice(4, 6), 16) / 255 }; };

// ---------- helpers ----------
let ALL_VARS = [];
function autoLayout(direction, props) {
  const f = figma.createFrame();
  f.layoutMode = direction;
  f.primaryAxisSizingMode = 'AUTO';
  f.counterAxisSizingMode = 'AUTO';
  f.fills = [];
  Object.assign(f, props || {});
  return f;
}
const findVar = name => ALL_VARS.find(v => v.name === name) || null;
const solidVar = v => figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }, 'color', v);
async function loadFontsOf(node) {
  if (node.characters.length === 0) { if (node.fontName !== figma.mixed) await figma.loadFontAsync(node.fontName); return; }
  for (const seg of node.getStyledTextSegments(['fontName'])) await figma.loadFontAsync(seg.fontName);
}
function setAllModes(variable, collection, value) {
  for (const m of collection.modes) variable.setValueForMode(m.modeId, value);
}
async function ensureVar({ name, type, collection, value, scopes, css }) {
  let v = findVar(name);
  if (!v) {
    v = figma.variables.createVariable(name, collection, type);
    ALL_VARS.push(v);
    log.variables.push('created ' + name);
  } else {
    log.variables.push('updated ' + name);
  }
  const col = await figma.variables.getVariableCollectionByIdAsync(v.variableCollectionId);
  setAllModes(v, col, value);
  v.scopes = scopes;
  if (css) v.setVariableCodeSyntax('WEB', css);
  return v;
}

// ---------- 1. variables ----------
async function syncVariables() {
  ALL_VARS = await figma.variables.getLocalVariablesAsync();
  const red = findVar('palette/red'), amber = findVar('palette/amber');
  const size = n => findVar('type/size/' + n);
  if (!red || !amber || !size(12)) {
    log.warnings.push('Could not find palette/red, palette/amber or type/size/12. Variable step skipped; names differ from the NU kit.');
    return;
  }
  const paletteCol = await figma.variables.getVariableCollectionByIdAsync(red.variableCollectionId);
  const colorCol = findVar('color/danger') ? await figma.variables.getVariableCollectionByIdAsync(findVar('color/danger').variableCollectionId) : paletteCol;
  const typeCol = await figma.variables.getVariableCollectionByIdAsync(size(12).variableCollectionId);

  const redText = await ensureVar({ name: 'palette/red-text', type: 'COLOR', collection: paletteCol, value: hex('#b03e19'), scopes: [], css: 'var(--red-text)' });
  redText.description = 'Darkened red for text. 5.51:1 on paper, 4.97:1 on cream. Use palette/red for fills.';
  const dt = await ensureVar({ name: 'color/danger-text', type: 'COLOR', collection: colorCol, value: { type: 'VARIABLE_ALIAS', id: redText.id }, scopes: ['TEXT_FILL'], css: 'var(--nu-danger-text)' });
  dt.description = 'Field errors and sale prices. Never use color/danger for text on cream (4.32:1).';
  const meter = await ensureVar({ name: 'color/meter', type: 'COLOR', collection: colorCol, value: { type: 'VARIABLE_ALIAS', id: amber.id }, scopes: ['FRAME_FILL', 'SHAPE_FILL'], css: 'var(--nu-meter)' });
  meter.description = 'Progress fill. 3.06:1 against paper (WCAG 1.4.11). Honey is 2.05:1 and fails.';

  const roles = [
    ['min', 12, 'Floor. Metadata only: kickers, badges, captions, table headers, compact buttons.'],
    ['support', 13, 'Read before acting: field labels, help, errors, cart meta, step labels, currency.'],
    ['control', 14, 'Anything clickable: buttons, tabs, options, toolbar items, nav links.'],
    ['body', 14, 'UI body copy, alerts, messages.'],
    ['prose', 16, 'Long-form reading (more than ~3 lines). 1.6 line height, 70ch measure.'],
    ['input', 16, 'Text inside inputs. Below 16px iOS Safari zooms on focus.'],
  ];
  for (const [role, px, desc] of roles) {
    const v = await ensureVar({ name: 'type/role/' + role, type: 'FLOAT', collection: typeCol, value: { type: 'VARIABLE_ALIAS', id: size(px).id }, scopes: ['FONT_SIZE'], css: 'var(--nu-type-' + role + ')' });
    v.description = desc;
  }
  for (const n of [10, 11]) if (size(n)) size(n).description = 'Deprecated for text: below the 12px floor. Kept for code parity only.';
}

// ---------- 2. text styles ----------
const STYLE_TARGETS = {
  'NU / Source button': { size: 14, lh: 18, ls: 0.56, why: 'buttons/tabs 12 -> 14 (control)' },
  'NU / Micro': { size: 12, lh: 17, ls: 0.5, why: 'badges/stat labels 11 -> 12 (floor)' },
  'NU / Mono': { size: 13, lh: 20, ls: 0, why: 'labels/help/errors 12 -> 13 (support)' },
  'NU / Source body': { size: 14, lh: 21, ls: 0, why: 'alerts/messages 13 -> 14 (body)' },
};
async function syncTextStyles() {
  const styles = await figma.getLocalTextStylesAsync();
  for (const style of styles) {
    const t = STYLE_TARGETS[style.name];
    if (!t) {
      if (style.fontSize < 12) log.warnings.push(`Text style "${style.name}" is ${style.fontSize}px (below floor) and was not in the mapping; review it.`);
      continue;
    }
    if (style.fontSize >= t.size) { log.textStyles.push(`${style.name}: already ${style.fontSize}px`); continue; }
    await figma.loadFontAsync(style.fontName);
    const before = style.fontSize;
    const bound = style.boundVariables && style.boundVariables.fontSize;
    const sizeVar = findVar('type/size/' + t.size);
    if (bound && sizeVar) style.setBoundVariable('fontSize', sizeVar);
    else { if (bound) style.setBoundVariable('fontSize', null); style.fontSize = t.size; }
    style.lineHeight = { unit: 'PIXELS', value: t.lh };
    style.letterSpacing = { unit: 'PIXELS', value: t.ls };
    log.textStyles.push(`${style.name}: ${before} -> ${t.size}px (${t.why})`);
  }
}

// ---------- 3. component masters ----------
function ownerComponent(node) {
  let p = node.parent;
  while (p && p.type !== 'PAGE') {
    if (p.type === 'INSTANCE') return null; // nested instance: its own master is handled separately
    if (p.type === 'COMPONENT') return p;
    p = p.parent;
  }
  return null;
}
function componentName(c) { return c.parent && c.parent.type === 'COMPONENT_SET' ? c.parent.name : c.name; }
function targetSize(compName, variantName, nodeName, s) {
  if (/^Icon \//.test(compName)) return s;
  const control = /Button|Navigation \/ Tab|Commerce \/ Option|Toolbar/i.test(compName);
  if (control) return /compact/i.test(variantName + ' ' + nodeName) ? Math.max(s, 12) : Math.max(s, 14);
  if (/Feedback \/ Alert|Conversation \/ Message/i.test(compName) && s === 13) return 14;
  if (/Field|Cart item|Checkout step|Commerce \/ Price/i.test(compName) && s === 12) return 13;
  return Math.max(s, 12);
}
async function syncComponents(page) {
  await page.loadAsync();
  const texts = page.findAllWithCriteria({ types: ['TEXT'] });
  for (const t of texts) {
    const comp = ownerComponent(t);
    if (!comp) continue;
    const cName = componentName(comp);
    // a) font size, only for text without a text style (styled text follows step 2)
    const styled = t.textStyleId && t.textStyleId !== figma.mixed && t.textStyleId !== '';
    if (!styled && t.characters.length) {
      const segs = t.getStyledTextSegments(['fontSize', 'fontName', 'lineHeight', 'textStyleId']);
      let changed = false;
      for (const seg of segs) {
        if (seg.textStyleId) continue;
        const target = targetSize(cName, comp.name, t.name, seg.fontSize);
        if (target === seg.fontSize) continue;
        await figma.loadFontAsync(seg.fontName);
        const boundSize = t.boundVariables && t.boundVariables.fontSize;
        const sizeVar = findVar('type/size/' + target);
        if (boundSize && sizeVar && segs.length === 1) t.setBoundVariable('fontSize', sizeVar);
        else t.setRangeFontSize(seg.start, seg.end, target);
        if (seg.lineHeight.unit === 'PIXELS') t.setRangeLineHeight(seg.start, seg.end, { unit: 'PIXELS', value: Math.round(seg.lineHeight.value * target / seg.fontSize) });
        changed = true;
      }
      if (changed) log.textNodes++;
    }
    // b) error / sale text on color/danger -> color/danger-text
    const dangerText = findVar('color/danger-text'), danger = findVar('color/danger');
    if (dangerText && danger && Array.isArray(t.fills) && /Field|Price|Error|Sale/i.test(cName + ' ' + t.name)) {
      const f = t.fills[0];
      const bound = f && f.boundVariables && f.boundVariables.color;
      if (bound && bound.id === danger.id) {
        await loadFontsOf(t);
        t.fills = [solidVar(dangerText)];
        log.rebinds.push(`${cName} › ${t.name}: text -> color/danger-text`);
      }
    }
  }
  // c) progress fill honey -> meter
  const meter = findVar('color/meter'), honey = findVar('color/honey');
  if (meter && honey) {
    for (const c of page.findAllWithCriteria({ types: ['COMPONENT', 'COMPONENT_SET'] })) {
      if (!/Progress/i.test(c.name)) continue;
      for (const n of c.findAll(n => 'fills' in n && Array.isArray(n.fills) && n.fills.length)) {
        const b = n.fills[0].boundVariables && n.fills[0].boundVariables.color;
        if (b && b.id === honey.id) { n.fills = [solidVar(meter)]; log.rebinds.push(`${c.name} › ${n.name}: fill -> color/meter`); }
      }
    }
  }
}

// ---------- 4. toolbar ----------
async function buildToolbar(pages) {
  const page = pages.find(p => /App patterns/i.test(p.name)) || pages.find(p => /pattern/i.test(p.name)) || figma.currentPage;
  await page.loadAsync();
  if (page.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Toolbar / Item')) { log.created.push('Toolbar already exists; skipped'); return; }

  const v = n => findVar(n);
  const styles = await figma.getLocalTextStylesAsync();
  const labelStyle = styles.find(s => s.name === 'NU / Label');
  const effects = await figma.getLocalEffectStylesAsync();
  const smallShadow = effects.find(s => s.name === 'NU / Hard shadow / Small');
  const font = labelStyle ? labelStyle.fontName : { family: 'Space Grotesk', style: 'Bold' };
  await figma.loadFontAsync(font);

  let iconComps = {};
  for (const p of pages) {
    if (!/Icon/i.test(p.name)) continue;
    await p.loadAsync();
    for (const c of p.findAllWithCriteria({ types: ['COMPONENT'] })) if (/^Icon \//.test(c.name)) iconComps[c.name.replace('Icon / ', '')] = c;
  }
  const defaultIcon = iconComps['search'] || Object.values(iconComps)[0] || null;

  const paint = (name, fallback) => v(name) ? solidVar(v(name)) : { type: 'SOLID', color: hex(fallback) };
  const bindNum = (node, field, name) => { const x = v(name); if (x) node.setBoundVariable(field, x); };

  function makeItem(style) {
    const c = figma.createComponent();
    c.name = 'Style=' + style;
    c.layoutMode = 'HORIZONTAL';
    c.primaryAxisSizingMode = 'AUTO';
    c.counterAxisSizingMode = 'FIXED';
    c.resize(100, 44);
    bindNum(c, 'height', 'size/control');
    c.minWidth = 44;
    c.counterAxisAlignItems = 'CENTER';
    c.primaryAxisAlignItems = 'CENTER';
    c.itemSpacing = 8; bindNum(c, 'itemSpacing', 'space/8');
    c.paddingLeft = c.paddingRight = 12; bindNum(c, 'paddingLeft', 'space/12'); bindNum(c, 'paddingRight', 'space/12');
    c.strokeWeight = 3; bindNum(c, 'strokeWeight', 'border/default');
    const filled = style !== 'Default';
    c.fills = filled ? [paint('color/strong', '#1a1510')] : [];
    c.strokes = filled ? [paint('color/border', '#1a1510')] : [];
    const ink = filled ? paint('color/on-strong', '#e8c84a') : paint('color/ink', '#1a1510');
    let icon = null;
    if (defaultIcon) {
      icon = defaultIcon.createInstance();
      icon.name = 'Icon';
      icon.resize(20, 20);
      for (const vec of icon.findAll(n => 'strokes' in n && n.strokes.length)) vec.strokes = [ink];
      c.appendChild(icon);
    }
    const label = figma.createText();
    label.fontName = font;
    label.characters = 'Label';
    label.fontSize = 14;
    label.fills = [ink];
    c.appendChild(label);
    return { c, icon, label };
  }
  const items = ['Default', 'Pressed', 'Primary'].map(makeItem);
  for (const it of items) if (labelStyle) await it.label.setTextStyleIdAsync(labelStyle.id);
  const set = figma.combineAsVariants(items.map(i => i.c), page);
  set.name = 'Toolbar / Item';
  set.layoutMode = 'HORIZONTAL'; set.itemSpacing = 24; set.paddingLeft = set.paddingRight = set.paddingTop = set.paddingBottom = 24;
  set.primaryAxisSizingMode = 'AUTO'; set.counterAxisSizingMode = 'AUTO';
  set.description = 'Toolbar item. 44px target, 14px sentence-case label (NU / Label). Never use compact buttons in toolbars. Pressed = aria-pressed="true" toggle; Primary = the one main action. Icon-only only for well-known icons (search, close, menu, add, delete, favourite) and the accessible name must stay. CSS: .nu-toolbar .nu-button';
  const labelKey = set.addComponentProperty('Label', 'TEXT', 'Label');
  const showKey = defaultIcon ? set.addComponentProperty('Show icon', 'BOOLEAN', true) : null;
  const iconKey = defaultIcon ? set.addComponentProperty('Icon', 'INSTANCE_SWAP', defaultIcon.id) : null;
  for (const it of items) {
    it.label.componentPropertyReferences = { characters: labelKey };
    if (it.icon) it.icon.componentPropertyReferences = { visible: showKey, mainComponent: iconKey };
  }
  const right = Math.max(0, ...page.children.filter(n => n !== set).map(n => n.x + n.width));
  set.x = right + 200; set.y = 0;
  log.created.push('Component set "Toolbar / Item" (Default, Pressed, Primary)');

  // Toolbar composite
  const bar = figma.createComponent();
  bar.name = 'Toolbar';
  page.appendChild(bar);
  bar.layoutMode = 'HORIZONTAL';
  bar.primaryAxisSizingMode = 'FIXED'; bar.counterAxisSizingMode = 'AUTO';
  bar.resize(760, 56);
  bar.counterAxisAlignItems = 'CENTER';
  bar.itemSpacing = 8; bindNum(bar, 'itemSpacing', 'space/8');
  for (const s of ['paddingLeft', 'paddingRight', 'paddingTop', 'paddingBottom']) { bar[s] = 6; bindNum(bar, s, 'space/6'); }
  bar.fills = [paint('color/surface', '#fdf6ec')];
  bar.strokes = [paint('color/border', '#1a1510')];
  bar.strokeWeight = 3; bindNum(bar, 'strokeWeight', 'border/default');
  if (smallShadow) await bar.setEffectStyleIdAsync(smallShadow.id);
  bar.layoutWrap = 'WRAP'; bar.counterAxisSpacing = 8;

  const variant = name => set.children.find(c => c.name === 'Style=' + name);
  function item(style, text, iconName) {
    const inst = variant(style).createInstance();
    const props = { [labelKey]: text };
    if (showKey) props[showKey] = !!iconName;
    if (iconKey && iconName && iconComps[iconName]) props[iconKey] = iconComps[iconName].id;
    inst.setProperties(props);
    inst.name = text;
    return inst;
  }
  function group(name, children, divider) {
    const g = autoLayout('HORIZONTAL', { name, itemSpacing: 4 });
    g.fills = [];
    g.counterAxisAlignItems = 'CENTER';
    if (divider) {
      g.strokes = [paint('color/border', '#1a1510')];
      g.strokeLeftWeight = 2; g.strokeRightWeight = 0; g.strokeTopWeight = 0; g.strokeBottomWeight = 0;
      g.paddingLeft = 8;
    }
    children.forEach(ch => g.appendChild(ch));
    return g;
  }
  bar.appendChild(group('Find', [item('Default', 'Search', 'search'), item('Default', 'Filters', 'settings')]));
  const view = group('View', [item('Pressed', 'Grid', null), item('Default', 'List', null)], true);
  bar.appendChild(view);
  const spacer = figma.createFrame(); spacer.name = 'Spacer'; spacer.fills = []; spacer.resize(1, 1);
  bar.appendChild(spacer); spacer.layoutGrow = 1;
  bar.appendChild(item('Default', 'Archive', 'package'));
  bar.appendChild(item('Primary', 'Add product', 'plus'));
  bar.description = 'Dense, never small. role="toolbar" + aria-label, one Tab stop, arrow keys between items. Labels stay 14px; when space runs out: wrap -> collapse well-known icons to icon-only (name kept for screen readers) -> "More" menu. Never shrink text. Max ~5-7 visible items. CSS: .nu-toolbar';
  bar.x = set.x; bar.y = set.y + set.height + 80;
  log.created.push('Component "Toolbar" (example composition)');
  return [set.id, bar.id];
}

// ---------- 5. docs frame ----------
async function addDocs(pages) {
  const page = pages.find(p => /Foundations/i.test(p.name)) || pages[0];
  await page.loadAsync();
  const old = page.findOne(n => n.type === 'FRAME' && n.name === 'Legibility rules (v1.1)');
  if (old) old.remove();
  const styles = await figma.getLocalTextStylesAsync();
  const h = styles.find(s => s.name === 'NU / Heading 3');
  const body = styles.find(s => s.name === 'NU / Body small');
  for (const s of [h, body]) if (s) await figma.loadFontAsync(s.fontName);
  const fallback = { family: 'Space Grotesk', style: 'Regular' };
  if (!body) await figma.loadFontAsync(fallback);

  const f = autoLayout('VERTICAL', { name: 'Legibility rules (v1.1)', itemSpacing: 16 });
  page.appendChild(f);
  f.paddingLeft = f.paddingRight = f.paddingTop = f.paddingBottom = 32;
  f.resize(760, 100); f.primaryAxisSizingMode = 'AUTO'; f.counterAxisSizingMode = 'FIXED';
  f.fills = [findVar('color/surface') ? solidVar(findVar('color/surface')) : { type: 'SOLID', color: hex('#fdf6ec') }];
  f.strokes = [findVar('color/border') ? solidVar(findVar('color/border')) : { type: 'SOLID', color: hex('#1a1510') }];
  f.strokeWeight = 3;
  async function para(text, style) {
    const t = figma.createText();
    t.fontName = style ? style.fontName : fallback;
    t.characters = text;
    if (style) await t.setTextStyleIdAsync(style.id); else t.fontSize = 14;
    f.appendChild(t);
    t.textAutoResize = 'HEIGHT';
    t.layoutSizingHorizontal = 'FILL';
  }
  await para('Legibility rules (v1.1)', h);
  await para([
    'Type floors (variables type/role/*):',
    '• min 12px: metadata only (kickers, badges, stat labels, table headers, compact buttons). Nothing smaller, ever.',
    '• support 13px: labels, help, errors, cart meta, step labels, currency.',
    '• control 14px: anything clickable, including buttons, tabs, options, toolbar items, nav links.',
    '• body 14px / prose 16px (1.6 line height, 70ch) / input 16px.',
    '',
    'Small text has to earn its place:',
    '• Uppercase + tracking only at 12px+, max ~3 words at 12–13px.',
    '• Sentences in DM Mono start at 13px.',
    '• No muted or danger-red text on yellow, honey or amber. Use ink.',
    '',
    'Dense UI (toolbars, tab bars, filter rows) is never small UI:',
    '• Labels stay 14px sentence case; targets stay 44px; spacing may drop to 4px.',
    '• No compact buttons in toolbars or navigation.',
    '• Out of space: wrap → collapse well-known icons to icon-only (keep the name) → "More" menu. Never shrink text.',
    '• Tabs scroll sideways on mobile instead of shrinking.',
    '',
    'Colour: errors and sale prices use color/danger-text (5.51:1). Progress fills use color/meter (3.06:1). Honey on paper (2.05:1) is fill-only.',
  ].join('\n'), body);
  await para('Change log, ' + new Date().toISOString().slice(0, 10) + ':\n' + [
    ...log.variables.map(s => 'Variable: ' + s),
    ...log.textStyles.map(s => 'Text style: ' + s),
    `Component text nodes raised to floors: ${log.textNodes}`,
    ...log.rebinds.map(s => 'Rebind: ' + s),
    ...log.created.map(s => 'Created: ' + s),
    ...log.warnings.map(s => 'Review: ' + s),
  ].join('\n'), body);
  const right = Math.max(0, ...page.children.filter(n => n !== f).map(n => n.x + n.width));
  f.x = right + 200; f.y = 0;
  return f.id;
}

// ---------- run ----------
(async () => {
  try {
    const pages = figma.root.children;
    await syncVariables();
    await syncTextStyles();
    for (const p of pages) await syncComponents(p);
    const toolbarIds = await buildToolbar(pages);
    const docId = await addDocs(pages);
    const summary = `${log.variables.length} variables, ${log.textStyles.filter(s => s.includes('->')).length} text styles, ${log.textNodes} text nodes, ${log.rebinds.length} rebinds, toolbar ${toolbarIds ? 'built' : 'skipped'}. ${log.warnings.length} items to review.`;
    console.log(JSON.stringify({ log, toolbarIds, docId }, null, 2));
    figma.closePlugin('NU a11y sync done: ' + summary + ' See "Legibility rules (v1.1)" on Foundations.');
  } catch (e) {
    console.error(e);
    figma.closePlugin('NU a11y sync stopped: ' + (e && e.message ? e.message : e) + '. Use Edit > Undo to roll back.');
  }
})();
