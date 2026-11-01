# Design-system contrast — computed pairs

Every text/background pair the design introduces, as pair · hex (light / dark) · ratio · pass/fail at the size and
weight used (WCAG AA: 4.5:1 normal text, 3:1 large/bold). Written by the designer agent (intake and sprints); the
reviewer recomputes.

**Source:** `design-system/tokens.json` v1 (`_status: intake`), derived from `artifact/matiq-design.html` (canvas v13,
exported 2026-10-31, Emerald accent). Computed 2026-10-31 by the design intake.

**Method.** WCAG 2.x relative luminance and `(L1 + 0.05) / (L2 + 0.05)`, the formula the designer
agent runs (python3 heredoc). An `rgba(...)` token (dark `accent-tint`, the `feedback-*-tint` fills, `tabbar`) is alpha-composited in sRGB over
the surface it sits on, named in brackets; the composited hex is what is measured. Sizes are pt (iOS) = sp (Android),
treated as CSS px for the large-text threshold (≥ 24 regular or ≥ 18.67 at 700+). Every text row below is checked at
4.5:1, the normal-text threshold, because each row includes a style below the large threshold. Weight 600 is not bold for WCAG.

## Text (WCAG 1.4.3)

| pair | light (fg on bg) | ratio | dark (fg on bg) | ratio | size / weight | result |
|---|---|---|---|---|---|---|
| text-primary on bg-base | #0B0C0E on #F6F6F3 | 18.07 | #F4F4F1 on #0B0C0E | 17.76 | body 15/400 and up | L pass · D pass (≥4.5) |
| text-primary on bg-surface | #0B0C0E on #FFFFFF | 19.57 | #F4F4F1 on #15171A | 16.30 | body 15/400 and up | L pass · D pass (≥4.5) |
| text-primary on bg-raised | #0B0C0E on #EEEEEA | 16.82 | #F4F4F1 on #1E2125 | 14.67 | body 15/400; tag 13/500; belt tag | L pass · D pass (≥4.5) |
| text-secondary on bg-base | #5A5F67 on #F6F6F3 | 5.94 | #A3A8B0 on #0B0C0E | 8.19 | caption 13/500; overline 11/600 | L pass · D pass (≥4.5) |
| text-secondary on bg-surface | #5A5F67 on #FFFFFF | 6.43 | #A3A8B0 on #15171A | 7.51 | caption 13/500; overline 11/600 | L pass · D pass (≥4.5) |
| text-secondary on bg-raised | #5A5F67 on #EEEEEA | 5.53 | #A3A8B0 on #1E2125 | 6.76 | segment 14/600; field label 13/500 | L pass · D pass (≥4.5) |
| text-placeholder on bg-raised | #8A8F97 on #EEEEEA | 2.80 | #8A8F97 on #1E2125 | 4.97 | input placeholder 15/400 | L FAIL · D pass (≥4.5) |
| text-disabled on bg-raised | #9A9EA4 on #EEEEEA | 2.31 | #6A6F77 on #1E2125 | 3.20 | disabled button 15/600 (WCAG-exempt: inactive control) | L FAIL · D FAIL (≥4.5) |
| text-primary on border-default | #0B0C0E on #DCDCD6 | 14.21 | #F4F4F1 on #2A2E33 | 12.40 | stepper glyph 22; avatar initials 16/700 | L pass · D pass (≥4.5) |
| inverse-fg on inverse-bg | #F6F6F3 on #15171A | 16.59 | #0B0C0E on #F4F4F1 | 17.76 | segment/filter 14/600; toast 15/600 | L pass · D pass (≥4.5) |
| accent-on on accent-fill | #0B0C0E on #2EDB7F | 10.77 | #0B0C0E on #2EDB7F | 10.77 | button 17/700, 15/700; intensity 16/800 | L pass · D pass (≥4.5) |
| accent-text on bg-base | #0B7A3E on #F6F6F3 | 5.01 | #5FE69C on #0B0C0E | 12.38 | link 14/600; tab label 10/600 | L pass · D pass (≥4.5) |
| accent-text on bg-surface | #0B7A3E on #FFFFFF | 5.43 | #5FE69C on #15171A | 11.36 | ghost button 15/600; overline 11/600 | L pass · D pass (≥4.5) |
| accent-text on bg-raised | #0B7A3E on #EEEEEA | 4.67 | #5FE69C on #1E2125 | 10.22 | overline 11/600 (next-class card); step number 13/800 | L pass · D pass (≥4.5) |
| accent-text on accent-tint (on bg-surface) | #0B7A3E on #DCF8E8 | 4.82 | #5FE69C on #19362A | 8.29 | selected chip 14/600; Drilled badge 11/700 | L pass · D pass (≥4.5) |
| accent-text on accent-tint (on bg-base) | #0B7A3E on #DCF8E8 | 4.82 | #5FE69C on #112D20 | 9.36 | Drilled badge 11/700 (library row) | L pass · D pass (≥4.5) |
| accent-text on tabbar (over bg-base) | #0B7A3E on #FFFFFF | 5.43 | #5FE69C on #15171A | 11.36 | iOS active tab label 10/600 | L pass · D pass (≥4.5) |
| text-secondary on tabbar (over bg-base) | #5A5F67 on #FFFFFF | 6.43 | #A3A8B0 on #15171A | 7.51 | iOS inactive tab label 10/600 | L pass · D pass (≥4.5) |
| text-primary on bg-surface (Android nav) | #0B0C0E on #FFFFFF | 19.57 | #F4F4F1 on #15171A | 16.30 | Android active tab label 12/700 | L pass · D pass (≥4.5) |
| feedback-danger on feedback-danger-tint (on bg-surface) | #C4223F on #FCE3E8 | 4.74 | #FF5C7A on #362127 | 5.03 | destructive button 15/600; Injury badge 11/700 | L pass · D pass (≥4.5) |
| feedback-warning on feedback-warning-tint (on bg-surface) | #8F5600 on #FCEBD2 | 5.13 | #FFB547 on #3A3021 | 7.36 | Comp badge 11/700 | L pass · D pass (≥4.5) |
| feedback-info on feedback-info-tint (on bg-surface) | #1F5BD1 on #E2EBFC | 5.04 | #6FA8FF on #232E3F | 5.68 | New badge 11/700 | L pass · D pass (≥4.5) |
| feedback-info on feedback-info-tint (on bg-raised) | #1F5BD1 on #E2EBFC | 5.04 | #6FA8FF on #2B3748 | 5.00 | GI tag 11/700 (next-class card) | L pass · D pass (≥4.5) |
| feedback-info on feedback-info-tint (on bg-base) | #1F5BD1 on #E2EBFC | 5.04 | #6FA8FF on #1B2535 | 6.40 | New badge 11/700 (library row) | L pass · D pass (≥4.5) |
| #FFFFFF on rgba(11,12,14,0.8) (over bg-raised) | #FFFFFF on #38393A | 11.57 | #FFFFFF on #0F1013 | 19.02 | video duration 12/600 (Technique.dc.html:28) | L pass · D pass (≥4.5) |
| feedback-warning on feedback-warning-tint (on bg-base) | #8F5600 on #FCEBD2 | 5.13 | #FFB547 on #322717 | 8.31 | Flagged badge 11/700 (Home suggestion rows; sprint foundation, design.md §9.1) | L pass · D pass (≥4.5) |
| feedback-danger on feedback-danger-tint (on bg-base) | #C4223F on #FCE3E8 | 4.74 | #FF5C7A on #2D171D | 5.64 | destructive button 15/600 (bootstrap error screen; sprint foundation, design.md §9.1) | L pass · D pass (≥4.5) |
| accent-on on accent-graphic | #0B0C0E on #17B061 | 6.91 | #0B0C0E on #2EDB7F | 10.77 | heatmap level-2 count 13/500 (sprint progress-settings, design.md §9.1) | L pass · D pass (≥4.5) |
| inverse-fg on accent-text | #F6F6F3 on #0B7A3E | 5.01 | #0B0C0E on #5FE69C | 12.38 | heatmap level-3 count 13/500 (sprint progress-settings, design.md §9.1) | L pass · D pass (≥4.5) |

