# Data dictionary — generated

_All tables and columns are described._


Source: `mobile/drizzle/meta/0001_snapshot.json` + `mobile/src/db/schema/descriptions.json`. Regenerate with `node scripts/docs/gen-data-model.mjs`. Never edit by hand.

## algorithm_params

Editable progression-algorithm weights and thresholds per algorithm version (R-22).

| Column | Type | Null | PK | Default | Description |
|---|---|---|---|---|---|
| algorithm_version | text | no |  |  | Algorithm version, e.g. 'v1' |
| created_at | text | no |  |  | ISO-8601 UTC creation time |
| default_value | real | no |  |  | Shipped default; min ≤ default_value ≤ max |
| deleted_at | text | yes |  |  | ISO-8601 UTC soft-delete time, null while live; reads filter deleted_at IS NULL |
| id | text | no | yes |  | UUID v4, generated on device by the repository (expo-crypto randomUUID) |
| key | text | no |  |  | Parameter key, unique per version among live rows |
| max | real | no |  |  | Upper bound (inclusive) |
| min | real | no |  |  | Lower bound (inclusive) |
| updated_at | text | no |  |  | ISO-8601 UTC last update |
| value | real | no |  |  | Current value; min ≤ value ≤ max |

Constraints:
- CHECK `algorithm_params_value_range_check`: `min <= value AND value <= max`
- CHECK `algorithm_params_default_range_check`: `min <= default_value AND default_value <= max`

## aliases

Alternative names of positions and techniques; searched by every picker.

| Column | Type | Null | PK | Default | Description |
|---|---|---|---|---|---|
| created_at | text | no |  |  | ISO-8601 UTC creation time |
| deleted_at | text | yes |  |  | ISO-8601 UTC soft-delete time, null while live; reads filter deleted_at IS NULL |
| id | text | no | yes |  | UUID v4, generated on device by the repository (expo-crypto randomUUID) |
| name | text | no |  |  | Alias text; unique per target among live rows (case-insensitive) |
| origin | text | no |  |  | Provenance: 'seed' (shipped taxonomy/catalog) or 'user' (created on device) |
| source | text | yes |  |  | Seed source: 'grapplemap', 'grapple-flows' or 'curated'; null only for origin = 'user' |
| source_id | text | yes |  |  | Stable id inside the source (GrappleMap: gm:<record index>; curated: cur:<slug>; grapple-flows: their slug); null for user rows |
| source_version | text | yes |  |  | Release of the source: '2023-02-06' for GrappleMap, the vendored commit date for grapple-flows, the curated release otherwise |
| target_id | text | no |  |  | Id of the position or technique (polymorphic, no SQL FK) |
| target_kind | text | no |  |  | 'POSITION' or 'TECHNIQUE' |
| updated_at | text | no |  |  | ISO-8601 UTC last update |
| user_edited_at | text | yes |  |  | ISO-8601 UTC time the user last edited an imported field; set ⇒ re-import skips the row (user edits win, R-23) |

Constraints:
- CHECK `aliases_origin_check`: `origin IN ('seed', 'user')`
- CHECK `aliases_source_check`: `source IS NULL OR source IN ('grapplemap', 'grapple-flows', 'curated')`
- CHECK `aliases_origin_source_check`: `origin = 'user' OR source IS NOT NULL`
- CHECK `aliases_target_kind_check`: `target_kind IN ('POSITION', 'TECHNIQUE')`

## app_meta

Key/value store for app-level metadata (schema_version, taxonomy_release, catalog_release, db_key_created_at — never key material).

| Column | Type | Null | PK | Default | Description |
|---|---|---|---|---|---|
| created_at | text | no |  |  | ISO-8601 UTC creation time |
| deleted_at | text | yes |  |  | ISO-8601 UTC soft-delete time, null while live; reads filter deleted_at IS NULL |
| id | text | no | yes |  | UUID v4, generated on device by the repository (expo-crypto randomUUID) |
| key | text | no |  |  | Unique metadata key |
| updated_at | text | no |  |  | ISO-8601 UTC last update |
| value | text | no |  |  | Metadata value as text |

## cycle_focuses

Focuses of a cycle, as {kind, ref}.

| Column | Type | Null | PK | Default | Description |
|---|---|---|---|---|---|
| created_at | text | no |  |  | ISO-8601 UTC creation time |
| cycle_id | text | no |  |  | Owning cycle |
| deleted_at | text | yes |  |  | ISO-8601 UTC soft-delete time, null while live; reads filter deleted_at IS NULL |
| focus_kind | text | no |  |  | 'POSITION' or 'SUBJECT' |
| focus_ref_id | text | no |  |  | Id of the position or subject (polymorphic, no SQL FK) |
| id | text | no | yes |  | UUID v4, generated on device by the repository (expo-crypto randomUUID) |
| sort_order | integer | no |  |  | Display order, ascending |
| updated_at | text | no |  |  | ISO-8601 UTC last update |

