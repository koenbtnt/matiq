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
lines.push('/** One family name per weight (Android does not synthesise weights). "System" = the platform font. */');
lines.push('export const fontFamily = {');
for (const w of ['regular', 'medium', 'semibold', 'bold']) lines.push(`  ${w}: ${q(ff[w] ?? 'System')},`);
lines.push('} as const;');
lines.push('');
lines.push('/** Ratings, counts and scores: tabular-nums (RN: fontVariant: [...fontVariantNumeric]). */');
lines.push("export const fontVariantNumeric = ['tabular-nums'] as const;");
lines.push('');

lines.push('export const textStyle = {');
for (const g of t.type?.groups ?? []) {
  for (const s of g.styles ?? []) {
    const parts = [`fontSize: ${px(s.fontSize)}`];
    if (s.lineHeight != null) parts.push(`lineHeight: ${typeof s.lineHeight === 'number' ? Math.round(px(s.fontSize) * s.lineHeight) : px(s.lineHeight)}`);
    if (s.fontWeight != null) parts.push(`fontWeight: '${s.fontWeight}' as const`);
    if (s.letterSpacing) {
      const ls = String(s.letterSpacing);
      parts.push(`letterSpacing: ${ls.endsWith('em') ? (parseFloat(ls) * px(s.fontSize)).toFixed(2) : px(ls)}`);
    }
    lines.push(`  ${camel(s.name)}: { ${parts.join(', ')} },${s.usage ? ` // ${s.usage}` : ''}`);
  }
}
lines.push('} as const;');
lines.push('');

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

if (t.semantic?.tokens?.length) {
  lines.push('/** Semantic pairings (status, progression), as token names — never hex. */');
  lines.push('export const semantic = {');
  for (const tok of t.semantic.tokens) lines.push(`  ${camel(tok.name)}: { bg: ${q(camel(tok.bg))}, text: ${q(camel(tok.text))} },${tok.usage ? ` // ${tok.usage}` : ''}`);
  lines.push('} as const satisfies Record<string, { bg: keyof ColorScheme; text: keyof ColorScheme }>;');
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
