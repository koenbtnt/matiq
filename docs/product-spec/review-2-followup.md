# product-spec — review 2 follow-up pass

Reviewer: reviewer-code-ps · 2026-10-31 · HEAD 02da5c4 · scope `git diff f130815..02da5c4` (9e791a5 planner, 02da5c4 documenter; progress.md excluded). Not a new round. Docs-only; nothing run.

| Check | Result |
|---|---|
| F-01 stale remarks (ADR 0006:7, docs-report) | Resolved: both removed; ADR 0006 Source line clean, Deciders now splits R-24/R-12 from A-10/A-11 pending. |
| F-02 ADRs inferring rulings | Resolved: Deciders in ADRs 0004, 0006, 0010, 0011, 0015, 0017 name the rulings and the A-id. A-12 (ADR 0017/D-11), A-13 (ADR 0010/D-16, §8), A-14 (ADR 0011/D-08, §11) ledgered in assumptions.md, plan §0.1 #12-#14, PRODUCT.md, decisions.md R-08/R-28, arc42 11 ("All fourteen"), docs-report A-1..A-14. ADR 0004 now rests on `privacy.md:8` and `:11`: both cited lines verified (no backend/account/sync; no account identifiers until an auth ADR). |
| F-03 decisions.md:25, :42 | Resolved: :25 marks the question text "recommended text, accepted" and quotes only the PO's answer; :42 no longer says "ruled exception", points to plan §11. |
| F-04 verify.md at 7812738 | Unchanged by design (m, orchestrator); stays valid, no generator-relevant change since. |
| F-05 CI wording | Resolved: ci.yml step "Migrations are in sync with the schema" exists at line 89 with `working-directory: mobile`, `npx drizzle-kit generate`, `git diff --exit-code -- drizzle/`; arc42 10 matches. |
| No A-1..A-14 stated as ruled | Pass: every ADR/PRODUCT/decisions mention carries "assumed, pending PO" or sits under a Consequences "Assumed" bullet. ADR 0010 separates ruled defaults (R-08 window, R-21, R-07, R-20) from A-13. `data.md:23` citation for A-14 verified. |

New findings: none. Counts: B 0 · M 0 · m 1 (F-04, carried, no action needed).

REVIEW PASSED
F-01, F-02, F-03 and F-05 are fixed and the cited lines hold; no assumption is worded as a ruling.
Only F-04 (verify.md sha note) remains as a minor.
