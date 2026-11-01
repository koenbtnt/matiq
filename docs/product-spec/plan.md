# product-spec — plan

## Changes since review 1 (2026-10-31, rework round 1; orchestrator's routing applied, incl. the later autonomy and `data.md` bec9bf3 notes)

| finding | section(s) | what changed |
|---|---|---|
| F-01 | §4 conventions, `sessions`, `session_focuses`, `rounds`, `slots`, `cycles`, `rank_entries`; PRODUCT §5 | Explicit `check()` for every enum and range: counts ≥ 0, durations > 0, `round_no` ≥ 1, `source` and `origin` enums, `start_time` and date `GLOB` patterns; PRODUCT §5 invariants list mirrors them |
| F-02 | §0 D-12, §2 D-12, §4 `submissions`, §5 `submissions.upsert`, §6 aggregates; PRODUCT §2, §5 ER, §6 Log | `round_submissions` replaced by session-level `submissions` (`session_id` NOT NULL, `round_id` nullable, `technique_id` nullable) — R-06's "optionally tied to a technique" holds with detailed rounds off |
| F-03 | §0.1 #7; PRODUCT §10 NF-01; A-7 | The two-taps reading is an assumption with the default taken; NF-01 marked "assumed, pending PO" |
| F-04 | §0.1 #8, #9; §2 D-10, §6 Rename; PRODUCT §6, §8, §9; decisions R-05, R-14; A-8, A-9, A-2 | Partner-belt location and rename-keeps-alias are assumptions; import merge marked assumed in PRODUCT §9 and §6 Settings |
| F-05 | §0.1 #10, #11; §0 D-21/D-22, §2 D-22, §6 Export/OS backups; PRODUCT §9; A-10, A-11 | Export plaintext-with-warning (assumed), DB and key excluded from OS backups (assumed), key accessibility `WHEN_UNLOCKED_THIS_DEVICE_ONLY` (plan fact, to confirm in sprint 1) |
| F-06 | §0 D-21, §2 D-21, §5 `data.eraseAll`, §6 Erase, §11; PRODUCT §9; decisions R-12 | Erase recorded as R-12's single exception to `data.md:23` no-hard-delete; mechanism = close, delete DB + WAL + SHM, delete key, new key, reseed; DELETE-and-rekey rejected |
| F-07 | §0 D-05, §2 D-05, §4 `session_focuses`, §7 v1.x, §10; PRODUCT §5; decisions R-30 | `data.md:24` (bec9bf3) now defines the focus as `{kind, ref_id}`, kind ∈ POSITION \| SUBJECT, data-extensible: D-05 cites it, v1 checks exactly that set, TECHNIQUE arrives by widening the check in v1.x; no deviation row, no carry-over |
| F-08 | §0 D-24, §2 D-24; PRODUCT §10 intro; decisions R-26 | The R-26 criteria are in `reviewer-design.md:90-94` and `reviewer-code.md:80-83` (bec9bf3); cited, no carry-over |
| F-09 | §2 header, D-02, D-11; PRODUCT §3; decisions R-16, R-27 | D-11 marked a planner decision on brief prose; "Ideally i can monitize…" attributed to the R-16 answer; `user_id` absence cited to `privacy.md` |
| F-10 | PRODUCT §6 Home, Technique, §10 NF-04, NF-07, NF-09 | Unruled items marked "planner default, not ruled"; widths cited to `frontend.md`; theme override cited to DSR-21 / CO-16 |
| F-11 | §8, §6 Missed planned sessions; PRODUCT §7 | Trend defined from 2 rated rows (`nr`), `n` counts actual rows, gap over sessions of any status with SKIPPED and stale PLANNED as not trained, `daysSince` over all time, weight rescaling stated, "Flagged" scope unified |
| F-12 | §6 "Which edits set `user_edited_at`"; PRODUCT §8; D-07 | Imported fields set it; `notes`, resource `status` and user aliases never; `origin ∈ seed\|user` added per `data.md:25` |
| F-13 | §6 Merge folding; PRODUCT §8 | Moved references listed per kind incl. `session_techniques`, `submissions.technique_id`, technique `resource_links`, `parent_position_id` children |
| F-14 | §0 D-34, §2 D-34; decisions S-05 | Blocking DSRs scoped to `components.md § Open requests` + CO-15/CO-16; DSR-12 and DSR-15 named as blocking sprint 1 |
| N-01, N-02, N-04 | §12 carry-over candidates; §6 Export | Coral/red belts, tombstone purge policy, `resources.author` naming recorded as candidates |
| autonomy note | §0.1, §9; `docs/product-spec/assumptions.md` (A-1…A-11); PRODUCT header; decisions | Every §0.1 item taken at its default, marked "assumed, pending PO (2026-10-31)", ledgered with what changes if ruled otherwise |

Sprint 0, docs-only. Planner: planner-ps · 2026-10-31 · sole source: `docs/product-spec/po-brief.md` (rulings S-01…S-12, R-00…R-35). Produces `docs/PRODUCT.md` and `docs/decisions.md`; no code.

## §0 Summary for builders

**What this sprint delivers.** The product spec (`docs/PRODUCT.md`), the binding decision record (`docs/decisions.md`) and this plan, which fixes the field-level domain model the `foundation` sprint will implement. Nothing under `mobile/` changes; `mobile/src/db/` keeps only `app_meta` (`mobile/src/db/schema/app_meta.ts:3-12`, already carrying the sync seam).

**Decision register (D-nn · one line · source · architectural?).** Full text in §2.

