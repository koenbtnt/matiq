# product-spec — PO brief

**Date:** 2026-10-31 · **How the answers were given:** a `grilling` session in the main Claude Code session, three rounds of numbered questions (Q1–Q36, each with a recommended answer worded so that "yes" accepts it), answered by the PO in chat; plus the setup decisions taken earlier the same day through multiple-choice questions, and one side task (GrappleMap PR check). Every quote below is the PO's text as typed, including typos. A "yes/ok/correct" answer accepts the recommended text, which is then the ruling.

Sections: 1 Setup rulings (do not re-ask) · 2 Verbatim answers per round · 3 Rulings R-01…R-35 · 4 Vision and v1 user · 5 Core loop and screens · 6 Domain model carried forward and what changes · 7 Progression algorithm · 8 Data, privacy, publishing readiness · 9 UX constraints · 10 Non-goals v1 · 11 Research facts · 12 Design-system requests pending rulings · 13 Carry-over to open at close · 14 Order of work.

---

## 1. Setup rulings (2026-10-31, planning session — binding, do not re-ask)

| id | ruling | PO's words |
|---|---|---|
| S-01 | Expo / React Native, TypeScript, Expo Router; app in `mobile/`; npm | "Expo / React Native (Recommended)" |
| S-02 | Local-first on device: expo-sqlite + Drizzle, generated migrations, repository layer, pure-TS domain, sync seam; no backend, no auth in v1 | "Local-first on device (Recommended)" |
| S-03 | Single user in v1, built for publishing | "Me first, built for publishing" |
| S-04 | Maestro E2E on simulators; no web target | "Maestro on simulators (Recommended)" |
| S-05 | Design source = the PO's Claude Artifact exported to `design-system/artifact/`, intake by the designer | "I will create a Claude Aretifact for the design" · "Export to design-system/, I extract tokens (Recommended)" |
| S-06 | Progression algorithm shape decided in the grilling (→ R-08, R-17, R-22) | "Decide in the grilling session" |
| S-07 | English copy only, every string through i18n keys | "English now, i18n-ready" |
| S-08 | iOS-first locally; Android via EAS Build | "iOS-first locally, Android via EAS Build (Recommended)" |
| S-09 | Bundle id / package `nl.btnt.matiq`, scheme `matiq`, name matIQ | "nl.btnt.matiq (Recommended)" |
| S-10 | Branching mirrors sugar/cadence: `develop` default, `main` released, PRs only, regular merges (ADR 0001) | "i want the setup to be similar to that of sugar and cadence w.r.t. develop and main branch" |
| S-11 | Development approach = the sugar/cadence agent harness (ADR 0002) | "take the development approche of the (sub)agents in there to base the development of this project on" |
| S-12 | The product, in the PO's first words | "an application that can track BJJ progress and help people to progess their skills. I want people to be able to plan, log, have a retrospective on a trainings sessions. log various aspects of a BJJ session and have an algorithm that checks whether their progression in a certain area of bjj they want to work on, or lack skill. All these things should be able to be altered by the user of the app as well. I want i to be a native Android and Apple app." |

## 2. Verbatim answers per round

### Round 1 (Q1–Q15 asked; Q16 and Q18 added after Q1/Q2 were answered)

First message (interrupted by the PO: "i wanst finshed the rest will folow"):

> * Q1: correct
> * Q2: correct
> * Q3: corect
> * Q4: ok

Second message:

> With all features keep in mind that they have to be user friendly in the app design
>
> * Q4: yes later, but one of the earlier later features
> * Q5:Per focus the possible to comment as well. Add energy level, belt of sparring partner as free additional context.
> * Q6:  Ok But allow for extension of detail here. and the extensions has to be an option for the user later. they should also be able to log 1 specific round and the rest globally.
> * Q7: Yes Both. And allow users to set standard training moments each week so they do not have to manually plan everythin.
> * Q8: Yes Deterministic, but in the future the algo might be changed or tweaked.
> * Q9: Yes, but the use must be able to tweak in the settings what can be suggested by th eapp.
> * Q10: ok
> * Q11: Ok
> * Q12: Yes, make sure the whole app is safe and all personal data is securely encrypted.
> * Q13: One of the first thing that i want to do is find a solid framework where we can gather all position BJJ information from and use that. Idealy this framework can be updated etc and is a framework that works like a graph.
> * Q14: Yes
> * Q15: Ok
> * Q16: yes they stay out for later. Ideally i can monitize this app for coaches to check in on their clients
> * Q17: ask when you are ready.
> * Q18: yes
>
> Keep in mind that some positions have multiple names