Constraints:
- CHECK `cycle_focuses_focus_kind_check`: `focus_kind IN ('POSITION', 'SUBJECT')`
- FK `cycle_focuses_cycle_id_cycles_id_fk`: (cycle_id) → cycles(id) on delete restrict

## cycles

Training cycles: a date range with 1–3 focuses (UI in sprint 3).

| Column | Type | Null | PK | Default | Description |
|---|---|---|---|---|---|
| created_at | text | no |  |  | ISO-8601 UTC creation time |
| deleted_at | text | yes |  |  | ISO-8601 UTC soft-delete time, null while live; reads filter deleted_at IS NULL |
| ends_on | text | no |  |  | Last day, local date YYYY-MM-DD; after starts_on |
| id | text | no | yes |  | UUID v4, generated on device by the repository (expo-crypto randomUUID) |
| name | text | yes |  |  | Optional cycle name |
| note | text | yes |  |  | Free-text note |
| starts_on | text | no |  |  | First day, local date YYYY-MM-DD |
| updated_at | text | no |  |  | ISO-8601 UTC last update |

Constraints:
- CHECK `cycles_starts_on_check`: `starts_on GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]'`
- CHECK `cycles_ends_on_check`: `ends_on GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]'`
- CHECK `cycles_dates_order_check`: `ends_on > starts_on`

## positions

Position nodes of the taxonomy graph (GrappleMap positions plus curated canonical names); a session focus of kind POSITION refers here.

| Column | Type | Null | PK | Default | Description |
|---|---|---|---|---|---|
| canonical_name | text | no |  |  | Display name |
| created_at | text | no |  |  | ISO-8601 UTC creation time |
| deleted_at | text | yes |  |  | ISO-8601 UTC soft-delete time, null while live; reads filter deleted_at IS NULL |
| description | text | yes |  |  | Imported or curated description; null when none |
| id | text | no | yes |  | UUID v4, generated on device by the repository (expo-crypto randomUUID) |
| notes | text | yes |  |  | User notes; never touched by a re-import |
| origin | text | no |  |  | Provenance: 'seed' (shipped taxonomy/catalog) or 'user' (created on device) |
| parent_position_id | text | yes |  |  | Parent position for variants (e.g. Closed guard → Guard); null at the top; never itself |
| slug | text | no |  |  | URL-safe kebab-case name, unique among live rows |
| source | text | yes |  |  | Seed source: 'grapplemap', 'grapple-flows' or 'curated'; null only for origin = 'user' |
| source_id | text | yes |  |  | Stable id inside the source (GrappleMap: gm:<record index>; curated: cur:<slug>; grapple-flows: their slug); null for user rows |
| source_version | text | yes |  |  | Release of the source: '2023-02-06' for GrappleMap, the vendored commit date for grapple-flows, the curated release otherwise |
| tier | text | no |  |  | 'CORE' (curated core, shown by default) or 'EXTENDED' (shown only with library.showExtended) |
| updated_at | text | no |  |  | ISO-8601 UTC last update |
| user_edited_at | text | yes |  |  | ISO-8601 UTC time the user last edited an imported field; set ⇒ re-import skips the row (user edits win, R-23) |

Constraints:
- CHECK `positions_origin_check`: `origin IN ('seed', 'user')`
- CHECK `positions_source_check`: `source IS NULL OR source IN ('grapplemap', 'grapple-flows', 'curated')`
- CHECK `positions_origin_source_check`: `origin = 'user' OR source IS NOT NULL`
- CHECK `positions_tier_check`: `tier IN ('CORE', 'EXTENDED')`
- CHECK `positions_parent_not_self_check`: `parent_position_id IS NULL OR parent_position_id <> id`
- FK `positions_parent_position_id_positions_id_fk`: (parent_position_id) → positions(id) on delete restrict

## rank_entries

Belt rank history; the current rank is the latest live entry by awarded_on.

| Column | Type | Null | PK | Default | Description |
|---|---|---|---|---|---|
| awarded_on | text | no |  |  | Local date YYYY-MM-DD the rank was awarded |
| belt | text | no |  |  | Belt: one of WHITE BLUE PURPLE BROWN BLACK GREY_WHITE GREY GREY_BLACK YELLOW_WHITE YELLOW YELLOW_BLACK ORANGE_WHITE ORANGE ORANGE_BLACK GREEN_WHITE GREEN GREEN_BLACK (valid for the scale) |
| created_at | text | no |  |  | ISO-8601 UTC creation time |
| deleted_at | text | yes |  |  | ISO-8601 UTC soft-delete time, null while live; reads filter deleted_at IS NULL |
| id | text | no | yes |  | UUID v4, generated on device by the repository (expo-crypto randomUUID) |
| note | text | yes |  |  | Free-text note |
| scale | text | no |  |  | 'ADULT' or 'KIDS' |
| stripes | integer | no |  | 0 | Stripes 0–6 (≤ 4 unless BLACK; domain rule) |
| updated_at | text | no |  |  | ISO-8601 UTC last update |

