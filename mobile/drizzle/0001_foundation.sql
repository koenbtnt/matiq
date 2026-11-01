CREATE TABLE `session_types` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	`origin` text NOT NULL,
	`source` text,
	`source_id` text,
	`source_version` text,
	`user_edited_at` text,
	`name` text NOT NULL,
	`sort_order` integer NOT NULL,
	CONSTRAINT "session_types_origin_check" CHECK(origin IN ('seed', 'user')),
	CONSTRAINT "session_types_source_check" CHECK(source IS NULL OR source IN ('grapplemap', 'grapple-flows', 'curated')),
	CONSTRAINT "session_types_origin_source_check" CHECK(origin = 'user' OR source IS NOT NULL)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_types_source_uq` ON `session_types` (`source`,`source_id`) WHERE deleted_at IS NULL AND source_id IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `session_types_name_live_uq` ON `session_types` (lower(name)) WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE TABLE `positions` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	`origin` text NOT NULL,
	`source` text,
	`source_id` text,
	`source_version` text,
	`user_edited_at` text,
	`slug` text NOT NULL,
	`canonical_name` text NOT NULL,
	`description` text,
	`notes` text,
	`parent_position_id` text,
	`tier` text NOT NULL,
	FOREIGN KEY (`parent_position_id`) REFERENCES `positions`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "positions_origin_check" CHECK(origin IN ('seed', 'user')),
	CONSTRAINT "positions_source_check" CHECK(source IS NULL OR source IN ('grapplemap', 'grapple-flows', 'curated')),
	CONSTRAINT "positions_origin_source_check" CHECK(origin = 'user' OR source IS NOT NULL),
	CONSTRAINT "positions_tier_check" CHECK(tier IN ('CORE', 'EXTENDED')),
	CONSTRAINT "positions_parent_not_self_check" CHECK(parent_position_id IS NULL OR parent_position_id <> id)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `positions_source_uq` ON `positions` (`source`,`source_id`) WHERE deleted_at IS NULL AND source_id IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `positions_slug_live_uq` ON `positions` (`slug`) WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX `positions_parent_idx` ON `positions` (`parent_position_id`);--> statement-breakpoint
CREATE TABLE `techniques` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	`origin` text NOT NULL,
	`source` text,
	`source_id` text,
	`source_version` text,
	`user_edited_at` text,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`from_position_id` text NOT NULL,
	`to_position_id` text,
	`applies_to` text DEFAULT 'BOTH' NOT NULL,
	`perspective` text,
	`description` text,
	`notes` text,
	`tier` text NOT NULL,
	FOREIGN KEY (`from_position_id`) REFERENCES `positions`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`to_position_id`) REFERENCES `positions`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "techniques_origin_check" CHECK(origin IN ('seed', 'user')),
	CONSTRAINT "techniques_source_check" CHECK(source IS NULL OR source IN ('grapplemap', 'grapple-flows', 'curated')),
	CONSTRAINT "techniques_origin_source_check" CHECK(origin = 'user' OR source IS NOT NULL),
	CONSTRAINT "techniques_type_check" CHECK(type IN ('TRANSITION', 'GUARD_PASS', 'SWEEP', 'ESCAPE', 'TAKEDOWN', 'SUBMISSION')),
	CONSTRAINT "techniques_submission_target_check" CHECK((type = 'SUBMISSION') = (to_position_id IS NULL)),
	CONSTRAINT "techniques_applies_to_check" CHECK(applies_to IN ('GI', 'NOGI', 'BOTH')),
	CONSTRAINT "techniques_perspective_check" CHECK(perspective IS NULL OR perspective IN ('TOP', 'BOTTOM')),
	CONSTRAINT "techniques_tier_check" CHECK(tier IN ('CORE', 'EXTENDED'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `techniques_source_uq` ON `techniques` (`source`,`source_id`) WHERE deleted_at IS NULL AND source_id IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `techniques_slug_live_uq` ON `techniques` (`slug`) WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX `techniques_from_idx` ON `techniques` (`from_position_id`);--> statement-breakpoint
CREATE INDEX `techniques_to_idx` ON `techniques` (`to_position_id`);--> statement-breakpoint
CREATE TABLE `aliases` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	`origin` text NOT NULL,
	`source` text,
	`source_id` text,
	`source_version` text,
	`user_edited_at` text,
	`target_kind` text NOT NULL,
	`target_id` text NOT NULL,
	`name` text NOT NULL,
	CONSTRAINT "aliases_origin_check" CHECK(origin IN ('seed', 'user')),
	CONSTRAINT "aliases_source_check" CHECK(source IS NULL OR source IN ('grapplemap', 'grapple-flows', 'curated')),
	CONSTRAINT "aliases_origin_source_check" CHECK(origin = 'user' OR source IS NOT NULL),
	CONSTRAINT "aliases_target_kind_check" CHECK(target_kind IN ('POSITION', 'TECHNIQUE'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `aliases_source_uq` ON `aliases` (`source`,`source_id`) WHERE deleted_at IS NULL AND source_id IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `aliases_target_name_live_uq` ON `aliases` (`target_kind`,`target_id`,lower(name)) WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX `aliases_target_idx` ON `aliases` (`target_kind`,`target_id`);--> statement-breakpoint
CREATE INDEX `aliases_name_idx` ON `aliases` (lower(name));--> statement-breakpoint
CREATE TABLE `subjects` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	`origin` text NOT NULL,
	`source` text,
	`source_id` text,
	`source_version` text,
	`user_edited_at` text,
	`name` text NOT NULL,
	`description` text,
	CONSTRAINT "subjects_origin_check" CHECK(origin IN ('seed', 'user')),
	CONSTRAINT "subjects_source_check" CHECK(source IS NULL OR source IN ('grapplemap', 'grapple-flows', 'curated')),
	CONSTRAINT "subjects_origin_source_check" CHECK(origin = 'user' OR source IS NOT NULL)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `subjects_source_uq` ON `subjects` (`source`,`source_id`) WHERE deleted_at IS NULL AND source_id IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `subjects_name_live_uq` ON `subjects` (lower(name)) WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE TABLE `cycles` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	`name` text,
	`starts_on` text NOT NULL,
	`ends_on` text NOT NULL,
	`note` text,
	CONSTRAINT "cycles_starts_on_check" CHECK(starts_on GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]'),
	CONSTRAINT "cycles_ends_on_check" CHECK(ends_on GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]'),
	CONSTRAINT "cycles_dates_order_check" CHECK(ends_on > starts_on)
);
--> statement-breakpoint
CREATE TABLE `cycle_focuses` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	`cycle_id` text NOT NULL,
	`focus_kind` text NOT NULL,
	`focus_ref_id` text NOT NULL,
	`sort_order` integer NOT NULL,
	FOREIGN KEY (`cycle_id`) REFERENCES `cycles`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "cycle_focuses_focus_kind_check" CHECK(focus_kind IN ('POSITION', 'SUBJECT'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `cycle_focuses_ref_live_uq` ON `cycle_focuses` (`cycle_id`,`focus_kind`,`focus_ref_id`) WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX `cycle_focuses_ref_idx` ON `cycle_focuses` (`focus_kind`,`focus_ref_id`);--> statement-breakpoint
CREATE TABLE `slots` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	`weekday` integer NOT NULL,
	`start_time` text NOT NULL,
	`duration_minutes` integer,
	`session_type_id` text NOT NULL,
	`use_cycle_focuses` integer DEFAULT true NOT NULL,
	`paused_at` text,
	FOREIGN KEY (`session_type_id`) REFERENCES `session_types`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "slots_weekday_check" CHECK(weekday BETWEEN 1 AND 7),
	CONSTRAINT "slots_start_time_check" CHECK(start_time GLOB '[01][0-9]:[0-5][0-9]' OR start_time GLOB '2[0-3]:[0-5][0-9]'),
	CONSTRAINT "slots_duration_check" CHECK(duration_minutes IS NULL OR duration_minutes > 0),
	CONSTRAINT "slots_use_cycle_focuses_check" CHECK(use_cycle_focuses IN (0, 1))
);
--> statement-breakpoint
CREATE INDEX `slots_session_type_idx` ON `slots` (`session_type_id`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	`session_type_id` text NOT NULL,
	`status` text DEFAULT 'PLANNED' NOT NULL,
	`starts_at` text NOT NULL,
	`local_date` text NOT NULL,
	`duration_minutes` integer,
	`rating` integer,
	`intensity` integer,
	`energy` integer,
	`context_note` text,
	`what_worked` text,
	`what_failed` text,
	`rounds_count` integer,
	`submissions_landed` integer,
	`submissions_taken` integer,
	`cycle_id` text,
	`slot_id` text,
	`completed_at` text,
	`reviewed_at` text,
	FOREIGN KEY (`session_type_id`) REFERENCES `session_types`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`cycle_id`) REFERENCES `cycles`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`slot_id`) REFERENCES `slots`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "sessions_status_check" CHECK(status IN ('PLANNED', 'COMPLETED', 'SKIPPED')),
	CONSTRAINT "sessions_rating_check" CHECK(rating IS NULL OR rating BETWEEN 1 AND 5),
	CONSTRAINT "sessions_intensity_check" CHECK(intensity IS NULL OR intensity BETWEEN 1 AND 5),
	CONSTRAINT "sessions_energy_check" CHECK(energy IS NULL OR energy BETWEEN 1 AND 5),
	CONSTRAINT "sessions_duration_check" CHECK(duration_minutes IS NULL OR duration_minutes > 0),
	CONSTRAINT "sessions_rounds_count_check" CHECK(rounds_count IS NULL OR rounds_count >= 0),
	CONSTRAINT "sessions_submissions_landed_check" CHECK(submissions_landed IS NULL OR submissions_landed >= 0),
	CONSTRAINT "sessions_submissions_taken_check" CHECK(submissions_taken IS NULL OR submissions_taken >= 0),
	CONSTRAINT "sessions_local_date_check" CHECK(local_date GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]'),
	CONSTRAINT "sessions_completed_at_check" CHECK(status <> 'COMPLETED' OR completed_at IS NOT NULL)
);
--> statement-breakpoint
CREATE INDEX `sessions_status_starts_idx` ON `sessions` (`status`,`starts_at`);--> statement-breakpoint
CREATE INDEX `sessions_local_date_idx` ON `sessions` (`local_date`);--> statement-breakpoint
CREATE INDEX `sessions_session_type_idx` ON `sessions` (`session_type_id`);--> statement-breakpoint
CREATE INDEX `sessions_cycle_idx` ON `sessions` (`cycle_id`);--> statement-breakpoint
CREATE INDEX `sessions_slot_idx` ON `sessions` (`slot_id`);--> statement-breakpoint
CREATE TABLE `session_focuses` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	`session_id` text NOT NULL,
	`focus_kind` text NOT NULL,
	`focus_ref_id` text NOT NULL,
	`is_planned` integer NOT NULL,
	`is_actual` integer NOT NULL,
	`needs_work` integer DEFAULT false NOT NULL,
	`rating` integer,
	`comment` text,
	`hit_count` integer,
	`caught_count` integer,
	`sort_order` integer NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "session_focuses_focus_kind_check" CHECK(focus_kind IN ('POSITION', 'SUBJECT')),
	CONSTRAINT "session_focuses_is_planned_check" CHECK(is_planned IN (0, 1)),
	CONSTRAINT "session_focuses_is_actual_check" CHECK(is_actual IN (0, 1)),
	CONSTRAINT "session_focuses_needs_work_check" CHECK(needs_work IN (0, 1)),
	CONSTRAINT "session_focuses_needs_work_actual_check" CHECK(needs_work = 0 OR is_actual = 1),
	CONSTRAINT "session_focuses_rating_actual_check" CHECK(rating IS NULL OR is_actual = 1),
	CONSTRAINT "session_focuses_counts_actual_check" CHECK((hit_count IS NULL AND caught_count IS NULL) OR is_actual = 1),
	CONSTRAINT "session_focuses_planned_or_actual_check" CHECK(is_planned = 1 OR is_actual = 1),
	CONSTRAINT "session_focuses_rating_check" CHECK(rating IS NULL OR rating BETWEEN 1 AND 5),
	CONSTRAINT "session_focuses_hit_count_check" CHECK(hit_count IS NULL OR hit_count >= 0),
	CONSTRAINT "session_focuses_caught_count_check" CHECK(caught_count IS NULL OR caught_count >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_focuses_ref_live_uq` ON `session_focuses` (`session_id`,`focus_kind`,`focus_ref_id`) WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX `session_focuses_ref_idx` ON `session_focuses` (`focus_kind`,`focus_ref_id`);--> statement-breakpoint
