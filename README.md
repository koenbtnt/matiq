# matIQ

Matiq app for tracking BJJ skills and things to work on, branch further into S&C development as well.

A native iOS + Android app (Expo / React Native, local-first SQLite) for BJJ practitioners: plan a session and its focus areas, train, log what you actually worked on, review it, and let the progression view show which areas are improving or lacking. Everything — taxonomy and algorithm weights included — is editable by the user.

**Status:** Sprint 1 `foundation` delivered (data model + migration 0001, SQLCipher seam, taxonomy seed pipeline, fonts, Log Session, Home, Library read-only; ADRs 0018–0023 proposed); not yet run on a device (CocoaPods/Maestro pending); next: PO rulings on the sprint-1 assumptions, then sprint 2.

- Product spec: `docs/PRODUCT.md` (written in sprint 0) · binding decisions: `docs/decisions.md`
- How development runs here: `CLAUDE.md`, `.claude/agents/`, `.claude/rules/`, `docs/agent-tooling/plan.md`
- Branching: `develop` (integration, default) → `main` (released), see `docs/adr/0001-develop-and-main-release-branching.md`
