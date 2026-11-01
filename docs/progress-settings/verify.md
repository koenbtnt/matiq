# progress-settings — verify

Append-only, one block per agent per sha (`.claude/rules/docs.md`); mirrored in `verify.json`.

### frontend-coder @ 81c4bda — 2026-11-01
Phase A (UI on typed mocks). The working tree also carried the data-coder's uncommitted `mobile/src/{domain,repositories}/**` edits while this ran.

| Command | Exit | Notes |
|---|---|---|
| npx tsc --noEmit | 2 | 1 error, outside frontend scope: `src/repositories/__tests__/progression.test.ts(114,20)` TS2339 `$client` on `Db` (data-coder's uncommitted test). 0 errors in `app/`, `src/{components,features,hooks,i18n,__mocks__}`, `__tests__/` |
| TZ=UTC npx jest --watchAll=false | 0 | Tests: 1673 passed, 0 failed (38 suites) |
| TZ=Europe/Amsterdam npx jest --watchAll=false | 0 | Tests: 1673 passed, 0 failed (38 suites); CO-06 local zone |
| node scripts/sync-design-tokens.mjs --check | 0 | |
| node scripts/check-token-adherence.mjs | 0 | |
| npx expo-doctor | 0 | 20/20 |
| npx expo run:ios (smoke) | — | not run: optional in phase A, no build started |

### data-coder @ f39172c — 2026-11-01
Clean tree at HEAD (only `docs/stack-notes.md` and `.claude/agent-memory/planner/MEMORY.md` modified, neither under test).

| Command | Exit | Notes |
|---|---|---|
| npx tsc --noEmit | 0 | |
| TZ=UTC npx jest --watchAll=false | 0 | Tests: 1722 passed, 0 failed (41 suites) |
| TZ=Europe/Amsterdam npx jest --watchAll=false | 0 | Tests: 1722 passed, 0 failed (41 suites); CO-06 local zone. Data layer (`src/{db,domain,repositories}`): 539 passed (25 suites) |
| npx drizzle-kit generate && git diff --exit-code -- mobile/drizzle/ | 0 | No schema changes, nothing to migrate (PS-01) |
| NF-09 (Jest benchmark, informative) | 0 | computeProgression 500 sessions × 3 focuses 0.25 ms; progression.overview end to end on better-sqlite3 4.64 ms (target < 100 ms) |

### frontend-coder @ 169fe7e — 2026-11-01 (phase B)
| Command | Exit | Notes |
|---|---|---|
| npx tsc --noEmit | 0 | |
| TZ=UTC npx jest --watchAll=false | 0 | Tests: 1722 passed, 0 failed (41 suites) |
| TZ=Europe/Amsterdam npx jest --watchAll=false | 0 | Tests: 1722 passed, 0 failed (41 suites) |
| node scripts/sync-design-tokens.mjs --check | 0 | |
| node scripts/check-token-adherence.mjs | 0 | |
| npx expo-doctor | 0 | 20/20 |
| npx expo run:ios --port 8082 (dev-client, iPhone 18 Pro) | 0 | after three fixes: stale gitignored `ios/.xcode.env.local` NODE_BINARY; `pod install` for the new local module; Swift `Exception` is a class |
| simulator smoke | 0 | Home, Library (position edit saved a note; technique detail with resources), Progress (rows, heatmap, planned vs trained, why sheet), Profile, About (backup: excluded). Defect found and fixed: ProgressScreen `data!.params` hoisted by React Compiler crashed on first render. set-rank kids-scale detent not checked |
| xattr on app container | 0 | `Documents/SQLite`, `matiq.db`, `-wal`, `-shm` all carry `com.apple.metadata:com_apple_backup_excludeItem` |

### tester @ 9ee80da — 2026-11-01 (Maestro run, iPhone 18 Pro, iOS 27.2, Metro 8082)
| Command | Exit | Notes |
|---|---|---|
| maestro test -e METRO_URL=http://localhost:8082 e2e/maestro (first whole-workspace run, unfixed flows) | 1 | 5/13 passed |
| same command, second whole-workspace run after flow fixes | 1 | 10/13 passed; settings-weights and progress-states failed in the seed subflow (scroll flake), settings-rank-theme on `rank.save` |
| maestro test …/features/settings-weights.yaml (after seed-subflow reorder) | 0 | 1/1 passed |
| maestro test …/features/progress-states.yaml | 1 | 0/1: `why.close` unreachable, sheet header overlapped by content (app defect A-1) |
| maestro test …/features/settings-rank-theme.yaml | 1 | 0/1: `rank.save` absent from the hierarchy on the KIDS scale (app defect A-2) |
| Final state | — | 11/13 flows pass; 2 blocked by app defects A-1, A-2 |

### frontend-coder @ 0e8d4db — 2026-11-01 (defect round 1: A-1, A-2)
| Command | Exit | Notes |
|---|---|---|
| npx tsc --noEmit | 0 | |
| TZ=UTC npx jest --watchAll=false | 0 | Tests: 1726 passed, 0 failed (41 suites) |
| TZ=Europe/Amsterdam npx jest --watchAll=false | 0 | Tests: 1726 passed, 0 failed (41 suites) |
| node scripts/check-token-adherence.mjs | 0 | |
| simulator check (Metro 8082, JS only) | 0 | why sheet: header clear above body, Close dismisses; set-rank on Kids: Save rank pinned, belts scroll, Cancel dismisses |

### tester @ e2ed248 — 2026-11-01 (Maestro re-run, iPhone 18 Pro, iOS 27.2, Metro 8082)
| Command | Exit | Notes |
|---|---|---|
| maestro test -e METRO_URL=http://localhost:8082 e2e/maestro/flows/features/progress-states.yaml | 0 | 1/1 passed (single-flow) |
| maestro test -e METRO_URL=http://localhost:8082 e2e/maestro/flows/features/settings-rank-theme.yaml | 0 | 1/1 passed (single-flow) |
| maestro test -e METRO_URL=http://localhost:8082 e2e/maestro/flows/features/settings-weights.yaml | 0 | 1/1 passed (single-flow, after the seed-subflow change) |
| Final | — | 13/13: 10 from the whole-workspace run, 3 single-flow; whole suite not re-run |
