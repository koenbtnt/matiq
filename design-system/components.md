# Component catalogue

Derived by the design intake on 2026-10-31 from `artifact/matiq-design.html` § 05 and `artifact/canvas/*.dc.html` (canvas v13, Emerald accent).

Citation shorthand:

- `M:<line>` is `artifact/matiq-design.html`.
- `C:<line>` is `canvas/Components.dc.html`.
- `Home:`, `Log:`, `Lib:`, `Tech:`, `Prog:` are the key-screen canvases (`Home`, `LogSession`, `Library`, `Technique`, `Progress` `.dc.html`).

Token names follow `tokens.json` (kebab-case). In `tokens.ts` they are camelCase:

- `bg-raised` becomes `colors.*.bgRaised`.
- `space-4` becomes `spacing[4]`.
- `radius-lg` becomes `radius.lg`.
- `button-height` becomes `size.buttonHeight`.
- `title-m` becomes `textStyle.titleM`.

A value marked **⚠ DSR-n** is on the canvas but is not a token (off-grid, off-scale, or in conflict with the Components board). It stays open until the user settles it (§ Open requests). No agent picks a token for it silently.

States: the artifact shows *default*, *selected/active*, *focused* and *disabled*. It shows no *pressed*, *loading*, *error* or *empty* state for any component. Those are DSR-6 to DSR-9 and are not invented here.

---

## 1 · Foundations components (§ 05)

### Button
- **Purpose:** actions. Max one accent button per screen (C:48).
- **Variants:**

| variant | height | radius | fill / border | label | semantic | source |
|---|---|---|---|---|---|---|
| primary | `button-primary-height` 56 | `radius-full` (28) | `accent-fill` | `accent-on`, `button-lg` 17/700 | `button-primary` | M:167; C:30 |
| secondary | `button-height` 48 | pill 24 (h÷2) | `bg-raised` + 1 `border-default` | `text-primary`, `button` 15/600 | `button-secondary` | M:168; C:32 |
| ghost (canvas label "Tertiary") | 48 | pill 24 | transparent | `accent-text`, `button` | — | M:169; C:33 |
| destructive | 48 | pill 24 | `feedback-danger-tint` | `feedback-danger`, `button` | `button-destructive` | M:170; C:34 |
| primary compact (inside the class card) | `button-compact-height` 44 | pill 22 | `accent-fill` | `accent-on`, `button-strong` 15/700 | `button-primary` | C:204 |
| outlined compact (inside the class card) | 44 | pill 22 | transparent + 1 `border-strong` | `text-primary`, `button` | — | C:205 |

- **States:** default; disabled (48, `bg-raised`, `text-disabled`, `button-disabled`, M:171; C:35). Pressed, loading: DSR-6, DSR-9.
- **Platform:** the same on both platforms. The hit area is ≥ 44 pt on iOS and ≥ 48 dp on Android (already met at 48/56).
- **Conflict:** on the Home key screen the class-card buttons are 48 high and 16/700 and 16/600 (Home:82-83), against 44 and 15 on the board. **⚠ DSR-15**.

### Icon button
- **Purpose:** an icon-only action (notifications, bookmark, filters, promotion history, save to plan).
- **Variants:**

| variant | spec | source |
|---|---|---|
| default | `icon-button` 44 circle, `bg-raised`, 1 `border-default`, glyph `icon-button-glyph` 22 in `text-primary`, stroke `icon-stroke` | M:172; C:39-43 |
| on the screen background (`bg-base`) | the same, with fill `bg-surface` | Home:42; Lib:27 |
| log action | `log-action` 56 circle, `accent-fill`, plus glyph 26 in `accent-on`, stroke `icon-stroke-emphasis` | C:45-46 |
| large (bottom bar) | 56 circle, `bg-raised`, 1 `border-default`, glyph 22 | Tech:65 |
| on media | 44 circle, `rgba(11,12,14,0.72)`, glyph `#FFFFFF`. Raw literals, **⚠ DSR-5** | Tech:29 |

- **States:** default. Pressed, disabled: DSR-6.
- **Accessibility:** an i18n `accessibilityLabel` is required (C:39 "Notifications").
- **Platform:** 44 is below the 48 dp Android minimum. **⚠ DSR-16**: extend the hit area with `hitSlop` to 48 dp (RULES R-M1).

