# 09. Decisions

Index of `docs/adr/` (MADR). Full list with ids: [docs/adr/README.md](../adr/README.md).

| ADR | Title | D-ids / R-ids | Status | Date |
|---|---|---|---|---|
| [0001](../adr/0001-develop-and-main-release-branching.md) | develop as integration branch, main as release branch | setup | accepted | 2026-10-31 |
| [0002](../adr/0002-agent-workflow-from-cadence.md) | Agent workflow adopted from cadence (and sugar) | setup | accepted | 2026-10-31 |
| [0003](../adr/0003-local-first-on-device-data.md) | Local-first: all data on the device in SQLite | D-01 / S-02, S-03, S-12 | accepted | 2026-10-31 |
| [0004](../adr/0004-sync-seam-no-user-id-v1.md) | Sync seam on every table; no user_id in v1 | D-02 / S-03, S-12, R-01, R-16, R-27 | accepted | 2026-10-31 |
| [0005](../adr/0005-expo-router-ios-android-dev-client.md) | Expo, React Native and Expo Router for iOS and Android; dev-client builds only | D-01 / S-01, S-08, S-09, R-31 | accepted | 2026-10-31 |
| [0006](../adr/0006-sqlcipher-encryption-at-rest.md) | SQLCipher encryption at rest with a keychain-held key | D-22 / R-24, R-12, R-31; assumptions A-10, A-11 | accepted | 2026-10-31 |
| [0007](../adr/0007-maestro-e2e.md) | Maestro for end-to-end tests on simulators | D-01 / S-04 | accepted | 2026-10-31 |
| [0008](../adr/0008-design-artifact-as-design-system-source.md) | The PO's Claude Artifact is the design-system source | D-34 / S-05 | accepted | 2026-10-31 |
| [0009](../adr/0009-i18n-keys-english-only.md) | All strings through i18n keys; English only in v1 | D-33 / S-07 | accepted | 2026-10-31 |
| [0010](../adr/0010-progression-algorithm-v1-and-versioning.md) | Progression algorithm v1: deterministic, parameterised, versioned | D-16, D-17 / S-06, R-08, R-17, R-22 | accepted | 2026-10-31 |
| [0011](../adr/0011-taxonomy-editable-graph-with-user-layer.md) | Taxonomy as an editable graph with aliases and a user layer | D-06, D-07, D-08, D-09, D-25, D-36 / R-13, R-14, R-23, R-34, R-28 | accepted | 2026-10-31 |
| [0012](../adr/0012-grapplemap-seed-pipeline-and-licensing.md) | GrappleMap as seed source: curated core, extended tier, licence handling | D-31, D-32, D-08, D-09 / R-28, R-35, R-13 | accepted | 2026-10-31 |
| [0013](../adr/0013-resources-entity.md) | Resources as a first-class entity linked to the graph | D-28 / R-29, R-33, R-16 | accepted | 2026-10-31 |
| [0014](../adr/0014-positions-as-focus-nodes.md) | A focus is {kind, ref_id}; positions and subjects for now | D-05 / R-04, R-30 | proposed | 2026-10-31 |
| [0015](../adr/0015-export-import-erase.md) | JSON export, import and erase-all; erase as the single hard-delete path | D-21 / R-12, R-27, R-26; assumptions A-2, A-10 | accepted | 2026-10-31 |
| [0016](../adr/0016-time-model-and-settings-store.md) | Time model (UTC + local_date) and settings separate from app_meta | D-26, D-35 / R-15, R-21, R-22 | accepted | 2026-10-31 |
| [0017](../adr/0017-planning-and-logging-model.md) | Planning and logging model: sessions, reviews, rounds, cycles, slots, rank | D-04, D-10..D-15, D-19 / R-03, R-05..R-07, R-10, R-19, R-20 | accepted | 2026-10-31 |
| [0018](../adr/0018-single-foundation-migration-and-schema-deltas.md) | One foundation migration for the whole schema; live-unique partial indexes; schema deltas | F-01, F-02, F-04, F-20 / D-29; A-15, A-24, A-31 | proposed | 2026-11-01 |
| [0019](../adr/0019-database-access-layer-and-bootstrap.md) | Shared Db type, transaction-only writes and the bootstrap sequence | F-03, F-08, F-09 / R-24, CO-15 | accepted | 2026-11-01 |
| [0020](../adr/0020-sqlcipher-key-seam-and-backup-exclusion.md) | SQLCipher key seam, raw 32-byte key and backup exclusion | F-05..F-07 / R-24, R-12; A-16, A-17 | proposed | 2026-11-01 |
| [0021](../adr/0021-taxonomy-seed-pipeline-design.md) | Taxonomy seed pipeline: vendored snapshot, zero-dependency converter, endpoint resolution | F-10..F-13, F-15 / R-28, R-35; A-26, A-27, A-31..A-33 | proposed | 2026-11-01 |
| [0022](../adr/0022-curated-layer-id-registry-and-first-launch-seed.md) | Curated layer, append-only id registry and idempotent first-launch seed | F-14, F-16 / R-28, D-07, D-08; A-28, A-29 | proposed | 2026-11-01 |
| [0023](../adr/0023-dev-reset-route.md) | Dev-only database reset route for Maestro | F-25 / R-12; A-25 | proposed | 2026-11-01 |
