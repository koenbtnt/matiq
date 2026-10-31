# matIQ — product specification

Derived from `docs/product-spec/po-brief.md` (PO rulings S-01…S-12, R-00…R-35, 2026-10-31) and `docs/decisions.md`. Plan: `docs/product-spec/plan.md`. Items the brief leaves open are marked "assumed, pending PO (plan §0.1 #n)": the plan's default is taken (PO offline, 2026-10-31) and ledgered in `docs/product-spec/assumptions.md`.

## §1 What matIQ is

A personal deliberate-practice companion for a Brazilian jiu-jitsu practitioner. In the PO's words (S-12): "an application that can track BJJ progress and help people to progess their skills … plan, log, have a retrospective on a trainings sessions … an algorithm that checks whether their progression in a certain area of bjj they want to work on, or lack skill. All these things should be able to be altered by the user". The loop — plan what to work on → train → log what actually happened → review → see where you are improving and where you are lacking — must be fast enough to run mat-side and honest enough to trust (R-01). Native iOS and Android (Expo / React Native, S-01), all data on the device (S-02), one practitioner in v1 built so publishing needs no rework (S-03). App name matIQ, bundle id / package `nl.btnt.matiq`, scheme `matiq` (S-09).

## §2 Glossary

| term | meaning |
|---|---|
| **Focus** | The unit that is planned, logged and scored: a position node of the graph or a subject (R-04, R-30 provisional). Stored as `{kind, ref_id}`; techniques become a third kind in v1.x. |
| **Position** | A node of the technique graph (e.g. closed guard, side control); may have a parent (variant). Has one canonical name and any number of aliases (R-23, R-34). |
| **Technique** | A typed edge from a position to a position: transition, guard pass, sweep, escape, takedown, or submission; a submission is terminal (no target). |
| **Alias** | An alternative name for a position (or technique, assumed, pending PO, plan §0.1 #3); search matches any alias; the Library shows the canonical name with aliases beneath (R-34). |
| **Subject** | A cross-cutting theme used as a focus (grip fighting, guard retention); user-editable, seeded (assumed, pending PO, plan §0.1 #4). |
| **Session** | One training occasion with a type (Gi class, Open mat, … — user-editable, R-03), a status (planned, completed, skipped) and signals. |
| **Planned vs actual** | A focus row on a session carries `is_planned` (intended before training) and `is_actual` (trained). Planned-but-not-actual feeds the gap signal; a session completes only with at least one actual focus. |
| **Needs work** (flag) | The user's own mark on an actual focus row; shown as **Flagged**; feeds suggestions and the algorithm but is never itself the computed state (R-17). |
| **Needs work** (state) | One of the four computed progression states (R-17). |
| **Hit / caught** | Optional counts per focus: times the focus worked for you / times you got caught in it (R-05). |
| **Round** | One sparring round, optionally logged in detail (partner belt, outcome, its submissions, note); zero, one or more per session; aggregates (rounds, submissions landed/taken) always exist on the session (R-06, R-19). |
| **Submission** (logged) | One submission landed or taken, optionally tied to a technique, logged at session level or inside a detailed round (R-06 "optionally tied to a technique"). |
| **Cycle** | A 1–3-focus block with start and end dates, default four weeks (R-07); feeds planning suggestions and slot defaults. |
| **Slot** | A recurring weekly training moment (weekday, time, session type) that generates planned sessions two weeks ahead (R-20). |
| **Suggestion** | A focus proposed when planning, from one of four sources the user can switch off (R-09, R-21). |
| **Resource** | An instructional, video, article or other reference with a URL, author, notes and a to-watch/watched status, attachable to a technique, a focus or a cycle (R-29). |
| **Progression states** | **Improving · Steady · Needs work · Not trained lately**, computed per focus over a rolling window, each with an explanation (R-08, R-17). |
| **Rank** | Belt + stripes with promotion dates (history); adult or kids scale (R-10). |
| **Core / extended library** | The curated subset of the graph shown by default vs the full converted graph behind a setting (R-28). |
| **Taxonomy release** | A versioned seed of positions, techniques, aliases and resources shipped with the app (R-28). |

## §3 User and scope

- **v1 user:** the PO, one practitioner, iPhone first (S-03 "Me first, built for publishing"; S-08 iOS-first, Android via EAS Build).
- **Publishable later:** export, import and erase ship in v1 (R-12); encryption at rest from the start (R-24); no analytics or crash SDK without an ADR (`.claude/rules/privacy.md`).
- **v2 direction:** a coach tier with backend and accounts so a coach follows clients as a paid tier (R-27 "yes"; the PO's motive in the R-16 answer: "Ideally i can monitize this app for coaches to check in on their clients"). v1 keeps the sync seam, versions the JSON export as the future upload format, and assumes nothing about a single user forever.
- **Way of working:** `develop` default / `main` released, PRs only (S-10, ADR 0001); the sugar/cadence agent harness (S-11, ADR 0002); sprint order per R-32 (`docs/product-spec/plan.md §7`).
- **Non-goals v1:** coach, club, sharing, social, accounts, sync, cloud backup; strength & conditioning modelling (R-03); per-partner analytics; hosting or embedding video; scraping instructional sites (R-33); a web app (S-04); Android local E2E until an SDK exists; BJJGraph import without a licence (R-28). Gym check-in/schedule, coach badge/notes and the instructional-video area from the design artifact stay out (R-16).

## §4 Core loop and screens

1. **Plan** — a planned session (date, type, planned focuses) by hand, from a slot (R-20) or from suggestions (R-09); optionally inside a cycle (R-07).
2. **Train.**
3. **Log** — Log Session: type, actual focuses (planned ones pre-ticked), per-focus rating / flag / comment / counts, optional techniques, round aggregates, optional detailed rounds, session rating / duration / intensity / energy / context note, what worked / what failed. The ≤ 30 s path: type, focuses, per-focus rating, done (R-26).
4. **Review** — the same screen in review mode; needs-work flags feed suggestions (R-26).
5. **Progress** — state per focus with "why", window and weights editable, rank history.

Screens (R-02, exactly): **Home** · **Log Session** · **Library** · **Technique detail** · **Progress** · **Settings**, plus the planning flow. Anything else is v1.x.

## §5 Domain model

Every table carries the sync seam: `id` text PK (UUID v4), `created_at`, `updated_at` (ISO-8601 UTC), `deleted_at` nullable; no hard delete; every read filters `deleted_at IS NULL` (`.claude/rules/data.md`). Imported tables (`positions`, `techniques`, `aliases`, `subjects`, `resources`, `session_types`, `resource_types`) add `origin` (`seed | user`), `source`, `source_id`, `source_version`, `user_edited_at` (R-23, `.claude/rules/data.md`). A focus is `{focus_kind, focus_ref_id}` with `focus_kind ∈ POSITION | SUBJECT` (`.claude/rules/data.md`; the kind set is data-extensible — technique focuses arrive in v1.x by widening the check) (R-30, **provisional**). Field-level detail, checks and belt lists: `docs/product-spec/plan.md §4`.

```mermaid
erDiagram
  session_types {
    text id PK
    text name
    integer sort_order
    text origin
    text source
    text source_id
    text source_version
    text user_edited_at
    text created_at
    text updated_at
    text deleted_at
  }
  positions {
    text id PK
    text slug
    text canonical_name
    text description
    text notes
    text parent_position_id FK
    text tier
    text origin
    text source
    text source_id
    text source_version
    text user_edited_at
    text created_at
    text updated_at
    text deleted_at
  }
  techniques {
    text id PK
    text slug
    text name
    text type
    text from_position_id FK
    text to_position_id FK
    text applies_to
    text description
    text notes
    text tier
    text origin
    text source
    text source_id
    text source_version
    text user_edited_at
    text created_at
    text updated_at
    text deleted_at
  }
  aliases {
    text id PK
    text target_kind
    text target_id
    text name
    text origin
    text source
    text source_id
    text source_version
    text user_edited_at
    text created_at
    text updated_at
    text deleted_at
  }
  subjects {
    text id PK
    text name
    text description
    text origin
    text source
    text source_id
    text source_version
    text user_edited_at
    text created_at
    text updated_at
    text deleted_at
  }
  sessions {
    text id PK
    text session_type_id FK
    text status
    text starts_at
    text local_date
    integer duration_minutes
    integer rating
    integer intensity
    integer energy
    text context_note
    text what_worked
    text what_failed
    integer rounds_count
    integer submissions_landed
    integer submissions_taken
    text cycle_id FK
    text slot_id FK
    text completed_at
    text reviewed_at
    text created_at
    text updated_at
    text deleted_at
  }
  session_focuses {
    text id PK
    text session_id FK
    text focus_kind
    text focus_ref_id
    integer is_planned
    integer is_actual
    integer needs_work
    integer rating
    text comment
    integer hit_count
    integer caught_count
    integer sort_order
    text created_at
    text updated_at
    text deleted_at
  }
  session_techniques {
    text id PK
    text session_id FK
    text session_focus_id FK
    text technique_id FK
    text note
    text created_at
    text updated_at
    text deleted_at
  }
  rounds {
    text id PK
    text session_id FK
    integer round_no
    text partner_belt
    text outcome
    integer duration_minutes
    text note
    text created_at
    text updated_at
    text deleted_at
  }
  submissions {
    text id PK
    text session_id FK
    text round_id FK
    text direction
    text technique_id FK
    text note
    text created_at
    text updated_at
    text deleted_at
  }
  cycles {
    text id PK
    text name
    text starts_on
    text ends_on
    text note
    text created_at
    text updated_at
    text deleted_at
  }
  cycle_focuses {
    text id PK
    text cycle_id FK
    text focus_kind
    text focus_ref_id
    integer sort_order
    text created_at
    text updated_at
    text deleted_at
  }
  slots {
    text id PK
    integer weekday
    text start_time
    integer duration_minutes
    text session_type_id FK
    integer use_cycle_focuses
    text paused_at
    text created_at
    text updated_at
    text deleted_at
  }
  rank_entries {
    text id PK
    text scale
    text belt
    integer stripes
    text awarded_on
    text note
    text created_at
    text updated_at
    text deleted_at
  }
  resource_types {
    text id PK
    text name
    integer sort_order
    text origin
    text source
    text source_id
    text source_version
    text user_edited_at
    text created_at
    text updated_at
    text deleted_at
  }
  resources {
    text id PK
    text title
    text url
    text author
    text resource_type_id FK
    text notes
    text status
    text origin
    text source
    text source_id
    text source_version
    text user_edited_at
    text created_at
    text updated_at
    text deleted_at
  }
  resource_links {
    text id PK
    text resource_id FK
    text target_kind
    text target_id
    text created_at
    text updated_at
    text deleted_at
  }
  settings {
    text id PK
    text key
    text value
    text value_type
    text created_at
    text updated_at
    text deleted_at
  }
  algorithm_params {
    text id PK
    text algorithm_version
    text key
    real value
    real default_value
    real min
    real max
    text created_at
    text updated_at
    text deleted_at
  }
  taxonomy_merges {
    text id PK
    text target_kind
    text from_id
    text into_id
    text payload
    text undone_at
    text created_at
    text updated_at
    text deleted_at
  }
  app_meta {
    text id PK
    text key
    text value
    text created_at
    text updated_at
    text deleted_at
  }

  positions ||--o{ positions : "parent (variant)"
  positions ||--o{ techniques : "from"
  positions |o--o{ techniques : "to (null iff SUBMISSION)"
  positions ||--o{ aliases : "target_kind=POSITION"
  techniques ||--o{ aliases : "target_kind=TECHNIQUE"
  session_types ||--o{ sessions : ""
  sessions ||--o{ session_focuses : ""
  sessions ||--o{ session_techniques : ""
  session_focuses |o--o{ session_techniques : "optional"
  techniques ||--o{ session_techniques : ""
  sessions ||--o{ rounds : ""
  sessions ||--o{ submissions : ""
  rounds |o--o{ submissions : "optional (null = session level)"
  techniques |o--o{ submissions : "optional"
  positions |o--o{ session_focuses : "focus_kind=POSITION"
  subjects |o--o{ session_focuses : "focus_kind=SUBJECT"
  cycles |o--o{ sessions : ""
  cycles ||--o{ cycle_focuses : "1..3"
  positions |o--o{ cycle_focuses : "focus_kind=POSITION"
  subjects |o--o{ cycle_focuses : "focus_kind=SUBJECT"
  slots |o--o{ sessions : "generated"
  session_types ||--o{ slots : ""
  resource_types ||--o{ resources : ""
  resources ||--o{ resource_links : ""
  techniques |o--o{ resource_links : "target_kind=TECHNIQUE"
  positions |o--o{ resource_links : "target_kind=POSITION"
  subjects |o--o{ resource_links : "target_kind=SUBJECT"
  cycles |o--o{ resource_links : "target_kind=CYCLE"
```

Invariants carried from the legacy prototype and the brief, each a schema `check()` unless marked domain: `needs_work ⇒ is_actual`; `rating ⇒ is_actual`; ratings, intensity and energy 1–5; counts (`hit_count`, `caught_count`, `rounds_count`, `submissions_*`) ≥ 0; durations > 0; `round_no` ≥ 1; `to_position_id` null iff `type = SUBMISSION`; every enum column (`status`, `type`, `applies_to`, `tier`, `focus_kind`, `target_kind`, `direction`, `scale`, `belt`, `origin`, `source`, `outcome`) checked against its list; `start_time` and date columns pattern-checked; a session completes only with ≥ 1 actual focus row (domain); focus rows unique per (session, kind, ref) (domain); cycle 1–3 focuses (domain); weekday 1–7 with Monday = 1 (R-15). Reviews are columns on `sessions` (one review per session, same screen — planner decision from the brief's core loop, not a ruling). Seed rows keep ids fixed in the seed file across taxonomy releases (R-28 "our own stable ids"). Recorded deviations from `.claude/rules/data.md` (erase-all as R-12's hard-delete exception, converter-minted seed ids): `docs/product-spec/plan.md §11`.

## §6 Features by screen

Visual source for every screen: the PO's Claude Artifact exported to `design-system/artifact/`, tokens extracted by the designer (S-05); the open design requests (DSR-17…25, brief §12) must be designed before the sprint that uses them.

**Home** — today's plan and next planned session (from slots or by hand); quick log (≤ 2 taps to a prefilled Log Session, R-26); suggestions with their source label (R-09); current rank (R-10); unlogged recent sessions as a nudge (planner default, not ruled); empty state explains the first step (R-26).

**Log Session** — type (required, prefilled); focuses (≥ 1 required; planned pre-ticked; search across names and aliases, R-34); per focus: rating 1–5, needs-work flag, comment, hit/caught counts (R-05); optional techniques attached to a focus (R-04); round aggregates (rounds, submissions landed/taken) with each submission optionally tied to a technique even without detailed rounds (R-06); detailed rounds when `log.detailedRounds` is on: partner belt, outcome (assumed, pending PO, plan §0.1 #1), the round's submissions, note (R-19); session: duration (minutes), rating, intensity, energy, context note (partner belt as free context, R-05; own field assumed, pending PO, plan §0.1 #8), what worked / what failed (R-05, R-15). Review mode = same screen (R-26). Delete = soft delete with undo toast (R-26).

**Library** — positions (nodes) with canonical name and aliases, techniques (edges) grouped by type, subjects; core shown by default, extended behind `library.showExtended` (R-28); search by any alias (R-34). Sprint 1 read-only; sprint 2 editing: add, rename (follows the id everywhere; keeping the old name as an alias assumed, pending PO, plan §0.1 #9), soft delete (hidden from pickers, history kept), merge (history moves to the survivor; undoable), alias add/remove (R-14, R-23). User edits are never overwritten by a taxonomy release (R-23). Technique aliases: assumed, pending PO (plan §0.1 #3).

**Technique detail** — type, from/to positions, gi/no-gi applicability, description (imported) and notes (user), resources attached (R-29) with to-watch/watched status, history of sessions where it was attached (planner default, not ruled); v1.x adds technique-level progression (R-04).

**Progress** — per focus: state (Improving · Steady · Needs work · Not trained lately) with a "why" sheet listing each signal's value, weight and threshold (R-08, R-17); Flagged badge separate; window and weights editable with reset (R-08); rank history (R-10); consistency heatmap and planned-vs-actual gaps (brief §6 dashboards) as secondary panels. Graph visualisation with progression overlay = later (R-23).

**Settings** — rank (belt, stripes, promotion dates; kids scale toggle, R-10); algorithm weights, thresholds, window with "reset to defaults" and the active `algorithm.version` (R-08, R-22); suggestion sources (four switches) and maximum (R-21); detailed-rounds toggle (R-19); recurring slots (R-20); reminders (R-11); theme follows system (brief §5); a manual override is DSR-21, pending CO-16; session types and resource types editing (R-03, R-29); export JSON (file protection assumed, pending PO, plan §0.1 #10), import JSON (merge semantics assumed, pending PO, plan §0.1 #2), erase all (R-12; confirmation assumed, pending PO, plan §0.1 #2); about and licences (GrappleMap public domain, grapple-flows CC BY 4.0 attribution — required by the licence, R-28); app lock later (R-25).

**Planning flow** — create a planned session (date, type, focuses from suggestions or search); create or end a cycle (1–3 focuses, default four weeks; one active at a time, assumed, pending PO, plan §0.1 #5); manage slots (R-07, R-20).

## §7 Progression algorithm v1

Ruled shape (R-08 "Yes Deterministic, but in the future the algo might be changed or tweaked"; S-06): deterministic, pure TypeScript in `mobile/src/domain/progression/v1`, computed when Progress opens or a session is reviewed, no background jobs.

- **Inputs per focus** over the window (`windowWeeks`, default 8, editable): trend of per-focus ratings; needs-work frequency; planned-vs-actual gap; days since last trained; hit/caught ratio when logged.
- **States** (R-17): Improving · Steady · Needs work · Not trained lately. "Flagged" is the user's own needs-work mark on the most recent completed session in which the focus was actually trained, never a computed state.
- **Signal definitions** (plan §8): `n` = completed sessions with the focus actual; trend = later-half minus earlier-half mean rating over rated rows, defined from two rated rows; needs-work rate = flags / n; gap = planned-not-trained / planned over sessions of any status (skipped and stale planned sessions count as not trained); days since = today minus the last actual date over all time; hit ratio defined from `hitCaughtMinEvents` events.
- **Rules, first match wins** (planner's defaults, tuned once real data exists): (1) `n = 0` or `daysSince > staleDays` (21) → Not trained lately; (2) weighted needs-work score ≥ `needsWorkThreshold` (0.5) → Needs work, with weights `wNeedsWork` 0.4, `wHitCaught` 0.25, `wGap` 0.2, `wTrend` 0.15; (3) trend defined and ≥ `trendImproving` (0.5 on the 1–5 scale) with `n ≥ minSessions` (3) → Improving; (4) else Steady. Signals without enough data drop out and the remaining weights are rescaled; the explanation says so.
- **Explanation**: every state shows each signal's value, weight and the threshold it crossed, and which rule fired (R-08 "every state explains why").
- **Configuration**: weights, thresholds and window are `algorithm_params` rows with `default_value` and bounds; "reset to defaults" in Settings (R-08); the domain reads them as inputs, never as constants (`.claude/rules/data.md`).
- **Versioning** (R-22): rows carry `algorithm_version`; `settings.algorithm.version` names the one active version; a v2 ships as a new module with new default rows and a one-time carry-over/reset notice.
- **Suggestions** (R-09, R-21): sources = last session's needs-work flags · active cycle focuses · focuses in state Needs work · focuses in state Not trained lately; each switchable; at most `suggest.max` (3); accept or ignore.

## §8 Taxonomy

- **Graph** (R-23): positions are nodes (with a parent/variant relation), techniques are typed edges (TRANSITION, GUARD_PASS, SWEEP, ESCAPE, TAKEDOWN, SUBMISSION; submissions terminal), aliases are first-class and searchable (R-34). v1 stores no layout data; nodes, edges and progression per node stay queryable for the later graph view.
- **Sources** (R-13, R-28 "ok do that"): GrappleMap (public domain; 601 positions, 1485 transitions, 1208 `ref:` citations) converted by our own TypeScript parser into nodes and typed edges under our own stable ids; canonical names and aliases hand-curated starting from grapple-flows/bjj-data (CC BY 4.0, attribution shown in Settings); edge types derived from tags then reviewed; gi techniques hand-authored in our layer (`applies_to`); BJJGraph structural reference only unless the PO obtains a licence. GrappleMap's citations seed Resources (R-33).
- **Pipeline** (R-35): `scripts/taxonomy/` vendors the GrappleMap snapshot one file per record (PR 5 format), validates it (PR 4 rules), parses per PR 6's format description, canonicalises poses to resolve endpoints, cleans names, derives edge types, applies the hand-maintained curated-core list and emits a seed JSON with a release version. Reimplemented, not copied.
- **Core + extended** (R-28): ≈ 40–60 positions and ≈ 150 techniques are `CORE` and visible by default; the rest is `EXTENDED` behind a setting.
- **User layer wins on re-import** (R-23, `.claude/rules/data.md`): a release upserts only rows with `origin = seed` whose `user_edited_at` and `deleted_at` are null; user-authored rows (`origin = user`) are never touched; the seed never hard-deletes.
- **Editing semantics** (R-14): rename follows the id everywhere (keeping the old name as an alias: assumed, pending PO, plan §0.1 #9); delete is soft and hides the row from pickers while history keeps rendering it; merge moves every reference to the survivor — session focus rows, cycle focuses, resource links, aliases, and for positions the edges' endpoints and variant children, for techniques the session technique attachments and logged submissions — hides the other and is undoable from its merge log (plan §6).
- **User edits that freeze a row against re-import**: edits to imported fields (names, slug, description, type, endpoints, applicability, tier, parent); the user's `notes`, resource status and added aliases never do.

## §9 Data, privacy, publishing readiness

- **On device only** (`.claude/rules/privacy.md`; S-02): no backend, no account, no sync, no network call carrying user data; the only outbound action is opening a Resource URL in the browser (R-29).
- **Encryption at rest** (R-24): SQLCipher through `expo-sqlite`'s `useSQLCipher`; key generated on first launch, kept in Keychain/Keystore via `expo-secure-store` with a this-device-only accessibility class so it never syncs to a cloud keychain (with A-11, assumed, pending PO — plan §0.1 #11); development, smoke checks and Maestro on dev-client builds only (R-31); Jest on plain better-sqlite3.
- **OS backups** (R-12 "no cloud backup"): database and key excluded from iCloud / Android auto-backup — assumed, pending PO (plan §0.1 #11); the JSON export is the user's backup.
- **Export / import / erase** (R-12): JSON export of every table including tombstones, versioned (`export_schema_version`) and documented as the future upload format (R-27); the exported file is plaintext once shared — protection assumed, pending PO (plan §0.1 #10); import semantics assumed, pending PO (plan §0.1 #2; default: merge by id, newest `updated_at` wins); erase-all closes the database, deletes the database, WAL and SHM files and the key, creates a new key and reseeds — the one hard-delete path, recorded as R-12's exception to the no-hard-delete rule (plan §11). Both ship before any store release.
- **No analytics, crash-reporting or advertising SDK** without a dated ruling and an ADR; no third-party identifiers.
- **App lock** (R-25): optional biometric/passcode on open, v1.x.
- **Fixtures and screenshots** use fictional data only.

## §10 Non-functional requirements

UX acceptance criteria (R-00, R-26 "yes", R-18 "yes"), each testable and present in both reviewer checklists (`.claude/agents/reviewer-design.md:90-94`, `.claude/agents/reviewer-code.md:80-83`). NF-04, NF-11 and NF-12 derive from `.claude/rules/*`, and NF-09 is a planner target; none of these four is R-26.

| id | requirement | test |
|---|---|---|
| NF-01 | R-26 "≤ 2 taps from Home" — reading assumed, pending PO (plan §0.1 #7); default: the Log Session screen with type and focuses prefilled is reached in ≤ 2 taps and saved with one further tap | Maestro flow counts taps by testID |
| NF-02 | The log path type → focuses → per-focus rating → done completes in ≤ 30 s | timed Maestro flow on the simulator |
| NF-03 | Only session type and one focus are required; every other field optional | domain test: `sessions.log` with two fields succeeds |
| NF-04 | Every screen usable one-handed in portrait (R-26); widths 390 and 430 px and the bottom-anchored primary action come from `.claude/rules/frontend.md` "Phone-first, one-handed" | design review + Maestro at both widths |
| NF-05 | Destructive actions are soft deletes with an undo toast, no confirm dialog (exception: erase all, assumed, pending PO, plan §0.1 #2) | Maestro: delete → undo restores |
| NF-06 | Every empty state names the next step | copy table in design.md; Maestro assertVisible |
| NF-07 | Readable in light and dark (R-26); theme follows the system (brief §5); tokens only (`.claude/rules/frontend.md`); a manual override is DSR-21, pending CO-16 | token adherence check; dark-mode screenshots |
| NF-08 | Hit targets ≥ 44 pt iOS / 48 dp Android, smaller elements extended with `hitSlop` | design review |
| NF-09 | Progression for all focuses over the window computes in < 100 ms on device for 500 sessions (planner target, not ruled; keeps Progress free of spinners) | domain benchmark test |
| NF-10 | Fully offline: no feature depends on connectivity | review |
| NF-11 | Every user-facing string via i18n keys; English only (S-07) | lint/test |
| NF-12 | Every interactive element and list row carries a `testID` `<screen>.<element>[.<id>]` | Maestro flows select by `id:` |
| NF-13 | Duration in minutes; dates and times in device locale and zone; weeks start Monday; no unit conversion (R-15) | unit tests on formatting |

## §11 Later

Order of work (R-32 "ok"): sprint 1 foundation → sprint 2 Progress, Settings, Library editing, Technique detail → sprint 3 cycles, slots, reminders, export/import/erase, detailed rounds → v1.x → v2.

- **v1.x:** technique-level progression (first; R-04), app lock (R-25), graph visualisation with progression overlay (R-23), resources watch list (R-29), legacy data import for the PO (assumed, pending PO, plan §0.1 #6).
- **v2:** coach tier with backend and accounts (R-27, ADR + CO-08), instructional import from public catalogues subject to terms of service (R-33), strength & conditioning session family (R-03), BJJGraph data if licensed (R-28).

## §12 Rulings register

| id | section(s) | id | section(s) |
|---|---|---|---|
| S-01 | §1, §3 | R-12 | §3, §6 Settings, §9 |
| S-02 | §1, §9 | R-13 | §8 |
| S-03 | §1, §3 | R-14 | §6 Library, §8 |
| S-04 | §3, §10 | R-15 | §5, §6 Log, §10 NF-13 |
| S-05 | §6 (design artifact source; DSR references) | R-16 | §3 |
| S-06 | §7 | R-17 | §2, §6 Progress, §7 |
| S-07 | §10 NF-11 | R-18 | §10 NF-08 |
| S-08 | §3 | R-19 | §2, §6 Log, §6 Settings |
| S-09 | §1 (bundle `nl.btnt.matiq`, scheme `matiq`) | R-20 | §2, §4, §6 Settings, §6 Planning |
| S-10 | §3 | R-21 | §6 Settings, §7 |
| S-11 | §3 | R-22 | §6 Settings, §7 |
| S-12 | §1 | R-23 | §2, §5, §6 Library, §8, §11 |
| R-00 | §10 | R-24 | §3, §9 |
| R-01 | §1 | R-25 | §6 Settings, §9, §11 |
| R-02 | §4 | R-26 | §4, §5, §6, §10 |
| R-03 | §2, §3, §6 Settings, §11 | R-27 | §3, §9, §11 |
| R-04 | §2, §6 Log, §6 Technique, §11 | R-28 | §2, §5, §6 Library, §6 Settings, §8, §11 |
| R-05 | §2, §6 Log | R-29 | §2, §6 Technique, §6 Settings, §9, §11 |
| R-06 | §2, §6 Log | R-30 | §2, §5 (provisional) |
| R-07 | §2, §4, §6 Planning | R-31 | §9 |
| R-08 | §2, §6 Progress, §6 Settings, §7 | R-32 | §3, §11 |
| R-09 | §2, §4, §6 Home, §7 | R-33 | §3, §8, §11 |
| R-10 | §2, §6 Home, §6 Progress, §6 Settings | R-34 | §2, §6 Log, §6 Library, §8 |
| R-11 | §6 Settings | R-35 | §8 |

Every id also has a dated bullet in `docs/decisions.md`.
