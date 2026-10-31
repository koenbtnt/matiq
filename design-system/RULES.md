# Design rules — binding (placeholder until the design intake)

This file is written by the designer agent during the design intake from
`artifact/matiq-design.html` (see `README.md`). Until then only the rules that do not depend on the
design apply:

- Tokens only in `mobile/` (`.claude/rules/frontend.md`); `mobile/src/theme/tokens.ts` is generated.
- Hit targets ≥ 44 pt; inputs and primary buttons 48 pt tall.
- Text contrast ≥ 4.5:1 (AA) at the size and weight used; computed, never asserted (`docs/design-system-contrast.md`).
- Status and progression never conveyed by colour alone — always with text or an icon with a label.
- Phone-first, one-handed, portrait: primary action within thumb reach at 390 px and 430 px.
- Light and dark mode from the same token names.
