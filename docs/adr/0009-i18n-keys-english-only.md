# 0009. All strings through i18n keys; English only in v1

- **Status:** accepted
- **Date:** 2026-10-31
- **Deciders:** PO (user)
- **Decision ids:** D-33 / S-07
- **Source:** `docs/decisions.md` Frontend S-07; plan §0 D-33.

## Ruling (quoted)

> PO, 2026-10-31 · S-07: "English now, i18n-ready"

## Context and problem

Publishing may need more languages later; translating hard-coded strings is expensive.

## Decision drivers

- Cheap later localisation.
- Lint-checkable rule.

## Considered options

- i18n keys with an English catalogue only (chosen).
- Hard-coded English: rejected by the ruling.
- Ship several languages now: out of scope.

## Decision outcome

Every user-facing string, including `DomainError` mappings and empty-state copy, is an i18n key; one English catalogue. Dates, times and weeks follow device locale and zone (ADR 0016).

## Consequences

- NF-11 is tested by lint/test.
- Seed taxonomy names are data, not catalogue strings.
