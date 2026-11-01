/**
 * @jest-environment node
 */
import { setEnv } from '../../db/testing/env';
import { eq } from 'drizzle-orm';

import type { Db } from '../../db/client';
import { settings as settingsTable } from '../../db/schema';
import { algorithmParams } from '../algorithmParams';
import { rank } from '../rank';
import { sessionTypes } from '../sessionTypes';
import { settings } from '../settings';
import { FX } from '../testing/fixtures';
import { resetRuntime, seededDb } from '../testing/helpers';

let db: Db;
beforeEach(async () => {
  restoreTz = setEnv('TZ', 'Europe/Amsterdam');
  ({ db } = await seededDb('2026-03-02T10:00:00.000Z'));
});
let restoreTz: () => void = () => undefined;
afterEach(() => restoreTz());
afterEach(resetRuntime);

describe('settings', () => {
  it('reads seeded defaults, sets typed values, rejects unknown keys and wrong types', async () => {
    expect(await settings.get('library.showExtended', db)).toEqual({ key: 'library.showExtended', value: false, valueType: 'BOOL' });
    expect(await settings.set('suggest.max', 5, db)).toEqual({ key: 'suggest.max', value: 5, valueType: 'INT' });
    expect((await settings.get('suggest.max', db)).value).toBe(5);
    await expect(settings.set('suggest.max', 'five' as never, db)).rejects.toThrow('SETTING_TYPE_MISMATCH');
    await expect(settings.get('nope' as never, db)).rejects.toThrow('SETTING_UNKNOWN');
    expect((await settings.all(db)).map((s) => s.key)).toHaveLength(14);
  });

  it('a corrupt row reads as the default', async () => {
    db.update(settingsTable).set({ value: '{oops' }).where(eq(settingsTable.key, 'suggest.max')).run();
    expect((await settings.get('suggest.max', db)).value).toBe(3);
  });
});

describe('rank', () => {
  it('adds entries; current is the latest awarded; history newest first', async () => {
    expect(await rank.current(db)).toBeUndefined();
    await rank.add({ scale: 'ADULT', belt: 'WHITE', stripes: 4, awardedOn: '2024-05-01' }, db);
    const blue = await rank.add({ scale: 'ADULT', belt: 'BLUE', stripes: 0, awardedOn: '2025-06-01', note: 'Grading' }, db);
    expect(blue).toEqual({ id: expect.any(String), scale: 'ADULT', belt: 'BLUE', stripes: 0, awardedOn: '2025-06-01', note: 'Grading' });
    expect((await rank.current(db))?.id).toBe(blue.id);
    expect((await rank.history(db)).map((r) => r.belt)).toEqual(['BLUE', 'WHITE']);
  });

  it.each<[string, object]>([
    ['RANK_BELT_INVALID_FOR_SCALE', { belt: 'GREEN' }],
    ['RANK_STRIPES_INVALID', { stripes: 5 }],
    ['RANK_DATE_INVALID', { awardedOn: '2026-03-03' }],
  ])('%s', async (code, over) => {
    await expect(rank.add({ scale: 'ADULT', belt: 'BLUE', stripes: 1, awardedOn: '2026-03-02', ...over }, db)).rejects.toThrow(code);
  });
});

describe('sessionTypes / algorithmParams', () => {
  it('lists live types in sort order and the v1 params', async () => {
    expect((await sessionTypes.list(db)).map((t) => t.id)).toEqual([FX.gi, FX.nogi, FX.openMat]);
    const params = await algorithmParams.list('v1', db);
    expect(params).toHaveLength(10);
    expect(params.find((p) => p.key === 'windowWeeks')).toMatchObject({ value: 8, defaultValue: 8, min: 2, max: 26 });
    expect(await algorithmParams.list('v2', db)).toEqual([]);
  });
});
