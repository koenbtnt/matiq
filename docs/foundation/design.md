# foundation — design

Designer: Thaleia · 2026-11-01 · branch `feature/foundation` · sprint 1. Input: `docs/foundation/plan.md` §0, §0.1, §4, §7, §8, §10. Sources: `design-system/RULES.md` (R-*), `design-system/components.md` (`cm:<line>`), `design-system/tokens.json` v1 (`_status: intake`) through `mobile/src/theme/tokens.ts` (`tk:<line>`), the artifact `design-system/artifact/canvas/*.dc.html` (`Log:`, `Home:`, `Lib:`), `docs/decisions.md` (R-18, R-26, R-28), `docs/product-spec/assumptions.md` A-7, `.claude/rules/frontend.md`.

**Token notation.** A colour name such as `bgSurface` means `colors[scheme].bgSurface` (`tk:185-267`), where `scheme` is `useColorScheme()`. Light and dark use the same name (R-T2). `spacing[n]`, `radius.*`, `size.*`, `textStyle.*`, `semantic.*`, `motion.*` and `haptics.*` are the `tokens.ts` exports. `hit` means `Platform.select({ ios: size.touchTarget, android: size.touchTargetAndroid })` (44 pt / 48 dp, R-18). **Hit-slop rule (R1-09):** a control whose visual height `v` (or width) is below `hit` gets `hitSlop` = `(hit − v) / 2` on that axis, per platform. That gives:

| visual | example | iOS slop | Android slop |
|---|---|---|---|
| 36 | `chipHeight`, `segmentHeight` | 4 | 6 |
| 40 | `toastActionHeight` | 2 | 4 |
| 44 | `stepperButton`, `iconButton`, `intensityButtonHeight`, `searchHeight`, `buttonCompactHeight` | 0 | 2 |
| ≥ 48 | — | 0 | 0 |

Chips and segments are at least `hit` wide (`minWidth: hit`), so they need no horizontal slop. Every "`hitSlop` to `hit`" below means this rule. **Wrapped chip rows (R1-10):** every `flexWrap` row of 36-high chips uses `columnGap: spacing[2]` and `rowGap: Platform.select({ ios: spacing[2], android: spacing[3] })`, which is ≥ `hit − size.chipHeight`, so neighbouring slops never overlap. A pill radius is `height / 2` of its own size token (R-L2). Every number uses `fontVariant: fontVariantNumeric` (R-Y3), and every `<Text>` sets `maxFontSizeMultiplier={textMaxScale.<style>}` (`tk:56-82`).

## §0 Summary for builders

**Screens in scope (source):**

| screen | route | design-system source | section |
|---|---|---|---|
| Tab bar Home · Log · Library | `(tabs)/_layout.tsx` | cm:273-288; R-N1, R-N2 | §4.1 |
| Splash hold + bootstrap error + dev reset | `_layout.tsx`, `dev/reset.tsx` | plan §7; R-C6 | §4.2 |
| Log Session (log · plan · edit) | `log-session.tsx` (formSheet) | `Log:18-93`; cm:249-261, :369-375 | §4.3 |
| Home + Set-rank sheet | `(tabs)/index.tsx`, `set-rank.tsx` | `Home:35-115`; cm:212-236, :321-328, :384-391 | §4.4 |
| Session detail | `session/[id].tsx` | cm:212-222 | §4.5 |
| Library + Position detail | `(tabs)/library/index.tsx`, `library/position/[id].tsx` | `Lib:19-35`; cm:238-247, :97-109 | §4.6 |

**Decisions index:** T-01…T-14 in §3; plan assumptions D-A1…D-A24 in §0.1; DSR decisions in §8.

**Components used (one line each, all built from tokens; none exists yet, `mobile/src/components/` is empty):** Button (primary · secondary · ghost · destructive · outlined compact) · IconButton · TextArea · SearchField · SegmentedControl · Stepper · ScalePicker (intensity picker, reused for rating and energy, DSR-19) · Chip (filter · selectable · add · picker) · Tag · Badge (+ Flagged, DSR-17) · BeltRank + belt swatch · Card · ListRow · SheetChrome (handle + header) · BottomActionBar · Toast + ToastHost · MainTabBar · SectionHeader · EmptyState · ErrorBanner (DSR-7) · LoadingState (DSR-9) · Icon (expo-symbols wrapper).

**Gaps decided within tokens (listed in §8 Deviations):** DSR-1/2, 4, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 23, 24, 25, 26, 29.

**New feature components (§10.1):** FocusRow (DSR-18), FocusSearch, QuickAddChips, TechniqueAttach, SparringSection, SessionSection, NextSessionCard, StaleSessionRow, SuggestionRow, RecentSessionRow, RankCard, SetRankSheet, PositionRow, TechniqueRow, SubjectRow, BootstrapErrorScreen.

**R-26 fast path (A-7):** Log tab or Quick log → prefilled Log sheet = **1 tap**; Save = **tap 2** when a planned session is today; otherwise one quick-add chip tap, then Save = **3 taps**, under 30 s (§4.3.6).

**Copy table:** §6, 301 rows, all `<screen>.<element>`. Five obsolete keys are removed (§6.9). **testID table:** §7, with the Maestro flow for each id.

**Data the UI consumes:** the contract is plan §4. §10.4 lists the names this spec uses: `HookResult<T>`, `sessions.skip` / `undoSkip`, `useHome().suggestions`, `matchedAlias`, `getPosition` `parent` / `children`, the `useTechniqueSearch` `type` filter, `SubmissionRow` / `SubmissionInput`.

**New packages (frontend-coder, §10.3):** `@react-native-community/datetimepicker` (R-N5) and `expo-haptics` (R-M4). Keep `expo-symbols`, an exception to the CO-13 prune. `app.json`: splash colours from `bgBase`. `predictiveBackGestureEnabled` stays `false` (T-13 withdrawn).

**Design-system requests to the user:** none new. The decisions above go back to the PO as DSR-6…25 answers (§11).

**Contrast:** two new pairs, computed in §9.1. Both pass, and both are appended to `docs/design-system-contrast.md` (R1-03).

**Binding conflicts found (§3):** R-M1 says "48 dp pending" while R-18 rules 48 dp, so R-18 is applied (T-12). R-M3 says "always undoable", but there is no revert API for edits (D-A10, accepted in review 1).

### §0.1 Designer assumptions — each assumed, pending PO (2026-11-01)

