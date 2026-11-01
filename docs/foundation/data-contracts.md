# foundation — data contracts

data-coder · 2026-11-01 · branch `feature/foundation` · final at `83e6f12` (v1 `c7f88df`). The contract the frontend integrates against (plan §4 made concrete). **Import surface:** `mobile/src/repositories` (`index.ts`) — repository namespaces, every type below, the hooks, `DomainError`/`ERROR_CODES`, `bootstrapDatabase`, `resetDatabase`. The UI never imports `drizzle-orm`, `expo-sqlite` or `mobile/src/db/schema`.

## Conventions (all functions)

- Every repository function is `async` (returns a `Promise`) and takes `database: Db = getDb()` as its **last** parameter; the UI omits it. `getDb()` throws `DomainError('DB_NOT_OPEN')` before `bootstrapDatabase()` succeeded.
- One transaction per write call (`db.transaction`, sync driver; never `withExclusiveTransactionAsync`).
- Every read filters `deleted_at IS NULL`; "delete" sets `deleted_at` (no hard delete). Exceptions: focus names in session detail resolve soft-deleted positions/subjects too (`removed: true`), and `undoDelete`.
- Failures are `DomainError` (`error.code` ∈ `ERROR_CODES`, `mobile/src/domain/errors.ts`); the UI shows `errors.<CODE>`. Anything else surfaces as `UNKNOWN` through the hooks.
- Optional contract fields are **absent**, never `undefined`/`null` (rows are compacted).
- Timestamps ISO-8601 UTC; `localDate` / `awardedOn` `YYYY-MM-DD`.
- **Live hooks** return `LiveResult<T> = HookResult<T> & { reload(): void }` where `HookResult<T> = { data?: T; error?: DomainError }`; `data === undefined && !error` = loading. They re-read on any change to the tables they read (expo-sqlite change events, bursts coalesced). `reload()` re-runs the read (error "Try again").
- New codes vs plan §4 (need `errors.<CODE>` copy): `SESSION_START_INVALID` (malformed `startsAt` or unknown `timeZone`), `ROUND_NO_INVALID` (round number < 1; sprint 3 UI), `DB_NOT_OPEN` (a repository called before bootstrap — a bug, not a user path).

## Types (`mobile/src/repositories/contracts.ts`)

Exactly plan §4 "Shapes", plus:

| type | definition | note |
|---|---|---|
| `Rating` | `1 \| 2 \| 3 \| 4 \| 5` | `FocusInput.rating`, `LogSessionInput.rating/intensity/energy` |
| `AdultBelt` / `KidsBelt` / `Belt` | §3.1 lists; `Belt` = union | |
| `Aggregates` | `{ roundsCount?; submissionsLanded?; submissionsTaken? }` | `LogSessionInput.aggregates` |
| `QuickLogTarget` | `{ sessionId } \| { sessionTypeId; focuses: [] }` | |
| `SettingKey` | the 14 keys of `domain/settings/defaults.ts` | |
| **`SettingValue<K>`** (R2-02) | the value type `defaults.ts` gives key `K`: `valueType` BOOL → `boolean`, INT → `number`, STRING → `string` | e.g. `SettingValue<'library.showExtended'>` = `boolean`, `SettingValue<'suggest.max'>` = `number` |
| `Setting<K>` | `{ key: K; value: SettingValue<K>; valueType: 'BOOL'\|'INT'\|'STRING'\|'JSON' }` | |
| `AlgorithmParamRow` | `{ id; algorithmVersion; key; value; defaultValue; min; max }` | |
| `ImportReport` | `{ release; added; updated; skippedUserEdited; skippedDeleted; retired }` | |
| `EnsureSeededResult` | `{ taxonomy: ImportReport \| 'current'; catalog: 'seeded' \| 'current'; settings: number; params: number }` | counts = rows inserted this run |
| `LiveResult<T>` | `HookResult<T> & { reload(): void }` | every hook |
| `DatabaseBootstrapState` | `{ status: 'loading' \| 'ready'; retry() } \| { status: 'error'; code: BootstrapErrorCode; retry() }` | `useDatabaseBootstrap()` |

