---
paths:
  - "docs/**"
---
# Sprint artefacts — conventions

Loads when a file under `docs/` is touched.

- `docs/PRODUCT.md` is the product spec (what matIQ does, scope, the core loop, the domain model, the progression algorithm); `docs/decisions.md` is the binding decision record it was derived from, every bullet dated with its ruling id. Plan against both; never re-litigate a recorded decision. `docs/decisions.md` changes only with a quoted, dated user ruling.
- Each sprint lives in `docs/<sprint-slug>/` (kebab-case, not a number); branch `feature/<sprint-slug>`. Artefacts: `plan.md` → `design.md` → `review-1.md` (+ `-recheck`) → build → `data-contracts.md` (data-coder; prerequisite for frontend integration) → `test-report.md` → `docs-report.md` → `review-2.md` (+ `-recheck`) → `done.md`. Two rework rounds per artefact; a third needs the user.
- `plan.md` and `design.md` open with `§0 Summary for builders` (≤ 80 / ≤ 60 lines); `plan.md §0.1 Rulings needed` lists the assumptions only the user can settle. Coders and the tester read §0 plus named sections only.
- **A ruling is a quoted user sentence with a date.** A paraphrase is not a ruling; an ADR or a decision that infers one is **B**.
- `verify.md` is append-only, one block per agent per sha (`### <agent> @ <short sha> — <ISO date>` + a Command / Exit / Notes table), mirrored in `verify.json`; a row is never recorded for a command that was not run, and a green row at HEAD is accepted by everyone downstream.
- `progress.md` belongs to the orchestrator: a `## Current state` block (≤ 15 lines: HEAD · step · live agents · next action · blockers · uncommitted files) at the top, one line per handoff below.
- `docs/carry-over.md` is the one ledger of known failures and deferred items: read at sprint open, appended at close, never a fresh list in `done.md`; items already in the ledger are not re-listed.
- Earlier sprints' `plan.md` / `design.md` / reviews are the record of their time — never rewritten. `docs/stack-notes.md`: check before any external lookup, append after (library · version · fact · source · date).
- External research write-ups cite primary sources with URLs and dates; facts about installed tools are measured on this machine and say so.
- All documentation is in English.