| id | assumption | default taken | lands in | if the PO rules otherwise |
|---|---|---|---|---|
| D-A1 | What the Log tab press prefills (plan §8 names only the Home quick-log rule) | Log tab = Quick log: both call `openQuickLog()` → `quickLogTarget(home)` → `log-session?mode=log&sessionId=` or `&typeId=` | §4.1, §4.4 | Log tab opens an empty log; the ≤ 2-tap path only from Home Quick log |
| D-A2 | Tab order with three tabs (R-N1: Log is the centre; plan F-18 lists Home · Library · Log) | **Home · Log · Library**, so Log stays centre; with five tabs it becomes Home · Library · Log · Progress · Profile | §4.1 | Log at the right edge; one ordering change in `MainTabBar` |
| D-A3 | Session type control: segmented is for 2–4 options (cm:98), but R-03 seeds 6 types | single-select filter chips in a horizontal scroll row | §4.3.2 | segmented control capped at 4 visible types + "More" |
| D-A4 | Tapping a focus without typing at log time | quick-add chips: last session's flagged focuses, then its other actual focuses; at most 6, already-added ones excluded | §4.3.3 | search only (+1 tap and typing on the no-plan path) |
| D-A5 | Per-focus comment, hit/caught, techniques on the mat-side path | behind an "Add details" disclosure per focus row; auto-open when any value exists | §4.3.3 | always expanded (longer scroll) |
| D-A6 | Clearing an optional 1–5 value | tap the selected level again → unset | §4.3.3, §4.3.5 | a separate "Clear" ghost button per picker |
| D-A7 | Untouched optional numbers | steppers show `0` (counts) / `–` (duration) and send `undefined`; the first touch sets a value (duration's first tap = 60, then ±15, range 15–240, `Log:155-158`) | §4.3.4-5 | defaults are stored (0 rounds, 60 min) |
| D-A8 | Default date/time in plan mode | today at the next full hour (tomorrow when that crosses midnight); log mode = now; from a plan = its `startsAt` | §4.3.2 | plan mode defaults to now |
| D-A9 | Dismissing a dirty Log sheet (Cancel, swipe-down, Android back) | dismiss at once + toast "Log discarded" with Undo, which reopens the sheet with the draft held in memory for exactly as long as that toast is visible: `motion.durationToast`, or until the next toast or navigation when D-A11 applies. Dropping the toast drops the draft (R1-17) | §4.3.7 | a confirm dialog (against R-26 "undoable instead of confirm") |
| D-A10 | Undo on save toasts (R-M3 "always undoable"): no revert API exists for completing a plan, edits or rank | Undo only when the save **created** a session or plan (Undo = `sessions.softDelete`); otherwise the toast has no action | §4.3.7, §4.4.6 | a `sessions.revert(snapshot)` / `rank.softDelete` API (data-coder) |
| D-A11 | Toast timeout with a screen reader (WCAG 2.2.1) | when `AccessibilityInfo.isScreenReaderEnabled()` the toast stays until the next toast or navigation | §4.1.3 | 4 s for everyone |
| D-A12 | Home greeting `Oss, [Name]` (Home:40) with no name stored | "Oss" alone | §4.4.1 | a name field (Settings, sprint 2) |
| D-A13 | Many stale planned sessions | show at most 5 (newest first) + caption "N more not logged" | §4.4.4 | full list (virtualised) |
| D-A14 | How "core vs extended" shows when `library.showExtended` is on | tag "Extended" on extended rows only; core rows untagged; off → extended rows not listed | §4.6 | a tag on both tiers |
| D-A15 | CC BY 4.0 attribution (R-28 "attribution shown in the app") before Settings/About exists | a caption footer on the Library Positions and Techniques lists | §4.6.6 | moved to About (sprint 2) |
| D-A16 | `session/[id]` is in the plan route tree but not in the screen brief | specified minimally (read-only + Edit) | §4.5 | — |
| D-A17 | Set-rank sheet shape (A-22 "minimal") | route `set-rank.tsx` (formSheet, `fitToContents`); belt rows with swatch + name; stripes stepper; awarded-on date | §4.4.6 | rank card hidden (A-22 fallback) |
| D-A18 | Icon source (R-M5 names SF Symbols / Material Symbols as the fallback; the artifact ships no icon files) | `expo-symbols` 58.0.4 (iOS SF Symbols, Android Material Symbols via its `@expo-google-fonts/material-symbols` dependency); stroke 1.75 ≈ weight `regular`, 2 / 2.25 ≈ `semibold` | §10.2 | an exported icon set (re-intake) |
| D-A19 | The date/time pickers and haptics need packages that are not installed | `@react-native-community/datetimepicker` (iOS `display="compact"`, Android `DateTimePickerAndroid.open`), `expo-haptics` | §10.3 | `@expo/ui` pickers (also prune-listed) |
| D-A20 | Splash visuals (DSR-25: no exported mark; template colour `#208AEF`) | splash `backgroundColor` = `bgBase` light `#F6F6F3`, `dark.backgroundColor` = `#0B0C0E`; no image until DSR-25 (if the plugin requires one, keep the template image and note it in `verify.md`) | §4.2.1 | the exported mark once DSR-25 lands |
| D-A21 | Nested picker sheets inside the Log formSheet (react-native-screens: "On Android nested stack rendering is not yet supported", `types.d.ts:491`) | inline search panels inside the sheet, never a second sheet | §4.3.3 | — |
| D-A22 | Which techniques a named submission may pick | `useTechniqueSearch` results filtered to `type === 'SUBMISSION'` | §4.3.4 | any technique |
| D-A23 | Log sheet detents | large only (`sheetAllowedDetents: [1]`); no medium detent, because the form and its action bar need the height | §4.3.1 | medium + large |
| D-A24 | Two-column grids at large text | when `PixelRatio.getFontScale() ≥ 1.5`, the stepper grids (hit/caught, landed/taken) stack to one column | §4.3, §9 | horizontal scroll |

## §1 Scope

This spec covers the sprint-1 shell and three screens on a three-tab shell (plan F-18…F-24): Log Session in three modes, Home with a minimal Set-rank sheet, and a read-only Library with Position detail. It also covers the session detail the plan routes to, and the visible states of the bootstrap (§7). Out of scope, so there are no dead buttons: Settings, Progress, Technique detail (A-21), cycles and slots, the detailed-rounds UI (A-20), export and erase, reminders, the kids scale, and the parked artifact elements DSR-26…29 (R-S5): the gym picker chip `Log:30-33`, the notification bell `Home:42`, coach, video. Every value is a token, a cited rule, or a §8 row. The artifact is not changed.

## §2 Changes since review 1 (2026-11-01, rework round 1; `docs/foundation/review-1.md`)

| finding | section | what changed |
|---|---|---|
| R1-02 | §4.3.3, §4.3.7, §4.6.7, §7 | testIDs `log.techniqueSearch.clear`, `log.notFound.cancel`, `library.error.retry` added and named in their sections |
| R1-03 | §9.1, `docs/design-system-contrast.md` | both new pairs appended to the contrast doc's text table |
| R1-08 | §0, T-13, §10.3 | T-13 withdrawn: `predictiveBackGestureEnabled` stays `false`; the predictive animation is a carry-over candidate |
| R1-09 | § Token notation, T-02, §4.3.3, §4.6.1, §8 DSR-14/16, §9 | one hit-slop rule `(hit − v)/2` per axis and platform (36 → 4/6, 40 → 2/4, 44 → 0/2), applied per control |
| R1-10 | § Token notation, §4.3.3, §4.3.4, §9 | wrapped chip rows: `rowGap` `spacing[2]` on iOS / `spacing[3]` on Android (≥ `hit − chipHeight`) |
| R1-16 | §4.3.6 | path B = 3 taps (no rating); B′ = 4 with the rating |
| R1-17 | §0.1 D-A9 | the draft lives exactly as long as its toast (incl. the D-A11 screen-reader case) |
| R1-18 | §9 | reading order for Position detail, Session detail, Set-rank and the bootstrap error screen |
| R1-19 | §8 | R-N3 row: large-only Log, `fitToContents` Set-rank, native scrim |
| R1-20 | T-14, §4.4.4, §6.4, §7, §12 | Skip rendered; gating removed |
| R1-01 (planner) | §0, §10.4 | §10.4's open requests replaced by a pointer to plan §4 with the names relied on; codes `COUNTS_REQUIRE_ACTUAL`, `TECHNIQUE_REQUIRES_ACTUAL` added to §6.2 |
| data-contracts (2026-11-01) | §6.2 | `errors.SESSION_START_INVALID`, `errors.ROUND_NO_INVALID`, `errors.DB_NOT_OPEN` (+ `bootstrap.title.DB_NOT_OPEN`) added for the codes `data-contracts.md:14` introduces |

## §3 Decisions

| # | question (source) | decision | reason |
|---|---|---|---|
| T-01 | DSR-15: log action 56 (C:45) vs 52 (Home:27) (plan §11) | `size.logAction` 56, not raised | R-S3: the board wins; the 4-pt raise is not a token |
| T-02 | DSR-15: segment 36 vs 40 (Log:40) (plan §11) | `size.segmentHeight` 36 in a track with `spacing[1]` padding (44 total); each segment gets vertical `hitSlop` 4 on iOS and 6 on Android (the hit-slop rule) | R-S3; R-18 |
| T-03 | DSR-18: planned vs actual marker (plan §8, §11) | the text status line (Planned / Planned · not trained / Added) + a "Trained" selectable chip with check icon; §4.3.3 | R-C5: text + icon, never colour |
| T-04 | DSR-19: rating input (plan §8 "reuse the intensity picker") | ScalePicker = the intensity picker (cm:134-139); overline "Rating · n of 5" | plan default; cm:448 offers reuse |
| T-05 | DSR-7: error state (plan §11) | ErrorBanner in the bottom action bar: `semantic.buttonDestructive` pair + error glyph + `errors.<CODE>` text; polite announcement | the recorded pair passes (contrast doc :39) |
| T-06 | DSR-8: empty states (plan §11; NF-06) | EmptyState = title (`headline`) + body (`body`, `textSecondary`) naming the next step + an optional secondary/ghost action | R-26 "empty states explain the next step" |
| T-07 | DSR-23: keyboard avoidance (plan §10, §11) | iOS: `KeyboardAvoidingView behavior="padding"` around the sheet with the action bar inside it, plus `automaticallyAdjustKeyboardInsets` on the ScrollView; Android: `softwareKeyboardLayoutMode: "resize"` (default); `keyboardShouldPersistTaps="handled"` | the action bar stays reachable while typing |
| T-08 | Thumb reach on Home (R-1) | the bottom-of-screen path is the Log tab (D-A1); the Quick log button is the labelled, discoverable twin near the top | R-C1 allows one accent button + the Log action |
| T-09 | One accent button per screen (R-C1) | Home: Quick log; Log sheet: Save; Session detail: Edit / Log it; Set-rank: Save rank; error screen: Try again. Next-session card buttons are outlined compact | R-C1, R-C2 |
| T-10 | Sheet surface: `bgSurface` (Log:20) vs `bgRaised` (C:232) | `bgSurface` | inputs, steppers and pickers are `bgRaised`; on a raised sheet they would have no fill step (§8) |
| T-11 | Off-grid / off-scale values (DSR-13/14) | round to the nearest token; ties go down (6→4, 10→8, 14→12, 18→16, 22→20); radius 14→`md`, 10→`sm`, 6→`sm`, 20→pill rule | one deterministic rule; denser fits 200 % text |
| T-12 | Hit targets: RULES R-M1 / DSR-16 "48 dp pending" vs `docs/decisions.md` R-18 "44 pt on iOS and 48 dp on Android … 'yes'" and `frontend.md` | **48 dp Android is binding** (`hit`) | a dated PO ruling outranks the derived RULES (R-18 itself asks for the amendment) |
| T-13 | ~~`predictiveBackGestureEnabled`~~ **withdrawn (review 1 R1-08)** | `false` stays: per `ExpoConfig.d.ts:605` it only enables the predictive-back *animation*, and the system back gesture works with `false`, so R-N4 is met. The animation is a carry-over candidate for when an Android test path exists. | overturned by the reviewer and the orchestrator |
| T-14 | Plan §8 Home "Skip (sets SKIPPED, undoable)" | Skip is rendered, and calls `sessions.skip` / `sessions.undoSkip` from plan §4 (added by the planner for R1-01) | product-spec §5 lists `sessions.skip` |

## §4 Screens

All screens: portrait, iOS and Android, light and dark, fluid width (content width = 350 at 390 pt, 390 at 430 pt; no breakpoint). Screen background `bgBase`; side gutter `spacing[5]` (R-L1). Top: safe-area inset + `spacing[4]` on tab screens (cm:304, DSR-13). Status bar `style="auto"`. Tab screens pad their scroll content at the bottom by the tab-bar height + `spacing[5]`.

### §4.1 Shell: root stack and tab bar

**§4.1.1 Navigation.** The root `Stack` (`app/_layout.tsx`) holds `(tabs)`, `log-session` (formSheet), `set-rank` (formSheet), `session/[id]` (push, which hides the tab bar) and `dev/reset` (`__DEV__`). `(tabs)` holds `index` (Home), `log` (never renders: its `tabPress` listener calls `preventDefault()` + `openQuickLog()`, D-A1) and `library` (a nested Stack with `index` and `position/[id]`). Back: iOS edge swipe + chevron, Android predictive back + arrow (R-N4, T-13).

**§4.1.2 MainTabBar** (custom `tabBar` for the Expo Router `Tabs`; cm:273-288). Three equal columns: Home · Log · Library (D-A2).

| property | iOS | Android |
|---|---|---|
| bar | `minHeight: size.tabbarHeightIos`, `paddingTop: spacing[2]` (Home:21), `paddingBottom: insets.bottom`; fill `tabbar`; top `size.borderWidth` `borderDefault` | height `size.tabbarHeightAndroid` + `insets.bottom`; fill `bgSurface`; no border |
| Home / Library item | icon `size.iconTabIos` over label `textStyle.tabLabel`, gap `spacing[1]` (DSR-13 3→4); active `accentText`, inactive `textSecondary` | pill `size.tabPillWidth`×`size.tabPillHeight`, radius `tabPillHeight/2`; active pill `accentTint` (`semantic.tabActiveAndroid`), icon `size.iconTabAndroid` `accentText`/`textSecondary`; label `tabLabelAndroidActive` `textPrimary` / `tabLabelAndroid` `textSecondary`, gap `spacing[1]` |
| Log action (centre) | circle `size.logAction`, fill `accentFill`, plus glyph 26 = `size.iconTabIos` in `accentOn`, weight semibold (≈ `iconStrokeEmphasis`); no visible label (Home:26) | same |
| hit | each column fills its width × ≥ `hit` | same |
| icons | Home `house` / `home`; Library `book.closed` / `menu_book`; plus `plus` / `add` | — |

States: default, active (the tab), pressed (DSR-6, §8). A11y: container `accessibilityRole="tabbar"`; Home and Library `role="tab"`, `accessibilityState={{ selected }}`, labels `tabs.home` / `tabs.library`; the Log action `role="button"` (it presents a sheet), label `tabs.log`. Reading order: Home, Log, Library.

**§4.1.3 Toast and ToastHost** (cm:263-271). One host in the root layout, above everything. Position: bottom, `spacing[5]` side margins, `spacing[3]` above the tab bar or the bottom action bar of the screen below it. Body: height `size.toastHeight`, radius `radius.md` (DSR-14), `semantic.toast` (`inverseBg`/`inverseFg`), padding left `spacing[4]`, right `spacing[2]` (DSR-13); leading check glyph `size.iconInline` semibold; message `textStyle.button`, flex 1, `numberOfLines={2}`; Undo (when there is an action): `textStyle.buttonStrong`, underlined, visual `size.toastActionHeight`, `hitSlop` to `hit`. Lifetime `motion.durationToast` (D-A11: no auto-hide while a screen reader runs). Enter/exit: opacity over `motion.durationState`, none with Reduce Motion. A11y: `AccessibilityInfo.announceForAccessibility(message)`; Undo `role="button"`, label `toast.undo.a11y`. A new toast replaces the current one.

### §4.2 Bootstrap: splash hold, error screen, dev reset (plan §7)

**§4.2.1 Splash hold.** No designed UI: the native splash stays until fonts and `useDatabaseBootstrap()` are both ready (plan §7.2). Splash config: D-A20. If the fonts fail, the app continues with the system font, as plan §7 requires (a deviation from R-Y1, §8).

**§4.2.2 BootstrapErrorScreen** (rendered by `_layout.tsx` instead of the navigator for `{ ok: false, code }`). `SafeAreaView` on `bgBase`; a column centred vertically, gutter `spacing[5]`, gap `spacing[3]`:
1. error glyph (`exclamationmark.circle` / `error`) `size.icon`, `textSecondary`, `accessibilityElementsHidden`
2. title `textStyle.titleM` `textPrimary`, `accessibilityRole="header"`: `bootstrap.title.<CODE>`
3. body `textStyle.body` `textSecondary`: `errors.<CODE>`
4. code `textStyle.caption` `textSecondary`: `bootstrap.code`

A BottomActionBar (§4.3.1 spec, on `bgBase` with no top border) holds a primary "Try again" (`common.tryAgain`), which re-runs the bootstrap and is busy while it runs. When `__DEV__`, a destructive button "Reset database" (`bootstrap.devReset`) sits above it, `spacing[3]` apart, and navigates to `/dev/reset`. The code-specific copy is in §6.2.

**§4.2.3 Dev reset** (`dev/reset.tsx`, `__DEV__` only). A centred LoadingState with `dev.reset.status`. When it succeeds: `router.replace('/')`. On `DB_RESET_FAILED`: the BootstrapErrorScreen with that code.

### §4.3 Log Session (`log-session`, modes `log` · `plan` · `edit`; plan F-19)

**Params:** `mode`, `sessionId?`, `typeId?` (from `quickLogTarget`), `focus?` (`POSITION:<id>` or `SUBJECT:<id>`, from a Home suggestion). **Data:** `useSessionTypes()`, `useHome()` (for `lastUsedTypeId`, `lastCompleted`, `suggestions`), `useSession(sessionId)` in edit or from-plan, `useFocusSearch(q)`, `useTechniqueSearch(q)`, `useSetting('library.showExtended')`.

| mode | title (`log.title.*`) | sections | primary (`log.save.*`) | save enabled when | calls |
|---|---|---|---|---|---|
| log, new | Log session | Type · When · Focuses · Sparring · Session | Save session | type + ≥ 1 actual focus | `sessions.log` |
| log, `sessionId` of PLANNED | Log session | same; planned rows pre-ticked | Save session | same | `sessions.log` (completes it) |
| plan, new | Plan session | Type · When · Focuses (no tick, no body) | Save plan | type + ≥ 1 focus | `sessions.create` |
| plan, `sessionId` (PLANNED) | Edit plan | same + Delete plan | Save plan | same | `sessions.create` with `sessionId` |
| edit (COMPLETED; review mode, R-26) | Edit session | as log + Delete session | Save changes | same as log | `sessions.log` with `sessionId` |

#### §4.3.1 Frame

- **Presentation:** `presentation: 'formSheet'`, `sheetAllowedDetents: [1]` (D-A23), `sheetCornerRadius: radius.xl`, `sheetGrabberVisible: false` (the handle is drawn so it matches on both platforms). The iOS sheet runs on UISheetPresentation; the Android one is a Material bottom sheet (react-native-screens `types.d.ts:491`). Container `bgSurface` (T-10).
- **SheetChrome** (cm:249-261; `Log:21-26`):
  - Handle: `size.sheetHandleWidth`×`size.sheetHandleHeight`, radius h/2, `borderStronger`, centred, `marginTop: spacing[2]`, decorative.
  - Header row: `paddingHorizontal: spacing[3]`, `paddingVertical: spacing[1]`, three slots with `flex: 1` · `flex: 2` · `flex: 1`.
    - Cancel: `textStyle.rowTitle` (DSR-11: 16/500), `textSecondary`, padding `spacing[2]`, min `hit`.
    - Title: `textStyle.headline` `textPrimary`, centred, `numberOfLines={1}`, `accessibilityRole="header"`.
    - Right slot: an empty spacer.
- **ScrollView:** `paddingHorizontal: spacing[5]`, `paddingTop: spacing[2]`, `paddingBottom:` action-bar height + `spacing[5]`. Sections are separated by `gap: spacing[5]` (Log:28). Inside a section, the label sits `spacing[2]` above its control. Section label = `textStyle.overline` `textSecondary` with `accessibilityRole="header"`.
- **BottomActionBar** (cm:369-375; Log:91-93): absolute bottom, `bgSurface`, top `size.borderWidth` `borderDefault`, `paddingTop: spacing[3]`, `paddingHorizontal: spacing[5]`, `paddingBottom: max(insets.bottom, spacing[3])` (DSR-13 34 → inset). Column, `gap: spacing[2]`:
  1. message line, one of three:
     - nothing;
     - the disabled reason `log.save.disabled.<log|plan>` in `textStyle.caption` `textSecondary` (R-C6);
     - an ErrorBanner (T-05): row, `gap: spacing[2]`, padding `spacing[3]`, radius `radius.md`, fill `feedbackDangerTint`, glyph `size.iconInline` `feedbackDanger`, text `textStyle.caption` `feedbackDanger`, `accessibilityLiveRegion="polite"` + announce.
  2. primary Button, full width.
- **Primary button states** (cm:38-51):
  - default: `semantic.buttonPrimary`, height `size.buttonPrimaryHeight`, radius h/2, label `textStyle.buttonLg`.
  - disabled: `semantic.buttonDisabled`.
  - busy (DSR-9): label replaced by `ActivityIndicator` `accentOn`; presses ignored; `accessibilityState={{ busy: true }}`, label `log.save.busy.a11y`.
  - pressed: DSR-6.

#### §4.3.2 Type and When

- **Type** (D-A3): overline `log.type.label`.
  - Container: horizontal `ScrollView` of filter chips (cm:142-146), `gap: spacing[2]`, `accessibilityRole="radiogroup"`, label `log.type.a11y`.
  - Chip: height `size.chipHeight`, radius h/2, `paddingHorizontal: spacing[4]`.
    - Active: `semantic.chipActive`, `textStyle.chip`.
    - Inactive: transparent + `size.borderWidth` `borderDefault`, `textPrimary`, `textStyle.chipRegular`.
  - Each chip: `role="radio"`, `accessibilityState={{ checked }}`, `hitSlop` to `hit`.
  - Prefill order: planned session's type → `typeId` → `lastUsedTypeId` → first by `sortOrder`. The active chip is scrolled into view on mount.
- **When:** overline `log.when.label`.
  - iOS (R-N5): a row, `gap: spacing[2]`, of two native `DateTimePicker`s, `display="compact"`, `mode="date"` and `mode="time"`, with `themeVariant` = `scheme` and `accentColor` = `accentText`.
  - Android: two picker chips (§8 DSR-14/16 row): height `size.chipHeight`, radius h/2, `bgRaised`, `textStyle.chipRegular` `textPrimary`, leading glyph `size.iconCheck` (`calendar_today` / `schedule`), `gap: spacing[2]`, `paddingHorizontal: spacing[3]`. Each opens `DateTimePickerAndroid.open({ mode: 'date' | 'time', design: 'material' })`. Labels: the date in the device locale (`Intl.DateTimeFormat`, weekday short + day + month short), and the time in the 24/12 h of the locale. A11y `log.when.date.a11y` / `log.when.time.a11y`.
  - Defaults: D-A8.

#### §4.3.3 Focuses (DSR-18 marker; per-focus inputs)

Overline `log.focuses.label`. Order: the focus rows (column, `gap: spacing[3]`), then the add block.

**FocusRow** (new; built on Card, cm:212-213).
- Card: `bgSurface`, `size.borderWidth` `borderDefault`, `radius.lg`, padding `spacing[4]`, `gap: spacing[3]`.
- **Header:** a row with `alignItems: center`, `gap: spacing[3]`.
  - Text column (flex 1): the name in `textStyle.headline` `textPrimary`, `numberOfLines={2}` (for `removed: true` it reads `common.removed`). Beneath it, the **status line** in `textStyle.caption` `textSecondary`.
  - Trailing control, by mode and row:
    - log/edit, planned row: the "Trained" toggle. It is a selectable chip (cm:147-150), height `size.chipHeight`, radius h/2, `paddingHorizontal: spacing[3]` (DSR-13 14→12).
      - Selected: `semantic.chipSelected` + `size.borderWidth` `accentBorder` + check `size.iconCheck` semibold, `gap: spacing[1]`, `textStyle.chip`.
      - Unselected: transparent + `borderDefault`, `textPrimary`, `textStyle.chipRegular`.
      - Label `log.focus.trained` in both states; the state is carried by the check icon.
    - log/edit, unplanned row: an IconButton "remove" (cm:61): `size.iconButton` circle, `bgRaised`, `borderDefault`, glyph `xmark` / `close` `size.iconButtonGlyph` `textPrimary`, label `log.focus.remove.a11y`. Unplanned rows have no "Trained" toggle, because an unplanned row is always actual (`is_planned = 1 OR is_actual = 1`, plan §3).
    - plan mode, every row: the same remove IconButton.

| row state | status line (`log.focus.*`) | trailing | body |
|---|---|---|---|
| planned + trained (default on a planned session at log time, plan §8) | `planned` "Planned" | Trained ✓ | shown |
| planned + not trained | `plannedNotTrained` "Planned · not trained" | Trained (no check) | hidden; the row is kept as the gap signal (F-20) |
| unplanned + trained | `added` "Added" | remove | shown |
| plan mode | `planned` "Planned" | remove | none |

Untick keeps the row (F-20). The body's values stay in local state and are sent only while the row is actual (`NEEDS_WORK_REQUIRES_ACTUAL` and `RATING_REQUIRES_ACTUAL` cannot trigger from the UI).

**Body** (actual rows only), column, `gap: spacing[3]`:
1. **Rating** (DSR-19, T-04):
   - Label: overline `log.focus.rating.label` ("Rating"), or `log.focus.rating.value` ("Rating · 4 of 5") when set.
   - ScalePicker (cm:134-139; Log:64-70): a 5-column row, `gap: spacing[1]` (DSR-13 6→4). Each button: height `size.intensityButtonHeight`, radius `radius.md`, flex 1. Level ≤ value: `semantic.intensitySelected`. Above the value: `semantic.intensityUnselected`. The number is `textStyle.statUnit` (Archivo 800 16, DSR-11) + tabular.
   - Tap = set; tapping the current value = unset (D-A6).
   - A11y: group `role="radiogroup"` with label `log.focus.rating.a11yGroup`; each button `role="radio"`, label `log.scale.option.a11y`, `accessibilityState={{ checked: n === value }}`. Vertical `hitSlop`: 0 on iOS, 2 on Android (44-high row).
2. **A row**, `flexWrap: 'wrap'` with the wrapped-chip-row gaps, holding two controls:
   - Needs-work selectable chip (as Trained, label `log.focus.needsWork`, check when on; `role="checkbox"`, label `log.focus.needsWork.a11y`).
   - Ghost button `log.focus.details.show` / `.hide` (cm:46: transparent, `accentText`, `textStyle.button`, height `size.buttonHeight`, `paddingHorizontal: spacing[3]`), `accessibilityState={{ expanded }}`. D-A5: it starts expanded when the comment, a count or a technique has a value.
3. **Details** (expanded):
   - **Comment:**
     - Label `textStyle.caption` `textSecondary` `log.focus.comment.label`, `spacing[1]` above the field (DSR-13 6→4; R-A4).
     - TextArea (cm:78): min height `size.textareaHeight`, `radius.md`, `size.borderWidth` `borderDefault`, `bgRaised`, padding `spacing[3]`, `textStyle.body` `textPrimary`, placeholder `log.focus.comment.placeholder` in `textPlaceholder` (hint only, R-A4).
     - Focused state: `size.borderWidthFocus` `accentBorder`.
     - `multiline`, `textAlignVertical="top"`, `accessibilityLabel` = the label text.
   - **Hit / Caught:** a 2-column grid, `gap: spacing[3]` (D-A24 stacks it at font scale ≥ 1.5).
     - Each cell: overline label (`log.focus.hit.label` / `caught.label`) + Stepper (cm:111-118).
     - Stepper container: `bgRaised`, `radius.md` (DSR-14), padding `spacing[1]`, row `justifyContent: space-between`.
     - Buttons: `size.stepperButton` square, `radius.sm`, fill `borderDefault`, glyph `−`/`+` (`minus`/`remove`, `plus`/`add`) `size.iconButtonGlyph` `textPrimary`.
     - Value: `textStyle.stepperValue` tabular, `textPrimary`. Range 0–99.
     - At the limit (DSR-6): the button takes `semantic.buttonDisabled`, `accessibilityState={{ disabled: true }}`.
     - Each change fires `haptics.hapticStepper`.
     - A11y: the button labels are the `log.focus.hit.less.a11y`… keys. The value is `accessibilityRole="adjustable"` with `accessibilityActions` increment/decrement and `accessibilityValue={{ min, max, now }}` (cm:118).
   - **Techniques:**
     - Overline `log.focus.techniques.label`.
     - A wrap row of chips (the wrapped-chip-row gaps): one selectable chip per attached technique (selected style + check; tap = detach; label `log.focus.technique.remove.a11y`).
     - An Add chip `log.focus.techniques.add` (cm:152: `size.chipHeight`, dashed `size.borderWidth` `borderStronger`, `textSecondary`, `textStyle.chipRegular`). It opens **TechniqueAttach** inline below the row (D-A21):
       - a caption label `log.techniqueSearch.label`;
       - a SearchField (§4.6.2 spec) with `autoFocus`, placeholder `log.techniqueSearch.placeholder`, and its clear IconButton (testID `log.techniqueSearch.clear`, label `common.clearSearch`);
       - up to 6 result ListRows (title `rowTitle`; subtitle caption = the §4.6.4 technique meta). Results with `fromPositionId` or `toPositionId` = this focus's `refId` sort first;
       - a ghost `log.techniqueSearch.close`.
       - Tap a result → attach, close the panel. No match → caption `log.techniqueSearch.empty`. Only one inline panel is open at a time.

**Add block** (below the rows):
1. Caption label `log.search.label` (R-A4), `spacing[1]` above the field.
2. **SearchField** (cm:89-95):
   - Height `size.searchHeight`, radius h/2, `bgRaised`, `paddingHorizontal: spacing[4]`, `gap: spacing[2]` (DSR-13 10→8).
   - Leading glyph `magnifyingglass` / `search` `size.iconInline` `textSecondary`; input `textStyle.body` `textPrimary`; placeholder `log.search.placeholder`.
   - Trailing clear IconButton (glyph `size.iconInline`, no fill, `hitSlop` to `hit`, label `common.clearSearch`), shown when the query is non-empty.
   - Focused: `size.borderWidthFocus` `accentBorder`.
   - `accessibilityLabel` `log.search.a11y`; `returnKeyType="search"`.
3. **Below the field**, one of three:
   - Query empty: **QuickAddChips** (D-A4), shown when there is history. Up to two groups, each a caption label (`log.quickAdd.flagged`, `log.quickAdd.last`) over a wrap row (the wrapped-chip-row gaps) of unselected selectable chips (label = name, `role="button"`, label `log.quickAdd.a11y`; tap → add the row, the chip disappears). With no history, the caption hint `log.search.hint` is shown instead.
   - Query non-empty: up to 8 **result rows** from `useFocusSearch` (ListRow, min height `hit`; title `rowTitle`; subtitle caption `log.search.result.alias` when `matchedAlias` is set, else `log.search.result.kind.<KIND>`; trailing Tag "Extended" per D-A14). Tap → add the row (actual in log/edit, planned in plan), clear the query, `Keyboard.dismiss()`. Already-added rows show a trailing check + `log.search.result.added` and are `disabled`.
   - Zero results: caption `log.search.empty` (DSR-8).
4. `focus` param: that focus is pre-added (plan mode).

#### §4.3.4 Sparring (log / edit only)

Overline `log.sparring.label`. Column, `gap: spacing[3]`:
- **Rounds:** a full-width Stepper, label overline `log.sparring.rounds`, range 0–20 (`Log:56-60`). Untouched it shows 0 and is sent as `undefined` (D-A7).
- **Landed / Taken:** a 2-column grid of steppers, range 0–20, labels `log.sparring.landed` / `log.sparring.taken`.
- **Named submissions** (optional, plan §8): two blocks, "Landed with" and "Caught by" (`log.sparring.landedWith`, `log.sparring.takenBy`). Each is a caption label over a wrap row (the wrapped-chip-row gaps) of technique chips (selected style; tap = remove) + an Add chip `log.sparring.addSubmission`. The Add chip opens TechniqueAttach filtered to SUBMISSION techniques (D-A22). Each chip is one `SubmissionInput { direction, techniqueId }`.
- **Mismatch offer** (product-spec §6: aggregates authoritative, derivation offered, never silent): when the named count for a direction is greater than its stepper, show a caption `log.sparring.mismatch.landed` / `.taken` with a ghost `log.sparring.useCount`. The ghost sets the stepper to the named count.

#### §4.3.5 Session (log / edit only)

Overline `log.session.label`. Column, `gap: spacing[4]`:
1. **Duration:** a full-width Stepper, label overline `log.session.duration`. The value is `stepperValue` + the unit `common.minutes` in `textStyle.caption` `textSecondary` (cm:116). Unset shows `log.notSet.short` ("–"); D-A7 sets the range and steps.
2. **Session rating:** ScalePicker, label `log.session.rating` / `log.session.rating.value`.
3. **Intensity:** ScalePicker, label `log.session.intensity.value` ("Intensity · Hard"), with the level names `log.session.intensityLevel.1…5` (Log:64-70, :141).
4. **Energy:** ScalePicker, label `log.session.energy` / `.value`.
5. **What worked**, **What failed**, **Context:** TextAreas (§4.3.3 spec) with caption labels `log.session.whatWorked.label`, `.whatFailed.label`, `.context.label` and the hint placeholders in §6. Context holds the partner belt (A-8).
6. **Delete** (edit, or plan with `sessionId`): a destructive Button, full width, `semantic.buttonDestructive`, height `size.buttonHeight`, radius h/2, `textStyle.button`, label `log.delete.session` / `log.delete.plan`, `marginTop: spacing[5]`.

#### §4.3.6 R-26 tap walk-through (A-7: reach the prefilled screen in ≤ 2 taps, save with one further tap)

| path | taps (testID) | count | NF-01 / NF-02 |
|---|---|---|---|
| A · planned session today with planned focuses | `tabs.log` (or `home.quickLog`) → sheet prefilled, focuses pre-ticked → `log.save` | **2** | ≤ 2 ✓ · ≈ 5 s |
| A′ · same, rating one focus | `tabs.log` → `log.focus.<refId>.rating.4` → `log.save` | 3 | prefilled at 1 ✓ · ≈ 8 s |
| B · no plan, trained a focus from last session | `tabs.log` → `log.quickAdd.<refId>` → `log.save` | **3** | prefilled at 1 ✓ · ≈ 7 s |
| B′ · same, rating that focus | `tabs.log` → `log.quickAdd.<refId>` → `log.focus.<refId>.rating.4` → `log.save` | 4 | prefilled at 1 ✓ · ≈ 10 s |
| C · first session ever | `tabs.log` → `log.search.input` → type "mount" → `log.search.result.<refId>` → `log.save` | 4 + typing | prefilled at 1 ✓ · ≈ 15 s |
| Plan | `home.planEmpty.action` (or a suggestion) → `log.search.input`… → `log.save` | 3 + typing | — |

Everything under Focuses is optional and below the fold at 390 × 844 (plan §8). Save sits in the action bar, inside the thumb zone at both widths (R-1).

#### §4.3.7 Save, delete, dismiss, errors

- **Save OK:**
  - `haptics.hapticSave`; dismiss the sheet.
  - Toast (D-A10):
    - new log: `toast.sessionSaved` + Undo → `sessions.softDelete(id)` → toast `toast.sessionDeleted` + Undo;
    - new plan: `toast.planSaved` + Undo (same mechanism);
    - complete a plan: `toast.sessionSaved`, no action;
    - edit (review mode): `toast.changesSaved`, no action.
- **Save error:** `DomainError.code` → ErrorBanner `errors.<CODE>`, falling back to `errors.UNKNOWN`. The sheet stays open, and the ScrollView scrolls to Focuses for `FOCUS_*` / `SESSION_NEEDS_ACTUAL_FOCUS` codes.
- **Delete:** `sessions.softDelete` → dismiss the sheet. If it was opened from `session/[id]`, also pop that screen (`router.dismissTo('/')`). Then toast `toast.sessionDeleted` / `toast.planDeleted` + Undo → `undoDelete` (NF-05). No confirm dialog (R-26, DSR-22).
- **Dismiss** (Cancel, swipe-down on iOS, back on Android; R-N3, R-N4 — never blocked): if the form is dirty, show toast `toast.draftDiscarded` + Undo, which reopens the sheet with the draft (D-A9).
- **Loading** (`useSession` or `useSessionTypes` pending): a LoadingState (§4.4.8) fills the scroll area; the action bar shows the disabled primary.
- **Not found:** EmptyState `session.notFound.title` / `errors.SESSION_NOT_FOUND` + ghost `common.cancel` (testID `log.notFound.cancel`), which dismisses.

### §4.4 Home (`(tabs)/index`; plan F-22)

A ScrollView on `bgBase`, padded per §4, column `gap: spacing[4]` (Home:35 18 → 16, T-11). Data: `useHome()`, `useCurrentRank()`. Sections in order:

**§4.4.1 Header** (cm:298-302):
- Overline: today's date via `Intl.DateTimeFormat` (weekday long, day, month long), `textSecondary`.
- `spacing[1]` below it, the title `textStyle.titleL` `home.greeting` (D-A12), `accessibilityRole="header"`.
- No trailing icon button (bell parked, DSR-29).

**§4.4.2 Quick log.**
- A primary Button, full width (`semantic.buttonPrimary`, 56, `buttonLg`), label `home.quickLog`: the one accent button on the screen (T-09).
- `spacing[2]` below it, a caption `textSecondary` naming the target. When `quickLogTarget` returns a `sessionId`: `home.quickLog.hintPlanned`. Otherwise: `home.quickLog.hintNew`.
- While `useHome()` is pending, the button is busy.

**§4.4.3 Next session card** (class-card pattern, cm:230-235; Home:69-85; DSR-26 elements removed).
- Card: `bgRaised`, `radius.lg`, no border, padding `spacing[5]`, `gap: spacing[3]`.
- Contents:
  1. Overline `accentText` `home.next.overline`, with `when` = `home.next.today` / `.tomorrow` / `.onDate`. `accentText` on `bgRaised` passes at 4.67 (contrast doc :33).
  2. Title `textStyle.titleM` = the session-type name (DSR-11 22/26 → titleM).
  3. Meta caption `textSecondary` = `focusNames.join(' · ')`, `numberOfLines={2}`.
  4. Buttons row, `gap: spacing[2]`, each `flex: 1`, both **outlined compact** (cm:49: height `size.buttonCompactHeight`, radius h/2, transparent + `size.borderWidth` `borderStrong`, `textPrimary`, `textStyle.button`; Android `hitSlop` 2): `home.next.logIt` → `log-session?mode=log&sessionId=` and `home.next.editPlan` → `log-session?mode=plan&sessionId=`.
- **Empty** (no `nextPlanned`): the EmptyState card (`bgSurface`, `borderDefault`, `radius.lg`, padding `spacing[5]`, `gap: spacing[3]`) with `home.planEmpty.title`, `home.planEmpty.body` and a secondary Button `home.planEmpty.action` → `mode=plan` (cm:45: `semantic.buttonSecondary`, `size.borderWidth` `borderDefault`, height `size.buttonHeight`, `textStyle.button`).

**§4.4.4 Also planned today / Not logged yet.**
- SectionHeader (cm:317-319): title `textStyle.titleM` (DSR-11 18 → titleM) `accessibilityRole="header"`, row min height `hit`.
- **Also planned today:** the rows of `todayPlanned` other than `nextPlanned`.
- **Not logged yet:** the rows of `stalePlanned`, at most 5, with caption `home.stale.more` (D-A13).
- **Row** (ListRow, cm:238-244): min height `size.listRowMinHeight`, `paddingVertical: spacing[2]`, bottom `size.borderWidth` `borderDefault`, row `gap: spacing[3]`, `flexWrap: 'wrap'`.
  - Text column (flex 1): title `rowTitle` = the type name; subtitle caption `textSecondary` = date · time.
  - Trailing ghost buttons (height `size.buttonHeight`): `home.stale.logIt` and `home.stale.skip` (T-14). Skip → `sessions.skip` → toast `toast.sessionSkipped` + Undo → `sessions.undoSkip`.
- Hidden when the list is empty.

**§4.4.5 Suggested focuses** (A-30; DSR-17).
- SectionHeader `home.suggestions.title`; hidden when there are no suggestions.
- Row (ListRow):
  - Title `rowTitle` = the focus name.
  - Subtitle caption `textSecondary`: line 1 the source label `home.suggestion.source.<SOURCE>`; line 2 the why line `home.suggestion.why` with the date `lastCompleted.localDate`.
  - Trailing **Flagged badge** (DSR-17, §8): height `size.badgeHeight`, radius `radius.sm` (DSR-14 6), `paddingHorizontal: spacing[2]`, `semantic.badgeComp` pair, `textStyle.badge`, text `common.badge.flagged`, leading glyph `flag` `size.iconCheck`.
  - Then a chevron `size.iconChevron` `textSecondary` semibold.
- Tap → `log-session?mode=plan&focus=<KIND>:<refId>`. A11y: `role="button"`, label `home.suggestion.a11y`.

**§4.4.6 Recent** (cm:321-328; Home:98-114).
- SectionHeader `home.recent.title`; no "See all" (DSR-24).
- Up to 5 rows:
  - Min height `size.listRowMinHeight` (DSR-13 64), bottom hairline, `gap: spacing[3]`.
  - Date tile: `size.dateTile` square, `radius.md`, `bgSurface` + `borderDefault`. Weekday `textStyle.overline` `textSecondary` (DSR-11 9/700); day `textStyle.statUnit` tabular (DSR-11 16/800).
  - Title `rowTitle` = the type name; meta caption `textSecondary` = the parts present joined " · ": `home.recent.meta.duration`, `home.recent.meta.rating`, then `focusNames` (`numberOfLines={1}`).
  - Chevron.
- Tap → `session/[id]`; label `home.recent.a11y`.
- **Empty:** an EmptyState inline, `home.recent.empty` (body only; NF-06). On the first run, this and the plan-empty card form the first-step guidance.

**§4.4.7 Rank card** (cm:384-391; A-22).
- Card: `bgSurface`, `borderDefault`, `radius.lg`, padding `spacing[5]` (DSR-13 18), `gap: spacing[3]`.
- Contents:
  1. Overline `home.rank.overline`.
  2. BeltRank **L** (cm:179-200: height `size.beltLHeight`, bar `size.beltLBarWidth` `beltBar`, or `beltBarBlack` for BLACK; stripes `size.beltLStripe` `beltStripe`, gap `size.beltLStripeGap`, bar padding `size.beltLBarPadding`, tail `size.beltLTail`; `radius.xs`; edge `borderStrong` for WHITE/BLACK; full content width). It is `accessibilityElementsHidden` because the title carries the rank (R-C5, DSR-4).
  3. Title `textStyle.titleM` `rank.title` ("Blue belt · 2 stripes").
  4. Meta caption `home.rank.since`.
  5. Trailing-aligned ghost `home.rank.update` → `set-rank`.
- **Empty:** overline, title `textStyle.headline` `home.rank.empty.title`, body caption `home.rank.empty.body`, and a secondary Button `home.rank.empty.action` → `set-rank`.

**§4.4.8 Loading / error** (DSR-9 / DSR-7).
- **LoadingState** = `ActivityIndicator` `textSecondary`, centred in a region at least `size.listRowMinHeight` high, `accessibilityLabel` `common.loading`. It replaces sections 4.4.3–4.4.7 while `useHome()` has no data.
- **Error** (hook `error`): a card (§4.4.3 empty spec) with title `home.error`, body `errors.<CODE>` and a secondary `common.tryAgain` (re-subscribe).

**§4.4.9 Set-rank sheet** (`set-rank`, formSheet, `sheetAllowedDetents: 'fitToContents'`; D-A17).
- Chrome: as §4.3.1, title `rank.sheet.title`.
- Body: ScrollView, gutter `spacing[5]`, `gap: spacing[5]`:
  1. **Preview:** BeltRank L + title `textStyle.titleM` `rank.title` (live), `gap: spacing[3]`, with `accessibilityLiveRegion="polite"`.
  2. **Belt:**
     - Overline `rank.sheet.belt`, `role="radiogroup"`.
     - 5 sheet rows (cm:256: min height `size.buttonHeight` / `hit`, separated by `borderDefault`). Each row: a leading belt swatch (`size.beltSwatchWidth`×`size.beltSwatchHeight`, `radius.xs`, fill `belt*`, `size.borderWidth` `borderStrong` ring), `gap: spacing[3]`; label `rowTitle` `rank.beltName`; trailing check `size.iconCheck` `textPrimary` when selected.
     - `role="radio"`, `accessibilityState={{ checked }}`.
     - The selected row shows no accent fill: R-T6 forbids accent inside belt components, and the check carries the state.
  3. **Stripes:** overline `rank.sheet.stripes` + a full-width Stepper, 0–4, or 0–6 when BLACK (plan §3, §10); value `stepperValue` tabular; labels `rank.sheet.stripes.less.a11y` / `.more.a11y`.
  4. **Awarded on:** overline `rank.sheet.awardedOn`. iOS: a compact date picker with `maximumDate` = today. Android: a picker chip → dialog. Default today.
- Action bar: primary `rank.sheet.save` → `rank.add({ scale: 'ADULT', belt, stripes, awardedOn })`. On success: `hapticSave`, dismiss, toast `toast.rankSaved` with no Undo (D-A10). On `RANK_*` codes: ErrorBanner.
- Prefill: the current rank, else WHITE · 0 · today.

**Tap walk-through.**

| goal | taps |
|---|---|
| log the planned session | `home.next.logIt` → `log.save` (2) |
| plan from a suggestion | `home.suggestion.<refId>` → `log.save` (2) |
| set rank | `home.rank.set` → `rank.belt.BLUE` → `rank.stripes.more` ×2 → `rank.save` (5) |

### §4.5 Session detail (`session/[id]`; D-A16)

- **Header:** native stack header, title `session.title`, back per R-N4. Header style: `headerTitleStyle` = `textStyle.headline` family and size (DSR-11 replaces the Android app-bar 22/500); background `bgBase`, no shadow (R-T5: `headerShadowVisible: false`).
- **Body:** a ScrollView, gutter, `gap: spacing[4]`, data `useSession(id)`:
  1. **Header block:** overline (date · time); title `textStyle.titleL` = the type name; a status Tag for PLANNED/SKIPPED (`session.status.*`; Tag cm:157-159: `size.tagHeight`, `radius.sm`, `bgRaised`, `textStyle.tag` `textPrimary`, `paddingHorizontal: spacing[2]`); meta caption = the present parts of `session.meta.*` joined " · ".
  2. **Focuses:** SectionHeader `session.focuses.title`, then one Card per focus (§4.3.3 card spec).
     - Name `headline`, plus the Flagged badge when `needsWork`.
     - Status caption `session.focus.status.*` (all three variants are text, so planned vs actual is never colour, DSR-18).
     - `session.focus.rating`, the comment in `body`, `session.focus.counts`, and technique Tags in a wrap row with `gap: spacing[2]`.
     - Order: planned + trained, planned + not trained, unplanned.
  3. **Sparring:** Card with the `session.sparring.*` lines (hidden when all are empty).
  4. **Notes:** overline + `body` for `whatWorked`, `whatFailed`, `contextNote` (each hidden when empty).
- **Action bar** (§4.3.1, on `bgBase`): primary `session.edit` → `log-session?mode=edit&sessionId=` (COMPLETED), or `session.logIt` → `mode=log` (PLANNED). SKIPPED: no action bar.
- **States:**
  - loading: LoadingState;
  - not found or deleted: EmptyState `session.notFound.title` / `session.notFound.body`;
  - `removed: true` focus names use `common.removed`.

### §4.6 Library (`(tabs)/library`; plan F-23, read-only)

**§4.6.1 Layout.** One `FlatList` per segment (virtualised, `frontend.md`) on `bgBase`. The `ListHeaderComponent` holds title, search and segments; it scrolls with the list. The list footer holds the attribution (D-A15). Data: `useLibraryPositions()` / `useTechniqueSearch(q)` / `useSubjects()` (subjects are filtered client-side by name and description) and `useSetting('library.showExtended')`.
- **Title:** `textStyle.titleL` `library.title` (DSR-11 32/36 → titleL), `accessibilityRole="header"`, top per §4.
- **Search** (§4.6.2): `spacing[4]` below the title.
- **SegmentedControl** (cm:97-109): `spacing[3]` below the search.
  - Track: `bgRaised`, padding `spacing[1]`, gap `spacing[1]`, `radius.md` (DSR-14 14).
  - Segments: `size.segmentHeight`, `radius.sm` (DSR-14 10), flex 1, label `textStyle.chip`. Selected: `semantic.segmentSelected`. Unselected: transparent / `textSecondary`.
  - Options: `library.segment.positions` · `.techniques` · `.subjects`.
  - A11y: `role="tablist"`, label `library.segment.a11y`; each segment `role="tab"`, `selected`; vertical `hitSlop` 4 on iOS, 6 on Android (the hit-slop rule).
  - The segment is kept per viewer in memory only.
- **List:** starts `spacing[4]` below the segments.

**§4.6.2 SearchField:**
- Label: caption `library.search.label.<segment>` (R-A4), `spacing[1]` above the field.
- Field: the §4.3.3 SearchField with placeholder `library.search.placeholder.<segment>`.
- Behaviour: input is debounced by `motion.durationState` before the query changes. Switching segment keeps the query.

**§4.6.3 Position row** (ListRow; no icon tile, see §8):
- Min height `size.listRowMinHeight`, `paddingVertical: spacing[3]`, bottom hairline, `gap: spacing[3]`.
- Title `rowTitle` = the canonical name. Subtitle caption `textSecondary`, `numberOfLines={2}`: `library.row.alias` when the row matched by `matchedAlias`, else `aliases.join(' · ')`; omitted when there are no aliases.
- Trailing: Tag `library.tier.EXTENDED` (D-A14), then the chevron.
- Tap → `library/position/[id]`; label `library.row.position.a11y`.
- Order: as served (CORE first, then name).

**§4.6.4 Technique row** (non-interactive, A-21: no chevron, no press):
- Title row: `rowTitle` name, flex 1, plus a trailing Badge when `appliesTo ≠ BOTH`: GI → `semantic.tagGi`, `library.badge.GI`; NOGI → Tag `library.badge.NOGI` (no NOGI pair exists, see §8).
- Subtitle caption `textSecondary`:
  - non-submission: `library.technique.meta` ("Sweep · Half guard → Mount");
  - SUBMISSION: `library.technique.metaSubmission`;
  - `perspective` adds `library.technique.perspective.<P>`;
  - extended rows add Tag `library.tier.EXTENDED` in the title row.
- `accessible` with a combined label, no role.

**§4.6.5 Subject row** (non-interactive): title `rowTitle`; subtitle caption `description`, `numberOfLines={2}`.

**§4.6.6 Footer:** caption `textSecondary` `library.attribution`, padding `spacing[5]` vertical, on the Positions and Techniques segments.

**§4.6.7 States:**
- loading: LoadingState in place of the rows;
- no match (query non-empty): EmptyState `library.empty.query.title` / `.body` (DSR-8; plan §8), padding `spacing[8]` vertical;
- empty without a query: `library.empty.none.*`;
- error: card `library.error` + secondary `common.tryAgain` (testID `library.error.retry`).

**§4.6.8 Position detail** (`library/position/[id]`, push in the Library stack; data `usePosition(id)`).
- **Header:** native stack header as §4.5, title = the canonical name.
- **Body:** a `SectionList` on `bgBase`, gutter.
  - **Header block** (`gap: spacing[3]`):
    1. title `textStyle.titleL`;
    2. caption `position.aliases`, when there are any;
    3. Tag "Extended" when `showExtended` and the tier is EXTENDED;
    4. `description` in `body` `textPrimary`, when present;
    5. when `parent` is set, a ListRow `position.variantOf` + the parent name + chevron → push the parent.
  - **Sections**, each with a `titleM` SectionHeader, hidden when empty:
    - `position.variants.title`: child ListRows with chevrons → push.
    - `position.from.title`: the `techniquesFrom` rows grouped by type. Each group opens with an overline `position.group` (plural type + count), then §4.6.4 rows whose meta shows `→ to`.
    - `position.into.title`: the `techniquesTo` rows, grouped the same way.
  - Group order: TRANSITION, GUARD_PASS, SWEEP, ESCAPE, TAKEDOWN, SUBMISSION.
- **States:**
  - no techniques: caption `position.empty`;
  - `TAXONOMY_ROW_NOT_FOUND`: EmptyState `position.notFound.title` / `errors.TAXONOMY_ROW_NOT_FOUND`;
  - loading: LoadingState.

**Tap walk-through** (browse-library): `tabs.library` → `library.search.input` → type an alias ("knee on belly" → canonical "Knee on belly", or "kesa" → "Scarf hold") → row shows `library.row.alias` → `library.position.<positionId>`. That is 3 taps + typing.

## §5 Component usage per screen

| component (cm) | Log | Home | Rank sheet | Detail | Library | Bootstrap |
|---|---|---|---|---|---|---|
| Button primary (:44) | Save | Quick log | Save rank | Edit / Log it | — | Try again |
| Button secondary (:45) | — | Plan a session, Set rank, Try again | — | — | Try again | — |
| Button ghost (:46) | Add details, Done, Set to n | Log it / Skip / Update | — | — | — | — |
| Button destructive (:47) | Delete | — | — | — | — | Reset (dev) |
| Outlined compact (:49) | — | Next card ×2 | — | — | — | — |
| IconButton (:61) | remove focus, clear | — | — | — | clear | — |
| TextArea (:78) | comment ×n, worked, failed, context | — | — | — | — | — |
| SearchField (:89) | focus, technique | — | — | — | search | — |
| SegmentedControl (:97) | — | — | — | — | sections | — |
| Stepper (:111) | hit, caught, rounds, landed, taken, duration | — | stripes | — | — | — |
| ScalePicker (:129) | focus rating, session rating, intensity, energy | — | — | — | — | — |
| Chip filter (:142) | type | — | — | — | — | — |
| Chip selectable (:147) | Trained, Needs work, techniques, quick add | — | — | — | — | — |
| Chip add (:152) | + technique, + submission | — | — | — | — | — |
| Chip picker (:153) | date, time (Android) | — | date (Android) | — | — | — |
| Tag (:157) | Extended | — | — | status, techniques | Extended, No-gi | — |
| Badge (:162) | — | Flagged | — | Flagged | GI | — |
| BeltRank L (:179) / swatch (:160) | — | rank card | preview / rows | — | — | — |
| Card (:212) | FocusRow | next (class), empty, rank | — | focus, sparring | — | — |
| ListRow (:238) | search results | stale, today, suggestions | belt rows | — | rows | — |
| Recent-session row (:321) | — | recent | — | — | — | — |
| Sheet chrome (:249) | ✓ | — | ✓ | — | — | — |
| BottomActionBar (:369) | ✓ | — | ✓ | ✓ | — | ✓ |
| Toast (:263) | via host | via host | via host | — | — | — |
| Tab bar (:273) | — | ✓ | — | — | ✓ | — |

## §6 Copy table (EN · key · context)

All keys are added to `mobile/src/i18n/en.json`. Interpolations use i18next `{{name}}`; plurals use `_one` / `_other`. Dates and times are formatted with `Intl.DateTimeFormat` in the device locale and zone (R-15), never through copy.

### §6.1 common / tabs / toast

| key | en | context |
|---|---|---|
| `common.cancel` | Cancel | sheet header left |
| `common.undo` | Undo | toast action |
| `common.tryAgain` | Try again | error retry |
| `common.loading` | Loading | LoadingState a11y |
| `common.clearSearch` | Clear search | search clear a11y |
| `common.removed` | {{name}} (removed) | removed focus/technique |
| `common.minutes` | min | stepper unit |
| `common.badge.flagged` | Flagged | needs-work badge (R-17) |
| `tabs.home` | Home | tab label |
| `tabs.library` | Library | tab label |
| `tabs.log` | Log session | Log action a11y |
| `toast.sessionSaved` | Session saved | after a log save |
| `toast.planSaved` | Plan saved | after a plan save |
| `toast.changesSaved` | Changes saved | after an edit save |
| `toast.sessionDeleted` | Session deleted | after delete |
| `toast.planDeleted` | Plan deleted | after delete of a plan |
| `toast.sessionSkipped` | Session skipped | Home Skip |
| `toast.draftDiscarded` | Log discarded | dirty sheet dismissed |
| `toast.rankSaved` | Rank saved | after rank save |
| `toast.undo.a11y` | Undo: {{message}} | Undo a11y |

### §6.2 bootstrap / errors (`errors.<CODE>` is the one message per code; plan §4)

| key | en | context |
|---|---|---|
| `bootstrap.title.DB_KEY_UNAVAILABLE` | Unlock your phone to open matIQ | error screen title |
| `bootstrap.title.DB_KEY_MISSING_FOR_EXISTING_DB` | matIQ can't read your data | error screen title |
| `bootstrap.title.DB_KEY_REJECTED` | matIQ can't read your data | error screen title |
| `bootstrap.title.DB_MIGRATION_FAILED` | matIQ couldn't update your data | error screen title |
| `bootstrap.title.DB_SEED_FAILED` | matIQ couldn't load the library | error screen title |
| `bootstrap.title.DB_RESET_FAILED` | The database couldn't be reset | dev reset failure |
| `bootstrap.title.DB_NOT_OPEN` | matIQ couldn't open your data | error screen title |
| `bootstrap.code` | Error code: {{code}} | error screen caption |
| `bootstrap.devReset` | Reset database (development only) | `__DEV__` action |
| `dev.reset.status` | Resetting the database… | dev reset screen |
| `errors.DB_KEY_UNAVAILABLE` | Your data is encrypted with a key your phone only releases while it is unlocked. Unlock your phone, then try again. | body |
| `errors.DB_KEY_MISSING_FOR_EXISTING_DB` | The key that encrypts your data is missing from this phone, so the data can't be opened. Nothing has been deleted. | body |
| `errors.DB_KEY_REJECTED` | Your data file doesn't match this phone's encryption key. Nothing has been deleted. | body |
| `errors.DB_MIGRATION_FAILED` | Updating your data to this version of matIQ failed. Your data is unchanged. Try again. | body |
| `errors.DB_SEED_FAILED` | Loading positions and techniques failed. Your sessions are safe. Try again. | body |
| `errors.DB_RESET_FAILED` | Resetting the database failed. Close the app and try again. | dev reset |
| `errors.SESSION_TYPE_REQUIRED` | Pick a session type to save. | Log banner |
| `errors.SESSION_TYPE_NOT_FOUND` | That session type no longer exists. Pick another one. | Log banner |
| `errors.FOCUS_REQUIRED` | Add at least one focus to save the plan. | Log banner (plan) |
| `errors.FOCUS_REF_NOT_FOUND` | One of the focuses is no longer in the library. Remove it and save again. | Log banner |
| `errors.FOCUS_KIND_INVALID` | One of the focuses isn't a position or a subject. Remove it and save again. | Log banner |
| `errors.FOCUS_DUPLICATE` | A focus is listed twice. Remove the duplicate and save again. | Log banner |
| `errors.SESSION_NOT_FOUND` | This session no longer exists. It may have been deleted. | Log / detail |
| `errors.SESSION_NOT_PLANNED` | This session has already been logged, so it can't be edited as a plan. | Log banner |
| `errors.SESSION_NEEDS_ACTUAL_FOCUS` | Tick or add at least one focus you trained to save. | Log banner |
| `errors.NEEDS_WORK_REQUIRES_ACTUAL` | Needs work can only be set on a focus you trained. Tick it as trained first. | Log banner |
| `errors.RATING_REQUIRES_ACTUAL` | A rating can only be given to a focus you trained. Tick it as trained first. | Log banner |
| `errors.RATING_OUT_OF_RANGE` | Ratings go from 1 to 5. Pick a value in that range. | Log banner |
| `errors.SCALE_OUT_OF_RANGE` | Intensity and energy go from 1 to 5. Pick a value in that range. | Log banner |
| `errors.DURATION_INVALID` | Duration must be more than 0 minutes. | Log banner |
| `errors.COUNT_NEGATIVE` | Counts can't be below 0. | Log banner |
| `errors.TECHNIQUE_NOT_FOUND` | One of the techniques is no longer in the library. Remove it and save again. | Log banner |
| `errors.ROUND_NO_DUPLICATE` | Two rounds share the same number. Save again. | Log banner (not reachable in sprint 1) |
| `errors.ROUND_NOT_IN_SESSION` | A submission points at a round of another session. Save again. | Log banner (not reachable in sprint 1) |
| `errors.SUBMISSION_DIRECTION_INVALID` | A submission must be landed or taken. | Log banner |
| `errors.COUNTS_REQUIRE_ACTUAL` | Hit and caught counts can only be given to a focus you trained. Tick it as trained first. | Log banner (plan R1-05) |
| `errors.TECHNIQUE_REQUIRES_ACTUAL` | Techniques can only be attached to a focus you trained. Tick it as trained first. | Log banner (plan R1-05) |
| `errors.SESSION_START_INVALID` | The date or time isn't valid. Pick it again and save. | Log banner (`data-contracts.md:14`: malformed `startsAt` or unknown `timeZone`) |
| `errors.ROUND_NO_INVALID` | Round numbers start at 1. Save again. | Log banner (not reachable in sprint 1; rounds UI is sprint 3) |
| `errors.DB_NOT_OPEN` | matIQ isn't ready yet. Close the app and open it again. | bootstrap error screen body; also the fallback for a repository call before bootstrap (`data-contracts.md:7`) |
| `errors.TAXONOMY_ROW_NOT_FOUND` | This entry is no longer in the library. | position detail |
| `errors.RANK_BELT_INVALID_FOR_SCALE` | That belt isn't on the adult scale. Pick another belt. | rank banner |
| `errors.RANK_STRIPES_INVALID` | Stripes go from 0 to 4, or up to 6 on a black belt. | rank banner |
| `errors.RANK_DATE_INVALID` | The award date can't be in the future. | rank banner |
| `errors.SETTING_UNKNOWN` | A setting couldn't be read. Restart the app. | any |
| `errors.SETTING_TYPE_MISMATCH` | A setting couldn't be read. Restart the app. | any |
| `errors.SEED_FORMAT_UNSUPPORTED` | This library update isn't supported by this version of matIQ. | seed (logged) |
| `errors.SEED_RELEASE_OLDER` | This library update is older than the one installed. | seed (logged) |
| `errors.UNKNOWN` | Something went wrong. Try again. | fallback |

### §6.3 log (Log Session)

| key | en | context |
|---|---|---|
| `log.title.log` | Log session | header |
| `log.title.plan` | Plan session | header |
| `log.title.editPlan` | Edit plan | header |
| `log.title.edit` | Edit session | header (review mode) |
| `log.type.label` | Type | overline |
| `log.type.a11y` | Session type | radiogroup label |
| `log.when.label` | When | overline |
| `log.when.date.a11y` | Date: {{date}} | date control |
| `log.when.time.a11y` | Time: {{time}} | time control |
| `log.focuses.label` | Focuses | overline |
| `log.focus.planned` | Planned | status line |
| `log.focus.plannedNotTrained` | Planned · not trained | status line |
| `log.focus.added` | Added | status line (unplanned) |
| `log.focus.trained` | Trained | toggle chip |
| `log.focus.trained.a11y` | Trained: {{name}} | toggle a11y |
| `log.focus.remove.a11y` | Remove {{name}} | remove button |
| `log.focus.rating.label` | Rating | overline (unset) |
| `log.focus.rating.value` | Rating · {{value}} of 5 | overline (set) |
| `log.focus.rating.a11yGroup` | Rating for {{name}} | radiogroup |
| `log.scale.option.a11y` | {{label}} {{value}} of 5 | each 1–5 button |
| `log.focus.needsWork` | Needs work | chip |
| `log.focus.needsWork.a11y` | Needs work: {{name}} | chip a11y |
| `log.focus.details.show` | Add details | disclosure |
| `log.focus.details.hide` | Hide details | disclosure |
| `log.focus.comment.label` | Comment | field label |
| `log.focus.comment.placeholder` | What happened here? | hint |
| `log.focus.hit.label` | Hit | stepper label |
| `log.focus.caught.label` | Caught | stepper label |
| `log.focus.hit.less.a11y` | Fewer hits on {{name}} | stepper − |
| `log.focus.hit.more.a11y` | More hits on {{name}} | stepper + |
| `log.focus.caught.less.a11y` | Fewer catches on {{name}} | stepper − |
| `log.focus.caught.more.a11y` | More catches on {{name}} | stepper + |
| `log.focus.techniques.label` | Techniques | overline |
| `log.focus.techniques.add` | + Add technique | add chip |
| `log.focus.technique.remove.a11y` | Remove {{technique}} from {{name}} | attached chip |
| `log.search.label` | Add a focus | field label |
| `log.search.placeholder` | Half guard, mount, grips… | hint |
| `log.search.a11y` | Search positions and subjects | input |
| `log.search.hint` | Search by any name. Aliases count too. | no-history hint |
| `log.search.result.alias` | Also: {{alias}} | result subtitle |
| `log.search.result.kind.POSITION` | Position | result subtitle |
| `log.search.result.kind.SUBJECT` | Subject | result subtitle |
| `log.search.result.added` | Added | already-added result |
| `log.search.result.a11y` | Add {{name}} | result row |
| `log.search.empty` | No position or subject matches “{{query}}”. Aliases are searched too, so try another name. | zero results |
| `log.quickAdd.flagged` | Flagged last session | chip group label |
| `log.quickAdd.last` | From your last session | chip group label |
| `log.quickAdd.a11y` | Add {{name}} | quick-add chip |
| `log.techniqueSearch.label` | Find a technique | field label |
| `log.techniqueSearch.placeholder` | Kimura, scissor sweep… | hint |
| `log.techniqueSearch.empty` | No technique matches “{{query}}”. | zero results |
| `log.techniqueSearch.close` | Done | closes panel |
| `log.techniqueSearch.result.a11y` | Attach {{name}} | result row |
| `log.sparring.label` | Sparring | overline |
| `log.sparring.rounds` | Rounds | stepper label |
| `log.sparring.rounds.less.a11y` | Fewer rounds | stepper − |
| `log.sparring.rounds.more.a11y` | More rounds | stepper + |
| `log.sparring.landed` | Submissions landed | stepper label |
| `log.sparring.landed.less.a11y` | Fewer submissions landed | stepper − |
| `log.sparring.landed.more.a11y` | More submissions landed | stepper + |
| `log.sparring.taken` | Submissions taken | stepper label |
| `log.sparring.taken.less.a11y` | Fewer submissions taken | stepper − |
| `log.sparring.taken.more.a11y` | More submissions taken | stepper + |
| `log.sparring.landedWith` | Landed with | named block |
| `log.sparring.takenBy` | Caught by | named block |
| `log.sparring.addSubmission` | + Add | add chip |
| `log.sparring.submission.remove.a11y` | Remove {{name}} | named chip |
| `log.sparring.mismatch.landed_one` | You named {{count}} landed submission. | offer |
| `log.sparring.mismatch.landed_other` | You named {{count}} landed submissions. | offer |
| `log.sparring.mismatch.taken_one` | You named {{count}} submission taken. | offer |
| `log.sparring.mismatch.taken_other` | You named {{count}} submissions taken. | offer |
| `log.sparring.useCount` | Set to {{count}} | ghost |
| `log.session.label` | Session | overline |
| `log.session.duration` | Duration | stepper label |
| `log.session.duration.less.a11y` | Less time | stepper − (Log:49) |
| `log.session.duration.more.a11y` | More time | stepper + (Log:51) |
| `log.notSet.short` | – | unset value |
| `log.notSet` | Not set | unset a11y value |
| `log.session.rating` | Session rating | overline (unset) |
| `log.session.rating.value` | Session rating · {{value}} of 5 | overline (set) |
| `log.session.intensity` | Intensity | overline (unset) |
| `log.session.intensity.value` | Intensity · {{level}} | overline (set) |
| `log.session.intensityLevel.1` | Flow | level name (Log:141) |
| `log.session.intensityLevel.2` | Light | level name |
| `log.session.intensityLevel.3` | Steady | level name |
| `log.session.intensityLevel.4` | Hard | level name |
| `log.session.intensityLevel.5` | Comp pace | level name |
| `log.session.energy` | Energy | overline (unset) |
| `log.session.energy.value` | Energy · {{value}} of 5 | overline (set) |
| `log.session.whatWorked.label` | What worked | field label |
| `log.session.whatWorked.placeholder` | A sweep that landed, a grip that held… | hint |
| `log.session.whatFailed.label` | What failed | field label |
| `log.session.whatFailed.placeholder` | Where you got stuck… | hint |
| `log.session.context.label` | Context | field label |
| `log.session.context.placeholder` | Partner's belt, injuries, how you felt… | hint (A-8) |
| `log.save.log` | Save session | primary (Log:92) |
| `log.save.plan` | Save plan | primary |
| `log.save.edit` | Save changes | primary |
| `log.save.disabled.log` | Tick or add at least one focus you trained to save. | R-C6 reason |
| `log.save.disabled.plan` | Add at least one focus to save the plan. | R-C6 reason |
| `log.save.busy.a11y` | Saving | busy primary |
| `log.delete.session` | Delete session | destructive |
| `log.delete.plan` | Delete plan | destructive |
| `log.label.rating` | Rating | `{{label}}` value for `log.scale.option.a11y` |
| `log.label.intensity` | Intensity | same |
| `log.label.energy` | Energy | same |

### §6.4 home

| key | en | context |
|---|---|---|
| `home.greeting` | Oss | title (D-A12) |
| `home.quickLog` | Quick log | primary |
| `home.quickLog.hintPlanned` | Logs today's {{type}} at {{time}} with its focuses ticked. | caption |
| `home.quickLog.hintNew` | Starts a new {{type}} session. | caption |
| `home.next.overline` | Next session · {{when}} | card overline |
| `home.next.today` | Today {{time}} | when |
| `home.next.tomorrow` | Tomorrow {{time}} | when |
| `home.next.onDate` | {{date}} {{time}} | when |
| `home.next.logIt` | Log it | card button |
| `home.next.logIt.a11y` | Log {{type}}, {{when}} | a11y |
| `home.next.editPlan` | Edit plan | card button |
| `home.next.editPlan.a11y` | Edit the plan for {{type}}, {{when}} | a11y |
| `home.planEmpty.title` | Nothing planned yet | empty card |
| `home.planEmpty.body` | Plan your next session and pick what to work on. When you log it, those focuses are ticked for you. | empty card (NF-06) |
| `home.planEmpty.action` | Plan a session | secondary |
| `home.alsoToday.title` | Also planned today | section |
| `home.stale.title` | Not logged yet | section |
| `home.stale.logIt` | Log it | ghost |
| `home.stale.logIt.a11y` | Log {{type}} on {{date}} | a11y |
| `home.stale.skip` | Skip | ghost (`sessions.skip`) |
| `home.stale.skip.a11y` | Skip {{type}} on {{date}} | a11y |
| `home.stale.more_one` | {{count}} more not logged | caption |
| `home.stale.more_other` | {{count}} more not logged | caption |
| `home.suggestions.title` | Suggested focuses | section |
| `home.suggestion.source.LAST_NEEDS_WORK` | Flagged last session | source label (A-30) |
| `home.suggestion.source.CYCLE` | In your focus cycle | source label (renders from sprint 3) |
| `home.suggestion.source.NEEDS_WORK` | Needs work | source label (renders from sprint 2) |
| `home.suggestion.source.NOT_TRAINED` | Not trained lately | source label (renders from sprint 2) |
| `home.suggestion.why` | You marked it as needs work on {{date}}. | why line (DSR-17) |
| `home.suggestion.a11y` | {{name}}. {{source}}. {{why}} Plan a session with this focus. | row a11y |
| `home.recent.title` | Recent | section |
| `home.recent.meta.duration` | {{minutes}} min | meta part |
| `home.recent.meta.rating` | Rating {{value}}/5 | meta part |
| `home.recent.a11y` | {{type}}, {{date}}. {{meta}}. Open session. | row a11y |
| `home.recent.empty` | No sessions logged yet. Tap Quick log, or the Log button below, to record your first one. | empty (NF-06) |
| `home.rank.overline` | Rank | card overline |
| `home.rank.since` | Since {{date}} | card meta |
| `home.rank.update` | Update | ghost |
| `home.rank.update.a11y` | Update your rank | a11y |
| `home.rank.empty.title` | Set your rank | empty card |
| `home.rank.empty.body` | Add your belt and stripes to keep your promotion history. | empty card |
| `home.rank.empty.action` | Set rank | secondary |
| `home.error` | Couldn't load your sessions | error card title |

### §6.5 rank (shared + Set-rank sheet)

| key | en | context |
|---|---|---|
| `rank.belt.WHITE` | White | belt name |
| `rank.belt.BLUE` | Blue | belt name |
| `rank.belt.PURPLE` | Purple | belt name |
| `rank.belt.BROWN` | Brown | belt name |
| `rank.belt.BLACK` | Black | belt name |
| `rank.beltName` | {{belt}} belt | row label, title part |
| `rank.stripes_one` | {{count}} stripe | title part |
| `rank.stripes_other` | {{count}} stripes | title part (0 uses `_other`) |
| `rank.title` | {{beltName}} · {{stripes}} | card / preview title (R-C5) |
| `rank.sheet.title` | Set rank | sheet header |
| `rank.sheet.belt` | Belt | overline |
| `rank.sheet.stripes` | Stripes | overline |
| `rank.sheet.stripes.less.a11y` | Fewer stripes | stepper − |
| `rank.sheet.stripes.more.a11y` | More stripes | stepper + |
| `rank.sheet.awardedOn` | Awarded on | overline |
| `rank.sheet.save` | Save rank | primary |

### §6.6 session (detail)

| key | en | context |
|---|---|---|
| `session.title` | Session | header |
| `session.status.PLANNED` | Planned | status tag |
| `session.status.SKIPPED` | Skipped | status tag |
| `session.meta.duration` | {{minutes}} min | meta part |
| `session.meta.intensity` | Intensity {{value}} of 5 | meta part |
| `session.meta.energy` | Energy {{value}} of 5 | meta part |
| `session.meta.rating` | Rating {{value}} of 5 | meta part |
| `session.focuses.title` | Focuses | section |
| `session.focus.status.plannedTrained` | Planned · trained | status |
| `session.focus.status.plannedNotTrained` | Planned · not trained | status |
| `session.focus.status.unplannedTrained` | Not planned · trained | status |
| `session.focus.rating` | Rating {{value}} of 5 | focus |
| `session.focus.counts` | Hit {{hit}} · Caught {{caught}} | focus |
| `session.sparring.title` | Sparring | section |
| `session.sparring.rounds_one` | {{count}} round | part |
| `session.sparring.rounds_other` | {{count}} rounds | part |
| `session.sparring.landed` | {{count}} landed | part |
| `session.sparring.taken` | {{count}} taken | part |
| `session.sparring.landedWith` | Landed with: {{names}} | line |
| `session.sparring.takenBy` | Caught by: {{names}} | line |
| `session.notes.whatWorked` | What worked | overline |
| `session.notes.whatFailed` | What failed | overline |
| `session.notes.context` | Context | overline |
| `session.edit` | Edit session | primary |
| `session.logIt` | Log it | primary (PLANNED) |
| `session.notFound.title` | Session not found | empty |
| `session.notFound.body` | It may have been deleted. Go back to Home to see your sessions. | empty (NF-06) |

### §6.7 library / position

| key | en | context |
|---|---|---|
| `library.title` | Library | title |
| `library.segment.a11y` | Library section | tablist |
| `library.segment.positions` | Positions | segment |
| `library.segment.techniques` | Techniques | segment |
| `library.segment.subjects` | Subjects | segment |
| `library.search.label.positions` | Search positions (aliases included) | field label |
| `library.search.label.techniques` | Search techniques | field label |
| `library.search.label.subjects` | Search subjects | field label |
| `library.search.placeholder.positions` | Half guard, turtle, back… | hint |
| `library.search.placeholder.techniques` | Kimura, knee cut… | hint |
| `library.search.placeholder.subjects` | Grips, escapes… | hint |
| `library.row.alias` | Also: {{alias}} | alias match (plan §8) |
| `library.row.position.a11y` | {{name}}. {{aliases}}. Open position. | row a11y |
| `library.tier.EXTENDED` | Extended | tag (D-A14) |
| `library.badge.GI` | Gi | badge (uppercased by `textStyle.badge`) |
| `library.badge.NOGI` | No-gi | tag |
| `library.technique.type.TRANSITION` | Transition | meta |
| `library.technique.type.GUARD_PASS` | Guard pass | meta |
| `library.technique.type.SWEEP` | Sweep | meta |
| `library.technique.type.ESCAPE` | Escape | meta |
| `library.technique.type.TAKEDOWN` | Takedown | meta |
| `library.technique.type.SUBMISSION` | Submission | meta |
| `library.technique.typePlural.TRANSITION` | Transitions | group overline |
| `library.technique.typePlural.GUARD_PASS` | Guard passes | group overline |
| `library.technique.typePlural.SWEEP` | Sweeps | group overline |
| `library.technique.typePlural.ESCAPE` | Escapes | group overline |
| `library.technique.typePlural.TAKEDOWN` | Takedowns | group overline |
| `library.technique.typePlural.SUBMISSION` | Submissions | group overline |
| `library.technique.meta` | {{type}} · {{from}} → {{to}} | row subtitle |
| `library.technique.metaSubmission` | Submission · from {{from}} | row subtitle |
| `library.technique.perspective.TOP` | from top | appended " · " |
| `library.technique.perspective.BOTTOM` | from bottom | appended " · " |
| `library.empty.query.title` | No match for “{{query}}” | empty (DSR-8) |
| `library.empty.query.body` | Aliases are searched too. Try another name or spelling. | empty |
| `library.empty.none.title` | The library is empty | empty |
| `library.empty.none.body` | Restart the app to load positions and techniques. | empty |
| `library.attribution` | Positions and techniques from GrappleMap (public domain). Names and aliases from grapple-flows, CC BY 4.0. | footer (D-A15) |
| `library.error` | Couldn't load the library | error card |
| `position.aliases` | Also known as {{aliases}} | detail caption |
| `position.variantOf` | Variant of {{name}} | parent row |
| `position.variants.title` | Variants | section |
| `position.from.title` | From here | section |
| `position.into.title` | Into here | section |
| `position.group` | {{type}} · {{count}} | group overline |
| `position.empty` | No techniques recorded for this position yet. | empty |
| `position.notFound.title` | Position not found | empty |

### §6.8 Formatting notes

Dates, the weekday on the date tile and the time strings are formatted by `Intl.DateTimeFormat`, not by copy. Session-type, position, technique and subject names are data (seeded), never copy.

### §6.9 Keys removed

`app.preparing`, `app.migrationError`, `home.title`, `home.subtitle`, `db.ready` (`mobile/src/i18n/en.json` today). Their screens (`app/index.tsx`, the `useMigrations` gate in `_layout.tsx`) are replaced by plan §7 and §8.

## §7 testID table (shape `<screen>.<element>[.<id>]`; binding for frontend-coder and tester)

`<refId>` = a focus's position or subject id; `<sessionId>`, `<techniqueId>`, `<positionId>`, `<subjectId>`, `<sessionTypeId>` are row ids (seed ids are stable, A-29); `<n>` = 1–5 or a 0-based index. Flows: **smoke** = `smoke/launch.yaml`; **log** = `log-session-quick`, `plan-then-log`, `session-delete-undo`; **lib** = `library-alias-search`; **rank** = `set-rank`.

| testID | element | screen | flows |
|---|---|---|---|
| `tabs.home` | Home tab | shell | smoke, log |
| `tabs.log` | Log action | shell | smoke, log |
| `tabs.library` | Library tab | shell | smoke, lib |
| `toast` | toast container | host | log |
| `toast.message` | toast text | host | log |
| `toast.undo` | Undo action | host | log |
| `bootstrap.error` | error screen root | bootstrap | smoke |
| `bootstrap.error.title` | error title | bootstrap | smoke |
| `bootstrap.retry` | Try again | bootstrap | — |
| `bootstrap.devReset` | Reset database | bootstrap | — |
| `dev.reset.status` | reset progress | dev | all (`openLink matiq://dev/reset`) |
| `log.sheet` | sheet root | Log | log |
| `log.title` | header title | Log | log |
| `log.cancel` | Cancel | Log | log |
| `log.type.<sessionTypeId>` | type chip | Log | log |
| `log.when.date` | date control | Log | log |
| `log.when.time` | time control | Log | — |
| `log.focus.<refId>` | focus row card | Log | log |
| `log.focus.<refId>.status` | status line | Log | log (plan-then-log asserts "Planned · not trained") |
| `log.focus.<refId>.trained` | Trained toggle | Log | log |
| `log.focus.<refId>.remove` | remove button | Log | log |
| `log.focus.<refId>.rating.<n>` | rating 1–5 | Log | log |
| `log.focus.<refId>.needsWork` | needs-work chip | Log | log |
| `log.focus.<refId>.details` | details disclosure | Log | — |
| `log.focus.<refId>.comment` | comment field | Log | — |
| `log.focus.<refId>.hit.less` / `.hit.more` / `.hit.value` | hit stepper | Log | — |
| `log.focus.<refId>.caught.less` / `.caught.more` / `.caught.value` | caught stepper | Log | — |
| `log.focus.<refId>.technique.<techniqueId>` | attached technique chip | Log | — |
| `log.focus.<refId>.addTechnique` | + Add technique | Log | — |
| `log.techniqueSearch.input` | technique search | Log | — |
| `log.techniqueSearch.result.<techniqueId>` | technique result row | Log | — |
| `log.techniqueSearch.done` | Done | Log | — |
| `log.search.input` | focus search | Log | log |
| `log.search.clear` | clear search | Log | — |
| `log.search.result.<refId>` | focus result row | Log | log |
| `log.search.empty` | zero-results text | Log | — |
| `log.quickAdd.<refId>` | quick-add chip | Log | log |
| `log.sparring.rounds.less` / `.more` / `.value` | rounds stepper | Log | — |
| `log.sparring.landed.less` / `.more` / `.value` | landed stepper | Log | — |
| `log.sparring.taken.less` / `.more` / `.value` | taken stepper | Log | — |
| `log.sparring.landedWith.add` / `log.sparring.takenBy.add` | + Add submission | Log | — |
| `log.sparring.landedWith.<n>` / `log.sparring.takenBy.<n>` | named submission chip | Log | — |
| `log.sparring.useCount.landed` / `.taken` | Set to n | Log | — |
| `log.session.duration.less` / `.more` / `.value` | duration stepper | Log | — |
| `log.session.rating.<n>` | session rating | Log | — |
| `log.session.intensity.<n>` | intensity | Log | — |
| `log.session.energy.<n>` | energy | Log | — |
| `log.session.whatWorked` | textarea | Log | — |
| `log.session.whatFailed` | textarea | Log | — |
| `log.session.context` | textarea | Log | — |
| `log.delete` | Delete session / plan | Log | log (delete-undo) |
| `log.save` | primary | Log | log |
| `log.save.reason` | disabled reason | Log | log |
| `log.error` | ErrorBanner | Log | — |
| `log.notFound.cancel` | not-found dismiss ghost | Log | — |
| `log.techniqueSearch.clear` | technique search clear | Log | — |
| `home.screen` | Home scroll root | Home | smoke |
| `home.loading` | LoadingState | Home | — |
| `home.error.retry` | Try again | Home | — |
| `home.quickLog` | Quick log | Home | smoke, log |
| `home.next` | next session card | Home | log (plan-then-log) |
| `home.next.logIt` | Log it | Home | log |
| `home.next.editPlan` | Edit plan | Home | — |
| `home.planEmpty.action` | Plan a session | Home | log (plan-then-log) |
| `home.planned.<sessionId>` | also-today row | Home | — |
| `home.planned.<sessionId>.logIt` | Log it | Home | — |
| `home.stale.<sessionId>` | not-logged row | Home | — |
| `home.stale.<sessionId>.logIt` | Log it | Home | — |
| `home.stale.<sessionId>.skip` | Skip | Home | — |
| `home.suggestion.<refId>` | suggestion row | Home | log |
| `home.recent.<sessionId>` | recent row | Home | log |
| `home.recent.empty` | empty text | Home | smoke |
| `home.rank` | rank card | Home | rank |
| `home.rank.set` | Set rank (empty) | Home | rank |
| `home.rank.update` | Update | Home | rank |
| `rank.cancel` | Cancel | Set rank | rank |
| `rank.belt.<BELT>` | belt row (WHITE…BLACK) | Set rank | rank |
| `rank.stripes.less` / `.more` / `.value` | stripes stepper | Set rank | rank |
| `rank.awardedOn` | date control | Set rank | — |
| `rank.save` | Save rank | Set rank | rank |
| `rank.error` | ErrorBanner | Set rank | — |
| `session.screen` | detail root | Session | log |
| `session.focus.<refId>` | focus card | Session | log (asserts planned-not-trained) |
| `session.focus.<refId>.status` | status text | Session | log |
| `session.edit` | Edit session | Session | log (delete-undo) |
| `session.logIt` | Log it | Session | — |
| `session.notFound` | not-found state | Session | — |
| `library.screen` | list root | Library | smoke, lib |
| `library.search.input` | search | Library | lib |
| `library.search.clear` | clear | Library | lib |
| `library.segment.positions` / `.techniques` / `.subjects` | segment | Library | lib |
| `library.position.<positionId>` | position row | Library | lib |
| `library.technique.<techniqueId>` | technique row | Library | lib |
| `library.subject.<subjectId>` | subject row | Library | — |
| `library.empty` | empty state | Library | lib |
| `library.loading` | LoadingState | Library | — |
| `library.error.retry` | error card Try again | Library | — |
| `position.screen` | detail root | Position | lib |
| `position.variantOf` | parent row | Position | — |
| `position.variant.<positionId>` | child row | Position | — |
| `position.technique.<techniqueId>` | technique row | Position | lib |

Dynamic ids: Maestro selects by `id: "home.recent\\..*"` + `index: 0`, or by a seed id. Every interactive element and every list row above carries its testID; plan §9.2 snapshots this table.

## §8 Deviations from the design system (one table)

| DSR / rule | element | system value (source) | decision | tokens / components used | if the PO rules otherwise |
|---|---|---|---|---|---|
| DSR-1, DSR-2, R-A4 | every input, including search | placeholder 2.80:1; boundary < 3:1 (cm:84-86) | visible caption label above every field (search included); placeholders are hints only | `caption`, `textSecondary` | a passing placeholder lets the search labels go (Library, Log) |
| DSR-4, R-C5 | belt rank, swatch | edges < 3:1 (cm:433) | the rank name is always rendered next to the belt (`rank.title`); belt `accessibilityElementsHidden` | BeltRank, `rank.*` | none, if edges are fixed |
| DSR-6 | pressed state for all controls; stepper at limit | not drawn (cm:435) | iOS: `opacity` 0.72 while pressed (one constant, `// token-adherence: allow — DSR-6 pressed state`); Android: `android_ripple={{ color: borderStrong }}`; stepper at limit = `semantic.buttonDisabled` | `borderStrong`, `buttonDisabled` | replace the constant and ripple colour with the drawn pressed tokens |
| DSR-7 | save / rank errors | not drawn (cm:436) | ErrorBanner in the action bar (T-05) | `feedbackDangerTint`/`feedbackDanger`, `caption`, `radius.md`, `spacing[2..3]` | restyle one component |
| DSR-8 | Home (no plan, no sessions), Library no match, focus/technique no match, position empty, session not found | not drawn (cm:437) | EmptyState: title + body naming the next step + optional action (T-06) | `headline`, `body`, `caption`, Button secondary/ghost | restyle one component; copy stays |
| DSR-9 | lists, busy buttons | not drawn (cm:438) | native `ActivityIndicator` (`textSecondary`; `accentOn` in the primary); no skeletons | — | skeleton component |
| DSR-10 | sheet motion | 320 ms spring, no parameters (cm:439) | native formSheet presentation (iOS UISheet, Android Material bottom sheet); the OS honours Reduce Motion | react-native-screens formSheet | custom spring on a JS sheet |
| DSR-11 | off-scale type | as cm:440 | large title 32/36 → `titleL`; 22/26 and section 18 → `titleM`; intensity/date numerals 16 → `statUnit` + tabular; 9/700 weekday → `overline`; 15/600 row titles → `rowTitle`; 12 meta → `caption`; Cancel 16/500 → `rowTitle`; Android app-bar 22/500 → `headline` | `textStyle.*` | swap the style per element |
| DSR-12, A-23 | Archivo width 110/115/125 % | `fontStretch` (cm:441) | normal width Archivo 700/800 (A-23) | `displayFontFamily` | width instances |
| DSR-13 | off-grid spacing | 6, 10, 14, 18, 22, 34, 62; rows 64/72 (cm:442) | T-11 ties-down rule; 34 → bottom inset; 62 → top inset + `spacing[4]`; rows → `size.listRowMinHeight` | `spacing[1..5]`, `size.listRowMinHeight` | per-value swap |
| DSR-14 | off-scale radii | 6, 10, 14, 20 (cm:443) | 14 → `radius.md`; 10 → `radius.sm`; 6 → `radius.sm`; 20 / any pill → h/2 (R-L2) | `radius.*` | per-value swap |
| DSR-14/16 | picker chip (date/time, Android) | 40 high, radius 20 (cm:153) | `size.chipHeight` 36, h/2, vertical `hitSlop` 4 on iOS / 6 on Android (the hit-slop rule) | Chip picker | 40 high once tokenised |
| DSR-15 | log action / segment / tab-bar fill / sheet fill / stepper padding / class-card buttons / unselected chip / belt 28 | conflicts (cm:444) | 56 (T-01); 36 (T-02); iOS `tabbar`, Android `bgSurface` (cm:277, :283); sheet `bgSurface` (T-10); stepper padding `spacing[1]` (Log:48); compact 44/15 board; unselected `chipRegular` 14/500 board; belt L 32 | as cited | per-element swap |
| DSR-16, R-18, T-12 | every hit area | 44 pt floor, 48 dp pending (R-M1) | `hit` = 44 pt iOS / 48 dp Android everywhere; smaller visuals use `hitSlop` | `size.touchTarget`, `size.touchTargetAndroid` | none: R-18 is ruled |
| DSR-17 | needs-work flag and "why flagged" | no progression states (cm:446) | Flagged badge = `semantic.badgeComp` pair + flag glyph + text "Flagged" (R-17); why line `home.suggestion.why` on suggestions; computed states stay for Progress (sprint 2) | Badge, `badgeComp` | a dedicated `badge-flagged` pairing; one semantic swap |
| DSR-18 | planned vs actual focus | not drawn (cm:447) | text status line + "Trained" selectable chip with check (T-03); detail uses three text statuses | Card, selectable chip, `caption` | restyle FocusRow |
| DSR-19 | rating input/display | open (cm:448) | ScalePicker = intensity picker; display "Rating n of 5" text (T-04) | `intensitySelected`/`Unselected`, `statUnit` | new rating component |
| DSR-21 | theme override | Settings missing (cm:450) | follows the system only; `theme.override` is not read in sprint 1 | `useColorScheme` | read the setting (sprint 2) |
| DSR-22, R-26 | destructive confirm | pattern missing (cm:451) | no confirm dialogs: soft delete + Undo toast | Toast | — |
| DSR-23 | keyboard avoidance; Android list chevron; Android back on sheets; date picker in sheet | not drawn (cm:452) | T-07; chevron shown on both platforms; back = Cancel (D-A9); iOS compact / Android dialog pickers (D-A19) | as cited | per item |
| DSR-24 | "See all" | no destination (cm:453) | omitted | — | link to Progress (sprint 2) |
| DSR-25 | splash mark | not exported (cm:454) | D-A20 | `bgBase` hex in `app.json` | add the image |
| DSR-26, DSR-29, R-S5 | gym picker chip (Log:30-33), class-card Check in/Schedule, bell (Home:42) | parked | not built | — | built after a ruling |
| R-S5 | outlined compact buttons on the next-session card | `button-compact-height` exists "for the class card" | reused for Log it / Edit plan (not the parked check-in semantics) | `size.buttonCompactHeight`, `borderStrong` | full-height secondary buttons |
| R-C5 | session-type filter chips (selected) | a selected chip carries a check (selectable chips) | filter chips use the board's active inverse fill without a check (cm:144), plus `accessibilityState.checked` | `chipActive` | add a check glyph |
| cm:98 | session type | segmented control (Log:38-44) | filter chips (D-A3) | Chip filter | segmented, capped |
| cm:241 | list rows without an icon | leading icon tile | omitted on Library, Home and result rows (no meaningful glyph) | ListRow | add tiles once glyphs exist |
| NOGI | No-gi marker | only GI has a pair (`tagGi`, R-C4) | neutral Tag "No-gi" | Tag | a NOGI badge pairing |
| R-N1 | iOS TabView | native tab bar | JS custom `tabBar` drawn to cm:275-281 (a native tab bar cannot host the 56 centre action) | MainTabBar | NativeTabs, with Log as a tab |
| R-N1, A-18 | five tabs | Home · Library · Log · Progress · Profile | three tabs (D-A2) | MainTabBar | placeholder tabs |
| R-N3 (R1-19) | sheet detents and scrim | iOS `.sheet` with medium / large detents, `scrim` behind (M:178, M:187) | Log: large only (D-A23), because the form plus its action bar does not fit a medium detent. Set-rank: `fitToContents`, which is a detent sized to the content (iOS 16+; Android bottom sheet at content height). Scrim: the native formSheet dims the presenter itself (iOS system dimming, Android Material bottom-sheet scrim), so no `scrim` token is drawn | react-native-screens formSheet | add the medium detent with the action bar pinned (`unstable_sheetFooter`) and a JS scrim in `scrim` |
| R-M3 | "always undoable" toast | cm:270 | Undo only where an API exists (D-A10) | Toast | add revert APIs |
| R-Y1 | system font on font error | never system font | plan §7: continue with system fonts, logged | — | block on fonts |
| R-M5 | icon stroke 1.75 / 2 / 2.25 | custom 24-grid strokes | symbol weight approximates the stroke (D-A18) | expo-symbols | exported SVG set |

## §9 Accessibility

- **Roles and labels:** each control in §4 names its `accessibilityRole` and i18n label. Icon-only controls (Log action, remove, clear) carry `tabs.log`, `log.focus.remove.a11y` and `common.clearSearch`. Toggles expose `accessibilityState` (`checked` / `selected` / `expanded` / `disabled` / `busy`). Steppers are `adjustable` with `accessibilityValue`.
- **Focus and reading order:**
  - Log: header (Cancel, title) → sections top to bottom → action bar (reason/error, then Save). When the sheet opens, focus moves to the title (`AccessibilityInfo.setAccessibilityFocus`). When a row is added from search, focus moves to the new row's name.
  - Home: header → Quick log → next card → sections.
  - Library: title → search → segments → rows → footer.
  - Position detail (R1-18): back → title → aliases → tier tag → description → Variant-of row → Variants → From here (group overline, then rows) → Into here.
  - Session detail: back → overline date → title → status tag → meta → Focuses (each card: name, Flagged, status, rating, comment, counts, techniques) → Sparring → Notes → action bar (Edit session / Log it).
  - Set-rank sheet: Cancel → title → preview (live region) → Belt rows WHITE…BLACK → Stripes (−, value, +) → Awarded on → error banner → Save rank. When the sheet opens, focus moves to the title.
  - Bootstrap error screen: title → body → code → (dev) Reset database → Try again. On mount, focus moves to the title.
- **Targets:** every control ≥ `hit` (44 pt / 48 dp, R-18), by the hit-slop rule (§ Token notation):
  - 36-high chips, segments and picker chips: vertical slop 4 / 6.
  - The 40-high toast action: 2 / 4.
  - 44-high stepper buttons, IconButtons, rating/intensity buttons, the search field and outlined compact buttons: 0 / 2.
  - Inputs (`size.inputHeight` 48) and 48 / 56 buttons: none.
  - Wrapped chip rows use the platform `rowGap`, so slops never overlap (R1-10). The rating row's `spacing[1]` column gap needs no horizontal slop, because each button is ≥ 60 wide at 390 pt.
- **Status never by colour alone:**
  - Trained / Needs work: check icon + text.
  - Planned: the status text.
  - Ratings: the number + "n of 5" in the overline.
  - Flagged: badge text + glyph.
  - Rank: the name.
  - Active tab: the label + `selected`, plus the pill on Android.
  - Disabled Save: the reason text (R-C6).
- **Dynamic Type to 200 %:**
  - Everything wraps: rows `flexWrap`, `numberOfLines` only where stated.
  - D-A24 collapses the grids at font scale ≥ 1.5. Display styles cap at 1.3 (`textMaxScale`).
  - The Log action bar stays bottom-anchored.
- **Reduce Motion:** the toast and chip state changes do not animate (`useReducedMotion`); the sheets follow the OS (DSR-10). Haptics only per R-M4.
- **Announcements:** toasts (polite), the ErrorBanner (polite live region), the Set-rank preview (polite).

### §9.1 Contrast pairs computed this sprint (WCAG 2.x, the designer's python formula; rgba composited in sRGB)

The pairs already in `docs/design-system-contrast.md` (cited by line) cover every other pair here. These are the new ones:

| pair | light | ratio | dark | ratio | size / weight | result |
|---|---|---|---|---|---|---|
| `feedbackWarning` on `feedbackWarningTint` (on `bgBase`): Flagged badge on Home rows | #8F5600 on #FCEBD2 | 5.13 | #FFB547 on #322717 | 8.31 | badge 11/700 | L pass · D pass (≥ 4.5) |
| `feedbackDanger` on `feedbackDangerTint` (on `bgBase`): Reset database on the error screen | #C4223F on #FCE3E8 | 4.74 | #FF5C7A on #2D171D | 5.64 | button 15/600 | L pass · D pass (≥ 4.5) |

Recomputed controls, which match the doc: warning tint on `bgSurface` dark `#3A3021` 7.36 (doc :40); danger tint on `bgSurface` dark `#362127` 5.03 (doc :39). Reused recorded pairs:
- `textSecondary` on `bgBase` / `bgSurface` / `bgRaised` (:23-25)
- `accentText` on `bgRaised` (:33)
- `accentText` on `accentTint` (:34)
- `inverseFg` on `inverseBg` (:29)
- `accentOn` on `accentFill` (:30)
- `text-primary` on `border-default` (:28)
- `feedbackInfo` on tint over `bgBase` / `bgSurface` (:41, :43)
- `feedbackDanger` on tint over `bgSurface` (:39)

The known non-text failures (light `accentBorder` / `accentFill`, input boundaries, belts) are carried by text or icons, per the rows in §8. Both rows are appended to the text table of `docs/design-system-contrast.md` (review 1 R1-03).

## §10 Implementation notes for the frontend-coder

### §10.1 Components (new; `mobile/src/components/` shared, `mobile/src/features/<feature>/` specific)

| component | where | built from | notes |
|---|---|---|---|
| `Icon` | components | `expo-symbols` `SymbolView` | `name: { ios, android }` map in one file: house/home, book.closed/menu_book, plus/add, minus/remove, checkmark/check, chevron.right/chevron_right, magnifyingglass/search, xmark/close, calendar/calendar_today, clock/schedule, exclamationmark.circle/error, flag/flag (all Android names verified in `expo-symbols/build/android/symbols.json`); `tintColor` from tokens; `accessibilityElementsHidden` |
| `Button` | components | §4.3.1 / cm:38-53 | variants `primary · secondary · ghost · destructive · outlinedCompact`; `busy`, `disabled`; DSR-6 pressed |
| `IconButton` | components | cm:55-69 | required `accessibilityLabel` |
| `TextArea` | components | cm:71-87 | required `label` prop (renders the caption, R-A4) |
| `SearchField` | components | cm:89-95 | required `label`; clear button |
| `SegmentedControl` | components | cm:97-109 | 2–4 options |
| `Stepper` | components | cm:111-118 | `value?: number`, `min`, `max`, `step`, `firstValue` (D-A7), haptic |
| `ScalePicker` | components | cm:129-139 | `value?: 1..5`, `labelKey`, `levelNames?`; clear on re-tap |
| `Chip` | components | cm:141-155 | `variant: filter · selectable · add · picker` |
| `Tag`, `Badge` | components | cm:157-177 | Badge `variant: gi · flagged` (others unused in sprint 1) |
| `BeltRank`, `BeltSwatch` | components | cm:179-200 | size L for sprint 1; no `accent-*` inside (R-T6) |
| `Card`, `ListRow`, `SectionHeader` | components | cm:212-247, :317 | |
| `SheetChrome`, `BottomActionBar` | components | cm:249-261, :369-375 | |
| `Toast`, `ToastHost`, `useToast()` | components | cm:263-271 | `show({ messageKey, undo? })` |
| `EmptyState`, `ErrorBanner`, `LoadingState` | components | §8 DSR-7/8/9 | |
| `MainTabBar` | components | §4.1.2 | |
| `FocusRow`, `FocusSearch`, `QuickAddChips`, `TechniqueAttach`, `SparringSection`, `SessionSection`, `useLogDraft` | features/log-session | §4.3 | draft store holds the D-A9 undo copy |
| `NextSessionCard`, `StaleSessionRow`, `SuggestionRow`, `RecentSessionRow`, `RankCard`, `openQuickLog()` | features/home | §4.4 | `openQuickLog` shared with the tab bar |
| `SetRankSheet` | features/rank | §4.4.9 | |
| `SessionDetail` | features/session | §4.5 | |
| `PositionRow`, `TechniqueRow`, `SubjectRow`, `PositionDetail` | features/library | §4.6 | |
| `BootstrapErrorScreen` | features/bootstrap | §4.2.2 | rendered by `_layout.tsx` (the plan's "`app/_error`"); not a route |

A theme hook (`useTheme()` → `colors[scheme]`) lives in `mobile/src/theme/`, next to the generated `tokens.ts`, never inside it.

### §10.2 Navigation (Expo Router)

```
app/_layout.tsx            Stack: (tabs) · log-session (formSheet) · set-rank (formSheet) · session/[id] · dev/reset (__DEV__)
app/(tabs)/_layout.tsx     Tabs, tabBar={MainTabBar}: index · log (tabPress → preventDefault + openQuickLog) · library
app/(tabs)/index.tsx       Home
app/(tabs)/log.tsx         renders null (never focused)
app/(tabs)/library/_layout.tsx   Stack: index · position/[id]
app/log-session.tsx        params mode, sessionId?, typeId?, focus?
app/set-rank.tsx           (route added to plan §8's tree, D-A17)
app/session/[id].tsx
app/dev/reset.tsx
```

Sheets: `presentation: 'formSheet'`, `sheetCornerRadius: radius.xl`, `contentStyle: { backgroundColor: bgSurface }`. Push headers per §4.5. Deep link `matiq://dev/reset` (scheme `matiq`, `app.json`).

### §10.3 Packages and config (frontend-coder's `package.json` / `app.json` scope, plan §0)

- Add with `npx expo install`: `@react-native-community/datetimepicker`, `expo-haptics`. Confirm the APIs from their `.d.ts` files (`display="compact"`, `DateTimePickerAndroid.open`, `design`; `Haptics.selectionAsync`, `notificationAsync(Success)`, `performAndroidHapticsAsync`) and append them to `docs/stack-notes.md`.
- Keep `expo-symbols`. CO-13 prunes the rest.
- `app.json`: `android.predictiveBackGestureEnabled` stays `false` (T-13 withdrawn; enabling the predictive-back animation is a carry-over candidate for the orchestrator's close-out); splash `backgroundColor` `#F6F6F3` + `dark.backgroundColor` `#0B0C0E` (D-A20); `userInterfaceStyle: automatic` (already set).

### §10.4 Data the UI consumes: contract in plan §4

Plan §4 is the contract: the planner settled every request of the first version there (review 1 R1-01). Phase-A mocks are typed from plan §4. If a spelling below differs from plan §4, plan §4 wins and the UI follows. The names this spec relies on:

| name (plan §4) | consumer |
|---|---|
| `HookResult<T> = { data?: T; error?: DomainError }` (no data and no error = loading) | every loading / error state (§4.4.8, §4.6.7, §4.3.7) |
| `sessions.skip(id)` / `sessions.undoSkip(id)` → `SessionSummary` (`SESSION_NOT_FOUND`, `SESSION_NOT_PLANNED`) | Home Skip + toast Undo (§4.4.4) |
| `sessions.home` / `useHome()` → `HomeData` incl. `suggestions: Suggestion[]` (`{ ref; name; source }`), `lastCompleted`, `lastUsedTypeId`; PLANNED partitioned by `local_date` (R1-04) | Home, Log quick add |
| `matchedAlias?` on the `PositionRow` / `TechniqueRow` results of `listPositions` / `listTechniques` | `library.row.alias` |
| `getPosition` → `PositionDetail` with `description?`, `tier`, `aliases`, `parent?`, `children`, `techniquesFrom` / `techniquesTo` | Position detail (§4.6.8) |
| `type` filter on `listTechniques` / `useTechniqueSearch` | submission chips (D-A22) |
| `SubmissionRow` / `SubmissionInput` (`direction`, `techniqueId?`, plus `techniqueName?` on the row) | Log sparring, detail |
| `useFocusSearch(query)` reads `library.showExtended` itself | Log focus search |
| new codes `COUNTS_REQUIRE_ACTUAL`, `TECHNIQUE_REQUIRES_ACTUAL` (R1-05) | Log banner (§6.2); the UI already sends counts and techniques only for actual rows (§4.3.3) |

## §11 Design-system requests

There are no new requests. For the next re-export, the user can answer DSR-6, 7, 8, 9, 10, 11, 13, 14, 15, 16 (now ruled by R-18: amend R-M1), 17, 18, 19, 23, 24 and 25 by drawing the decisions in §8, or by replacing them. The RULES amendment R-18 asks for (48 dp binding) is pending at the designer's next intake run (T-12).

## §12 Reviewer checklist

- [ ] Every colour, spacing, radius, size and type value in §4 is a `tokens.ts` name or a §8 row (grep §4 for hex or px: only `app.json` splash hex in §10.3).
- [ ] Every plan open question (DSR-7, 8, 15, 18, 19, 23; A-18…A-23 consequences) is in §3 or §8.
- [ ] R-26: §4.3.6 walk-through shows ≤ 2 taps to a prefilled Log sheet (A-7), path A saves in 2; only type + 1 focus required; undo instead of confirm (§4.3.7); empty states name the next step (§6 rows tagged NF-06).
- [ ] One accent button per screen (T-09); no accent inside belt components (§4.4.7, §4.4.9).
- [ ] Planned vs actual is distinguishable by text in Log and detail (§4.3.3 table, §6.6).
- [ ] `needs_work` and rating are only available on trained rows (§4.3.3 body visibility).
- [ ] A session cannot save without an actual focus (disabled Save + reason, §4.3.1).
- [ ] Hit areas: `hit` 44 pt / 48 dp everywhere (T-12, §9).
- [ ] Copy table covers every string in §4; testID table covers every interactive element and list row in §4.
- [ ] Contrast: §9.1 new rows recomputed and present at the end of the text table in `docs/design-system-contrast.md`.
- [ ] No parked element (DSR-26…29) appears.
- [ ] §10.4 names match plan §4 (the planner's R1-01 rework); Skip calls `sessions.skip` / `undoSkip`.
- [ ] Hit-slop rule and wrapped-chip `rowGap` applied per control (§ Token notation, §9).
- [ ] 390 / 430 pt, light / dark, iOS / Android differences are explicit (§4.1.2, §4.3.2, §4.4.9, §10.2).
