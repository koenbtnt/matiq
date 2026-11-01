# Stack notes — external facts, verified once

Check here before any external lookup; append after one. One row per fact:
library · version · fact · source · date. Facts about installed tools are measured on this
machine and say so. Never a credential or personal data.

## Measured on this machine (2026-10-31, project setup)

| tool | version | fact | source | date |
|---|---|---|---|---|
| Node | 26.13.0 | LTS line "Lithium" (nodejs.org dist index, 2026-10-28); inside Expo 58's `engines` range `^22.13.0 \|\| ^24.3.0 \|\| ^26.0.0 \|\| >=27.0.0`. `mobile/.nvmrc` = `26`; CI reads it. | `node -v`, `node_modules/expo/package.json` | 2026-10-31 |
| npm | 11.20.0 | Install scripts for `better-sqlite3`, `esbuild`, `fsevents`, `@parcel/watcher` were skipped (`allowScripts` unset); everything works because `better-sqlite3` ships a prebuilt binary. | `npm install` output | 2026-10-31 |
| Xcode | 27.2 (27B52) | iOS simulators available: iPhone 17, 17e, 18 Pro, 18 Pro Max, Air, iPad mini, iPad Pro 13. | `xcodebuild -version`, `xcrun simctl list` | 2026-10-31 |
| Java | Temurin 27 | present at `/Library/Java/JavaVirtualMachines/temurin-27.jdk` (Maestro needs ≥ 17). | `java -version` | 2026-10-31 |
| Android | — | Android Studio app installed, no SDK (`~/Library/Android` absent, `ANDROID_HOME` unset), no `adb`/`emulator`. | `ls`, `command -v` | 2026-10-31 |
| Missing | — | `maestro`, `pod` (CocoaPods), `eas` — PO actions in `docs/agent-tooling/plan.md`. | `command -v` | 2026-10-31 |
| gh | 2.x | authenticated as `koenbtnt` (scopes gist, read:org, repo, workflow); repo `koenbtnt/matiq` is public, default branch `develop` since 2026-10-31. | `gh auth status`, `gh repo view` | 2026-10-31 |

## Scaffold facts (`mobile/`, 2026-10-31)

| library | version | fact | source | date |
|---|---|---|---|---|
| create-expo-app | 5.0.0 | `--template default@sdk-58` works; the template puts routes in `src/app/` — moved to `app/` (Expo Router falls back to `app/` only when `src/app/` is absent; never create `src/app/`). `reset-project` answered `n` deletes the examples without creating `app-example/`. | run on this machine | 2026-10-31 |
| expo | 58.0.22 | SDK 58. `newArchEnabled` is rejected by the app.json schema (`expo-doctor`): the New Architecture is always on. `expo-doctor` 20/20 after removing it and the `web` key. | `npx expo-doctor` | 2026-10-31 |
| react / react-native / expo-router | 19.3.0 / 0.88.1 / 58.0.29 | `react-test-renderer` pinned to exactly 19.3.0; `test-renderer` 1.3.1 is RTL 14's peer. | `mobile/package.json` | 2026-10-31 |
| expo-sqlite / expo-localization / expo-crypto / expo-dev-client | 58.0.15 / ~58.0.5 / ~58.0.7 / ~58.0.18 | installed with `npx expo install`. | `mobile/package.json` | 2026-10-31 |
| drizzle-orm / drizzle-kit | 0.45.4 / 0.31.11 | Stable `latest` (1.0.0-rc skipped). `drizzle.config.ts` needs `dialect: 'sqlite', driver: 'expo'`. Generated layout is flat: `drizzle/NNNN_<tag>.sql`, `meta/_journal.json`, `meta/NNNN_snapshot.json`, `migrations.js` (imports the journal and each `.sql`). `useMigrations` from `drizzle-orm/expo-sqlite/migrator`; Jest uses `drizzle-orm/better-sqlite3/migrator` on the same folder. | run on this machine; https://orm.drizzle.team/docs/get-started/expo-new | 2026-10-31 |
| babel-plugin-inline-import | 3.0.0 | `['inline-import', { extensions: ['.sql'] }]` in `babel.config.js` + `config.resolver.sourceExts.push('sql')` in `metro.config.js` + `declare module '*.sql'` in `mobile/src/types/sql.d.ts`. | run on this machine | 2026-10-31 |
| better-sqlite3 | 13.0.3 | Works on Node 26 (SQLite 3.53.4) from its prebuilt binary; db tests run under `@jest-environment node`. | `npx jest` | 2026-10-31 |
| i18next / react-i18next | 26.5.12 / 17.1.9 | `initAsync: false` so `t()` resolves on first render; typed keys via `CustomTypeOptions` in `mobile/src/i18n/types.d.ts` (a wrong key is TS2345). | run on this machine | 2026-10-31 |
| jest / jest-expo / @testing-library/react-native | 30.5.2 / 58.0.13 / 14.1.0 | `@react-native/jest-preset` 0.88.1 is a required peer of jest-expo 58; `drizzle-orm` added to `transformIgnorePatterns`; `jest.setup.ts` via `setupFiles`. UI tests live in `mobile/__tests__/` (a `.tsx` under `app/` becomes a route). | run on this machine | 2026-10-31 |
| typescript | 6.0.3 | `"types": ["jest","node"]` required (TS 6 defaults `types` to `[]`); `noUncheckedIndexedAccess` on. | `mobile/tsconfig.json` | 2026-10-31 |
| expo (dev client) | 58.0.22 | With `expo-dev-client` installed, `npx expo start --ios` looks for a dev build and exits ("No development build (nl.btnt.matiq) … is installed"); `npx expo start --go --ios` launches Expo Go instead. Port 8081 may be held by another project's Metro — pass `--port`. | run on this machine | 2026-10-31 |
| Maestro | — | Official install: `curl -fsSL "https://get.maestro.mobile.dev" \| bash` (or `brew tap mobile-dev-inc/tap && brew install mobile-dev-inc/tap/maestro`); the CLI ships an MCP server (`maestro mcp`: list_devices, inspect_screen, take_screenshot, run). Not installed yet. | https://docs.maestro.dev | 2026-10-31 |
| Expo plugin (Claude Code) | expo@claude-plugins-official | 24 skills (`/expo:expo-router`, `/expo:eas-*`, …), a bundled Expo MCP server (docs, EAS builds, store reviews) and two hooks. Enabled project-wide in `.claude/settings.json`. | plugin directory listing | 2026-10-31 |
| skills CLI | skills@latest | `npx skills@latest add <owner/repo> -a claude-code -s <one-skill> -y` copies the skill into `.claude/skills/<name>/` (no `.agents/` layer in this CLI version); the `-s` flag takes one name per invocation (a comma list matches nothing); `skills-lock.json` at the repo root pins source path and hash; `npx skills@latest experimental_install` restores from the lock. | run on this machine | 2026-10-31 |