Constraints:
- CHECK `rank_entries_scale_check`: `scale IN ('ADULT', 'KIDS')`
- CHECK `rank_entries_belt_check`: `belt IN ('WHITE', 'BLUE', 'PURPLE', 'BROWN', 'BLACK', 'GREY_WHITE', 'GREY', 'GREY_BLACK', 'YELLOW_WHITE', 'YELLOW', 'YELLOW_BLACK', 'ORANGE_WHITE', 'ORANGE', 'ORANGE_BLACK', 'GREEN_WHITE', 'GREEN', 'GREEN_BLACK')`
- CHECK `rank_entries_stripes_check`: `stripes BETWEEN 0 AND 6`
- CHECK `rank_entries_awarded_on_check`: `awarded_on GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]'`

## resource_links

Links a resource to a technique, position, subject or cycle.

| Column | Type | Null | PK | Default | Description |
|---|---|---|---|---|---|
| created_at | text | no |  |  | ISO-8601 UTC creation time |
| deleted_at | text | yes |  |  | ISO-8601 UTC soft-delete time, null while live; reads filter deleted_at IS NULL |
| id | text | no | yes |  | UUID v4, generated on device by the repository (expo-crypto randomUUID) |
| resource_id | text | no |  |  | Linked resource |
| target_id | text | no |  |  | Id of the target row (polymorphic, no SQL FK) |
| target_kind | text | no |  |  | 'TECHNIQUE', 'POSITION', 'SUBJECT' or 'CYCLE' |
| updated_at | text | no |  |  | ISO-8601 UTC last update |

Constraints:
- CHECK `resource_links_target_kind_check`: `target_kind IN ('TECHNIQUE', 'POSITION', 'SUBJECT', 'CYCLE')`
- FK `resource_links_resource_id_resources_id_fk`: (resource_id) → resources(id) on delete restrict

## resource_types

Kinds of learning resource (Instructional, Video, Article, Book, Other); seeded catalog.

| Column | Type | Null | PK | Default | Description |
|---|---|---|---|---|---|
| created_at | text | no |  |  | ISO-8601 UTC creation time |
| deleted_at | text | yes |  |  | ISO-8601 UTC soft-delete time, null while live; reads filter deleted_at IS NULL |
| id | text | no | yes |  | UUID v4, generated on device by the repository (expo-crypto randomUUID) |
| name | text | no |  |  | Display name, unique among live rows (case-insensitive) |
| origin | text | no |  |  | Provenance: 'seed' (shipped taxonomy/catalog) or 'user' (created on device) |
| sort_order | integer | no |  |  | Display order, ascending |
| source | text | yes |  |  | Seed source: 'grapplemap', 'grapple-flows' or 'curated'; null only for origin = 'user' |
| source_id | text | yes |  |  | Stable id inside the source (GrappleMap: gm:<record index>; curated: cur:<slug>; grapple-flows: their slug); null for user rows |
| source_version | text | yes |  |  | Release of the source: '2023-02-06' for GrappleMap, the vendored commit date for grapple-flows, the curated release otherwise |
| updated_at | text | no |  |  | ISO-8601 UTC last update |
| user_edited_at | text | yes |  |  | ISO-8601 UTC time the user last edited an imported field; set ⇒ re-import skips the row (user edits win, R-23) |

Constraints:
- CHECK `resource_types_origin_check`: `origin IN ('seed', 'user')`
- CHECK `resource_types_source_check`: `source IS NULL OR source IN ('grapplemap', 'grapple-flows', 'curated')`
- CHECK `resource_types_origin_source_check`: `origin = 'user' OR source IS NOT NULL`

## resources

Learning resources (instructionals, videos, …); GrappleMap ref: citations are seeded here.

