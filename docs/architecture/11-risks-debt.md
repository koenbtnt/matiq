# 11. Risks and technical debt

The ledger of known failures and deferred items is [docs/carry-over.md](../carry-over.md); it is linked, not copied. Items below are architecture risks from the sprint 0 sources. Updated for sprint 1 (`foundation`).

## Risks

| Risk | Source | Mitigation / status |
|---|---|---|
| Focus unit (positions) may change after user tests | R-30 (provisional) | `{kind, ref_id}` shape; ADR 0014 stays proposed |
| Key lifecycle: accessibility class and OS-backup exclusion | A-11, A-16 | ruled R-39 (2026-11-01): exclusion from backups; Android done, iOS module scheduled for sprint 2 (CO-28); ADR 0006 |
| Export file is plaintext once shared | A-10, R-38 | ruled 2026-11-01: warning in UI; passphrase v1.x |
| Erase-all breaks the no-hard-delete rule | R-12, plan §11 | recorded exception; ADR 0015 |
| Soft-deleted rows accumulate; a purge policy would be a second hard-delete path | plan §12 | carry-over candidate |
| Polymorphic references (`focus_ref_id`, `target_id`) cannot be FK-enforced | ADR 0014, 0011 | repository validation and merge rewrites with tests |
| Third-party taxonomy licensing and attribution | R-28 | attribution screen is a release gate; BJJGraph excluded |
| Scraping instructional catalogues may violate terms of service | R-33 | not designed in v1 |
| Algorithm defaults are unvalidated proposals | ADR 0010 | tuned with real data; versioned |
| v2 backend and accounts undesigned | R-27, CO-08 | needs its own ADR; seam only |
| Sprint 1 blocked on DSR-12, DSR-15 and CO-15/CO-16 | S-05 | built on defaults A-23 and design A-70; PO confirmation is a close-out item (`docs/foundation/plan.md` §14) |
| Taxonomy graph incomplete: 84.1 % of GrappleMap transitions emitted against a 95 % target; about 137 anonymous nodes leave 268 endpoints unresolved | ADR 0021, `seed/report.json` | edges dropped, nodes kept; later: synthesise EXTENDED positions or curate (carry-over candidate) |
| iOS backup exclusion implemented (ADR 0026) and measured on the simulator only; not verified on a physical device or a TestFlight build | ADR 0026, CO-28 | verify on a device build before any store release |
| Dev-client verified in sprint 2: 13/13 Maestro flows on the iOS simulator (`docs/progress-settings/test-report.md`); Android E2E still deferred | CO-03, `docs/carry-over.md` | Android via EAS until a local SDK exists |
| Second hard-delete path (`__DEV__` reset route) | ADR 0023 | gated by `__DEV__`; erase-all reuses the primitive in sprint 3 |
| Curated core content and the gi layer unreviewed by the PO | ADR 0022 | review and growth are carry-over items |
| Fonts: normal-width Archivo instead of the design's width axis | A-23, DSR-12 | static width instances need font files from the artifact |

## Assumptions ledger (all ruled)

Sprint 1 adds A-15 to A-96 (planner A-15..A-33, designer A-34..A-80 and later); all ruled by R-39, R-43..R-49 or the blanket R-50 (2026-11-01). They are listed in [docs/foundation/assumptions.md](../foundation/assumptions.md), not copied. Architectural ones: A-16, A-17, A-24..A-29, A-31..A-33 (ADRs 0018 to 0023).

Sprint 0 assumptions:

All fourteen were taken at their default while the PO was offline (2026-10-31) and are now ruled: R-38, R-39, R-40, R-41, R-42, R-49 by name (A-10, A-11, A-12, A-2, A-6, A-13) and the rest by the blanket R-50 ("All are accepted as is", 2026-11-01). Rulings: [docs/decisions.md](../decisions.md). Full text: [docs/product-spec/assumptions.md](../product-spec/assumptions.md).

| Id | Assumption (short) |
|---|---|
| A-1 | Round outcome is DOMINANT / EVEN / DOMINATED |
| A-2 | Import is a merge by id; erase-all the only explicit confirm |
| A-3 | Aliases also on techniques |
| A-4 | Six seeded, editable subjects |
| A-5 | One active cycle at a time |
| A-6 | Legacy data is never imported (R-42; replaces "not in v1") |
| A-7 | "<= 2 taps" reaches the prefilled Log screen; saving is one more |
| A-8 | Session partner belt lives in `context_note` |
| A-9 | Rename keeps the old name as an alias (pre-ticked) |
| A-10 | Plaintext JSON export with a warning |
| A-11 | DB and key excluded from OS backups; device-only key class |
| A-12 | Review fields as columns on `sessions`, not a `session_reviews` table (ADR 0017) |
| A-13 | Numeric algorithm defaults other than the ruled 8-week window (ADR 0010) |
| A-14 | Seed ids minted by the converter and fixed in the seed file (ADR 0011) |

Sprint 2 additions (details in [carry-over](../carry-over.md)): seed technique names are not unique, 10 rows share name and from-position (ADR 0027, CO-33); coral/red belts need a migration (ruling R-55, CO-27); session-type and resource-type list editing moves to sprint 3 (R-53).
