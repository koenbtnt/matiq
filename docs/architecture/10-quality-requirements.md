# 10. Quality requirements (ISO 25010)

Status: `specified` = in `docs/PRODUCT.md` §10 / rules, no code yet; `enforced` = a hook, script or CI check exists today. Sprint 0 ships no feature code, so no test-backed row is `verified`.

| Characteristic | What this project requires | Enforced where | Status |
|---|---|---|---|
| Functional suitability | Core loop complete; only session type + one focus required (NF-03); every state explains why (R-08) | domain tests (sprint 1-2) | specified |
| Performance efficiency | Progression for all focuses < 100 ms at 500 sessions (NF-09, planner target, not ruled) | domain benchmark test | specified |
| Usability: speed | Log in <= 30 s (NF-02); prefilled screen in <= 2 taps from Home (NF-01, reading pending PO, A-7) | timed/tap-counting Maestro flow; both reviewer checklists (`reviewer-design.md:90-93`, `reviewer-code.md:80-83`) | specified; checklists enforced |
| Usability: ergonomics | One-handed in portrait at 390 and 430 px (NF-04); targets 44 pt / 48 dp (NF-08); empty states name the next step (NF-06) | design review, Maestro, `frontend.md` | specified |
| Usability: forgiveness | Soft delete with undo toast instead of confirm dialogs (NF-05); erase-all the sole confirm (pending PO, A-2) | Maestro delete -> undo | specified |
| Usability: appearance | Light and dark, tokens only (NF-07); manual theme override pending DSR-21/CO-16 | token adherence check, screenshots | specified |
| Reliability | Migrations applied from scratch and asserted; generated migrations in sync with schema | Jest migration tests; CI `drizzle-kit generate && git diff --exit-code` | enforced rule (CI), tests with sprint 1 |
| Reliability: availability | Fully offline (NF-10) | review | specified |
| Security / privacy | SQLCipher at rest; key in Keychain/Keystore, never logged; no analytics/crash SDK without ADR; fictional fixtures | `privacy.md`, `data.md`, path/bash guards, review | enforced rules; encryption verified on dev-client in sprint 1 |
| Privacy: user control | Export, import, erase before any store release (R-12) | sprint 3 tests | specified |
| Maintainability | Three layers one direction; pure domain; taxonomy and weights as data; `descriptions.json` complete; docs generated from schema | `data.md`, Jest descriptions test, `scripts/docs/` | enforced rules |
| Portability | iOS and Android from one codebase | EAS builds; Android E2E deferred (CO-03) | specified |
| Compatibility / i18n | English only, all strings keys (NF-11); locale dates, Monday weeks, minutes (NF-13) | lint/test, unit tests | specified |
| Testability | Every domain function unit-tested; every interactive element has a testID (NF-12) | Jest, Maestro `id:` selectors | specified |
