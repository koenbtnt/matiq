# Decisions — binding record

Every bullet is dated and tagged with the ruling it derives from (`docs/product-spec/po-brief.md`, PO rulings of 2026-10-31). Quotes are the PO's words. This file changes only with a quoted, dated user ruling (`.claude/rules/docs.md`). Provisional items are marked as such. Spec: `docs/PRODUCT.md`; derivation: `docs/product-spec/plan.md`.

## Repo

- 2026-10-31 · S-01 · Expo / React Native, TypeScript, Expo Router; app in `mobile/`; npm. "Expo / React Native (Recommended)".
- 2026-10-31 · S-04 · Maestro E2E on simulators; no web target. "Maestro on simulators (Recommended)".
- 2026-10-31 · S-08 · iOS-first locally; Android via EAS Build. "iOS-first locally, Android via EAS Build (Recommended)".
- 2026-10-31 · S-09 · Bundle id / package `nl.btnt.matiq`, scheme `matiq`, name matIQ. "nl.btnt.matiq (Recommended)".
- 2026-10-31 · S-10 · `develop` default, `main` released, PRs only, regular merges (ADR 0001). "similar to that of sugar and cadence w.r.t. develop and main branch".
- 2026-10-31 · R-31 · Development, smoke checks and Maestro run on `npx expo run:ios` dev-client builds; CocoaPods and an `eas build` Android profile are prerequisites before sprint 1; docs drop Expo Go. "ok".
- 2026-10-31 · R-35 · GrappleMap PRs 4 (validator), 5 (split/join), 6 (format) are the reference for our TypeScript converter and the one-file-per-record vendored snapshot; reimplemented, not copied. "if so we use them".

## Product

- 2026-10-31 · S-12 · The product: "an application that can track BJJ progress and help people to progess their skills … plan, log, have a retrospective on a trainings sessions … an algorithm that checks whether their progression in a certain area of bjj they want to work on, or lack skill. All these things should be able to be altered by the user of the app as well. I want i to be a native Android and Apple app."
- 2026-10-31 · S-03 · Single user in v1, built for publishing. "Me first, built for publishing".
- 2026-10-31 · R-00 · "With all features keep in mind that they have to be user friendly in the app design" — cross-cutting; made testable in R-26.
- 2026-10-31 · R-01 · Personal deliberate-practice companion for one practitioner: plan → train → log actual → review → see improving/lacking. No coach, club, sharing or social in v1. "correct".
- 2026-10-31 · R-02 · v1 surfaces are exactly Home, Log Session, Library, Technique detail, Progress, Settings, plus the planning flow. "correct".
- 2026-10-31 · R-03 · Session types are a user-editable list seeded with Gi class, No-gi class, Open mat, Private lesson, Competition, Drilling/study; S&C not modelled in v1. "corect".
- 2026-10-31 · R-04 · Focus = a position or subject is the unit planned, logged and scored; techniques catalogued and optionally attached when logging. Technique-level progression: "yes later, but one of the earlier later features" — first v1.x feature.
- 2026-10-31 · R-05 · Per focus: rating 1–5, needs-work flag, comment, optional hit/caught counts. Per session: rating 1–5, duration, intensity 1–5, energy level, what worked / what failed; partner belt "as free additional context" (own field or part of the context note: assumption `docs/product-spec/assumptions.md` A-8). "Per focus the possible to comment as well. Add energy level, belt of sparring partner as free additional context."
- 2026-10-31 · R-06 · Sparring aggregates per session "(rounds, optional submissions landed/taken, optionally tied to a technique)"; detailed rounds as a user-enabled extension. "Ok But allow for extension of detail here. and the extensions has to be an option for the user later. they should also be able to log 1 specific round and the rest globally."
- 2026-10-31 · R-07 · Per-session plan plus an optional focus cycle (1–3 focuses, default 4 weeks); recurring weekly training moments. "Yes Both. And allow users to set standard training moments each week so they do not have to manually plan everythin."
- 2026-10-31 · R-09 · Suggestions when planning from last session's needs-work flags, the cycle, Needs work, Not trained lately; accept or ignore. "Yes, but the use must be able to tweak in the settings what can be suggested by th eapp."
- 2026-10-31 · R-10 · Own belt + stripes with promotion dates (history), shown on Home and Progress; kids-rank scale selectable in Settings, otherwise hidden. "ok".
- 2026-10-31 · R-11 · Local notifications only: pre-session reminder, post-session "log it" nudge, configurable, off by default; in v1 after the core loop (sprint 3). "Ok".
- 2026-10-31 · R-16 · Gym check-in/schedule, coach badge/notes and the instructional-video area stay out of v1. "yes they stay out for later. Ideally i can monitize this app for coaches to check in on their clients" — the monetisation motive behind R-27.
- 2026-10-31 · R-19 · Session aggregates always; zero, one or more detailed rounds (partner belt, outcome, submissions, note); session context: energy 1–5, free context note; Settings toggle "detailed rounds", off by default. "you should be able tp detaild one ore more rounds, or none."
- 2026-10-31 · R-20 · Weekly slots (weekday, time, session type, default focuses from the cycle) generate planned sessions two weeks ahead; instances skippable/editable; slots pausable. "yes".
- 2026-10-31 · R-21 · Settings switches per suggestion source and a maximum (default 3). "ok".
- 2026-10-31 · R-25 · Optional biometric/passcode app lock, v1.x. "Ok but low prio".
- 2026-10-31 · R-27 · v2: backend + accounts so a coach follows clients as a paid tier. v1: sync seam stays, JSON export versioned and documented as the future upload format, nothing assumes a single user forever. "yes" (motive quoted under R-16).
- 2026-10-31 · R-29 · Resources: title, URL, author/source, type (data, extensible), notes, status to watch / watched; attachable to a technique, a focus or a cycle; manual entry in v1. "ok. but keep in mind that more entries should be available in the future".
- 2026-10-31 · R-33 · Instructional catalogues (e.g. BJJ Fanatics) as a later feature on top of Resources; scraping subject to terms of service — risk, not designed in v1. "in a later feature i want to do something with these dvd's and scrap their titles etx".