| Column | Type | Null | PK | Default | Description |
|---|---|---|---|---|---|
| author | text | yes |  |  | Author or instructor; null when unknown |
| created_at | text | no |  |  | ISO-8601 UTC creation time |
| deleted_at | text | yes |  |  | ISO-8601 UTC soft-delete time, null while live; reads filter deleted_at IS NULL |
| id | text | no | yes |  | UUID v4, generated on device by the repository (expo-crypto randomUUID) |
| notes | text | yes |  |  | User or seed notes (for citations: the section/page part) |
| origin | text | no |  |  | Provenance: 'seed' (shipped taxonomy/catalog) or 'user' (created on device) |
| resource_type_id | text | no |  |  | Kind of resource |
| source | text | yes |  |  | Seed source: 'grapplemap', 'grapple-flows' or 'curated'; null only for origin = 'user' |
| source_id | text | yes |  |  | Stable id inside the source (GrappleMap: gm:<record index>; curated: cur:<slug>; grapple-flows: their slug); null for user rows |
| source_version | text | yes |  |  | Release of the source: '2023-02-06' for GrappleMap, the vendored commit date for grapple-flows, the curated release otherwise |
| status | text | no |  | 'TO_WATCH' | 'TO_WATCH' (default) or 'WATCHED' |
| title | text | no |  |  | Title |
| updated_at | text | no |  |  | ISO-8601 UTC last update |
| url | text | yes |  |  | Link; null when none |
| user_edited_at | text | yes |  |  | ISO-8601 UTC time the user last edited an imported field; set ⇒ re-import skips the row (user edits win, R-23) |

Constraints:
- CHECK `resources_origin_check`: `origin IN ('seed', 'user')`
- CHECK `resources_source_check`: `source IS NULL OR source IN ('grapplemap', 'grapple-flows', 'curated')`
- CHECK `resources_origin_source_check`: `origin = 'user' OR source IS NOT NULL`
- CHECK `resources_status_check`: `status IN ('TO_WATCH', 'WATCHED')`
- FK `resources_resource_type_id_resource_types_id_fk`: (resource_type_id) → resource_types(id) on delete restrict

## rounds

Detailed sparring rounds of a session (UI in sprint 3).

| Column | Type | Null | PK | Default | Description |
|---|---|---|---|---|---|
| created_at | text | no |  |  | ISO-8601 UTC creation time |
| deleted_at | text | yes |  |  | ISO-8601 UTC soft-delete time, null while live; reads filter deleted_at IS NULL |
| duration_minutes | integer | yes |  |  | Round length in minutes, > 0; null when not given |
| id | text | no | yes |  | UUID v4, generated on device by the repository (expo-crypto randomUUID) |
| note | text | yes |  |  | Free-text note |
| outcome | text | yes |  |  | 'DOMINANT', 'EVEN' or 'DOMINATED'; null when not given |
| partner_belt | text | yes |  |  | Partner belt: one of WHITE BLUE PURPLE BROWN BLACK GREY_WHITE GREY GREY_BLACK YELLOW_WHITE YELLOW YELLOW_BLACK ORANGE_WHITE ORANGE ORANGE_BLACK GREEN_WHITE GREEN GREEN_BLACK; null when unknown |
| round_no | integer | no |  |  | Round number ≥ 1, unique per session among live rows |
| session_id | text | no |  |  | Owning session |
| updated_at | text | no |  |  | ISO-8601 UTC last update |

Constraints:
- CHECK `rounds_round_no_check`: `round_no >= 1`
- CHECK `rounds_duration_check`: `duration_minutes IS NULL OR duration_minutes > 0`
- CHECK `rounds_partner_belt_check`: `partner_belt IS NULL OR partner_belt IN ('WHITE', 'BLUE', 'PURPLE', 'BROWN', 'BLACK', 'GREY_WHITE', 'GREY', 'GREY_BLACK', 'YELLOW_WHITE', 'YELLOW', 'YELLOW_BLACK', 'ORANGE_WHITE', 'ORANGE', 'ORANGE_BLACK', 'GREEN_WHITE', 'GREEN', 'GREEN_BLACK')`
- CHECK `rounds_outcome_check`: `outcome IS NULL OR outcome IN ('DOMINANT', 'EVEN', 'DOMINATED')`
- FK `rounds_session_id_sessions_id_fk`: (session_id) → sessions(id) on delete restrict

## session_focuses

Focuses of a session as {kind, ref}, planned and/or actually trained, with per-focus feedback.

