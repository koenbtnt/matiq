# matIQ

Matiq app for tracking BJJ skills and things to work on, branch further into S&C development as well.

A native iOS + Android app (Expo / React Native, local-first SQLite) for BJJ practitioners: plan a session and its focus areas, train, log what you actually worked on, review it, and let the progression view show which areas are improving or lacking. Everything — taxonomy and algorithm weights included — is editable by the user.

**Status:** Sprint 2 `progress-settings` delivered (Progress tab with algorithm v1 and panels, Profile/Settings incl. theme override and About, Library editing with aliases and merge/undo, Technique detail with Resources, iOS backup-exclusion module; ADRs 0024–0028); 13/13 Maestro flows pass on the iOS simulator dev-client build; next: sprint 3 (cycles, slots, export/erase, list editors CO-43).

- Product spec: `docs/PRODUCT.md` (written in sprint 0) · binding decisions: `docs/decisions.md`
- How development runs here: `CLAUDE.md`, `.claude/agents/`, `.claude/rules/`, `docs/agent-tooling/plan.md`
- Branching: `develop` (integration, default) → `main` (released), see `docs/adr/0001-develop-and-main-release-branching.md`
