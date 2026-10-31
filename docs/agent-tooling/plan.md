# Agent tooling — port from cadence and control ledger

Setup on 2026-10-31 (`chore/harness-setup`). The full plan with decisions D1–D19 lived in the planning session; this
file is the in-repo summary and the control ledger. ADR 0002 records the decision.

## §0 Summary

- matiq adopts cadence's agent workflow (itself ported from sugar on 2026-10-27): orchestrator → planner → designer →
  reviewer-design → coders ∥ → tester → documenter → reviewer-code → PR into `develop`.
- Stack-specific adaptations: `data-coder` replaces `backend-coder`; Maestro replaces Playwright; no web target;
  Drizzle snapshot + `descriptions.json` replace Oracle `COMMENT ON`; `data-contracts.md` replaces `api-contracts.md`;
  bash-guard rules 5/6 replaced by a secret-file rule; design source = the user's Claude Artifact.
- Deterministic controls added here that cadence only had as prose: migrations-in-sync (`drizzle-kit generate` +
  `git diff --exit-code`), token adherence (`scripts/check-token-adherence.mjs`), descriptions completeness (Jest).

## 1. What was ported

| Area | cadence | matiq |
|---|---|---|
| Agents | 9 (backend-coder, Playwright tester) | 9 (`data-coder`, Maestro tester); same models/efforts |
| Hooks | scope-lib, path-guard, bash-guard, base-ref, session-context, precompact-snapshot, review-format-check, validation-guard, sqlcl-guard | same minus `sqlcl-guard`; bash-guard rule 5 = secret files; validation-guard patterns for TS/Drizzle/Maestro |
| Rules | privacy, db, frontend, e2e, docs | privacy, **data**, frontend, e2e, docs |
| `scripts/claude/hooks.test.sh` | 100+ cases, CI job `claude` | adapted regexes and fixtures, CI job `claude` |
| Skills | mattpocock ×6, db, react-native-best-practices (`.agents/skills` + symlinks) | mattpocock ×6, react-native-best-practices, drizzle-sqlite (audit, CO-10), Anthropic design ×3 — copied into `.claude/skills/` by the skills CLI, pinned in `skills-lock.json`; plus the Expo plugin |
| `.mcp.json` | sqlcl | maestro (`maestro mcp`) |
| `settings.json` | hooks, enabledMcpjsonServers, worktree | same + `enabledPlugins: expo` |
| `.claude/launch.json` | expo-web, web-export, ords | expo-dev-client, expo-go-ios |
| Design tokens | `tokens.json` → `tokens.ts` (`--check`) | same, generic fonts/semantic; `designStatus` export; starter placeholder until intake |
| Generators | SQL dictionary, OpenAPI, changelog | `gen-data-model.mjs` (snapshot + descriptions), `gen-changelog.mjs` |
| Evals runner | CO-31 (not ported) | CO-05 (not ported) |

## 2. PO actions (install on this machine)

| # | Action | Command |
|---|---|---|
| P1 | CocoaPods (dev-client builds) | `brew install cocoapods` |
| P2 | Maestro CLI | `curl -fsSL "https://get.maestro.mobile.dev" \| bash`; add `$HOME/.maestro/bin` to PATH; `export JAVA_HOME=$(/usr/libexec/java_home)` |
| P3 | EAS (Android builds, later TestFlight) | `npm i -g eas-cli && eas login && (cd mobile && eas build:configure)` |
| P4 | context7 authorisation | `/mcp` in an interactive `claude` terminal |
| P5 | Design artifact | save the Claude Artifact HTML to `design-system/artifact/matiq-design.html` (CO-04) |
| P6 | GitHub rulesets + `ci-ok` required check | GitHub settings (CO-11) |

## 3. Control ledger — every control, its why and its expiry

