# Design — Sprint 0 `product-spec`

## §0 Summary for builders

There is no UI in this sprint: `product-spec` is docs-only (`docs/PRODUCT.md`, `docs/decisions.md`, the ADRs and the arc42 document; `plan.md §0` "Nothing under `mobile/` changes"), so this file carries no screen spec, no copy table and no testID table. The design intake produced `design-system/tokens.json` v1 (`"_status": "intake"`) on branch `chore/design-intake-tokens`; PR #3 was merged into `develop` on 2026-10-31 (merge commit `687186e`), but this branch (`feature/product-spec`) was cut before that merge and still carries the starter (`tokens.json` `"version": 0`, `"_status": "starter"`), so no screen spec can be written from it. Sprint 1 must branch from a `develop` that contains `687186e`, and `tokens.ts` must be regenerated from v1 before the first screen spec. The design-system requests below come from `docs/product-spec/po-brief.md §12` ("still needing design work"), with their content in `design-system/components.md § Open requests` (read on `origin/chore/design-intake-tokens`). Each one is assigned to the first sprint that needs it, per `plan.md §7`: sprint 1 covers Home, Log Session and Library (read-only); sprint 2 covers Progress, Settings, Library editing with aliases and merge/undo, and Technique detail with Resources; sprint 3 covers cycles, slots, reminders, export/import/erase and detailed rounds. Each request has to be resolved in the artifact and re-exported before its sprint's design spec is written (D-34).

**Before sprint 1 (`foundation`)**
- **DSR-18**: planned vs actual focus in Log Session, with a visual distinction that does not rely on colour alone, and a component for it.
- **DSR-19**: a rating input and rating display per focus area, either reusing the intensity picker or as a new component (Log Session).
- **DSR-6**: a pressed state for every interactive component, the switch "off" colours, and the stepper at its limit and disabled.
- **DSR-7**: an error state for inputs and forms, for example a session that cannot be saved without an actual focus.
- **DSR-8**: empty states for Home ("no sessions yet") and Library ("no search results"). The Progress and chart empty states can wait for sprint 2.
- **DSR-9**: loading states: a busy button, and a list skeleton.
- **DSR-1**: a light-theme `text-placeholder` that reaches 4.5:1 on `bg-raised` (Log Session inputs, Library search).
- **DSR-2**: an input boundary and focus ring at 3:1 or more in light (Log Session, Library search).
- **DSR-11**: off-scale type sizes on Home, Library, Log Session and Technique, each mapped to a style or added as a new style.
- **DSR-13**: off-grid spacing values (6, 10, 14, 18, 22, 34, and the 62 top padding), each mapped to a `space-*` token or added as a new token.
- **DSR-14**: off-scale radii (2, 3, 6, 9, 10, 12, 14, 20), each mapped to a radius token or added as a new token.
- **DSR-23**: platform details: keyboard avoidance with the bottom action bar, the Android list-row chevron, Android back on sheets, and how the date picker opens inside the Log sheet.
- **DSR-24 (part)**: the destinations reached from sprint 1 screens: "See all" on Home and the filters sheet in Library.
- **DSR-25**: the app icon and wordmark as exported assets. `plan.md §7` does not tie these to a sprint; sprint 1 is the earliest build that needs an icon.

**Before sprint 2**
- **DSR-17**: progression states (improving, needs work, flagged) as tokens and a component, plus the "why is this flagged" explanation pattern (Progress).
- **DSR-20**: screens and components for editing the taxonomy and the algorithm weights, with history (Library editing, Settings).
- **DSR-21**: the Profile/Settings screen, including the System/Light/Dark theme override and the settings rows.
- **DSR-22 (part)**: the undo pattern for Library merge/undo. The export and erase UI and the destructive confirmation (hold-to-erase, `plan.md §0.1` #2) are only needed for sprint 3.
- **DSR-3**: a chart inactive-bar colour at 3:1 or more on `bg-surface`, or a ruling that the text alternative is enough (Progress bar chart).
- **DSR-4**: belt edges below 3:1 (rank card on Progress, rank in Settings, belt tags on Technique).
- **DSR-8 (part)**: empty states for Progress and for a period with no data in the chart.
- **DSR-24 (part)**: the promotion-history destination (Progress).

**Later, or not named in brief §12**
- **DSR-24 (rest)**: notifications, save to plan and schedule (sprint 3).
- **DSR-5** (media-overlay tokens), **DSR-10** (sheet spring parameters), **DSR-12** (Archivo width axis in React Native, and the wordmark), **DSR-15** (conflicts between the components board and the key screens): these are open in `components.md § Open requests` but not listed in brief §12. DSR-12 (fonts) and DSR-15 (Home and Log Session values) block sprint 1 screen specs just as much as the requests above.
- Resolved by the brief: DSR-16 (R-18), DSR-17 naming (R-17), DSR-26 and DSR-27 parked (R-16), DSR-28 becomes the Resources link (R-29), DSR-29 becomes local reminders in sprint 3 (R-11).
