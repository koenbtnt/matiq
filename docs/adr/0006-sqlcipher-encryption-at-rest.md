# 0006. SQLCipher encryption at rest with a keychain-held key

- **Status:** accepted
- **Date:** 2026-10-31
- **Deciders:** PO (user) for R-24 / R-12; the key accessibility class and OS-backup exclusion are assumptions A-10, A-11, pending PO (2026-10-31)
- **Decision ids:** D-22 / R-24, R-12, R-31; assumptions A-10, A-11
- **Source:** `docs/decisions.md` Data R-24, R-12; plan §0 D-22, §0.1 #10, #11; `docs/product-spec/assumptions.md` A-10, A-11.

## Ruling (quoted)

> PO, 2026-10-31 · R-24: "yes do it right fromt he beginning"
>
> PO, 2026-10-31 · R-12: "make sure the whole app is safe and all personal data is securely encrypted."

## Context and problem

R-12 requires secure encryption of all personal data; R-24 requires it from the foundation sprint. The database needs a key that the user never handles.

## Decision drivers

- Encryption from the first migration (no later re-encrypt).
- Key must not leave the device or appear in logs, exports, fixtures or tests.
- Jest must still run fast on plain SQLite.

## Considered options

- SQLCipher via `expo-sqlite` `useSQLCipher`, key from `expo-crypto` kept in Keychain/Keystore through `expo-secure-store` (chosen).
- Encrypt individual fields: rejected, leaves metadata and indexes in clear.
- No encryption, rely on OS file protection: rejected by R-12/R-24.

## Decision outcome

`PRAGMA key` runs before any other statement; key generated on first launch; dev-client builds only (ADR 0005); Jest on `better-sqlite3` with encryption verified on the dev-client, never mocked green.

## Consequences

- Pending PO, not ruled (A-11): the secure-store accessibility class (plan fact: this-device-only, to confirm in sprint 1) and exclusion of `matiq.db`, WAL/SHM and the key from OS backups are assumptions. Allowing OS backups would need a restorable key and a new ADR on cloud exposure of encrypted data.
- Pending PO, not ruled (A-10): export-file protection (plaintext JSON with a warning in v1, optional passphrase v1.x); see ADR 0015.
- App lock (R-25) is v1.x and separate.