| Control | Where | Why (incident) | Expires when |
|---|---|---|---|
| Path scope per agent | `path-guard.sh` + agent frontmatter | agents edited other agents' files (sugar, 2026-09) | never — role boundary |
| Scope via Bash (rule 1) | `bash-guard.sh` | spec written via Bash after the path guard refused (sugar) | never |
| Quote-aware segment split | `bash-guard.sh` | a `sed -i` with a quoted pipe escaped the scope check (cadence CO-26) | never |
| Bare `main`/`develop` refs (rule 2) | `bash-guard.sh` | "nothing to merge" from a stale local branch ×3 (sugar) | never — git semantics |
| No local merge into / push to `main`/`develop` (rule 3) | `bash-guard.sh` | local merge instead of a PR (sugar 2026-09-22) | never — process |
| `git add -A`, force push (rule 4) | `bash-guard.sh` | rule since 2026-09-22 | never |
| Secret / signing files never staged (rule 5) | `bash-guard.sh`, `.gitignore` | store signing material is the matiq-shaped secret; privacy rule | never |
| Generated migrations never hand-edited | `path-guard` deny on snapshot/journal; CI + verify row `drizzle-kit generate && git diff --exit-code` | cadence's "never hand-edit src/database" was prose only | never |
| Tokens only | `scripts/check-token-adherence.mjs` (CI + verify row) | cadence CO-27 never built | never |
| Descriptions complete | Jest `descriptions.test.ts`; documenter **Undescribed** list | replaces Oracle `COMMENT ON` review rule | never |
| Design intake gate | `.claude/rules/frontend.md`, designer modes, `designStatus` in `tokens.ts` | screens must not be specified against placeholder tokens | when the first intake has run and the starter is gone (then keep as re-export rule) |
| Two review rounds + follow-up passes | reviewer frontmatter regexes | 12 third-round files in sugar | review after 6 sprints without a third-round request |
| Removed-assertion check | `validation-guard.sh` (Stop) | a server validation loosened to pass a test (sugar 2026-09) | drop if it catches nothing in two quarters |
| Review handoff contract | `review-format-check.sh` | orchestrator gates parse severity, owner and signal | when reviews are emitted as JSON |
| Report evaluator (`type: prompt`) | coder and tester frontmatter | a separate evaluator beats self-grading (sugar D24) | re-check per model release |
| Cold-start context, compaction pointer | `session-context.sh`, `precompact-snapshot.sh` | 24 usage-limit resumes in sugar | when Claude Code's own resume carries the sprint state |
| Agent memory carve-out | `scope-lib.sh` | subagents never see the main session's memory (sugar D23) | never |
| Hook exit-code tests | `scripts/claude/hooks.test.sh`, CI job `claude` | guards changed without a committed test (cadence) | never |
| `.worktreeinclude`, `worktree.symlinkDirectories` | repo root, `settings.json` | hand-made `.env` symlinks in worktrees (sugar 2026-09-24) | when Claude Code copies ignored files itself |
| Maestro local-only | `.claude/rules/e2e.md`, CO-01 | no macOS runner yet | when CO-01 closes |

## 4. Carry-over opened here

CO-01 … CO-14 in `docs/carry-over.md`.

## 5. Verification (2026-10-31, `chore/harness-setup`)

| Check | Result |
|---|---|
| `npm run test:hooks` | 168/168 (incl. rule 5 secret files, data-coder/frontend/tester/designer scopes, Maestro and Drizzle validation-guard fixtures) |
| `cd mobile && npx tsc --noEmit` | 0 errors |
| `cd mobile && npx jest --watchAll=false --ci` | 4 suites, 13 tests passed (migrations ×3 on better-sqlite3, descriptions ×2, i18n ×7, home screen ×1) |
| `cd mobile && npx expo-doctor` | 20/20 |
| `cd mobile && npx drizzle-kit generate` | No schema changes; `git diff -- drizzle/` empty |
| `node scripts/sync-design-tokens.mjs --check` · `node scripts/check-token-adherence.mjs` | in sync · ok |
| `node scripts/docs/gen-data-model.mjs` · `gen-changelog.mjs` | 1 table, 0 undescribed · 1 migration |
| `cd mobile && npx expo prebuild --platform android --no-install` | exit 0, tree clean |
| App boot | `npx expo start --go --ios --port 8083` → Expo Go on iPhone 18 Pro renders `home.title`, `home.subtitle`, `db.ready` after `useMigrations` (screenshot checked) |
| Maestro smoke flow | not run — Maestro not installed (P2) |
| `gh repo view koenbtnt/matiq --json defaultBranchRef` | `develop` |
| PR | `chore/harness-setup → develop`, https://github.com/koenbtnt/matiq/pull/1 |