| Column | Type | Null | PK | Default | Description |
|---|---|---|---|---|---|
| caught_count | integer | yes |  |  | Times the user got caught in it, ≥ 0; only on actual rows |
| comment | text | yes |  |  | Free-text comment |
| created_at | text | no |  |  | ISO-8601 UTC creation time |
| deleted_at | text | yes |  |  | ISO-8601 UTC soft-delete time, null while live; reads filter deleted_at IS NULL |
| focus_kind | text | no |  |  | 'POSITION' or 'SUBJECT' |
| focus_ref_id | text | no |  |  | Id of the position or subject (polymorphic, no SQL FK, ADR 0014) |
| hit_count | integer | yes |  |  | Times the user hit it, ≥ 0; only on actual rows |
| id | text | no | yes |  | UUID v4, generated on device by the repository (expo-crypto randomUUID) |
| is_actual | integer | no |  |  | 1 = actually trained; planned rows left un-ticked stay 0 (gap signal) |
| is_planned | integer | no |  |  | 1 = part of the plan |
| needs_work | integer | no |  | false | 1 = flagged as needing work; only on actual rows |
| rating | integer | yes |  |  | Focus rating 1–5; only on actual rows |
| session_id | text | no |  |  | Owning session |
| sort_order | integer | no |  |  | Display order, ascending |
| updated_at | text | no |  |  | ISO-8601 UTC last update |

Constraints:
- CHECK `session_focuses_focus_kind_check`: `focus_kind IN ('POSITION', 'SUBJECT')`
- CHECK `session_focuses_is_planned_check`: `is_planned IN (0, 1)`
- CHECK `session_focuses_is_actual_check`: `is_actual IN (0, 1)`
- CHECK `session_focuses_needs_work_check`: `needs_work IN (0, 1)`
- CHECK `session_focuses_needs_work_actual_check`: `needs_work = 0 OR is_actual = 1`
- CHECK `session_focuses_rating_actual_check`: `rating IS NULL OR is_actual = 1`
- CHECK `session_focuses_counts_actual_check`: `(hit_count IS NULL AND caught_count IS NULL) OR is_actual = 1`
- CHECK `session_focuses_planned_or_actual_check`: `is_planned = 1 OR is_actual = 1`
- CHECK `session_focuses_rating_check`: `rating IS NULL OR rating BETWEEN 1 AND 5`
- CHECK `session_focuses_hit_count_check`: `hit_count IS NULL OR hit_count >= 0`
- CHECK `session_focuses_caught_count_check`: `caught_count IS NULL OR caught_count >= 0`
- FK `session_focuses_session_id_sessions_id_fk`: (session_id) → sessions(id) on delete restrict

## session_techniques

Techniques practised in a session, optionally under one of its actual focuses.

| Column | Type | Null | PK | Default | Description |
|---|---|---|---|---|---|
| created_at | text | no |  |  | ISO-8601 UTC creation time |
| deleted_at | text | yes |  |  | ISO-8601 UTC soft-delete time, null while live; reads filter deleted_at IS NULL |
| id | text | no | yes |  | UUID v4, generated on device by the repository (expo-crypto randomUUID) |
| note | text | yes |  |  | Free-text note |
| session_focus_id | text | yes |  |  | Focus row of the same session it belongs to (must be actual); null = session-level |
| session_id | text | no |  |  | Owning session |
| technique_id | text | no |  |  | Technique practised |
| updated_at | text | no |  |  | ISO-8601 UTC last update |

Constraints:
- FK `session_techniques_session_id_sessions_id_fk`: (session_id) → sessions(id) on delete restrict
- FK `session_techniques_session_focus_id_session_focuses_id_fk`: (session_focus_id) → session_focuses(id) on delete restrict
- FK `session_techniques_technique_id_techniques_id_fk`: (technique_id) → techniques(id) on delete restrict

## session_types

Kinds of training session (Gi class, No-gi class, Open mat, …); seeded catalog, user-extensible.

| Column | Type | Null | PK | Default | Description |
|---|---|---|---|---|---|
| created_at | text | no |  |  | ISO-8601 UTC creation time |
| deleted_at | text | yes |  |  | ISO-8601 UTC soft-delete time, null while live; reads filter deleted_at IS NULL |
| id | text | no | yes |  | UUID v4, generated on device by the repository (expo-crypto randomUUID) |
| name | text | no |  |  | Display name, unique among live rows (case-insensitive) |
| origin | text | no |  |  | Provenance: 'seed' (shipped taxonomy/catalog) or 'user' (created on device) |
| sort_order | integer | no |  |  | Display order, ascending |
| source | text | yes |  |  | Seed source: 'grapplemap', 'grapple-flows' or 'curated'; null only for origin = 'user' |
| source_id | text | yes |  |  | Stable id inside the source (GrappleMap: gm:<record index>; curated: cur:<slug>; grapple-flows: their slug); null for user rows |
| source_version | text | yes |  |  | Release of the source: '2023-02-06' for GrappleMap, the vendored commit date for grapple-flows, the curated release otherwise |
| updated_at | text | no |  |  | ISO-8601 UTC last update |
| user_edited_at | text | yes |  |  | ISO-8601 UTC time the user last edited an imported field; set ⇒ re-import skips the row (user edits win, R-23) |

