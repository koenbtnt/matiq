# 0028. Five-tab shell with Profile as Settings, and the theme override at the root layout

- **Status:** accepted
- **Date:** 2026-11-01
- **Deciders:** PO (R-54 shell, R-56 theme); planner for the mechanism
- **Decision ids:** PS-09, PS-10 / R-44, R-45, R-54, R-56
- **Source:** `docs/progress-settings/plan.md` §0 PS-09, PS-10, §0.1 Q3 and Q5, §16.

## Ruling (quoted)

> PO, 2026-11-01 · R-54 (Q3): "(a). The Profile tab is the Settings screen: rank at the top, settings groups below, titled \"Profile\"."
>
> PO, 2026-11-01 · R-56 (Q5): "Yes, theme override ships in sprint 2."

R-56 lifts the "system theme only (21)" limit of R-44 (DSR-21, "Q9: yes keep parked", 2026-11-01) for the sprint-1 build; it does not otherwise amend R-44. Tab order is R-45.

## Context and problem

R-44 accepted a system-theme-only build, while PRODUCT §6 reads the manual override "from sprint 2". The shell also had to reach its final five tabs and place Settings.

## Considered options

- Separate Settings tab: rejected by R-54.
- Per-component theme override: rejected, native headers, sheets and the status bar would disagree.
- One override point at the root via `Appearance.setColorScheme` (chosen).

## Decision outcome

- Shell: Home, Library, Log, Progress, Profile (R-45 order, Log centre). Profile is the Settings screen; Progress and Profile are nested Stacks.
- The `theme.override` setting (`SYSTEM` | `LIGHT` | `DARK`, validated in `domain/settings/defaults.ts`) is read live by `features/profile/ThemeOverride.tsx`, mounted in `mobile/app/_layout.tsx`, which calls `Appearance.setColorScheme('light' | 'dark' | 'auto')`; SYSTEM maps to `'auto'`, which clears the override. `useTheme` stays a `useColorScheme` consumer.
- Stacks set `headerBackButtonDisplayMode: 'minimal'` (CO-42, PS-18).

## Consequences

- Switching never touches stored data; `StatusBar style="auto"` follows.
- Rank scale switching (adult/kids) hides, never deletes, entries.
- Related: ADR 0008, ADR 0009, ADR 0016. E2E: `settings-rank-theme`, `back-label`.
