# 11. Risks and technical debt

The ledger of known failures and deferred items is [docs/carry-over.md](../carry-over.md); it is linked, not copied. Items below are architecture risks from the sprint 0 sources. Partial: no code exists yet, so no technical debt is recorded.

## Risks

| Risk | Source | Mitigation / status |
|---|---|---|
| Focus unit (positions) may change after user tests | R-30 (provisional) | `{kind, ref_id}` shape; ADR 0014 stays proposed |
| Key lifecycle: accessibility class and OS-backup exclusion are unruled | A-11 | defaults assumed; confirm in sprint 1 (plan §12); ADR 0006 |
| Export file is plaintext once shared | A-10 | warning in UI; passphrase v1.x |
| Erase-all breaks the no-hard-delete rule | R-12, plan §11 | recorded exception; ADR 0015 |
| Soft-deleted rows accumulate; a purge policy would be a second hard-delete path | plan §12 | carry-over candidate |
| Polymorphic references (`focus_ref_id`, `target_id`) cannot be FK-enforced | ADR 0014, 0011 | repository validation and merge rewrites with tests |
| Third-party taxonomy licensing and attribution | R-28 | attribution screen is a release gate; BJJGraph excluded |
| Scraping instructional catalogues may violate terms of service | R-33 | not designed in v1 |
| Algorithm defaults are unvalidated proposals | ADR 0010 | tuned with real data; versioned |
| v2 backend and accounts undesigned | R-27, CO-08 | needs its own ADR; seam only |
| Sprint 1 blocked on DSR-12, DSR-15 and CO-15/CO-16 | S-05 | PO/designer rulings |

## Assumptions ledger (pending PO)

All fourteen were taken at their default while the PO was offline (2026-10-31); none is a ruling. Full text and what changes if ruled otherwise: [docs/product-spec/assumptions.md](../product-spec/assumptions.md).

| Id | Assumption (short) |
|---|---|
| A-1 | Round outcome is DOMINANT / EVEN / DOMINATED |
| A-2 | Import is a merge by id; erase-all the only explicit confirm |
| A-3 | Aliases also on techniques |
| A-4 | Six seeded, editable subjects |
| A-5 | One active cycle at a time |
| A-6 | No legacy data import in v1 |
| A-7 | "<= 2 taps" reaches the prefilled Log screen; saving is one more |
| A-8 | Session partner belt lives in `context_note` |
| A-9 | Rename keeps the old name as an alias (pre-ticked) |
| A-10 | Plaintext JSON export with a warning |
| A-11 | DB and key excluded from OS backups; device-only key class |
| A-12 | Review fields as columns on `sessions`, not a `session_reviews` table (ADR 0017) |
| A-13 | Numeric algorithm defaults other than the ruled 8-week window (ADR 0010) |
| A-14 | Seed ids minted by the converter and fixed in the seed file (ADR 0011) |
