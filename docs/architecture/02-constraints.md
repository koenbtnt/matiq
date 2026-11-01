# 02. Constraints

| Kind | Constraint | Source |
|---|---|---|
| Product | No backend and no account in v1; single user; no sync, cloud backup, sharing or social | S-02, S-03, R-01, R-12 |
| Platform | Expo / React Native, TypeScript, Expo Router; iOS and Android only, no web; npm | S-01, S-04 (ADR 0005) |
| Build | Dev-client builds only (SQLCipher); CocoaPods and an Android EAS profile before sprint 1 | R-24, R-31 |
| Data | expo-sqlite + Drizzle, generated migrations, sync seam on every table, no hard delete (except erase-all) | S-02, `.claude/rules/data.md` (ADR 0003, 0004, 0015) |
| Security | SQLCipher at rest; key in Keychain/Keystore; no analytics or crash SDK without an ADR | R-24, `.claude/rules/privacy.md` |
| Licensing | GrappleMap public domain; grapple-flows CC BY 4.0 with in-app attribution; BJJGraph not imported without a licence | R-28 (ADR 0012) |
| Language | English copy only, all strings via i18n keys | S-07 |
| Process | `develop` -> `main`, PRs only; agent harness; two rework rounds | S-10, S-11 (ADR 0001, 0002) |
| Design | Design source is the PO's Claude Artifact; tokens only in code | S-05 (ADR 0008) |
| UX | R-26 acceptance criteria; hit targets 44 pt / 48 dp | R-00, R-18, R-26 |
