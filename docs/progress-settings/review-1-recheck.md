# progress-settings — review 1 recheck (Themis, 2026-11-01; plan @ 58adb4d, design @ 2fe0ce5)

Scope: only the review-1 findings and what their fixes touched. Each "Changes since review 1" row was checked against the file.

## Checklist

- Plan fixes (B1, B2, S1–S6, N5–N9, plus the S8 plan side): **pass**. Every claimed change is in the file.
- Design fixes (S1, S7, S8, N1–N4) and `docs/design-system-contrast.md` :67 / :95: **pass**.
- Citations re-read: `NativeAppearance.d.ts:15` (`'light' | 'dark' | 'auto' | 'unspecified'`) and `Appearance.d.ts:33-35` ("Pass `'auto'` to reset") hold. The contrast rows (1.16 / 1.11, 1.38 / 1.31) match the doc.
- PO decisions needed: **none**. S3 (PS-24) follows from PRODUCT §8 (a technique is a typed edge) and the seed the PO accepted (R-48). It narrows nothing the user can do today, and plan §13 states the reasoning. It is a planner decision, not presented as a ruling.

## Findings

| id | sev | where | status / defect | owner | fixed looks like |
|---|---|---|---|---|---|
| B1 | B | plan §7.3, §7.4, §11.1 | **closed**: the loser focus row's `session_techniques` are re-pointed, collisions fold on `session_techniques_focus_live_uq`, the payload records `moved`/`folded`, and a round-trip test is named | planner | — |
| B2 | B | plan §6.5 T9, §6.7 G6 | **closed**: the first row is 10-12, planned ∧ actual (daysSince 20 ≤ 21); 0.267 STEADY and 0.571 NEEDS_WORK recomputed; G6 is 5 / 1 / 4 / 0.8 | planner | — |
| S1 | S | plan PS-09, §12; design §4.1.4 | **closed**: SYSTEM → `'auto'` in both artefacts | planner, designer | — |
| S2 | S | plan §5.2, §6.3 | **closed**: `{ today, nowIso }` on `computeProgression` and `progression.overview` | planner | — |
| S3 | S | plan PS-24, §5.5, §7.1, §12 | **closed**: positions and subjects are unique by live name; techniques reject only an exact live duplicate edge; the check runs only when the compared fields change. No PO ruling needed (see checklist) | planner | — |
| S4 | S | plan §11.3 settings-weights | **closed**: the flip uses `wNeedsWork` → 0 (Σw = 0 → score 0) | planner | — |
| S5 | S | plan §11.3 | **closed**: P-27 slug, P-30 plural and the P-16/P-17 merge path are used | planner | — |
| S6 | S | plan §3 steps 4/6, §9.1/§9.2, §5.7 | **closed**: `src/db` no longer imports `mobile/modules/**`; the default is `not_applicable`; `setBootstrapOverrides` reaches both bootstrap and reset (`lifecycle.ts:24` path) | planner | — |
| S7 | S | design §4.4.2, §8 cm:111-118 row, §9 | **closed**: the shipped Stepper is unchanged, typed entry is a sibling 48-pt TextField (separate stop), and the `editable` extension is withdrawn | designer | — |
| S8 | S | design §4.2.3, §8 R-A3 row; plan PS-21, §11.2 | **closed as a recorded deviation, accepted**: one `role="image"` per week row (8–9 stops) is labelled with the per-day facts, after the header summary, and the reason is in §8. R-A3's intent (an image role with a text summary) holds per row | designer | — |
| N1 | N | design §4.2.3, §8 cm:310 row | **closed**: flame glyph added; 13/600 → `statMeta` recorded | designer | — |
| N2 | N | design §9.1; contrast doc :67, :95 | **closed** | designer | — |
| N3 | N | design §4.2.3 | **closed**: `cell.notLogged` past days only, `cell.planned` today | designer | — |
| N4 | N | design §4.4.1 | **closed**: the inner Switch is hidden from accessibility | designer | — |
| N5 | N | plan §11.3 progress-panels | **closed**: it asserts the clock-independent `+1 unplanned` row | planner | — |
| N6 | N | plan §6.4 | **closed** | planner | — |
| N7 | N | plan §6.6 | **closed**: `diffDays` is marked new and has tests | planner | — |
| N8 | N | plan §3 step 6, §9.1/§9.2 | **closed**: podspec listed; the directory and the files are excluded each launch | planner | — |
| N9 | N | plan §5.1, §5.5 | **closed**: `fromRemoved`/`toRemoved` and `aliasRows` are in §5 | planner | — |
| N10 | N | plan §11.3 progress-panels (touched by S5) | new: the flow asserts "1 session on 1 day", but the rendered summary is "1 session on 1 day in the last 8 weeks" (design P-30). An exact text match would fail | planner | the flow uses the full design string or a `.*` regex |
| N11 | N | plan §3 step 6 (touched by S6) | new: "independent of step 4's commit order" is overstated, because `_layout.tsx` imports `setBootstrapOverrides` / `BackupExclusion` from `src/repositories`, which arrive in step 4. This is the normal phase-B dependency | planner | the `_layout.tsx` wiring is moved to phase B, or step 1 exports the type and the signature |

REVIEW PASSED

- B1, B2, S1–S8 and N1–N9 are closed in the files. S8 is accepted as a §8 deviation and S3 needs no PO ruling.
- N10 and N11 are notes for the planner and tester. No action gates the build.
