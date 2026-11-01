# progress-settings — design

## §0 Summary for builders

Designer: Thaleia · 2026-11-01 · branch `feature/progress-settings` · sprint 2. Input: `docs/progress-settings/plan.md` §0, §0.1 (rulings Q1–Q5), §3, §5.1, §6.6, §6.7, §10, §11.3, §12, §16. Notation, the hit-slop rule (`hit` = 44 pt iOS / 48 dp Android; visual `v` < `hit` gets `(hit − v)/2` slop per axis) and the wrapped-chip `rowGap` rule are those of `docs/foundation/design.md` § Token notation and apply unchanged.

**Screens in scope (source · section):**

| screen | route | design-system source | § |
|---|---|---|---|
| Shell: 5 tabs, back label (CO-42), theme override (Q5) | `(tabs)/_layout.tsx`, every Stack `_layout.tsx`, `app/_layout.tsx` | cm:273-288; R-N1, R-N4, R-T1 | §4.1 |
| Progress: state list + heatmap + planned-vs-trained + rank history (Q1 (a)) | `(tabs)/progress/index` | cm:212-236, :238-247, :306-315, :384-399; R-C5, R-A3 | §4.2 |
| "Why" sheet | `progress-why` (formSheet) | cm:249-261, :162-177 | §4.3 |
| Profile = Settings (Q3 (a)) + Algorithm, Suggestions, Rank, About | `(tabs)/profile/{index,algorithm,suggestions,rank,about}` | cm:97-127, :179-200, :238-247; DSR-20, DSR-21 | §4.4 |
| Library editing: create, rename + alias, soft delete + undo, aliases, merge + undo | `(tabs)/library/index`, `library/position/[id]`, `library-edit` (formSheet) | cm:71-95, :141-155, :249-271, :369-375 | §4.5 |
| Technique detail + Resources | `(tabs)/library/technique/[id]`, `resource-edit` (formSheet) | cm:157-177, :238-247, :317-319 | §4.6, §4.7 |
| Dev reset backup line | `dev/reset` | plan §10 | §4.8 |

**Decisions index:** P-01…P-36 in §3 (every plan §13 design-level choice: sheet vs in-screen why → sheet; heatmap sizing; icons; plus the system gaps). No PO question is open.

**Components used (shipped, `mobile/src/components/`):** Button (primary · secondary · ghost · destructive) · IconButton · TextArea · SearchField · SegmentedControl · Stepper · Chip (filter · selectable · add) · Tag · Badge (flagged) · BeltRank + BeltSwatch · Card · ListRow · SectionHeader · SheetChrome · BottomActionBar · Toast · EmptyState · ErrorBanner · LoadingState · MainTabBar · Icon · Txt · Touch.
**Extended (props):** MainTabBar (5 columns) · Icon (+7 glyphs) · BeltRank/BeltSwatch (17 belts, band) · SectionHeader (`icon`, `action`) · SheetChrome (`cancelLabel`) · Stepper (`editable` value) · RankCard (`testIDPrefix`, history) · SetRankSheet (scale, edit, delete).
**New shared:** `TextField` (cm:71-78, single line) · `SwitchRow` (cm:120-127, native `Switch`). **New feature components:** §10.1.

**Gaps decided within tokens (all in §8):** DSR-6 (switch off), DSR-8, DSR-11, DSR-13, DSR-14, DSR-15 (kids split belt), DSR-17 (states), DSR-20 (editing screens), DSR-21 (Profile/Settings), DSR-23, the heatmap ramp, the in-sheet undo.

**Copy table:** §6, 359 rows (`<screen>.<element>`, no duplicates, none clashes with `en.json`), 1 changed string (`errors.RANK_BELT_INVALID_FOR_SCALE`). **testID table:** §7, 140 rows / 143 ids (headings `## §7 testID table` / `## §8 Deviations` kept for `testids.test.ts`), with the §11.3 flow per id. Two flow strings differ from plan §11.3 examples on purpose (P-27, P-30).

**Data the UI consumes:** §10.2 — plan §5 names; two additive requests for `data-contracts.md` (endpoint soft-delete flags on `TechniqueDetail`; aliases as `AliasRow[]` with ids on `usePosition` / `useTechnique`), nothing that changes plan §5 signatures.

**Contrast:** §9.1 — 18 new pairs computed (2 text, 16 non-text). Every heatmap digit passes AA in both schemes (4.82–12.38); the level fills alone do not separate L0/L1 in light (1.03) or L2/L3 in dark (1.15), so the count digit is the channel (R-A1, R-C5) and a ramp request goes to the user (§11). Not yet appended to `docs/design-system-contrast.md` (commit scope = this file only; orchestrator action).

**Design-system requests:** DSR-30 heatmap ramp, DSR-31 switch-off and settings group patterns (§11). Non-blocking: each is decided in §8.

**Open questions:** none. Signal: DESIGN COMPLETE.

## §1 Scope

Sprint 2 screens on the five-tab shell (plan §10, PS-09…PS-19, rulings Q1 (a), Q3 (a), Q5): the Progress tab with the four computed states, their "why" sheet and the three secondary panels; the Profile tab as the Settings surface; Library editing for positions, techniques and subjects; Technique detail with Resources; the iOS back-label fix; the theme override. Sources: `design-system/RULES.md` (R-*), `design-system/components.md` (`cm:<line>`), `design-system/tokens.json` v1 via `mobile/src/theme/tokens.ts` (`tk:<line>`), the shipped components and screens of sprint 1 (`docs/foundation/design.md`, cited `fd §n`). Out of scope: cycles/slots, reminders, export/erase, the detailed-rounds UI (only its switch), session-type and resource-type list editing (Q2 (b)), coral/red belts (Q4 (b)), parked DSR-26…29. Every value is a `tokens.ts` name, a cited rule, or a §8 row. The artifact is not changed.

## §3 Decisions

| # | question (source) | decision | reason |
|---|---|---|---|
| P-01 | Why: sheet or in-screen (plan §10, §13) | formSheet route `progress-why?kind=<POSITION\|SUBJECT>&refId=`, `sheetAllowedDetents: [0.5, 1]` (medium / large) | R-N3 names medium/large detents; read-only content needs no action bar; the gap panel reuses the same route |
| P-02 | How a row shows its state (plan §10 "state (text + icon)") | section header per state (icon + label + count, PS-04 order) **and** a state line in each row (`progress.row.subtitle` = state label · rule sentence) | the row stays self-describing after scrolling and in Maestro; R-C5 |
| P-03 | State icons (R-47, R-M5) | IMPROVING `arrow.up.right`/`trending_up` · STEADY `arrow.right`/`trending_flat` · NEEDS_WORK `exclamationmark.triangle`/`warning` · NOT_TRAINED `clock.arrow.circlepath`/`history`; all `textSecondary`, never accent | R-3 quiet surfaces; R-C2 (accent not for warning states); names verified in `sf-symbols-typescript/dist/index.d.ts` and `expo-symbols/build/android/symbols.json` |
| P-04 | Heatmap levels (plan §6.6 keys `legend.none\|one\|two\|three`) | L0 = `bgRaised`, no digit · L1 = `accentTint` + digit `accentText` · L2 = `accentGraphic` + digit `accentOn` · L3 (≥ 3) = `accentText` fill + digit `inverseFg`. Every cell with ≥ 1 session shows its count | the only accent steps in `tk:198-203`/`:241-246`; the digit carries the count at AA (§9.1), so the grid is never colour alone (R-C5, R-A1); ramp weakness → DSR-30 |
| P-05 | Heatmap sizing (plan §13 "heatmap sizing") | 7 equal columns `flex: 1`, `aspectRatio: 1`, `columnGap`/`rowGap` `spacing[1]`, inside a Card with padding `spacing[4]`: cell ≈ 42 pt at 390, ≈ 47.7 pt at 430 (derived, not a token); no week-label column; a range caption names the dates | fills the width at both frames with no breakpoint; a label column would shrink cells below the digit's 200 % size |
| P-06 | Out-of-window, future and today cells (plan §6.6) | out-of-window (`inWindow: false`, past): transparent + `size.borderWidth` `borderDefault`, digit `textSecondary` · future: transparent, no border, no digit · today: `size.borderWidthFocus` ring `textPrimary` over the level fill | "dimmed" without an opacity token; the ring passes 3:1 against the card in both schemes (§9.1), unlike `accentBorder` light |
| P-07 | Heatmap cell interaction (plan §6.6 "long-press/`accessibilityLabel`") | cells are not pressable; the count is drawn in the cell and in `accessibilityLabel` | the visible digit makes the long-press redundant; fewer hidden gestures (R-1) |
| P-08 | Planned-vs-trained row visual | text "x of y" + a 4-high bar (`textPrimary` fill on `borderDefault` track, the drawn position-card bar cm:337) + text parts (not trained · pending · unplanned) | bar passes 3:1 (contrast doc :70); text carries every number |
| P-09 | Rank history panel (Q1 (a)) | RankCard (fd §4.4.7) + up to 5 promotion rows of the active scale + ghost `progress.rank.allHistory` → `profile/rank` | R-10 "shown on Home and Progress"; full list lives in Profile › Rank |
| P-10 | Panel placement with an unbounded state list | one `SectionList` (virtualised, `frontend.md`); panels in `ListFooterComponent` in plan order heatmap → planned-vs-trained → rank | plan §10 order; virtualised rows |
| P-11 | Profile structure (Q3 (a), plan §10) | rank card on top; groups Progress · Planning · Logging · Library · Appearance · Rank · About (plan order); navigation rows push Algorithm, Suggestions, Rank, About; switches and the theme segmented control sit inline | one-thumb: every setting is one tap from the tab; R-4 native push navigation |
| P-12 | Param input (plan §10 "steppers/sliders", §11.2 "rejects out-of-range") | Stepper with an **editable value** (number keyboard) per param; step per key (§4.4.2 table); commit on −/+ tap, blur or submit → `setParam` | steppers are the system control (cm:111); typed entry is what can be out of range; no slider exists in the system |
| P-13 | Save model for settings | every change commits at once (no Save button) | live preview (plan §10); settings are reversible by editing back; R-26 |
| P-14 | Reset to defaults (plan §10, §12) | secondary Button → `resetParams` → toast `toast.defaultsRestored` + Undo = `setParam` for each key of the pre-reset snapshot | plan §12 "frontend keeps the snapshot" |
| P-15 | Switch off colours (DSR-6) | native `Switch`: `trackColor={{ false: borderStronger, true: accentFill }}`, `ios_backgroundColor={borderStronger}`, `thumbColor` = `accentOn` on, `textPrimary` off | thumb vs track 8.35 (L) / 7.49 (D) off, 10.77 on (§9.1); thumb position carries state (cm:127) |
| P-16 | Library edit entry points (plan §10 "row long-press/overflow") | Library title row gets a plus IconButton per segment → `library-edit` (create); Position/Technique detail get a header "Edit" → `library-edit` (edit, which holds rename, aliases, merge and delete); subject rows open `library-edit` directly. **No long-press or overflow menu** | the system has no menu / action-sheet component; long-press is undiscoverable and not one-handed; every action stays reachable by testID |
| P-17 | Merge presentation (plan §10 "`merge` formSheet") | merge is an inline panel of `library-edit` (body swaps; header and action bar change), not a second sheet | react-native-screens: nested sheets unsupported on Android (`types.d.ts:491`, fd D-A21); the merge always starts from an edit sheet |
| P-18 | Alias add/remove inside a sheet (R-M3 undo toast) | edit mode only: `addAlias` / `removeAlias` apply at once; a removal shows an inline undo line in the aliases block (`removeAlias` → `undoRemoveAlias`); create mode shows a hint instead | the root ToastHost renders under a native formSheet, so a toast there is invisible; aliases need the row id |
| P-19 | Rename keeps the old name (R-50/A-9) | selectable chip "Keep “old” as an alias", checked by default, shown in edit mode once the name differs; sends `keepOldNameAsAlias` | R-50 default; reversible per edit |
| P-20 | Delete (R-26, PS-13) | destructive button at the end of the edit sheet → `softDelete` → dismiss → `router.dismissTo('/library')` → toast `toast.<kind>Deleted` + Undo → `undoDelete` | fd §4.3.7 pattern; no confirm dialog (DSR-22) |
| P-21 | Position pickers in the edit sheet (plan §10 "reusing FocusSearch") | new `PositionPicker` (SearchField + `useLibraryPositions(query)` rows, inline) | `FocusSearch` hard-codes `log.*` testIDs and subjects; `useLibraryPositions` already honours `library.showExtended` (hooks/index.ts:47-49, plan §12) |
| P-22 | Resource status UI (R-29) | row: selectable chip "Watched" (check when WATCHED, `role="checkbox"`); sheet: SegmentedControl To watch / Watched | one-tap toggle mat-side; text + check, never colour |
| P-23 | Technique detail notes (plan §10 "inline or via sheet") | notes are shown read-only on detail and edited in `library-edit` | one edit surface per row; no inline text field on a list screen |
| P-24 | Rank entry delete (plan §10 "swipe/soft delete") | no swipe: the Set-rank sheet in edit mode has a destructive "Delete entry" → `rank.softDelete` → toast + Undo | no gesture library or swipe pattern in the system; same delete pattern as P-20 |
| P-25 | Kids belts (R-10, M:103-106 "50 % band", DSR-15) | kids colours `beltKids*`; `*_WHITE` / `*_BLACK` draw a centred band of 50 % of the belt height in `beltWhite` / `beltBlack` across the fill, under the bar; bar `beltBar`; edge = fill (R-T4 keeps `borderStrong` for WHITE/BLACK only) | the artifact names the band, not its geometry; name always shown (DSR-4) |
| P-26 | Theme override control (Q5, PS-09) | SegmentedControl System · Light · Dark on Profile; root layout calls `Appearance.setColorScheme` | R-T1 names exactly these three; segmented = 2–4 options (cm:98) |
| P-27 | About attribution ids (plan §11.3 example `about.attribution.grapple-flows.link`) | `<slug>` = kebab-case of `source.name`: `grapplemap`, `bjj-data-by-grapple-flows`, `matiq-curated-layer`; the tester asserts `about.attribution.bjj-data-by-grapple-flows.link` | deterministic from `attribution.json` without a seed change |
| P-28 | Back label (CO-42, PS-18) | `headerBackButtonDisplayMode: 'minimal'` on the root, library, progress and profile Stacks: iOS chevron only, Android arrow unchanged | plan PS-18; R-N4 |
| P-29 | Tab icons and order (R-45, PS-10) | Home · Library · Log (centre) · Progress · Profile; Progress `chart.line.uptrend.xyaxis`/`monitoring`, Profile `person.crop.circle`/`account_circle` | R-45 final order; names verified as P-03 |
| P-30 | Consistency summary plurals (plan §6.6 "{{completed}} sessions on {{activeDays}} days") | composed from plural parts: "1 session on 1 day in the last 8 weeks"; the §11.3 flow asserts this text, not "1 sessions on 1 days" | correct English; plural keys `_one`/`_other` |
| P-31 | Number formatting (R-Y3) | counts integers; rates and weight shares `Intl.NumberFormat` percent (0 decimals); score, thresholds and decimal params `Intl.NumberFormat` max 2 decimals; trend signed with 1 decimal; all tabular | the param screen edits the same decimals the why sheet shows |
| P-32 | Toasts and sheets | a toast is shown only after its sheet is dismissed (create, delete, merge, resource, rank) | P-18 reason; fd D-A9 precedent |
| P-33 | Rule-1 sentence (plan §12 "rule-1 sentence cites `n`, not days") | three variants: never trained · stale (days > staleDays) · not in the window (n = 0, days ≤ staleDays) | the UI picks by the `daysSince` signal |
| P-34 | Detailed-rounds switch (R-19, plan §10 "copy says so") | the switch stores `log.detailedRounds`; hint says the round-by-round logging comes in a later version | no sprint number in user copy |
| P-35 | Cycle suggestion switch (R-09, plan §5.2 CYCLE empty) | shown and stored; hint says focus cycles come in a later version | R-21: a switch per source |
| P-36 | Single-line text inputs (names, title, URL, author, alias) | new `TextField` = cm:71-78 single-line: label caption above, `size.inputHeight`, `radius.md`, `bgRaised`, `borderDefault`, `textStyle.input`, padding `spacing[3]` (DSR-13 14→12), focus `borderWidthFocus` `accentBorder` | the system specifies it; not yet built |

