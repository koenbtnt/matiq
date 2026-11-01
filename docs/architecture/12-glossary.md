# 12. Glossary

Source of truth: `docs/PRODUCT.md` §2 (terms are not restated differently here). Short form:

| Term | Meaning |
|---|---|
| Focus | The unit planned, logged and scored: a position node or a subject, stored `{kind, ref_id}` (R-04, R-30 provisional) |
| Position | Node of the technique graph; canonical name plus aliases; optional parent (variant) |
| Technique | Typed edge between positions (transition, guard pass, sweep, escape, takedown); submissions are terminal |
| Alias | Alternative searchable name (R-34); on techniques assumed, pending PO (A-3) |
| Subject | Cross-cutting theme usable as a focus; seeded, editable |
| Session | One training occasion with type, status (planned, completed, skipped) and signals |
| Planned vs actual | `is_planned` / `is_actual` per focus row; the gap feeds progression |
| Needs work (flag) | The user's mark on an actual focus row; shown as Flagged; never a computed state |
| Needs work (state) | One of four computed states |
| Progression states | Improving, Steady, Needs work, Not trained lately |
| Hit / caught | Optional per-focus counts: worked for you / got caught |
| Round | One sparring round, optionally logged in detail |
| Cycle | 1-3-focus block, default four weeks |
| Slot | Recurring weekly training moment generating planned sessions |
| Suggestion | Focus proposed when planning from one of four switchable sources |
| Resource | Reference (instructional, video, article...) with status, attachable to a technique, focus or cycle |
| Rank | Belt + stripes with promotion dates |
| Core / extended library | Curated default subset vs full converted graph |
| Taxonomy release | Versioned seed shipped with the app |
| Sync seam | `id`, `created_at`, `updated_at`, `deleted_at` on every table |
| Origin | `seed` or `user`; only unedited `seed` rows are re-import targets |
| Tombstone | A soft-deleted row (`deleted_at` set) |
| ADR | Architecture decision record in `docs/adr/` |
| DSR / CO | Design request / carry-over item numbers |
