# 04. Solution strategy

| Goal | Approach | ADR |
|---|---|---|
| Privacy, offline | Local-first SQLite, SQLCipher, no backend | 0003, 0006 |
| Future coach tier | Sync seam on every table, versioned export, no `user_id` yet | 0004, 0015 |
| One codebase, two stores | Expo / React Native / Expo Router, dev-client | 0005 |
| Testable business logic | Three layers, pure-TS domain, Jest on real SQLite, Maestro E2E | 0003, 0007 |
| Explainable progress | Deterministic, parameterised, versioned algorithm | 0010 |
| Editable taxonomy that can be updated | Graph with `origin`, user layer wins on re-import | 0011, 0012 |
| Fast logging | Prefilled screen, two required fields, aggregates always, detail optional | 0017 |
| Change of focus unit later | Focus as `{kind, ref_id}` (provisional) | 0014 |
| Design consistency | Artifact -> tokens, i18n keys | 0008, 0009 |

Pending: no further strategy is sourced until sprint 1 (foundation) starts. Sprint order: `docs/product-spec/plan.md` §7 (R-32).
