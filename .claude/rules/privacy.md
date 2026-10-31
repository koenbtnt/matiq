# Privacy, data and environments — hard requirements (always loaded)

Derived from the decisions of 2026-10-31 (local-first data, single user built for publishing) and
`docs/decisions.md` once sprint 0 writes it. Unscoped on purpose: short, and the one set of rules
no agent may ever miss.

- **Training data is personal data.** Sessions, focus areas, ratings, what-worked / what-failed notes and progression scores describe one person's body and ability. Treat every row as such, even in v1 with a single user.
- **v1 stores everything on the device only** — the SQLite file in the app sandbox. No network call carries user data; no backend, no account, no sync. The sync seam in `.claude/rules/data.md` is a schema convention, not a feature.
- **No analytics, crash-reporting or advertising SDK** without a dated user ruling and an ADR. A dependency that phones home is **B** at review.
- **Publishing-ready by design:** JSON export of all user data and a full local erase must be implementable without a schema change (stable ids; no user data outside the database). Both ship before any store release.
- **No third-party identifiers:** no advertising id, no fingerprinting, no account identifiers until an auth ADR exists.
- **Secrets and signing material never enter git:** `.env*` (except `.env.example`), keystores, `.p8` / `.p12` / `.mobileprovision` / `.pem`, `google-services.json`, `GoogleService-Info.plist`. `bash-guard.sh` rule 5 refuses staging them and `.gitignore` lists them. Never paste one in a chat, a doc or a log.
- **Fixtures, tests, docs and screenshots use fictional names and data only** — never the user's real training history.
- **Environments:** development = this machine (Expo dev client, iOS simulator; Android emulator once set up). There is no acceptance or production environment in v1. EAS Build artefacts are the only thing that leaves the machine, and they carry no user data.
- The legacy repo (`/Users/koen/Projects/matiq/matiq-legacy`) is reference only: its domain model informs the spec; its code and data are never copied.