`SessionDetail.submissions` holds **session-level** submissions only (no `roundId`); per-round ones are in `rounds[].submissions`. `FocusRow.name` is the referenced row's *current* name; `removed: true` when it is soft-deleted (render "(removed)").

## sessions (`mobile/src/repositories/sessions.ts`)

### sessions.create(input)
**Module:** `sessions.ts` · **Live query:** no · **Transaction:** yes — plan mode (status PLANNED)
| Field | Type | Required | Notes |
|---|---|---|---|
| sessionId | string (UUID) | no | set = edit that session; must be live and PLANNED |
| sessionTypeId | string (UUID) | yes | live session type |
| startsAt | string (ISO UTC) | yes | |
| timeZone | string (IANA) | yes | fixes `localDate` (ADR 0016) |
| focuses | `FocusRef[]` | yes | ≥ 1, distinct `{kind, refId}`; each a live position/subject (refs already on the edited session may be removed ones) |
**Returns:** `SessionDetail` (status `PLANNED`; focus rows `isPlanned: true, isActual: false`; on edit, focuses no longer listed are soft-deleted)
**Errors:** `SESSION_TYPE_REQUIRED` · `SESSION_START_INVALID` · `FOCUS_REQUIRED` · `FOCUS_KIND_INVALID` · `FOCUS_DUPLICATE` · `SESSION_TYPE_NOT_FOUND` · `FOCUS_REF_NOT_FOUND` · `SESSION_NOT_FOUND` · `SESSION_NOT_PLANNED`
**Invariants:** `localDate = localDateOf(startsAt, timeZone)`

### sessions.log(input)
**Module:** `sessions.ts` · **Live query:** no · **Transaction:** yes — log / edit (review) mode, create-or-complete
| Field | Type | Required | Notes |
|---|---|---|---|
| sessionId | string (UUID) | no | absent = new COMPLETED session; PLANNED/SKIPPED = completes it (`completedAt = now`); COMPLETED = review edit |
| sessionTypeId | string (UUID) | yes | live; may differ from the plan |
| startsAt · timeZone | string · string | yes | `localDate` recomputed |
| durationMinutes | integer > 0 | no | |
| rating · intensity · energy | `Rating` | no | |
| contextNote · whatWorked · whatFailed | string | no | blank → stored null |
| focuses | `FocusInput[]` | yes | ≥ 1 with `isActual: true`; distinct; `needsWork`, `rating`, `hitCount`, `caughtCount`, `techniqueIds` only on actual rows |
| aggregates | `Aggregates` | no | authoritative counts, each integer ≥ 0 |
| submissions | `SubmissionInput[]` | no | session-level replace-set; **undefined = keep stored rows, `[]` = clear** |
| rounds | `RoundInput[]` | no | replace-set (sprint 3 UI); same undefined/`[]` rule |
**Returns:** `SessionDetail` with `status: 'COMPLETED'`
**Errors (checked in this order):** `SESSION_TYPE_REQUIRED` · `SESSION_START_INVALID` · `FOCUS_REQUIRED` · `FOCUS_KIND_INVALID` · `FOCUS_DUPLICATE` · `NEEDS_WORK_REQUIRES_ACTUAL` · `RATING_REQUIRES_ACTUAL` · `COUNTS_REQUIRE_ACTUAL` · `TECHNIQUE_REQUIRES_ACTUAL` · `RATING_OUT_OF_RANGE` · `COUNT_NEGATIVE` · `SESSION_NEEDS_ACTUAL_FOCUS` · `SCALE_OUT_OF_RANGE` · `DURATION_INVALID` · `ROUND_NO_INVALID` · `ROUND_NO_DUPLICATE` · `SUBMISSION_DIRECTION_INVALID` · then `SESSION_TYPE_NOT_FOUND` · `SESSION_NOT_FOUND` · `FOCUS_REF_NOT_FOUND` · `TECHNIQUE_NOT_FOUND` · `ROUND_NOT_IN_SESSION`
**Invariants:** NF-03 — type + one actual focus is a valid log. A planned row keeps `isPlanned: true`; one sent with `isActual: false` (or omitted) stays as planned-not-trained (F-20) with its rating/flag/counts/techniques cleared. Non-planned rows not sent are soft-deleted. Un-ticking a focus soft-deletes its technique attachments. `reviewedAt` is set on the first review edit that changes rating / whatWorked / whatFailed. Status never regresses.

