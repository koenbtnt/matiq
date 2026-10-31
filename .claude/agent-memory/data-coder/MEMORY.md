# data-coder memory

Seeded 2026-10-31 by the main session from the repository scaffold (`docs/stack-notes.md` "Scaffold facts"). One line
per lesson, dated, with the file it concerns. Delete a line once a rule or a fix supersedes it.

- 2026-10-31 · drizzle-kit 0.31 with `driver: 'expo'` writes the flat layout: `mobile/drizzle/NNNN_<tag>.sql`, `meta/_journal.json`, `meta/NNNN_snapshot.json`, `migrations.js`. Tests find the latest snapshot through `_journal.json` (`mobile/src/db/__tests__/descriptions.test.ts`).
- 2026-10-31 · `better-sqlite3` 13 loads its shipped prebuilt binary on Node 26 even though npm 11 skipped its install script (`allowScripts` unset) — no libsql fallback needed; do not "fix" the skipped-script warning.
- 2026-10-31 · The `.sql` import for `useMigrations` needs `babel-plugin-inline-import` (`babel.config.js`), `sourceExts.push('sql')` (`metro.config.js`) and the `*.sql` module declaration in `mobile/src/types/sql.d.ts`.
- 2026-10-31 · db tests run under `@jest-environment node` (file-level docblock); the default jest-expo environment has no `fs`.
