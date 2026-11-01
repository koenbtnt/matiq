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
