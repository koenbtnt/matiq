# 06. Runtime view

Core loop from `docs/PRODUCT.md` §4 and §7. Built: startup, the Log Session save (sprint 1), and from sprint 2 the progression read, taxonomy merge/undo and the backup-exclusion step of bootstrap. Slot generation (sprint 3) is not built.

```mermaid
flowchart LR
  P[Plan: by hand, slot or suggestion] --> T[Train]
  T --> L[Log: actual focuses, ratings, flags]
  L --> R[Review: same screen, needs-work flags]
  R --> G[Progress: state per focus with why]
  G -->|suggestions: last flags, cycle, Needs work, Not trained lately| P
```

| Flow | Summary | Source |
|---|---|---|
| Log session | Prefilled type and planned focuses -> rating per focus -> save; completes only with >= 1 actual focus | R-26, plan §5 |
| Progression | Computed on read when Progress or Home opens (live hooks re-read on table change); no background jobs, no cache; reads `algorithm_params` | ADR 0010, 0024 |
| Slot generation | Slots create PLANNED sessions 14 days ahead; tombstones prevent resurrection of skipped instances | ADR 0017 |
| Taxonomy release | Upsert only unedited `origin = seed` rows | ADR 0011 |
| Erase-all | Close DB, delete DB + WAL + SHM and key, new key, reseed | ADR 0015 |

## Startup (built, ADR 0019, 0020, 0022)

```mermaid
sequenceDiagram
  participant L as _layout.tsx
  participant B as bootstrapDatabase
  participant K as KeyStore (secure store)
  participant D as SQLCipher DB
  participant X as BackupExclusion (iOS module)
  L->>L: hold splash (fonts + bootstrap)
  L->>B: bootstrap
  B->>K: get key
  alt no key and no db file
    B->>K: set new 32-byte key
  else no key but db file exists
    B-->>L: DB_KEY_MISSING_FOR_EXISTING_DB
  end
  B->>D: PRAGMA key, foreign_keys, journal_mode, read sqlite_master
  B->>D: migrate (drizzle)
  B->>D: seed.ensureSeeded (idempotent)
  B->>X: exclude SQLite dir, matiq.db, -wal, -shm from backup
  B->>D: write app_meta.backup_exclusion
  B-->>L: ok, setDb
  L->>L: hide splash, render tabs
```

A backup-exclusion failure is logged and recorded as `failed`; it never fails bootstrap (ADR 0026). The adapter is injected by `_layout.tsx` through `setBootstrapOverrides` before the first bootstrap. Any other step failing returns a `DB_*` code and the root layout renders the bootstrap error screen; retry re-runs the sequence. Encryption on a device is not yet verified (see 11).

## Log Session save (built)

| Step | Behaviour | Source |
|---|---|---|
| Open | Home quick log or the Log tab resolves `quickLogTarget`: today's planned session if any, else a new log with the type prefilled | ADR 0017, `data-contracts.md` |
| Modes | `log` completes or creates a COMPLETED session; `plan` creates a PLANNED one; `edit` revises, review mode on a COMPLETED session | F-19 |
| Save | `sessions.log` in one transaction: type and at least one actual focus are enough; planned focuses left unticked stay as planned-not-trained rows; techniques, counts and rating only on actual rows | ADR 0018 |
| After | Live hooks re-read on table change; Home shows the session; undo toast reverses a save or delete | R-26 |

Pending: slot generation (sprint 3).

## Progress read and merge with undo (built, sprint 2)

```mermaid
sequenceDiagram
  participant U as Progress / Home
  participant H as live hook
  participant R as progression.overview
  participant P as domain progression v1 + panels
  U->>H: subscribe (sessions, session_focuses, algorithm_params, settings)
  H->>R: read live rows
  R->>P: histories, params, today
  P-->>R: states + explanations, heatmap, gap panel
  R-->>U: ProgressOverview
```

| Flow | Summary | Source |
|---|---|---|
| Merge | One transaction: move references per kind, fold rows that would break live-unique indexes, re-point `session_techniques` of folded focus rows, turn loser name/aliases into survivor aliases, soft-delete loser, write the versioned `taxonomy_merges.payload` | ADR 0025 |
| Undo merge | Toast Undo reverses from the payload while it is the latest live merge touching either id; otherwise `MERGE_NOT_LATEST` | ADR 0025 |
| Theme override | `ThemeOverride` reads `theme.override` and calls `Appearance.setColorScheme`; SYSTEM resets it | ADR 0028 |
