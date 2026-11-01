import { createTestDb, installTestRuntime, type TestDb } from '../../db/testing/testDb';
import { setRuntime } from '../runtime';
import { ensureSeeded } from '../seed';
import { catalogFixture, taxonomyFixture } from './fixtures';

/** Fresh migrated database seeded with the fixtures and a deterministic runtime. */
export async function seededDb(start = '2026-03-02T10:00:00.000Z'): Promise<TestDb & { clock: ReturnType<typeof installTestRuntime> }> {
  const t = createTestDb();
  const clock = installTestRuntime(start);
  await ensureSeeded(t.db, { now: clock.now }, { catalog: catalogFixture(), taxonomy: taxonomyFixture() });
  return { ...t, clock };
}

export const resetRuntime = () => setRuntime();