- Token generator (`scripts/sync-design-tokens.mjs`): per-style `fontFamily` resolves weight -> family map key (400..800); a weight the family lacks falls back to the nearest defined (ties heavier). `fontStretch` has no RN style: comment only (DSR-12). `maxFontSizeMultiplier` is a `<Text>` prop, exported as `textMaxScale`. Semantic pairs naming a non-existent colour token abort generation.

## Facts gathered for sprint `product-spec` (PO grilling session, 2026-10-31)

| library | version | fact | source | date |
|---|---|---|---|---|
| GrappleMap | master 2023-02-06 | Public domain (LICENSE + README FAQ). `GrappleMap.txt` 2,674,097 bytes: 2086 records = 601 positions + 1485 transitions (PR 4 validator, 0 errors). Format: name (literal `\n`), `tags:` `[a-z0-9_]+`, `ref:`, `properties:` top/bottom/detailed/bidirectional, pose blocks 4 × 69 base-62 digits; 1 block = position, ≥ 2 = transition; nodes connect by identical poses, endpoints may be reoriented. 1208 `ref:` citations, 161 tags, 206 names with "w/". No gi, no aliases, no stable ids. Open PRs 4 (validate-db.py), 5 (db-files.py split/join, byte-identical), 6 (CONTRIBUTING.md format) are unmerged but correct — reference for our converter. | https://github.com/Eelis/GrappleMap, https://github.com/Eelis/GrappleMap/pulls; measured on this machine | 2026-10-31 |
| bjj3d | main 2026-10-26 | MIT/Apache; `packages/data/scripts/build-data.ts` builds a `graph.json` from GrappleMap incl. endpoint resolution — reference implementation for pose canonicalisation, not a dependency. | https://github.com/matheusmota-dev-br/bjj3d | 2026-10-31 |
| BJJGraph | 2026-10-30 | PolyForm Noncommercial 1.0.0; 133 positions, 1,025 transitions, 353 submissions, typed, gi/no-gi, stable slugs. Reference only without a licence. | https://github.com/diogoseca/bjjgraph | 2026-10-31 |
| grapple-flows/bjj-data | 2026-09-27 | CC BY 4.0 data: 45 alias entries with slugs; legality tables per ruleset (IBJJF, ADCC, NAGA, Grappling Industries) with gi/no-gi flags. | https://github.com/grapple-flows/bjj-data | 2026-10-31 |
| Wikipedia / Wikidata | 2026-10-20 | "List of Brazilian jiu-jitsu techniques" CC BY-SA 4.0, ~200 flat entries → alias hints by hand only; Wikidata < ~50 BJJ items, no systematic typing. | en.wikipedia.org, wikidata.org | 2026-10-31 |
| expo-sqlite | 58 | `useSQLCipher` config-plugin property (default false) switches to SQLCipher builds; needs a native (dev-client) build, Expo Go cannot run it; key supplied at open (`PRAGMA key`), store it with `expo-secure-store`. | https://docs.expo.dev/versions/v58.0.0/sdk/sqlite.md | 2026-10-31 |