## §4 Screens

All screens: portrait, iOS and Android, light and dark (same token names, R-T2), fluid width (content 350 pt at 390, 390 pt at 430; no breakpoint). Background `bgBase`, gutter `spacing[5]` (R-L1). Tab-screen top = safe-area inset + `spacing[4]`; tab-screen scroll content is padded at the bottom by the tab-bar height + `spacing[5]` (fd §4). Every `<Text>` sets `maxFontSizeMultiplier={textMaxScale.<style>}`; every number uses `fontVariant: fontVariantNumeric`. Pressed state per fd §8 DSR-6 (0.72 opacity iOS / ripple `borderStrong` Android).

### §4.1 Shell

**§4.1.1 Tabs.** `(tabs)/_layout.tsx` declares `index`, `library`, `log`, `progress`, `profile` in that order. `MainTabBar` (fd §4.1.2, cm:273-288) renders **five** equal columns: Home · Library · Log (centre action, unchanged) · Progress · Profile (R-45). Icons: `home`, `library` (existing), `progress` = `chart.line.uptrend.xyaxis` / `monitoring`, `profile` = `person.crop.circle` / `account_circle` (P-29). Labels `tabs.progress`, `tabs.profile`; `role="tab"`, `accessibilityState={{ selected }}`. At 390 pt each column is 78 pt (≥ `size.tabPillWidth` 56 on Android). Reading order: Home, Library, Log, Progress, Profile.

**§4.1.2 Stacks and routes.**

```
app/_layout.tsx                Stack: (tabs) · log-session · set-rank · progress-why · library-edit · resource-edit (formSheets) · session/[id] · dev/reset
app/(tabs)/progress/_layout.tsx  Stack: index (headerShown false)
app/(tabs)/profile/_layout.tsx   Stack: index (headerShown false) · algorithm · suggestions · rank · about
app/(tabs)/library/_layout.tsx   Stack: index · position/[id] · technique/[id]
```

Push headers (profile sub-screens, technique detail): the library Stack's `screenOptions` (bgBase, no shadow, `textPrimary` tint, `headline` title font, `library/_layout.tsx:9-18`), titles from §6. Sheets: fd §4.3.1 frame (`presentation: 'formSheet'`, `sheetCornerRadius: radius.xl`, `sheetGrabberVisible: false`, `contentStyle` `bgSurface`); detents per sheet below.

**§4.1.3 Back label (CO-42, P-28).** Every Stack's `screenOptions` adds `headerBackButtonDisplayMode: 'minimal'`: iOS shows the chevron only (never "(tabs)"), Android the arrow (unchanged). iOS edge swipe and Android back are never disabled (R-N4). The native back button keeps its system accessibility label ("Back").

**§4.1.4 Theme override (Q5, PS-09).** `_layout.tsx` reads `useSetting('theme.override')` and calls `Appearance.setColorScheme(SYSTEM → null, LIGHT → 'light', DARK → 'dark')` before the splash hides; `useTheme`, native headers, sheets and `StatusBar style="auto"` follow. No screen branches on the setting (R-T2).

### §4.2 Progress (`(tabs)/progress/index`; plan §10, PS-04)

Data: `useProgress()` (`ProgressOverview`), `useRankHistory()`, `useCurrentRank()`.

**§4.2.1 Frame.** One `SectionList` on `bgBase`, gutter `spacing[5]`, `stickySectionHeadersEnabled` (default on iOS, set `true` on Android too), `SectionList` `contentContainerStyle` gap via `SectionSeparatorComponent` height `spacing[3]`.
- **ListHeaderComponent** (column, `gap: spacing[1]`): title `textStyle.titleL` `progress.title`, `accessibilityRole="header"` (DSR-11 32/36 → titleL, fd §8); caption `textSecondary` `progress.window` (weeks = `params.windowWeeks`, start = `windowStart`, end = `today`, dates by `Intl.DateTimeFormat` day + month short); `spacing[4]` below.
- **Sections** in PS-04 order NEEDS_WORK · NOT_TRAINED · STEADY · IMPROVING, then REMOVED (results with `removed: true`, any state). Empty sections are omitted.
- **Section header** (SectionHeader cm:317-319, extended with `icon`): row min height `hit`, background `bgBase` (sticky), `gap: spacing[2]`; leading Icon (P-03) `size.iconInline` `textSecondary`; title `textStyle.titleM` `progress.section.header` (state = `progress.state.<STATE>`, REMOVED = `progress.section.removed`); `accessibilityRole="header"`.
- **ListFooterComponent:** the three panels (§4.2.3–§4.2.5), column, `gap: spacing[4]`, `paddingTop: spacing[5]`.

**§4.2.2 Progress row** (`ProgressRow`, built on ListRow cm:238-247, no icon tile per fd §8 cm:241).
- Pressable row, min height `size.listRowMinHeight`, `paddingVertical: spacing[2]`, bottom `size.borderWidth` `borderDefault`, row `gap: spacing[3]`, `flexWrap: 'wrap'`.
- Text column (flex 1, `gap: spacing[1]`): name `textStyle.rowTitle` `textPrimary` (`removed` → `common.removed`), `numberOfLines={2}`; state line `textStyle.caption` `textSecondary` `progress.row.subtitle` (state + rule sentence, P-02, P-33), `numberOfLines={2}`.
- Rule sentence by `rule`: 1 → `progress.rule.1.never` (`daysSince` unavailable) / `progress.rule.1.stale` (`daysSince.value > staleDays`) / `progress.rule.1.window` (otherwise); 2 → `progress.rule.2` (score, `params.needsWorkThreshold`); 3 → `progress.rule.3` (`trend.value`, `n`); 4 → `progress.rule.4` (`n`).
- Trailing: Flagged Badge when `flagged` (fd §4.4.5 spec: `size.badgeHeight`, `radius.sm`, `semantic.badgeComp`, flag glyph `size.iconCheck`, `common.badge.flagged`), then chevron `size.iconChevron` `textSecondary`.
- Tap → `progress-why?kind=<ref.kind>&refId=<ref.refId>`. A11y: `role="button"`, label `progress.row.a11y`.

**§4.2.3 Consistency heatmap** (`ConsistencyCard`; bar-chart card pattern cm:393-399; plan §6.6; P-04…P-07).
- Card: `bgSurface`, `size.borderWidth` `borderDefault`, `radius.lg`, padding `spacing[4]` (cm:223), column `gap: spacing[3]`. `testID` `progress.consistency.card`.
- Header (column, `gap: spacing[1]`): overline `textSecondary` `progress.consistency.title`; summary `textStyle.headline` `textPrimary` `progress.consistency.summary` (tabular); streak line `textStyle.statMeta` `accentText` `progress.consistency.streak` (text only, no glyph), shown when `currentStreakWeeks ≥ 1` (week-strip streak cm:310; `accentText` on `bgSurface` 5.43 / 11.36, contrast doc :32); minutes caption `textSecondary` `progress.consistency.minutes`.
- Empty line (when `totals.completed = 0`): caption `textSecondary` `progress.consistency.empty`. The grid still renders (plan §12 "full zero grid plus the empty copy").
- **Weekday header:** a row of 7 `flex: 1` cells, `columnGap: spacing[1]`, each the narrow weekday (`Intl.DateTimeFormat` `weekday: 'narrow'` of `weeks[0].days[j].localDate`) in `textStyle.overline` `textSecondary`, centred; `accessibilityElementsHidden`.
- **Grid** (`testID` `progress.consistency`): one row per `WeekRow` (oldest first), each a `flexDirection: 'row'` with `columnGap: spacing[1]`; rows separated by `rowGap: spacing[1]`. Cell: `flex: 1`, `aspectRatio: 1`, `radius.sm` (DSR-14 6→8 rule), centred digit `textStyle.caption` tabular.

| cell | fill | border | digit |
|---|---|---|---|
| future (`future`) | none | none | none |
| outside window (`!inWindow && !future`) | none | `size.borderWidth` `borderDefault` | `completed` if ≥ 1, `textSecondary` |
| in window, 0 completed (L0) | `bgRaised` | none | none |
| 1 completed (L1) | `accentTint` | none | `1` in `accentText` |
| 2 completed (L2) | `accentGraphic` | none | `2` in `accentOn` |
| ≥ 3 completed (L3) | `accentText` | none | the count in `inverseFg` |
| today (any level) | as its level | `size.borderWidthFocus` `textPrimary` | as its level |

- Cell a11y: `accessible`, no role, label = parts joined ", ": `progress.consistency.cell` (date `Intl` weekday long + day + month long, sessions plural, minutes) or `progress.consistency.cell.future`; then `progress.consistency.cell.skipped` (when `skipped ≥ 1`), `progress.consistency.cell.notLogged` (when `pending ≥ 1` and the date is ≤ today), `progress.consistency.cell.outside` (when `!inWindow`), `progress.consistency.cell.today`. Plan §11.2 asserts these labels. `testID` `progress.consistency.cell.<localDate>`.
- Range caption under the grid: `textSecondary` `progress.consistency.range` (first and last grid dates).
- **Legend** (row, `gap: spacing[3]`, `flexWrap: 'wrap'`): caption `textSecondary` `progress.consistency.legend.title`, then four items (row, `gap: spacing[1]`): a swatch `spacing[4]` × `spacing[4]`, `radius.xs`, in the L0/L1/L2/L3 fill, + caption `textSecondary` `progress.consistency.legend.none|one|two|three`. Swatches `accessibilityElementsHidden`; the captions read.
- Frames: cell ≈ 42 pt at 390, ≈ 47.7 pt at 430; 8 or 9 rows (≈ 410 / 465 pt). At font scale 2 the digit (26 pt) still fits a 42-pt cell; single digits are the realistic case.

**§4.2.4 Planned vs trained** (`PlannedVsActualCard`; plan §6.7; P-08).
- Card as §4.2.3, `testID` `progress.gap.card`. Header: overline `progress.gap.title`; summary `textStyle.headline` `progress.gap.summary` (`testID` `progress.gap.summary`); caption `textSecondary` `progress.gap.summaryUnplanned` when `totals.unplannedTrained ≥ 1`.
- Rows (`rows` order, removed last): pressable, min height `hit`, `paddingVertical: spacing[2]`, top hairline `borderDefault` between rows, column `gap: spacing[1]`:
  1. line: name `rowTitle` (flex 1, `numberOfLines={2}`; `removed` → `common.removed`) + trailing `textStyle.rowValue` `textSecondary` tabular `progress.gap.row` (omitted when `planned = 0`).
  2. bar (only when `planned ≥ 1`): track height `spacing[1]` (cm:337 draws 4; §8), `radius.xs`, `borderDefault`; fill width `trained / planned`, `textPrimary`; `accessibilityElementsHidden`.
  3. caption `textSecondary` parts joined " · ": `progress.gap.notTrained` (≥ 1), `progress.gap.pending` (≥ 1), `progress.gap.unplanned` (≥ 1).
  - Tap → `progress-why` for that ref. A11y `role="button"`, label `progress.gap.row.a11y`. `testID` `progress.gap.<KIND>.<refId>`.
- Empty (`rows` empty): caption `progress.gap.empty` (`testID` `progress.gap.empty`) + secondary Button `progress.gap.empty.action` → `log-session?mode=plan`.

**§4.2.5 Rank history** (P-09). RankCard (fd §4.4.7) with `testIDPrefix="progress.rank"` and the active scale's belt; below the meta line, when `useRankHistory()` has more than the current entry: overline `progress.rank.history` and up to 5 rows (min height `hit`, `gap: spacing[3]`, non-pressable): BeltSwatch (cm:160) + `rowTitle` `rank.title` + trailing caption `textSecondary` date (`Intl`). Then a ghost Button `progress.rank.allHistory` → `profile/rank`. Empty: the RankCard empty state (`home.rank.empty.*`, action `testID` `progress.rank.set`).

**§4.2.6 States.** Loading: LoadingState (`progress.loading`) in place of sections and panels. Error: card (fd §4.4.8) `progress.error` + body `errors.<CODE>` + secondary `common.tryAgain` (`progress.error.retry`). Empty (`results` empty): EmptyState card (`progress.empty`) `progress.empty.title` / `progress.empty.body` + secondary `progress.empty.action` → `openQuickLog()`; the panels still render below with their empty copy (plan §11.3 `progress-panels`). No accent button on this screen (R-C1).

### §4.3 Why sheet (`progress-why`; P-01, PS-05, plan §6.4)

- **Frame:** formSheet, `sheetAllowedDetents: [0.5, 1]`, container `bgSurface`. SheetChrome (fd §4.3.1) with `cancelLabel` = `common.close` (`testID` `why.close`), title = the focus name (`why.title`). ScrollView, gutter `spacing[5]`, `gap: spacing[4]`, bottom padding `insets.bottom + spacing[5]`. Data: `useProgress()` → the result whose `ref` matches; on open, accessibility focus moves to the title.
- **State block** (row, `gap: spacing[2]`, wrap): Icon (P-03) `size.icon` `textSecondary`; `textStyle.titleM` `progress.state.<STATE>` (`why.state`); Flagged Badge when `flagged`. Below: rule sentence `textStyle.body` `textPrimary` (§4.2.2, `why.rule`). When `flagged`: caption `textSecondary` `progress.why.flagged`.
- **Score block** (when `score` is defined): `textStyle.headline` tabular `progress.score` (`why.score`); caption `textSecondary` `progress.rescaled` when fewer than 4 of the scored signals are available (count = available scored signals). Rule 1: caption `progress.score.notEvaluated`.
- **Signals:** overline `progress.why.signals`; one row per `SignalRow` in the order n · daysSince · needsWorkRate · gap · hitRatio · trend (`why.signal.<signal>`), non-pressable, `accessible` with label `progress.signal.a11y`, min height `size.listRowMinHeight`, bottom hairline, column `gap: spacing[1]`:
  1. line: label `rowTitle` `progress.signal.<signal>.label` (flex 1) + trailing value `textStyle.rowValue` tabular (`textPrimary` when available, `textSecondary` + `progress.signal.notEnoughData` when not) — value formats P-31: n integer, daysSince `progress.signal.daysSince.value`, rates percent, hitRatio `progress.signal.hitRatio.value`, trend signed.
  2. caption `textSecondary` parts " · ": `progress.signal.weight` (when `weight` set), the threshold (`progress.signal.threshold.<signal>` when `threshold` set), and when `contributed`: check Icon `size.iconCheck` `textSecondary` + `progress.signal.contributed` (text + icon, R-C5).