### Text input and textarea
- **Purpose:** free text (gym, partner, notes).
- **Spec:**
  - Field label in `caption` 13/500 `text-secondary`, 6 above the field (**⚠ DSR-13** off-grid gap).
  - Field `input-height` 48, `radius-md`, 1 `border-default`, fill `bg-raised`.
  - Value in `input` 15/500 `text-primary`, horizontal padding 14 (**⚠ DSR-13**).
  - Placeholder `text-placeholder` (C:15; M:67).
  - Textarea: `textarea-height` 84, `radius-md`, padding 12/14, `body` 15/22 (Log:87).
- **States:**
  - default (C:56)
  - focused: 1.5 (`border-width-focus`) `accent-border` (C:59)
  - disabled, error: DSR-7
- **Contrast:**
  - Light placeholder is 2.80:1 (DSR-1).
  - The boundary is below 3:1 in both themes (DSR-2).
  - The visible label is therefore mandatory.
- **Platform:** the native keyboard. Notes use a multiline input. iOS: keyboard avoidance with the bottom action bar. Android: `adjustResize`. Neither keyboard behaviour is in the artifact (DSR-23).

### Search field
- **Spec:**
  - `search-height` 44, pill 22, fill `bg-raised`, padding 0 `space-4`, gap 10 (**⚠ DSR-13**).
  - Search glyph `icon-inline` 20 in `text-secondary`.
  - Placeholder "Search techniques, positions…" in `body` size 15/400 (C:62-64; Lib:23-26).
- **States:** default. Focus, clear button, results, empty: DSR-8.
- **Variant:** the iOS large-title search is 36 high with radius 10 (C:260). **⚠ DSR-14 / DSR-15**.

### Segmented control
- **Purpose:** exactly one choice among 2–4 (session type: Gi / No-Gi / Open mat / Comp; period: Week / Month / Year).
- **Spec:**
  - Track `bg-raised`, padding `space-1`, gap `space-1`, radius 14 (**⚠ DSR-14**).
  - Segment `segment-height` 36, radius 10 (**⚠ DSR-14**).
  - Label `chip` 14/600.
  - Selected: `inverse-bg` / `inverse-fg` (`segment-selected`).
  - Unselected: transparent / `text-secondary` (M:173; C:66-70).
- **Variants:**
  - Session-type on Log session: 40 high (Log:40). **⚠ DSR-15**.
  - Period toggle: padding 3, segment 32 high, radius 9 and 12, label 13/600 (Prog:59-61). **⚠ DSR-13 / DSR-14 / DSR-16**.
- **States:** selected / unselected (`aria-pressed`, Log:40). Expose `accessibilityState.selected`.
- **Platform:** a custom control on both platforms. The artifact does not map it to UISegmentedControl or M3 SegmentedButton. The hit area is ≥ 44/48 (DSR-16).

### Stepper
- **Purpose:** adjust a number (duration in 15-minute steps, 15–240; rolls 0–20, Log:155-158).
- **Spec:**
  - Container `bg-raised`, radius 14 (**⚠ DSR-14**), padding 6 on the board and 4 on Log session (**⚠ DSR-15**).
  - Buttons `stepper-button` 44, radius 10 (**⚠ DSR-14**), fill `border-default`, glyph "−" / "+" 22 in `text-primary`.
  - Value in `stepper-value` (Archivo 800 115% 20, tabular) with the unit in `caption` `text-secondary` (C:73-77; Log:48-51).
- **States:** default. At min/max, disabled: DSR-6. Each change fires `haptic-stepper` (M:156).
- **Accessibility:** buttons labelled "Less time" / "More time", "Fewer rolls" / "More rolls" (Log:49-59). Prefer `accessibilityRole="adjustable"` on the value.

### Switch
- **Spec:**
  - Track `switch-width` 51 × `switch-height` 31, on = `accent-fill`.
  - Thumb `switch-thumb` 27 in `accent-on`.
  - Row container `bg-raised`, radius 14 (**⚠ DSR-14**), label 14/500 (C:78-82).
- **States:** on (C:80). Off is not drawn (DSR-6).
- **Platform:** use the native `Switch`. Its track colour comes from tokens: `trackColor.true = accent-fill`, `thumbColor = accent-on`. The off colours are not defined (DSR-6).
- **Contrast:** the light on-track is 1.56:1 on `bg-raised`. Thumb position carries the state.

### Intensity scale (display) and intensity picker (input)
- **Display:**
  - Five bars, `intensity-bar-height` 10 (`intensity-bar-height-s` 6 inside cards), radius h÷2, gap 6 (4 in cards) (**⚠ DSR-13**).
  - Filled bars `accent-graphic`, empty bars `border-default`.
  - Label "Intensity · 3 of 5" in `caption` `text-secondary` (C:85-93, :175-176).
