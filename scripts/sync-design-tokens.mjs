#!/usr/bin/env node
/**
 * Generates mobile/src/theme/tokens.ts from design-system/tokens.json.
 *
 * design-system/tokens.json is derived by the designer agent from the user's design artifact
 * (design-system/artifact/matiq-design.html) during the design intake — see design-system/README.md.
 *   node scripts/sync-design-tokens.mjs           → writes mobile/src/theme/tokens.ts
 *   node scripts/sync-design-tokens.mjs --check   → exit 1 if tokens.ts is out of date (CI)
 *
 * Never edit tokens.ts by hand. Output is deterministic (no timestamps).
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const srcPath = resolve(root, 'design-system/tokens.json');
const outPath = resolve(root, 'mobile/src/theme/tokens.ts');
const check = process.argv.includes('--check');

if (!existsSync(srcPath)) {
  console.error(`design-system/tokens.json is missing. Run the design intake (design-system/README.md) or restore the starter file.`);
  process.exit(1);
}
const t = JSON.parse(readFileSync(srcPath, 'utf8'));

const camel = (s) => s.replace(/[-_.]+(\w)/g, (_, c) => c.toUpperCase());
const px = (v) => (typeof v === 'number' ? v : Number(String(v).replace(/px$/, '')));
const q = (s) => `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

const themes = t.color.themes.map((th) => th.id);
const first = themes[0];
const colorVal = (tok, theme) => (typeof tok.value === 'string' ? tok.value : (tok.value[theme] ?? tok.value[first]));

const lines = [];
lines.push('/**');
lines.push(` * ${t.name} design tokens — GENERATED from design-system/tokens.json (version ${t.version ?? 0}).`);
lines.push(' * Do not edit by hand: node scripts/sync-design-tokens.mjs');
lines.push(' * Source of truth: the design artifact in design-system/artifact/, via the designer intake.');
lines.push(' */');
lines.push('');
lines.push(`/** "starter" until the design intake has run; screens are not specified against starter tokens. */`);
lines.push(`export const designStatus = ${q(t._status ?? 'intake')} as const;`);
lines.push('');
const ff = t.type?.fontFamily ?? {};
const dff = t.type?.displayFontFamily ?? {};
const emitFamily = (map, order, doc, name) => {
  lines.push(doc);
  lines.push(`export const ${name} = {`);
  for (const w of order) if (map[w] || name === 'fontFamily') lines.push(`  ${w}: ${q(map[w] ?? 'System')},`);
  lines.push('} as const;');
  lines.push('');
};
emitFamily(ff, ['regular', 'medium', 'semibold', 'bold'], '/** Sans family name per weight (Android does not synthesise weights). "System" = the platform font. */', 'fontFamily');
if (Object.keys(dff).length) emitFamily(dff, ['regular', 'medium', 'semibold', 'bold', 'extrabold'], '/** Display family name per weight. */', 'displayFontFamily');
lines.push('/** Ratings, counts and scores: tabular-nums (RN: fontVariant: [...fontVariantNumeric]). */');
lines.push("export const fontVariantNumeric = ['tabular-nums'] as const;");
lines.push('');

// CSS weight -> family-map key. A weight the family does not define falls back to the nearest defined weight (ties: heavier).
const WEIGHT_KEY = { 400: 'regular', 500: 'medium', 600: 'semibold', 700: 'bold', 800: 'extrabold' };
const resolveFamily = (fam, weight) => {
  const map = fam === 'display' ? dff : ff;
  const w = Number(weight ?? 400);
  const defined = Object.keys(WEIGHT_KEY).map(Number).filter((k) => map[WEIGHT_KEY[k]]);
  if (!defined.length) return undefined;
  const pick = defined.includes(w) ? w : defined.reduce((best, k) => (Math.abs(k - w) < Math.abs(best - w) || (Math.abs(k - w) === Math.abs(best - w) && k > best) ? k : best));
  return map[WEIGHT_KEY[pick]];
};

