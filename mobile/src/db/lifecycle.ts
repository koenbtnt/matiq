import { DomainError } from '../domain/errors';
import { bootstrapDatabase, closeCurrent, type BootstrapDeps } from './bootstrap';
import type { Db } from './client';
import { DB_NAME } from './open';

export interface ResetDeps {
  deleteFiles: (name: string) => void;
  bootstrap: (overrides?: Partial<BootstrapDeps>) => ReturnType<typeof bootstrapDatabase>;
  keyStore?: BootstrapDeps['keyStore'];
}

/**
 * F-25: close, delete the database files, optionally drop the key, bootstrap again. The second
 * use of the R-12 hard-delete exception (dev reset route; sprint 3 erase uses keepKey: false).
 */
export async function resetDatabase(
  { keepKey }: { keepKey: boolean },
  deps?: Partial<ResetDeps>,
): Promise<Db> {
  try {
    const native = deps?.deleteFiles && deps.keyStore ? undefined : (require('./nativeDeps') as typeof import('./nativeDeps'));
    const deleteFiles = deps?.deleteFiles ?? native!.deleteDatabaseFiles;
    const keyStore = deps?.keyStore ?? native!.nativeBootstrapDeps().keyStore;
    const bootstrap = deps?.bootstrap ?? bootstrapDatabase;

    closeCurrent();
    deleteFiles(DB_NAME);
    if (!keepKey) await keyStore.delete();
    const result = await bootstrap(deps?.keyStore ? { keyStore: deps.keyStore } : {});
    if (!result.ok) throw new DomainError('DB_RESET_FAILED', { cause: result.code });
    return result.db;
  } catch (e) {
    if (e instanceof DomainError && e.code === 'DB_RESET_FAILED') throw e;
    throw new DomainError('DB_RESET_FAILED');
  }
}