- **Picker:**
  - Five buttons, `intensity-button-height` 44, radius `radius-md`.
  - Level ≤ value: `intensity-selected`. Above the value: `intensity-unselected`.
  - Number in Archivo 800 16 (**⚠ DSR-11**).
  - The overline names the level: Flow / Light / Steady / Hard / Comp pace (Log:64-70, :141).
- **Accessibility:** each button is "Intensity n" (Log:68). The selected state is exposed and is never by colour alone.

### Chips
- **Filter (category) chip:**
  - `chip-height` 36, pill 18, padding 0 `space-4`.
  - Active: `chip-active` (`inverse-bg` / `inverse-fg`, `chip` 14/600) (C:102; Lib:34, :146-148).
  - Inactive: transparent + 1 `border-default`, `text-primary`, `chip-regular` 14/500.
  - The row scrolls horizontally with gap `space-2`.
- **Selectable (technique) chip:**
  - 36 high, padding 0 14 (**⚠ DSR-13**).
  - Selected: `chip-selected` + 1 `accent-border` + check `icon-check` 16 / 2.25 stroke, gap 6, `chip` 14/600 (C:108-109).
  - Unselected: transparent + 1 `border-default`, `text-primary`, `chip-regular` (C:110).
  - On Log session the unselected label is 14/600 (Log:77). **⚠ DSR-15**.
- **Add chip:** 36 high, 1 dashed `border-stronger`, `text-secondary`, `chip-regular`, label "+ Add technique" / "+ Add" (C:111; Log:82).
- **Picker chip** (date, gym on Log session): 40 high, pill 20, `bg-raised`, `text-primary` 14/500, leading 16 glyph, gap 8 (Log:30-33). **⚠ DSR-14 / DSR-16**.
- **States:** selected / unselected (`aria-pressed`). Pressed, disabled: DSR-6.
- **Platform:** the hit area is ≥ 44/48 via `hitSlop` (DSR-16).

### Tag
- **Purpose:** non-interactive metadata (technique names in a session card, "Gi & No-Gi", "Top game").
- **Spec:** `tag-height` 28, `radius-sm`, fill `bg-raised`, padding 0 10 (**⚠ DSR-13**), `tag` 13/500 `text-primary` (C:115; Tech:41-42). The session-card tags at C:179-180 are 13/400 (**⚠ DSR-15**).
- **Belt tag:** the same, plus a leading belt swatch `belt-swatch-width` 14 × `belt-swatch-height` 6, radius 2 (**⚠ DSR-14**), fill `belt-*`, 1 ring `border-strong`, gap 6. The label is the belt name (`belt-tag`, C:114-117; Tech:40). The swatch ring is missing on Tech:40 (**⚠ DSR-15**).

### Badge
- **Purpose:** a short status label.
- **Spec:** `badge-height` 24, radius 6 (**⚠ DSR-14**), padding 0 `space-2`, `badge` 11/700 +0.06em uppercase (C:121).
- **Variants:**

| variant | semantic |
|---|---|
| Drilled | `badge-drilled` |
| New | `badge-new` |
| Comp | `badge-comp` |
| Injury | `badge-injury` |
| GI | `tag-gi` (Home:72; C:173) |
| COACH | `badge-drilled` colours (C:158) |

  Sources: M:174; C:370-375.
- **Note:** the text label is always present (RULES R-C5). COACH implies a coach role (see Privacy conflicts).

### Belt rank (signature element)
- **Purpose:** show rank. Rank only, theme-invariant (M:47, M:89).
- **Anatomy:**
  - The belt fill (`belt-*`), then the rank bar (`belt-bar`, or `belt-bar-black` for black), holding 0–4 `belt-stripe` stripes aligned to the end, then a short fill tail.
  - Radius `radius-xs` (M:175; C:128-135).
  - The edge is `border-strong` for white and black, otherwise the belt fill (M:97-101; C/Main:98).
- **Sizes:**

| size | height | bar | stripe | gap | bar padding | tail | source |
|---|---|---|---|---|---|---|---|
| L | `belt-l-height` 32 | 84 | 6 | 5 | 9 | 16 | C:128-134 |
| M | `belt-m-height` 16 | 40 | 3 | 3 | 5 | 8 | C:137-140 |
| S | `belt-s-height` 8 | 18 | — | — | — | 4 | C:142-145 |

  The board says "stripes scale with height" (C:147). There are two more variants:
  - A 28-high belt (bar 64 / 76, C/Main:98-105; Prog:23-31).
  - An S variant with stripes and no tail (C:154).

  Both are **⚠ DSR-15**. The radius at M and S is 3 and 2 (**⚠ DSR-14**).
