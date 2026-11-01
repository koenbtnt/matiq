# 03. Context and scope

```mermaid
C4Context
  title matIQ - system context (v1)
  Person(practitioner, "Practitioner", "Plans, logs and reviews BJJ training")
  System(matiq, "matIQ app", "Expo app on iOS and Android; all data on the device")
  System_Ext(os, "OS services", "Keychain/Keystore, local notifications, share sheet, browser")
  System_Ext(seed, "Taxonomy sources", "GrappleMap, grapple-flows: used at build time by scripts/taxonomy/, not at runtime")
  System_Ext(coach, "Coach tier (v2)", "Planned, not designed")
  Rel(practitioner, matiq, "Uses")
  Rel(matiq, os, "Stores key, schedules reminders, exports JSON, opens resource URLs")
  Rel(seed, matiq, "Ships inside the app as a versioned seed")
  Rel(matiq, coach, "Future upload of the versioned export", "not in v1")
```

## Scope

| In (v1) | Out (v1) |
|---|---|
| Home, Log Session, Library, Technique detail, Progress, Settings, planning flow (R-02) | Coach, club, sharing, social, accounts, sync, cloud backup |
| Local reminders (sprint 3), JSON export/import/erase | Gym check-in, coach notes, video area (R-16), scraping of instructional sites (R-33) |
| Opening a resource URL in the browser (the only outbound action) | S&C modelling (R-03), web app (S-04) |

## External interfaces

| Interface | Direction | Data |
|---|---|---|
| Share sheet | out | exported JSON (plaintext once shared, with an in-app warning; ruled R-38, 2026-11-01, A-10) |
| Browser | out | a resource URL only |
| Local notifications | local | reminder text, no user data leaves the device |
