#!/usr/bin/env node
/**
 * Generates docs/data-model/changelog.md — the readable index of schema migrations — from
 * mobile/drizzle/ (journal + migration SQL). The migrations ARE the history; this is the index.
 *
 *   node scripts/docs/gen-changelog.mjs
 *
 * Handles both drizzle-kit layouts: meta/_journal.json + NNNN_tag.sql, and <tag>/migration.sql
 * folders. Deterministic output, no timestamps beyond those drizzle recorded.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync, statSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const drizzleDir = resolve(root, 'mobile/drizzle');
const outDir = resolve(root, 'docs/data-model');

const rows = [];
const journalPath = join(drizzleDir, 'meta', '_journal.json');
if (existsSync(journalPath)) {
  const journal = JSON.parse(readFileSync(journalPath, 'utf8'));
  for (const e of journal.entries ?? []) {
    const sqlPath = join(drizzleDir, `${e.tag}.sql`);
    const sql = existsSync(sqlPath) ? readFileSync(sqlPath, 'utf8') : '';
    rows.push({ idx: e.idx, tag: e.tag, when: e.when ? new Date(e.when).toISOString().slice(0, 10) : '', statements: sql.split('--> statement-breakpoint').filter((s) => s.trim()).length });
  }
} else if (existsSync(drizzleDir)) {
  let idx = 0;
  for (const d of readdirSync(drizzleDir).sort()) {
    const p = join(drizzleDir, d, 'migration.sql');
    if (existsSync(p) && statSync(p).isFile()) {
      const sql = readFileSync(p, 'utf8');
      rows.push({ idx: idx++, tag: d, when: '', statements: sql.split('--> statement-breakpoint').filter((s) => s.trim()).length });
    }
  }
}
if (!rows.length) { console.error('gen-changelog: no migrations found under mobile/drizzle/.'); process.exit(1); }

const out = ['# Schema changelog — generated', '', 'Source: `mobile/drizzle/`. Regenerate with `node scripts/docs/gen-changelog.mjs`. Never edit by hand.', '', '| # | Migration | Generated | Statements |', '|---|---|---|---|', ...rows.map((r) => `| ${r.idx} | \`${r.tag}\` | ${r.when} | ${r.statements} |`), ''].join('\n');
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'changelog.md'), out);
console.log(`written: docs/data-model/changelog.md (${rows.length} migrations)`);