**Text failures:**

- `text-placeholder` on `bg-raised`, **light, 2.80:1**. The input placeholder is one hex in both themes (`matiq-design.html:67`). Placeholder text is not exempt. This is a design-system request: a light-theme placeholder value ≥ 4.5:1 on `#EEEEEA`.
- `text-disabled` on `bg-raised`: **light 2.31:1, dark 3.20:1**. Text in an inactive control is exempt from 1.4.3, so this is recorded but does not block. Rule: a disabled control must also say *why* it is disabled in nearby text that passes, so colour is not the only signal (`RULES.md` R-C6).
- The `#FFFFFF` on `rgba(11,12,14,0.8)` row is a raw literal in the canvas (`canvas/Technique.dc.html:28`), not a token. It passes, but it is still a design-system request (media-overlay token).

## Non-text: UI components and graphics (WCAG 1.4.11, 3:1)

| pair | light (fg on bg) | ratio | dark (fg on bg) | ratio | used for | result |
|---|---|---|---|---|---|---|
| accent-border on bg-raised | #17B061 on #EEEEEA | 2.43 | #2EDB7F on #1E2125 | 8.89 | input focus ring 1.5; today ring | L FAIL · D pass (≥3) |
| accent-border on bg-surface | #17B061 on #FFFFFF | 2.83 | #2EDB7F on #15171A | 9.88 | selected chip edge | L FAIL · D pass (≥3) |
| accent-fill on bg-surface | #2EDB7F on #FFFFFF | 1.82 | #2EDB7F on #15171A | 9.88 | primary button / switch-on track | L FAIL · D pass (≥3) |
| accent-fill on bg-raised | #2EDB7F on #EEEEEA | 1.56 | #2EDB7F on #1E2125 | 8.89 | switch-on track; intensity selected; week-day done | L FAIL · D pass (≥3) |
| accent-graphic on bg-surface | #17B061 on #FFFFFF | 2.83 | #2EDB7F on #15171A | 9.88 | chart current bar; intensity bar | L FAIL · D pass (≥3) |
| accent-graphic on border-default | #17B061 on #DCDCD6 | 2.06 | #2EDB7F on #2A2E33 | 7.52 | intensity filled vs empty segment | L FAIL · D pass (≥3) |
| border-default on bg-raised | #DCDCD6 on #EEEEEA | 1.18 | #2A2E33 on #1E2125 | 1.18 | input 1px boundary | L FAIL · D FAIL (≥3) |
| border-default on bg-surface | #DCDCD6 on #FFFFFF | 1.38 | #2A2E33 on #15171A | 1.31 | card hairline (decorative) | L FAIL · D FAIL (≥3) |
| border-strong on bg-raised | #C9C9C2 on #EEEEEA | 1.43 | #3A3F45 on #1E2125 | 1.52 | outlined button edge (next-class Details) | L FAIL · D FAIL (≥3) |
| border-strong on bg-surface | #C9C9C2 on #FFFFFF | 1.66 | #3A3F45 on #15171A | 1.69 | chart inactive bars | L FAIL · D FAIL (≥3) |
| border-stronger on bg-surface | #A9AAA3 on #FFFFFF | 2.34 | #4A4F56 on #15171A | 2.18 | dashed add-chip edge; sheet handle on surface | L FAIL · D FAIL (≥3) |
| border-stronger on bg-raised | #A9AAA3 on #EEEEEA | 2.01 | #4A4F56 on #1E2125 | 1.96 | sheet handle (Components sheet on raised) | L FAIL · D FAIL (≥3) |
| text-primary on border-default | #0B0C0E on #DCDCD6 | 14.21 | #F4F4F1 on #2A2E33 | 12.40 | library position progress fill vs track | L pass · D pass (≥3) |
| text-primary on border-stronger | #0B0C0E on #A9AAA3 | 8.35 | #F4F4F1 on #4A4F56 | 7.49 | Gi / No-Gi split bar | L pass · D pass (≥3) |
| accent-on on accent-fill | #0B0C0E on #2EDB7F | 10.77 | #0B0C0E on #2EDB7F | 10.77 | switch thumb; check icon in week strip | L pass · D pass (≥3) |
| accent-text on accent-tint (on bg-surface) | #0B7A3E on #DCF8E8 | 4.82 | #5FE69C on #19362A | 8.29 | Android active tab icon in pill | L pass · D pass (≥3) |
| belt-white on bg-surface | #EDEDE8 on #FFFFFF | 1.17 | #EDEDE8 on #15171A | 15.29 | white belt fill (needs border-strong edge on light) | L FAIL · D pass (≥3) |
| belt-white on bg-raised | #EDEDE8 on #EEEEEA | 1.01 | #EDEDE8 on #1E2125 | 13.76 | white belt swatch in tag | L FAIL · D pass (≥3) |
| border-strong on bg-surface (white-belt edge) | #C9C9C2 on #FFFFFF | 1.66 | #3A3F45 on #15171A | 1.69 | hairline around white belt | L FAIL · D FAIL (≥3) |
| belt-black on bg-surface | #111111 on #FFFFFF | 18.88 | #111111 on #15171A | 1.05 | black belt fill (edge border-strong) | L pass · D FAIL (≥3) |
| belt-black on bg-base | #111111 on #F6F6F3 | 17.44 | #111111 on #0B0C0E | 1.04 | black belt fill on base | L pass · D FAIL (≥3) |
| belt-blue on bg-surface | #2E62F0 on #FFFFFF | 5.10 | #2E62F0 on #15171A | 3.52 | belt fill | L pass · D pass (≥3) |
| belt-purple on bg-surface | #7E4FE0 on #FFFFFF | 5.14 | #7E4FE0 on #15171A | 3.49 | belt fill | L pass · D pass (≥3) |
| belt-brown on bg-surface | #7A4E2A on #FFFFFF | 7.12 | #7A4E2A on #15171A | 2.52 | belt fill | L pass · D FAIL (≥3) |
| belt-bar on belt-white | #0B0C0E on #EDEDE8 | 16.66 | #0B0C0E on #EDEDE8 | 16.66 | rank bar vs fill | L pass · D pass (≥3) |
| belt-bar on belt-blue | #0B0C0E on #2E62F0 | 3.84 | #0B0C0E on #2E62F0 | 3.84 | rank bar vs fill | L pass · D pass (≥3) |
| belt-bar on belt-purple | #0B0C0E on #7E4FE0 | 3.80 | #0B0C0E on #7E4FE0 | 3.80 | rank bar vs fill | L pass · D pass (≥3) |
| belt-bar on belt-brown | #0B0C0E on #7A4E2A | 2.75 | #0B0C0E on #7A4E2A | 2.75 | rank bar vs fill | L FAIL · D FAIL (≥3) |
| belt-bar-black on belt-black | #D7262E on #111111 | 3.78 | #D7262E on #111111 | 3.78 | red bar vs black fill | L pass · D pass (≥3) |
| belt-stripe on belt-bar | #FFFFFF on #0B0C0E | 19.57 | #FFFFFF on #0B0C0E | 19.57 | degree stripes | L pass · D pass (≥3) |
| belt-stripe on belt-bar-black | #FFFFFF on #D7262E | 4.99 | #FFFFFF on #D7262E | 4.99 | degree stripes on red bar | L pass · D pass (≥3) |
| belt-kids-grey on bg-surface | #8E9196 on #FFFFFF | 3.16 | #8E9196 on #15171A | 5.68 | kids belt fill | L pass · D pass (≥3) |
| belt-kids-yellow on bg-surface | #F2C230 on #FFFFFF | 1.68 | #F2C230 on #15171A | 10.72 | kids belt fill | L FAIL · D pass (≥3) |
| belt-kids-orange on bg-surface | #F2862E on #FFFFFF | 2.55 | #F2862E on #15171A | 7.03 | kids belt fill | L FAIL · D pass (≥3) |
| belt-kids-green on bg-surface | #2FA35A on #FFFFFF | 3.23 | #2FA35A on #15171A | 5.56 | kids belt fill | L pass · D pass (≥3) |
| bg-raised on bg-surface | #EEEEEA on #FFFFFF | 1.16 | #1E2125 on #15171A | 1.11 | input / stepper / segment container fill vs sheet or card | L FAIL · D FAIL (≥3) |
| bg-raised on bg-base | #EEEEEA on #F6F6F3 | 1.07 | #1E2125 on #0B0C0E | 1.21 | search field, next-class card vs screen | L FAIL · D FAIL (≥3) |
| inverse-bg on bg-raised | #15171A on #EEEEEA | 15.44 | #F4F4F1 on #1E2125 | 14.67 | selected segment vs segment track | L pass · D pass (≥3) |
| accent-fill on tabbar (over bg-base) | #2EDB7F on #FFFFFF | 1.82 | #2EDB7F on #15171A | 9.88 | Log action in tab bar | L FAIL · D pass (≥3) |
| accent-tint on bg-surface | #DCF8E8 on #FFFFFF | 1.13 | #19362A on #15171A | 1.37 | selected chip fill (state also carried by accent-border + check icon) | L FAIL · D FAIL (≥3) |
| accent-fill vs belt-kids-green | #2EDB7F on #2FA35A | 1.78 | #2EDB7F on #2FA35A | 1.78 | distinctness check (matiq-design.html:91), not a WCAG pair | L FAIL · D FAIL (≥3) |
| accent-text on bg-surface (fill) | #0B7A3E on #FFFFFF | 5.43 | #5FE69C on #15171A | 11.36 | heatmap level-3 cell fill (sprint progress-settings) | L pass · D pass (≥3) |
| bg-raised vs accent-tint (on bg-surface) | #EEEEEA on #DCF8E8 | 1.03 | #1E2125 on #19362A | 1.23 | heatmap level 0 vs level 1 (count digit carries the value) | L FAIL · D FAIL (≥3) |
| accent-tint (on bg-surface) vs accent-graphic | #DCF8E8 on #17B061 | 2.51 | #19362A on #2EDB7F | 7.21 | heatmap level 1 vs level 2 | L FAIL · D pass (≥3) |
| accent-graphic vs accent-text | #17B061 on #0B7A3E | 1.92 | #2EDB7F on #5FE69C | 1.15 | heatmap level 2 vs level 3 (count digit carries the value; DSR-30) | L FAIL · D FAIL (≥3) |
| belt-white on belt-kids-grey | #EDEDE8 on #8E9196 | 2.69 | #EDEDE8 on #8E9196 | 2.69 | GREY_WHITE band (name always shown) | L FAIL · D FAIL (≥3) |
| belt-white on belt-kids-yellow | #EDEDE8 on #F2C230 | 1.43 | #EDEDE8 on #F2C230 | 1.43 | YELLOW_WHITE band (name always shown) | L FAIL · D FAIL (≥3) |
| belt-white on belt-kids-orange | #EDEDE8 on #F2862E | 2.17 | #EDEDE8 on #F2862E | 2.17 | ORANGE_WHITE band (name always shown) | L FAIL · D FAIL (≥3) |
| belt-white on belt-kids-green | #EDEDE8 on #2FA35A | 2.75 | #EDEDE8 on #2FA35A | 2.75 | GREEN_WHITE band (name always shown) | L FAIL · D FAIL (≥3) |
| belt-black on belt-kids-grey | #111111 on #8E9196 | 5.97 | #111111 on #8E9196 | 5.97 | GREY_BLACK band | L pass · D pass (≥3) |
| belt-black on belt-kids-yellow | #111111 on #F2C230 | 11.27 | #111111 on #F2C230 | 11.27 | YELLOW_BLACK band | L pass · D pass (≥3) |
| belt-black on belt-kids-orange | #111111 on #F2862E | 7.40 | #111111 on #F2862E | 7.40 | ORANGE_BLACK band | L pass · D pass (≥3) |
| belt-black on belt-kids-green | #111111 on #2FA35A | 5.85 | #111111 on #2FA35A | 5.85 | GREEN_BLACK band | L pass · D pass (≥3) |
| belt-bar on belt-kids-grey | #0B0C0E on #8E9196 | 6.19 | #0B0C0E on #8E9196 | 6.19 | rank bar vs kids fill | L pass · D pass (≥3) |
| belt-bar on belt-kids-yellow | #0B0C0E on #F2C230 | 11.68 | #0B0C0E on #F2C230 | 11.68 | rank bar vs kids fill | L pass · D pass (≥3) |
| belt-bar on belt-kids-orange | #0B0C0E on #F2862E | 7.66 | #0B0C0E on #F2862E | 7.66 | rank bar vs kids fill | L pass · D pass (≥3) |
| belt-bar on belt-kids-green | #0B0C0E on #2FA35A | 6.06 | #0B0C0E on #2FA35A | 6.06 | rank bar vs kids fill | L pass · D pass (≥3) |