| D | decision | source | arch |
|---|---|---|---|
| D-01 | Expo/RN + TS + Expo Router in `mobile/`, expo-sqlite + Drizzle, pure-TS domain, Maestro, iOS-first, `nl.btnt.matiq`, develop/main, agent harness | S-01,02,04,08,09,10,11 | yes |
| D-02 | One practitioner in v1, built for publishing; coach tier = v2 with backend; sync seam only | S-03, S-12, R-01, R-27 | yes |
| D-03 | Six screens + planning flow are the v1 surface; everything else v1.x | R-02 | no |
| D-04 | `session_types` is a seeded, user-editable table (6 seed rows); no S&C | R-03 | yes |
| D-05 | Focus = `{focus_kind, focus_ref_id}`, kind check `POSITION\|SUBJECT` per `.claude/rules/data.md:24` ("the kind set is data-extensible"); `TECHNIQUE` arrives in v1.x by widening the check — **provisional** | R-04, R-30 | yes |
| D-06 | `positions` = nodes (self-FK variants), `techniques` = typed edges (`to` null iff SUBMISSION), `aliases` keyed `{target_kind, target_id}` | R-23, R-34 | yes |
| D-07 | Imported rows carry `origin ∈ seed\|user`, `source`, `source_id`, `source_version`, `user_edited_at`; re-import upserts only `origin = 'seed'` rows with `user_edited_at IS NULL AND deleted_at IS NULL` (`.claude/rules/data.md:25`) | R-23, R-28 | yes |
| D-08 | Seed ids are UUIDs minted once by the converter and fixed in the seed file (mechanism assumed, §0.1 #14); `app_meta.taxonomy_release` records the installed release | R-28 | yes |
| D-09 | `tier ∈ CORE\|EXTENDED` on positions/techniques; setting `library.showExtended` (default off) | R-28 | yes |
| D-10 | Per-focus signals: `rating`, `needs_work`, `comment`, `hit_count`, `caught_count`; per session: `rating`, `duration_minutes`, `intensity`, `energy`, `context_note`, `what_worked`, `what_failed` | R-05, R-19 | yes |
| D-11 | Review columns live on `sessions` (one review per session, same screen); no `session_reviews` table — planner decision on brief §5 step 4 + legacy 1 : 1 reviews, assumed, pending PO (§0.1 #12) | brief §5, §6 | yes |
| D-12 | `rounds` + session-level `submissions` (`round_id` nullable, `technique_id` nullable) from v1; aggregates on `sessions` always; detailed-round UI gated by `log.detailedRounds` | R-06, R-19 | yes |
| D-13 | `session_techniques` (technique attached to a session, optionally to a focus row) captured from v1 | R-04 | yes |
| D-14 | `cycles` (1–3 focuses, default 28 days) + `cycle_focuses`; one active cycle at a time (§0.1 #5) | R-07 | yes |
| D-15 | `slots` generate PLANNED sessions 14 days ahead; generator reads tombstones (`deleted_at` not null) to avoid resurrecting skipped instances | R-20 | yes |
| D-16 | Algorithm `progression/v1`: four states, rolling window, five signals, ordered rules, full explanation; numeric defaults beyond R-08's 8-week window are assumed (§0.1 #13) | S-06, R-08, R-17 | yes |
| D-17 | `algorithm_params` rows carry `algorithm_version`, `value`, `default_value`, bounds; `settings.algorithm.version` names the active version | R-22 | yes |
| D-18 | Suggestion sources = 4 switches + `suggest.max` (3) in `settings` | R-09, R-21 | no |
| D-19 | `rank_entries` (scale ADULT\|KIDS, belt, stripes, awarded_on); current rank = latest live row; `rank.scale` setting | R-10 | yes |
| D-20 | Reminders = local notifications, off by default, sprint 3 | R-11 | no |
| D-21 | JSON export v1 = every table incl. tombstones (encryption §0.1 #10); import = merge by id, newest `updated_at` wins (§0.1 #2); erase = close DB, delete DB + WAL + SHM, delete key, new key, reseed — the ruled exception to no-hard-delete (§11) | R-12, R-27 | yes |
| D-22 | SQLCipher via `useSQLCipher`, key in `expo-secure-store` with `WHEN_UNLOCKED_THIS_DEVICE_ONLY`, DB file excluded from OS backups (§0.1 #11), dev-client only; Jest on better-sqlite3 | R-24, R-31, R-12 | yes |
| D-23 | App lock = v1.x, low priority | R-25 | no |
| D-24 | UX acceptance criteria as testable NFRs (≤ 30 s / ≤ 2 taps, one-handed, undo, 2 required fields, empty states, light+dark, 44 pt/48 dp); present in `.claude/agents/reviewer-design.md:90-94` and `reviewer-code.md:80-83` | R-00, R-26, R-18 | no |
| D-25 | Taxonomy edits: rename follows id; delete = soft, hidden from pickers; merge = domain op moving every reference, logged in `taxonomy_merges` for undo | R-14 | yes |
| D-26 | Minutes; `starts_at` ISO UTC + denormalised `local_date`; weeks start Monday | R-15 | yes |
| D-27 | Gym check-in, coach notes, video area parked; video → Resources | R-16 | no |
| D-28 | `resources` + `resource_types` (data) + `resource_links` `{target_kind, target_id}` | R-29 | yes |
| D-29 | Sprint order 1 foundation → 2 → 3 → v1.x → v2; all tables created in sprint 1, UI per sprint | R-32 | no |
| D-30 | Instructional scraping = v2, ToS risk recorded | R-33 | no |
| D-31 | Taxonomy pipeline: TS converter in `scripts/taxonomy/`, GrappleMap vendored one-file-per-record (PR 5 format), validator per PR 4, format per PR 6 — reimplemented | R-13, R-35 | yes |
| D-32 | Sources: GrappleMap (public domain) + grapple-flows aliases (CC BY 4.0, attribution screen) + hand-authored gi layer; BJJGraph reference only | R-13, R-28 | yes |
| D-33 | English copy through i18n keys only | S-07 | no |
| D-34 | Design source = PO's Claude Artifact in `design-system/artifact/`; open DSRs per `design-system/components.md § Open requests` (CO-15 fonts, CO-16 rulings; DSR-12 and DSR-15 block sprint 1) block the sprint that uses them | S-05 | no |
| D-35 | `settings` (key/JSON value, user prefs) is separate from `app_meta` (machine metadata) | R-21, R-22, `.claude/rules/data.md` | yes |
| D-36 | `applies_to ∈ GI\|NOGI\|BOTH` on techniques (default BOTH); gi rows are hand-authored | R-28 | yes |

**Data at field level** — §4 (all tables). Every table: `id` text PK (UUID v4), `created_at`, `updated_at` ISO-8601 UTC text, `deleted_at` nullable (`.claude/rules/data.md` "Sync seam on every table"). Tables: `session_types`, `positions`, `techniques`, `aliases`, `subjects`, `sessions`, `session_focuses`, `session_techniques`, `rounds`, `submissions`, `cycles`, `cycle_focuses`, `slots`, `rank_entries`, `resource_types`, `resources`, `resource_links`, `settings`, `algorithm_params`, `taxonomy_merges` (+ existing `app_meta`).

**Repository/domain API surface** — §5 (function · input · output · `DomainError` codes · live query).

**Files/areas that change this sprint:** `docs/product-spec/plan.md`, `docs/PRODUCT.md`, `docs/decisions.md` (planner). Downstream owners per sprint in §7.

**Edge cases** — §6 (taxonomy edit vs history, merge folding, soft-delete reads, slot tombstones, time zones, aggregates vs detailed rounds, re-import after user edits, import conflicts, kids/adult rank switch, algorithm with sparse data). **Deviations from binding rules** — §11 (D-21 erase, D-08 seed ids). **Carry-over candidates** — §12. **Assumptions ledger** — `docs/product-spec/assumptions.md` (every §0.1 item, default taken).

### §0.1 Rulings needed — each item is **assumed, pending PO (2026-10-31)**: the PO is offline and authorised the sprint to run without questions, so the default is taken as is and ledgered in `docs/product-spec/assumptions.md` (A-n = #n)

| # | open point (the brief is silent) | default taken — assumed, pending PO (2026-10-31) |
|---|---|---|
| 1 | Vocabulary of a detailed round's `outcome` (R-19 names the field, not its values) | nullable enum `DOMINANT \| EVEN \| DOMINATED`; submissions are separate rows, so the outcome is the user's overall read of the round |
| 2 | Erase-all cannot be undone by a toast, yet R-26 rules "undoable instead of confirm dialogs" | erase-all is the single sanctioned explicit-confirm (hold-to-erase); import is a non-destructive merge and needs no confirm |
| 3 | Aliases on techniques (R-34 speaks of positions only; "americana"/"keylock" exists) | yes — same `aliases` table, `target_kind` TECHNIQUE |
| 4 | Seeded subjects (R-30 names subjects as a focus kind but lists none) | seed 6, user-editable: Guard retention · Grip fighting · Pressure and weight distribution · Submission finishing · Defence and escapes · Competition strategy |
| 5 | Overlapping focus cycles | one active cycle at a time; starting a new one ends the previous on its start date (`CYCLE_OVERLAP` otherwise) |
| 6 | Importing the PO's historical legacy data (Oracle prototype) | no in v1; fixtures stay fictional (`.claude/rules/privacy.md`); a one-off converter is a PO task for v1.x |
| 7 | Reading of R-26 "≤ 30 s and ≤ 2 taps from Home": (a) the prefilled Log Session screen is reached in ≤ 2 taps and saved with one more, or (b) the whole log incl. a rating takes ≤ 2 taps | (a); (b) is impossible with any rating entry |
| 8 | Where the session-level partner belt lives — R-05 rules it "as free additional context" but not whether it is its own field | inside the session `context_note`; a dedicated `partner_belt` field only per detailed round (R-19) |
| 9 | Does a rename keep the old name as an alias? (R-14 rules only "rename follows the id") | yes, as a pre-ticked option on the rename sheet |
| 10 | Export file protection — R-12 "securely encrypted" vs a JSON file that leaves the sandbox | v1 exports plaintext JSON through the OS share sheet only (no copy kept in the sandbox) with a warning line; an optional passphrase (AES-GCM) is v1.x |
| 11 | OS backups of the database (iCloud / Android auto-backup) — R-12 rules "no cloud backup" | exclude `matiq.db` and the key from OS backups (iOS backup-exclusion attribute, Android `allowBackup=false`); the user's backup is the JSON export |
| 12 | Review stored as columns on `sessions` vs a `session_reviews` table (brief §5 prose, legacy 1 : 1 table; no ruling) | columns on `sessions` (`rating`, `what_worked`, `what_failed`, `reviewed_at`), one review per session (D-11) |
| 13 | Numeric defaults of algorithm v1 other than the ruled 8-week window (R-08): `staleDays`, `minSessions`, thresholds, weights, `hitCaughtMinEvents` | §4.3 values, "tuned once real data exists" (brief §7 prose) |
| 14 | Mechanism behind R-28 "our own stable ids": converter-minted UUIDs fixed in the seed file vs repository-minted ids per install (`data.md:23`) | converter-minted, fixed across releases (D-08, §11) |

---

## §1 Summary

matIQ is a local-only deliberate-practice companion for one BJJ practitioner (brief §4). The loop is plan → train → log actual → review → see Improving / Steady / Needs work / Not trained lately per focus. This sprint writes the spec and the decision record from the PO brief and fixes the domain model so that `foundation` (sprint 1) can generate migrations from it without a further ruling. The model carries the legacy prototype's invariants (`/Users/koen/Projects/matiq/matiq-legacy/db/02_tables.sql:23-79`: tag kinds, `needs_work ⇒ is_actual`, rating 1–5, `to_position` null iff SUBMISSION, session statuses) and adds what the brief rules: focus as `{kind, ref_id}` (R-30, provisional), aliases (R-34), imported-row source fields with a winning user layer (R-23), per-focus and per-session signals (R-05), rounds (R-19), cycles and slots (R-07, R-20), rank history (R-10), resources (R-29), settings with algorithm versioning (R-21, R-22), export/import/erase (R-12).

## §2 Decision register (full text)

Quoted text in double quotes is the PO's words from the brief's rulings table unless marked "brief prose"; dates all 2026-10-31.

- **D-01** Stack and repo. S-01 "Expo / React Native (Recommended)", S-02 "Local-first on device (Recommended)", S-04 "Maestro on simulators (Recommended)", S-08 "iOS-first locally, Android via EAS Build (Recommended)", S-09 "nl.btnt.matiq (Recommended)", S-10 "similar to that of sugar and cadence w.r.t. develop and main branch", S-11 "take the development approche of the (sub)agents". Architectural.
- **D-02** User and horizon. S-03 "Me first, built for publishing"; R-01 vision "correct"; R-27 "yes": v1 keeps the sync seam, a versioned JSON export "documented as the future upload format", and "nothing assumes a single user forever". No `user_id` column in v1 — `.claude/rules/privacy.md` "no account identifiers until an auth ADR exists"; the seam makes a tenant column a later additive migration — but no code path hard-codes a singleton either. Architectural.
- **D-03** Surfaces. R-02 "correct": Home, Log Session, Library, Technique detail, Progress, Settings, plus the planning flow. Not architectural.
- **D-04** Session types are data. R-03 "corect": seed Gi class, No-gi class, Open mat, Private lesson, Competition, Drilling/study; "S&C not modelled in v1; the type list is the extension point". Architectural (table).
- **D-05** Focus reference. R-30 "positions for now, but this might change later after user tests" (provisional); R-04 technique-level progression "yes later, but one of the earlier later features". Shape per `.claude/rules/data.md:24`: "a focus is `{kind, ref_id}` where `kind` ∈ POSITION | SUBJECT … the kind set is data-extensible". v1 checks exactly that set; v1.x widens the check to `TECHNIQUE` in one generated migration. Polymorphic `focus_ref_id` has no SQL FK; existence is checked in the domain (`FOCUS_REF_NOT_FOUND`). Architectural, provisional.
- **D-06** Graph. R-23 "yes ok": positions are nodes with canonical name + aliases; techniques typed edges, submissions terminal. R-34 "Keep in mind that some positions have multiple names": aliases first-class, searchable, shown beneath the canonical name. Architectural.
- **D-07** Import layer. R-23: imported rows carry `source`, `source_id`, `source_version`; "later imports update imported rows only, never the user's additions or edits". `.claude/rules/data.md:25` names the discriminator: "a re-import upserts only rows whose `origin` is `seed` and that have no user override" — hence `origin ∈ seed|user` NOT NULL, and `user_edited_at` is the user-override marker on a seed row. Architectural.
- **D-08** Seed ids. R-28 "under our own stable ids": the converter mints a UUID v4 per (source, source_id) once and keeps it in the seed file across taxonomy releases, so two installs and a future upload share ids. The repository still mints ids for user rows (`.claude/rules/data.md`). Architectural.
- **D-09** Core vs extended. R-28 "Curated core (≈40–60 positions, ≈150 techniques) visible by default; full converted graph as an optional 'extended library'". Architectural.
- **D-10** Signals. R-05 as accepted plus the PO's additions "Per focus the possible to comment as well. Add energy level, belt of sparring partner as free additional context"; R-19 fixes energy 1–5, a free context note and a partner belt per detailed round; whether the session-level belt is its own field is §0.1 #8. Architectural.
- **D-11** Reviews on the session row. Brief prose §5 step 4 ("Review — the same screen in review mode", which cites R-26's no-dialog criterion) plus the legacy `session_reviews` being 1 : 1 in practice: the review folds into `sessions` (`rating`, `what_worked`, `what_failed`, `reviewed_at`). Planner decision, assumed, pending PO (2026-10-31; §0.1 #12, A-12). Architectural.
- **D-12** Rounds and submissions. R-06 "Aggregates per session (rounds, optional submissions landed/taken, optionally tied to a technique)" and "they should also be able to log 1 specific round and the rest globally"; R-19 "zero, one or more" detailed rounds, toggle off by default. Hence `submissions` rows hang off the session (`round_id` nullable) so a technique can be tied with the toggle off; the aggregate counts on `sessions` stay authoritative. Architectural.
- **D-13** Technique attachments. R-04: "Technique attachments are captured from v1 (focus logs, round submissions) so v1.x has data". Architectural.
- **D-14** Cycles. R-07 "Yes Both": 1–3 focuses, default 4 weeks. Architectural.
- **D-15** Slots. R-20 "yes": weekday, time, session type, default focuses from the cycle; two weeks ahead; instances skippable/editable; slots pausable. Architectural.
- **D-16** Algorithm. S-06 "Decide in the grilling session" → R-08 "Yes Deterministic, but in the future the algo might be changed or tweaked"; R-17 "yeah ok" on the state names. Full spec §8 below. Architectural.
- **D-17** Versioning. R-22 "ok": `progression/v1`, defaults and overrides carry the version, one active version, v2 ships with a one-time carry-over/reset notice. Architectural.
- **D-18** Suggestion controls. R-09 "the use must be able to tweak in the settings what can be suggested by th eapp"; R-21 "ok": per-source switches + max 3. Settings contract only.
- **D-19** Rank. R-10 "ok": belt + stripes with promotion dates, kids scale selectable, otherwise hidden. Architectural.
- **D-20** Reminders. R-11 "Ok": local only, off by default, sprint 3. Not architectural.
- **D-21** Data safety. R-12 "make sure the whole app is safe and all personal data is securely encrypted"; export/import/erase in v1, no cloud. Export is the future upload format (R-27), so it carries tombstones and `updated_at`; import merging by id with newest `updated_at` winning is the §0.1 #2 default (the rule a sync would use), export file protection §0.1 #10. Erase-all is the one hard-delete path the product has — recorded in §11 as the exception R-12 ("erase-all in Settings") carves out of `.claude/rules/data.md` "No hard-delete code path"; mechanism: close the connection, delete `matiq.db` + `-wal` + `-shm`, delete the secure-store key, create a new key, reseed taxonomy and settings. Architectural.
- **D-22** Encryption. R-24 "yes do it right fromt he beginning"; R-31 "ok": dev-client only, CocoaPods + EAS Android profile before sprint 1. Key stored with accessibility `WHEN_UNLOCKED_THIS_DEVICE_ONLY` so it never leaves the device (plan fact; constant name to be confirmed against expo-secure-store 58 in sprint 1 — context7 was unavailable this session); database and key excluded from OS backups (§0.1 #11). Architectural (vendor).
- **D-23** App lock. R-25 "Ok but low prio". Not architectural.
- **D-24** UX criteria. R-00, R-26 "yes", R-18 "yes". Testable NFRs in PRODUCT.md §10; the criteria are in both reviewer checklists (`.claude/agents/reviewer-design.md:90-94`, `.claude/agents/reviewer-code.md:80-83`, commit bec9bf3); `reviewer-code.md:80` reads the tap criterion as "≤ 2 taps from Home to start logging", which matches §0.1 #7's default. Not architectural.
- **D-25** Taxonomy edits. R-14 "Yes": rename follows the id; delete hides from pickers and keeps history; merge moves history to the survivor and hides the other. Architectural (domain operations).
- **D-26** Units and time. R-15 "Ok". Architectural (storage contract).
- **D-27** Parked content. R-16 "yes they stay out for later". Not architectural.
- **D-28** Resources. R-29 "ok. but keep in mind that more entries should be available in the future" → types as data. Architectural.
- **D-29** Order of work. R-32 "ok". Planner refinement: sprint 1 creates every table (so `sessions.cycle_id`/`slot_id` FKs exist once); sprint 3 adds only reminder columns. Not architectural.
- **D-30** Instructionals. R-33 — v2, ToS risk. Not architectural.
- **D-31** Converter tooling. R-35 "if so we use them" — PRs 4, 5, 6 as reference, reimplemented in TypeScript. Architectural.
- **D-32** Taxonomy sources. R-13 "a framework that works like a graph"; R-28 "ok do that". Architectural (vendor/licence).
- **D-33** Copy. S-07 "English now, i18n-ready". Not architectural.
- **D-34** Design source. S-05. Blocking design requests are those in `design-system/components.md § Open requests` as carried by CO-15 (fonts) and CO-16 (DSR rulings), not only the brief §12 list; `design.md:35` names DSR-12 and DSR-15 as blocking sprint 1. Not architectural.
- **D-35** `settings` vs `app_meta`. `app_meta` (`mobile/src/db/schema/app_meta.ts`) stays machine metadata (schema/seed/export versions); user preferences and algorithm parameters are user-editable rows (`.claude/rules/data.md` "Taxonomy is data, not code"). Architectural.
- **D-36** Gi applicability on techniques. R-28 "gi techniques hand-authored in our layer" requires distinguishing them. Architectural.

## §3 Implementation steps (WHAT, in order; this sprint is docs-only, steps 4+ describe sprint 1 planning inputs)

1. Write `docs/PRODUCT.md` with the twelve required sections and the §12 register covering every R- and S-id.
2. Write `docs/decisions.md` (Repo · Product · Data · Algorithm · Frontend and design · Privacy and publishing · Process), every bullet dated 2026-10-31 with its id; R-30 marked provisional.
3. Commit the three files; push; signal.
4. (Sprint 1 planning input) Taxonomy pipeline design per D-31/D-32: vendored snapshot → parser → pose canonicalisation → edge-type derivation from tags → name cleaning → curated-core list → seed JSON with fixed ids → attribution file.
5. (Sprint 1 planning input) Migration 0001 from §4; `descriptions.json` for every column; migration Jest test; seed loader with the D-07 re-import rule.

## §4 Data requirements (full)

Conventions: `text` unless stated; booleans as `integer` 0/1 with a check; dates `YYYY-MM-DD` local; timestamps ISO-8601 UTC. Every table also has `id` PK, `created_at`, `updated_at`, `deleted_at` (seam). "Imported" tables add `origin` NOT NULL (check `origin IN ('seed','user')`), `source` (nullable; check `source IS NULL OR source IN ('grapplemap','grapple-flows','matiq-seed')`; check `origin = 'user' OR source IS NOT NULL`), `source_id` (nullable), `source_version` (nullable), `user_edited_at` (nullable). Every enum and range below is a schema `check()` (`.claude/rules/data.md`); "or null" means the check admits NULL. Uniqueness "among live rows" is enforced in the domain (SQLite partial unique indexes are allowed as a second line via custom migration).

| table | columns (beyond seam) | constraints |
|---|---|---|
| `session_types` (imported: seed) | `name` NOT NULL · `sort_order` integer NOT NULL | name unique among live |
| `positions` (imported) | `slug` NOT NULL · `canonical_name` NOT NULL · `description` · `notes` (user, never re-imported) · `parent_position_id` FK positions · `tier` NOT NULL | `tier ∈ CORE\|EXTENDED`; slug unique among live; parent ≠ self |
| `techniques` (imported) | `slug` NOT NULL · `name` NOT NULL · `type` NOT NULL · `from_position_id` FK NOT NULL · `to_position_id` FK · `applies_to` NOT NULL default BOTH · `description` · `notes` · `tier` NOT NULL | `type ∈ TRANSITION\|GUARD_PASS\|SWEEP\|ESCAPE\|TAKEDOWN\|SUBMISSION`; `to_position_id IS NULL ⇔ type = SUBMISSION`; `applies_to ∈ GI\|NOGI\|BOTH` |
| `aliases` (imported) | `target_kind` NOT NULL · `target_id` NOT NULL · `name` NOT NULL | `target_kind ∈ POSITION\|TECHNIQUE`; (kind, target, lower(name)) unique among live |
| `subjects` (imported: seed) | `name` NOT NULL · `description` | name unique among live |
| `sessions` | `session_type_id` FK NOT NULL · `status` NOT NULL default PLANNED · `starts_at` NOT NULL (UTC) · `local_date` NOT NULL · `duration_minutes` integer · `rating` integer · `intensity` integer · `energy` integer · `context_note` · `what_worked` · `what_failed` · `rounds_count` integer · `submissions_landed` integer · `submissions_taken` integer · `cycle_id` FK · `slot_id` FK · `completed_at` · `reviewed_at` · (sprint 3) `pre_reminder_id` · `post_nudge_id` | `status ∈ PLANNED\|COMPLETED\|SKIPPED`; rating/intensity/energy 1–5 or null; `duration_minutes` > 0 or null; `rounds_count`, `submissions_landed`, `submissions_taken` ≥ 0 or null; `local_date GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]'`; domain: COMPLETED ⇒ ≥ 1 live focus row with `is_actual` |
| `session_focuses` | `session_id` FK NOT NULL · `focus_kind` NOT NULL · `focus_ref_id` NOT NULL · `is_planned` bool NOT NULL · `is_actual` bool NOT NULL · `needs_work` bool NOT NULL default 0 · `rating` integer · `comment` · `hit_count` integer · `caught_count` integer · `sort_order` integer NOT NULL | `focus_kind ∈ POSITION\|SUBJECT` (`data.md:24`; widened to TECHNIQUE in v1.x); `needs_work = 0 OR is_actual = 1`; `rating IS NULL OR is_actual = 1`; rating 1–5 or null; `hit_count` ≥ 0 or null; `caught_count` ≥ 0 or null; `is_planned = 1 OR is_actual = 1`; (session, kind, ref) unique among live |
| `session_techniques` | `session_id` FK NOT NULL · `session_focus_id` FK · `technique_id` FK NOT NULL · `note` | (session, focus, technique) unique among live |
| `rounds` | `session_id` FK NOT NULL · `round_no` integer NOT NULL · `partner_belt` · `outcome` · `duration_minutes` integer · `note` | `round_no` ≥ 1; `duration_minutes` > 0 or null; `partner_belt` ∈ belt list (§4.1) or null; `outcome ∈ DOMINANT\|EVEN\|DOMINATED` or null (§0.1 #1); (session, round_no) unique among live |
| `submissions` | `session_id` FK NOT NULL · `round_id` FK (null = logged at session level, R-06) · `direction` NOT NULL · `technique_id` FK · `note` | `direction ∈ LANDED\|TAKEN`; domain: a `round_id` must belong to `session_id` |
| `cycles` | `name` · `starts_on` NOT NULL · `ends_on` NOT NULL · `note` | `ends_on > starts_on`; both `GLOB` date pattern as `local_date`; domain: 1–3 focuses, no overlap (§0.1 #5) |
| `cycle_focuses` | `cycle_id` FK NOT NULL · `focus_kind` NOT NULL · `focus_ref_id` NOT NULL · `sort_order` integer NOT NULL | kind check as above; (cycle, kind, ref) unique among live; domain cap 3 |
| `slots` | `weekday` integer NOT NULL · `start_time` NOT NULL (`HH:MM`) · `duration_minutes` integer · `session_type_id` FK NOT NULL · `use_cycle_focuses` bool NOT NULL default 1 · `paused_at` | `weekday` 1–7 (Mon = 1, R-15); `start_time GLOB '[0-2][0-9]:[0-5][0-9]'`; `duration_minutes` > 0 or null |
| `rank_entries` | `scale` NOT NULL · `belt` NOT NULL · `stripes` integer NOT NULL default 0 · `awarded_on` NOT NULL · `note` | `scale ∈ ADULT\|KIDS`; `belt` ∈ §4.1 union; `stripes` 0–6; `awarded_on` `GLOB` date pattern; domain: belt valid for scale, stripes ≤ 4 unless BLACK |
| `resource_types` (imported: seed) | `name` NOT NULL · `sort_order` integer NOT NULL | seed: Instructional, Video, Article, Book, Other |
| `resources` (imported) | `title` NOT NULL · `url` · `author` · `resource_type_id` FK NOT NULL · `notes` · `status` NOT NULL default TO_WATCH | `status ∈ TO_WATCH\|WATCHED` |
| `resource_links` | `resource_id` FK NOT NULL · `target_kind` NOT NULL · `target_id` NOT NULL | `target_kind ∈ TECHNIQUE\|POSITION\|SUBJECT\|CYCLE`; (resource, kind, target) unique among live |
| `settings` | `key` NOT NULL unique · `value` NOT NULL (JSON text) · `value_type` NOT NULL | `value_type ∈ BOOL\|INT\|STRING\|JSON`; keys in §4.2 |
| `algorithm_params` | `algorithm_version` NOT NULL · `key` NOT NULL · `value` real NOT NULL · `default_value` real NOT NULL · `min` real NOT NULL · `max` real NOT NULL | (version, key) unique among live; `min ≤ value ≤ max` |
| `taxonomy_merges` | `target_kind` NOT NULL · `from_id` NOT NULL · `into_id` NOT NULL · `payload` NOT NULL (JSON: moved row ids and prior values) · `undone_at` | `target_kind ∈ POSITION\|SUBJECT\|TECHNIQUE` |
| `app_meta` (exists) | `key`, `value` | keys: `schema_version`, `taxonomy_release`, `export_schema_version`, `db_key_created_at` |

### §4.1 Belt lists
ADULT: `WHITE BLUE PURPLE BROWN BLACK`. KIDS (IBJJF): `WHITE GREY_WHITE GREY GREY_BLACK YELLOW_WHITE YELLOW YELLOW_BLACK ORANGE_WHITE ORANGE ORANGE_BLACK GREEN_WHITE GREEN GREEN_BLACK`. `partner_belt` accepts the union.

### §4.2 Settings keys (defaults in `mobile/src/domain/settings/defaults.ts`; rows created on first launch)
`algorithm.version` = `"v1"` · `suggest.lastNeedsWork` true · `suggest.cycle` true · `suggest.needsWork` true · `suggest.notTrainedLately` true · `suggest.max` 3 · `log.detailedRounds` false · `rank.scale` `"ADULT"` · `library.showExtended` false · `theme.override` `"SYSTEM"` · `reminders.preSession.enabled` false · `reminders.preSession.leadMinutes` 60 · `reminders.postSession.enabled` false · `reminders.postSession.delayMinutes` 90.

### §4.3 Algorithm params v1 (key · default · bounds)
`windowWeeks` 8 [2, 26] · `staleDays` 21 [7, 90] · `minSessions` 3 [2, 10] · `trendImproving` 0.5 [0.1, 2] · `needsWorkThreshold` 0.5 [0.1, 1] · `wNeedsWork` 0.4 [0, 1] · `wHitCaught` 0.25 [0, 1] · `wGap` 0.2 [0, 1] · `wTrend` 0.15 [0, 1] · `hitCaughtMinEvents` 3 [1, 20].

## §5 Repository / domain API surface

Domain functions are pure (`clock`, `newId` injected); repositories wrap them in a transaction and expose live queries where marked. Codes are the `DomainError` registry for sprint 1–3.

| function | input | output | DomainError codes | live |
|---|---|---|---|---|
| `sessions.create` | type, starts_at, planned focuses[], cycle_id?, slot_id? | Session | `SESSION_TYPE_REQUIRED`, `FOCUS_REF_NOT_FOUND`, `FOCUS_KIND_INVALID`, `FOCUS_DUPLICATE` | — |
| `sessions.log` (create-or-complete) | session_id?, type, focus rows (actual, rating, needs_work, comment, counts), techniques[], aggregates, session signals, rounds[]? | Session (COMPLETED) | `SESSION_NEEDS_ACTUAL_FOCUS`, `NEEDS_WORK_REQUIRES_ACTUAL`, `RATING_REQUIRES_ACTUAL`, `RATING_OUT_OF_RANGE`, `FOCUS_*` | — |
| `sessions.review` | session_id, rating, what_worked, what_failed, per-focus flags | Session | `RATING_OUT_OF_RANGE`, `NEEDS_WORK_REQUIRES_ACTUAL` | — |
| `sessions.skip` / `sessions.softDelete` / `sessions.undoDelete` | session_id | Session | `SESSION_NOT_FOUND` | — |
| `sessions.today`, `sessions.next`, `sessions.recent(n)` | — | Session[] | — | yes |
| `suggestions.forPlanning` | settings, sessions in window, cycle, progression states | FocusRef[] ≤ max with source label | — | — |
| `taxonomy.listPositions/Techniques/Subjects` | showExtended, query (matches aliases) | rows with aliases | — | yes |
| `taxonomy.rename` | kind, id, name | row (`user_edited_at` set) | `TAXONOMY_ROW_DELETED` | — |
| `taxonomy.softDelete` / `undoDelete` | kind, id | row | `TAXONOMY_ROW_DELETED` | — |
| `taxonomy.merge` | kind, from_id, into_id | MergeResult (+ `taxonomy_merges` row) | `TAXONOMY_SELF_MERGE`, `TAXONOMY_MERGE_KIND_MISMATCH`, `TAXONOMY_ROW_DELETED` | — |
| `taxonomy.undoMerge` | merge_id | — | `MERGE_ALREADY_UNDONE` | — |
| `taxonomy.addAlias` / `removeAlias` | target, name | Alias | `ALIAS_DUPLICATE` | — |
| `taxonomy.createTechnique` / `update` | from, to?, type, applies_to | Technique | `TECHNIQUE_TARGET_REQUIRED`, `TECHNIQUE_SUBMISSION_HAS_TARGET`, `FOCUS_REF_NOT_FOUND` | — |
| `taxonomy.importRelease` | seed JSON, installed release | ImportReport (added/updated/skipped-user-edited) | `SEED_FORMAT_UNSUPPORTED` | — |
| `progression.compute` (v1) | focus refs, completed sessions in window, params, today | `{ref, state, flagged, explanation[]}[]` | `PARAM_OUT_OF_RANGE` | — |
| `progression.explain` | one result | signal rows for the "why" sheet | — | — |
| `algorithmParams.get/set/resetAll` | version, key, value | rows | `PARAM_UNKNOWN`, `PARAM_OUT_OF_RANGE` | yes |
| `settings.get/set` | key, value | Setting | `SETTING_UNKNOWN`, `SETTING_TYPE_MISMATCH` | yes |
| `cycles.create/update/end`, `cycles.active` | focuses (1–3), dates | Cycle | `CYCLE_FOCUS_LIMIT`, `CYCLE_DATES_INVALID`, `CYCLE_OVERLAP` | yes (active) |
| `slots.create/update/pause/resume`, `slots.generate(horizonDays=14)` | weekday, time, type | Slot / generated Session[] | `SLOT_WEEKDAY_INVALID`, `SLOT_TIME_INVALID` | yes (list) |
| `rank.add/update`, `rank.current`, `rank.history` | scale, belt, stripes, awarded_on | RankEntry | `RANK_BELT_INVALID_FOR_SCALE`, `RANK_STRIPES_INVALID` | yes |
| `resources.create/update/link/unlink` | fields, target | Resource | `RESOURCE_LINK_TARGET_NOT_FOUND` | yes (per target) |
| `rounds.upsert`, `rounds.deriveAggregates` | session_id, rounds[] (each with its submissions) | Round[] / aggregates | `ROUND_NO_DUPLICATE`, `ROUND_NOT_IN_SESSION` | — |
| `submissions.upsert` | session_id, submissions[] (`round_id` optional, `technique_id` optional) | Submission[] | `ROUND_NOT_IN_SESSION`, `FOCUS_REF_NOT_FOUND` | — |
| `data.export` | — | JSON document v1, handed to the OS share sheet (§0.1 #10) | — | — |
| `data.import` | JSON document | ImportReport | `IMPORT_FORMAT_UNSUPPORTED`, `IMPORT_VERSION_UNSUPPORTED` | — |
| `data.eraseAll` | confirmation token | — (closes the connection, deletes `matiq.db`/`-wal`/`-shm` and the key, creates a new key, reseeds; §11) | — | — |

## §6 Edge cases (full)

- **Rename vs history** — rename updates `canonical_name`/`name` in place; sessions show the new name; `user_edited_at` set so re-import skips the row. Whether the old name becomes an alias is §0.1 #9 (default: pre-ticked option).
- **Which edits set `user_edited_at`** — only edits to imported fields: `slug`, `canonical_name`/`name`, `description`, `type`, `from_position_id`/`to_position_id`, `applies_to`, `tier`, `parent_position_id`, and `title`/`url`/`author`/`resource_type_id` on resources. The user fields `notes`, `status` (resources) and user-added aliases never set it; a soft delete sets `deleted_at`, which also excludes the row from re-import.
- **Soft delete vs history** — pickers filter `deleted_at IS NULL`; historical rows keep the reference and render the name with a "(removed)" suffix; progression keeps computing for deleted focuses only if they have a live `session_focuses` row in the window, shown under "Removed".
- **Merge folding** — when a session has both loser and survivor rows: keep survivor; booleans OR; rating = survivor's if non-null else loser's; counts summed; comments concatenated. References moved, by kind — position merge: `session_focuses`, `cycle_focuses`, `resource_links` (POSITION), `aliases`, `techniques.from_position_id`/`to_position_id`, children's `parent_position_id`; subject merge: `session_focuses`, `cycle_focuses`, `resource_links` (SUBJECT); technique merge: `session_techniques`, `submissions.technique_id`, `resource_links` (TECHNIQUE), `aliases`. The loser's canonical name and aliases become aliases of the survivor; resulting self-loop edges are kept (not forbidden); duplicate rows after re-pointing fold as above. `taxonomy_merges.payload` holds everything needed for `undoMerge`.
- **Re-import after user edits** — only `origin = 'seed'` rows are candidates; those with `user_edited_at` or `deleted_at` set are skipped and reported; `origin = 'user'` rows are never touched; new imported rows with a slug already used by a user row get the suffix `-gm`; the seed never deletes rows, it soft-deletes only rows the release marks `retired` and the user never touched.
- **Soft-delete semantics on every read** — all repository reads filter `deleted_at IS NULL`, except: slot generation (tombstone check), export (includes tombstones), `undo*` operations, and `taxonomy.importRelease`.
- **Slot tombstones** — a generated session the user deletes or skips must not be regenerated: generator keys on (`slot_id`, `local_date`) over live and deleted rows. Editing a generated session detaches nothing; it keeps `slot_id`.
- **Pausing a slot** — removes future PLANNED, un-edited instances (soft delete) and stops generation; resuming regenerates from today.
- **Time zones** — `starts_at` UTC, `local_date` fixed at write time in the device zone; heatmap and week grouping use `local_date`; travelling changes nothing retroactively. Week starts Monday.
- **Aggregates vs detailed rounds and submissions** — stored aggregates are authoritative for the algorithm; `submissions` rows (with or without a round) are detail; when rows exist the UI offers "fill from rounds/submissions" (`rounds.deriveAggregates`) and warns on mismatch; it never overwrites silently. With `log.detailedRounds` off, the Log screen still offers "which technique?" per landed/taken submission (R-06), stored as a `submissions` row with `round_id` null.
- **Quick log target** — Home's quick log opens today's PLANNED session if exactly one exists (planned focuses pre-ticked), else a new session with the last-used type.
- **Missed planned sessions** — status changes only by the user; for the gap signal (§8) a PLANNED session with `starts_at` more than 24 h in the past and a SKIPPED session both count as planned-not-trained for every planned focus they carry.
- **Algorithm with sparse data** — n = 0 in window → Not trained lately; n < `minSessions` → Improving cannot fire; hit/caught signal omitted (weight redistributed proportionally) when events < `hitCaughtMinEvents`; explanation lists omitted signals as "not enough data".
- **Weights editing** — out-of-bounds rejected (`PARAM_OUT_OF_RANGE`); "reset to defaults" restores `default_value` for the active version only; a v2 ships new rows and a one-time notice (R-22).
- **Kids ↔ adult scale switch** — switching `rank.scale` hides entries of the other scale, never deletes them.
- **Import conflicts** — §0.1 #2 default: same id → newest `updated_at` wins, including tombstones; unknown table or newer `export_schema_version` → `IMPORT_VERSION_UNSUPPORTED`, nothing written (transaction).
- **Export leaves the sandbox** — the JSON is plaintext once shared (§0.1 #10); it is produced into the cache directory, handed to the share sheet and deleted afterwards; the UI shows a one-line warning. Tombstones keep their full content in the export; a purge policy for old tombstones is a carry-over candidate (§12) before any store release.
- **OS backups** — `matiq.db` and the secure-store key are excluded from iCloud/Android backups (§0.1 #11); a device restore starts empty and the user imports their JSON.
- **Erase** — the single hard-delete path (§11): close the connection, delete `matiq.db`, `matiq.db-wal`, `matiq.db-shm`, delete the key from secure store, create a new key, open, migrate, reseed taxonomy and settings; the only explicit-confirm action (§0.1 #2). A DELETE-and-rekey variant is rejected: it leaves WAL content and free pages behind.
- **One-handed, mat-side** — required fields: type + one focus; everything else optional and below the fold; primary action bottom-anchored (`.claude/rules/frontend.md` "Phone-first, one-handed").
- **Dark mode** — tokens only, `theme.override` SYSTEM/LIGHT/DARK (DSR-21).
- **Maestro reach** — flows start with `clearState` or the debug reset route (`.claude/rules/e2e.md`); the reset route reseeds taxonomy and settings; testIDs `<screen>.<element>[.<id>]` per `.claude/rules/frontend.md`.
- **Export/erase readiness** — no user data outside the database (`.claude/rules/privacy.md`); notification ids on `sessions` are the only device-coupled values and are dropped on import.

## §7 Proposed sprint sequence (R-32, brief §14) with owners

| sprint | scope | tables/UI | owners |
|---|---|---|---|
| 1 `foundation` | migration 0001 (all §4 tables), SQLCipher + secure-store key (device-only class, backup exclusion), fonts (CO-15), taxonomy pipeline + seed loader, curated core + extended flag, Log Session, Home (next session, quick log, suggestions from last needs-work only until Progress exists), Library read-only | all tables; UI: Home, Log Session, Library (read) | data-coder (schema, repos, seed loader, `scripts/taxonomy/`), frontend-coder (screens), designer (design.md), tester (Maestro: log in ≤ 2 taps) |
| 2 | Progress (algorithm v1 + explanations), Settings (weights, suggestion sources, rank, detailed-rounds toggle, theme per CO-16/DSR-21, about/attribution), Library editing + aliases + merge/undo, Technique detail with Resources | `taxonomy_merges` ops, `algorithm_params` UI | data-coder, frontend-coder |
| 3 | cycles, slots + generator, local reminders (adds `pre_reminder_id`, `post_nudge_id`), export/import/erase, detailed rounds UI | migration 0002 (reminder columns) | data-coder, frontend-coder |
| v1.x | technique-level progression (one migration widening the `focus_kind` check to TECHNIQUE), app lock, graph visualisation with progression overlay, watch list | `focus_kind` check widened | — |
| v2 | coach tier (backend + accounts, ADR; CO-08), instructional import (R-33), S&C session family | tenant column via additive migration | — |

## §8 Progression algorithm v1 (shape per R-08/R-17/R-22; numeric defaults other than the 8-week window are the planner's, assumed, pending PO — §0.1 #13, A-13)

Window: sessions with `local_date` within the last `windowWeeks × 7` days, soft-deleted sessions and focus rows excluded. Inputs per focus f:
- `n` = COMPLETED sessions with a live focus row for f with `is_actual = 1`; `nr` = those with a non-null `rating`.
- `trend` = mean(rating, later half by date) − mean(rating, earlier half) over the `nr` rated rows, defined when `nr ≥ 2` (odd counts give the middle row to the later half); omitted otherwise.
- `needsWorkRate` = rows with `needs_work = 1` / n (defined when n ≥ 1).
- `gap` = planned-not-trained / planned, where planned = sessions of any status in the window with `is_planned = 1` for f, and planned-not-trained = those where f is not actual and the session is COMPLETED, SKIPPED or PLANNED with `starts_at` more than 24 h in the past; omitted when planned = 0.
- `daysSince` = today − latest actual `local_date` for f over all time (not only the window); ∞ if never.
- `hitRatio` = Σ hit_count / (Σ hit_count + Σ caught_count) over the window, defined when the denominator ≥ `hitCaughtMinEvents`; omitted otherwise.

Rules, first match wins: (1) `n = 0` or `daysSince > staleDays` → **Not trained lately**; (2) `score = wNeedsWork·needsWorkRate + wHitCaught·(1 − hitRatio) + wGap·gap + wTrend·max(0, −trend)/4 ≥ needsWorkThreshold` → **Needs work**, where omitted signals drop out and the remaining weights are rescaled to sum to 1 (if only `needsWorkRate` remains, it is compared alone); (3) `trend` defined, `trend ≥ trendImproving` and `n ≥ minSessions` → **Improving**; (4) else **Steady**. Output: state, `flagged` = `needs_work` of f's row in the most recent COMPLETED session where f is actual (shown as "Flagged", never mixed into the state), and `explanation[]` = `{signal, value | "not enough data", weight, threshold, fired}` plus the rule number. Pure TypeScript in `mobile/src/domain/progression/v1`, computed when Progress opens or a session is reviewed; no background work.

## §9 Open questions

See §0.1 (#1–#14), every item taken at its default — assumed, pending PO (2026-10-31) — and ledgered in `docs/product-spec/assumptions.md` with what changes if the PO rules otherwise. PRODUCT.md marks each as "assumed, pending PO (plan §0.1 #n)"; decisions.md carries no bullet for an assumption.

## §10 Recorded decisions carried forward

- `docs/adr/0001-develop-and-main-release-branching.md` — S-10.
- `docs/adr/0002-agent-workflow-from-cadence.md` — S-11.
- `.claude/rules/data.md` (bec9bf3) — sync seam, schema-first, constraints in schema incl. the focus `{kind, ref_id}` invariant (R-30), imported-row `origin`/`source` rules (R-23), SQLCipher at rest (R-24), taxonomy as data, domain purity, typed errors, `descriptions.json`, live queries in repository hooks.
- `.claude/rules/privacy.md` — on-device only, no analytics SDK without ADR, export + erase before any store release, fictional fixtures.
- `.claude/rules/frontend.md` — tokens only, i18n keys, testIDs, one-handed, design intake gate; the 44 pt / 48 dp amendment (R-18) is a PO/designer action (brief §13).
- `.claude/rules/e2e.md` — `id:` selectors, `clearState`/reset route, never loosen assertions.
- `docs/carry-over.md` — CO-08 (sync ADR, R-27), CO-09 (export/import/erase → sprint 3), CO-14 (CocoaPods → R-31 prerequisite), CO-03 (Android E2E).
- Legacy invariants (`matiq-legacy/db/02_tables.sql`) — carried as §4 constraints.

## §11 Deviations from binding rules (recorded, not silent)

| D | rule | deviation | justification | follow-up |
|---|---|---|---|---|
| D-21 | `.claude/rules/data.md:23` "No hard-delete code path" | `data.eraseAll` deletes the database files and the key | R-12 rules "erase-all in Settings in v1" and `.claude/rules/privacy.md` requires "a full local erase"; the file-level delete is the only way to remove WAL content and free pages | none — recorded here; the rule's intent (no row-level hard delete) holds everywhere else |
| D-08 | `.claude/rules/data.md:23` "UUID v4 … generated in the repository" | seed rows arrive with ids minted once by the converter | R-28 "our own stable ids": two installs and a future upload must share taxonomy ids; the converter-minting mechanism itself is assumed, pending PO (§0.1 #14, A-14) | none — user rows still get repository-minted ids |

## §12 Carry-over candidates (for the orchestrator's close-out; PO-owned files are marked)

| candidate | owner |
|---|---|
| Tombstone purge policy (age-based hard purge of soft-deleted rows) before any store release — a second recorded hard-delete path if adopted | planner |
| Confirm in sprint 1: expo-secure-store 58 accessibility constant for "this device only", iOS backup-exclusion attribute via expo-file-system, Android `allowBackup=false` config; append to `docs/stack-notes.md` | data-coder |
| `resources.author` vs the import column `source` (R-29 says "author/source"): rename to `author_or_source` or keep — decide in sprint 2 design | designer |
| Adult belt list has no coral/red belts (N-01) — add when a user needs them | planner |
