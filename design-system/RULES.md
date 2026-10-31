# Design rules — binding

Derived by the design intake (2026-10-31) from `artifact/matiq-design.html`, which is the export of canvas v13 with the
Emerald accent. Short citations below: `M:<line>` means `artifact/matiq-design.html:<line>`, and `C/<File>:<line>`
means `artifact/canvas/<File>.dc.html:<line>`. Tokens are named as in `tokens.json`. The code uses the camelCase names
in `mobile/src/theme/tokens.ts`. Gaps and conflicts are `DSR-n` in `components.md § Open requests`.

## 0 · Source and precedence

| # | Rule | Source |
|---|---|---|
| R-S1 | The artifact is the source of truth. `tokens.json`, `components.md` and this file are derived copies. No agent edits `artifact/`. A missing value is a design-system request, not an invention. | `README.md`; M:7 |
| R-S2 | Where the export and the canvas default differ, the canvas default with accent `green` wins. The other accents (blue, orange, teal, gold, mono, volt) are rejected and are not part of the system. | M:39 |
| R-S3 | Component styles and states come from `canvas/Components.dc.html`. A key-screen value that differs from the Components board does not become a token. It is an open request (DSR-11, DSR-13 to DSR-15). The reason: the board is the exact-style source (M:164), so a key-screen one-off that contradicts it is an unresolved conflict, not a variant. Turning it into a token would choose a winner silently. For example, the tab-bar Log action at 52 (Home:27) against the board's 56 (C:45) has no token until DSR-15 is answered; `size.logAction` 56 is the board value. Key-screen sizes that the board does not contradict (week-day, date-tile, video-hero…) remain tokens. | M:164; review-1 S4 |
| R-S4 | Theming notes about SwiftUI asset catalogs and Compose `MatiqColors` do not apply. Tokens reach the UI only through `tokens.ts`. | C/Theming:128-129; `artifact/README.md` |
| R-S5 | **Parked scope:** nothing in `components.md` § Privacy and scope conflicts (DSR-26 to DSR-29) is built until the PO rules on it. That covers gym check-in and schedule, coach content, instructional video, and notifications and reminders. Their tokens and variants exist only because the artifact draws them: `button-compact-height` for the class card, `video-hero-height`, `play-button`, the COACH badge. A sprint spec may not use them for these elements before the ruling. **Pending ruling** (product-spec grilling, 2026-10-31): the current direction is to park gym and coach, to replace embedded video with a reference link the user pastes per technique, and to add reminders as local notifications later in v1. This is a direction, not a decision. | `.claude/rules/privacy.md`; review-1 S2 |

## 1 · Principles

| # | Rule | Source |
|---|---|---|
| R-1 | **Mat-side first:** one-thumb flows and big targets. Logging a session takes under 30 s, even with sweaty hands. The primary action sits at the bottom, within thumb reach, at 390 and 430 pt. | M:46 |
| R-2 | **Belt as language:** belt colours mean rank and nothing else. | M:47; C/Main:94 |
| R-3 | **Quiet until it counts:** surfaces are neutral, and the accent appears only on the primary action and on progress. | M:48; C/Main:80 |
| R-4 | **Native at heart:** one token set, with platform-native navigation, sheets, back gestures and haptics (§ 8). | M:49 |

## 2 · Theme

| # | Rule | Source |
|---|---|---|
| R-T1 | The theme follows the system appearance. The canvas also names a System / Light / Dark override in Settings. No Settings screen exists in the canvas yet (DSR-21). | M:38; C/Theming:22 |
| R-T2 | Token names are identical in both themes (`colors.light.*` / `colors.dark.*`). Never branch on theme to pick a different token. | M:55 |
| R-T3 | An accent **fill** (`accent-fill`) always carries a dark label (`accent-on` `#0B0C0E`) in both themes. Accent **text and lines** (`accent-text`, `accent-border`, `accent-graphic`) use the darker light-theme shade. | M:88; M:71-74 |
| R-T4 | Belts do not change with the theme. The white belt always has a `border-strong` hairline, and so does the black belt (edge column). | M:89; M:97, M:101 |
| R-T5 | **Elevation without shadows.** Dark steps surfaces up (`bg-base` → `bg-surface` → `bg-raised`). Light puts white `bg-surface` cards on the off-white `bg-base`, with `border-default` hairlines. No shadow token exists, and none may be added in code. | M:90; M:158 |
| R-T6 | Emerald doubles as **success**. Keep it clearly distinct from kids green `#2FA35A` (M:91). The artifact holds the two distinct by brightness (C/AccentOptions:73), but they measure only 1.78:1. As the mitigation for that pair, **no `accent-*` colour is used inside a belt component** (belt rank, belt swatch, belt tag, avatar ring). | M:91; C/AccentOptions:73; `docs/design-system-contrast.md:96, :111` |

## 3 · Colour use

