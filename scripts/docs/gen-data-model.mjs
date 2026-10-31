#!/usr/bin/env node
/**
 * Generates docs/data-model/dictionary.md and docs/data-model/erd.md from the latest Drizzle
 * snapshot under mobile/drizzle/ and the column descriptions in
 * mobile/src/db/schema/descriptions.json ("generate what you can, write only the why").
 *
 *   node scripts/docs/gen-data-model.mjs
 *
 * Tables or columns without a description are listed under "Undescribed" at the top of the
 * dictionary — a defect against the data-coder, not something to type in here. Deterministic.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync, statSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const drizzleDir = resolve(root, 'mobile/drizzle');
const descPath = resolve(root, 'mobile/src/db/schema/descriptions.json');
const outDir = resolve(root, 'docs/data-model');

function latestSnapshot() {
  const candidates = [];
  const meta = join(drizzleDir, 'meta');
  if (existsSync(meta)) for (const f of readdirSync(meta)) if (/_snapshot\.json$/.test(f)) candidates.push(join(meta, f));
  if (existsSync(drizzleDir)) for (const d of readdirSync(drizzleDir)) {
    const p = join(drizzleDir, d, 'snapshot.json');
    if (existsSync(p) && statSync(p).isFile()) candidates.push(p);
  }
  if (!candidates.length) return null;
  candidates.sort();
  return candidates[candidates.length - 1];
}

const snapPath = latestSnapshot();
if (!snapPath) { console.error('gen-data-model: no Drizzle snapshot found under mobile/drizzle/. Run `npx drizzle-kit generate` in mobile/ first.'); process.exit(1); }
const snap = JSON.parse(readFileSync(snapPath, 'utf8'));
const desc = existsSync(descPath) ? JSON.parse(readFileSync(descPath, 'utf8')) : {};
const tables = Object.values(snap.tables ?? {}).sort((a, b) => a.name.localeCompare(b.name));

const undescribed = [];
const dict = [];
dict.push('# Data dictionary — generated');
dict.push('');
dict.push(`Source: \`${snapPath.replace(root + '/', '')}\` + \`mobile/src/db/schema/descriptions.json\`. Regenerate with \`node scripts/docs/gen-data-model.mjs\`. Never edit by hand.`);
dict.push('');
for (const tbl of tables) {
  const d = desc[tbl.name] ?? {};
  if (!d._) undescribed.push(`${tbl.name} (table)`);
  dict.push(`## ${tbl.name}`);
  dict.push('');
  dict.push(d._ ? d._ : '_(no description)_');
  dict.push('');
  dict.push('| Column | Type | Null | PK | Default | Description |');
  dict.push('|---|---|---|---|---|---|');
  for (const col of Object.values(tbl.columns ?? {}).sort((a, b) => a.name.localeCompare(b.name))) {
    if (!d[col.name]) undescribed.push(`${tbl.name}.${col.name}`);
    dict.push(`| ${col.name} | ${col.type} | ${col.notNull ? 'no' : 'yes'} | ${col.primaryKey ? 'yes' : ''} | ${col.default ?? ''} | ${d[col.name] ?? '_(none)_'} |`);
  }
  const checks = Object.values(tbl.checkConstraints ?? {});
  const uniques = Object.values(tbl.uniqueConstraints ?? {});
  const fks = Object.values(tbl.foreignKeys ?? {});
  if (checks.length || uniques.length || fks.length) {
    dict.push('');
    dict.push('Constraints:');
    for (const c of checks) dict.push(`- CHECK \`${c.name}\`: \`${c.value}\``);
    for (const u of uniques) dict.push(`- UNIQUE \`${u.name}\` (${(u.columns ?? []).join(', ')})`);
    for (const fk of fks) dict.push(`- FK \`${fk.name}\`: (${fk.columnsFrom.join(', ')}) → ${fk.tableTo}(${fk.columnsTo.join(', ')})${fk.onDelete ? ` on delete ${fk.onDelete}` : ''}`);
  }
  dict.push('');
}
const head = ['# Data dictionary — generated', '', ...(undescribed.length ? ['## Undescribed (defect: data-coder)', '', ...undescribed.map((u) => `- ${u}`), ''] : ['_All tables and columns are described._', ''])];
const dictOut = [...head, ...dict.slice(1)].join('\n') + '\n';

const erd = ['# ERD — generated', '', `Source: \`${snapPath.replace(root + '/', '')}\`. Regenerate with \`node scripts/docs/gen-data-model.mjs\`.`, '', '```mermaid', 'erDiagram'];
for (const tbl of tables) {
  erd.push(`  ${tbl.name} {`);
  for (const col of Object.values(tbl.columns ?? {})) erd.push(`    ${String(col.type).replace(/[^a-zA-Z0-9_]/g, '_')} ${col.name}${col.primaryKey ? ' PK' : ''}`);
  erd.push('  }');
}
for (const tbl of tables) for (const fk of Object.values(tbl.foreignKeys ?? {})) erd.push(`  ${fk.tableTo} ||--o{ ${tbl.name} : "${fk.columnsFrom.join(',')}"`);
erd.push('```', '');

mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'dictionary.md'), dictOut);
writeFileSync(join(outDir, 'erd.md'), erd.join('\n'));
console.log(`written: docs/data-model/dictionary.md, docs/data-model/erd.md (${tables.length} tables, ${undescribed.length} undescribed)`);