Constraints:
- CHECK `session_types_origin_check`: `origin IN ('seed', 'user')`
- CHECK `session_types_source_check`: `source IS NULL OR source IN ('grapplemap', 'grapple-flows', 'curated')`
- CHECK `session_types_origin_source_check`: `origin = 'user' OR source IS NOT NULL`

## sessions

Training sessions: planned, completed (logged) or skipped. Personal data.

| Column | Type | Null | PK | Default | Description |
|---|---|---|---|---|---|
| completed_at | text | yes |  |  | ISO-8601 UTC time the session was logged; required when status = COMPLETED |
| context_note | text | yes |  |  | Free-text context (partner belts, injuries, …) |
| created_at | text | no |  |  | ISO-8601 UTC creation time |
| cycle_id | text | yes |  |  | Cycle the session belongs to; null when none |
| deleted_at | text | yes |  |  | ISO-8601 UTC soft-delete time, null while live; reads filter deleted_at IS NULL |
| duration_minutes | integer | yes |  |  | Duration in minutes, > 0; null when not given |
| energy | integer | yes |  |  | Energy level 1–5; null when not given |
| id | text | no | yes |  | UUID v4, generated on device by the repository (expo-crypto randomUUID) |
| intensity | integer | yes |  |  | Perceived intensity 1–5; null when not given |
| local_date | text | no |  |  | Local calendar date YYYY-MM-DD of starts_at in the device zone at write time (ADR 0016) |
| rating | integer | yes |  |  | Overall session rating 1–5; null when not given |
| reviewed_at | text | yes |  |  | ISO-8601 UTC time of the first later edit of rating / what_worked / what_failed |
| rounds_count | integer | yes |  |  | Sparring rounds, ≥ 0; authoritative aggregate |
| session_type_id | text | no |  |  | Kind of session |
| slot_id | text | yes |  |  | Slot that generated the session; null when created by hand |
| starts_at | text | no |  |  | Start time, ISO-8601 UTC |
| status | text | no |  | 'PLANNED' | 'PLANNED' (default), 'COMPLETED' or 'SKIPPED' |
| submissions_landed | integer | yes |  |  | Submissions landed, ≥ 0; authoritative aggregate |
| submissions_taken | integer | yes |  |  | Submissions conceded, ≥ 0; authoritative aggregate |
| updated_at | text | no |  |  | ISO-8601 UTC last update |
| what_failed | text | yes |  |  | Free-text reflection: what failed |
| what_worked | text | yes |  |  | Free-text reflection: what worked |

Constraints:
- CHECK `sessions_status_check`: `status IN ('PLANNED', 'COMPLETED', 'SKIPPED')`
- CHECK `sessions_rating_check`: `rating IS NULL OR rating BETWEEN 1 AND 5`
- CHECK `sessions_intensity_check`: `intensity IS NULL OR intensity BETWEEN 1 AND 5`
- CHECK `sessions_energy_check`: `energy IS NULL OR energy BETWEEN 1 AND 5`
- CHECK `sessions_duration_check`: `duration_minutes IS NULL OR duration_minutes > 0`
- CHECK `sessions_rounds_count_check`: `rounds_count IS NULL OR rounds_count >= 0`
- CHECK `sessions_submissions_landed_check`: `submissions_landed IS NULL OR submissions_landed >= 0`
- CHECK `sessions_submissions_taken_check`: `submissions_taken IS NULL OR submissions_taken >= 0`
- CHECK `sessions_local_date_check`: `local_date GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]'`
- CHECK `sessions_completed_at_check`: `status <> 'COMPLETED' OR completed_at IS NOT NULL`
- FK `sessions_session_type_id_session_types_id_fk`: (session_type_id) → session_types(id) on delete restrict
- FK `sessions_cycle_id_cycles_id_fk`: (cycle_id) → cycles(id) on delete restrict
- FK `sessions_slot_id_slots_id_fk`: (slot_id) → slots(id) on delete restrict

## settings

User settings, one row per key (keys and defaults in domain/settings/defaults.ts).

| Column | Type | Null | PK | Default | Description |
|---|---|---|---|---|---|
| created_at | text | no |  |  | ISO-8601 UTC creation time |
| deleted_at | text | yes |  |  | ISO-8601 UTC soft-delete time, null while live; reads filter deleted_at IS NULL |
| id | text | no | yes |  | UUID v4, generated on device by the repository (expo-crypto randomUUID) |
| key | text | no |  |  | Setting key, unique among live rows |
| updated_at | text | no |  |  | ISO-8601 UTC last update |
| value | text | no |  |  | JSON-encoded value |
| value_type | text | no |  |  | 'BOOL', 'INT', 'STRING' or 'JSON' |

Constraints:
- CHECK `settings_value_type_check`: `value_type IN ('BOOL', 'INT', 'STRING', 'JSON')`

