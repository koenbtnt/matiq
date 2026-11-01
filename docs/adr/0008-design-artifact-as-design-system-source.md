# 0008. The PO's Claude Artifact is the design-system source

- **Status:** accepted
- **Date:** 2026-10-31
- **Deciders:** PO (user)
- **Decision ids:** D-34 / S-05
- **Source:** `docs/decisions.md` Frontend S-05; plan §0 D-34.

## Ruling (quoted)

> PO, 2026-10-31 · S-05: "I will create a Claude Aretifact for the design" and "Export to design-system/, I extract tokens (Recommended)"

## Context and problem

Visual design is authored by the PO outside the repo; developers need tokens and component rules they can lint against.

## Decision drivers

- Single visual source of truth.
- Tokens only in code (`.claude/rules/frontend.md`).

## Considered options

- Export the artifact to `design-system/artifact/`; the designer extracts tokens (chosen).
- Design from scratch in code: rejected by the ruling.

## Decision outcome

Designer intake from `design-system/artifact/`. Open design requests (`design-system/components.md` "Open requests", CO-15 fonts, CO-16 rulings) are resolved before the sprint that uses them; DSR-12 and DSR-15 block sprint 1.

## Consequences

- A sprint can be blocked on a DSR ruling by the PO.
- Gym check-in, coach badge/notes and the video area in the artifact are out of v1 (R-16).