**Non-text failures and what they mean:**

| finding | themes | impact | handling |
|---|---|---|---|
| Surface steps `bg-raised` vs `bg-surface` / `bg-base` (1.07–1.21:1). The same goes for hairlines `border-default` (1.18–1.38:1) and `border-strong` (1.43–1.69:1) | both | Input, stepper, search and segment containers have no boundary at 3:1. Cards are fine: card edges are decorative, and their content identifies them. | Inputs always carry a visible label (caption above the field, `canvas/Components.dc.html:55`) and focus shows `accent-border` at 1.5 pt. That satisfies 1.4.11's "identifiable by other means" only in dark: light `accent-border` is 2.43:1 on `bg-raised`. **Design-system request**: an input boundary/focus value at ≥ 3:1 in light. |
| `accent-fill` on light surfaces (1.56–1.82:1) | light | The primary button and Log action rely on their 10.77:1 label/glyph, so they pass by label. The switch-on track, selected intensity levels and week-strip done days use the fill as the state signal. | The state must not rely on colour. The switch uses the platform switch, where thumb position carries state. Intensity levels carry the number and `accessibilityState.selected`, and the label "Intensity · Steady" names the value (`canvas/LogSession.dc.html:65`). Done days carry the check glyph (`canvas/Home.dc.html:61`). |
| `accent-border` / `accent-graphic` light `#17B061` (2.06–2.83:1) | light | Focus ring, selected-chip edge, intensity bars and the chart's current bar are below 3:1. | Selected chips also carry the check icon (`canvas/Components.dc.html:109`). The intensity display carries the text "3 of 5" (`canvas/Components.dc.html:86`). The chart has a text total and an `accessibilityLabel` (`canvas/Progress.dc.html:57,65`). **Design-system request**: a light `accent-border` that reaches ≥ 3:1 on `bg-raised` for the focus ring. |
| Chart inactive bars `border-strong` on `bg-surface` (1.66–1.69:1) | both | Bar heights are data. | The bars need a text alternative, either a summary label or a data list. **Design-system request**: a chart-bar colour ≥ 3:1, or a ruling that the text alternative is sufficient. |
| `border-stronger` (1.96–2.34:1) | both | The dashed "+ Add" chip edge and the sheet handle. The chip is identified by its label. The handle is decorative, because the sheet also closes with Cancel/Done and the back gesture. | Accepted with a label. Recorded. |
| White belt on light surfaces (1.01–1.17:1). Its `border-strong` edge is 1.66:1 | light | The artifact's own fix is the hairline (`matiq-design.html:89`), but the hairline is still below 3:1. | Rank is always rendered with its text name ("White belt · 2 stripes", `canvas/Progress.dc.html:34`), never by colour alone. **Design-system request**: a stronger edge for the white belt on light. |
| Black belt on dark surfaces (1.04–1.05:1) | dark | The fill disappears into the background. The red bar (3.78:1 on the fill) still reads. | The same name-always rule applies. The edge `border-strong` is 1.69:1 on dark `bg-surface`. **Design-system request**. |
| Brown belt on dark `bg-surface` (2.52:1), and `belt-bar` on brown (2.75:1) | dark / both | The brown fill and the bar edge on brown are below 3:1. | Name-always rule. Recorded for the user. |
| Kids yellow (1.68:1) and orange (2.55:1) on light `bg-surface` | light | The swatch is below 3:1. | Name-always rule. Recorded. |
| `accent-fill` vs `belt-kids-green` (1.78:1) | both | This is not a WCAG pair. It checks the rule "keep emerald distinct from kids green" (`matiq-design.html:91`). The two are distinguishable by hue and lightness, but not at 3:1. | Belt colours appear only inside belt components with the rank name, and the accent never appears inside a belt component (`RULES.md` R-C3, R-T6). |

All failing pairs are also listed in the intake report. None of them is fixed by changing a token: the artifact is the
source of truth, and each fix is a design-system request in `design-system/components.md` § Open requests.