### sessions.softDelete(sessionId) · sessions.undoDelete(sessionId)
**Module:** `sessions.ts` · **Live query:** no · **Transaction:** yes
| Field | Type | Required | Notes |
|---|---|---|---|
| sessionId | string (UUID) | yes | softDelete: live session; undoDelete: any existing session (live → returned unchanged) |
**Returns:** `SessionSummary`
**Errors:** `SESSION_NOT_FOUND`
**Invariants:** child rows are untouched; reads hide them with the session.

### sessions.skip(sessionId) · sessions.undoSkip(sessionId)
**Module:** `sessions.ts` · **Live query:** no · **Transaction:** yes
| Field | Type | Required | Notes |
|---|---|---|---|
| sessionId | string (UUID) | yes | skip: PLANNED → SKIPPED; undoSkip: SKIPPED → PLANNED |
**Returns:** `SessionSummary`
**Errors:** `SESSION_NOT_FOUND` · `SESSION_NOT_PLANNED` (skip on a non-PLANNED, undoSkip on a non-SKIPPED session)
**Invariants:** focus rows untouched (planned-not-trained for the sprint-2 gap signal).

### sessions.getDetail(sessionId) — hook `useSession(id): LiveResult<SessionDetail>`
**Module:** `sessions.ts` · **Live query:** hook yes · **Transaction:** no
**Returns:** `SessionDetail`; focuses by `sortOrder`, each with current `name`, `aliases`, `removed`, `techniques`; rounds by `roundNo`
**Errors:** `SESSION_NOT_FOUND`

### sessions.home({ today }) — hook `useHome(): LiveResult<HomeData>`
**Module:** `sessions.ts` · **Live query:** hook yes (sessions, focuses, techniques, types, taxonomy, settings, rank) · **Transaction:** no
| Field | Type | Required | Notes |
|---|---|---|---|
| today | string (`YYYY-MM-DD`) | yes | device-local date; the hook computes it from the clock and device zone |
**Returns:** `HomeData` — `stalePlanned` = PLANNED with `localDate < today` (oldest first) · `todayPlanned` = `localDate = today` · `nextPlanned` = earliest by `startsAt` with `localDate ≥ today` · `recent` = last 5 COMPLETED by `startsAt` desc · `lastCompleted` (detail) · `lastUsedTypeId` = its type · `suggestions` (below) · `rank` = current rank
**Errors:** none
**Invariants:** R1-04 — a PLANNED session at 23:30 yesterday is stale at 00:30 today. `SessionSummary.focusNames` = actual focuses for COMPLETED, planned ones otherwise.

### sessions.quickLogTarget(home, sessionTypes?) — sync, pure (domain `session/quickLog.ts`)
| Field | Type | Required | Notes |
|---|---|---|---|
| home | `HomeData` | yes | uses `todayPlanned`, `lastUsedTypeId` |
| sessionTypes | `SessionTypeRow[]` | no | fallback: first by `sortOrder` when there is no last-used type |
**Returns:** `{ sessionId }` when exactly one PLANNED today; else `{ sessionTypeId, focuses: [] }`
**Errors:** `SESSION_TYPE_REQUIRED` (no last-used type and no types given)

## sessionTypes · rank · settings · algorithmParams

### sessionTypes.list() — hook `useSessionTypes(): LiveResult<SessionTypeRow[]>`
**Returns:** live types by `sortOrder`, then name. **Errors:** none.

