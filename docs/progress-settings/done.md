# progress-settings — done

Sprint 2, branch `feature/progress-settings`, PR into `develop`. Rulings R-52…R-56 (PO, 2026-11-01).

## Completed

- **Progress tab**:
  - algorithm v1 as pure domain code (`mobile/src/domain/progression/`), with a "why" sheet per focus
  - three panels: rank history, consistency heatmap, planned-vs-trained (R-52; ADR 0024)
  - no schema change (PS-01)
- **Profile = Settings** (R-54):
  - rank, including the kids scale
  - algorithm parameters with reset and undo
  - suggestion sources
  - detailed-rounds and extended-library toggles
  - theme override (R-56; ADR 0028)
  - About, rendering `attribution.json` with the CC BY 4.0 link (CO-35) and the backup status
- **Library editing**:
  - create, rename (the old name becomes an alias), soft delete + undo, aliases
  - merge + undo as one transaction with a versioned payload, including the `session_techniques` re-pointing (ADR 0025)
  - name-uniqueness rule PS-24 (ADR 0027)
- **Technique detail** with Resources (manual entry, to-watch/watched) and History.
- **iOS backup exclusion**:
  - local Expo module `mobile/modules/matiq-backup/`, injected through `setBootstrapOverrides` (ADR 0026, R-39)
  - the exclude xattr was measured on `Documents/SQLite`, `matiq.db`, `-wal` and `-shm` on the simulator
- **Back label** "(tabs)" fixed (CO-42).
- **Verification** (`verify.md`):
  - tsc 0
  - Jest 1726 under `TZ=UTC` and Europe/Amsterdam
  - token sync and adherence
  - expo-doctor 20/20
  - `expo run:ios` 0
- **Maestro**: 13/13 on the iPhone 18 Pro simulator (`test-report.md`). 10 of these passed in the whole-suite run; 3 passed in single-flow re-runs after flow fixes and the A-1/A-2 fixes.
- **Docs**:
  - ADRs 0024–0028; ADR 0020 amended
  - arc42 05–12
  - `docs/requirements/progress-settings.md` (US-P01…P09)
  - data model regenerated (21 tables, 0 undescribed)
- **Reviews**:
  - review 1: failed, then the recheck passed
  - review 2: passed, with no blocking findings

## Skipped (by ruling)

- Session-type and resource-type list editors: sprint 3 (R-53 → CO-43).
- Coral/red belts: later (R-55; CO-27 stays open).

## Carry-over

- Closed: CO-13, CO-26, CO-28, CO-35, CO-42.
- Added: CO-43…CO-49 in `docs/carry-over.md`.