| # | Rule | Source |
|---|---|---|
| R-C1 | **Accent may be used for:** the one primary action per screen (`accent-fill`, max one accent button per screen), the Log action, the active tab (`accent-text` on iOS, an `accent-tint` pill on Android), links and overlines (`accent-text`), selected chip and focus ring (`accent-border`), charts, intensity and progress (`accent-graphic`), selected chip fill and the Drilled badge (`accent-tint`), and success. | M:70-75, M:179; C/Components:48; C/Main:80 |
| R-C2 | **Accent may not be used for:** a second filled accent button on the same screen, rank or belt, destructive or warning or info states (those use `feedback-*`), or decoration. | M:48; C/Components:48; M:76-81 |
| R-C3 | **Belt colours (`belt-*`) are rank only, never UI state.** They are rendered only inside the belt-rank component, a belt swatch, a belt tag or an avatar ring. Text is never belt-coloured, and a belt colour never fills a button, chip or badge. | M:47, M:94; C/Main:94; C/Components:115-116, :160 |
| R-C4 | Feedback pairs are fixed: Drilled = `accent-tint`/`accent-text`, New = `feedback-info-tint`/`feedback-info`, Comp = `feedback-warning-tint`/`feedback-warning`, Injury and destructive = `feedback-danger-tint`/`feedback-danger`, GI tag = info. Use the `semantic.*` pairings and never re-pair. | M:174, M:76-81; C/Components:371-374 |
| R-C5 | **Status is never conveyed by colour alone:** every badge carries its text label, a selected chip carries a check icon, a done day carries a check, an intensity level carries its number and the named level, a chart carries a text total and an accessibility label, and a rank always shows its name. | placeholder rule; C/Components:109, :121; C/Home:61; C/LogSession:65; C/Progress:57, :65 |
| R-C6 | Disabled = `bg-raised` + `text-disabled`. Disabled text is below 4.5:1 (an inactive control, which WCAG exempts), so a disabled primary action also shows, in passing text nearby, why it is disabled. | M:171; `docs/design-system-contrast.md` |

## 4 · Typography

| # | Rule | Source |
|---|---|---|
| R-Y1 | Two families only. **Archivo** for display text, titles and numbers, at weights 700 and 800, with the width axis at 110 / 115 / 125 %. **Inter** for reading and UI, at 400, 500, 600 and 700. Fonts come from Google Fonts (`@expo-google-fonts` family names in `type.fontFamily` / `type.displayFontFamily`). The system font is never used for UI text. | M:112, M:115-123 |
| R-Y2 | Use the `textStyle.*` scale: display, title-l, title-m, headline, body, caption, overline, plus the component label styles cited in `tokens.json`. A size from a key screen that is off this scale is not used until DSR-11 is settled. | M:114-121; R-S3 |
| R-Y3 | **Numbers always use tabular figures:** ratings, counts, scores, durations and stats (`fontVariant: ['tabular-nums']`). | M:112; C/Components:75, :187 |
| R-Y4 | Sizes are pt on iOS and sp on Android. Every style scales with Dynamic Type / the font scale up to 200 %, and display caps at 1.3× (`maxFontSizeMultiplier`). Layouts must survive 200 % without clipping. | M:112, M:190 |
| R-Y5 | Overline: Inter 600, 11/14, +0.12 em, uppercase, for section labels and "Next class". Badge: Inter 700, 11, +0.06 em, uppercase. | M:121; C/Components:121 |
| R-Y6 | Archivo's width axis may not be reachable in React Native through `fontStretch`. How the expanded widths are delivered (static width instances or a variable font) is open (DSR-12). Until it is settled, display styles must not fall back silently to another family. | M:112; DSR-12 |

## 5 · Space, shape, size

| # | Rule | Source |
|---|---|---|
| R-L1 | **4-pt grid:** `spacing` 1, 2, 3, 4, 5, 6, 8, 10, 14 = 4, 8, 12, 16, 20, 24, 32, 40, 56. The screen gutter is `space-5` (20). Off-grid canvas values (6, 10, 14, 18, 22…) are not tokens (DSR-13). | M:128-139; C/Home:35 |
| R-L2 | **Radius:** `xs` 4 belts, `sm` 8 tags, `md` 12 inputs, `lg` 16 cards, `xl` 24 sheets (top corners), `full` for pills and buttons = height ÷ 2 (28 at 56 high). Off-scale canvas radii (6, 10, 14…) are DSR-14. | M:144-149 |
| R-L3 | Hairline borders are `size.borderWidth` (1). A focused input or the today ring uses `size.borderWidthFocus` (1.5). | C/Components:27, :59; C/Home:59 |

## 6 · Touch, motion, haptics, icons

