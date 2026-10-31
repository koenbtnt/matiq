#!/usr/bin/env node
/**
 * Tokens-only gate for the UI (.claude/rules/frontend.md): fails when a colour, pixel size or
 * font-name literal appears in UI code instead of a token from mobile/src/theme/tokens.ts.
 *
 *   node scripts/check-token-adherence.mjs            → exit 1 with file:line per violation
 *
 * Scanned: mobile/app/** and mobile/src/{components,features,hooks}/**  (.ts, .tsx), excluding
 * tests, mocks and .d.ts. A justified exception carries the comment
 * `// token-adherence: allow — <reason>` on the same line. Deterministic output.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { resolve, dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const roots = ['mobile/app', 'mobile/src/components', 'mobile/src/features', 'mobile/src/hooks'].map((p) => resolve(root, p));
const skipDir = /(^|\/)(__tests__|__mocks__|node_modules)(\/|$)/;
const skipFile = /(\.test\.tsx?|\.spec\.tsx?|\.d\.ts)$/;

const rules = [
  { name: 'hex colour literal', re: /#[0-9a-fA-F]{3,8}\b/ },
  { name: 'pixel literal', re: /\b\d+(\.\d+)?px\b/ },
  { name: 'fontFamily literal', re: /fontFamily\s*:\s*['"`]/ },
];

function* walk(dir) {
  let entries = [];
  try { entries = readdirSync(dir); } catch { return; }
  for (const e of entries.sort()) {
    const p = join(dir, e);
    if (skipDir.test(p)) continue;
    const st = statSync(p);
    if (st.isDirectory()) yield* walk(p);
    else if (/\.tsx?$/.test(e) && !skipFile.test(e)) yield p;
  }
}

const violations = [];
for (const r of roots) {
  for (const f of walk(r)) {
    const src = readFileSync(f, 'utf8').split('\n');
    src.forEach((line, i) => {
      if (/token-adherence:\s*allow/.test(line)) return;
      const code = line.replace(/\/\/.*$/, '');          // ignore trailing comments
      for (const rule of rules) if (rule.re.test(code)) violations.push(`${relative(root, f)}:${i + 1}: ${rule.name}`);
    });
  }
}
if (violations.length) {
  console.error(`token-adherence: ${violations.length} violation(s). Use tokens from mobile/src/theme/tokens.ts, or justify with "// token-adherence: allow — <reason>".`);
  for (const v of violations) console.error('  ' + v);
  process.exit(1);
}
console.log('token-adherence: ok');
