# 08. Crosscutting concepts

| Concept | Rule | Where |
|---|---|---|
| Sync seam | `id` UUID v4, `created_at`, `updated_at`, `deleted_at` on every table | ADR 0004 |
| Soft delete and undo | Deletes hide rows; undo toast instead of confirm dialogs; erase-all is the one exception | R-26, ADR 0015 |
| Constraints in schema | A `check()` for every enum and range | `.claude/rules/data.md` |
| Errors | Business-rule failures throw `DomainError` with a code from the registry `mobile/src/domain/errors.ts` (linked, not copied); UI maps codes to i18n keys | `data.md` |
| i18n | English only, every string a key | ADR 0009 |
| Time | Minutes, UTC timestamps plus `local_date`, weeks start Monday | ADR 0016 |
| Privacy | On device, SQLCipher, no analytics, fictional fixtures only | ADR 0006, `privacy.md` |
| Taxonomy as data | Editable rows, never enums; user layer wins on re-import | ADR 0011 |
| Domain purity | No `Date.now()`, `Math.random()`, I/O in `mobile/src/domain/`; clock and id source are parameters | `data.md` |
| Frontend | Tokens only, one-handed, 44 pt / 48 dp, testID `<screen>.<element>[.<id>]` | `frontend.md`, ADR 0008 |
| Settings vs metadata | `settings` for user prefs, `app_meta` for machine state | ADR 0016 |
| Encryption at rest | SQLCipher; raw 32-byte key from `expo-crypto` in secure store (device-only class), `PRAGMA key` first; Android backup off; iOS backup exclusion via `BackupExclusion` seam and local module, status in `app_meta.backup_exclusion` (simulator-verified) | ADR 0006, 0020, 0026 |
| Error codes | `DomainError.code` from `mobile/src/domain/errors.ts` (registry linked, not copied); startup failures use `DB_*` codes; UI copy key `errors.<CODE>` | ADR 0019 |
| Repository access | `database: Db` injected last; reads filter `deleted_at IS NULL`; writes in `db.transaction()`; hooks return `LiveResult<T>` | ADR 0019 |
| Seed idempotency | `ensureSeeded` keyed by `(source, source_id)` and `app_meta.taxonomy_release`; ids from the append-only registry | ADR 0022 |
| testIDs | `<screen>.<element>[.<id>]`, listed in `docs/foundation/design.md` §7 and used by the Maestro flows | `frontend.md` |
| i18n keys | `<screen>.<element>` copy keys, one English table; error copy under `errors.<CODE>` | ADR 0009 |
| Hard delete | Only erase-all (ADR 0015) and the `__DEV__` reset route (ADR 0023) | `data.md` deviation, `plan.md` §13 |
| Backup exclusion | `exclude` runs after every open and reset; a failure is logged and recorded, never blocks bootstrap; `src/db` never imports `mobile/modules/**` | ADR 0026 |
| Merge and undo | Merge is one transaction with a versioned payload; undo only while latest | ADR 0025 |
| Name uniqueness | Positions and subjects by name; techniques only as exact edge duplicates | ADR 0027 |
| Theme | One override point, `Appearance.setColorScheme` in the root layout | ADR 0028 |
| Computed, not stored | Progress states and panels are computed on read; nothing is cached | ADR 0024 |
