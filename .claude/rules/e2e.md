---
paths:
  - "e2e/**"
---
# Maestro E2E and test discipline — binding

Loads when a Maestro flow or config is touched. Decision of 2026-10-31: native E2E on simulators,
no web target.

- Layout (tester-owned): `e2e/maestro/config.yaml` (workspace); flows in `e2e/maestro/flows/smoke/`, `features/`, `regression/`, one YAML flow per user journey named `<journey>.yaml`. Unit and component tests are not here: Jest in `mobile/**/__tests__/` (coders).
- `appId: nl.btnt.matiq` in every flow (the bundle id from `mobile/app.json`); flows run against the dev-client build installed on the simulator.
- **Select by `id:` (the `testID` from the `design.md` table), never by text** — except an `assertVisible` of a copy string when that copy is the thing under test.
- **Never loosen an assertion, a validation or a schema check to make a flow pass.** Fix the fixture, the clock, the data or the bug; a product defect is reported with reproduction steps to the owning coder, never patched by the tester.
- Every flow is idempotent and order-independent: it starts with `clearState` (or the app's debug reset route) and creates the data it needs through the UI; it never depends on another flow.
- Runs: during a sprint only the new, changed and affected flows (`maestro test e2e/maestro/flows/<dir>/<flow>.yaml`); the whole suite once per sprint (tester phase 3): `maestro test -e METRO_URL=http://localhost:<metro port> e2e/maestro` — the workspace directory that holds `config.yaml`, never `flows/` itself; the reset subflow opens the dev client with that URL, because `clearState` wipes the remembered server. Output `> /tmp/maestro.log 2>&1`, then `grep -nE "PASSED|FAILED|Assertion|Error" /tmp/maestro.log`.
- Infra first: `maestro --help`, `xcrun simctl list devices booted`, the app installed (`xcrun simctl listapps booted | grep nl.btnt.matiq`). Missing → boot the simulator the plan names / `npx expo run:ios`; still missing after one attempt → `INFRA UNAVAILABLE`, never a fabricated result.
- iOS simulator first; Android emulator flows once a device path exists (`docs/carry-over.md`). Maestro does not run in CI (CO-01): every run is recorded in `verify.md` with the sha and the simulator used.
- Never leave Metro, a build or a simulator you booted alive at turn end: `pgrep -f "expo start"` must be empty; `xcrun simctl shutdown <udid>` only for what you booted.