- **States:** a "next stripe" placeholder uses a dashed `border-stronger` stripe (Prog:28).
- **Kids ranks:** grey / yellow / orange / green. White and black split variants use a 50 % band (M:103-106). The split geometry is not drawn (DSR-15).
- **Accessibility:** always rendered next to its text name ("Blue belt · 2 stripes"). Never use belt colour alone (contrast failures in `docs/design-system-contrast.md`).

### Avatar and athlete row
- **Spec:**
  - Avatar `avatar` 48 circle, fill `border-default`, initials 16/700 (**⚠ DSR-11**).
  - Ring `avatar-ring` 3 in the belt colour (C:150, :160).
  - The row sits in a `bg-raised` container, `radius-lg`, padding 14 (**⚠ DSR-13**).
  - Name in `headline`.
  - Mini belt plus "Blue belt · 2 stripes" in `caption` `text-secondary`.
  - Trailing COACH badge (C:149-159).
- **Privacy:** see Privacy conflicts.

### Cards
All cards are `bg-surface`, `radius-lg`, 1 `border-default` (M:176), except the class card.

- **Session card:**
  - Padding `space-5`, gap 14 (**⚠ DSR-13**).
  - Title `headline` ("Gi · Fundamentals").
  - Meta in `caption` `text-secondary` ("Thu 29 Oct · 90 min · 6 rolls").
  - GI tag.
  - Intensity display (S).
  - Tags row.
  - Source: C:167-183.
- **Stat tile:**
  - Padding `space-4`, gap 6.
  - Label in `overline` `text-secondary`.
  - Value in `stat` (tabular), with the unit in `stat-unit` `text-secondary`.
  - Delta in `stat-meta` `accent-text` ("▲ 3.0 vs Sep"), or a note in `stat-note` `text-secondary`.
  - Source: C:185-194.
  - Home uses 3 tiles at radius 14 and padding 12, value 26/28, label 10/600 +0.1em, note 11 (Home:89-92). **⚠ DSR-11 / DSR-14 / DSR-15**.
- **Class card (highlighted):**
  - `bg-raised`, `radius-lg`, **no border**, padding `space-5` (Home: 18 ⚠ DSR-15).
  - Overline in `accent-text` ("Next class · Today 18:30").
  - Title `title-m`.
  - Meta `caption` with a pin glyph.
  - Buttons: primary compact + outlined compact (C:197-208; Home:69-85).
- **States:** default only. Pressed (for a tappable card), empty, loading: DSR-6, DSR-8, DSR-9.

### List row (settings-style)
- **Spec:**
  - `list-row-min-height` 60, gap 14 (**⚠ DSR-13**), bottom 1 `border-default`.
  - Leading `icon-tile` 40, radius 10 (**⚠ DSR-14**), `bg-raised`, with a 20 glyph.
  - Title `row-title` 16/500.
  - Subtitle `caption` (13/400 on the board; `caption` is 13/500, **⚠ DSR-11**) in `text-secondary`.
  - Trailing value `row-value` in `text-secondary`.
  - Chevron `icon-chevron` 18 / `icon-stroke-chevron` in `text-secondary` (C:215-227).
- **Examples:** Rank · "Blue · 2", Training goal · "3×", Home gym (C:377-379).
- **Platform:** the iOS chevron is shown. The artifact does not say whether Android drops the chevron (DSR-23).

### Bottom sheet
- **Spec:**
  - Container `bg-surface` (Log:20). The Components board draws it on `bg-raised` (C:232) (**⚠ DSR-15**).
  - Radius `radius-xl` on the top corners.
  - Drag handle `sheet-handle-width` 36 × `sheet-handle-height` 5 in `border-stronger`, top padding 8–10.
  - Header row: Cancel (16/500 `text-secondary`, Log:23, **⚠ DSR-11**), title `headline`, Done (`button` in `accent-text`, C:236).
  - `scrim` behind (M:178).
  - Sheet rows are 48 high, separated by `border-default`, with a trailing `caption` (C:239-240).
- **Platform:**
  - iOS: `.sheet` with medium / large detents.
  - Android: ModalBottomSheet with a drag handle (M:187).
  - Motion: 320 ms spring (M:155; DSR-10). Reduce Motion: no animation.
