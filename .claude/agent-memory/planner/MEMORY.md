# planner memory

Seeded 2026-10-31 by the main session from cadence's planner memory where the lesson is stack-generic (tagged
"cadence, unverified here"). One line per lesson, dated, with the file it concerns. Delete a line once a rule or a
fix supersedes it.

- 2026-11-01 · Owner scopes are the `path-guard.sh` allow/deny regexes in each `.claude/agents/<agent>.md` hook block (no `paths:` frontmatter): `grep -n path-guard .claude/agents/*.md` before the work-split table in `plan.md §0`.
- (cadence 2026-10-28, unverified here) Trace the full path a feature takes (schema → repository → hook → screen → Maestro flow) before planning a schema change; a field nobody reads is a field nobody tests.
- (cadence 2026-10-29, unverified here) Cite `docs/stack-notes.md` rows instead of re-verifying a library fact; append a row only when a fact is new.
- 2026-10-31 · The legacy prototype (`/Users/koen/Projects/matiq/matiq-legacy/db/02_tables.sql`) is the domain reference: positions (self-FK), techniques as edges (`to` null iff SUBMISSION), tags POSITION|SUBJECT, `session_focus` planned/actual/needs_work, reviews 1–5. Its Oracle/ORDS code is not reused.
- 2026-10-31 · `docs/product-spec/plan.md`: for docs sprints, verify with a grep loop that every S-/R-id lands in all three files and that §0 stays ≤ 80 lines (`awk` to the first `---`) before committing; process rulings (S-10, S-11, R-32) need a PRODUCT.md section too (§3 "Way of working"), not only decisions.md.
- 2026-11-01 · `docs/foundation/plan.md`: when the orchestrator's scope line contradicts a binding source (R-32 order of work), the binding source wins and the difference is ledgered as an A- row plus a §15 conflicts list — never silently either way.
- 2026-11-01 · External facts for libraries not yet installed (expo-secure-store, @expo-google-fonts) cannot be verified from `mobile/node_modules`; mark unverified, name the `.d.ts` the coder confirms from, and route the append to `docs/stack-notes.md` to the coder (planner commits stage only `plan.md`).
