# design-intake — done

Branch `chore/design-intake-tokens` → PR into `develop`. Chore, not a feature sprint: no plan.md/design.md; the artefacts are the intake files themselves.

## Completed
- `design-system/tokens.json` v1 (`_status: intake`, canvas v13, Emerald accent): 38 colour tokens (26 semantic + 12 belt/kids, theme-invariant), 25 type styles (Inter text, Archivo display), 9 spacing, 6 radius, 71 size tokens, 19 semantic pairs, motion, haptics, icon; every value cited (`_citations`).
- `design-system/components.md`: 33 components (38 with variants) with states, tokens and citations; `§ Open requests` DSR-1…DSR-29.
- `design-system/RULES.md`: binding design rules R-* derived from the artifact; 44 pt hit floor binding, 48 dp pending DSR-16/Q18; parked gym/coach/video/reminders (R-S5).
- `docs/design-system-contrast.md`: 55+ pairs computed in both themes; AA failures recorded with mitigations.
- `scripts/sync-design-tokens.mjs` extended (per-style fontFamily, fontVariant, textTransform, textMaxScale/textScaling, motion, haptics, icon); `mobile/src/theme/tokens.ts` regenerated; verify green at `bcc7733`.
- Review 1 passed (S1–S5), recheck passed.

## Skipped
- Simulator smoke (no UI changed). Maestro (not installed, CO-01).

## Carry-over (appended to `docs/carry-over.md`)
- CO-04 → done; CO-15 font loading; CO-16 DSR rulings; CO-17 tidy of the "≥ 44/48" lines (N5).