- **Accessibility:** `role=dialog` with a label (Log:20). Focus moves into the sheet. Escape is the back gesture on Android and swipe-down / Cancel on iOS.

### Toast
- **Spec:**
  - `toast-height` 52, radius 14 (**⚠ DSR-14**), `toast` (`inverse-bg` / `inverse-fg`).
  - Padding 0 8 0 16 (**⚠ DSR-13**).
  - Check glyph 20 / 2.25.
  - Message `button` 15/600.
  - Undo action `toast-action-height` 40, `button-strong` 15/700 underlined.
  - Visible 4 s (`duration-toast`), always undoable (C:243-248).
- **Accessibility:** announce politely (`AccessibilityInfo.announceForAccessibility`). The Undo hit area is ≥ 44/48 (DSR-16).

### Navigation: tab bar and NavigationBar
- **Tabs:** Home, Library, Log (centre), Progress, Profile (M:179; C:381-387).
- **iOS:**
  - Height `tabbar-height-ios` 82 (C:262). The key screens use 84 (Home:21) (**⚠ DSR-15**).
  - Fill `tabbar`. The board uses `bg-surface` (**⚠ DSR-15**).
  - Top 1 `border-default`.
  - Icons `icon-tab-ios` 26 above a `tab-label` 10/600 label.
  - Active `accent-text` with `aria-current`, inactive `text-secondary`.
  - Log is a `tab-log-action` 52 accent circle raised 4 (Home:26-29). The board's log action is 56 (**⚠ DSR-15**).
- **Android:**
  - `tabbar-height-android` 80, `bg-surface`.
  - Indicator pill `tab-pill-width` 56 × `tab-pill-height` 32, radius 16, `accent-tint` when active.
  - Icon `icon-tab-android` 22 in `accent-text` when active, `text-secondary` when inactive.
  - Label `tab-label-android-active` in `text-primary` / `tab-label-android` in `text-secondary` (C:285-293).
- **Behaviour:** Log presents the Log-session sheet on both platforms. No FAB (M:186). Labels are always visible (M:185).
- **Accessibility:** each tab has `accessibilityRole="tab"` and an i18n label. The Log action is labelled "Log session" (Home:26).

### Android top app bar
- **Spec:** `app-bar-height-android` 64. Leading back arrow and trailing action in 48 boxes, with 24 glyphs. Title 22/500 (**⚠ DSR-11**, no type style) (C:274-283).
- **iOS equivalent:** a large title in Archivo 800 115% 30/34 (C:259, **⚠ DSR-11**) with an edge-swipe back chevron (M:188).

---

## 2 · Key-screen components (§ 06)

### Screen header
- **Home:**
  - Overline date in `text-secondary` ("Saturday, 31 October").
  - Greeting `title-l` ("Oss, [Name]").
  - Trailing icon button (Home:37-45).
- **Library / Progress:** large title Archivo 800 32/36 (Lib:20; Prog:20). This is off-scale against `title-l` 28/32, **⚠ DSR-11**.
- **Screen padding:** top 62 (status bar plus spacing, **⚠ DSR-13**). Use the safe-area inset plus a token. Gutter `space-5`.

### Week strip card
- **Spec:**
  - Card (`bg-surface`, `radius-lg`, 1 `border-default`, padding `space-4`, gap 14 ⚠ DSR-13).
  - Header "This week · 3 of 4": `button` 15/600 with the count in `text-secondary` 500.
  - Streak "6-week streak" in 13/600 `accent-text` with a flame glyph 16 (Home:47-54).
- **Days:** a 7-column grid. Weekday letter 11/600 `text-secondary`. Circle `week-day` 36:
  - **done:** `week-day-done` + check glyph 16 / 2.75 stroke (stroke ⚠ DSR-11).
  - **today:** `bg-raised` + 1.5 `accent-border` ring.
  - **rest:** `bg-raised` (Home:55-66, :156-161).
- **Accessibility:** each day announces its state in text (done / today / rest). The check glyph is the non-colour cue.

### Section header with action
- **Spec:** row height 32. Title Archivo 700 110% 18 (**⚠ DSR-11**). Trailing link `chip` 14/600 in `accent-text` ("See all") (Home:98-101; Lib:60-63, with the trailing caption "From your coach").
- **Hit area:** the link needs ≥ 44/48 via `hitSlop` (DSR-16).

