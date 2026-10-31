# Data dictionary — generated

_All tables and columns are described._


Source: `mobile/drizzle/meta/0000_snapshot.json` + `mobile/src/db/schema/descriptions.json`. Regenerate with `node scripts/docs/gen-data-model.mjs`. Never edit by hand.

## app_meta

Key/value store for app-level metadata (schema version markers, onboarding flags).

| Column | Type | Null | PK | Default | Description |
|---|---|---|---|---|---|
| created_at | text | no |  |  | ISO-8601 UTC creation time |
| deleted_at | text | yes |  |  | ISO-8601 UTC soft-delete time, null while live |
| id | text | no | yes |  | UUID v4, generated on device |
| key | text | no |  |  | Unique metadata key |
| updated_at | text | no |  |  | ISO-8601 UTC last update |
| value | text | no |  |  | Metadata value as text |