const maxScale = [];
lines.push('export const textStyle = {');
for (const g of t.type?.groups ?? []) {
  for (const s of g.styles ?? []) {
    const parts = [`fontSize: ${px(s.fontSize)}`];
    if (s.lineHeight != null) parts.push(`lineHeight: ${typeof s.lineHeight === 'number' ? Math.round(px(s.fontSize) * s.lineHeight) : px(s.lineHeight)}`);
    const fam = resolveFamily(s.family ?? 'sans', s.fontWeight);
    if (fam) parts.push(`fontFamily: ${q(fam)}`);
    if (s.fontWeight != null) parts.push(`fontWeight: '${s.fontWeight}' as const`);
    if (s.letterSpacing) {
      const ls = String(s.letterSpacing);
      parts.push(`letterSpacing: ${ls.endsWith('em') ? (parseFloat(ls) * px(s.fontSize)).toFixed(2) : px(ls)}`);
    }
    if (s.fontVariantNumeric === 'tabular-nums') parts.push("fontVariant: ['tabular-nums'] as const");
    if (s.textTransform === 'uppercase') parts.push("textTransform: 'uppercase' as const");
    if (s.maxFontSizeMultiplier != null) maxScale.push([camel(s.name), s.maxFontSizeMultiplier]);
    const notes = [];
    if (s.fontStretch) notes.push(`fontStretch ${s.fontStretch} — pending DSR-12`);
    if (s.usage) notes.push(s.usage);
    lines.push(`  ${camel(s.name)}: { ${parts.join(', ')} },${notes.length ? ` // ${notes.join(' · ')}` : ''}`);
  }
}
lines.push('} as const;');
lines.push('');
if (maxScale.length) {
  lines.push('/** Per-style maxFontSizeMultiplier — a <Text> prop, not a style: <Text maxFontSizeMultiplier={textMaxScale.display}>. */');
  lines.push('export const textMaxScale = {');
  for (const [n, v] of maxScale) lines.push(`  ${n}: ${v},`);
  lines.push('} as const;');
  lines.push('');
}
if (t.type?.scaling) {
  const { usage, ...sc } = t.type.scaling;
  if (usage) lines.push(`/** ${usage} */`);
  lines.push('export const textScaling = {');
  for (const [k, v] of Object.entries(sc)) lines.push(`  ${k}: ${typeof v === 'number' ? v : q(v)},`);
  lines.push('} as const;');
  lines.push('');
}

const family = (key, name, mapVal = px) => {
  const fam = t[key];
  if (!fam?.tokens?.length) return;
  lines.push(`export const ${name} = {`);
  for (const tok of fam.tokens) lines.push(`  ${camel(tok.name.replace(/^(space|radius)-/, ''))}: ${mapVal(tok.value)},${tok.usage ? ` // ${tok.usage}` : ''}`);
  lines.push('} as const;');
  lines.push('');
};
family('spacing', 'spacing');
family('radius', 'radius');
family('size', 'size');

for (const theme of themes) {
  lines.push(`export const ${theme} = {`);
  for (const tok of t.color.tokens) lines.push(`  ${camel(tok.name)}: ${q(colorVal(tok, theme))},${theme === first && tok.usage ? ` // ${tok.usage}` : ''}`);
  for (const tok of t.shadow?.tokens ?? []) lines.push(`  ${camel(tok.name)}: ${q(colorVal(tok, theme))},`);
  lines.push(`} as const${theme === first ? '' : ' satisfies ColorScheme'};`);
  lines.push('');
  if (theme === first) { lines.push(`export type ColorScheme = { [K in keyof typeof ${first}]: string };`); lines.push(''); }
}
lines.push(`export const colors = { ${themes.join(', ')} } as const;`);
lines.push('');

const colorNames = new Set(t.color.tokens.map((c) => c.name));
for (const tok of t.semantic?.tokens ?? []) {
  for (const k of ['bg', 'text']) {
    if (!colorNames.has(tok[k])) { console.error(`semantic pair "${tok.name}" names ${k} "${tok[k]}", which is not a colour token.`); process.exit(1); }
  }
}
if (t.semantic?.tokens?.length) {
  lines.push('/** Semantic pairings (status, progression), as token names — never hex. */');
  lines.push('export const semantic = {');
  for (const tok of t.semantic.tokens) lines.push(`  ${camel(tok.name)}: { bg: ${q(camel(tok.bg))}, text: ${q(camel(tok.text))} },${tok.usage ? ` // ${tok.usage}` : ''}`);
  lines.push('} as const satisfies Record<string, { bg: keyof ColorScheme; text: keyof ColorScheme }>;');
  lines.push('');
}

if (t.motion?.tokens?.length) {
  lines.push('/** Durations in ms. easing is a name from the design ("spring" has no parameters yet). Respect Reduce Motion. */');
  lines.push('export const motion = {');
  for (const tok of t.motion.tokens) {
    const parts = [`duration: ${tok.value}`];
    if (tok.easing) parts.push(`easing: ${q(tok.easing)}`);
    lines.push(`  ${camel(tok.name)}: { ${parts.join(', ')} },${tok.usage ? ` // ${tok.usage}` : ''}`);
  }
  lines.push('} as const;');
  lines.push('');
}
if (t.haptics?.tokens?.length) {
  lines.push('/** Haptic names per platform (expo-haptics on iOS, Android HapticFeedbackConstants). */');
  lines.push('export const haptics = {');
  for (const tok of t.haptics.tokens) lines.push(`  ${camel(tok.name)}: { ios: ${q(tok.ios)}, android: ${q(tok.android)} },${tok.usage ? ` // ${tok.usage}` : ''}`);
  lines.push('} as const;');
  lines.push('');
}
if (t.icon) {
  lines.push('/** Icon drawing parameters. */');
  lines.push('export const icon = {');
  for (const k of ['grid', 'stroke']) if (t.icon[k] != null) lines.push(`  ${k}: ${t.icon[k]},`);
  for (const k of ['linecap', 'linejoin']) if (t.icon[k] != null) lines.push(`  ${k}: ${q(t.icon[k])},`);
  lines.push('} as const;');
  lines.push('');
}

const out = lines.join('\n');
if (check) {
  let cur = '';
  try { cur = readFileSync(outPath, 'utf8'); } catch {}
  if (cur !== out) { console.error('mobile/src/theme/tokens.ts is out of sync with design-system/tokens.json. Run: node scripts/sync-design-tokens.mjs'); process.exit(1); }
  console.log('tokens.ts is in sync.');
} else {
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, out);
  console.log(`written: ${outPath}`);
}
