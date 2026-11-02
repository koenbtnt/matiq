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
    expect(await rank.current({}, db)).toBeUndefined();
    await rank.add({ scale: 'ADULT', belt: 'WHITE', stripes: 4, awardedOn: '2024-05-01' }, db);
    const blue = await rank.add({ scale: 'ADULT', belt: 'BLUE', stripes: 0, awardedOn: '2025-06-01', note: 'Grading' }, db);
    expect(blue).toEqual({ id: expect.any(String), scale: 'ADULT', belt: 'BLUE', stripes: 0, awardedOn: '2025-06-01', note: 'Grading' });
    expect((await rank.current({}, db))?.id).toBe(blue.id);
    expect((await rank.history({}, db)).map((r) => r.belt)).toEqual(['BLUE', 'WHITE']);
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

describe('settings vocabularies (PS-08, plan §8.3)', () => {
  it.each<[string, unknown]>([
    ['theme.override', 'DARK'],
    ['theme.override', 'SYSTEM'],
    ['rank.scale', 'KIDS'],
    ['algorithm.version', 'v1'],
    ['suggest.max', 0],
    ['suggest.max', 10],
  ])('%s accepts %p', async (key, value) => {
    expect((await settings.set(key as never, value as never, db)).value).toBe(value);
  });

  it.each<[string, unknown]>([
    ['theme.override', 'dark'],
    ['theme.override', 'AUTO'],
    ['rank.scale', 'TEEN'],
    ['algorithm.version', 'v2'],
    ['suggest.max', 11],
    ['suggest.max', -1],
  ])('%s rejects %p with SETTING_VALUE_INVALID', async (key, value) => {
    await expect(settings.set(key as never, value as never, db)).rejects.toThrow('SETTING_VALUE_INVALID');
  });
});

describe('algorithmParams.set / resetAll (PS-07, plan §8.4)', () => {
  it('writes a valid value and returns the row', async () => {
    expect(await algorithmParams.set({ version: 'v1', key: 'wGap', value: 0.6 }, db)).toMatchObject({ key: 'wGap', value: 0.6, defaultValue: 0.2, min: 0, max: 1 });
    expect((await algorithmParams.list('v1', db)).find((p) => p.key === 'wGap')!.value).toBe(0.6);
  });

  it('PARAM_UNKNOWN for a missing key or version; PARAM_NOT_INTEGER; PARAM_OUT_OF_RANGE with min/max from the row', async () => {
    await expect(algorithmParams.set({ version: 'v1', key: 'nope', value: 1 }, db)).rejects.toMatchObject({ code: 'PARAM_UNKNOWN' });
    await expect(algorithmParams.set({ version: 'v2', key: 'wGap', value: 0.5 }, db)).rejects.toMatchObject({ code: 'PARAM_UNKNOWN' });
    await expect(algorithmParams.set({ version: 'v1', key: 'staleDays', value: 21.5 }, db)).rejects.toMatchObject({ code: 'PARAM_NOT_INTEGER' });
    await expect(algorithmParams.set({ version: 'v1', key: 'wNeedsWork', value: 1.5 }, db)).rejects.toMatchObject({
      code: 'PARAM_OUT_OF_RANGE',
      details: { key: 'wNeedsWork', min: 0, max: 1 },
    });
    await expect(algorithmParams.set({ version: 'v1', key: 'windowWeeks', value: 1 }, db)).rejects.toMatchObject({ code: 'PARAM_OUT_OF_RANGE' });
    expect((await algorithmParams.list('v1', db)).find((p) => p.key === 'wNeedsWork')!.value).toBe(0.4);
  });

  it('resetAll restores default_value for every live row of the version only', async () => {
    await algorithmParams.set({ version: 'v1', key: 'wGap', value: 0.9 }, db);
    await algorithmParams.set({ version: 'v1', key: 'windowWeeks', value: 12 }, db);
    const rows = await algorithmParams.resetAll('v1', db);
    expect(rows.every((r) => r.value === r.defaultValue)).toBe(true);
    expect(rows.map((r) => r.key)).toEqual([...rows.map((r) => r.key)].sort());
    expect(await algorithmParams.resetAll('v2', db)).toEqual([]);
  });
});

describe('rank scale filter, update, soft delete (PS-11, plan §8.2)', () => {
  const adult = { scale: 'ADULT' as const, belt: 'BLUE' as const, stripes: 1, awardedOn: '2025-01-01' };
  const kids = { scale: 'KIDS' as const, belt: 'GREY' as const, stripes: 1, awardedOn: '2025-02-01' };

  it('current/history follow rank.scale unless a scale is passed; switching hides, never deletes', async () => {
    const a = await rank.add(adult, db);
    const k = await rank.add(kids, db);
    expect((await rank.current({}, db))?.id).toBe(a.id);
    await settings.set('rank.scale', 'KIDS', db);
    expect((await rank.current({}, db))?.id).toBe(k.id);
    expect((await rank.history({}, db)).map((r) => r.id)).toEqual([k.id]);
    expect((await rank.history({ scale: 'ADULT' }, db)).map((r) => r.id)).toEqual([a.id]);
    await settings.set('rank.scale', 'ADULT', db);
    expect((await rank.current({}, db))?.id).toBe(a.id);
  });

  it('update re-validates and rewrites; RANK_NOT_FOUND for unknown or deleted ids', async () => {
    const a = await rank.add(adult, db);
    expect(await rank.update(a.id, { ...adult, stripes: 3, note: 'Seminar' }, db)).toMatchObject({ id: a.id, stripes: 3, note: 'Seminar' });
    await expect(rank.update(a.id, { ...adult, belt: 'GREEN' as never }, db)).rejects.toThrow('RANK_BELT_INVALID_FOR_SCALE');
    await expect(rank.update(a.id, { ...adult, stripes: 5 }, db)).rejects.toThrow('RANK_STRIPES_INVALID');
    await expect(rank.update('nope', adult, db)).rejects.toThrow('RANK_NOT_FOUND');
    await rank.softDelete(a.id, db);
    await expect(rank.update(a.id, adult, db)).rejects.toThrow('RANK_NOT_FOUND');
  });

  it('softDelete hides; undoDelete restores; twice / unknown → RANK_NOT_FOUND', async () => {
    const a = await rank.add(adult, db);
    expect((await rank.softDelete(a.id, db)).id).toBe(a.id);
    expect(await rank.current({}, db)).toBeUndefined();
    await expect(rank.softDelete(a.id, db)).rejects.toThrow('RANK_NOT_FOUND');
    expect(await rank.undoDelete(a.id, db)).toEqual(a);
    expect((await rank.current({}, db))?.id).toBe(a.id);
    expect(await rank.undoDelete(a.id, db)).toEqual(a);
    await expect(rank.undoDelete('nope', db)).rejects.toThrow('RANK_NOT_FOUND');
  });
});