## slots

Weekly recurring training slots that generate PLANNED sessions (UI in sprint 3).

| Column | Type | Null | PK | Default | Description |
|---|---|---|---|---|---|
| created_at | text | no |  |  | ISO-8601 UTC creation time |
| deleted_at | text | yes |  |  | ISO-8601 UTC soft-delete time, null while live; reads filter deleted_at IS NULL |
| duration_minutes | integer | yes |  |  | Planned duration in minutes, > 0; null when unknown |
| id | text | no | yes |  | UUID v4, generated on device by the repository (expo-crypto randomUUID) |
| paused_at | text | yes |  |  | ISO-8601 UTC time the slot was paused; null while active |
| session_type_id | text | no |  |  | Session type of generated sessions |
| start_time | text | no |  |  | Local start time HH:MM (00:00–23:59) |
| updated_at | text | no |  |  | ISO-8601 UTC last update |
| use_cycle_focuses | integer | no |  | true | 1 = generated sessions take the active cycle focuses; 0 = none |
| weekday | integer | no |  |  | ISO weekday 1 (Monday) – 7 (Sunday) |

Constraints:
- CHECK `slots_weekday_check`: `weekday BETWEEN 1 AND 7`
- CHECK `slots_start_time_check`: `start_time GLOB '[01][0-9]:[0-5][0-9]' OR start_time GLOB '2[0-3]:[0-5][0-9]'`
- CHECK `slots_duration_check`: `duration_minutes IS NULL OR duration_minutes > 0`
- CHECK `slots_use_cycle_focuses_check`: `use_cycle_focuses IN (0, 1)`
- FK `slots_session_type_id_session_types_id_fk`: (session_type_id) → session_types(id) on delete restrict

## subjects

Non-positional training subjects (e.g. Grip fighting, Guard retention); a session focus of kind SUBJECT refers here.

| Column | Type | Null | PK | Default | Description |
|---|---|---|---|---|---|
| created_at | text | no |  |  | ISO-8601 UTC creation time |
| deleted_at | text | yes |  |  | ISO-8601 UTC soft-delete time, null while live; reads filter deleted_at IS NULL |
| description | text | yes |  |  | Short explanation; null when none |
| id | text | no | yes |  | UUID v4, generated on device by the repository (expo-crypto randomUUID) |
| name | text | no |  |  | Display name, unique among live rows (case-insensitive) |
| origin | text | no |  |  | Provenance: 'seed' (shipped taxonomy/catalog) or 'user' (created on device) |
| source | text | yes |  |  | Seed source: 'grapplemap', 'grapple-flows' or 'curated'; null only for origin = 'user' |
| source_id | text | yes |  |  | Stable id inside the source (GrappleMap: gm:<record index>; curated: cur:<slug>; grapple-flows: their slug); null for user rows |
| source_version | text | yes |  |  | Release of the source: '2023-02-06' for GrappleMap, the vendored commit date for grapple-flows, the curated release otherwise |
| updated_at | text | no |  |  | ISO-8601 UTC last update |
| user_edited_at | text | yes |  |  | ISO-8601 UTC time the user last edited an imported field; set ⇒ re-import skips the row (user edits win, R-23) |

Constraints:
- CHECK `subjects_origin_check`: `origin IN ('seed', 'user')`
- CHECK `subjects_source_check`: `source IS NULL OR source IN ('grapplemap', 'grapple-flows', 'curated')`
- CHECK `subjects_origin_source_check`: `origin = 'user' OR source IS NOT NULL`

## submissions

Submissions landed or conceded, per session or per round.

| Column | Type | Null | PK | Default | Description |
|---|---|---|---|---|---|
| created_at | text | no |  |  | ISO-8601 UTC creation time |
| deleted_at | text | yes |  |  | ISO-8601 UTC soft-delete time, null while live; reads filter deleted_at IS NULL |
| direction | text | no |  |  | 'LANDED' or 'TAKEN' |
| id | text | no | yes |  | UUID v4, generated on device by the repository (expo-crypto randomUUID) |
| note | text | yes |  |  | Free-text note |
| round_id | text | yes |  |  | Round of the same session; null = logged at session level (R-06) |
| session_id | text | no |  |  | Owning session |
| technique_id | text | yes |  |  | Submission technique; null when not given |
| updated_at | text | no |  |  | ISO-8601 UTC last update |

Constraints:
- CHECK `submissions_direction_check`: `direction IN ('LANDED', 'TAKEN')`
- FK `submissions_session_id_sessions_id_fk`: (session_id) → sessions(id) on delete restrict
- FK `submissions_round_id_rounds_id_fk`: (round_id) → rounds(id) on delete restrict
- FK `submissions_technique_id_techniques_id_fk`: (technique_id) → techniques(id) on delete restrict

