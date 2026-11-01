# Sprint 1 — foundation — done

Branch `feature/foundation` (stacked on `feature/product-spec`, PR #4). Ran overnight under the PO's autonomy instruction (2026-10-31); every PO-level choice is a default in `assumptions.md` (A-15…A-96).

## Completed
- **Data model** — generated migration `0001_foundation`, 20 tables (incl. cycles/slots, A-24), sync seam, named checks, live-unique partial indexes, `descriptions.json` (0 undescribed). Repositories, pure domain, live hooks; contract in `data-contracts.md`.
- **SQLCipher** — `useSQLCipher: true`, KeyStore seam (expo-secure-store device-only + in-memory fake), 32-byte raw key, `PRAGMA key` first, typed `DB_*` bootstrap codes, `android.allowBackup: false`.
- **Taxonomy seed pipeline** — GrappleMap vendored (sha256 in `SOURCE.md`), grapple-flows vendored at aecbd79 (CC BY 4.0), zero-dep deterministic converter, curated layer + `ids.json` registry; seed: 602 positions (45 core), 1294 techniques (163 core, 9 gi), 6 subjects, 6 session types, 756 resources; idempotent first-launch seed; CI runs converter + seed diff + converter tsc.
- **Fonts** — Inter + Archivo, six faces via subpath imports, splash held until fonts and bootstrap resolve (CO-15).
- **Screens** — tab bar Home · Log · Library; Log Session (log/plan/edit; R-26 fast path 2 taps with a plan today, 3 otherwise per A-7); Home (next planned, quick log, needs-work suggestions, skip/undo, rank + Set-rank sheet); Session detail; Library + Position detail (alias search, core vs extended); bootstrap error screen; dev reset route.
- **Tests** — Jest 29 suites / 932 tests (data on better-sqlite3 + UI + hook integration); 4 Maestro flows + reset subflow authored.
- **Docs** — ADRs 0018–0023 (proposed), arc42 05/06/08/09/11, `docs/requirements/foundation.md`, regenerated data model + changelog.
- **Reviews** — review 1 failed → recheck passed; review 2 passed → follow-up passed.

## Verify at HEAD (from `verify.md`)
- Green: tsc 0 and Jest 29/932 (dfa6122); token `--check` 0, adherence 0, expo-doctor 20/20 (d11ef27); drizzle-kit no diff, converter + seed diff clean, converter tsc 0, prebuild ios/android exit 0 (83e6f12); doc generators (a3b4ee2).
- INFRA UNAVAILABLE: dev-client build, SQLCipher on device, simulator smoke (CocoaPods); all Maestro runs (Maestro).

## Skipped (by binding ruling)
- Detailed-rounds UI (R-32 sprint 3; table + repository + tests exist, A-20).
- Technique detail (R-32 sprint 2, A-21).
- Progress/Profile tabs (arrive with their screens, A-18).

## Carry-over
CO-28…CO-41 in `docs/carry-over.md` (closed: CO-15, CO-18, CO-20, CO-25).

## Post-close-out (2026-11-01, main session)
- Device verification done: dev-client build (PO), SQLCipher confirmed by the database file header, first-launch seed, and all 4 Maestro flows passing (`verify.md` block "main (PO session, first device run)", `test-report.md` "First device run"). CO-14, CO-30, CO-31, CO-37, CO-39 closed; CO-42 opened.
- PO rulings R-36…R-49 recorded (e9080c7); bash-guard rule 6 (09d150f).
