# product-spec — review 1 recheck (round 2) · reviewer-design-ps · 2026-10-31 · HEAD 6c28c51

Scope: F-01…F-15 and whatever their fixes touched (`7517919`, `bec9bf3`, `6c28c51`). §0 length: plan 69 lines, design 35 lines; both pass. Cited lines checked: `data.md:23-25`, `reviewer-design.md:90-94`, `reviewer-code.md:80-83`, `tokens.json:3-4`, `tokens.ts:2,8`, `components.md:424`.

| finding | status | evidence |
|---|---|---|
| F-01 | resolved | plan §4 conventions and tables: `origin`/`source` enums, counts ≥ 0, durations > 0, `round_no` ≥ 1, `GLOB` checks on `start_time` and the date columns. PRODUCT §5 mirrors them. |
| F-02 | resolved | `submissions` (`session_id` NOT NULL, `round_id` and `technique_id` nullable) in §4, §5 `submissions.upsert`, §6 and the PRODUCT ER; decisions R-06 quotes the clause. |
| F-03 | resolved | §0.1 #7 / A-7; NF-01 marked "assumed, pending PO". The default matches `reviewer-code.md:80`. |
| F-04 | resolved | §0.1 #8, #9 / A-8, A-9; PRODUCT §6, §8, §9 and decisions R-05, R-12, R-14 point to the assumptions. |
| F-05 | resolved | §0.1 #10, #11 / A-10, A-11; §6 "Export leaves the sandbox" and "OS backups"; §12 adds a sprint-1 check on the secure-store constant. |
| F-06 | resolved | §11 deviation row; `data.eraseAll` deletes the DB, WAL and SHM files and the key, then creates a new key and reseeds; DELETE-and-rekey is rejected. |
| F-07 | resolved | `data.md:24` (bec9bf3) now has kind ∈ POSITION \| SUBJECT, "data-extensible". The v1 check matches; TECHNIQUE comes in v1.x by widening the check (§7). |
| F-08 | resolved | The R-26 criteria are present at `reviewer-design.md:90-94` and `reviewer-code.md:80-83`. |
| F-09 | resolved | D-11 is marked a planner decision. The monetisation quote is now under R-16 in decisions.md and PRODUCT §3. |
| F-10 | resolved | PRODUCT §6 and §10 mark the unruled items "planner default/target, not ruled". The theme override is now cited to DSR-21 / CO-16. |
| F-11 | resolved | §8 defines `n`/`nr`, trend from 2 rated rows, gap over all statuses, `daysSince` over all time, the rescaling rule and the Flagged scope. PRODUCT §7 agrees. |
| F-12 | resolved | §6 "Which edits set `user_edited_at`" and PRODUCT §8. |
| F-13 | resolved | §6 merge lists the moved references per kind; PRODUCT §8 agrees. |
| F-14 | resolved | D-34 and decisions S-05 are scoped to `components.md § Open requests` plus CO-15/CO-16; DSR-12 and DSR-15 are named. |
| F-15 | resolved | design.md:5 restated (intake on the branch, deliverables corrected); it has a "Changes since review 1" table. |

**Assumptions vs rulings.** All of A-1…A-11 are marked "assumed, pending PO" wherever PRODUCT.md uses them. decisions.md has no bullet for an assumption, only pointers. One exception, below.

**New, introduced by the fixes**

| id | sev | file:line | defect | owner | fixed looks like |
|---|---|---|---|---|---|
| R-01 | m | decisions.md:69; PRODUCT.md §9 "Encryption at rest" | Both state the key's this-device-only keychain class as settled. That choice is coupled to A-11: per assumptions.md:17, allowing OS backups needs a non-device-only class. So the class is assumption-dependent, yet unmarked in the binding record. | planner | Mark it "(with A-11, assumed, pending PO)", or move it out of decisions.md into plan D-22 only. |

**Notes (no action):** N-01: the PRODUCT §10 intro lists NF-09 as rule-derived, but NF-09 says "planner target, not ruled". N-02: the R-26 citation in decisions.md:64 and plan D-24 ends at line 93; the bullet runs to 94. N-03: the PO's offline authorisation reached this review through the orchestrator, not as a quoted PO sentence. No ruling is inferred from it, since every default stays "pending PO". Record the quote when the PO confirms.

REVIEW PASSED. F-01…F-15 are resolved; no B or M remains.
R-01 (minor) can be fixed at close-out together with the PO's answers to the assumptions ledger.
