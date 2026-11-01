/**
 * Backup-exclusion seam (PS-17, R-39, ADR 0020). The database files must not reach iCloud/iTunes
 * backups. The native implementation lives in `mobile/modules/matiq-backup/` (frontend scope) and
 * is injected through `setBootstrapOverrides({ backupExclusion })`; `src/db` never imports it.
 */
export type BackupExclusionStatus = 'excluded' | 'failed' | 'not_applicable';

export type BackupExclusionResult = { status: BackupExclusionStatus; failed: string[] };

export interface BackupExclusion {
  /**
   * Excludes every `file://` URI (directory or file) from device backups. Must not throw; a
   * thrown error is treated as `failed` for every URI by bootstrap anyway.
   */
  exclude(uris: string[]): Promise<BackupExclusionResult>;
}

/** Default when no platform adapter is injected (Android, Jest, web). */
export const notApplicableBackupExclusion: BackupExclusion = {
  exclude: async () => ({ status: 'not_applicable', failed: [] }),
};

export type FakeBackupExclusion = BackupExclusion & { calls: string[][] };

/** Recording fake for Jest: returns `result` (default `excluded`) and records every call. */
export function fakeBackupExclusion(result: BackupExclusionResult = { status: 'excluded', failed: [] }): FakeBackupExclusion {
  const calls: string[][] = [];
  return {
    calls,
    exclude: async (uris) => {
      calls.push([...uris]);
      return { status: result.status, failed: [...result.failed] };
    },
  };
}

/** app_meta keys written after every bootstrap (and therefore after every reset). */
export const BACKUP_META_KEY = 'backup_exclusion';
export const BACKUP_CHECKED_META_KEY = 'backup_exclusion_checked_at';