## Data

- 2026-10-31 · S-02 · Local-first on device: expo-sqlite + Drizzle, generated migrations, repository layer, pure-TS domain, sync seam; no backend, no auth in v1. "Local-first on device (Recommended)".
- 2026-10-31 · R-12 · JSON export, JSON import, erase-all in Settings in v1; no cloud backup, no sync. "make sure the whole app is safe and all personal data is securely encrypted." Erase-all is thereby the single ruled exception to `.claude/rules/data.md` "No hard-delete code path" (mechanism in plan §11). Export file protection, OS-backup exclusion and import semantics are assumptions (`docs/product-spec/assumptions.md` A-10, A-11, A-2).
- 2026-10-31 · R-13 · Taxonomy comes from an updatable, graph-shaped framework. "a solid framework where we can gather all position BJJ information from … Idealy this framework can be updated etc and is a framework that works like a graph."
- 2026-10-31 · R-14 · Rename follows the id everywhere; delete hides from pickers and keeps history; merge moves history to the survivor and hides the other. Soft delete + merge are domain operations with tests. "Yes". Whether a rename keeps the old name as an alias is an assumption (`docs/product-spec/assumptions.md` A-9).
- 2026-10-31 · R-15 · Duration in minutes; dates/times in device locale and time zone; weeks start Monday; no unit conversions. "Ok".
- 2026-10-31 · R-23 · Library is a graph: positions = nodes with canonical name + aliases; techniques = typed edges, submissions terminal; imported rows carry `source`, `source_id`, `source_version`; later imports update imported rows only, never the user's additions or edits. Graph visualisation with progression overlay = later. "yes ok." Codified in `.claude/rules/data.md` (`origin` = `seed` rows without user override are the only re-import targets).
- 2026-10-31 · R-24 · SQLCipher via `expo-sqlite` `useSQLCipher`, key generated on first launch and kept in Keychain/Keystore via `expo-secure-store`, from the foundation sprint; dev-client builds only. "yes do it right fromt he beginning".
- 2026-10-31 · R-28 · Seed from GrappleMap (public domain) through our own parser into nodes and typed edges under our own stable ids; canonical names and aliases hand-curated from grapple-flows (CC BY 4.0, attribution); edge types derived from tags then reviewed; gi techniques hand-authored; updates = our own versioned taxonomy releases; BJJGraph structural reference only unless licensed. Curated core (≈40–60 positions, ≈150 techniques) visible by default; full graph as an optional "extended library". "ok do that".
- 2026-10-31 · R-30 · **Provisional.** Positions are the focus nodes; a focus is a position node or a subject; progression computed per node; modelled as focus → `{kind, ref_id}` so another node kind can follow without migration pain. "positions for now, but this might change later after user tests". Revisit after the first user tests. The shape is now the `.claude/rules/data.md` focus invariant (commit bec9bf3).
- 2026-10-31 · R-34 · Aliases are first-class; search matches any alias; the Library shows the canonical name with aliases beneath. "Keep in mind that some positions have multiple names".

