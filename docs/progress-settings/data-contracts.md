# progress-settings — data contracts

data-coder · 2026-11-01 · branch `feature/progress-settings` · code at `f91bb89` (seam + types first at `43e9b80`, review-1-recheck N11). The contract frontend-coder phase B integrates against: plan §5 made concrete. **No schema change, no migration (PS-01).**

**Import surface:** `mobile/src/repositories` (`index.ts`). It exports the repository namespaces (`about`, `algorithmParams`, `progression`, `rank`, `resources`, `resourceTypes`, `sessions`, `settings`, `taxonomy`, …), every type below, the hooks, `DomainError`/`ERROR_CODES`, `bootstrapDatabase`, `setBootstrapOverrides`, `resetDatabase`, `SETTING_VOCABULARIES`, `SETTING_INT_RANGES` and `ThemeOverride`. The UI never imports `drizzle-orm`, `expo-sqlite`, `mobile/src/db/**` or `mobile/src/domain/**` directly. `src/hooks/data` (frontend) stays the single importer.

## Conventions (unchanged from `docs/foundation/data-contracts.md`)

- Every repository function is `async` and takes `database: Db = getDb()` as its **last** parameter. The UI omits it.
- Each write call is one transaction. Reads filter `deleted_at IS NULL`. A "delete" sets `deleted_at`; nothing is ever hard-deleted.
- Failures are `DomainError` with `code ∈ ERROR_CODES`. The UI shows `errors.<CODE>`, and `details` carries structured context such as `min`/`max`.
- Optional fields are **absent**, never `undefined` or `null`.
- Hooks return `LiveResult<T>` (`data`, `error`, `reload()`). Each one re-reads when a table it lists changes.
- The clock and ids come from `runtime()` (Jest installs deterministic ones). `today` is the device-local `YYYY-MM-DD` from `useLocalDate()`. `nowIso` is ISO-8601 UTC.
- **Test column:** paths are relative to `mobile/src/`. `describe › it` names are abbreviated.

## New error codes (`mobile/src/domain/errors.ts`; each needs `errors.<CODE>` copy)

All plan §0 codes: `PARAM_UNKNOWN` · `PARAM_OUT_OF_RANGE` (`details: { key, min, max }`) · `PARAM_NOT_INTEGER` (`details: { key }`) · `SETTING_VALUE_INVALID` (`details: { key }`, plus `min`/`max` for `suggest.max`) · `TAXONOMY_NAME_REQUIRED` · `TAXONOMY_NAME_DUPLICATE` · `TAXONOMY_ROW_DELETED` · `TAXONOMY_SELF_MERGE` · `TAXONOMY_MERGE_KIND_MISMATCH` · `POSITION_PARENT_CYCLE` · `TECHNIQUE_TARGET_REQUIRED` · `TECHNIQUE_SUBMISSION_HAS_TARGET` · `ALIAS_NAME_REQUIRED` · `ALIAS_DUPLICATE` · `ALIAS_NOT_FOUND` · `MERGE_NOT_FOUND` · `MERGE_ALREADY_UNDONE` · `MERGE_NOT_LATEST` · `RESOURCE_NOT_FOUND` · `RESOURCE_TITLE_REQUIRED` · `RESOURCE_URL_INVALID` · `RESOURCE_TYPE_NOT_FOUND` · `RESOURCE_LINK_TARGET_NOT_FOUND` · `RANK_NOT_FOUND`. No code beyond plan §0 was added.

## Types (`contracts.ts`; progression shapes defined in `domain/progression/types.ts` and re-exported)

Exactly plan §5.1, with these additions:

| type | definition / note |
|---|---|
| `SignalRow` | One row per `SignalId`, **always in the order** `n, trend, needsWorkRate, gap, daysSince, hitRatio`. `n` always carries `value` (0 included) and is `available` iff n ≥ 1. `weight` appears on the four scored signals only when they are available and rule 1 did not fire. If their weights sum to 0, every weight is 0. `threshold` is set on `n` (minSessions), `trend` (trendImproving) and `daysSince` (staleDays) only |
| `ProgressResult.score` | Present whenever rule 1 did not fire (T5: STEADY with score 0) |
| `ProgressResult.signals[].contributed` | rule 1: `n` when n = 0, and `daysSince` when it is available and above staleDays · rule 2: every available scored signal with weight > 0 · rule 3: `trend` and `n` · rule 4: none |
| `ProgressOverview.results` | Sorted per PS-04: live focuses first, then removed ones (the UI's "Removed" group). Within each group: NEEDS_WORK → NOT_TRAINED → STEADY → IMPROVING, then name |
| `TechniqueDetail.removed: boolean` | **Additive** (not in plan §5.1): the technique itself is soft-deleted. `getTechnique` opens it from history |
| `TechniqueHistoryRow` | `{ sessionId; localDate; sessionTypeName; via: 'ATTACHED' \| 'SUBMISSION' }` (named alias of the plan's inline type) |
| `ResourceStatus` | `'TO_WATCH' \| 'WATCHED'` (named alias) |
| `AttributionData` | `typeof attribution.json` |
| `AboutMeta` | `Omit<AboutData, 'appVersion'>`: what `about.get()` returns. `useAbout()` adds `appVersion` from expo-constants (plan §5.7) |
| `BackupExclusion`, `BackupExclusionResult`, `BackupExclusionStatus`, `BootstrapDeps` | Seam types from `db/backup.ts` and `db/bootstrap.ts` |
| `PositionDetail.aliasRows: AliasRow[]` | Added beside `aliases: string[]` (N9). Both list live aliases sorted by name |

---

## Backup seam (§9.1; first commit `43e9b80`)

### setBootstrapOverrides(overrides)
**Module:** `db/bootstrap.ts` (re-exported) · **Live:** no · **Tx:** no · **Sync, returns `void`**
| Field | Type | Required | Notes |
|---|---|---|---|
| overrides | `Partial<BootstrapDeps>` | yes | The frontend passes `{ backupExclusion: backupExclusionAdapter }` once at module scope in `_layout.tsx`, before the first `useDatabaseBootstrap()`. A new call replaces the previous overrides; `{}` clears them |

**Effect:** every later `bootstrapDatabase()` merges native defaults ← these overrides ← its own `overrides` argument. That includes the bootstrap inside `resetDatabase()`.
**Tests:** `db/__tests__/bootstrapDatabase.test.ts` › backup exclusion seam › "setBootstrapOverrides reaches bootstrapDatabase…" and "…reaches the bootstrap inside resetDatabase".

### BackupExclusion (interface the native adapter implements)
`exclude(uris: string[]): Promise<{ status: BackupExclusionStatus; failed: string[] }>`. It should never throw; if it does, bootstrap records `failed` for every URI.
- **Called** on every bootstrap and every reset, after migrate + seed and before `setDb`.
- **URIs, in order:** expo-sqlite's database directory (`file://…/SQLite`), then each of `matiq.db`, `-wal`, `-shm` that exists (`nativeDeps.backupTargetUris`).
- **Default:** `notApplicableBackupExclusion` (Android, Jest).
- **Outcome:** written to `app_meta.backup_exclusion` (`excluded` · `failed` · `not_applicable`) and `app_meta.backup_exclusion_checked_at` (ISO date). On `failed`, it logs `console.warn` with the failing URIs. It never fails bootstrap.
- **No imports:** `src/db` imports nothing from `mobile/modules/**` (S6).

**Tests:** `db/__tests__/bootstrapDatabase.test.ts` › backup exclusion seam: default `not_applicable` and target order · app_meta default · directory first, then the three files · failed or throwing adapter still `ok: true`, recorded and warned · S6 import check.

---

## progression (`repositories/progression.ts`; domain `domain/progression/`)

### progression.overview({ today, nowIso })
**Module:** `progression.ts` · **Live:** `useProgress()` · **Tx:** no (one read)
| Field | Type | Required | Notes |
|---|---|---|---|
| today | string `YYYY-MM-DD` | yes | Device-local date. The hook passes `useLocalDate()` |
| nowIso | string ISO UTC | yes | Feeds the §6.3 `gap` 24 h rule. The hook passes `runtime().now()` at read time |

**Returns:** `ProgressOverview`:
- `params` = the live `algorithm_params` rows of `settings.algorithm.version`.
- `windowStart` = `today − (windowWeeks×7 − 1)`.
- `results` = sorted states (above). A removed focus is dropped unless it has a live row inside the window.
- `consistency` and `plannedVsActual` come from the same load.

**Errors:** `PARAM_UNKNOWN` (a v1 key row missing; seeded data always has all 10).
**Hook tables:** sessions, session_focuses, algorithm_params, settings, positions, subjects. It re-reads on date rollover.
**Tests:** `repositories/__tests__/progression.test.ts` › progression.overview (empty db · PS-04 order + both panels + gap equality · T14 removed · params edit flips state, windowWeeks re-cuts panels · soft-deleted focus rows · **NF-09 end to end**). Hook: `repositories/hooks/__tests__/sprint2Hooks.test.tsx` › "useProgress re-reads on algorithm_params changes".

### progression.inputs({ today }) → `FocusHistory[]`
**Live:** no. One history per focus ref that has a live `session_focuses` row in a live session (any status, all time). `name`/`removed` come from the taxonomy row; soft-deleted rows are included. Refs whose row is missing entirely are skipped. `today` is accepted for plan symmetry and is not used (the domain cuts the window). **Errors:** none. **Tests:** `progression.test.ts` › progression.inputs / sessionDays › "one FocusHistory per ref…".

### progression.sessionDays({ today }) → `SessionDayRow[]`
**Live:** no. Every live session with `localDate ≤ today`, any status. `durationMinutes` is absent when null. **Errors:** none. **Tests:** `progression.test.ts` › "sessionDays: live sessions dated ≤ today, any status".

### computeProgression(histories, params, { today, nowIso }) (domain, exported)
Pure, unsorted, one `ProgressResult` per history (§6.1–§6.4). **Errors:** `PARAM_UNKNOWN` (`details.key`) when a v1 key is missing; no default is substituted.
**Tests:** `domain/progression/__tests__/compute.test.ts`:
- vectors T1–T16;
- all-weights-zero;
- flagged follows the last completed actual row (all time);
- n = 0 with staleDays ≥ window;
- determinism with an injected clock;
- **NF-09** (500 sessions × 3 focuses).

PS-04 sort: › sortProgressResults.

### aggregateConsistency(rows, { today, windowWeeks }) (domain, exported)
→ `ConsistencyData` (§6.6). Monday weeks from the Monday on or before `windowStart` to the Sunday on or after `today`. `weeks[i].days[j]` = `gridStart + 7i + j`. Totals count in-window cells only. The streak counts the current week only once it has a session. Rows after `today` are ignored. **Tests:** `domain/progression/__tests__/panels.test.ts` › aggregateConsistency H1–H7 + future rows.

### aggregatePlannedVsActual(histories, { today, windowWeeks, nowIso }) (domain, exported)
→ `PlannedVsActualData` (§6.7):
- Rows are focuses with planned ≥ 1 or unplannedTrained ≥ 1.
- Order: notTrained desc, gap desc, name; removed last.
- `totals` are the column sums.
- `gap` equals the `gap` signal by construction (shared `classifyPlanned`).

**Tests:** `panels.test.ts` › aggregatePlannedVsActual G1–G6, ordering/totals, **PS-22 equality over every §6.5 vector**.

### sessions.home({ today, now? }) (behaviour change, PS-06)
`HomeData.suggestions` comes from `forPlanning` with the algorithm states, in source order:
1. LAST_NEEDS_WORK
2. CYCLE (no input until sprint 3)
3. NEEDS_WORK, by score desc
4. NOT_TRAINED, by daysSince desc, only focuses with `lastTrainedOn`

Suggestions are deduplicated by ref, exclude removed focuses, respect each `suggest.*` switch, and are capped at `suggest.max`. `now` defaults to the runtime clock. The `HomeData.rank` card now follows `rank.scale`. **Hook:** `useHome()` also watches `algorithm_params`. **Tests:** `progression.test.ts` › sessions.home suggestions from the algorithm (2 cases); `domain/__tests__/sprint2Domain.test.ts` › forPlanning with algorithm states; `sprint2Hooks.test.tsx` › "useHome subscribes to algorithm_params".

---

## Params and settings

### algorithmParams.list(version) → `AlgorithmParamRow[]` (unchanged)
By key. **Hook:** `useAlgorithmParams()` reads `algorithm.version`, then lists. It watches algorithm_params and settings. **Tests:** `repositories/__tests__/settingsRank.test.ts` › sessionTypes / algorithmParams; hook › "useAlgorithmParams lists the active version…".

### algorithmParams.set({ version, key, value })
**Live:** no · **Tx:** yes
| Field | Type | Required | Notes |
|---|---|---|---|
| version | string | yes | Usually `'v1'` (from `useAlgorithmParams()[0].algorithmVersion`) |
| key | string | yes | A live row of that version |
| value | number | yes | Must lie within the **stored row's** `min`/`max`, inclusive. Integer keys: windowWeeks, staleDays, minSessions, hitCaughtMinEvents |

**Returns:** the updated `AlgorithmParamRow`.
**Errors:**
- `PARAM_UNKNOWN`: no live row for (version, key).
- `PARAM_NOT_INTEGER`
- `PARAM_OUT_OF_RANGE`: `details: { key, min, max }`; also raised for NaN.

**Tests:** `settingsRank.test.ts` › algorithmParams.set / resetAll (2 cases); `sprint2Domain.test.ts` › validateParamValue.

### algorithmParams.resetAll(version) → `AlgorithmParamRow[]`
**Tx:** yes. Sets `value = default_value` on every live row of `version` and returns them by key. An unknown version returns `[]`. The Undo toast snapshot (restoring previous values) is the frontend's job: call `set` per key. **Tests:** `settingsRank.test.ts` › "resetAll restores default_value…".

### settings.set(key, value) (extended)
On top of the existing `SETTING_UNKNOWN` and `SETTING_TYPE_MISMATCH`, it raises `SETTING_VALUE_INVALID` for:
- `theme.override` ∉ {SYSTEM, LIGHT, DARK}
- `rank.scale` ∉ {ADULT, KIDS}
- `algorithm.version` ∉ {v1}
- `suggest.max` ∉ 0–10

`SETTING_VOCABULARIES` and `SETTING_INT_RANGES` are exported for pickers. **Hook:** `useSetting(key)` (unchanged). **Tests:** `settingsRank.test.ts` › settings vocabularies (12 cases); `sprint2Domain.test.ts` › settings vocabularies.

---

## Rank (PS-11)

| function | input | returns | errors | live | tests (`settingsRank.test.ts` › rank scale filter…) |
|---|---|---|---|---|---|
| `rank.add(input)` | `RankInput` (the UI passes the active scale) | `RankEntry` | `RANK_BELT_INVALID_FOR_SCALE` · `RANK_STRIPES_INVALID` · `RANK_DATE_INVALID` | — | existing `rank` suite |
| `rank.update(id, input)` | `RankInput` | `RankEntry` | `RANK_NOT_FOUND` (unknown or deleted) + the three above | — | "update re-validates…" |
| `rank.softDelete(id)` | | `RankEntry` | `RANK_NOT_FOUND` (unknown or already deleted) | — | "softDelete hides…" |
| `rank.undoDelete(id)` | | `RankEntry` (a live entry is returned unchanged) | `RANK_NOT_FOUND` | — | "softDelete hides…" |
| `rank.current({ scale? } = {})` | `scale` defaults to the `rank.scale` setting | `RankEntry \| undefined` | — | `useCurrentRank()` (watches rank_entries and settings; `null` = none) | "current/history follow rank.scale…"; hook › "useRankHistory and useCurrentRank follow rank.scale" |
| `rank.history({ scale? } = {})` | as above | `RankEntry[]` newest first | — | `useRankHistory()` (watches rank_entries and settings) | same |

**Signature change:** the first parameter of `current`/`history` is now `{ scale? }` (it was `database`). The UI never passed `database`.

---

## Taxonomy editing (`taxonomy.*`; implementation `taxonomyEdit.ts`, `taxonomyMerge.ts`)

All writes are one transaction.

**Name rules (PS-24):**
- **Positions:** a live position's canonical name, or a live POSITION alias of another position, equal case-insensitively → `TAXONOMY_NAME_DUPLICATE`.
- **Subjects:** another live subject's name.
- **Techniques:** only an exact live duplicate edge (lower(name), from, to, type).
- A check runs only when the compared fields change. Names of soft-deleted rows are free.

**Rows:**
- **Created rows:** `origin = 'user'`, `tier = 'CORE'`, slug minted from the name (`-2`, `-3`, … on a clash with live or deleted rows; `position`/`technique` when the name has no ASCII letters).
- **Seed rows:** an edit of an imported field sets `user_edited_at` (position: name, description, parent · technique: name, type, from, to, appliesTo, perspective, description · subject: name, description). `notes` never does.

| function | input | returns | errors | tests (`repositories/__tests__/taxonomyEdit.test.ts`) |
|---|---|---|---|---|
| `createPosition(input)` | `PositionInput` (`parentId` optional, must be live) | `PositionRow` | `TAXONOMY_NAME_REQUIRED` · `TAXONOMY_NAME_DUPLICATE` · `TAXONOMY_ROW_NOT_FOUND` (parent) | › createPosition / updatePosition (2 cases) |
| `updatePosition(id, patch)` | `Partial<PositionInput>`; `parentId: null` clears it; `keepOldNameAsAlias` defaults to true | `PositionRow` | as create + `TAXONOMY_ROW_DELETED` · `POSITION_PARENT_CYCLE` (self or descendant, 50-level walk) | › rename keeps alias · rename to own alias · PS-24 duplicates + notes-only edit of a duplicate pair · parent rules · deleted/unknown row |
| `createTechnique(input)` | `TechniqueInput` | `TechniqueRow` | `TAXONOMY_NAME_REQUIRED` · `TECHNIQUE_TARGET_REQUIRED` · `TECHNIQUE_SUBMISSION_HAS_TARGET` · `TAXONOMY_ROW_NOT_FOUND` (endpoint missing or deleted) · `TAXONOMY_NAME_DUPLICATE` (exact edge) | › createTechnique / updateTechnique (2 cases) |
| `updateTechnique(id, patch)` | `Partial<TechniqueInput>`; switching to SUBMISSION needs `toPositionId: null` | `TechniqueRow` | as create + `TAXONOMY_ROW_DELETED` | › appliesTo-only edit of a duplicate-named seed row · edge duplicate on change, rename alias, shape re-check |
| `createSubject(input)` / `updateSubject(id, patch)` | `SubjectInput` / `Partial<SubjectInput>` | `SubjectRow` | `TAXONOMY_NAME_REQUIRED` · `TAXONOMY_NAME_DUPLICATE` · `TAXONOMY_ROW_DELETED` (update) | › subjects |
| `softDelete(kind, id)` | `TaxonomyKind`, id | the row in list shape (`PositionRow` · `TechniqueRow` · `SubjectRow`) | `TAXONOMY_ROW_NOT_FOUND` · `TAXONOMY_ROW_DELETED` (delete twice) | › soft delete and undo (2 cases) |
| `undoDelete(kind, id)` | | the row (a live row is returned unchanged) | `TAXONOMY_ROW_NOT_FOUND` · `TAXONOMY_NAME_DUPLICATE` (subject name taken meanwhile) | same + › subjects |
| `addAlias(kind, id, name)` | kind `POSITION \| TECHNIQUE` | `AliasRow` (`origin: 'user'`) | `ALIAS_NAME_REQUIRED` · `ALIAS_DUPLICATE` (equals the canonical name or a live alias of that row; other rows may share it) · `TAXONOMY_ROW_NOT_FOUND` (unknown or deleted target) | › aliases (2 cases) |
| `removeAlias(aliasId)` / `undoRemoveAlias(aliasId)` | | `AliasRow` | `ALIAS_NOT_FOUND` · `ALIAS_DUPLICATE` (undo while a live twin exists) | › aliases |
| `listAliases(kind, id)` | | `AliasRow[]` by name | — | › aliases |

**Soft delete never cascades (PS-13).** A technique whose `from` **or** `to` position is soft-deleted is hidden from `listTechniques`, `getPosition().techniquesFrom/To` and pickers until undo. This is a behaviour change: sprint 1 checked `from` only. Tests: `taxonomy.test.ts` › "hides techniques that are soft-deleted or have a removed endpoint…"; `taxonomyEdit.test.ts` › "never cascades…".

**Rename (plan §7.2, §12):** the old name becomes a user alias unless `keepOldNameAsAlias === false`, it differs only in case, or it already is a live alias. A live alias of the same row that equals the new name is soft-deleted (the name takes over). Pass `keepOldNameAsAlias` only when the name changes.

### taxonomy.merge(kind, fromId, intoId) → `MergeResult`
**Live:** no · **Tx:** yes · loser `fromId` → survivor `intoId`, same kind.

Re-points, per §7.3:
- **POSITION:** session_focuses, cycle_focuses, resource_links, aliases, techniques.from/to (live and deleted rows), children's parent. If the survivor's parent is the loser, the survivor takes the loser's parent. Self-loop edges are kept.
- **TECHNIQUE:** session_techniques, submissions, resource_links, aliases.
- **SUBJECT:** session_focuses, cycle_focuses, resource_links.

Folds a row when a live-unique index would collide:
- focus rows: OR booleans, the survivor's rating else the loser's, counts summed, comments joined with " / ";
- attachments: notes joined;
- links and aliases: the loser row is soft-deleted.

**B1:** when a focus row folds, its attachments move to the survivor focus row. Then the loser's name becomes a survivor alias (not for subjects), and the loser is soft-deleted with `user_edited_at` set.

`MergeResult = { mergeId, kind, fromId, intoId, moved: Record<table, count>, folded, aliasesAdded }`. The UI keeps `mergeId` for the toast Undo.

**Errors:**
- `TAXONOMY_SELF_MERGE`
- `TAXONOMY_ROW_NOT_FOUND`
- `TAXONOMY_ROW_DELETED`: either side is deleted.
- `TAXONOMY_MERGE_KIND_MISMATCH`: a SUBMISSION into a non-SUBMISSION technique, or the reverse.

**Tests:** `repositories/__tests__/taxonomyMerge.test.ts`:
- position move + alias;
- fold rules;
- **B1 attachment follows the survivor; undo restores it, rows equal**;
- B1 collision;
- survivor-parent swap + self-loop;
- full round trip incl. link folds;
- technique merge;
- subject merge;
- guards.

### taxonomy.undoMerge(mergeId) → `MergeResult`
**Tx:** yes. Restores everything from the payload:
- moved columns, in reverse order;
- folded survivors' prior values, and folded losers are un-deleted;
- added aliases are soft-deleted;
- the survivor's parent, and the loser.

It then sets `undone_at`. After undo every pre-merge row is equal again **except `updated_at`**, which advances because undo is a write (sync seam). Rows the merge created stay soft-deleted.
**Errors:**
- `MERGE_NOT_FOUND`
- `MERGE_ALREADY_UNDONE`
- `MERGE_NOT_LATEST`: a later, not-undone merge names either id; undo that one first.

**Tests:** `taxonomyMerge.test.ts` › merge / undo guards + every round-trip case above.

### taxonomy.getTechnique(id) → `TechniqueDetail`
**Live:** `useTechnique(id)` (watches techniques, positions, aliases, resources, resource_links, resource_types, session_techniques, submissions, sessions, session_types).
- **Opens** for live and soft-deleted techniques (`removed`).
- **Names:** `fromName`/`toName` are always the endpoint's current name, even when it is soft-deleted (`fromRemoved`/`toRemoved`). `toRemoved` is absent for submissions.
- **Aliases:** `aliases` and `aliasRows` list live aliases.
- **Resources:** `resources` = `resources.listFor({ kind: 'TECHNIQUE', id })`.
- **History:** one row per live session, at most 20, newest first. `via` is `ATTACHED` when the technique was attached, else `SUBMISSION`.

**Errors:** `TAXONOMY_ROW_NOT_FOUND`. **Tests:** `taxonomyEdit.test.ts` › taxonomy.getTechnique (3 cases); hook › "useTechnique, useResources and useResourceTypes re-read…".

### taxonomy.getPosition(id) (extended) / usePosition(id)
It gains `aliasRows`, and hides edges with a deleted endpoint. Otherwise unchanged. **Tests:** `taxonomyEdit.test.ts` › aliases; `taxonomy.test.ts` (existing).

---

## Resources (`repositories/resources.ts`)

URL rule: blank → no URL. Otherwise it must be an absolute `http(s)://host…` with no whitespace, or `RESOURCE_URL_INVALID`. This is a regex, not `new URL()`, because RN 0.88's `URL` does not validate (`docs/stack-notes.md`). The title is trimmed and required. Optional texts are trimmed; blank → absent.

| function | input | returns | errors | live | tests (`repositories/__tests__/resources.test.ts`) |
|---|---|---|---|---|---|
| `resources.listFor(target)` | `ResourceTarget` | `ResourceRow[]`, TO_WATCH first, then title | — | `useResources(target)` (resources, resource_links, resource_types) | › create/listFor; hook |
| `resources.create(input, target)` | `ResourceInput`; `status` defaults to TO_WATCH | `ResourceRow` (`origin: 'user'`) | `RESOURCE_TITLE_REQUIRED` · `RESOURCE_URL_INVALID` · `RESOURCE_TYPE_NOT_FOUND` · `RESOURCE_LINK_TARGET_NOT_FOUND` (target missing or deleted, any of the 4 kinds) | — | › create rejects (7 cases, nothing written) |
| `resources.update(id, patch)` | `Partial<ResourceInput>` | `ResourceRow` | `RESOURCE_NOT_FOUND` + validation | — | › update: user_edited_at rules |
| `resources.setStatus(id, status)` | `'TO_WATCH' \| 'WATCHED'` | `ResourceRow` | `RESOURCE_NOT_FOUND` | — | › update… |
| `resources.softDelete(id)` / `undoDelete(id)` | | `ResourceRow` | `RESOURCE_NOT_FOUND` | — | › softDelete hides resource and links; undo restores exactly those |
| `resources.link(id, target)` | | `void` (idempotent) | `RESOURCE_NOT_FOUND` · `RESOURCE_LINK_TARGET_NOT_FOUND` | — | › link/unlink |
| `resources.unlink(id, target)` | | `void` (no-op without a live link) | `RESOURCE_NOT_FOUND` | — | › link/unlink |
| `resourceTypes.list()` | | `ResourceTypeRow[]` by sortOrder | — | `useResourceTypes()` | › resourceTypes.list; hook |

Additive codes vs plan §5.6: `link` and `unlink` also raise `RESOURCE_NOT_FOUND` for an unknown or deleted resource. `unlink` never raises `RESOURCE_LINK_TARGET_NOT_FOUND`.

---

## About (`repositories/about.ts`)

### about.get() → `AboutMeta` · useAbout() → `AboutData`
`{ algorithmVersion, taxonomyRelease, backup, attribution }`:
- `taxonomyRelease` comes from `app_meta.taxonomy_release`.
- `backup` comes from `app_meta.backup_exclusion`. Missing or unknown → `not_applicable`.
- `attribution` is `db/seed/attribution.json` in full (`sources[]`).

`useAbout()` adds `appVersion` = `Constants.expoConfig.version` (expo-constants, loaded lazily) and watches app_meta and settings. **Errors:** none. **Tests:** `resources.test.ts` › about.get; hook › "useAbout adds the app version from expo-constants".

---

## Hooks (`repositories/hooks/index.ts`) → actions map for `src/hooks/data` (frontend)

**New hooks:** `useProgress()` · `useAlgorithmParams()` · `useRankHistory()` · `useTechnique(id)` · `useResources(target)` · `useResourceTypes()` · `useAbout()`.
**Changed tables:** `useHome()` adds algorithm_params; `useCurrentRank()` adds settings.

The repository functions behind the plan §5.9 actions:

| action | repository call |
|---|---|
| `setParam`, `resetParams` | `algorithmParams.set`, `algorithmParams.resetAll` |
| `setSetting` | `settings.set` |
| `addRank`, `updateRank`, `deleteRank`, `undoDeleteRank` | `rank.add`, `rank.update`, `rank.softDelete`, `rank.undoDelete` |
| `createPosition/Technique/Subject`, `updatePosition/Technique/Subject` | `taxonomy.create*`, `taxonomy.update*` |
| `deleteTaxonomy`, `undoDeleteTaxonomy` | `taxonomy.softDelete(kind, id)`, `taxonomy.undoDelete(kind, id)` |
| `addAlias`, `removeAlias`, `undoRemoveAlias` | `taxonomy.addAlias`, `taxonomy.removeAlias`, `taxonomy.undoRemoveAlias` |
| `merge`, `undoMerge` | `taxonomy.merge`, `taxonomy.undoMerge` |
| `createResource`, `updateResource`, `setResourceStatus`, `deleteResource`, `undoDeleteResource` | `resources.create`, `.update`, `.setStatus`, `.softDelete`, `.undoDelete` |

**Hook tests:** `repositories/hooks/__tests__/sprint2Hooks.test.tsx` (6 cases).

## Domain purity

The new domain files are pure:
- `progression/{types,sort,index}.ts`, `progression/v1/{compute,signals,window,params}.ts`, `progression/panels/*`, `progression/testing/vectors.ts`;
- `taxonomy/{edit,merge}.ts`, `resources/validate.ts`;
- `session/localDate.ts` `diffDays`.

`domain/__tests__/purity.test.ts` walks every file. `diffDays` is tested in `sprint2Domain.test.ts` › diffDays (DST, leap year, year boundary). `taxonomy/edit`, `taxonomy/merge` and `resources/validate` are tested in the same file.

## Deviations from plan §5 signatures

None that break a caller. Additive or clarifying only:
1. `TechniqueDetail.removed`.
2. `about.get()` returns `AboutMeta`; `appVersion` is added in `useAbout()`, as §5.7 describes.
3. `rank.current/history` take `{ scale? }` as their first parameter, as §5.4 describes.
4. `link`/`unlink` codes, above.
5. `progression.inputs` ignores `today`.