CREATE TABLE `session_techniques` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	`session_id` text NOT NULL,
	`session_focus_id` text,
	`technique_id` text NOT NULL,
	`note` text,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`session_focus_id`) REFERENCES `session_focuses`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`technique_id`) REFERENCES `techniques`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_techniques_focus_live_uq` ON `session_techniques` (`session_id`,`session_focus_id`,`technique_id`) WHERE deleted_at IS NULL AND session_focus_id IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `session_techniques_session_live_uq` ON `session_techniques` (`session_id`,`technique_id`) WHERE deleted_at IS NULL AND session_focus_id IS NULL;--> statement-breakpoint
CREATE INDEX `session_techniques_technique_idx` ON `session_techniques` (`technique_id`);--> statement-breakpoint
CREATE INDEX `session_techniques_focus_idx` ON `session_techniques` (`session_focus_id`);--> statement-breakpoint
CREATE TABLE `rounds` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	`session_id` text NOT NULL,
	`round_no` integer NOT NULL,
	`partner_belt` text,
	`outcome` text,
	`duration_minutes` integer,
	`note` text,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "rounds_round_no_check" CHECK(round_no >= 1),
	CONSTRAINT "rounds_duration_check" CHECK(duration_minutes IS NULL OR duration_minutes > 0),
	CONSTRAINT "rounds_partner_belt_check" CHECK(partner_belt IS NULL OR partner_belt IN ('WHITE', 'BLUE', 'PURPLE', 'BROWN', 'BLACK', 'GREY_WHITE', 'GREY', 'GREY_BLACK', 'YELLOW_WHITE', 'YELLOW', 'YELLOW_BLACK', 'ORANGE_WHITE', 'ORANGE', 'ORANGE_BLACK', 'GREEN_WHITE', 'GREEN', 'GREEN_BLACK')),
	CONSTRAINT "rounds_outcome_check" CHECK(outcome IS NULL OR outcome IN ('DOMINANT', 'EVEN', 'DOMINATED'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `rounds_session_round_live_uq` ON `rounds` (`session_id`,`round_no`) WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX `rounds_session_idx` ON `rounds` (`session_id`);--> statement-breakpoint
CREATE TABLE `submissions` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	`session_id` text NOT NULL,
	`round_id` text,
	`direction` text NOT NULL,
	`technique_id` text,
	`note` text,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`round_id`) REFERENCES `rounds`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`technique_id`) REFERENCES `techniques`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "submissions_direction_check" CHECK(direction IN ('LANDED', 'TAKEN'))
);
--> statement-breakpoint
CREATE INDEX `submissions_session_idx` ON `submissions` (`session_id`);--> statement-breakpoint
CREATE INDEX `submissions_round_idx` ON `submissions` (`round_id`);--> statement-breakpoint
CREATE INDEX `submissions_technique_idx` ON `submissions` (`technique_id`);--> statement-breakpoint
CREATE TABLE `rank_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	`scale` text NOT NULL,
	`belt` text NOT NULL,
	`stripes` integer DEFAULT 0 NOT NULL,
	`awarded_on` text NOT NULL,
	`note` text,
	CONSTRAINT "rank_entries_scale_check" CHECK(scale IN ('ADULT', 'KIDS')),
	CONSTRAINT "rank_entries_belt_check" CHECK(belt IN ('WHITE', 'BLUE', 'PURPLE', 'BROWN', 'BLACK', 'GREY_WHITE', 'GREY', 'GREY_BLACK', 'YELLOW_WHITE', 'YELLOW', 'YELLOW_BLACK', 'ORANGE_WHITE', 'ORANGE', 'ORANGE_BLACK', 'GREEN_WHITE', 'GREEN', 'GREEN_BLACK')),
	CONSTRAINT "rank_entries_stripes_check" CHECK(stripes BETWEEN 0 AND 6),
	CONSTRAINT "rank_entries_awarded_on_check" CHECK(awarded_on GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]')
);
--> statement-breakpoint
CREATE INDEX `rank_entries_awarded_idx` ON `rank_entries` (`awarded_on`);--> statement-breakpoint
CREATE TABLE `resource_types` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	`origin` text NOT NULL,
	`source` text,
	`source_id` text,
	`source_version` text,
	`user_edited_at` text,
	`name` text NOT NULL,
	`sort_order` integer NOT NULL,
	CONSTRAINT "resource_types_origin_check" CHECK(origin IN ('seed', 'user')),
	CONSTRAINT "resource_types_source_check" CHECK(source IS NULL OR source IN ('grapplemap', 'grapple-flows', 'curated')),
	CONSTRAINT "resource_types_origin_source_check" CHECK(origin = 'user' OR source IS NOT NULL)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `resource_types_source_uq` ON `resource_types` (`source`,`source_id`) WHERE deleted_at IS NULL AND source_id IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `resource_types_name_live_uq` ON `resource_types` (lower(name)) WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE TABLE `resources` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	`origin` text NOT NULL,
	`source` text,
	`source_id` text,
	`source_version` text,
	`user_edited_at` text,
	`title` text NOT NULL,
	`url` text,
	`author` text,
	`resource_type_id` text NOT NULL,
	`notes` text,
	`status` text DEFAULT 'TO_WATCH' NOT NULL,
	FOREIGN KEY (`resource_type_id`) REFERENCES `resource_types`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "resources_origin_check" CHECK(origin IN ('seed', 'user')),
	CONSTRAINT "resources_source_check" CHECK(source IS NULL OR source IN ('grapplemap', 'grapple-flows', 'curated')),
	CONSTRAINT "resources_origin_source_check" CHECK(origin = 'user' OR source IS NOT NULL),
	CONSTRAINT "resources_status_check" CHECK(status IN ('TO_WATCH', 'WATCHED'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `resources_source_uq` ON `resources` (`source`,`source_id`) WHERE deleted_at IS NULL AND source_id IS NOT NULL;--> statement-breakpoint
CREATE INDEX `resources_type_idx` ON `resources` (`resource_type_id`);--> statement-breakpoint
CREATE TABLE `resource_links` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	`resource_id` text NOT NULL,
	`target_kind` text NOT NULL,
	`target_id` text NOT NULL,
	FOREIGN KEY (`resource_id`) REFERENCES `resources`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "resource_links_target_kind_check" CHECK(target_kind IN ('TECHNIQUE', 'POSITION', 'SUBJECT', 'CYCLE'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `resource_links_live_uq` ON `resource_links` (`resource_id`,`target_kind`,`target_id`) WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX `resource_links_target_idx` ON `resource_links` (`target_kind`,`target_id`);--> statement-breakpoint
CREATE TABLE `settings` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	`key` text NOT NULL,
	`value` text NOT NULL,
	`value_type` text NOT NULL,
	CONSTRAINT "settings_value_type_check" CHECK(value_type IN ('BOOL', 'INT', 'STRING', 'JSON'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `settings_key_live_uq` ON `settings` (`key`) WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE TABLE `algorithm_params` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	`algorithm_version` text NOT NULL,
	`key` text NOT NULL,
	`value` real NOT NULL,
	`default_value` real NOT NULL,
	`min` real NOT NULL,
	`max` real NOT NULL,
	CONSTRAINT "algorithm_params_value_range_check" CHECK(min <= value AND value <= max),
	CONSTRAINT "algorithm_params_default_range_check" CHECK(min <= default_value AND default_value <= max)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `algorithm_params_version_key_live_uq` ON `algorithm_params` (`algorithm_version`,`key`) WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE TABLE `taxonomy_merges` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	`target_kind` text NOT NULL,
	`from_id` text NOT NULL,
	`into_id` text NOT NULL,
	`payload` text NOT NULL,
	`undone_at` text,
	CONSTRAINT "taxonomy_merges_target_kind_check" CHECK(target_kind IN ('POSITION', 'SUBJECT', 'TECHNIQUE')),
	CONSTRAINT "taxonomy_merges_not_self_check" CHECK(from_id <> into_id)
);
