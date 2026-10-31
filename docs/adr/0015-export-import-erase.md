# 0015. JSON export, import and erase-all; erase as the single hard-delete path

- **Status:** accepted
- **Date:** 2026-10-31
- **Deciders:** PO (user)
- **Decision ids:** D-21 / R-12, R-27, R-26; assumptions A-2, A-10
- **Source:** `docs/decisions.md` Data R-12, Privacy R-12/R-27; plan §0 D-21, §5, §6, §11.

## Ruling (quoted)

> PO, 2026-10-31 · R-12: "make sure the whole app is safe and all personal data is securely encrypted."
>
> PO, 2026-10-31 · R-27: "yes" (export versioned and documented as the future upload format)

## Context and problem

Publishing readiness requires user control of data (`.claude/rules/privacy.md`): export and a full local erase before any store release. Erase conflicts with the no-hard-delete rule and with R-26 (undo instead of confirm).

## Decision drivers

- Data portability and the future upload format.
- Erase must remove WAL content and free pages.

## Considered options

- Export all tables including tombstones, versioned (`export_schema_version`) (chosen).
- Erase by `DELETE` + rekey: rejected, leaves free pages and WAL.
- Erase by closing the DB, deleting DB + WAL + SHM and the key, creating a new key and reseeding (chosen).

## Decision outcome

Settings: export JSON, import JSON, erase all, in sprint 3. Erase is recorded as R-12's single exception to the no-hard-delete rule (plan §11); every other path stays soft delete.

## Consequences

- Assumed, pending PO (A-2): import is a non-destructive merge by id, newest `updated_at` wins, no confirm; erase-all is the one explicit hold-to-erase confirmation, an exception to R-26 undo.
- Assumed, pending PO (A-10): export is plaintext JSON through the OS share sheet with a warning; passphrase encryption v1.x.
- Tombstone purge policy is a carry-over candidate (CO-09 covers the sprint-3 work).