### Round 2 (Q17, Q19–Q27)

> * Q17: yeah ok
> * Q19: you should be able tp detaild one ore more rounds, or none.
> * Q20:yes
> * Q21: ok
> * Q22: ok
> * Q23: yes ok. In a later feature i want graph to be visualized in a cool way as well. and also show how you are progressing in different areas of the graph.
> * Q24: yes do it right fromt he beginning
> * Q25: Ok but low prio
> * Q26: yes
> * Q27: yes
>
> There are some well documented public sources, i.e. bjjfanatics that have instrucitonals where a lot of people use that to learn new things. in a later feature i want to do something with these dvd's and scrap their titles etx to be able to add them to you watch list or focus point for that block

### Round 3 (Q28–Q31, Q36)

> * Q28: ok do that
> * Q29: ok. but keep in mind that more entries should be available in the future
> * Q30: positions for now, but this might change later after user tests
> * Q31: ok
> * Q36: ok

### Side task and confirmation

> check in the git of grapplemap if there are PR's that we can use. if so we use them https://github.com/Eelis/GrappleMap/pulls

> Confirmed, write brief

## 3. Rulings

Each ruling: topic · the question's recommended text as accepted (or the PO's own words where they add to it) · consequence for the spec.

| id | topic | ruling (accepted text / PO's words) | consequence |
|---|---|---|---|
| R-00 | User-friendliness | "With all features keep in mind that they have to be user friendly in the app design" | Cross-cutting constraint; made testable in R-26. |
| R-01 | Vision | Personal deliberate-practice companion for one practitioner: plan → train → log actual → review → see improving/lacking. No coach, club, sharing or social in v1. ("correct") | Non-goals §10; v2 direction in R-27. |
| R-02 | v1 surfaces | Exactly: Home (today's plan, next session, quick log), Log Session, Library, Technique detail, Progress, Settings (rank, weights, export/erase), plus the planning flow. ("correct") | Anything else is v1.x; the designed key screens are the spec's screen list. |
| R-03 | Session types | User-editable list seeded with Gi class, No-gi class, Open mat, Private lesson, Competition, Drilling/study. S&C not modelled in v1; the type list is the extension point. ("corect") | `session_type` is data, not an enum. |
| R-04 | Focus granularity | Focus = a tag (position or subject) is the unit planned, logged and scored; techniques are catalogued and optionally attached when logging. Technique-level progression: "yes later, but one of the earlier later features". | Technique attachments are captured from v1 (focus logs, round submissions) so v1.x has data; **first v1.x feature**. See R-30 for the position-as-node refinement. |
| R-05 | Signals per session | Per focus: rating 1–5, needs-work flag, **comment** (PO addition), optional hit/caught counts. Per session: overall rating 1–5, duration, intensity 1–5 (optional), **energy level** (PO addition), **belt of sparring partner "as free additional context"** (PO addition, optional), what worked / what failed free text. | Field-level data requirements; optional fields keep the 30-second log. |
| R-06 | Sparring detail | Aggregates per session (rounds, optional submissions landed/taken, optionally tied to a technique). "Ok But allow for extension of detail here. and the extensions has to be an option for the user later. they should also be able to log 1 specific round and the rest globally." | Detailed rounds exist in the model from v1 behind a Settings toggle (R-19). |
| R-07 | Planning horizon | Per-session plan plus an optional focus cycle (1–3 focuses, default 4 weeks). "Yes Both. And allow users to set standard training moments each week so they do not have to manually plan everythin." | Recurring weekly slots (R-20). |
| R-08 | Algorithm shape | Four states per focus, computed on demand over a rolling window (default 8 weeks) from rating trend, needs-work frequency, planned-vs-actual gap, days since last trained, hit/caught ratio; editable weights/thresholds with reset; every state explains why. "Yes Deterministic, but in the future the algo might be changed or tweaked." | Versioned module (R-22); wording in R-17. |
| R-09 | Suggestions | Suggest focuses when planning: last session's needs-work flags, the cycle, Needs work, Not trained lately; accept or ignore. "Yes, but the use must be able to tweak in the settings what can be suggested by th eapp." | Per-source switches + max count (R-21). |
| R-10 | Rank | Own belt + stripes with promotion dates (history), shown on Home and Progress; kids-rank scale selectable in Settings, otherwise hidden. ("ok") | Rank table; belt colours per the design system. |
| R-11 | Reminders | Local notifications only: pre-session reminder, post-session "log it" nudge, configurable, off by default; in v1 after the core loop. ("Ok") | Sprint 3; resolves DSR-29 as "local, later". |
| R-12 | Data safety | JSON export, JSON import, erase-all in Settings in v1; no cloud backup, no sync. "Yes, make sure the whole app is safe and all personal data is securely encrypted." | Encryption at rest from the start (R-24); app lock (R-25). |
| R-13 | Taxonomy source | "One of the first thing that i want to do is find a solid framework where we can gather all position BJJ information from and use that. Idealy this framework can be updated etc and is a framework that works like a graph." | Research §11; decision R-28. The legacy seed is superseded as the primary seed; it remains the acceptance example for the core loop. |
| R-14 | Taxonomy edits vs history | Rename follows the id everywhere; delete hides from pickers and keeps history; merge moves history to the survivor and hides the other. ("Yes") | Soft delete + merge as domain operations with tests. |
| R-15 | Units and time | Duration in minutes; dates/times in device locale and time zone; weeks start Monday; no unit conversions. ("Ok") | — |
| R-16 | Out-of-scope artifact content | Gym check-in/schedule, coach badge/notes and the instructional-video area stay out of v1. "yes they stay out for later. Ideally i can monitize this app for coaches to check in on their clients" | DSR-26, DSR-27 parked; video → Resources (R-29); monetisation direction R-27. |
| R-17 | Progression wording | States: **Improving**, **Steady**, **Needs work**, **Not trained lately**; "Flagged" is the badge for the user's own needs-work flag, not a computed state. ("yeah ok") | Resolves DSR-17's naming; copy table in the design sprint. |
| R-18 | Hit targets | 44 pt binding on iOS and 48 dp on Android, smaller elements extended with `hitSlop`. ("yes") | Resolves DSR-16; `.claude/rules/frontend.md` and `design-system/RULES.md` R-M1 to be amended by the PO/designer at the next intake. |
| R-19 | Rounds and context | Session aggregates always; **zero, one or more** detailed rounds (partner belt, outcome, submissions, note); session context: energy 1–5, free context note; Settings toggle "detailed rounds" (off by default). "you should be able tp detaild one ore more rounds, or none." | `rounds` table from v1; UI gated by the toggle. |
| R-20 | Recurring training moments | Weekly slots (weekday, time, session type, default focuses from the cycle) generate planned sessions two weeks ahead; instances skippable/editable; slots pausable. ("yes") | Sprint 3. |
| R-21 | Suggestion controls | Settings switches per source (last needs-work, cycle, Needs work, Not trained lately) and a maximum (default 3). ("ok") | — |
| R-22 | Algorithm versioning | `progression/v1` module; defaults and user overrides carry the version; a new algorithm ships as v2 with a one-time carry-over/reset notice; one active version. ("ok") | Settings store `algorithmVersion`. |
| R-23 | Library as a graph with aliases | Positions = nodes with canonical name + aliases (searchable); techniques = typed edges (submissions terminal); imported rows carry `source`, `source_id`, `source_version`; later imports update imported rows only, never the user's additions or edits. "yes ok. In a later feature i want graph to be visualized in a cool way as well. and also show how you are progressing in different areas of the graph." | Graph visualisation with progression overlay = later feature (v1.x/v2); v1 stores no layout data but keeps nodes/edges queryable and progression per node. |
| R-24 | Encryption at rest | SQLCipher via `expo-sqlite`'s `useSQLCipher`, key generated on first launch and kept in Keychain/Keystore via `expo-secure-store`, from the foundation sprint; development on a dev-client build only. "yes do it right fromt he beginning" | CocoaPods and an EAS Android profile become prerequisites (R-31); Expo Go dropped. |
| R-25 | App lock | Optional biometric/passcode lock on app open, v1.x. "Ok but low prio" | Low priority in the backlog. |
| R-26 | UX acceptance criteria (binding) | Log a session in ≤ 30 s and ≤ 2 taps from Home; every screen one-handed in portrait; destructive actions undoable (soft delete + undo toast) instead of confirm dialogs; only type + one focus required; empty states explain the next step; readable in light and dark. ("yes") | Go into `docs/decisions.md` and both reviewer checklists. |
| R-27 | Coach monetisation later | v2: backend + accounts so a coach follows clients as a paid tier. v1 only: sync seam stays, JSON export is versioned and documented as the future upload format, nothing assumes a single user forever. ("yes") | CO-08 driver. |
| R-28 | Taxonomy source decision | Seed from GrappleMap (public domain) converted by our own parser into nodes and typed edges under our own stable ids; canonical names and aliases hand-curated starting from grapple-flows (CC BY 4.0, attribution); edge types derived from tags then reviewed; gi techniques hand-authored in our layer; updates = our own versioned taxonomy releases; BJJGraph structural reference only unless the PO obtains a licence. Curated core (≈40–60 positions, ≈150 techniques) visible by default; full converted graph as an optional "extended library". "ok do that" | Seed pipeline in the foundation sprint; §11 facts. |
| R-29 | Resources | Entity: title, URL, author/source, type (instructional, video, article, …), notes, status (to watch / watched); attachable to a technique, a focus or a cycle; manual entry in v1. "ok. but keep in mind that more entries should be available in the future" | Resource types are data (extensible); later: BJJ Fanatics import (R-33). Resolves DSR-28. |
| R-30 | Positions are the focus nodes (**provisional**) | A focus is a position node of the graph or a subject; progression computed per node. "positions for now, but this might change later after user tests" | Model it so a focus can later reference another node kind without migration pain (focus → `{kind, ref_id}`); revisit after the first user tests (CO). |
| R-31 | Dev-client only | Development, smoke checks and Maestro run against `npx expo run:ios` dev-client builds; CocoaPods (P1) and an `eas build` Android profile are prerequisites before sprint 1; docs drop Expo Go. ("ok") | PO actions; `CLAUDE.md` commands amended by the PO when sprint 1 lands SQLCipher. |
| R-32 | Order of work | Sprint 1 foundation → sprint 2 Progress/Settings/Library editing → sprint 3 cycles, schedule, reminders, export/erase, detailed rounds → v1.x technique progression, app lock, graph view, watch list. ("ok") | §14. |
| R-33 | Instructionals later | "There are some well documented public sources, i.e. bjjfanatics that have instrucitonals where a lot of people use that to learn new things. in a later feature i want to do something with these dvd's and scrap their titles etx to be able to add them to you watch list or focus point for that block" | v2 feature on top of Resources; scraping is subject to the sites' terms of service — recorded as a risk, not designed in v1. GrappleMap's 1208 `ref:` citations are a licence-free first fill (§11). |
| R-34 | Position aliases | "Keep in mind that some positions have multiple names" | Aliases are first-class (R-23); search matches any alias; the Library shows the canonical name with aliases beneath. |
| R-35 | GrappleMap PR tooling | "check in the git of grapplemap if there are PR's that we can use. if so we use them" — checked: PRs 4 (validator), 5 (split/join), 6 (format reference) are usable; adopted as the reference for our TypeScript converter and the one-file-per-record vendored snapshot; reimplemented rather than copied (unmerged contributions). | §11. |

## 4. Vision and the v1 user

matIQ is a personal deliberate-practice companion for a BJJ practitioner: it makes the loop *plan what to work on → train → log what actually happened → review → see where you are improving and where you are lacking* fast enough to do mat-side, and honest enough to trust. The v1 user is the PO (one practitioner, iPhone first), with everything built so publishing to the stores later needs no rework. Multi-user (coach tier) is the v2 direction (R-27).

## 5. Core loop and screens (R-02)

1. **Plan** — a planned session (date, type, planned focuses) created by hand, from a recurring slot (R-20) or from suggestions (R-09); an optional focus cycle (R-07).
2. **Train.**
3. **Log** — Log Session: type, actual focuses (planned ones pre-ticked), per-focus rating/flag/comment/counts, optional techniques, rounds aggregate, optional detailed rounds, session rating/duration/intensity/energy/context, what worked / what failed. ≤ 30 s path: type, focuses, per-focus rating, done.
4. **Review** — the same screen in review mode (R-26: no separate dialog step); needs-work flags feed suggestions.
5. **Progress** — per-focus state with "why", window and weights editable, rank history.

Screens: Home · Log Session · Library (nodes, edges, aliases; editing in sprint 2) · Technique detail (edges, resources, notes) · Progress · Settings (rank, kids scale, weights, suggestion sources, detailed-rounds toggle, recurring slots, reminders, export/import/erase, theme follows system).

## 6. Domain model carried forward and what changes

Carried forward from the legacy prototype (`/Users/koen/Projects/matiq/matiq-legacy/db/02_tables.sql`): positions with a parent/variant relation; techniques as edges from a position to a position with a type (TRANSITION, GUARD_PASS, SWEEP, ESCAPE, TAKEDOWN, SUBMISSION; submissions terminal); sessions with PLANNED/COMPLETED/SKIPPED; the planned-vs-actual focus rows with `is_planned`, `is_actual`, `needs_work` (`needs_work ⇒ is_actual`; completing needs ≥ 1 actual); reviews with rating 1–5 and what worked / what failed; the suggestion engine (needs-work of the last reviewed session); the dashboards (consistency heatmap, focus-balance radar, planned-vs-actual gaps) as inputs to Progress.

Changes: focus = position node or subject, no separate tag table (R-30, provisional); aliases on nodes (R-34); `source`/`source_id`/`source_version` on imported rows and a user layer that wins (R-23); per-focus rating/comment/counts and session intensity/energy/context (R-05); `rounds` (R-19); `session_type` as data (R-03); cycles and recurring slots (R-07, R-20); rank history (R-10); resources (R-29); settings for weights/sources/toggles with `algorithmVersion` (R-21, R-22); every table with the sync seam (`.claude/rules/data.md`); export/import/erase (R-12).

## 7. Progression algorithm (R-08, R-17, R-22)

Inputs per focus over the window (default 8 weeks, editable): trend of per-focus ratings; count of needs-work flags; planned-vs-actual gap (planned but not trained); days since last trained; hit/caught ratio when logged. Output per focus: Improving · Steady · Needs work · Not trained lately, plus the explanation (each signal's value, weight and the threshold it crossed). Pure, deterministic TypeScript in `mobile/src/domain/progression/v1`, computed when Progress opens or a session is reviewed; no background jobs. Weights, thresholds and window are rows in Settings with "reset to defaults"; defaults are the planner's proposal, tuned once real data exists. The manual flag is shown as "Flagged", never mixed into the computed state.

## 8. Data, privacy, publishing readiness

On-device only (`.claude/rules/privacy.md`); SQLCipher from sprint 1 with the key in the device keychain (R-24); JSON export/import and erase-all in v1 (R-12), the export format versioned as the future upload format (R-27); no analytics or crash SDK without an ADR; optional app lock later (R-25). No network calls carry user data in v1; the only outbound thing is a Resource URL the user opens in the browser (R-29).

## 9. UX constraints (R-00, R-26, R-18)

Binding acceptance criteria: ≤ 30 s and ≤ 2 taps to log; one-handed portrait; undo over confirm dialogs; minimal required fields; explanatory empty states; light and dark; 44 pt / 48 dp hit targets; plain-language progression states; the design system's principles ("mat-side first", "belt as language", "quiet until it counts", "native at heart").

## 10. Non-goals v1

Coach, club, sharing, social, accounts, sync, cloud backup; strength & conditioning modelling; per-partner analytics; hosting or embedding video; scraping instructional sites (v2, terms-of-service risk); a web app; Android local E2E until an SDK exists (CO-03); BJJGraph data import without a licence.

## 11. Research facts (verified 2026-10-31; also appended to `docs/stack-notes.md`)

- **GrappleMap** (https://github.com/Eelis/GrappleMap, public domain per LICENSE and README FAQ; master last pushed 2023-02-06): `GrappleMap.txt` 2,674,097 bytes, **2086 records = 601 positions + 1485 transitions**, validated with PR 4's `scripts/validate-db.py` (0 errors, 11 warnings: untagged positions); PR 5's `scripts/db-files.py` split/join round-trips byte-identically into `NNNNN_<position|transition>_<slug>.txt` files; PR 6's `CONTRIBUTING.md` documents the format (name line with literal `\n`; `tags:` `[a-z0-9_]+`; `ref:` citation; `properties:` top/bottom/detailed/bidirectional; pose blocks of 4 × 69 base-62 digits; 1 block = position, ≥ 2 = transition). Nodes connect by identical poses, transitions may reorient endpoints → endpoint resolution needs pose canonicalisation (reference implementation: https://github.com/matheusmota-dev-br/bjj3d `packages/data/scripts/build-data.ts`, MIT/Apache). **1208 records carry `ref:` citations** (author, title, timestamp) → Resources seed. 161 distinct tags (e.g. half_guard 55, full_guard 52, side_control 46, back 28, turtle 30, single_leg_takedown 44, kimura 28, butterfly_sweep 26). Names informal (206 contain "w/"). No gi techniques, no aliases, no stable ids. Open PRs 3, 7, 8 and closed PR 1 are not useful.
- **BJJGraph** (https://github.com/diogoseca/bjjgraph, PolyForm Noncommercial 1.0.0; 133 positions, 1,025 transitions, 353 submissions, typed, gi/no-gi, stable slugs; last push 2026-10-30): best structure, not usable commercially without permission → reference only (R-28).
- **grapple-flows/bjj-data** (https://github.com/grapple-flows/bjj-data, CC BY 4.0 data): 45 alias entries with slugs + legality tables per ruleset (IBJJF, ADCC, NAGA, Grappling Industries) with gi/no-gi flags → alias starting point and rules gating.
- **Wikipedia** "List of Brazilian jiu-jitsu techniques" (CC BY-SA 4.0, ~200 flat entries) → alias hints by hand only; **Wikidata** < ~50 BJJ items. Commercial databases (BJJ Heroes, BJJ Fanatics, Grapplers Guide, Submeta, Jiu Jitsu X): no open data or API found.
- **expo-sqlite SQLCipher**: `useSQLCipher` config-plugin property in the SDK 58 docs (https://docs.expo.dev/versions/v58.0.0/sdk/sqlite.md); needs a native build (dev client), key supplied at open; Drizzle's expo-sqlite driver sits on the same connection. Jest keeps running on plain better-sqlite3.

## 12. Design-system requests pending rulings (from the intake, `design-system/components.md § Open requests`)

Resolved by this brief: DSR-16 (R-18), DSR-17 naming (R-17), DSR-26/27 parked (R-16), DSR-28 → Resources link (R-29), DSR-29 → local reminders later (R-11). Still needing design work in the artifact before the sprint that uses them: DSR-17 "why is this flagged" pattern, DSR-18 planned-vs-actual focus, DSR-19 rating input, DSR-20 taxonomy and weights editor, DSR-21 Settings with theme override, DSR-22 export/erase + undo pattern, DSR-6…9 states (pressed, error, empty, loading), DSR-1…4 contrast fixes, DSR-11/13/14 off-scale values, DSR-23/24/25 platform details, destinations, app icon.

## 13. Carry-over to open at close

- Taxonomy conversion pipeline (GrappleMap → nodes/edges with pose canonicalisation, name cleaning, edge-type derivation, curated core selection) — design in sprint 1 planning.
- Optional: contact the BJJGraph author about a commercial licence (R-28).
- Amend `.claude/rules/frontend.md` (44 pt / 48 dp, dev-client only, Expo Go removed) and `CLAUDE.md` commands when sprint 1 lands SQLCipher (PO-owned files).
- Revisit R-30 (positions as focus nodes) after the first user tests.
- Terms-of-service assessment before any instructional scraping (R-33).
- Font loading (CO-15) and the DSR rulings (CO-16) stay open.

## 14. Order of work (R-32)

| sprint | scope |
|---|---|
| 1 `foundation` | data model + migrations (sessions, focuses as nodes/subjects, rounds, resources, rank, settings, cycles/slots tables may be deferred to 3), SQLCipher + keychain key, Inter/Archivo fonts, taxonomy seed pipeline with the curated core and the extended-library flag, Log Session, Home (next session, quick log, suggestions), Library read-only |
| 2 | Progress (algorithm v1 with explanations), Settings (weights, suggestion sources, rank, detailed-rounds toggle), Library editing + aliases, Technique detail with Resources |
| 3 | focus cycles, recurring slots, local reminders, export/import/erase, detailed rounds UI |
| v1.x | technique-level progression, app lock, graph visualisation with progression overlay, resources watch list |
| v2 | coach tier with backend/accounts (R-27), instructional import (R-33), S&C session family (R-03) |
