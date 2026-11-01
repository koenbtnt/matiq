import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { seam } from './_columns';

/** Key/value app metadata. Keys: schema_version, taxonomy_release, catalog_release, db_key_created_at. */
export const appMeta = sqliteTable('app_meta', {
  ...seam(),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
});

export type AppMeta = typeof appMeta.$inferSelect;
export type NewAppMeta = typeof appMeta.$inferInsert;