- **Window:** caption `textSecondary` `progress.why.window`.
- **Link:** ListRow `progress.why.settings` + chevron (`why.settings`, `role="link"`) → `router.dismiss()` then `router.navigate('/profile/algorithm')`.
- **Not found** (ref no longer in results): EmptyState `progress.why.notFound` (`why.notFound`).
- Dismiss: Close, swipe-down (iOS), back (Android). Reduce Motion: native sheet (fd §8 DSR-10).

### §4.4 Profile (Q3 (a), PS-10, PS-11, P-11)

**§4.4.1 Profile index** (`(tabs)/profile/index`). ScrollView on `bgBase`, gutter, top per §4, column `gap: spacing[5]`. Data: `useCurrentRank()`, `useSetting(...)`, `useAlgorithmParams()`, `useAbout()`.
1. Title `textStyle.titleL` `profile.title`, `accessibilityRole="header"` (`profile.screen` on the ScrollView).
2. RankCard (fd §4.4.7) `testIDPrefix="profile.rank"`, active scale (update/set → `set-rank`).
3. **Groups** — each: overline `textSecondary` `profile.group.<group>` (`accessibilityRole="header"`), `spacing[2]` above its content.
   - Progress: ListRow `profile.algorithm`, trailing `rowValue` `profile.algorithm.value` (windowWeeks), chevron → `profile/algorithm`.
   - Planning: ListRow `profile.suggestions`, value `profile.suggestions.value` (`suggest.max`; `profile.suggestions.off` when max = 0 or all four switches off), chevron → `profile/suggestions`.
   - Logging: SwitchRow `profile.detailedRounds` + hint `profile.detailedRounds.hint` (P-34) → `setSetting('log.detailedRounds')`.
   - Library: SwitchRow `profile.showExtended` + hint `profile.showExtended.hint` → `library.showExtended`.
   - Appearance: caption label `profile.theme.label`, then SegmentedControl (fd §4.6.1 spec) options `profile.theme.SYSTEM|LIGHT|DARK`, `accessibilityLabel` `profile.theme.a11y` → `theme.override` (P-26).
   - Rank: ListRow `profile.rankHistory`, value `profile.rankScale.<SCALE>`, chevron → `profile/rank`.
   - About: ListRow `profile.about`, value `about.version` (app version), chevron → `profile/about`.
