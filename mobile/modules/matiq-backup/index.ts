import { Platform } from 'react-native';

import type { BackupExclusion } from '../../src/repositories';

type NativeBackup = {
  setExcludedFromBackup(fileUri: string, excluded: boolean): boolean;
  isExcludedFromBackup(fileUri: string): boolean;
};

/** iOS only; Android disables backups in app.json (`allowBackup: false`, R-39). */
export const isAvailable = Platform.OS === 'ios';

let native: NativeBackup | undefined;
function load(): NativeBackup {
  // Lazy so Android and Jest never touch the native module.
  native ??= (require('expo') as typeof import('expo')).requireNativeModule<NativeBackup>('MatiqBackup');
  return native;
}

export const setExcludedFromBackup = (fileUri: string, excluded: boolean): boolean => load().setExcludedFromBackup(fileUri, excluded);
export const isExcludedFromBackup = (fileUri: string): boolean => load().isExcludedFromBackup(fileUri);

export const backupExclusionAdapter: BackupExclusion = {
  async exclude(uris) {
    if (!isAvailable) return { status: 'not_applicable', failed: [] };
    const failed: string[] = [];
    for (const uri of uris) {
      try {
        if (!setExcludedFromBackup(uri, true)) failed.push(uri);
      } catch {
        failed.push(uri);
      }
    }
    return { status: failed.length === 0 ? 'excluded' : 'failed', failed };
  },
};