| # | Rule | Source |
|---|---|---|
| R-M1 | **The binding floor is a hit target ≥ 44 × 44 pt on both platforms** (`size.touchTarget`, `.claude/rules/frontend.md`). The artifact's **≥ 48 × 48 dp on Android** (`size.touchTargetAndroid`) is the artifact value, **pending DSR-16 / PO ruling** (grilling Q18). Until the ruling it is a target, not a gate. The visual size may be smaller than the target (chip 36, segment 36, period toggle 32, toast action 40). The hit area is then extended with `hitSlop` or padding, and never left below 44 pt. | M:154; C/Components:23 ("every interactive element meets the 44/48 target"); `.claude/rules/frontend.md`; DSR-16 |
| R-M2 | Inputs are 48 high. Buttons are 48 high, and the primary button is 56. | C/Components:56; M:167-171 |
| R-M3 | **Motion:** state changes use 200 ms ease-out (`motion.durationState`). Sheets use a 320 ms spring (`motion.durationSheet`, spring parameters DSR-10). The toast shows for 4 s and is always undoable. **Respect Reduce Motion:** with it on, state changes and sheets do not animate. | M:155; C/Components:248 |
| R-M4 | **Haptics:** a light tick on every stepper change (iOS `.selection`, Android `CLOCK_TICK`) and a success notification on save (iOS `.success`, Android `CONFIRM`). No other haptics without a design-system change. | M:156, M:191 |
| R-M5 | **Icons:** 24 grid, 1.75 stroke, round caps and joins. SF Symbols / Material Symbols Rounded are the fallback. Plus and check glyphs use 2.25 and the chevron uses 2. Icon-only controls always carry an i18n `accessibilityLabel`. | M:157; C/Components:39-46, :225 |

## 7 · Navigation and platform mapping

| # | Rule | Source |
|---|---|---|
| R-N1 | Five tabs: Home, Library, **Log** (centre, presents a sheet), Progress, Profile. iOS: TabView, labels always visible, active `accent-text`, inactive `text-secondary`. Android: NavigationBar, active pill `accent-tint`, label `text-primary` 700, inactive `text-secondary` 500. | M:179, M:185 |
| R-N2 | The Log action is the centre destination presenting a sheet on both platforms. **No FAB.** | M:186 |
| R-N3 | Sheets: iOS `.sheet` with medium / large detents; Android ModalBottomSheet with a drag handle. `radius-xl` top corners, `scrim` behind. | M:178, M:187 |
| R-N4 | Back: iOS edge swipe + chevron; Android predictive back gesture + arrow. Never disable the system back gesture. | M:188 |
| R-N5 | Date and time use native pickers: iOS inline / compact DatePicker; Android M3 DatePicker and TimePicker dialogs. | M:189 |
| R-N6 | The canvas targets iOS 17+ and Android 14+ (Material 3). The app's actual minimum OS is set by the Expo config, not by this file. That minimum has not been checked against Expo SDK 58. | C/Main:36 |

## 8 · Contrast and accessibility

| # | Rule | Source |
|---|---|---|
| R-A1 | Text contrast is ≥ 4.5:1 (AA) at the size and weight used. Non-text UI and graphics are ≥ 3:1, or the information is carried by text or an icon as well. **Computed, never asserted**: every pair is in `docs/design-system-contrast.md`, and a new pair is computed there before it is used. | placeholder rule; WCAG 1.4.3 / 1.4.11 |
| R-A2 | The following known non-text failures stay open until the user re-exports (DSR-2 to DSR-4): light `accent-border` / `accent-graphic` / `accent-fill` as state signals, input boundaries at 1.1–1.2:1 in both themes, and several belt fills below 3:1 against surfaces. Until then each of these components must carry its state in text or an icon (R-C5). | `docs/design-system-contrast.md` |
| R-A4 | **Placeholder (DSR-1):** light `text-placeholder` on `bg-raised` is 2.80:1. Until DSR-1 is answered, **every input has a visible label** (`caption` above the field), and **the placeholder never carries required information**: it is only an example or hint, and nothing the user needs is stated there alone. | `docs/design-system-contrast.md`; C/Components:55; review-1 S1 |
| R-A3 | Every control has an `accessibilityRole` and an i18n `accessibilityLabel`. Toggles expose `accessibilityState` (selected / checked / disabled). Charts are `role="image"` with a text summary. | C/Components:39, :80; C/Progress:65; `.claude/rules/frontend.md` |

## 9 · Generic rules kept from the placeholder

- Tokens only in `mobile/` (`.claude/rules/frontend.md`). `mobile/src/theme/tokens.ts` is generated, never hand-edited.
- Hit targets ≥ 44 pt (binding floor); 48 dp on Android is pending DSR-16. Inputs are 48 pt tall, and buttons ≥ 48 (primary 56) (R-M1, R-M2).
- Text contrast is ≥ 4.5:1 (AA) at the size and weight used, computed and never asserted (R-A1).
- Status and progression are never conveyed by colour alone, always with text or an icon with a label (R-C5).
- Phone-first, one-handed, portrait: the primary action is within thumb reach at 390 px and 430 px (R-1).
- Light and dark mode come from the same token names (R-T2).
