# 0010. Progression algorithm v1: deterministic, parameterised, versioned

- **Status:** accepted
- **Date:** 2026-10-31
- **Deciders:** PO (user)
- **Decision ids:** D-16, D-17 / S-06, R-08, R-17, R-22
- **Source:** `docs/decisions.md` Algorithm S-06, R-08, R-17, R-22; plan §0 D-16, D-17, §8, §4.3.

## Ruling (quoted)

> PO, 2026-10-31 · R-08: "Yes Deterministic, but in the future the algo might be changed or tweaked."
>
> PO, 2026-10-31 · R-17: "yeah ok"
>
> PO, 2026-10-31 · R-22: "ok"
>
> PO, 2026-10-31 · S-06: "Decide in the grilling session"

## Context and problem

The product promises to show what is improving or lacking. The PO wants it explainable and changeable later.

## Decision drivers

- Explainability ("every state explains why").
- Tunable without a release (weights and thresholds are data).
- Replaceable by a v2 without corrupting v1 history.

## Considered options

- Deterministic rule cascade over a rolling window (chosen).
- Learned/ML model: rejected, not explainable, needs more data than a single user has.
- Hard-coded constants: rejected by `.claude/rules/data.md` (weights are inputs).

## Decision outcome

Pure TypeScript module `mobile/src/domain/progression/v1`, computed on demand (no background jobs). Four states per focus: Improving, Steady, Needs work, Not trained lately; "Flagged" is the user's own mark, never a state. Signals: rating trend, needs-work frequency, planned-vs-actual gap, days since last trained, hit/caught ratio; first matching rule wins; missing signals drop out and weights rescale; output carries an explanation per signal. `algorithm_params` rows carry `algorithm_version`, `value`, `default_value`, bounds; `settings.algorithm.version` names the one active version; a v2 ships as a new module with new default rows and a one-time carry-over/reset notice. Specification: `docs/PRODUCT.md` §7, `docs/product-spec/plan.md` §8.

## Consequences

- The numeric defaults (window 8 weeks, staleness 21 days, weights, thresholds) are the planner's proposal, not rulings; they are tuned once real data exists.
- NF-09 (< 100 ms for 500 sessions) is a planner target, not ruled.
- Technique-level progression is v1.x (ADR 0014).
