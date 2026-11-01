# Architecture decision records

MADR format. Numbers are never reused. A reversal is a new ADR that supersedes the old one; the old one changes only
its Status line. Rulings are quoted user sentences with a date (`.claude/rules/docs.md`); D-ids refer to the decision
register in the sprint's `plan.md §0`, R-ids to rulings in `docs/decisions.md`.

| ADR | Title | D-ids / R-ids | Status | Date |
|---|---|---|---|---|
| [0001](0001-develop-and-main-release-branching.md) | develop as integration branch, main as release branch | setup | accepted | 2026-10-31 |
| [0002](0002-agent-workflow-from-cadence.md) | Agent workflow adopted from cadence (and sugar) | setup | accepted | 2026-10-31 |
| [0003](0003-local-first-on-device-data.md) | Local-first: all data on the device in SQLite | D-01 / S-02, S-03, S-12 | accepted | 2026-10-31 |
| [0004](0004-sync-seam-no-user-id-v1.md) | Sync seam on every table; no user_id in v1 | D-02 / S-03, S-12, R-01, R-16, R-27 | accepted | 2026-10-31 |
| [0005](0005-expo-router-ios-android-dev-client.md) | Expo, React Native and Expo Router for iOS and Android; dev-client builds only | D-01 / S-01, S-08, S-09, R-31 | accepted | 2026-10-31 |
| [0006](0006-sqlcipher-encryption-at-rest.md) | SQLCipher encryption at rest with a keychain-held key | D-22 / R-24, R-12, R-31; assumptions A-10, A-11 | accepted | 2026-10-31 |
| [0007](0007-maestro-e2e.md) | Maestro for end-to-end tests on simulators | D-01 / S-04 | accepted | 2026-10-31 |
| [0008](0008-design-artifact-as-design-system-source.md) | The PO's Claude Artifact is the design-system source | D-34 / S-05 | accepted | 2026-10-31 |
| [0009](0009-i18n-keys-english-only.md) | All strings through i18n keys; English only in v1 | D-33 / S-07 | accepted | 2026-10-31 |
| [0010](0010-progression-algorithm-v1-and-versioning.md) | Progression algorithm v1: deterministic, parameterised, versioned | D-16, D-17 / S-06, R-08, R-17, R-22 | accepted | 2026-10-31 |
| [0011](0011-taxonomy-editable-graph-with-user-layer.md) | Taxonomy as an editable graph with aliases and a user layer | D-06, D-07, D-08, D-09, D-25, D-36 / R-13, R-14, R-23, R-34, R-28 | accepted | 2026-10-31 |
| [0012](0012-grapplemap-seed-pipeline-and-licensing.md) | GrappleMap as seed source: curated core, extended tier, licence handling | D-31, D-32, D-08, D-09 / R-28, R-35, R-13 | accepted | 2026-10-31 |
| [0013](0013-resources-entity.md) | Resources as a first-class entity linked to the graph | D-28 / R-29, R-33, R-16 | accepted | 2026-10-31 |
| [0014](0014-positions-as-focus-nodes.md) | A focus is {kind, ref_id}; positions and subjects for now | D-05 / R-04, R-30 | proposed | 2026-10-31 |
| [0015](0015-export-import-erase.md) | JSON export, import and erase-all; erase as the single hard-delete path | D-21 / R-12, R-27, R-26; assumptions A-2, A-10 | accepted | 2026-10-31 |
| [0016](0016-time-model-and-settings-store.md) | Time model (UTC + local_date) and settings separate from app_meta | D-26, D-35 / R-15, R-21, R-22 | accepted | 2026-10-31 |
| [0017](0017-planning-and-logging-model.md) | Planning and logging model: sessions, reviews, rounds, cycles, slots, rank | D-04, D-10..D-15, D-19 / R-03, R-05..R-07, R-10, R-19, R-20 | accepted | 2026-10-31 |