### rank.add(input) · rank.current() · rank.history() — hook `useCurrentRank(): LiveResult<RankEntry | null>`
**Module:** `rank.ts` · **Transaction:** add yes
| Field | Type | Required | Notes |
|---|---|---|---|
| scale | `'ADULT' \| 'KIDS'` | yes | sprint 1 UI: ADULT |
| belt | `Belt` | yes | must belong to the scale |
| stripes | integer | yes | 0–4; 0–6 on BLACK |
| awardedOn | `YYYY-MM-DD` | yes | real date, not after today (device zone) |
| note | string | no | |
**Returns:** add → `RankEntry`; current → `RankEntry \| undefined` (latest by `awardedOn`, then creation); history → `RankEntry[]` newest first. Hook: `data === null` = no rank yet.
**Errors:** `RANK_BELT_INVALID_FOR_SCALE` · `RANK_STRIPES_INVALID` · `RANK_DATE_INVALID`

### settings.get(key) · settings.set(key, value) · settings.all() — hook `useSetting<K>(key): LiveResult<SettingValue<K>>`
**Module:** `settings.ts` · **Transaction:** set yes
| Field | Type | Required | Notes |
|---|---|---|---|
| key | `SettingKey` | yes | the 14 keys of `defaults.ts` |
| value | `SettingValue<K>` | set only | type-checked against the key |
**Returns:** `Setting<K>`; `all()` → `Setting[]` in `defaults.ts` order. A missing or corrupt row reads as the shipped default.
**Errors:** `SETTING_UNKNOWN` · `SETTING_TYPE_MISMATCH`

### algorithmParams.list(version)
**Returns:** `AlgorithmParamRow[]` of that version by key (sprint 2 UI). **Errors:** none.

## taxonomy (`mobile/src/repositories/taxonomy.ts`)

### taxonomy.searchFocuses({ query, showExtended, limit = 30 }) — hook `useFocusSearch(query): LiveResult<FocusPickerRow[]>`
**Live query:** hook yes; the hook reads `library.showExtended` itself
**Returns:** positions (CORE only unless `showExtended`) and subjects whose name or a live alias contains `query` (case/diacritic-insensitive); order: name prefix/word-start > alias prefix > name substring > alias substring, then CORE > EXTENDED, then name; `matchedAlias` set on an alias hit; empty query = all, tier/name order. Subjects carry no `tier`. **Errors:** none.

### taxonomy.listPositions({ showExtended, query? }) — hook `useLibraryPositions(query?): LiveResult<PositionRow[]>`
**Returns:** live positions, CORE first, then name; `matchedAlias` when `query` hit an alias. **Errors:** none.

### taxonomy.getPosition(id) — hook `usePosition(id): LiveResult<PositionDetail>`
**Returns:** `PositionDetail` (parent if live, live children, aliases, description, notes, tier, `techniquesFrom` / `techniquesTo` ordered by type then name). Children and techniques honour `library.showExtended` (read by the repository). **Errors:** `TAXONOMY_ROW_NOT_FOUND`.

### taxonomy.listSubjects() — hook `useSubjects(): LiveResult<SubjectRow[]>`
**Returns:** live subjects by name. **Errors:** none.

### taxonomy.listTechniques({ query, showExtended, type?, limit = 30 }) — hook `useTechniqueSearch(query, { type? }): LiveResult<TechniqueRow[]>`
**Returns:** techniques (from a live position) matching name or alias, ranked as `searchFocuses`; `type` filters in SQL (D-A22: submission chips pass `type: 'SUBMISSION'`); `toPositionId`/`toName` absent for SUBMISSION. The hook reads `library.showExtended` itself. **Errors:** none.

### taxonomy.importRelease(seed, { now })
**Transaction:** yes · **Returns:** `ImportReport` · **Errors:** `SEED_FORMAT_UNSUPPORTED` · `SEED_RELEASE_OLDER`
**Invariants:** upserts by `(source, source_id)` only rows with `origin = 'seed'`, `user_edited_at IS NULL`, `deleted_at IS NULL`; never deletes (retired rows are soft-deleted only when untouched); a new seed slug that clashes with a live row gets `-gm`; writes `app_meta.taxonomy_release`.

## seed · rounds · submissions · db lifecycle