## Algorithm

- 2026-10-31 · S-06 · Algorithm shape decided in the grilling → R-08, R-17, R-22. "Decide in the grilling session".
- 2026-10-31 · R-08 · Four states per focus, computed on demand over a rolling window (default 8 weeks) from rating trend, needs-work frequency, planned-vs-actual gap, days since last trained, hit/caught ratio; editable weights/thresholds with reset; every state explains why. "Yes Deterministic, but in the future the algo might be changed or tweaked."
- 2026-10-31 · R-17 · State names: Improving, Steady, Needs work, Not trained lately; "Flagged" is the badge for the user's own needs-work flag, never a computed state. "yeah ok".
- 2026-10-31 · R-22 · `progression/v1` module; defaults and user overrides carry the version; a new algorithm ships as v2 with a one-time carry-over/reset notice; one active version; Settings store the algorithm version. "ok".

## Frontend and design

- 2026-10-31 · S-05 · Design source = the PO's Claude Artifact exported to `design-system/artifact/`, intake by the designer. "I will create a Claude Aretifact for the design" · "Export to design-system/, I extract tokens (Recommended)". Open design requests (`design-system/components.md § Open requests`, CO-15 fonts, CO-16 DSR rulings — DSR-12 and DSR-15 block sprint 1) are resolved before the sprint that uses them.
- 2026-10-31 · S-07 · English copy only, every string through i18n keys. "English now, i18n-ready".
- 2026-10-31 · R-18 · Hit targets 44 pt on iOS and 48 dp on Android; smaller elements extended with `hitSlop`. "yes". `.claude/rules/frontend.md` and `design-system/RULES.md` to be amended by the PO/designer at the next intake.
- 2026-10-31 · R-26 · Binding UX acceptance criteria: log a session in ≤ 30 s and ≤ 2 taps from Home; every screen one-handed in portrait; destructive actions undoable (soft delete + undo toast) instead of confirm dialogs; only type + one focus required; empty states explain the next step; readable in light and dark. "yes". In both reviewer checklists (`.claude/agents/reviewer-design.md:90-93`, `.claude/agents/reviewer-code.md:80-83`, commit bec9bf3). The exact reading of "≤ 2 taps" is an assumption (`docs/product-spec/assumptions.md` A-7).

## Privacy and publishing

- 2026-10-31 · R-12 (see Data) · Encryption at rest from the start (R-24), app lock later (R-25); export/import/erase in v1.
- 2026-10-31 · R-24 (see Data) · No user data leaves the device; EAS artefacts carry none (`.claude/rules/privacy.md`). The SQLCipher key uses a this-device-only keychain class (plan fact, D-22).
- 2026-10-31 · R-27 (see Product) · Export format is the future upload format; versioned.
- 2026-10-31 · R-28 (see Data) · Licences: GrappleMap public domain; grapple-flows CC BY 4.0 — attribution shown in the app; BJJGraph (PolyForm Noncommercial) not imported without a licence.
- 2026-10-31 · R-33 (see Product) · No scraping of instructional sites in v1; terms-of-service assessment first.

## Process

- 2026-10-31 · S-11 · Development approach = the sugar/cadence agent harness (ADR 0002). "take the development approche of the (sub)agents in there to base the development of this project on".
- 2026-10-31 · R-32 · Order of work: sprint 1 foundation → sprint 2 Progress / Settings / Library editing → sprint 3 cycles, schedule, reminders, export/erase, detailed rounds → v1.x technique progression, app lock, graph view, watch list → v2 coach tier, instructional import, S&C. "ok".
- 2026-10-31 · R-31 (see Repo) · Dev-client only; `CLAUDE.md` commands amended by the PO when sprint 1 lands SQLCipher.
