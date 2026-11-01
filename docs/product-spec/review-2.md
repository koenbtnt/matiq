# product-spec — review 2 (round 1)

Reviewer: reviewer-code-ps · 2026-10-31 · HEAD 6e5dbed · diff `origin/develop...HEAD` (47 files, docs + PO harness commit bec9bf3). Docs-only sprint: no code, no builds, no tests run.

## Checklist results

| # | Area | Result |
|---|---|---|
| 1 | Requirements | Pass. Core loop plan -> train -> log -> review -> progress in PRODUCT, arc42 06 and US-01..US-06; plan edge cases not re-audited (review 1 scope). |
| 2 | Data layer | N/A (no schema change). `git diff --stat origin/develop...HEAD -- mobile e2e scripts design-system docs/data-model` is empty. |
| 3 | Expo / RN | N/A. |
| 4 | Privacy | Pass. No code, no network, fixtures fictional. ADR 0006/0015 keep plaintext export and OS-backup exclusion as pending assumptions. |
| 5 | Tests | N/A (docs-only; Gherkin in `docs/requirements/product-spec.md` covers the core loop, US-01..US-06, plus library, data, rank, resources). |
| 6 | Runtime | N/A; only the two doc generators ran (see provenance). |
| 7 | Documentation | Pass with M/m findings below. 15 ADRs 0003-0017 + README index complete (matches arc42 09); arc42 01-12 present, 04/06/11 honestly marked partial; `docs/data-model/*` byte-identical to develop. |

Audit points: (1) quotes in decisions.md, PRODUCT.md, ADRs spot-checked against po-brief §1/§3 and §2 verbatim answers (S-01..S-12, R-00..R-35, ~40 quotes): ids and dates right, wording verbatim (ellipses only). (2) ADRs cite dated rulings; ADR 0014 is Proposed/provisional per R-30; ADR 0006 keychain class matches decisions.md:69 and PRODUCT §9 (this-device-only, with A-11 pending). (3) R-26 criteria (reviewer-code.md:80-83) are all in 10-quality "Usability" rows (30 s, 2 taps, one-handed, undo, only type + focus, empty states, light/dark).

## Verification provenance

| Row | Source | Status |
|---|---|---|
| `gen-data-model.mjs` exit 0 | verify.md @ 7812738 (orchestrator transcript of documenter) | accepted: no `mobile/drizzle`, `scripts/docs` change between 7812738 and HEAD (diff stat empty), so valid at HEAD |
| `gen-changelog.mjs` exit 0 | same | accepted, same reason |
| tsc, Jest, token check, adherence, migrations-in-sync, expo-doctor | not run | N/A, no code in the diff; not re-run |
| Maestro / test-report.md | absent | N/A, docs-only |
| `git diff` on code/generated paths | re-run by reviewer | empty |

## Findings

| id | sev | file:line | defect | owner | fixed looks like |
|---|---|---|---|---|---|
| F-01 | M | `docs/adr/0006-sqlcipher-encryption-at-rest.md:7`; `docs/product-spec/docs-report.md` ("Blocked" last sentence) | ADR source line says the keychain wording "is being corrected by the planner in parallel"; docs-report says the fix "was not present at this sha". Both stale/inaccurate: the fix is in 7812738 (decisions.md:69, PRODUCT §9, plan D-22) and ADR 0006 already matches it. Process chatter in a permanent ADR. | documenter | Delete the sentence in the ADR; correct the docs-report line (fix present at 7812738, ADR consistent). |
| F-02 | M | `docs/adr/0004-...md:5,7`; `docs/adr/0017-...md:5,28` | ADRs decide un-ruled points (no `user_id` column; review columns on `sessions`, "a planner decision on brief prose, not a ruling quote") yet are `accepted` with `Deciders: PO (user)` and are not in the assumptions ledger. `.claude/rules/docs.md`: an ADR that infers a ruling is B; downgraded to M only because both disclose it in-text. Same pattern, lesser: ADR 0010 numeric defaults, ADR 0011 seed-id deviation. | documenter (ADR), planner (ledger) | Either ledger them as A-12/A-13 ("assumed, pending PO (2026-10-31)") and mark the ADRs `proposed` with Deciders "planner, pending PO", or restate Deciders honestly; keep the rest. |
| F-03 | m | `docs/decisions.md:25,42` | Header says quotes are the PO's words, but :25 puts the recommended-question text "(rounds, optional submissions landed/taken, optionally tied to a technique)" in quotes; :42 calls erase-all "thereby the single ruled exception" to the no-hard-delete rule, which R-12 does not say (plan §11 carries it; ADR 0015 words it correctly). | planner | Drop the quote marks at :25 (accepted text, not PO words); at :42 say "recorded in plan §11 as the single exception". Needs a ruling-style edit of decisions.md, so planner-owned. |
| F-04 | m | `docs/product-spec/verify.md:3-12`, `verify.json` | Rows are at 7812738, HEAD is 6e5dbed; block attributed to documenter but transcribed by the orchestrator (disclosed). Format otherwise per `.claude/rules/docs.md`; json mirrors md. | orchestrator | Optional: append a one-line note that nothing generator-relevant changed after 7812738. |
| F-05 | m | `docs/architecture/10-quality-requirements.md` Reliability row | "CI `drizzle-kit generate && git diff --exit-code`" labelled enforced; ci.yml:92 runs `drizzle-kit generate` but the exact diff check was not verified here. | documenter | Confirm the CI step (ci.yml:92 ff.) matches the wording or reword. |

Counts: B 0 · M 2 · m 3.

REVIEW PASSED
No blocking defects: rulings quoted correctly, no code or generated file changed, ADR index and arc42 consistent.
F-01 and F-02 are should-fix before the PR merges; ledger/ADR wording only, no structural rework.
