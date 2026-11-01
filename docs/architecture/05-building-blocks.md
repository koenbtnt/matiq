# 05. Building blocks

Target state per `.claude/rules/data.md` and `docs/product-spec/plan.md`. Built so far (sprint 1, `foundation`): the full schema, the encrypted database, the seed pipeline, Log Session, Home and Library. Not built: Settings, Progress, technique detail, export and erase.

```mermaid
C4Container
  title matIQ - containers (v1 target)
  Person(practitioner, "Practitioner")
  System_Boundary(device, "Device") {
    Container(app, "Expo app", "React Native, Expo Router, TypeScript", "Screens, repository hooks, pure domain logic; iOS and Android")
    ContainerDb(db, "matiq.db", "SQLite + SQLCipher", "All user data and taxonomy; encrypted at rest")
    Container(keystore, "Keychain / Keystore", "expo-secure-store", "Holds the database key")
  }
  Container_Ext(backend, "Sync backend", "planned, not designed", "v2 coach tier; needs its own ADR")
  Rel(practitioner, app, "Uses")
  Rel(app, db, "Drizzle via expo-sqlite")
  Rel(app, keystore, "Reads/writes key")
  Rel(app, backend, "Not in v1")
```

## Layers inside the app

| Layer | Path | Responsibility | Imports |
|---|---|---|---|
| Routes | `mobile/app/` (Expo Router: `(tabs)/`, `log-session`, `session/[id]`, `set-rank`, `dev/reset`) | thin route files | features |
| Features | `mobile/src/features/{bootstrap,home,library,log-session,rank,session}/` | screens and feature components, tokens, i18n keys, testIDs | components, hooks |
| Components | `mobile/src/components/` | design-system primitives built from `mobile/src/theme/tokens.ts` | theme |
| Hooks | `mobile/src/hooks/data/` and `mobile/src/repositories/hooks/` | live-query hooks returning `LiveResult<T>`; the only data entry point of the UI | repositories |
| Repositories | `mobile/src/repositories/` | all reads and writes, `db.transaction()` per write, `Db` injected last (ADR 0019) | `db`, `domain` |
| Domain | `mobile/src/domain/` (tests alongside; Jest is the executable spec; see its `README.md`) | session rules, progression, rank, suggestions, taxonomy ops, error registry `errors.ts` | nothing impure |
| DB | `mobile/src/db/` (`schema/`, `open.ts`, `bootstrap.ts`, `client.ts`, `lifecycle.ts`, `key/`, `seed/`) and `mobile/drizzle/` | tables, encryption, key seam, migrations, generated seed JSON | `drizzle-orm`, `expo-sqlite`, `expo-secure-store` |
| Taxonomy pipeline | `scripts/taxonomy/` reading `data/taxonomy/{grapplemap,grapple-flows,curated}/` | build-time conversion to `mobile/src/db/seed/*.json` (ADR 0012, 0021, 0022) | none at runtime |

Contracts: the sprint-level [data-contracts.md](../foundation/data-contracts.md) (data-coder). Data model: [dictionary](../data-model/dictionary.md), [erd](../data-model/erd.md), [changelog](../data-model/changelog.md) (generated). Domain logic: `mobile/src/domain/` and its `__tests__/`. Product-level model: `docs/PRODUCT.md` §5, field level `docs/product-spec/plan.md` §4.

## Taxonomy pipeline

```mermaid
flowchart LR
  V[Vendored GrappleMap records + grapple-flows] --> C[convert.ts: parse, validate, decode, canonicalise]
  C --> R[Resolve endpoints, derive edge types]
  K[curated/: core, aliases, edge-types, gi, catalog, ids] --> O[Curated overlay]
  R --> O
  O --> E[mobile/src/db/seed/*.json + report.json]
  E --> S[seed.ensureSeeded on first launch]
```
