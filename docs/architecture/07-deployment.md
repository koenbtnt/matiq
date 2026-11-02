# 07. Deployment

| Environment | How | Source |
|---|---|---|
| Local development | `npx expo run:ios` dev-client build on the Xcode simulator (CocoaPods required); Maestro flows and smoke checks on that build; Expo Go is not used | R-31, S-08 |
| Android | `eas build` profile (dev-client) | S-08, R-31 |
| Binaries | EAS Build; bundle id / package `nl.btnt.matiq`, scheme `matiq` | S-09 |
| Distribution | TestFlight / Play internal testing later; export and erase must exist before any store release | `.claude/rules/privacy.md` |
| CI | `claude` job runs `scripts/claude/hooks.test.sh`; CI also checks `drizzle-kit generate` leaves no diff | ADR 0002, `data.md` |
| Backend | none in v1 | S-02 |

EAS artefacts carry no user data. Android local E2E waits for an SDK (CO-03).

Sprint 2: `mobile/modules/matiq-backup/` is a local Expo module, autolinked from `./modules` with no `app.json` change. A newly added local module needs `pod install` once before `npx expo run:ios` (`docs/stack-notes.md`); the dev-client must be rebuilt after it.
