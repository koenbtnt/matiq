# 0007. Maestro for end-to-end tests on simulators

- **Status:** accepted
- **Date:** 2026-10-31
- **Deciders:** PO (user)
- **Decision ids:** D-01 / S-04
- **Source:** `docs/decisions.md` Repo S-04; plan §0 D-01.

## Ruling (quoted)

> PO, 2026-10-31 · S-04: "Maestro on simulators (Recommended)"

## Context and problem

The app is native-only; Playwright (used in sugar/cadence) targets the web.

## Decision drivers

- Flows run against the real dev-client build.
- R-26 criteria (tap counts, 30 s) must be measurable.

## Considered options

- Maestro on iOS simulator (chosen); Android when an SDK is available.
- Detox: not chosen, heavier setup.
- Playwright on web export: rejected, no web target.

## Decision outcome

Flows select by `id:` (testID `<screen>.<element>[.<id>]`), reset state through `clearState`/a reset route, assertions are never loosened (`.claude/rules/e2e.md`).

## Consequences

- Android E2E is deferred (CO-03).
- NF-01/NF-02 are tested by counting taps and timing a flow.