### seed.ensureSeeded(db, { now }) (also exported as `ensureSeeded`)
**Transaction:** yes (one) · **Returns:** `EnsureSeededResult` · **Errors:** `SEED_FORMAT_UNSUPPORTED` · `SEED_RELEASE_OLDER`
**Invariants:** catalog when `catalog_release` differs; taxonomy when `taxonomy_release` differs; missing settings rows from `defaults.ts`; missing `algorithm_params` v1 rows. A second run writes nothing. Called by bootstrap only.

### rounds.upsert(sessionId, rows) · submissions.upsert(sessionId, rows) · rounds.deriveAggregates(rounds, sessionSubmissions?)
**Transaction:** yes (upserts) · replace-set semantics as in `sessions.log`; `deriveAggregates` is pure → `{ roundsCount, submissionsLanded, submissionsTaken }` (offered, never applied silently)
**Errors:** `SESSION_NOT_FOUND` · `ROUND_NO_INVALID` · `ROUND_NO_DUPLICATE` · `ROUND_NOT_IN_SESSION` · `TECHNIQUE_NOT_FOUND` · `SUBMISSION_DIRECTION_INVALID`

### bootstrapDatabase(overrides?) — hook `useDatabaseBootstrap(): DatabaseBootstrapState`
**Module:** `mobile/src/db/bootstrap.ts`
**Returns:** `{ ok: true; db } | { ok: false; code }`; the hook maps it to `status` and runs once on mount; `retry()` re-runs.
**Codes:** `DB_KEY_UNAVAILABLE` (secure store threw — retry) · `DB_KEY_MISSING_FOR_EXISTING_DB` (file exists, no key: unreadable) · `DB_KEY_REJECTED` (wrong key / plaintext file) · `DB_MIGRATION_FAILED` · `DB_SEED_FAILED`
**Invariants:** key → open (`PRAGMA key` first) → migrate → seed → `setDb`. Never opens unencrypted, never recreates a database whose key is missing.

### resetDatabase({ keepKey })
**Module:** `mobile/src/db/lifecycle.ts` · dev route `/dev/reset` only (`keepKey: true`)
**Returns:** the re-bootstrapped `Db` · **Errors:** `DB_RESET_FAILED`
**Invariants:** closes, deletes `matiq.db`, `-wal`, `-shm`, optionally deletes the key, bootstraps again (fresh migrate + seed). R-12 exception (plan §13).

## Jest mocking guide (frontend)
`jest.mock('<rel>/src/repositories', () => ({ ...jest.requireActual('<rel>/src/repositories/contracts'), useHome: jest.fn(), sessions: { log: jest.fn(), … } }))`. `contracts.ts` imports only types, so requiring it is free of native modules.

## Shipped seed (what the UI will see after first launch)

Generated by `node scripts/taxonomy/convert.ts` into `mobile/src/db/seed/` (counts from `report.json`):

| row set | total | default (CORE) | notes |
|---|---|---|---|
| positions | 602 | 45 | 601 GrappleMap + 1 curated parent ("Guard"); 463 carry a parent (core parents by curation, EXTENDED ones by tag family) |
| techniques | 1294 | 163 | 154 curated GrappleMap edges (curated name, type and core endpoints) + 9 gi techniques (`appliesTo: 'GI'`); 36 reverse edges; SUBMISSION has no target |
| aliases | 91 | — | 69 curated, 22 grapple-flows (CC BY 4.0) |
| resources / links | 756 / 1018 | — | GrappleMap `ref:` citations, type Instructional, linked to the citing techniques |
| catalog | 6 session types · 6 subjects · 5 resource types | — | R-03, A-4 |

With `library.showExtended` off (default) pickers, Library and position detail show CORE rows only; EXTENDED technique names are GrappleMap's own (often terse, e.g. "Escape") and only appear once the setting exists (sprint 2).

## Changes since v1 (`c7f88df`)

- Search ranking: name prefix > name word-start > alias prefix/word-start > name substring > alias substring (then CORE > EXTENDED, then name).
- `taxonomy.getPosition` reads `library.showExtended` itself for children and techniques.
- Seed files are real (placeholders replaced).