### Recent-session row
- **Spec:**
  - Min height 64 (**⚠ DSR-13**), bottom 1 `border-default`, gap `space-3`.
  - Date tile `date-tile` 44, `radius-md`, `bg-surface` + 1 `border-default`: weekday 9/700 `text-secondary`, day Archivo 800 16/18 (both **⚠ DSR-11**).
  - Title 15/600 (**⚠ DSR-11**).
  - Meta `caption` `text-secondary` ("60 min · 5 rolls · Intensity 4/5").
  - Chevron (Home:102-114).
- **Row type:** this is a list row in a virtualised list.

### Position card
- **Purpose:** a Library grid item, 2 columns, gap 10 (**⚠ DSR-13**).
- **Spec:**
  - Card `bg-surface`, `radius-lg`, padding 14.
  - Count Archivo 800 125% 26/28 tabular in `accent-text` (**⚠ DSR-11**).
  - Name 15/600.
  - "15 drilled" 12 `text-secondary`.
  - Progress bar 4 high, track `border-default`, fill `text-primary` (Lib:41-54).
- **Note:** the fill is `text-primary`, not `accent-graphic`. Progress uses the accent elsewhere (M:74). Recorded as drawn (**⚠ DSR-15**).

### Technique row (continue learning)
- **Spec:**
  - Min height 72 (**⚠ DSR-13**).
  - `thumbnail` 56, `radius-md`, `bg-raised`.
  - Name 15/600.
  - Belt swatch plus meta "Half guard · Passing" 12 `text-secondary`.
  - Trailing badge (Drilled / New) (Lib:64-76).

### Video hero
- **Spec:**
  - `video-hero-height` 290, `bg-raised`, with a decorative 6-column grid of `border-default` at 35 % opacity.
  - Centred play button `play-button` 72 in `accent-fill` / `accent-on`, labelled "Play instructional, 4 minutes 12 seconds".
  - Duration badge with raw media-overlay literals.
  - Back button: icon button on media (Tech:20-31).
- **Gaps:**
  - Media overlay tokens: **⚠ DSR-5**.
  - Video source: see Privacy conflicts.

### Content tabs
- **Purpose:** switch between Steps, Details and Notes on Technique detail.
- **Spec:** equal-width, 44 high. Label `button` 15/600 (`text-primary` when selected, `text-secondary` otherwise). The selected tab gets a 2 underline (`tab-indicator-height`) in `accent-graphic`, over a 1 `border-default` baseline (Tech:45-49, :138-143).
- **Accessibility:** `role=tablist`, with `tab` and `selected` on each tab.

### Numbered steps
- **Spec:**
  - Gap 14.
  - Marker `step-number` 28 circle, `bg-raised`, number Archivo 800 13 in `accent-text`.
  - Title 15/600/20, body 14/20 `text-secondary` (Tech:51-61). All three styles are **⚠ DSR-11**.

### Bottom action bar
- **Purpose:** a sticky footer holding the screen's one primary action.
- **Spec:** `bg-surface`, top 1 `border-default`, padding 12 `space-5` 34 (12 and 34 are **⚠ DSR-13**; use the bottom safe-area inset).
- **Variants:**
  - Log session: a single primary button, "Save session" (Log:91-93).
  - Technique: a 56 bookmark icon button plus a primary toggle (Tech:64-72).
- **Behaviour:** save fires `haptic-save` and shows the toast with Undo (M:156; C:245-248).

### Mark-as-drilled toggle
- **Purpose:** a primary button that toggles.
- **States:**
  - Off: "Mark as drilled", `button-primary`.
  - On: "Drilled today", `drilled-done` + 1 `accent-border` + check (Tech:68-71, :147-151).
- **Accessibility:** expose the state with `accessibilityState.checked` or `selected`. Never by colour alone: the label changes too.

### Rank card
- **Spec:**
  - Card (padding 18, gap 14, **⚠ DSR-13**).
  - Belt (28 high, ⚠ DSR-15) with a dashed next-stripe placeholder.
  - Title `title-m` "Blue belt · 2 stripes".
  - Meta `caption` "Since 14 Mar 2025 · 1 y 7 m at rank".
  - Promotion-history icon button.
  - Two mini stats on `bg-raised`, radius 12 (`radius-md`), padding 10/12: Archivo 800 125% 20 tabular plus a 12 `text-secondary` note (Prog:22-51).

