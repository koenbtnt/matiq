# 0020. SQLCipher key seam, raw 32-byte key and backup exclusion

- **Status:** proposed — pending PO (A-16, A-17)
- **Date:** 2026-11-01
- **Deciders:** planner (agent) under the PO's overnight-autonomy instruction of 2026-10-31; review 1 passed 2026-11-01. PO confirmation pending for A-16 and A-17; refines ADR 0006 (accepted), does not supersede it.
- **Decision ids:** F-05, F-06, F-07 / R-24, R-12; A-11, A-16, A-17
- **Source:** `docs/foundation/plan.md` §0 F-05..F-07, §0.1 A-16, A-17, §2, §5, §13, §14; `docs/foundation/review-1.md` ruling 3, R1-12.

## Ruling (quoted)

The ruling behind this ADR is in ADR 0006 (PO, 2026-10-31, R-24: "yes do it right fromt he beginning"). The mechanics below are planner rulings of 2026-11-01 under the PO's overnight-autonomy instruction.

## Context and problem

ADR 0006 chose SQLCipher with a keychain-held key. Sprint 1 must make that testable without a device and decide key format, accessibility class and backup handling. The secure-store constant names could not be verified locally (A-17), and expo-file-system 58 exposes no iOS backup-exclusion API (A-16).

## Decision drivers

- The statement order (`PRAGMA key` first) is security-critical and must be asserted by a test.
- The key never appears in logs, exports, fixtures or tests.
- `privacy.md` requires backup exclusion of the database file.

## Considered options

- `KeyStore` interface (`get/set/delete`) with a secure-store adapter and an in-memory fake; a driver seam with a recording fake (chosen, F-05).
- Passphrase-derived key: rejected, the user never handles a key (ADR 0006).
- Raw key: 32 bytes from `expo-crypto.getRandomBytesAsync` as 64 hex characters in SQLCipher raw form `PRAGMA key = "x'<hex>'"`, regex-validated before interpolation; item `matiq.db.key`, accessibility `WHEN_UNLOCKED_THIS_DEVICE_ONLY` (chosen, F-06).
- iOS exclusion now: not possible with current packages; deferred (F-07).

## Decision outcome

- `mobile/src/db/open.ts` `openEncryptedDatabase({ driver, keyStore })` runs `PRAGMA key`, then `foreign_keys = ON`, then `journal_mode = WAL`, then a `sqlite_master` read that proves the key. Adapters: `mobile/src/db/key/secureStore.ts`, `key/memory.ts`; generation in `key/generate.ts`.
- An existing database file with no stored key yields `DB_KEY_MISSING_FOR_EXISTING_DB`; the app never creates a second empty database beside it.
- Android: `android.allowBackup: false` in `app.json`. iOS: exclusion deferred. A backed-up file is unreadable on a restore to another device; a same-device restore brings the device-only key back, so the exclusion is required before any store release. The deliverable is a local Expo module setting `NSURLIsExcludedFromBackupKey` on `matiq.db`, `matiq.db-wal` and `matiq.db-shm`. This is a recorded deviation from `privacy.md` (`plan.md` §13).

## Consequences

- Jest asserts statement order and key format with fakes; actual encryption on a device is unverified this sprint (dev-client build blocked: CocoaPods not installed). Not mocked green. See `docs/architecture/11-risks-debt.md`.
- Secure-store constant names are confirmed from `node_modules` and appended to `docs/stack-notes.md` (CO-25).
- Related: ADR 0006, ADR 0015, ADR 0019, ADR 0023.
