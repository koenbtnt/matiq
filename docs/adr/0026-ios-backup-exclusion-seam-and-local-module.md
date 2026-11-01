# 0026. iOS backup exclusion: `BackupExclusion` seam and a local Expo module

- **Status:** accepted
- **Date:** 2026-11-01
- **Deciders:** PO ruled the requirement (R-39); planner designed the seam
- **Decision ids:** PS-17 / R-39, R-24; CO-28
- **Source:** `docs/progress-settings/plan.md` §0 PS-17, §9; `docs/stack-notes.md` (measured 2026-11-01); implements ADR 0020.

## Ruling (quoted)

> PO, 2026-11-01 · R-39 (Q4): the database and key are excluded from iCloud and Android backup; iOS needs a small local Expo module, "scheduled for sprint 2". The PO's answer: "Q4: yes".

## Context and problem

ADR 0020 deferred the iOS exclusion because no package exposes it. A same-device restore brings the device-only key back with the database, so this is a release gate (`privacy.md`).

## Decision drivers

- `src/db` must stay testable in Jest without native code.
- A failed exclusion must never block the app opening.
- Files are recreated (WAL/SHM, after a dev reset), so the call repeats.

## Considered options

- Third-party package: none available for SDK 58.
- Native call inside `src/db`: rejected, not Jest-testable and couples `db` to a module.
- Interface in `db` implemented by a local Expo module and injected (chosen, mirrors the `KeyStore` seam).

## Decision outcome

- `mobile/src/db/backup.ts`: `BackupExclusion { exclude(uris) }`, `fakeBackupExclusion()`, and `notApplicableBackupExclusion` as the `nativeBootstrapDeps()` default.
- `runBootstrap` calls it after open (and after reset) with expo-sqlite's `SQLite/` directory, then `matiq.db`, `-wal`, `-shm` that exist, and writes `app_meta.backup_exclusion` (`excluded` | `failed` | `not_applicable`) and `backup_exclusion_checked_at`. A `failed` result logs a warning; bootstrap still returns `ok`.
- `mobile/modules/matiq-backup/` (Swift, `URLResourceValues.isExcludedFromBackup`; Android resolves `not_applicable`; autolinked, no `app.json` change) exports `backupExclusionAdapter`.
- `mobile/app/_layout.tsx` calls `setBootstrapOverrides({ backupExclusion: backupExclusionAdapter })` at module scope. `src/db` imports nothing from `modules/**`.
- About shows the status; the `settings-about` Maestro flow asserts it.
- Measured on the iOS simulator: directory and all three files carry `com.apple.metadata:com_apple_backup_excludeItem` (`docs/stack-notes.md`).

## Consequences

- The module changes the native build: a new local module needs `pod install` once (stack-notes).
- Whether a directory flag alone covers a recreated `-wal` is unmeasured; files are also flagged on every launch.
- Not verified on a physical device or TestFlight build; simulator evidence only. The ADR 0020 deviation from `privacy.md` is closed for iOS at simulator level.
- Related: ADR 0006, ADR 0019, ADR 0020.
