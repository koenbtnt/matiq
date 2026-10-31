# 0017. Planning and logging model: sessions, reviews, rounds, cycles, slots, rank

- **Status:** accepted
- **Date:** 2026-10-31
- **Deciders:** PO (user)
- **Decision ids:** D-04, D-10..D-15, D-19 / R-03, R-05..R-07, R-10, R-19, R-20
- **Source:** `docs/decisions.md` Product R-03, R-05, R-06, R-07, R-10, R-19, R-20; plan §0 D-04, D-10..D-15, D-19, §4.

## Ruling (quoted)

> PO, 2026-10-31 · R-05: "Per focus the possible to comment as well. Add energy level, belt of sparring partner as free additional context."
>
> PO, 2026-10-31 · R-06: "Ok But allow for extension of detail here. and the extensions has to be an option for the user later. they should also be able to log 1 specific round and the rest globally."
>
> PO, 2026-10-31 · R-07: "Yes Both. And allow users to set standard training moments each week so they do not have to manually plan everythin."
>
> PO, 2026-10-31 · R-19: "you should be able tp detaild one ore more rounds, or none."
>
> PO, 2026-10-31 · R-20: "yes"
>
> PO, 2026-10-31 · R-10: "ok"
>
> PO, 2026-10-31 · R-03: "corect"

## Context and problem

The core loop plan -> train -> log -> review needs a record model that supports a 30-second log and optional depth.

## Decision drivers

- Only session type and one focus required (R-26).
- Aggregates always; detail optional.
- Planned vs actual per focus feeds the gap signal.

## Considered options

- Review columns on `sessions` (one review per session, same screen): a planner decision on brief prose, not a ruling quote (chosen); a separate `session_reviews` table: rejected.
- Session-level `submissions` with nullable `round_id` and `technique_id`, so submissions can be tied to a technique with detailed rounds off (chosen).

## Decision outcome

`sessions` (status PLANNED|COMPLETED|SKIPPED, aggregates, review fields), `session_focuses` (is_planned, is_actual, needs_work, rating, comment, hit/caught), `session_techniques`, `rounds` (detailed, gated by `log.detailedRounds`, off by default), `submissions`, `session_types` (seeded, user-editable, no S&C), `cycles` + `cycle_focuses` (1-3 focuses, default 28 days), `slots` (generate PLANNED sessions 14 days ahead; the generator reads tombstones so skipped instances are not resurrected), `rank_entries` (history; current = latest live row; ADULT|KIDS scales). A session completes only with at least one actual focus (domain rule).

## Consequences

- Assumed, pending PO: A-1 round outcome vocabulary, A-5 one active cycle at a time, A-7 reading of "<= 2 taps", A-8 partner belt inside `context_note`.
- Reminder columns arrive in migration 0002 (sprint 3).
