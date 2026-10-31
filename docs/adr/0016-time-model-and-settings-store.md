# 0016. Time model (UTC + local_date) and settings separate from app_meta

- **Status:** accepted
- **Date:** 2026-10-31
- **Deciders:** PO (user)
- **Decision ids:** D-26, D-35 / R-15, R-21, R-22
- **Source:** `docs/decisions.md` Data R-15, Product R-21, Algorithm R-22; plan §0 D-26, D-35, §4.2.

## Ruling (quoted)

> PO, 2026-10-31 · R-15: "Ok" (duration in minutes; dates/times in device locale and time zone; weeks start Monday; no unit conversions)
>
> PO, 2026-10-31 · R-21: "ok"

## Context and problem

Sessions are bucketed by day and week in the user's zone, yet the data must be unambiguous if it later moves between devices. User preferences and machine metadata also need separate homes.

## Decision drivers

- Correct weekly aggregation across zone changes.
- Clear ownership: user preferences vs machine state.

## Considered options

- `starts_at` ISO UTC plus denormalised `local_date` (chosen); local-only timestamps: rejected.
- `settings` table (key, JSON value, type) for user preferences; `app_meta` for `schema_version`, `taxonomy_release`, `export_schema_version`, `db_key_created_at` (chosen).

## Decision outcome

Durations are integer minutes; weeks start Monday (`weekday` 1-7); calendar dates are `YYYY-MM-DD` local; timestamps ISO UTC. The clock is a parameter in domain code (`.claude/rules/data.md`). Settings keys and defaults live in `mobile/src/domain/settings/defaults.ts`.

## Consequences

- `local_date` must be recomputed deliberately if a session's start time is edited.