### Bar chart card
- **Spec:**
  - Card. Header: overline "Mat hours", total Archivo 800 125% 28/30 tabular (**⚠ DSR-11**), period segmented control.
  - Plot `chart-height` 120. Bars radius 6 6 0 0, gap 8. The current bar is `accent-graphic`, the others `border-strong`.
  - Baseline 1 `border-default`. Axis labels 11 `text-secondary` (Prog:53-75).
- **Accessibility:** `role=image` with the label "Mat hours per week, 29.5 hours total" (Prog:65, :168).
- **Contrast:** the inactive bars are 1.66:1 (DSR-3).

### Split bar and metric card
- **Gi / No-Gi split:** overline, then an 8-high split with gap 2: `text-primary` for the Gi share, `border-stronger` for the remainder. Text "62% Gi" / "38%" (Prog:78-85).
- **Taps metric:** overline, value Archivo 800 125% 24 tabular, "/ 17 this month" `caption` (Prog:86-92).
- Both are in a 2-column grid, gap 10 (**⚠ DSR-13**).

---

## Privacy and scope conflicts (for the user and Orchestrator)

These elements imply data or network use that v1 does not allow (`.claude/rules/privacy.md`: on-device only, no network carrying user data, no accounts). They are catalogued as drawn, and none of them is buildable as drawn until a product ruling exists.

| element | source | conflict |
|---|---|---|
| "Check in" button and "Schedule" on the class card; "Home gym · Schedule & check-in" row | Home:82-83; C:204, :379 | A gym check-in or schedule implies a gym service or account. |
| Coach: "Coach [Name]", the "COACH" badge, "From your coach", "Coach note: your coach adds notes here after class" | Home:78; C:158; Lib:62; Tech:130 | Coach-authored content implies sharing, accounts and sync. |
| Instructional video with a play button | Tech:20-31 | The video source is not defined: bundled, or remote? Remote content is a network call (it carries no user data, but it needs a ruling). |
| Notifications bell, "Class reminder" switch | Home:42; C:79-80 | Local notifications are allowed. Push notifications are not. Not defined. |
| Athlete avatar with initials and name | C:149-152 | Personal data. Fine on-device, but no account id. |

---

## Open requests

Design-system requests for the user. Change the canvas, re-export, and re-run the intake. None of them is solved by an agent inventing a value.

