import { getDb, type Db } from '../db/client';
import { BACKUP_META_KEY, type BackupExclusionStatus } from '../db/backup';
import attribution from '../db/seed/attribution.json';
import { getAppMetaSync } from './appMeta';
import type { AboutData } from './contracts';
import { getSettingSync } from './settings';

const BACKUP_STATUSES: readonly BackupExclusionStatus[] = ['excluded', 'failed', 'not_applicable'];

/** Everything About shows except `appVersion`, which `useAbout` reads from expo-constants (plan §5.7). */
export type AboutMeta = Omit<AboutData, 'appVersion'>;

export function aboutSync(database: Db): AboutMeta {
  const backup = getAppMetaSync(BACKUP_META_KEY, database) as BackupExclusionStatus | undefined;
  return {
    algorithmVersion: getSettingSync('algorithm.version', database).value,
    taxonomyRelease: getAppMetaSync('taxonomy_release', database) ?? '',
    backup: backup && BACKUP_STATUSES.includes(backup) ? backup : 'not_applicable',
    attribution,
  };
}

export const about = {
  /** Algorithm version, installed taxonomy release, backup-exclusion status and the shipped attribution (PS-19). */
  async get(database: Db = getDb()): Promise<AboutMeta> {
    return aboutSync(database);
  },
};