- **ListRow** (fd §4.6.3 anatomy): min height `size.listRowMinHeight`, bottom hairline, `rowTitle`, trailing `rowValue` `textSecondary`, chevron; `role="button"`, label = title + ", " + value.
- **SwitchRow** (new, cm:120-127): container `bgRaised`, `radius.md` (DSR-14 14→12), padding `spacing[3]` vertical / `spacing[4]` horizontal, row `gap: spacing[3]`, min height `size.listRowMinHeight`; text column (flex 1): label `textStyle.chipRegular` `textPrimary` (cm:124 14/500), hint `textStyle.caption` `textSecondary` (5.53 / 6.76 on `bgRaised`, contrast doc :25); trailing native `Switch` per P-15 (`size.switchWidth`×`size.switchHeight` is the platform's own). The whole row toggles (`role="switch"`, `accessibilityState={{ checked }}`, label = label + hint). Change fires no haptic (R-M4).
- Write errors (rare): toast `errors.<CODE>`.

**§4.4.2 Algorithm** (`profile/algorithm`; header title `algorithm.title`; PS-07, P-12…P-14). ScrollView, gutter, `gap: spacing[5]`, `keyboardShouldPersistTaps="handled"`, `keyboardDismissMode="on-drag"`, iOS `automaticallyAdjustKeyboardInsets`. Data: `useAlgorithmParams()`, `useProgress()`.
1. **Preview card** (`algorithm.preview`, Card `bgSurface` padding `spacing[4]`, `gap: spacing[1]`, `accessibilityLiveRegion="polite"`): overline `algorithm.preview.title`; `textStyle.body` tabular `algorithm.preview.body` (counts per state from `results`); caption `textSecondary` `algorithm.version` + " · " + `algorithm.intro`.
2. **Groups** (overline headers `algorithm.group.*`, column `gap: spacing[4]`), one **ParamField** per key:

| group | key | label / unit keys | step | decimals | keyboard |
|---|---|---|---|---|---|
| window | `windowWeeks` | `algorithm.param.windowWeeks` / `algorithm.unit.weeks` | 1 | 0 | number-pad |
| window | `staleDays` | `…staleDays` / `…unit.days` | 1 | 0 | number-pad |
| states | `minSessions` | `…minSessions` / `…unit.sessions` | 1 | 0 | number-pad |
| states | `trendImproving` | `…trendImproving` / `…unit.points` | 0.1 | 1 | decimal-pad |
| states | `needsWorkThreshold` | `…needsWorkThreshold` / — | 0.05 | 2 | decimal-pad |
| weights | `wNeedsWork`, `wHitCaught`, `wGap`, `wTrend` | `…<key>` / — | 0.05 | 2 | decimal-pad |
| data | `hitCaughtMinEvents` | `…hitCaughtMinEvents` / `…unit.events` | 1 | 0 | number-pad |

   - **ParamField** (column, `gap: spacing[1]`): label `textStyle.caption` `textSecondary` (R-A4); Stepper (cm:111-118, fd §4.3.3 spec: container `bgRaised` `radius.md` padding `spacing[1]`; buttons `size.stepperButton`, `radius.sm`, fill `borderDefault`; at min/max `semantic.buttonDisabled`, `disabled`) whose value is a `TextInput` (`editable` prop): `textStyle.stepperValue` tabular `textPrimary`, centred, `minWidth: hit`, `selectTextOnFocus`, focused `size.borderWidthFocus` `accentBorder` + `radius.sm`, unit `caption` `textSecondary` after it; hint caption `textSecondary` `algorithm.param.range` (min, max, default); weights add `algorithm.weightShare` (`w / Σ w` of the four, 0 % when Σ = 0).
   - Commit: −/+ tap (value ± step, rounded to the decimals; `hapticStepper`) or blur/submit of the input (parse with "," or "." as decimal separator). Invalid number → ErrorBanner `algorithm.param.invalidNumber` below the field; otherwise `setParam({ version, key, value })`. `PARAM_OUT_OF_RANGE` → ErrorBanner `errors.PARAM_OUT_OF_RANGE` with `details.min/max`; `PARAM_NOT_INTEGER` → `errors.PARAM_NOT_INTEGER`; the displayed value reverts to the stored one. The banner clears on the next valid commit.
   - A11y: −/+ labels `algorithm.param.less.a11y` / `.more.a11y`; the input `accessibilityLabel` = the label, `accessibilityHint` = the range hint.
   - Weights group adds caption `textSecondary` `algorithm.weights.hint` under its header.
3. **Reset:** secondary Button full width `algorithm.reset` (`algorithm.reset`) + caption `algorithm.reset.hint`; P-14. No accent button on this screen.
- Live: `useProgress` recomputes as each param commits (plan §12), so the preview and Progress follow.

**§4.4.3 Suggestions** (`profile/suggestions`; header `suggestions.title`; R-09, R-21, P-35). ScrollView, gutter, `gap: spacing[3]`: caption `textSecondary` `suggestions.intro`; four SwitchRows `suggestions.lastNeedsWork|needsWork|notTrainedLately|cycle` with their `.hint` → `suggest.lastNeedsWork|needsWork|notTrainedLately|cycle`; then caption label `suggestions.max.label` + full-width Stepper 0–10 step 1 (`suggestions.max`), value tabular, a11y `suggestions.max.less.a11y` / `.more.a11y`, hint `suggestions.max.hint`, `hapticStepper` → `suggest.max`.

**§4.4.4 Rank** (`profile/rank`; header `profileRank.title`; R-10, PS-11, P-24, P-25). ScrollView, gutter, `gap: spacing[4]`:
1. Caption label `profileRank.scale.label` + SegmentedControl `profileRank.scale.ADULT|KIDS` (`accessibilityLabel` `profileRank.scale.a11y`) → `rank.scale`; caption `textSecondary` `profileRank.scale.hint`. The Home and Progress rank cards and the Profile rank card follow the active scale (PS-11) and render kids belts through the BeltRank extension below.
2. Overline `profileRank.history.title`; rows of `useRankHistory()` (newest first): ListRow, leading BeltSwatch, title `rank.title`, subtitle caption `home.rank.since`, chevron → `set-rank?entryId=<id>`; label `profileRank.entry.a11y`. Empty: EmptyState `profileRank.empty.title` / `.body` (`profileRank.empty`).
3. Secondary Button `profileRank.add` → `set-rank`.

**Set-rank sheet changes** (fd §4.4.9): belt rows list the active scale (ADULT 5, KIDS 13, `rank.belt.<BELT>`); `rank.add` sends the active scale (plan §8.2). `entryId` param = edit mode: title `rank.sheet.title.edit`, prefill the entry, Save → `rank.update`; a destructive Button `rank.sheet.delete` (`rank.delete`) at the end of the scroll, `marginTop: spacing[5]` → `rank.softDelete` → dismiss → toast `toast.rankDeleted` + Undo → `rank.undoDelete`. Edit save → toast `toast.rankSaved` (no Undo, fd D-A10).

**BeltRank / BeltSwatch for kids belts (P-25):** fill `beltKidsGrey|Yellow|Orange|Green` (or `beltWhite`/`beltBlack`); `*_WHITE` / `*_BLACK` add an absolutely positioned band, height 50 % of the belt (L: `size.beltLHeight / 2`; swatch: `size.beltSwatchHeight / 2`), vertically centred, full width, in `beltWhite` / `beltBlack`, drawn under the bar; bar `beltBar`, stripes `beltStripe`; edge `size.borderWidth` in the fill colour (WHITE, BLACK keep `borderStrong`, R-T4). No `accent-*` inside (R-T6). Always next to `rank.title` (DSR-4).

**§4.4.5 About** (`profile/about`; header `about.title`; PS-19, CO-35, R-28). ScrollView, gutter, `gap: spacing[5]`. Data: `useAbout()`.
1. App block (`gap: spacing[1]`): `textStyle.titleM` `about.appName`; captions `textSecondary` `about.version` (`about.version`), `about.algorithm`, `about.taxonomy`.
2. Backups: overline `about.backup.title`; `textStyle.body` `textPrimary` `about.backup.status.<excluded|failed|not_applicable>` (`about.backup.status`; plan §9.3 asserts the `excluded` text).
3. Attribution: overline `about.attribution.title`; one block per `attribution.sources[i]` in file order (`about.attribution.<slug>`, slug P-27), column `gap: spacing[1]`, separated by `spacing[4]`: `textStyle.headline` name; caption `textSecondary` `about.attribution.use`; caption `about.attribution.licence`; when `credit`: `textStyle.body` the credit (data); when `changes`: caption `about.attribution.changes`; when `snapshot` or `commit`: caption `about.attribution.version` (snapshot, else the first 7 characters of the commit); links (row, `gap: spacing[4]`, wrap): when `url` → link `about.attribution.source` (`about.attribution.<slug>.link`); when `licenceUrl` → link `about.attribution.licenceLink` (`about.attribution.<slug>.licence`). Link style: `textStyle.chip` `accentText` (link 14/600, contrast doc :31), `role="link"`, min height `hit`, labels `about.attribution.source.a11y` / `.licenceLink.a11y`; `Linking.openURL` (user-initiated; carries no user data).

### §4.5 Library editing (PS-12…PS-14, P-16…P-21)

**§4.5.1 Library index changes** (fd §4.6). Title row: `flexDirection: 'row'`, title (flex 1) + IconButton on `bgBase` (cm:62: `size.iconButton`, `bgSurface`, `borderDefault`, glyph `plus` `size.iconButtonGlyph`), label `library.add.<KIND>` for the active segment (`library.add`) → `library-edit?kind=<KIND>`. Technique rows become pressable: chevron, `role="button"`, label `library.row.technique.a11y` → `library/technique/[id]`. Subject rows become pressable: chevron, label `library.row.subject.a11y` → `library-edit?kind=SUBJECT&id=`. Extended rows only with the setting on (unchanged, D-A14). The footer attribution (D-A15) stays.

**§4.5.2 Position detail changes** (fd §4.6.8). Native `headerRight`: Touch with `textStyle.button` `accentText` `common.edit`, min `hit` × `hit` (`position.edit`, label `position.edit.a11y`) → `library-edit?kind=POSITION&id=`. Header block adds, after the description, overline `position.notes` + `body` notes when `notes` is set. Technique rows in From here / Into here become pressable → `library/technique/[id]` (chevron, `role="button"`).

**§4.5.3 `library-edit` sheet** (params `kind`, `id?`). Frame fd §4.3.1, `sheetAllowedDetents: [1]`, keyboard handling fd T-07. SheetChrome title `libraryEdit.title.<create|edit>.<KIND>` (`libraryEdit.title`), Cancel `libraryEdit.cancel`. Data: edit → `usePosition(id)` / `useTechnique(id)` / `useSubjects()` row. Sections (overline labels, fd §4.3.1 rhythm, `gap: spacing[5]`):

| field | kinds | control | key / testID |
|---|---|---|---|
| Name (required) | all | TextField, `autoFocus` in create | `libraryEdit.name.label` · `libraryEdit.field.name` |
| Keep old name | POSITION, TECHNIQUE, edit, name changed | selectable Chip (checkbox), default checked (P-19) | `libraryEdit.keepAlias` · `libraryEdit.keepAlias` |
| Type (required) | TECHNIQUE | filter chips radiogroup, 6 types (`library.technique.type.*`), wrap row | `libraryEdit.type.label` · `libraryEdit.type.<TYPE>` |
| From position (required) | TECHNIQUE | PositionPicker | `libraryEdit.from.label` · `libraryEdit.from.*` |
| To position (required unless SUBMISSION; hidden for SUBMISSION, value cleared) | TECHNIQUE | PositionPicker | `libraryEdit.to.label` · `libraryEdit.to.*` |
| Variant of (optional) | POSITION | PositionPicker (excludes this row) | `libraryEdit.parent.label` · `libraryEdit.parent.*` |
| Applies to | TECHNIQUE | SegmentedControl Gi · No-gi · Both (default Both) | `libraryEdit.appliesTo.label` · `libraryEdit.appliesTo.<V>` |
| Perspective | TECHNIQUE | SegmentedControl Either · Top · Bottom (Either = null) | `libraryEdit.perspective.label` · `libraryEdit.perspective.<ANY\|TOP\|BOTTOM>` |
| Description | all | TextArea | `libraryEdit.description.label` · `libraryEdit.field.description` |
| Your notes | POSITION, TECHNIQUE | TextArea | `libraryEdit.notes.label` · `libraryEdit.field.notes` |
| Aliases | POSITION, TECHNIQUE | §4.5.5 | `libraryEdit.aliases.label` |
| Merge | edit | secondary Button full width → merge panel §4.5.4 | `libraryEdit.merge.open.<KIND>` · `libraryEdit.merge` |
| Delete | edit | destructive Button full width, `marginTop: spacing[5]` (P-20) | `libraryEdit.delete.<KIND>` · `libraryEdit.delete` |

- **PositionPicker** (P-21): when a position is selected, a selectable Chip (selected style + check) with its name, `role="button"`, label `libraryEdit.position.selected.a11y`; tap clears it and shows the search. Otherwise: SearchField (fd §4.6.2: caption label = the field label, placeholder `libraryEdit.position.placeholder`, clear `libraryEdit.<field>.clear`) + up to 6 result ListRows (`rowTitle` name; subtitle `library.row.alias` when `matchedAlias`; Tag `library.tier.EXTENDED`), min height `hit`, `testID` `libraryEdit.<field>.result.<positionId>`; no match → caption `library.empty.query.title`.
- **Action bar** (fd §4.3.1): message line = disabled reason `libraryEdit.save.disabled.name|from|to` (R-C6) or ErrorBanner `errors.<CODE>` (`libraryEdit.error`); primary `libraryEdit.save.create` / `libraryEdit.save.edit` (`libraryEdit.save`), busy per fd §4.3.1. Enabled when name non-blank (+ type, from, and to unless SUBMISSION).
- **Save:** create → `create<Kind>` → `hapticSave`, dismiss, toast `toast.<kind>Added` + Undo → `softDelete`. Edit → `update<Kind>` → dismiss, toast `toast.changesSaved` (no Undo, fd D-A10). Errors (`TAXONOMY_*`, `POSITION_PARENT_CYCLE`, `TECHNIQUE_*`) → ErrorBanner; the sheet stays.
- **Dismiss** (Cancel, swipe-down, Android back; never blocked, R-N4): unsaved field edits are discarded without a draft toast — the row is unchanged until Save, so nothing is lost that the user saved (fd D-A9 covers the Log draft only). Alias changes already applied (§4.5.5) stay.
- **States:** loading → LoadingState; `TAXONOMY_ROW_NOT_FOUND` → EmptyState `errors.TAXONOMY_ROW_NOT_FOUND` + ghost `common.cancel` (`libraryEdit.notFound.cancel`).

**§4.5.4 Merge panel** (inline in `library-edit`, P-17; PS-14). Entering it keeps unsaved field edits in memory but they are not sent. Root `testID` `libraryEdit.merge.panel`. SheetChrome title becomes `libraryEdit.merge.title`.
1. `textStyle.body` `libraryEdit.merge.body.<KIND>`.
2. SearchField: label `libraryEdit.merge.search.label`, placeholder `libraryEdit.merge.search.placeholder`, `autoFocus` (`libraryEdit.merge.search.input`, clear `libraryEdit.merge.search.clear`). Source: positions `useLibraryPositions(q)`, techniques `useTechniqueSearch(q)` filtered to the same submission-ness (`type === 'SUBMISSION'` iff the loser is), subjects `useSubjects()` filtered by name; the row itself excluded.
3. Up to 8 result ListRows (`libraryEdit.merge.result.<id>`, `role="radio"`, `accessibilityState={{ checked }}`, label `libraryEdit.merge.result.a11y`); the selected row shows a trailing check `size.iconCheck` `textPrimary`. No match → caption `libraryEdit.merge.empty`.
4. When selected: `textStyle.headline` `libraryEdit.merge.selected` (`accessibilityLiveRegion="polite"`).
5. Ghost `libraryEdit.merge.back` (`libraryEdit.merge.back`) returns to the form.
- Action bar: reason `libraryEdit.merge.confirm.disabled` until a row is picked; primary `libraryEdit.merge.confirm` (`libraryEdit.merge.confirm`) → `merge(kind, id, intoId)` → `hapticSave`, dismiss, `router.dismissTo('/library')`, toast `toast.merged` + Undo → `undoMerge(mergeId)` → toast `toast.mergeUndone`; an undo error (`MERGE_NOT_LATEST`, `MERGE_ALREADY_UNDONE`, `MERGE_NOT_FOUND`) → toast `errors.<CODE>` without action. Merge errors → ErrorBanner.

**§4.5.5 Aliases block** (P-18; R-34, R-50). Overline `libraryEdit.aliases.label`.
- Create mode: caption `textSecondary` `libraryEdit.aliases.createHint`.
- Edit mode: wrap row (wrapped-chip-row gaps) of selectable Chips, one per live alias (selected style + check), label = alias, `role="button"`, `accessibilityLabel` `libraryEdit.alias.remove.a11y` (`libraryEdit.alias.<aliasId>`); tap → `removeAlias` → chip gone; an inline line (row, `gap: spacing[2]`): caption `textSecondary` `libraryEdit.alias.removed` + ghost `common.undo` (`libraryEdit.alias.undo`) → `undoRemoveAlias`; the line stays until the next removal or the sheet closes. No aliases → caption `libraryEdit.aliases.none`.
- Add chip `libraryEdit.aliases.add` (`libraryEdit.aliases.add`) reveals: TextField label `libraryEdit.alias.input.label`, placeholder `libraryEdit.alias.input.placeholder` (`libraryEdit.alias.input`, `returnKeyType="done"`) + ghost `libraryEdit.alias.submit` (`libraryEdit.alias.submit`) → `addAlias`; success clears the field; `ALIAS_*` → ErrorBanner inline under the field (`libraryEdit.alias.error`).

### §4.6 Technique detail (`(tabs)/library/technique/[id]`; PS-15, PS-16)

Data: `useTechnique(id)` (`TechniqueDetail`), `useResources({ kind: 'TECHNIQUE', id })`. Native header as position detail, empty title, `headerRight` Edit (`technique.edit`, label `technique.edit.a11y`) → `library-edit?kind=TECHNIQUE&id=`.
- **Body:** `SectionList` (`technique.screen`) on `bgBase`, gutter.
- **Header block** (`gap: spacing[3]`):
  1. title `textStyle.titleL` name, `accessibilityRole="header"`;
  2. caption `textSecondary` `technique.aliases` when aliases exist;
  3. meta row (wrap, `gap: spacing[2]`): Tag `library.technique.type.<TYPE>`; GI Badge / NOGI Tag (fd §4.6.4); Tag `library.technique.perspective.<P>` when set; Tag `library.tier.EXTENDED` when extended;
  4. endpoint rows (ListRow, chevron, `role="link"`): `technique.from` (`technique.from`) → `library/position/[fromPositionId]`; `technique.to` (`technique.to`) when not SUBMISSION. An endpoint whose position is soft-deleted renders `common.removed`, no chevron, not pressable (plan §12);
  5. description: overline `technique.description.title` + `body` (when set);
  6. notes: overline `technique.notes.title` + `body` notes, or caption `technique.notes.empty`.
- **Resources section:** SectionHeader (titleM) `technique.resources.title` with trailing link action `technique.resources.add` (`chip` `accentText`, hit-slop to `hit`, label `technique.resources.add.a11y`, `technique.resources.add`) → `resource-edit?techniqueId=`.
  - Row (`technique.resource.<id>`): pressable ListRow (wrap), title `rowTitle` resource title, subtitle caption `technique.resource.meta` (type name · author when set), → `resource-edit?id=&techniqueId=`. Trailing (row, `gap: spacing[2]`): selectable Chip `technique.resource.watched` (checked when WATCHED; `role="checkbox"`; label `technique.resource.watched.a11y`; `technique.resource.<id>.watched`) → `setResourceStatus`; IconButton `openLink` (`arrow.up.right.square` / `open_in_new`) when `url` (label `technique.resource.open.a11y`, `technique.resource.<id>.open`) → `Linking.openURL`. Row label `technique.resource.a11y`.
  - Empty: caption `technique.resources.empty` (`technique.resources.empty`).
- **History section:** SectionHeader `technique.history.title`; rows (`technique.history.<sessionId>`): ListRow, title `rowTitle` session-type name, subtitle caption date (`Intl`) · `technique.history.via.<VIA>`, chevron → `session/[id]`, label `technique.history.a11y`. Empty: caption `technique.history.empty`.
- **States:** loading LoadingState (`technique.loading`); `TAXONOMY_ROW_NOT_FOUND` → EmptyState `technique.notFound.title` / `errors.TAXONOMY_ROW_NOT_FOUND` (`technique.notFound`).
- Resource toasts (after `resource-edit` dismisses): `toast.resourceAdded` + Undo → `deleteResource`; `toast.resourceDeleted` + Undo → `undoDeleteResource`; edit → `toast.changesSaved`.

### §4.7 `resource-edit` sheet (params `id?`, `techniqueId`; PS-15, CO-26, P-22)

Frame fd §4.3.1, `sheetAllowedDetents: [1]`. SheetChrome `resourceEdit.title.create|edit` (`resourceEdit.heading`), Cancel `resourceEdit.cancel`. Fields (`gap: spacing[5]`):
1. TextField `resourceEdit.field.title.label` (required), placeholder hint (`resourceEdit.field.title`).
2. TextField `resourceEdit.field.url.label`, `keyboardType="url"`, `autoCapitalize="none"`, `autoCorrect={false}` (`resourceEdit.field.url`); caption `textSecondary` `resourceEdit.field.url.hint`.
3. TextField `resourceEdit.field.author.label` (`resourceEdit.field.author`) — "Author / source" closes CO-26.
4. Type: overline `resourceEdit.type.label`; filter chips radiogroup from `useResourceTypes()` (names are data), wrap row (`resourceEdit.type.<typeId>`); default the first by `sortOrder`.
5. TextArea `resourceEdit.field.notes.label` (`resourceEdit.field.notes`).
6. Status: caption label `resourceEdit.status.label` + SegmentedControl `resourceEdit.status.TO_WATCH|WATCHED` (`accessibilityLabel` `resourceEdit.status.a11y`; default To watch).
7. Edit mode: destructive Button `resourceEdit.delete` (`resourceEdit.delete`), `marginTop: spacing[5]`.
- Action bar: reason `resourceEdit.save.disabled` while the title is blank; ErrorBanner `errors.RESOURCE_*` (`resourceEdit.error`); primary `resourceEdit.save.create|edit` (`resourceEdit.save`) → `createResource(input, { kind: 'TECHNIQUE', id: techniqueId })` / `updateResource`; success → `hapticSave`, dismiss, toast (§4.6).

### §4.8 Dev reset (`dev/reset`, `__DEV__`)

Under the reset status line: caption `textSecondary` `dev.reset.backup` with the raw `app_meta.backup_exclusion` value (`dev.reset.backup`).

### §4.9 Tap walk-throughs (one-handed, R-1, R-26)

| goal | taps (testID) | count |
|---|---|---|
| see why a focus needs work | `tabs.progress` → `progress.row.POSITION.<id>` | 2 |
| change the needs-work threshold | `tabs.profile` → `profile.algorithm` → `algorithm.param.needsWorkThreshold.value` + type → hide keyboard | 3 + typing |
| switch to dark | `tabs.profile` → `profile.theme.DARK` | 2 |
| add a position | `tabs.library` → `library.add` → type → `libraryEdit.save` | 3 + typing |
| merge two positions | `library.position.<id>` → `position.edit` → `libraryEdit.merge` → `libraryEdit.merge.result.<id>` → `libraryEdit.merge.confirm` | 5 (+ search typing) |
| mark a resource watched | `library.technique.<id>` → `technique.resource.<id>.watched` | 2 |

Primary actions sit in bottom action bars in every sheet; Progress and Profile are read/toggle surfaces whose rows span the full width, inside thumb reach at 390 and 430 pt.

## §5 Component usage per screen

| component (cm) | Progress | Why | Profile + subs | Library edit | Technique / resource |
|---|---|---|---|---|---|
| Button primary (:44) | — | — | — | Save / Add / Merge into | Add / Save resource |
| Button secondary (:45) | Log / Plan a session (empty) | — | Reset to defaults, Add rank entry | Merge into another… | — |
| Button ghost (:46) | All rank history, Update | — | Update (rank card) | Back to editing, Add alias, Undo | — |
| Button destructive (:47) | — | — | Delete entry (Set rank) | Delete | Delete resource |
| IconButton (:61) | — | — | — | Library plus | open link |
| TextField (:71, new) | — | — | — | name, alias | title, URL, author |
| TextArea (:78) | — | — | — | description, notes | notes |
| SearchField (:89) | — | — | — | pickers, merge | — |
| SegmentedControl (:97) | — | — | theme, scale | applies to, perspective | status |
| Stepper (:111) | — | — | params (editable), max | — | — |
| Switch / SwitchRow (:120, new) | — | — | rounds, extended, 4 sources | — | — |
| Chip filter (:142) | — | — | — | technique type | resource type |
| Chip selectable (:147) | — | — | — | keep alias, aliases, picked position | Watched |
| Chip add (:152) | — | — | — | + Add alias | — |
| Tag (:157) | — | — | — | Extended (results) | type, No-gi, perspective, Extended |
| Badge (:162) | Flagged | Flagged | — | — | GI |
| BeltRank L / swatch (:179, :160) | rank card, promotions | — | rank card, history rows | — | — |
| Card (:212) | 3 panels, empty | — | rank card, preview | — | — |
| ListRow (:238) | progress rows | settings link | nav rows, history | results | endpoints, resources, history |
| Section header (:317) | state sections | — | — | — | Resources (+ Add), History |
| Sheet chrome (:249) | — | ✓ (Close) | Set rank | ✓ | ✓ |
| BottomActionBar (:369) | — | — | Set rank | ✓ | ✓ |
| Toast (:263) | — | — | defaults, rank | after dismiss | after dismiss |
| Tab bar (:273) | ✓ | — | ✓ | — | ✓ |

## §6 Copy table (EN · key · context)

All keys go into `mobile/src/i18n/en.json` (flat dotted keys, as today). i18next `{{name}}` interpolation; plurals `_one` / `_other`. Dates, weekdays, percentages and decimals are formatted by `Intl` in the device locale (fd §6.8, P-31), never by copy. Taxonomy, session-type, resource-type names and `attribution.json` values are data.

### §6.1 common / tabs / toast

| key | en | context |
|---|---|---|
| `common.close` | Close | why sheet header left |
| `common.edit` | Edit | detail header right |
| `tabs.progress` | Progress | tab label |
| `tabs.profile` | Profile | tab label |
| `toast.positionAdded` | Position added | after create + Undo |
| `toast.techniqueAdded` | Technique added | after create + Undo |
| `toast.subjectAdded` | Subject added | after create + Undo |
| `toast.positionDeleted` | Position deleted | after delete + Undo |
| `toast.techniqueDeleted` | Technique deleted | after delete + Undo |
| `toast.subjectDeleted` | Subject deleted | after delete + Undo |
| `toast.merged` | Merged into {{name}} | after merge + Undo |
| `toast.mergeUndone` | Merge undone | after undo merge |
| `toast.resourceAdded` | Resource added | after create + Undo |
| `toast.resourceDeleted` | Resource deleted | after delete + Undo |
| `toast.defaultsRestored` | Defaults restored | after reset + Undo |
| `toast.rankDeleted` | Rank entry deleted | after delete + Undo |

### §6.2 errors (new codes, plan §0; one changed)

| key | en | context |
|---|---|---|
| `errors.PARAM_UNKNOWN` | This setting no longer exists. Restart the app. | param banner |
| `errors.PARAM_OUT_OF_RANGE` | Enter a value from {{min}} to {{max}}. | param banner (details) |
| `errors.PARAM_NOT_INTEGER` | Enter a whole number. | param banner |
| `errors.SETTING_VALUE_INVALID` | That value isn't allowed for this setting. | settings toast |
| `errors.TAXONOMY_NAME_REQUIRED` | Enter a name. | edit banner |
| `errors.TAXONOMY_NAME_DUPLICATE` | Another entry or alias already has that name. Pick another name, or merge the two. | edit banner |
| `errors.TAXONOMY_ROW_DELETED` | This entry was deleted. Undo the delete to edit it. | edit banner |
| `errors.TAXONOMY_SELF_MERGE` | An entry can't be merged into itself. Pick another one. | merge banner |
| `errors.TAXONOMY_MERGE_KIND_MISMATCH` | Submissions merge only into submissions, and other techniques only into techniques that aren't submissions. | merge banner |
| `errors.POSITION_PARENT_CYCLE` | That position is a variant of this one. Pick another parent. | edit banner |
| `errors.TECHNIQUE_TARGET_REQUIRED` | Pick the position this technique leads to. | edit banner |
| `errors.TECHNIQUE_SUBMISSION_HAS_TARGET` | A submission ends the exchange, so it has no target position. Clear the target. | edit banner |
| `errors.ALIAS_NAME_REQUIRED` | Enter an alias. | alias banner |
| `errors.ALIAS_DUPLICATE` | This entry already has that name or alias. | alias banner |
| `errors.ALIAS_NOT_FOUND` | That alias no longer exists. | alias banner |
| `errors.MERGE_NOT_FOUND` | This merge no longer exists. | undo toast |
| `errors.MERGE_ALREADY_UNDONE` | This merge has already been undone. | undo toast |
| `errors.MERGE_NOT_LATEST` | A later merge involves one of these entries. Undo that merge first. | undo toast |
| `errors.RESOURCE_NOT_FOUND` | This resource no longer exists. | resource banner |
| `errors.RESOURCE_TITLE_REQUIRED` | Enter a title. | resource banner |
| `errors.RESOURCE_URL_INVALID` | Enter a link that starts with http:// or https://, or leave it empty. | resource banner |
| `errors.RESOURCE_TYPE_NOT_FOUND` | That resource type no longer exists. Pick another one. | resource banner |
| `errors.RESOURCE_LINK_TARGET_NOT_FOUND` | The technique for this resource is no longer in the library. | resource banner |
| `errors.RANK_NOT_FOUND` | This rank entry no longer exists. | rank banner |
| `errors.RANK_BELT_INVALID_FOR_SCALE` | That belt isn't on the selected scale. Pick another belt. | **changed** (was "…adult scale…"; kids scale ships) |

### §6.3 progress (screen, panels, why sheet)

| key | en | context |
|---|---|---|
| `progress.title` | Progress | title |
| `progress.window_one` | Last {{count}} week · {{start}} – {{end}} | window caption |
| `progress.window_other` | Last {{count}} weeks · {{start}} – {{end}} | window caption |
| `progress.state.IMPROVING` | Improving | state (plan §6.4) |
| `progress.state.STEADY` | Steady | state |
| `progress.state.NEEDS_WORK` | Needs work | state |
| `progress.state.NOT_TRAINED` | Not trained lately | state |
| `progress.section.header` | {{state}} · {{count}} | section header |
| `progress.section.removed` | Removed from the library | section header |
| `progress.row.subtitle` | {{state}} · {{summary}} | row line 2 |
| `progress.row.a11y` | {{name}}. {{state}}. {{summary}}. {{flagged}} Show why. | row a11y (`flagged` = "Flagged." or empty) |
| `progress.row.flagged.a11y` | Flagged. | a11y part |
| `progress.rule.1.never` | No trained session yet | rule 1 |
| `progress.rule.1.stale` | Last trained {{days}} days ago, more than {{threshold}} | rule 1 (days > staleDays ≥ 7) |
| `progress.rule.1.window_one` | Not trained in the last {{count}} week | rule 1, n = 0 |
| `progress.rule.1.window_other` | Not trained in the last {{count}} weeks | rule 1, n = 0 |
| `progress.rule.2` | Needs-work score {{score}} is at or above {{threshold}} | rule 2 |
| `progress.rule.3_one` | Ratings up {{value}} across {{count}} session | rule 3 |
| `progress.rule.3_other` | Ratings up {{value}} across {{count}} sessions | rule 3 |
| `progress.rule.4_one` | Trained once; no signal crossed a threshold | rule 4 |
| `progress.rule.4_other` | Trained {{count}} times; no signal crossed a threshold | rule 4 |
| `progress.empty.title` | No training logged yet | empty |
| `progress.empty.body` | Log a session and tick what you worked on. Each focus then shows here as Improving, Steady, Needs work or Not trained lately. | empty (R-26) |
| `progress.empty.action` | Log a session | secondary |
| `progress.error` | Couldn't load your progress | error card |
| `progress.consistency.title` | Consistency | overline |
| `progress.consistency.summary` | {{sessions}} on {{days}} in the last {{weeks}} | summary (P-30) |
| `progress.consistency.sessions_one` | {{count}} session | summary part |
| `progress.consistency.sessions_other` | {{count}} sessions | summary part |
| `progress.consistency.days_one` | {{count}} day | summary part |
| `progress.consistency.days_other` | {{count}} days | summary part |
| `progress.consistency.weeks_one` | {{count}} week | summary part |
| `progress.consistency.weeks_other` | {{count}} weeks | summary part |
| `progress.consistency.streak_one` | {{count}} week in a row with training | streak |
| `progress.consistency.streak_other` | {{count}} weeks in a row with training | streak |
| `progress.consistency.minutes` | {{minutes}} min trained | caption |
| `progress.consistency.empty` | No sessions in this window yet. Log a session and it shows up here. | empty (names the next step) |
| `progress.consistency.range` | {{start}} – {{end}} | grid range |
| `progress.consistency.cell` | {{date}}: {{sessions}}, {{minutes}} min | cell a11y |
| `progress.consistency.cell.future` | {{date}}: upcoming | cell a11y |
| `progress.consistency.cell.skipped` | {{count}} skipped | cell a11y part |
| `progress.consistency.cell.notLogged` | {{count}} not logged | cell a11y part |
| `progress.consistency.cell.outside` | outside the window | cell a11y part |
| `progress.consistency.cell.today` | today | cell a11y part |
| `progress.consistency.legend.title` | Sessions a day | legend |
| `progress.consistency.legend.none` | None | legend |
| `progress.consistency.legend.one` | 1 | legend |
| `progress.consistency.legend.two` | 2 | legend |
| `progress.consistency.legend.three` | 3+ | legend |
| `progress.gap.title` | Planned vs trained | overline |
| `progress.gap.summary` | Planned focuses trained: {{trained}} of {{planned}} | summary |
| `progress.gap.summaryUnplanned` | Trained without a plan: {{count}} | caption |
| `progress.gap.row` | {{trained}} of {{planned}} | row value |
| `progress.gap.notTrained` | {{count}} not trained | row part |
| `progress.gap.pending` | {{count}} pending | row part (plan §11.3 asserts "1 pending") |
| `progress.gap.unplanned` | +{{count}} unplanned | row part |
| `progress.gap.row.a11y` | {{name}}: trained in {{trained}} of {{planned}} planned sessions. {{details}} Show why. | row a11y |
| `progress.gap.empty` | No planned focuses in this window. Plan a session to compare plan and practice. | empty |
| `progress.gap.empty.action` | Plan a session | secondary |
| `progress.rank.history` | Promotions | overline |
| `progress.rank.allHistory` | All rank history | ghost |
| `progress.why.flagged` | Flagged: you marked it as needs work the last time you trained it. | why (PS-05) |
| `progress.why.signals` | Signals | overline |
| `progress.why.window` | Window: {{start}} – {{end}} | caption |
| `progress.why.settings` | Change how states are calculated | link row |
| `progress.why.notFound` | This focus has no progress data any more. | empty |
| `progress.score` | Needs-work score {{score}} vs threshold {{threshold}} | score line (plan §6.4) |
| `progress.score.notEvaluated` | Not scored: the focus wasn't trained recently enough. | rule 1 |
| `progress.rescaled_one` | Score uses {{count}} of 4 signals; its weight is rescaled to 100 %. | rescale note |
| `progress.rescaled_other` | Score uses {{count}} of 4 signals; their weights are rescaled to 100 %. | rescale note |
| `progress.signal.n.label` | Sessions trained in the window | signal |
| `progress.signal.trend.label` | Rating trend | signal |
| `progress.signal.needsWorkRate.label` | Marked needs work | signal |
| `progress.signal.gap.label` | Planned but not trained | signal |
| `progress.signal.daysSince.label` | Days since last trained | signal |
| `progress.signal.hitRatio.label` | Hit vs caught | signal |
| `progress.signal.daysSince.value_one` | {{count}} day | value |
| `progress.signal.daysSince.value_other` | {{count}} days | value |
| `progress.signal.hitRatio.value` | {{pct}} hit | value |
| `progress.signal.notEnoughData` | Not enough data | value (plan §6.4) |
| `progress.signal.weight` | Weight {{pct}} | caption part |
| `progress.signal.threshold.n` | Improving needs {{threshold}} | caption part |
| `progress.signal.threshold.trend` | Improving from +{{threshold}} | caption part |
| `progress.signal.threshold.daysSince` | Not trained lately after {{threshold}} days | caption part |
| `progress.signal.contributed` | Decided this result | caption part (+ check icon) |
| `progress.signal.a11y` | {{label}}: {{value}}. {{details}} | signal row a11y |

### §6.4 profile / algorithm / suggestions / rank / about

| key | en | context |
|---|---|---|
| `profile.title` | Profile | title |
| `profile.group.algorithm` | Progress | group overline |
| `profile.group.suggestions` | Planning | group overline |
| `profile.group.logging` | Logging | group overline |
| `profile.group.library` | Library | group overline |
| `profile.group.appearance` | Appearance | group overline |
| `profile.group.rank` | Rank | group overline |
| `profile.group.about` | About | group overline |
| `profile.algorithm` | How states are calculated | nav row |
| `profile.algorithm.value_one` | {{count}}-week window | row value |
| `profile.algorithm.value_other` | {{count}}-week window | row value |
| `profile.suggestions` | Suggested focuses | nav row |
| `profile.suggestions.value` | Up to {{count}} | row value |
| `profile.suggestions.off` | Off | row value |
| `profile.detailedRounds` | Detailed rounds | switch |
| `profile.detailedRounds.hint` | Your choice is saved now. Logging round by round comes in a later version. | switch hint (P-34) |
| `profile.showExtended` | Show extended library | switch |
| `profile.showExtended.hint` | Adds the full GrappleMap set of positions and techniques to the Library and to search. | switch hint |
| `profile.theme.label` | Theme | field label |
| `profile.theme.a11y` | Theme | segmented a11y |
| `profile.theme.SYSTEM` | System | segment |
| `profile.theme.LIGHT` | Light | segment |
| `profile.theme.DARK` | Dark | segment |
| `profile.rankHistory` | Rank history and scale | nav row |
| `profile.rankScale.ADULT` | Adult | row value |
| `profile.rankScale.KIDS` | Kids | row value |
| `profile.about` | About matIQ | nav row |
| `algorithm.title` | How states are calculated | header |
| `algorithm.preview.title` | Right now | overline |
| `algorithm.preview.body` | {{needsWork}} needs work · {{notTrained}} not trained lately · {{steady}} steady · {{improving}} improving | preview |
| `algorithm.version` | Algorithm {{version}} | caption |
| `algorithm.intro` | Changes apply at once; Progress and suggestions follow. | caption |
| `algorithm.group.window` | Time window | overline |
| `algorithm.group.states` | States | overline |
| `algorithm.group.weights` | Needs-work score | overline |
| `algorithm.group.data` | Minimum data | overline |
| `algorithm.param.windowWeeks` | Window | field label |
| `algorithm.param.staleDays` | Not trained lately after | field label |
| `algorithm.param.minSessions` | Sessions before Improving | field label |
| `algorithm.param.trendImproving` | Rating rise for Improving | field label |
| `algorithm.param.needsWorkThreshold` | Needs work from a score of | field label |
| `algorithm.param.wNeedsWork` | Weight: marked needs work | field label |
| `algorithm.param.wHitCaught` | Weight: caught more than hit | field label |
| `algorithm.param.wGap` | Weight: planned but not trained | field label |
| `algorithm.param.wTrend` | Weight: falling ratings | field label |
| `algorithm.param.hitCaughtMinEvents` | Hits and catches before they count | field label |
| `algorithm.unit.weeks` | weeks | unit |
| `algorithm.unit.days` | days | unit |
| `algorithm.unit.sessions` | sessions | unit |
| `algorithm.unit.points` | points | unit |
| `algorithm.unit.events` | events | unit |
| `algorithm.param.range` | From {{min}} to {{max}} · default {{default}} | hint |
| `algorithm.weightShare` | {{pct}} of the total weight | weight hint |
| `algorithm.weights.hint` | Weights are relative. A focus is scored on the signals it has data for, and their weights are rescaled to 100 %. | group hint |
| `algorithm.param.less.a11y` | Decrease {{label}} | stepper − |
| `algorithm.param.more.a11y` | Increase {{label}} | stepper + |
| `algorithm.param.invalidNumber` | Enter a number. | local banner |
| `algorithm.reset` | Reset to defaults | secondary |
| `algorithm.reset.hint` | Restores all ten values. You can undo right after. | caption |
| `suggestions.title` | Suggested focuses | header |
| `suggestions.intro` | When you plan a session, matIQ suggests focuses from these sources. | caption |
| `suggestions.lastNeedsWork` | Flagged last session | switch |
| `suggestions.lastNeedsWork.hint` | Focuses you marked as needs work in your last session. | hint |
| `suggestions.needsWork` | Needs work | switch |
| `suggestions.needsWork.hint` | Focuses that Progress shows as Needs work. | hint |
| `suggestions.notTrainedLately` | Not trained lately | switch |
| `suggestions.notTrainedLately.hint` | Focuses you haven't trained for a while. | hint |
| `suggestions.cycle` | Focus cycle | switch |
| `suggestions.cycle.hint` | Focus cycles come in a later version. Your choice is saved. | hint (P-35) |
| `suggestions.max.label` | Show at most | field label |
| `suggestions.max.hint` | Set to 0 to hide suggestions. | hint |
| `suggestions.max.less.a11y` | Fewer suggestions | stepper − |
| `suggestions.max.more.a11y` | More suggestions | stepper + |
| `profileRank.title` | Rank | header |
| `profileRank.scale.label` | Scale | field label |
| `profileRank.scale.ADULT` | Adult | segment |
| `profileRank.scale.KIDS` | Kids | segment |
| `profileRank.scale.a11y` | Rank scale | segmented a11y |
| `profileRank.scale.hint` | The kids scale uses the IBJJF kids belts. Switching hides the other scale's entries; nothing is deleted. | caption |
| `profileRank.history.title` | Promotions | overline |
| `profileRank.entry.a11y` | {{title}}, since {{date}}. Edit. | row a11y |
| `profileRank.add` | Add rank entry | secondary |
| `profileRank.empty.title` | No ranks on this scale yet | empty |
| `profileRank.empty.body` | Add your current belt and stripes, and earlier promotions if you like. | empty |
| `rank.sheet.title.edit` | Edit rank entry | sheet header (edit) |
| `rank.sheet.delete` | Delete entry | destructive |
| `rank.belt.GREY_WHITE` | Grey-white | belt name |
| `rank.belt.GREY` | Grey | belt name |
| `rank.belt.GREY_BLACK` | Grey-black | belt name |
| `rank.belt.YELLOW_WHITE` | Yellow-white | belt name |
| `rank.belt.YELLOW` | Yellow | belt name |
| `rank.belt.YELLOW_BLACK` | Yellow-black | belt name |
| `rank.belt.ORANGE_WHITE` | Orange-white | belt name |
| `rank.belt.ORANGE` | Orange | belt name |
| `rank.belt.ORANGE_BLACK` | Orange-black | belt name |
| `rank.belt.GREEN_WHITE` | Green-white | belt name |
| `rank.belt.GREEN` | Green | belt name |
| `rank.belt.GREEN_BLACK` | Green-black | belt name |
| `about.title` | About | header |
| `about.appName` | matIQ | app block |
| `about.version` | Version {{version}} | caption / Profile row value |
| `about.algorithm` | Progress algorithm {{version}} | caption |
| `about.taxonomy` | Library release {{release}} | caption |
| `about.backup.title` | Backups | overline |
| `about.backup.status.excluded` | Your training data is excluded from iCloud and computer backups. It stays on this phone. | status (plan §9.3 asserts) |
| `about.backup.status.failed` | matIQ couldn't exclude your data from backups. It stays encrypted, but a backup may contain it. Restart the app to try again. | status |
| `about.backup.status.not_applicable` | Backups are switched off for matIQ on this phone, so your data stays on it. | status (Android, R-39) |
| `about.attribution.title` | Data sources and licences | overline |
| `about.attribution.use` | Used for: {{use}} | caption |
| `about.attribution.licence` | Licence: {{licence}} | caption |
| `about.attribution.changes` | Changes: {{changes}} | caption |
| `about.attribution.version` | Version: {{version}} | caption |
| `about.attribution.source` | View source | link |
| `about.attribution.source.a11y` | Open the {{name}} source in your browser | link a11y |
| `about.attribution.licenceLink` | Read the licence | link |
| `about.attribution.licenceLink.a11y` | Open the {{licence}} licence in your browser | link a11y |
| `dev.reset.backup` | Backup exclusion: {{status}} | dev only |

### §6.5 library / position / technique / sheets

| key | en | context |
|---|---|---|
| `library.add.POSITION` | Add position | plus a11y |
| `library.add.TECHNIQUE` | Add technique | plus a11y |
| `library.add.SUBJECT` | Add subject | plus a11y |
| `library.row.technique.a11y` | {{name}}. {{meta}}. Open technique. | row a11y |
| `library.row.subject.a11y` | {{name}}. Edit subject. | row a11y |
| `position.edit.a11y` | Edit {{name}} | header a11y |
| `position.notes` | Your notes | overline |
| `technique.edit.a11y` | Edit {{name}} | header a11y |
| `technique.aliases` | Also known as {{aliases}} | caption |
| `technique.from` | From {{name}} | endpoint row |
| `technique.to` | To {{name}} | endpoint row |
| `technique.from.a11y` | Starts from {{name}}. Open position. | a11y |
| `technique.to.a11y` | Leads to {{name}}. Open position. | a11y |
| `technique.description.title` | Description | overline |
| `technique.notes.title` | Your notes | overline |
| `technique.notes.empty` | No notes yet. Tap Edit to add some. | empty |
| `technique.resources.title` | Resources | section |
| `technique.resources.add` | Add | section action |
| `technique.resources.add.a11y` | Add a resource | a11y |
| `technique.resources.empty` | No resources yet. Add a video, course or book you learn this technique from. | empty |
| `technique.resource.meta` | {{type}} · {{author}} | row subtitle (author part omitted when empty) |
| `technique.resource.watched` | Watched | chip |
| `technique.resource.watched.a11y` | Watched: {{title}} | checkbox a11y |
| `technique.resource.open.a11y` | Open {{title}} in your browser | icon a11y |
| `technique.resource.status.TO_WATCH` | To watch | row a11y part |
| `technique.resource.status.WATCHED` | Watched | row a11y part |
| `technique.resource.a11y` | {{title}}. {{meta}}. {{status}}. Edit resource. | row a11y |
| `technique.history.title` | History | section |
| `technique.history.via.ATTACHED` | Attached to a focus | row part |
| `technique.history.via.SUBMISSION` | Submission in sparring | row part |
| `technique.history.a11y` | {{type}}, {{date}}. {{via}}. Open session. | row a11y |
| `technique.history.empty` | Not trained yet. Attach this technique to a focus when you log a session. | empty |
| `technique.notFound.title` | Technique not found | empty |
| `libraryEdit.title.create.POSITION` | Add position | sheet header |
| `libraryEdit.title.create.TECHNIQUE` | Add technique | sheet header |
| `libraryEdit.title.create.SUBJECT` | Add subject | sheet header |
| `libraryEdit.title.edit.POSITION` | Edit position | sheet header |
| `libraryEdit.title.edit.TECHNIQUE` | Edit technique | sheet header |
| `libraryEdit.title.edit.SUBJECT` | Edit subject | sheet header |
| `libraryEdit.name.label` | Name | field label |
| `libraryEdit.name.placeholder.POSITION` | Knee shield half guard | hint |
| `libraryEdit.name.placeholder.TECHNIQUE` | Hip bump sweep | hint |
| `libraryEdit.name.placeholder.SUBJECT` | Grip fighting | hint |
| `libraryEdit.keepAlias` | Keep “{{name}}” as an alias | chip |
| `libraryEdit.keepAlias.a11y` | Keep the old name {{name}} as an alias | checkbox a11y |
| `libraryEdit.type.label` | Type | overline |
| `libraryEdit.from.label` | From position | field label |
| `libraryEdit.to.label` | To position | field label |
| `libraryEdit.parent.label` | Variant of (optional) | field label |
| `libraryEdit.position.placeholder` | Search positions | hint |
| `libraryEdit.position.selected.a11y` | {{name}}. Tap to change. | chip a11y |
| `libraryEdit.appliesTo.label` | Applies to | field label |
| `libraryEdit.appliesTo.GI` | Gi | segment |
| `libraryEdit.appliesTo.NOGI` | No-gi | segment |
| `libraryEdit.appliesTo.BOTH` | Both | segment |
| `libraryEdit.perspective.label` | Perspective | field label |
| `libraryEdit.perspective.ANY` | Either | segment |
| `libraryEdit.perspective.TOP` | Top | segment |
| `libraryEdit.perspective.BOTTOM` | Bottom | segment |
| `libraryEdit.description.label` | Description | field label |
| `libraryEdit.description.placeholder` | What it is, in a sentence or two | hint |
| `libraryEdit.notes.label` | Your notes | field label |
| `libraryEdit.notes.placeholder` | Cues, details, what to remember | hint |
| `libraryEdit.aliases.label` | Aliases | overline |
| `libraryEdit.aliases.add` | + Add alias | add chip |
| `libraryEdit.aliases.none` | No aliases yet. | caption |
| `libraryEdit.aliases.createHint` | You can add aliases after saving. | caption |
| `libraryEdit.alias.input.label` | New alias | field label |
| `libraryEdit.alias.input.placeholder` | Another name for it | hint |
| `libraryEdit.alias.submit` | Add | ghost |
| `libraryEdit.alias.remove.a11y` | Remove alias {{name}} | chip a11y |
| `libraryEdit.alias.removed` | Removed “{{name}}”. | inline undo line |
| `libraryEdit.save.create` | Add to library | primary |
| `libraryEdit.save.edit` | Save changes | primary |
| `libraryEdit.save.disabled.name` | Enter a name to save. | reason (R-C6) |
| `libraryEdit.save.disabled.from` | Pick the starting position to save. | reason |
| `libraryEdit.save.disabled.to` | Pick the target position to save. | reason |
| `libraryEdit.merge.open.POSITION` | Merge into another position | secondary |
| `libraryEdit.merge.open.TECHNIQUE` | Merge into another technique | secondary |
| `libraryEdit.merge.open.SUBJECT` | Merge into another subject | secondary |
| `libraryEdit.delete.POSITION` | Delete position | destructive |
| `libraryEdit.delete.TECHNIQUE` | Delete technique | destructive |
| `libraryEdit.delete.SUBJECT` | Delete subject | destructive |
| `libraryEdit.merge.title` | Merge {{name}} | sheet header (merge) |
| `libraryEdit.merge.body.POSITION` | Pick the position to keep. Sessions, techniques, variants, resources and aliases of {{name}} move to it, and {{name}} becomes one of its aliases. You can undo right after. | body |
| `libraryEdit.merge.body.TECHNIQUE` | Pick the technique to keep. Sessions, submissions, resources and aliases of {{name}} move to it, and {{name}} becomes one of its aliases. You can undo right after. | body |
| `libraryEdit.merge.body.SUBJECT` | Pick the subject to keep. Sessions and resources of {{name}} move to it. Subjects have no aliases, so {{name}} is no longer found by search. You can undo right after. | body (plan §12) |
| `libraryEdit.merge.search.label` | Find the entry to keep | field label |
| `libraryEdit.merge.search.placeholder` | Name or alias | hint |
| `libraryEdit.merge.result.a11y` | {{name}}. Keep this one. | radio a11y |
| `libraryEdit.merge.empty` | No other entry matches “{{query}}”. | empty |
| `libraryEdit.merge.selected` | {{from}} → {{into}} | summary |
| `libraryEdit.merge.confirm` | Merge into {{name}} | primary |
| `libraryEdit.merge.confirm.disabled` | Pick the entry to keep. | reason |
| `libraryEdit.merge.back` | Back to editing | ghost |
| `resourceEdit.title.create` | Add resource | sheet header |
| `resourceEdit.title.edit` | Edit resource | sheet header |
| `resourceEdit.field.title.label` | Title | field label |
| `resourceEdit.field.title.placeholder` | Hip bump sweep details | hint |
| `resourceEdit.field.url.label` | Link (optional) | field label |
| `resourceEdit.field.url.placeholder` | https://… | hint |
| `resourceEdit.field.url.hint` | Links open in your browser. matIQ never fetches them. | caption (privacy) |
| `resourceEdit.field.author.label` | Author / source (optional) | field label (CO-26) |
| `resourceEdit.field.author.placeholder` | Instructor, channel or book | hint |
| `resourceEdit.type.label` | Type | overline |
| `resourceEdit.field.notes.label` | Notes (optional) | field label |
| `resourceEdit.field.notes.placeholder` | Timestamps, what to look for | hint |
| `resourceEdit.status.label` | Status | field label |
| `resourceEdit.status.TO_WATCH` | To watch | segment |
| `resourceEdit.status.WATCHED` | Watched | segment |
| `resourceEdit.status.a11y` | Status | segmented a11y |
| `resourceEdit.save.create` | Add resource | primary |
| `resourceEdit.save.edit` | Save changes | primary |
| `resourceEdit.save.disabled` | Enter a title to save. | reason |
| `resourceEdit.delete` | Delete resource | destructive |

## §7 testID table (shape `<screen>.<element>[.<id>]`; binding for frontend-coder and tester)

`<KIND>` = `POSITION` \| `SUBJECT` (focus refs) or `POSITION` \| `TECHNIQUE` \| `SUBJECT` (library kinds); `<refId>`, `<positionId>`, `<techniqueId>`, `<subjectId>`, `<resourceId>`, `<entryId>`, `<aliasId>`, `<sessionId>`, `<typeId>` are row ids; `<localDate>` = `YYYY-MM-DD`; `<slug>` per P-27; `<signal>` ∈ n, trend, needsWorkRate, gap, daysSince, hitRatio; `<STATE>` ∈ NEEDS_WORK, NOT_TRAINED, STEADY, IMPROVING, REMOVED; `<key>` = an `algorithm_params` key. Stepper ids follow the shipped `testIDPrefix` composition (`<prefix>.less` / `.more` / `.value`). Flows (plan §11.3): **ps** `progress-states` · **pp** `progress-panels` · **sw** `settings-weights` · **le** `library-edit` · **lm** `library-merge` · **tr** `technique-resources` · **rt** `settings-rank-theme` · **ab** `settings-about` · **bl** `back-label`.

| testID | element | screen | flows |
|---|---|---|---|
| `tabs.progress` | Progress tab | shell | ps, pp, sw |
| `tabs.profile` | Profile tab | shell | sw, rt, ab |
| `progress.screen` | SectionList root | Progress | ps, pp |
| `progress.loading` | LoadingState | Progress | — |
| `progress.error.retry` | Try again | Progress | — |
| `progress.empty` | empty state card | Progress | pp |
| `progress.empty.action` | Log a session | Progress | — |
| `progress.section.<STATE>` | section header | Progress | ps |
| `progress.row.<KIND>.<refId>` | progress row | Progress | ps, sw |
| `progress.row.<KIND>.<refId>.state` | state + rule line | Progress | ps, sw |
| `progress.row.<KIND>.<refId>.flagged` | Flagged badge | Progress | ps |
| `progress.consistency.card` | heatmap card | Progress | pp |
| `progress.consistency` | heatmap grid | Progress | pp |
| `progress.consistency.summary` | summary line | Progress | pp |
| `progress.consistency.streak` | streak line | Progress | — |
| `progress.consistency.empty` | empty line | Progress | pp |
| `progress.consistency.cell.<localDate>` | day cell (not pressable) | Progress | — |
| `progress.gap.card` | planned-vs-trained card | Progress | pp |
| `progress.gap.summary` | summary line | Progress | pp |
| `progress.gap.empty` | empty line | Progress | pp |
| `progress.gap.empty.action` | Plan a session | Progress | — |
| `progress.gap.<KIND>.<refId>` | gap row | Progress | pp |
| `progress.rank` | rank card | Progress | pp |
| `progress.rank.set` | Set rank (empty) | Progress | — |
| `progress.rank.update` | Update | Progress | — |
| `progress.rank.entry.<entryId>` | promotion row | Progress | — |
| `progress.rank.allHistory` | All rank history | Progress | — |
| `why.sheet` | sheet root | Why | ps |
| `why.close` | Close | Why | ps |
| `why.title` | header title | Why | ps |
| `why.state` | state label | Why | ps |
| `why.rule` | rule sentence | Why | ps |
| `why.score` | score line | Why | — |
| `why.signal.<signal>` | signal row | Why | ps (`needsWorkRate`; "Not enough data" rows) |
| `why.signal.<signal>.value` | signal value text | Why | ps |
| `why.window` | window caption | Why | — |
| `why.settings` | settings link row | Why | — |
| `why.notFound` | not-found state | Why | — |
| `profile.screen` | ScrollView root | Profile | sw, rt, ab |
| `profile.rank` | rank card | Profile | rt |
| `profile.rank.set` | Set rank (empty) | Profile | rt |
| `profile.rank.update` | Update | Profile | — |
| `profile.algorithm` | nav row | Profile | sw |
| `profile.suggestions` | nav row | Profile | — |
| `profile.detailedRounds` | switch row | Profile | — |
| `profile.showExtended` | switch row | Profile | — |
| `profile.theme.SYSTEM` | theme segment | Profile | — |
| `profile.theme.LIGHT` | theme segment | Profile | — |
| `profile.theme.DARK` | theme segment | Profile | rt |
| `profile.rankHistory` | nav row | Profile | rt |
| `profile.about` | nav row | Profile | ab |
| `algorithm.screen` | ScrollView root | Algorithm | sw |
| `algorithm.preview` | preview card | Algorithm | sw |
| `algorithm.param.<key>.less` / `.more` / `.value` | param stepper (value = text input) | Algorithm | sw (`needsWorkThreshold`) |
| `algorithm.param.<key>.error` | param ErrorBanner | Algorithm | sw |
| `algorithm.reset` | Reset to defaults | Algorithm | sw |
| `suggestions.screen` | ScrollView root | Suggestions | — |
| `suggestions.lastNeedsWork` | switch row | Suggestions | — |
| `suggestions.needsWork` | switch row | Suggestions | — |
| `suggestions.notTrainedLately` | switch row | Suggestions | — |
| `suggestions.cycle` | switch row | Suggestions | — |
| `suggestions.max.less` / `.more` / `.value` | max stepper | Suggestions | — |
| `profileRank.screen` | ScrollView root | Rank | rt |
| `profileRank.scale.ADULT` | scale segment | Rank | rt |
| `profileRank.scale.KIDS` | scale segment | Rank | rt |
| `profileRank.entry.<entryId>` | history row | Rank | — |
| `profileRank.add` | Add rank entry | Rank | rt |
| `profileRank.empty` | empty state | Rank | rt |
| `rank.delete` | Delete entry (edit mode) | Set rank | — |
| `about.screen` | ScrollView root | About | ab |
| `about.version` | version caption | About | — |
| `about.backup.status` | backup status text | About | ab |
| `about.attribution.<slug>` | source block | About | ab |
| `about.attribution.<slug>.link` | View source link | About | ab (`bjj-data-by-grapple-flows`) |
| `about.attribution.<slug>.licence` | licence link | About | — |
| `library.add` | plus (add to active segment) | Library | le, lm |
| `position.edit` | header Edit | Position | le, lm |
| `technique.screen` | SectionList root | Technique | tr |
| `technique.edit` | header Edit | Technique | — |
| `technique.from` | From position row | Technique | — |
| `technique.to` | To position row | Technique | — |
| `technique.resources.add` | Add resource | Technique | tr |
| `technique.resource.<resourceId>` | resource row | Technique | tr |
| `technique.resource.<resourceId>.watched` | Watched chip | Technique | tr |
| `technique.resource.<resourceId>.open` | open link | Technique | — |
| `technique.resources.empty` | empty caption | Technique | tr |
| `technique.history.<sessionId>` | history row | Technique | — |
| `technique.loading` | LoadingState | Technique | — |
| `technique.notFound` | not-found state | Technique | — |
| `libraryEdit.sheet` | sheet root | Library edit | le, lm |
| `libraryEdit.title` | header title | Library edit | le |
| `libraryEdit.cancel` | Cancel | Library edit | — |
| `libraryEdit.field.name` | name field | Library edit | le, lm |
| `libraryEdit.keepAlias` | keep-old-name chip | Library edit | le |
| `libraryEdit.type.<TYPE>` | technique type chip | Library edit | — |
| `libraryEdit.from.input` / `libraryEdit.from.clear` | from search / clear | Library edit | — |
| `libraryEdit.from.result.<positionId>` | from result row | Library edit | — |
| `libraryEdit.from.selected` | picked from chip | Library edit | — |
| `libraryEdit.to.input` / `libraryEdit.to.clear` | to search / clear | Library edit | — |
| `libraryEdit.to.result.<positionId>` | to result row | Library edit | — |
| `libraryEdit.to.selected` | picked to chip | Library edit | — |
| `libraryEdit.parent.input` / `libraryEdit.parent.clear` | parent search / clear | Library edit | — |
| `libraryEdit.parent.result.<positionId>` | parent result row | Library edit | — |
| `libraryEdit.parent.selected` | picked parent chip | Library edit | — |
| `libraryEdit.appliesTo.GI` / `.NOGI` / `.BOTH` | applies-to segment | Library edit | — |
| `libraryEdit.perspective.ANY` / `.TOP` / `.BOTTOM` | perspective segment | Library edit | — |
| `libraryEdit.field.description` | description | Library edit | — |
| `libraryEdit.field.notes` | notes | Library edit | — |
| `libraryEdit.alias.<aliasId>` | alias chip (tap removes) | Library edit | le |
| `libraryEdit.alias.undo` | inline Undo | Library edit | — |
| `libraryEdit.aliases.add` | + Add alias | Library edit | — |
| `libraryEdit.alias.input` | new alias field | Library edit | — |
| `libraryEdit.alias.submit` | Add alias | Library edit | — |
| `libraryEdit.alias.error` | alias ErrorBanner | Library edit | — |
| `libraryEdit.merge` | Merge into another… | Library edit | lm |
| `libraryEdit.delete` | Delete | Library edit | le |
| `libraryEdit.save` | primary Save / Add | Library edit | le, lm |
| `libraryEdit.save.reason` | disabled reason | Library edit | — |
| `libraryEdit.error` | ErrorBanner | Library edit | — |
| `libraryEdit.notFound.cancel` | not-found dismiss | Library edit | — |
| `libraryEdit.merge.panel` | merge panel root | Library edit | lm |
| `libraryEdit.merge.search.input` | survivor search | Library edit | lm |
| `libraryEdit.merge.search.clear` | clear search | Library edit | — |
| `libraryEdit.merge.result.<id>` | survivor row | Library edit | lm (by `id` regex) |
| `libraryEdit.merge.back` | Back to editing | Library edit | — |
| `libraryEdit.merge.confirm` | Merge into X | Library edit | lm |
| `resourceEdit.sheet` | sheet root | Resource edit | tr |
| `resourceEdit.heading` | header title | Resource edit | — |
| `resourceEdit.cancel` | Cancel | Resource edit | — |
| `resourceEdit.field.title` | title field | Resource edit | tr |
| `resourceEdit.field.url` | URL field | Resource edit | tr |
| `resourceEdit.field.author` | author field | Resource edit | — |
| `resourceEdit.type.<typeId>` | type chip | Resource edit | — |
| `resourceEdit.field.notes` | notes | Resource edit | — |
| `resourceEdit.status.TO_WATCH` / `.WATCHED` | status segment | Resource edit | — |
| `resourceEdit.delete` | Delete resource | Resource edit | tr |
| `resourceEdit.save` | primary | Resource edit | tr |
| `resourceEdit.save.reason` | disabled reason | Resource edit | — |
| `resourceEdit.error` | ErrorBanner | Resource edit | — |
| `dev.reset.backup` | backup status line | dev | — |

Unchanged sprint-1 ids that sprint-2 flows reuse: `tabs.home`, `tabs.library`, `tabs.log`, `toast`, `toast.message`, `toast.undo`, `library.position.<positionId>` (le, lm), `library.technique.<techniqueId>` (tr; now pressable), `library.subject.<subjectId>` (now pressable), `library.search.input` (le), `library.segment.*`, `home.rank` (rt), `rank.belt.<BELT>` (rt; kids belts included), `rank.stripes.*`, `rank.save` (rt), `home.recent.<sessionId>` (bl), `session.screen` (bl), `session.focus.<refId>` (lm), `position.technique.<techniqueId>` (now pressable). The regression flow `bl` asserts `assertNotVisible: text: "(tabs)"` (no id).

## §8 Deviations from the design system (one table)

| DSR / rule | element | system value (source) | decision | tokens / components | scope |
|---|---|---|---|---|---|
| DSR-17, R-C5 | progression states | no state tokens or component (cm:446) | text label + SF/Material glyph, neutral `textSecondary`; section header + row line (P-02, P-03) | `caption`, `titleM`, Icon | Progress, why sheet |
| DSR-17 | "why" explanation | pattern missing (cm:446) | why sheet: state, rule sentence, score line, one row per signal with value / weight / threshold / "Decided this result" (§4.3) | ListRow anatomy, SheetChrome | why sheet |
| R-A1, R-C5 (new DSR-30) | heatmap level fills | no 4-step graphic ramp; accent steps `accentTint`/`accentGraphic`/`accentText` | P-04 mapping; `accentText` (a text token) used as the L3 fill; L1 and L0 differ by 1.03 (light), L2 and L3 by 1.15 (dark) — the count digit in each cell carries the value at AA | `bgRaised`, `accentTint`, `accentGraphic`, `accentText`, `accentOn`, `inverseFg` | heatmap |
| R-C4 | L3 digit pairing | semantic pairs only (`semantic.*`) | new pair `inverseFg` on `accentText` (5.01 L / 12.38 D, §9.1) | — | heatmap |
| cm:313 | today marker | week-strip today ring = 1.5 `accentBorder` | heatmap today ring 1.5 `textPrimary` (`accentBorder` equals the L2 fill in light and is 2.83:1 on the card) | `size.borderWidthFocus`, `textPrimary` | heatmap |
| — | heatmap legend swatch, gap bar height | no size tokens (cm:337 draws a 4-high bar) | swatch `spacing[4]` square; bar height `spacing[1]` | `spacing[1]`, `spacing[4]`, `radius.xs` | Progress panels |
| DSR-15 | gap bar fill | position bar draws `textPrimary`; progress elsewhere uses accent (cm:338) | `textPrimary` on `borderDefault` (as drawn; 14.21 / 12.40) | — | gap panel |
| DSR-6 | switch off state | not drawn (cm:125-126) | P-15: off track `borderStronger`, off thumb `textPrimary` | `borderStronger`, `textPrimary`, `accentFill`, `accentOn` | SwitchRow |
| cm:124, DSR-11 | switch row label | 14/500 on `bgRaised` | `textStyle.chipRegular` (exact 14/500) + `caption` hint | `chipRegular`, `caption` | SwitchRow |
| DSR-21, R-T1 | Profile / Settings screen | not drawn (cm:450) | Q3 (a) layout §4.4.1: rank card, overline groups, ListRows, SwitchRows, segmented theme | as cited | Profile |
| DSR-20 | taxonomy and weights editing | not drawn (cm:449) | `library-edit` sheet + merge panel (§4.5), Algorithm screen (§4.4.2); history = soft delete, aliases, merge payload (data) | TextField, PositionPicker, Stepper | Library, Algorithm |
| cm:111-118 | editable stepper value | value is display text | the value is a `TextInput` in `stepperValue` with a focus ring (P-12) | `stepperValue`, `borderWidthFocus`, `accentBorder` | Algorithm |
| R-M3, cm:270 | undo toast inside a sheet | toast is the undo surface | aliases: inline undo line in the sheet (P-18); everywhere else the toast after dismiss (P-32) | ghost Button, `caption` | library-edit |
| R-N3 | sheet detents | medium / large | why sheet `[0.5, 1]` (matches); edit sheets large only (fd D-A23 reason: form + action bar) | react-native-screens formSheet | sheets |
| cm:291, R-N4 | detail "Edit" | Android app bar trailing action in a 48 box; iOS has no drawn header action | native `headerRight` text button `button` `accentText`, min `hit` × `hit` (P-16) | `textStyle.button`, `accentText` | Position, Technique detail |
| cm:317 | section header with icon / count / Add | title + trailing link only | Progress headers add a leading state glyph; Technique Resources uses the trailing link as drawn | SectionHeader | Progress, Technique |
| DSR-15, M:103-106 | kids split belts | "50 % band", geometry not drawn | P-25 centred band at 50 % height; edge = fill | `beltKids*`, `beltWhite`, `beltBlack`, `beltBar` | BeltRank, swatch |
| DSR-4 | kids belt edges and bands | yellow/orange fills < 3:1 on light; white bands 1.43–2.75 on kids fills | name always beside the belt; belt `accessibilityElementsHidden` | `rank.title` | Rank surfaces |
| DSR-11 | Progress large title, stat-like summaries | 32/36 large title (Prog:20); 28/30 total (Prog:57) | `titleL`; panel summaries `headline` | `textStyle.*` | Progress |
| DSR-13 / DSR-14 | off-grid padding and radii | 14, 18; radius 14, 10, 6 | fd T-11 rule (14→12, 18→16; radius 14→`md`, 10/6→`sm`) | `spacing.*`, `radius.*` | all new screens |
| cm:241 | list rows without icon tile | leading icon tile | omitted (fd §8 precedent) | ListRow | Profile, Technique, Progress |
| R-C1 | accent on Progress | accent for "charts, intensity and progress" | accent only in the heatmap fills and the streak text; states and rows stay neutral (R-3) | — | Progress |
| R-M5 / R-47 | icons | 24 grid strokes; no exported set | expo-symbols names in P-03, P-29 and `openLink` (verified, §3) | Icon | all |
| plan §10 | long-press / overflow on library rows | plan wording | P-16: entry via plus, header Edit and subject row tap | — | Library |
| plan §10, §12 | `merge` formSheet route | plan wording | P-17: inline merge panel in `library-edit` | — | Library |
| plan §10 | rank "swipe/soft delete" | plan wording | P-24: delete from the Set-rank edit sheet | — | Profile › Rank |
| plan §11.3 | flow strings | "1 sessions on 1 days"; `about.attribution.grapple-flows.link` | P-30 plural copy; P-27 slug `bjj-data-by-grapple-flows` | — | tester |

## §9 Accessibility

- **Roles and labels:** every control in §4 names its role and i18n label. Icon-only controls: Library plus (`library.add.<KIND>`), open link (`technique.resource.open.a11y`). Toggles expose state: SwitchRow `checked`, Watched / keep-alias chips `checked`, segments `selected`, merge results `checked` (radio), steppers `adjustable` with `accessibilityValue` and disabled at limits. The heatmap grid: each cell `accessible` with its label (plan §11.2); the card header text is the chart summary (R-A3); the weekday header and swatches are hidden.
- **Reading / focus order:**
  - Progress: title → window → each section (header, rows top to bottom; row = name, state line, Flagged, "Show why") → heatmap (title, summary, streak, minutes, empty line, cells week by week, range, legend) → planned vs trained (summary, rows) → rank card.
  - Why sheet: Close → title (focused on open) → state → Flagged → rule → flagged note → score → rescale note → signals → window → settings link.
  - Profile: title → rank card → groups in order (overline, then rows). Algorithm: preview (polite live region) → groups → each field (label, −, value, +, range, error) → reset.
  - library-edit: Cancel → title (focused on open) → fields top to bottom → merge / delete → action bar (reason or error, then primary). Merge panel: title (focused) → body → search → results → selection summary (polite) → back → action bar.
  - Technique detail: back → title → aliases → meta tags → From / To → description → notes → Resources (header, Add, rows: title, meta, Watched, open) → History.
  - About: title → app block → backup status → each source block (name, use, licence, credit, changes, version, links).
- **Targets (`hit` 44 pt / 48 dp, R-18):** chips and segments 36 → slop 4 / 6; Stepper buttons and IconButtons 44 → 0 / 2; the Resources "Add" and About links (text) get min height `hit` and horizontal padding `spacing[2]`; header Edit min `hit` × `hit`; heatmap cells are not targets. Wrapped chip rows (aliases, technique types, resource types) use the fd R1-10 `rowGap`.
- **Status never by colour alone:** states = text + glyph; Flagged = badge text + glyph; heatmap = digit + cell label (+ summary); gap = "x of y" + parts (bar decorative); Watched = check + label; switch = thumb position + native "on/off" value; disabled primary = reason text (R-C6); rank = name.
- **Dynamic Type 200 %:** rows wrap; the heatmap cells are width-driven (digit 26 pt fits 42 pt); SwitchRow and ParamField stack text above controls when `PixelRatio.getFontScale() ≥ 1.5` (fd D-A24 rule); sheet action bars stay bottom-anchored.
- **Reduce Motion:** sheets native; no animated transitions added; the heatmap has no animation.
- **Announcements:** toasts (polite, fd D-A11); ErrorBanners (polite live region); algorithm preview and merge selection summary (polite).
- **Keyboard (platform):** iOS `KeyboardAvoidingView` + `automaticallyAdjustKeyboardInsets` (fd T-07) on edit sheets and Algorithm; Android `adjustResize`; decimal pads commit on blur (iOS decimal-pad has no return key).

### §9.1 Contrast pairs computed this sprint (WCAG 2.x; the designer's formula run as a repository-local node script; dark `accentTint` composited over `bgSurface` = `#19362A`)

Text (4.5:1 at `caption` 13/500, the heatmap digit):

| pair | light | ratio | dark | ratio | result |
|---|---|---|---|---|---|
| L1 digit `accentText` on `accentTint` (on `bgSurface`) | #0B7A3E on #DCF8E8 | 4.82 | #5FE69C on #19362A | 8.29 | L pass · D pass (= contrast doc :34) |
| L2 digit `accentOn` on `accentGraphic` | #0B0C0E on #17B061 | 6.91 | #0B0C0E on #2EDB7F | 10.77 | L pass · D pass — **new (light)** |
| L3 digit `inverseFg` on `accentText` | #F6F6F3 on #0B7A3E | 5.01 | #0B0C0E on #5FE69C | 12.38 | L pass · D pass — **new** |
| out-of-window digit `textSecondary` on `bgSurface` | #5A5F67 on #FFFFFF | 6.43 | #A3A8B0 on #15171A | 7.51 | pass (= doc :24) |

Non-text (3:1, WCAG 1.4.11):

| pair | light | ratio | dark | ratio | result / handling |
|---|---|---|---|---|---|
| L0 `bgRaised` on `bgSurface` | #EEEEEA / #FFFFFF | 1.16 | #1E2125 / #15171A | 1.11 | fail; empty cell, decorative (= doc :93) |
| L1 `accentTint` on `bgSurface` | #DCF8E8 / #FFFFFF | 1.13 | #19362A / #15171A | 1.37 | fail; digit carries it (= doc :97) |
| L2 `accentGraphic` on `bgSurface` | #17B061 / #FFFFFF | 2.83 | #2EDB7F / #15171A | 9.88 | L fail · D pass; digit (= doc :62) |
| L3 `accentText` on `bgSurface` | #0B7A3E / #FFFFFF | 5.43 | #5FE69C / #15171A | 11.36 | pass — **new as a fill** |
| L0 vs L1 | #EEEEEA / #DCF8E8 | 1.03 | #1E2125 / #19362A | 1.23 | fail; digit — **new** |
| L1 vs L2 | #DCF8E8 / #17B061 | 2.51 | #19362A / #2EDB7F | 7.21 | L fail · D pass — **new** |
| L2 vs L3 | #17B061 / #0B7A3E | 1.92 | #2EDB7F / #5FE69C | 1.15 | fail; digit — **new** (DSR-30) |
| today ring `textPrimary` on `bgSurface` | #0B0C0E / #FFFFFF | 19.57 | #F4F4F1 / #15171A | 16.30 | pass (= doc :21) |
| legend L0 swatch `bgRaised` on `bgBase` | #EEEEEA / #F6F6F3 | 1.07 | #1E2125 / #0B0C0E | 1.21 | fail; caption "None" beside it (= doc :94) |
| switch off thumb `textPrimary` on track `borderStronger` | #0B0C0E / #A9AAA3 | 8.35 | #F4F4F1 / #4A4F56 | 7.49 | pass (= doc :71) — `accentOn` off would be 2.37 dark, rejected (P-15) |
| switch off track `borderStronger` on `bgRaised` | #A9AAA3 / #EEEEEA | 2.01 | #4A4F56 / #1E2125 | 1.96 | fail; thumb position + native value (= doc :69) |
| kids band `beltWhite` on grey / yellow / orange / green | #EDEDE8 on #8E9196 · #F2C230 · #F2862E · #2FA35A | 2.69 · 1.43 · 2.17 · 2.75 | same | same | fail; name always shown (DSR-4) — **new** |
| kids band `beltBlack` on grey / yellow / orange / green | #111111 on the four | 5.97 · 11.27 · 7.40 · 5.85 | same | same | pass — **new** |
| kids bar `beltBar` on grey / yellow / orange / green | #0B0C0E on the four | 6.19 · 11.68 · 7.66 · 6.06 | same | same | pass — **new** |

Reused recorded pairs: `textSecondary` on `bgBase` / `bgSurface` / `bgRaised` (doc :23-25), `accentText` on `bgBase` / `bgSurface` (:31-32; links, streak, header Edit, Resources Add), `accentText` on `accentTint` over `bgBase` (:35; selected chips), `textPrimary` on `borderDefault` (:70; gap bar), Flagged badge on `bgBase` (:45) and on `bgSurface` (:40), `inverseFg` on `inverseBg` (:29; segments), `accentOn` on `accentFill` (:30, :72; primary, switch-on thumb), destructive on tint over `bgSurface` (:39). New pairs (marked **new**): 2 text (L2 digit light, L3 digit) and 16 non-text (L3 fill, three level adjacencies, 4 white bands, 4 black bands, 4 kids bars). They must be appended to `docs/design-system-contrast.md`; this commit stages only `design.md` (orchestrator instruction), so the append is an orchestrator action.

## §10 Data the UI consumes (contract: plan §5; for `data-contracts.md`)

### §10.1 New feature components (frontend-coder)

| component | where | built from | notes |
|---|---|---|---|
| `ProgressScreen`, `ProgressRow`, `ConsistencyCard`, `PlannedVsActualCard`, `RankHistoryPanel` | features/progress | §4.2 | heatmap is a plain `View` grid (plan §10) |
| `WhySheet`, `ruleSentence()`, `signalFormat()` | features/progress | §4.3, P-31, P-33 | pure helpers, Jest-tested |
| `ProfileScreen`, `AlgorithmScreen`, `ParamField`, `SuggestionsScreen`, `RankScreen`, `AboutScreen` | features/profile | §4.4 | `PARAM_UI` table = §4.4.2 (key → label, unit, step, decimals, group) |
| `useThemeOverride()` | features/profile (used by `_layout.tsx`) | §4.1.4 | `Appearance.setColorScheme` |
| `LibraryEditSheet`, `PositionPicker`, `AliasesBlock`, `MergePanel` | features/library | §4.5 | |
| `TechniqueDetailScreen`, `ResourceRow`, `ResourceEditSheet` | features/library | §4.6, §4.7 | |
| `TextField`, `SwitchRow` | components | P-36, §4.4.1 | required `label` (R-A4) |

Icon map additions (`components/Icon.tsx`): `progress`, `profile` (P-29), `stateImproving`, `stateSteady`, `stateNeedsWork`, `stateNotTrained` (P-03), `openLink` (`arrow.up.right.square` / `open_in_new`).

### §10.2 Names this spec relies on (plan §5; plan wins on spelling)

| name | consumer |
|---|---|
| `useProgress()` → `ProgressOverview` (`results`, `params`, `windowStart`, `today`, `algorithmVersion`, `consistency`, `plannedVsActual`) | Progress, why sheet, Algorithm preview |
| `ProgressResult` `ref`, `name`, `removed`, `state`, `rule`, `flagged`, `n`, `score?`, `lastTrainedOn?`, `signals[]` (`SignalRow`) | rows, why sheet |
| `ConsistencyData.weeks[].days[]` (`DayCell`), `totals` | heatmap |
| `PlannedVsActualData.rows[]` (`GapRow`), `totals` | gap panel |
| `useAlgorithmParams()` → `AlgorithmParamRow` (`key`, `value`, `defaultValue`, `min`, `max`, `algorithmVersion`); actions `setParam`, `resetParams` | Algorithm |
| `useSetting(key)`, action `setSetting` for `theme.override`, `rank.scale`, `library.showExtended`, `log.detailedRounds`, `suggest.*` | Profile, Suggestions, Rank, shell |
| `useCurrentRank()`, `useRankHistory()` (active scale); actions `addRank`, `updateRank`, `deleteRank`, `undoDeleteRank` | rank card, Rank, Set rank |
| `useTechnique(id)` → `TechniqueDetail` (incl. `aliases`, `fromName`, `toName`, `history[]`); `useResources(target)`, `useResourceTypes()` | Technique detail, resource-edit |
| `usePosition(id)` (`notes`, `aliases`), `useLibraryPositions(q)`, `useTechniqueSearch(q)`, `useSubjects()` | edit sheet, pickers, merge |
| actions `createPosition/Technique/Subject`, `updatePosition/Technique/Subject` (`keepOldNameAsAlias`), `deleteTaxonomy`, `undoDeleteTaxonomy`, `addAlias`, `removeAlias`, `undoRemoveAlias`, `merge` (→ `MergeResult.mergeId`), `undoMerge` | library-edit |
| actions `createResource`, `updateResource`, `setResourceStatus`, `deleteResource`, `undoDeleteResource` | Technique, resource-edit |
| `useAbout()` → `AboutData` (`appVersion`, `algorithmVersion`, `taxonomyRelease`, `backup`, `attribution.sources[]`) | About, Profile row |
| `AliasRow.id` per alias of the edited row (`taxonomy.listAliases` via `usePosition` / `useTechnique`) | alias chips need ids to remove |
| `DomainError.details.min/max` on `PARAM_OUT_OF_RANGE` (plan §5.3) | param banner copy |

**Additive requests (do not change plan §5 signatures):**
1. `TechniqueDetail` exposes whether each endpoint position is soft-deleted (e.g. `fromRemoved?: boolean`, `toRemoved?: boolean`) — plan §12 "getTechnique still opens from history with '(removed)' endpoints" needs a field to render it.
2. `usePosition` / `useTechnique` expose the aliases as `AliasRow[]` (ids), not only `string[]`, for the alias chips (plan §5.5 `listAliases` "part of `usePosition` / `useTechnique`").

## §11 Design-system requests (for the user's next artifact re-export; none blocks this sprint)

| # | request | why | screens |
|---|---|---|---|
| DSR-30 | A 4-step graphic ramp for activity heatmaps (empty / low / mid / high) that keeps adjacent steps ≥ 3:1 apart in both themes, with the digit colour per step | today L0/L1 light 1.03, L2/L3 dark 1.15 (§9.1); the digit is the only channel | Progress heatmap |
| DSR-31 | Settings patterns: grouped list header, switch row (off colours, DSR-6), editable stepper value, header text action | Profile/Algorithm built from the closest drawn parts (§8) | Profile, Algorithm, detail headers |
| (open) | DSR-17, 20, 21 are now answered in code by §8; drawing them (state badge, why sheet, edit sheet, Profile) lets the next intake replace these decisions | — | Progress, Library, Profile |

## §12 Reviewer checklist

- [ ] Every colour, spacing, radius, size and type value in §4 is a `tokens.ts` name or a §8 row (grep §4 for `#` or `px`: none).
- [ ] Rulings: Q1 (a) three panels (§4.2.3–§4.2.5) · Q3 (a) Profile = Settings titled "Profile", rank on top (§4.4.1) · Q5 theme override (§4.1.4, §4.4.1) · Q2 (b) no type-list editing · Q4 (b) no coral/red belts.
- [ ] Plan §13 design-level choices decided: why = sheet (P-01), heatmap sizing (P-05), icons (P-03, P-29).
- [ ] Domain rules in the UI: states and Flagged never by colour (§4.2.2, §4.3); "why is this flagged" explainable (§4.3 `progress.why.flagged`, signals with contributed mark); planned vs actual distinguishable (gap panel text); weights editable in-app (§4.4.2) with reset + undo.
- [ ] R-26: no confirm dialogs — deletes, merge, reset, rank delete all undoable (P-14, P-18, P-20, P-24); empty states name the next step (`progress.empty`, `progress.consistency.empty`, `progress.gap.empty`, `technique.resources.empty`, `technique.history.empty`, `profileRank.empty`); one-handed (§4.9).
- [ ] One accent button per screen (R-C1): only the sheet primaries; no accent inside belt components (P-25, R-T6).
- [ ] Toasts never shown under a native sheet (P-32); in-sheet alias undo uses the inline line (P-18).
- [ ] Copy table covers every string in §4; `errors.*` covers every plan §0 code; one changed string marked.
- [ ] testID table covers every interactive element and list row in §4; `## §7 testID table` / `## §8 Deviations` headings intact; flows named per id.
- [ ] Hit areas per §9; wrapped chip rows use the fd R1-10 `rowGap`.
- [ ] §9.1 ratios recomputed; the **new** rows appended to `docs/design-system-contrast.md` (orchestrator).
- [ ] 390 / 430 pt, light / dark, iOS / Android differences explicit (§4.1.2–§4.1.4, §4.2.3 frames, §4.4.1 Switch, §9 keyboard).
- [ ] §10.2 names match plan §5; the two additive requests are answered in `data-contracts.md`.
- [ ] No parked element (DSR-26…29) appears; About links and resource URLs open only on a user tap and carry no user data.
