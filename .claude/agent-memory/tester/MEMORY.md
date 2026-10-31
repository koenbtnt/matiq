# tester memory

Seeded 2026-10-31 by the main session from cadence's tester memory where the lesson is stack-generic (tagged "cadence,
unverified here"). One line per lesson, dated, with the file it concerns. Delete a line once a rule or a fix supersedes it.

- 2026-10-31 · Maestro is not installed on this machine yet (PO action P2 in `docs/agent-tooling/plan.md`); `e2e/maestro/flows/smoke/app-launches.yaml` has never run. Record `INFRA UNAVAILABLE` until `maestro --help` works.
- (cadence 2026-10-28, unverified here) A missing dependency or tool is reported to the Orchestrator as a PO action, never worked around with a global install.
- (cadence 2026-09, unverified here) Orphaned runners and dev servers from earlier agents block the next run: `pgrep -f "maestro test"` and `pgrep -f "expo start"` must be empty; a process older than your session is an orphan.
- (cadence 2026-10-23, unverified here) `until ! pgrep -f …` loops match their own shell wrapper and never end — wait on a log marker (`grep -q '^exit' log`) instead.
- (cadence 2026-10-14, unverified here) Prove "pre-existing" with a scratch `git worktree add --detach origin/develop` + install + the same flow; never by assertion.
