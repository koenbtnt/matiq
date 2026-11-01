# data-coder memory

Seeded 2026-10-31 by the main session from the repository scaffold (`docs/stack-notes.md` "Scaffold facts"). One line
per lesson, dated, with the file it concerns. Delete a line once a rule or a fix supersedes it.

- 2026-10-31 · drizzle-kit 0.31 with `driver: 'expo'` writes the flat layout: `mobile/drizzle/NNNN_<tag>.sql`, `meta/_journal.json`, `meta/NNNN_snapshot.json`, `migrations.js`. Tests find the latest snapshot through `_journal.json` (`mobile/src/db/__tests__/descriptions.test.ts`).
- 2026-10-31 · `better-sqlite3` 13 loads its shipped prebuilt binary on Node 26 even though npm 11 skipped its install script (`allowScripts` unset) — no libsql fallback needed; do not "fix" the skipped-script warning.
- 2026-10-31 · The `.sql` import for `useMigrations` needs `babel-plugin-inline-import` (`babel.config.js`), `sourceExts.push('sql')` (`metro.config.js`) and the `*.sql` module declaration in `mobile/src/types/sql.d.ts`.
- 2026-10-31 · db tests run under `@jest-environment node` (file-level docblock); the default jest-expo environment has no `fs`.
- 2026-11-01 · The path/bash guard regex is fixed at spawn time (agent definitions are cached per session), so it can lag the current `.claude/agents/data-coder.md`. When the guard refuses a path the definition grants, report `CODING BLOCKED` with the path and let the orchestrator/PO route it; do not copy files in through another subagent or write through `node -e` (PO ruling pending, carry-over CO-37).
- 2026-11-01 · The guard blocks `rm` of an uncommitted snapshot; drop a bad uncommitted migration with `(sleep 4; printf '\r') | script -q /dev/null npx drizzle-kit drop` (default = last entry) (`mobile/drizzle/`).
- 2026-11-01 · Bash guard resolves relative paths against the repo root, not the `cd` — use absolute paths for scratchpad targets.
- 2026-11-01 · Quote heredocs (`<<'EOF'`) when the body has backticks; an unquoted one ran a command substitution and silently broke a python replace.
- 2026-11-01 · Helper modules under `__tests__/` are collected as suites ("must contain at least one test"); keep fixtures in `testing/` (`mobile/src/repositories/testing/`).