## taxonomy_merges

Undo log of taxonomy merges (UI in sprint 2).

| Column | Type | Null | PK | Default | Description |
|---|---|---|---|---|---|
| created_at | text | no |  |  | ISO-8601 UTC creation time |
| deleted_at | text | yes |  |  | ISO-8601 UTC soft-delete time, null while live; reads filter deleted_at IS NULL |
| from_id | text | no |  |  | Merged (losing) row id |
| id | text | no | yes |  | UUID v4, generated on device by the repository (expo-crypto randomUUID) |
| into_id | text | no |  |  | Surviving row id; never from_id |
| payload | text | no |  |  | JSON: moved row ids and prior values, enough to undo |
| target_kind | text | no |  |  | 'POSITION', 'SUBJECT' or 'TECHNIQUE' |
| undone_at | text | yes |  |  | ISO-8601 UTC time the merge was undone; null while in effect |
| updated_at | text | no |  |  | ISO-8601 UTC last update |

Constraints:
- CHECK `taxonomy_merges_target_kind_check`: `target_kind IN ('POSITION', 'SUBJECT', 'TECHNIQUE')`
- CHECK `taxonomy_merges_not_self_check`: `from_id <> into_id`

## techniques

Techniques: typed edges between positions; a SUBMISSION has no target position.

| Column | Type | Null | PK | Default | Description |
|---|---|---|---|---|---|
| applies_to | text | no |  | 'BOTH' | 'GI', 'NOGI' or 'BOTH' (default) |
| created_at | text | no |  |  | ISO-8601 UTC creation time |
| deleted_at | text | yes |  |  | ISO-8601 UTC soft-delete time, null while live; reads filter deleted_at IS NULL |
| description | text | yes |  |  | Imported or curated description; null when none |
| from_position_id | text | no |  |  | Position the technique starts from |
| id | text | no | yes |  | UUID v4, generated on device by the repository (expo-crypto randomUUID) |
| name | text | no |  |  | Display name |
| notes | text | yes |  |  | User notes; never touched by a re-import |
| origin | text | no |  |  | Provenance: 'seed' (shipped taxonomy/catalog) or 'user' (created on device) |
| perspective | text | yes |  |  | Who performs it: 'TOP' or 'BOTTOM' (GrappleMap properties); null when unknown |
| slug | text | no |  |  | URL-safe kebab-case name, unique among live rows |
| source | text | yes |  |  | Seed source: 'grapplemap', 'grapple-flows' or 'curated'; null only for origin = 'user' |
| source_id | text | yes |  |  | Stable id inside the source (GrappleMap: gm:<record index>; curated: cur:<slug>; grapple-flows: their slug); null for user rows |
| source_version | text | yes |  |  | Release of the source: '2023-02-06' for GrappleMap, the vendored commit date for grapple-flows, the curated release otherwise |
| tier | text | no |  |  | 'CORE' or 'EXTENDED', as positions.tier |
| to_position_id | text | yes |  |  | Position it ends in; null if and only if type = SUBMISSION |
| type | text | no |  |  | 'TRANSITION', 'GUARD_PASS', 'SWEEP', 'ESCAPE', 'TAKEDOWN' or 'SUBMISSION' |
| updated_at | text | no |  |  | ISO-8601 UTC last update |
| user_edited_at | text | yes |  |  | ISO-8601 UTC time the user last edited an imported field; set ⇒ re-import skips the row (user edits win, R-23) |

Constraints:
- CHECK `techniques_origin_check`: `origin IN ('seed', 'user')`
- CHECK `techniques_source_check`: `source IS NULL OR source IN ('grapplemap', 'grapple-flows', 'curated')`
- CHECK `techniques_origin_source_check`: `origin = 'user' OR source IS NOT NULL`
- CHECK `techniques_type_check`: `type IN ('TRANSITION', 'GUARD_PASS', 'SWEEP', 'ESCAPE', 'TAKEDOWN', 'SUBMISSION')`
- CHECK `techniques_submission_target_check`: `(type = 'SUBMISSION') = (to_position_id IS NULL)`
- CHECK `techniques_applies_to_check`: `applies_to IN ('GI', 'NOGI', 'BOTH')`
- CHECK `techniques_perspective_check`: `perspective IS NULL OR perspective IN ('TOP', 'BOTTOM')`
- CHECK `techniques_tier_check`: `tier IN ('CORE', 'EXTENDED')`
- FK `techniques_from_position_id_positions_id_fk`: (from_position_id) → positions(id) on delete restrict
- FK `techniques_to_position_id_positions_id_fk`: (to_position_id) → positions(id) on delete restrict

