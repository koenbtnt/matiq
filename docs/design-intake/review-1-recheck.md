# design-intake — review 1 recheck (Themis) · 2026-10-31 · rework 5aefb06, tokens.ts bcc7733, verify ee4c58e

Scope: only the round-1 findings and what they touched. I verified every row of the "Changes since review 1" table at the top of `components.md` against the files.

| id | status | evidence |
|---|---|---|
| S1 | fixed | New rule R-A4 (`RULES.md` § 8): every input has a visible `caption` label, and the placeholder never carries required information, until DSR-1 is answered. It cites C/Components:55, which is the labelled field. R-A2 no longer points the placeholder at R-C5. `components.md` § Text input › Contrast matches the new rule. |
| S2 | fixed | DSR-26 to DSR-29 exist in § Privacy and scope conflicts and in § Open requests: gym, coach, video, reminders. The avatar row is marked "not parked". New R-S5 says these elements are not built before a PO ruling and names `button-compact-height`, `video-hero-height`, `play-button` and the COACH badge. The grilling direction is labelled "a direction, not a decision", so it is not recorded as a ruling. |
| S3 | fixed | R-M1 now makes "≥ 44 × 44 pt on both platforms" the binding floor (cites `frontend.md`) and keeps 48 dp as "pending DSR-16 / PO ruling (grilling Q18)… a target, not a gate". § 9, § Icon button and DSR-16 match. |
| S4 | fixed | `tab-log-action` is gone from `tokens.json` `size`, from `_citations` and from `tokens.ts` (the bcc7733 diff is that one line). Parity by script: 71/71 sizes, 38/38 colours light + dark, 19/19 semantic pairs, 25/25 styles, 0 uncited, 0 orphan citations. R-S3 now explains why (it cites M:164, Home:27, C:45). § Navigation calls the 52 a non-token value (DSR-15). |
| S5 | fixed | R-T6 is narrowed to "no `accent-*` inside a belt component". It now cites `docs/design-system-contrast.md:96` (the 1.78 pair) and `:111` (that pair's handling); both lines say that. AccentOptions:73 is kept only as the source for "distinct by brightness", which matches what that line says. |
| N3 | fixed | R-A2 now reads "several belt fills below 3:1 against surfaces". |
| N1, N2, N4 | open | Notes, no action required. |

Verify: frontend-coder @ bcc7733 has tsc, jest 13/13, `--check`, adherence and expo-doctor 20/20, all exit 0. The ios smoke is n/a because no UI changed.

New notes (sections the rework touched; round 2, so notes only):
- N5: Five other `components.md` lines still say "≥ 44/48": :52, :109, :155, :271, :319. :52 states "≥ 48 dp on Android" as a fact. R-M1 now governs, but these lines should read "44 pt floor, 48 dp pending DSR-16" at the next intake.
- N6: "Q18" is not in the repo. It refers to the running grilling and resolves when that grilling's record lands.

REVIEW PASSED
All five should-fix items and N3 are fixed in the files. Token removal and `tokens.ts` parity are confirmed, and verify is green at bcc7733.
No blocking defects. N5 and N6 are recorded for the next intake.
