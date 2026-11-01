# 0005. Expo, React Native and Expo Router for iOS and Android; dev-client builds only

- **Status:** accepted
- **Date:** 2026-10-31
- **Deciders:** PO (user)
- **Decision ids:** D-01 / S-01, S-08, S-09, R-31
- **Source:** `docs/decisions.md` Repo S-01, S-08, S-09, R-31; plan §0 D-01.

## Ruling (quoted)

> PO, 2026-10-31 · S-01: "Expo / React Native (Recommended)"
>
> PO, 2026-10-31 · S-08: "iOS-first locally, Android via EAS Build (Recommended)"
>
> PO, 2026-10-31 · S-09: "nl.btnt.matiq (Recommended)"
>
> PO, 2026-10-31 · R-31: "ok" (to: development, smoke checks and Maestro on `npx expo run:ios` dev-client builds; CocoaPods and an `eas build` Android profile before sprint 1; docs drop Expo Go)

## Context and problem

The PO wants a native Android and Apple app. SQLCipher (ADR 0006) needs native code that Expo Go does not ship.

## Decision drivers

- One TypeScript codebase for both platforms.
- Native modules (SQLCipher) must work in every development path.

## Considered options

- Expo + React Native + Expo Router, app in `mobile/`, npm (chosen).
- Native Swift/Kotlin twice: rejected for cost.
- Expo Go for development: rejected by R-31 once SQLCipher lands.

## Decision outcome

App in `mobile/`; bundle id / package `nl.btnt.matiq`, scheme `matiq`, name matIQ; iOS built and run locally, Android through EAS Build; no web target. Development, smoke checks and Maestro run on dev-client builds.

## Consequences

- CocoaPods and an Android EAS profile are prerequisites for sprint 1 (CO-14).
- Android has no local E2E until an SDK exists (CO-03).
- `CLAUDE.md` commands are amended by the PO when sprint 1 lands SQLCipher.
