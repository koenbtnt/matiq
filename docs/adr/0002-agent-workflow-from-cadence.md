# 0002. Agent workflow adopted from cadence (and sugar)

- **Status:** accepted
- **Date:** 2026-10-31
- **Deciders:** PO (user)
- **Source:** project setup, 2026-10-31

## Ruling (quoted)

> PO, 2026-10-31: "i want you to look into the following repos and take the development approche of the (sub)agents
> in there to base the development of this project on. /Users/koen/Projects/sugar /Users/koen/Projects/cadence/cadence"

## Context and problem

matIQ is a native mobile app with a local-first data layer; sugar and cadence are web/Expo apps on an Oracle backend.
Their development harness (an orchestrator subagent running a fixed sprint pipeline over specialist subagents, typed
Markdown handoffs, hook-enforced edit scopes) is stack-independent; its agents and rules are not.

## Decision outcome

- Ported verbatim from cadence: `scope-lib.sh`, `path-guard.sh`, `base-ref.sh`, `session-context.sh`,
  `precompact-snapshot.sh`; the orchestrator's budget gates and handoff order; the `§0 Summary for builders`,
  `verify.md`, `progress.md`, carry-over and stack-notes conventions; two rework rounds then escalate;
  `.claude/**` and `CLAUDE.md` owned by the PO.
- Adapted: `backend-coder` → **`data-coder`** (Drizzle schema, generated migrations, pure domain logic, repositories,
  Jest on real SQLite, `data-contracts.md` instead of `api-contracts.md`); `frontend-coder` for iOS + Android only
  (no web export), with i18n keys and the designer's testID table; `tester` on Maestro instead of Playwright, with the
  API phase replaced by a contract-coverage audit; `documenter` generating the dictionary/ERD from the Drizzle
  snapshot + `descriptions.json` (no OpenAPI); `bash-guard.sh` rules 5/6 (database credentials, SYS) replaced by a
  secret/signing-file rule; `validation-guard.sh` patterns for TypeScript, Drizzle and Maestro.
- Rules: `privacy.md` (on-device data, no analytics, export/erase readiness), `data.md` (replaces `db.md`),
  `frontend.md`, `e2e.md`, `docs.md`.
- Not ported: the SQLcl MCP guard, Playwright, the Oracle `db` skill, sugar's harness evals runner (carry-over CO-05).
- Models and efforts as in cadence (`planner: fable`, coders/reviewers per `.claude/agents/*.md`).

## Consequences

- `scripts/claude/hooks.test.sh` pins the new scopes and patterns and runs in CI (`claude` job).
- `docs/agent-tooling/plan.md` holds the control ledger: every control, its reason and when it expires.
- Sprint 0 (`product-spec`) runs this pipeline docs-only; sprint 1 (`foundation`) is the first code sprint.
