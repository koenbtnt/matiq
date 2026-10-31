# frontend-coder memory

Seeded 2026-10-31 by the main session from the repository scaffold and from cadence's frontend-coder memory where the
lesson is stack-generic (tagged "cadence, unverified here"). One line per lesson, dated, with the file it concerns.
Delete a line once a rule or a fix supersedes it.

- 2026-10-31 · Expo SDK 58: `newArchEnabled` is rejected by the app.json schema (`expo-doctor`); the New Architecture is always on — never add the key.
- 2026-10-31 · The SDK 58 template puts routes in `src/app/`; this repo uses `mobile/app/`. Expo Router falls back to `app/` only when `src/app/` does not exist — never create `src/app/`.
- 2026-10-31 · Every `.tsx` under `mobile/app/` becomes a route: UI tests live in `mobile/__tests__/` (tsconfig `include` has it), never in `app/__tests__/`.
- 2026-10-31 · `react-test-renderer` is pinned to the exact installed `react` (19.3.0) and `test-renderer` 1.3.1 is RTL 14's peer (`mobile/package.json`).
- 2026-10-31 · i18next runs with `initAsync: false` so `t()` resolves on the first render (`mobile/src/i18n/index.ts`); typed keys come from `mobile/src/i18n/types.d.ts` — a wrong key is a TS2345.
- (cadence 2026-10-27, unverified here) TypeScript 6: `compilerOptions.types` defaults to `[]`, so Jest/Node globals need `"types": ["jest","node"]`; `baseUrl` is deprecated — relative imports.
- (cadence 2026-10-27, unverified here) @testing-library/react-native 14: `render` and `fireEvent.*` are async — `await` every call or React reports overlapping `act()` and `screen` is empty.
- (cadence 2026-10-27, unverified here) Metro served stale modules after edits until restarted with `--clear`; restart it before a smoke run.
- (cadence 2026-10-13, unverified here) macOS `sed -i` needs `-i ''`; use perl or python for repo-wide rewrites.
- (cadence 2026-10-23, unverified here) Test-only `tsc` errors are invisible to Jest — run `npx tsc --noEmit` after writing tests, not only after code.