| # | request | evidence |
|---|---|---|
| DSR-1 | Light-theme `text-placeholder` that is ≥ 4.5:1 on `bg-raised` (#8A8F97 is 2.80:1). | M:67; contrast doc |
| DSR-2 | An input boundary / focus ring at ≥ 3:1 in light. `accent-border` #17B061 is 2.43:1 on `bg-raised`, and `bg-raised` vs `bg-surface` is 1.11–1.16. | M:61, :73; C:56-59 |
| DSR-3 | A chart inactive-bar colour ≥ 3:1 on `bg-surface` (`border-strong` is 1.66–1.69:1), or a ruling that the text alternative suffices. | Prog:67, :179 |
| DSR-4 | Belt edges below 3:1: the white belt on light (its `border-strong` edge is 1.66:1), black on dark (1.04), brown on dark (2.52), `belt-bar` on brown (2.75), kids yellow and orange on light (1.68 / 2.55). | M:97-106 |
| DSR-5 | Media-overlay tokens. The video badge uses `rgba(11,12,14,0.8)`, the back button `rgba(11,12,14,0.72)`, and the text and icons `#FFFFFF`. All are raw literals. | Tech:28-29 |
| DSR-6 | **Pressed** state for every interactive component, plus the switch **off** colours and stepper **at-limit** / disabled. None is drawn. | C:30-111 |
| DSR-7 | **Error** state for inputs and forms (border, message style, icon), e.g. a session that cannot be saved without an actual focus. | — |
| DSR-8 | **Empty** states: no sessions yet (Home, Progress), no search results (Library), no data in a period (chart). | — |
| DSR-9 | **Loading** states: button busy, list or skeleton. | — |
| DSR-10 | Spring parameters for the 320 ms sheet (damping / stiffness, or iOS-native default). | M:155 |
| DSR-11 | Type sizes in key screens that are off the scale. Map each one to a style, or add styles: large title 32/36 (Lib:20, Prog:20) and 30/34 (C:259); title 22/26 (Home:75); section title 18 (Home:99; Lib:39, :61); numerals 26/28 (Home:91; Lib:44), 28/30 (Prog:57), 24 (Prog:89), 20 (Prog:43), 16 date (Home:106), 16 intensity (Log:68), 13 step number (Tech:54); labels 10/600 +0.1em (Home:90), 9/700 (Home:105); 15/600 titles (Home:109; Lib:48, :70; Tech:56); 14/20 body (Tech:57); 12 meta (Lib:49, :71; Prog:44); 11 note (Home:92); 16/700 and 16/600 buttons (Home:82-83); 16/500 Cancel (Log:23); Android app-bar title 22/500 (C:279); avatar initials 16/700 (C:150); list subtitle 13/400 vs `caption` 13/500 (C:222). | as cited |
| DSR-12 | Archivo **width axis** (110 / 115 / 125 %) in React Native, where `fontStretch` is not a style. Decide on static width instances (which files?) or a variable font. Also the wordmark (Archivo 900, 125 %, C/Main:30): no type style and no exported asset. | M:112, :115-117 |
| DSR-13 | Off-grid spacing values (not multiples of 4, or not in the scale): 6, 10, 14, 18, 22 and 34, plus 62 top padding. They are used for gaps, padding and row heights (64, 72). Map each one to `space-*` or add tokens. | C:55, :62, :108, :115, :149, :216; Home:35, :69, :103; Lib:40, :65; Log:91; Prog:22 |
| DSR-14 | Off-scale radii: 6 (badge), 10 (segment, stepper button, icon tile, iOS search), 14 (segment track, stepper / switch container, toast, Home stat tile), 9 and 12 (period toggle), 2 and 3 (belt M / S, swatch), 20 (picker chip, the pill rule). | C:66-74, :116, :121, :137, :142, :217, :243; Home:89; Prog:59-61; Log:30 |
| DSR-15 | Components-board vs key-screen conflicts, each needing one answer:<ul><li>log action 56 vs 52 (C:45 / Home:27)</li><li>tab bar 82 vs 84 high (C:262 / Home:21), and `bg-surface` vs `tabbar` fill</li><li>segment 36 vs 40 (C:67 / Log:40)</li><li>stepper padding 6 vs 4 (C:73 / Log:48)</li><li>class-card buttons 44 / 15 vs 48 / 16 (C:204 / Home:82)</li><li>unselected technique chip 14/500 vs 14/600 (C:110 / Log:77)</li><li>sheet `bg-raised` vs `bg-surface` (C:232 / Log:20)</li><li>stat tile radius 16 vs 14 (C:185 / Home:89)</li><li>belt 28-high variant and the S belt with stripes (C/Main:98; Prog:23; C:154)</li><li>kids split-belt geometry</li><li>belt-tag swatch ring missing (Tech:40)</li><li>position progress fill `text-primary` vs accent for progress (Lib:52 / M:74)</li></ul> | as cited |
| DSR-16 | Hit areas: 44-pt components (icon button, stepper, search, intensity, compact buttons) are below the artifact's own 48 dp Android minimum. Chips and segments are 36, the period toggle 32, the toast Undo 40, the picker chips 40, and the text links ("See all", "Done", "Cancel") have no height. Confirm the `hitSlop` approach (RULES R-M1) or resize. | M:154; C:23 |
| DSR-17 | **Progression states** (improving / needs work / flagged) as tokens and a component, with the "why is this flagged" explanation pattern. The artifact has none, and the starter's `focus-improving` / `focus-needs-work` pairings are therefore dropped. | — |
| DSR-18 | **Planned vs actual focus** in session logging: a visual distinction (not colour alone) and a component. | — |
| DSR-19 | **Rating input** and rating display (per focus area): reuse the intensity picker, or a new component. | Log:64-70 (closest) |
| DSR-20 | Screens and components for editing the **taxonomy and algorithm weights**, with history. | — |
| DSR-21 | **Profile / Settings** screen: the Profile tab has no screen. It holds the theme override System / Light / Dark (C/Theming:22) and settings rows (C:377-379). | M:179 |
| DSR-22 | **Data export and full erase** UI (`privacy.md`: publishing-ready), and a destructive **confirmation dialog** pattern. | — |
| DSR-23 | Platform details not drawn: keyboard avoidance with the bottom action bar, Android list-row chevron, Android back on sheets, date-picker presentation within the Log sheet. | M:185-191 |
| DSR-24 | Destinations not drawn: notifications, filters sheet, promotion history, save to plan, schedule, "See all". | Home:42, :83, :100; Lib:27; Prog:37; Tech:65 |
| DSR-25 | The app icon / wordmark mark (accent tile with a mini belt, C/Main:23-30) as an exported asset. | C/Main:23-30 |
